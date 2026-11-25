import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { hasTriageAccess, loadMessage } from './automation-utils.mjs';

/**
 * Collect the labels that the issue templates in a folder apply.
 *
 * Reads the front matter of each Markdown template and the whole file of each issue form. Skips `config.yml`.
 * Accepts a `labels` value as one label, a comma-separated string, an inline list, or a block list.
 *
 * @param dir - Path of the issue template folder
 * @returns The unique label names, in the order of first appearance
 */
export async function readTemplateLabels(dir) {
    const labels = new Set();
    for (const name of (await readdir(dir)).sort()) {
        if (name === 'config.yml' || !/\.(md|ya?ml)$/.test(name)) continue;

        let text = (await readFile(path.join(dir, name), 'utf8')).replace(/\r\n/g, '\n');
        if (name.endsWith('.md')) text = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';

        const match = text.match(/^labels:[ \t]*(.*)\n?((?:[ \t]+-.*(?:\n|$))*)/m);
        if (!match) continue;

        const inline = match[1].trim();
        const items = inline
            ? inline.replace(/^\[|\]$/g, '').split(',')
            : match[2].split('\n').map((line) => line.replace(/^\s*-\s*/, ''));
        for (const item of items) {
            const label = item.trim().replace(/^["']|["']$/g, '');
            if (label) labels.add(label);
        }
    }
    return [...labels];
}

/**
 * Close a new issue that has no label from an issue template.
 *
 * Each issue template applies a label when a user opens an issue from it. An issue without one of those labels did not come from a template.
 * Reads the template labels from `.github/ISSUE_TEMPLATE/` in the checkout. If the templates apply no labels, logs a warning and leaves the issue open.
 * Skips bots and users with triage access or more.
 *
 * @param github - Octokit client from `actions/github-script`
 * @param context - Workflow context from `actions/github-script`
 * @param core - Actions toolkit core module from `actions/github-script`
 */
export default async function checkIssueTemplate({ github, context, core }) {
    const { owner, repo } = context.repo;
    const issue = context.payload.issue;
    const author = issue.user.login;

    if (issue.user.type === 'Bot') {
        core.info(`Skip: ${author} is a bot`);
        return;
    }
    if (await hasTriageAccess(github, owner, repo, author)) {
        core.info(`Skip: ${author} has triage access`);
        return;
    }

    const templateLabels = await readTemplateLabels(
        path.join(process.env.GITHUB_WORKSPACE, '.github', 'ISSUE_TEMPLATE')
    );
    if (templateLabels.length === 0) {
        // A parsing failure must not close every new issue
        core.warning('Skip: found no labels in .github/ISSUE_TEMPLATE/');
        return;
    }

    const labels = issue.labels.map((label) => label.name);
    if (labels.some((label) => templateLabels.includes(label))) {
        core.info(`Pass: issue has a template label (${labels.join(', ')})`);
        return;
    }

    core.info(`Close: issue has none of the template labels (${templateLabels.join(', ')})`);
    const body = await loadMessage('issue-no-template');
    await github.rest.issues.createComment({ owner, repo, issue_number: issue.number, body });
    await github.rest.issues.update({
        owner,
        repo,
        issue_number: issue.number,
        state: 'closed',
        state_reason: 'not_planned'
    });
}

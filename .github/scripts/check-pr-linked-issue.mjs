import { setTimeout as sleep } from 'node:timers/promises';
import { hasTriageAccess, loadMessage } from './automation-utils.mjs';

const READY_LABEL = 'ready-for-pr';
const SKIP_LABEL = 'skip-issue-check';

// GitHub can link the issues of a new pull request a few seconds after the `opened` event
const RETRY_DELAY_MS = 10_000;

const LINKED_ISSUES_QUERY = `
    query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
                closingIssuesReferences(first: 10) {
                    nodes {
                        number
                        repository { nameWithOwner }
                        labels(first: 50) { nodes { name } }
                        assignees(first: 20) { nodes { login } }
                    }
                }
            }
        }
    }
`;

async function getLinkedIssues(github, owner, repo, number) {
    const result = await github.graphql(LINKED_ISSUES_QUERY, { owner, repo, number });
    return result.repository.pullRequest.closingIssuesReferences.nodes
        .filter((issue) => issue.repository.nameWithOwner === `${owner}/${repo}`)
        .map((issue) => ({
            number: issue.number,
            labels: issue.labels.nodes.map((label) => label.name),
            assignees: issue.assignees.nodes.map((assignee) => assignee.login)
        }));
}

/**
 * Close a pull request that does not link an approved issue open to its author.
 *
 * A pull request passes when one linked issue in this repository has the `ready-for-pr` label and either has no assignee or has the author as an assignee.
 * On a failure, posts the message for the first failed check and closes the pull request.
 * Skips bots, users with triage access or more, and pull requests with the `skip-issue-check` label.
 * If a new pull request links no issue, waits 10 seconds and asks GitHub again.
 *
 * @param github - Octokit client from `actions/github-script`
 * @param context - Workflow context from `actions/github-script`
 * @param core - Actions toolkit core module from `actions/github-script`
 */
export default async function checkPrLinkedIssue({ github, context, core }) {
    const { owner, repo } = context.repo;
    const pr = context.payload.pull_request;
    const author = pr.user.login;

    if (pr.user.type === 'Bot') {
        core.info(`Skip: ${author} is a bot`);
        return;
    }
    if (pr.labels.some((label) => label.name === SKIP_LABEL)) {
        core.info(`Skip: pull request has the ${SKIP_LABEL} label`);
        return;
    }
    if (await hasTriageAccess(github, owner, repo, author)) {
        core.info(`Skip: ${author} has triage access`);
        return;
    }

    let issues = await getLinkedIssues(github, owner, repo, pr.number);
    if (issues.length === 0 && context.payload.action === 'opened') {
        await sleep(RETRY_DELAY_MS);
        issues = await getLinkedIssues(github, owner, repo, pr.number);
    }

    const readyIssues = issues.filter((issue) => issue.labels.includes(READY_LABEL));
    const openIssue = readyIssues.find((issue) => issue.assignees.length === 0 || issue.assignees.includes(author));

    let message;
    if (issues.length === 0) {
        message = await loadMessage('pr-no-linked-issue');
    } else if (readyIssues.length === 0) {
        message = await loadMessage('pr-issue-not-ready', { issue: issues[0].number });
    } else if (!openIssue) {
        message = await loadMessage('pr-issue-assigned-to-other', { issue: readyIssues[0].number });
    } else {
        core.info(`Pass: issue #${openIssue.number} is ready and open to ${author}`);
        return;
    }

    core.info(`Close: ${message.split('\n')[0]}`);
    await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body: message });
    await github.rest.pulls.update({ owner, repo, pull_number: pr.number, state: 'closed' });
}

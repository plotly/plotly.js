import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TRIAGE_ROLES = ['admin', 'maintain', 'write', 'triage'];

/**
 * Report whether a user has triage access or more to the repository.
 *
 * Makes one GitHub API request.
 *
 * @param github - Octokit client from `actions/github-script`
 * @param owner - Owner of the repository
 * @param repo - Name of the repository
 * @param username - Login of the user to test
 * @returns `true` for the triage, write, maintain, and admin roles
 */
export async function hasTriageAccess(github, owner, repo, username) {
    try {
        const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ owner, repo, username });
        return TRIAGE_ROLES.includes(data.role_name);
    } catch (error) {
        // The API returns 404 for a user who is not a collaborator
        if (error.status === 404) return false;
        throw error;
    }
}

/**
 * Read a message from `.github/automation-messages/` and fill its placeholders.
 *
 * Reads the file from the checkout in `GITHUB_WORKSPACE`.
 *
 * @param name - File name without the `.md` extension
 * @param values - Map of placeholder name to text, for example `{ issue: 123 }`
 * @returns The message text, with each `{name}` placeholder replaced
 */
export async function loadMessage(name, values = {}) {
    const file = path.join(process.env.GITHUB_WORKSPACE, '.github', 'automation-messages', `${name}.md`);
    const text = await readFile(file, 'utf8');
    return text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

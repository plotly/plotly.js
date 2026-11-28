import { hasTriageAccess, loadMessage } from './automation-utils.mjs';

const READY_LABEL = 'ready-for-pr';
const DAY_MS = 24 * 60 * 60 * 1000;

const ISSUE_ACTIVITY_QUERY = `
    query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
            issue(number: $number) {
                timelineItems(itemTypes: [ASSIGNED_EVENT, UNASSIGNED_EVENT, LABELED_EVENT], last: 100) {
                    nodes {
                        __typename
                        ... on AssignedEvent { createdAt assignee { ... on User { login } } }
                        ... on UnassignedEvent { createdAt }
                        ... on LabeledEvent { createdAt label { name } }
                    }
                }
                closedByPullRequestsReferences(first: 50, includeClosedPrs: true) {
                    nodes { createdAt closedAt state author { login } }
                }
            }
        }
    }
`;

const latest = (times) => Math.max(0, ...times);

// A closed pull request counts from the close, so a long review does not use up the wait
const prTime = (pr) => Date.parse(pr.closedAt ?? pr.createdAt);

/**
 * Release `ready-for-pr` issues that nobody works on.
 *
 * Removes an assignee after `daysBeforeUnassign` days in which the assignee opened no linked pull request.
 * The count starts at the assignment, or at the close of the latest linked pull request from the assignee if that is later.
 * Keeps an assignee who has an open linked pull request, and every assignee with triage access or more.
 * Removes the `ready-for-pr` label after `daysBeforeUnready` days with no assignee and no open linked pull request.
 * The count starts at the latest of the label, the close of a linked pull request, and an assignee removal.
 * Posts a message for each removal. Makes one GraphQL request for each open `ready-for-pr` issue.
 *
 * @param github - Octokit client from `actions/github-script`
 * @param context - Workflow context from `actions/github-script`
 * @param core - Actions toolkit core module from `actions/github-script`
 * @param daysBeforeUnassign - Days without a pull request from an assignee before the removal of the assignee
 * @param daysBeforeUnready - Days without an assignee or a pull request before the removal of the label
 * @param dryRun - If `true`, logs each action and changes nothing
 * @param now - Current time in milliseconds since the epoch
 */
export default async function releaseStaleIssues({
    github,
    context,
    core,
    daysBeforeUnassign,
    daysBeforeUnready,
    dryRun = false,
    now = Date.now()
}) {
    const { owner, repo } = context.repo;

    const access = new Map();
    const isMaintainer = async (login) => {
        if (!access.has(login)) access.set(login, await hasTriageAccess(github, owner, repo, login));
        return access.get(login);
    };

    const act = async (description, action) => {
        core.info(`${dryRun ? 'Dry run: ' : ''}${description}`);
        if (!dryRun) await action();
    };

    const issues = await github.paginate(github.rest.issues.listForRepo, {
        owner,
        repo,
        state: 'open',
        labels: READY_LABEL,
        per_page: 100
    });
    for (const issue of issues) {
        // The issues API also lists pull requests
        if (issue.pull_request) continue;

        const { repository } = await github.graphql(ISSUE_ACTIVITY_QUERY, { owner, repo, number: issue.number });
        const events = repository.issue.timelineItems.nodes;
        const prs = repository.issue.closedByPullRequestsReferences.nodes;

        let unassignTime = latest(
            events.filter((event) => event.__typename === 'UnassignedEvent').map((event) => Date.parse(event.createdAt))
        );

        const remaining = [];
        for (const { login } of issue.assignees) {
            const ownPrs = prs.filter((pr) => pr.author?.login === login);
            if (ownPrs.some((pr) => pr.state === 'OPEN') || (await isMaintainer(login))) {
                remaining.push(login);
                continue;
            }
            const since = latest([
                ...events
                    .filter((event) => event.__typename === 'AssignedEvent' && event.assignee?.login === login)
                    .map((event) => Date.parse(event.createdAt)),
                ...ownPrs.map(prTime)
            ]);
            if (now - since < daysBeforeUnassign * DAY_MS) {
                remaining.push(login);
                continue;
            }
            const body = await loadMessage('issue-unassigned', { user: login, days: daysBeforeUnassign });
            await act(`#${issue.number}: remove the assignee ${login} and post the message`, async () => {
                await github.rest.issues.removeAssignees({
                    owner,
                    repo,
                    issue_number: issue.number,
                    assignees: [login]
                });
                await github.rest.issues.createComment({ owner, repo, issue_number: issue.number, body });
            });
            unassignTime = now;
        }

        if (remaining.length > 0 || prs.some((pr) => pr.state === 'OPEN')) continue;

        const since = latest([
            ...events
                .filter((event) => event.__typename === 'LabeledEvent' && event.label?.name === READY_LABEL)
                .map((event) => Date.parse(event.createdAt)),
            ...prs.map(prTime),
            unassignTime
        ]);
        if (now - since < daysBeforeUnready * DAY_MS) continue;

        const body = await loadMessage('issue-ready-removed', { days: daysBeforeUnready });
        await act(`#${issue.number}: remove the ${READY_LABEL} label and post the message`, async () => {
            await github.rest.issues.removeLabel({ owner, repo, issue_number: issue.number, name: READY_LABEL });
            await github.rest.issues.createComment({ owner, repo, issue_number: issue.number, body });
        });
    }
}

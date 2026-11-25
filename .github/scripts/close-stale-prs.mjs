import { hasTriageAccess, loadMessage } from './automation-utils.mjs';

const STALE_LABEL = 'stale';
const DAY_MS = 24 * 60 * 60 * 1000;

// An approval leaves the next step with the maintainers, so only these review states wait on the author
const FEEDBACK_STATES = ['CHANGES_REQUESTED', 'COMMENTED'];

const REACTIONS = 'reactions(last: 20) { nodes { createdAt user { login } } }';

const PR_ACTIVITY_QUERY = `
    query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
                ${REACTIONS}
                comments(last: 100) {
                    nodes { createdAt author { login } ${REACTIONS} }
                }
                reviews(last: 50) {
                    nodes {
                        state
                        submittedAt
                        author { login }
                        ${REACTIONS}
                        comments(last: 30) {
                            nodes { ${REACTIONS} }
                        }
                    }
                }
                timelineItems(itemTypes: [LABELED_EVENT], last: 50) {
                    nodes { ... on LabeledEvent { createdAt label { name } } }
                }
            }
        }
    }
`;

const latest = (times) => Math.max(0, ...times);

function reactionTimes(reactions, login) {
    return reactions.nodes
        .filter((reaction) => reaction.user?.login === login)
        .map((reaction) => Date.parse(reaction.createdAt));
}

/**
 * Find the latest comment, review, or reaction from the author of a pull request.
 *
 * @param data - Pull request data from `PR_ACTIVITY_QUERY`
 * @param author - Login of the pull request author
 * @returns The time in milliseconds since the epoch, or 0 when the author did not respond
 */
function latestAuthorResponse(data, author) {
    const times = [...reactionTimes(data.reactions, author)];
    for (const comment of data.comments.nodes) {
        if (comment.author?.login === author) times.push(Date.parse(comment.createdAt));
        times.push(...reactionTimes(comment.reactions, author));
    }
    for (const review of data.reviews.nodes) {
        if (review.author?.login === author && review.submittedAt) times.push(Date.parse(review.submittedAt));
        times.push(...reactionTimes(review.reactions, author));
        for (const comment of review.comments.nodes) times.push(...reactionTimes(comment.reactions, author));
    }
    return latest(times);
}

/**
 * Mark and close pull requests that wait on the author after a maintainer review.
 *
 * A pull request waits on the author when a user with triage access or more submitted a review that requests changes or leaves comments, and the author did not respond after that review.
 * A response is a comment, a review, or a reaction from the author anywhere on the pull request.
 * After `daysBeforeStale` days of waiting, adds the `stale` label and posts the warning message.
 * After `daysBeforeClose` more days, posts the closing message and closes the pull request.
 * Removes the `stale` label when the author responds or a maintainer submits a new review.
 * Skips bots and authors with triage access or more. Makes one GraphQL request for each open pull request.
 *
 * @param github - Octokit client from `actions/github-script`
 * @param context - Workflow context from `actions/github-script`
 * @param core - Actions toolkit core module from `actions/github-script`
 * @param daysBeforeStale - Days without a response before the warning
 * @param daysBeforeClose - Days after the warning before the close
 * @param dryRun - If `true`, logs each action and changes nothing
 * @param now - Current time in milliseconds since the epoch
 */
export default async function closeStalePrs({
    github,
    context,
    core,
    daysBeforeStale,
    daysBeforeClose,
    dryRun = false,
    now = Date.now()
}) {
    const { owner, repo } = context.repo;

    const access = new Map();
    const isMaintainer = async (login) => {
        if (!login) return false;
        if (!access.has(login)) access.set(login, await hasTriageAccess(github, owner, repo, login));
        return access.get(login);
    };

    const act = async (description, action) => {
        core.info(`${dryRun ? 'Dry run: ' : ''}${description}`);
        if (!dryRun) await action();
    };

    const prs = await github.paginate(github.rest.pulls.list, { owner, repo, state: 'open', per_page: 100 });
    for (const pr of prs) {
        const author = pr.user.login;
        if (pr.user.type === 'Bot' || (await isMaintainer(author))) continue;

        const { repository } = await github.graphql(PR_ACTIVITY_QUERY, { owner, repo, number: pr.number });
        const data = repository.pullRequest;

        const reviewTimes = [];
        for (const review of data.reviews.nodes) {
            const reviewer = review.author?.login;
            if (!review.submittedAt || !FEEDBACK_STATES.includes(review.state) || reviewer === author) continue;
            if (await isMaintainer(reviewer)) reviewTimes.push(Date.parse(review.submittedAt));
        }
        const reviewTime = latest(reviewTimes);
        const waiting = reviewTime > latestAuthorResponse(data, author);

        const hasStaleLabel = pr.labels.some((label) => label.name === STALE_LABEL);
        const staleTime = latest(
            data.timelineItems.nodes
                .filter((event) => event.label?.name === STALE_LABEL)
                .map((event) => Date.parse(event.createdAt))
        );

        if (hasStaleLabel && (!waiting || reviewTime > staleTime)) {
            await act(`#${pr.number}: remove the ${STALE_LABEL} label`, () =>
                github.rest.issues.removeLabel({ owner, repo, issue_number: pr.number, name: STALE_LABEL })
            );
            continue;
        }
        if (!waiting) continue;

        if (!hasStaleLabel) {
            if (now - reviewTime < daysBeforeStale * DAY_MS) continue;
            const body = await loadMessage('pr-stale-warning', { days: daysBeforeClose });
            await act(`#${pr.number}: add the ${STALE_LABEL} label and post the warning`, async () => {
                await github.rest.issues.addLabels({ owner, repo, issue_number: pr.number, labels: [STALE_LABEL] });
                await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body });
            });
            continue;
        }

        if (now - staleTime < daysBeforeClose * DAY_MS) continue;
        const body = await loadMessage('pr-stale-close');
        await act(`#${pr.number}: post the closing message and close`, async () => {
            await github.rest.issues.createComment({ owner, repo, issue_number: pr.number, body });
            await github.rest.pulls.update({ owner, repo, pull_number: pr.number, state: 'closed' });
        });
    }
}

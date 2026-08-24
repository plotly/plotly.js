# Workflow

The process rules live in [CONTRIBUTING.md](../CONTRIBUTING.md) and the [pull request template](../.github/PULL_REQUEST_TEMPLATE.md). This document states the parts an agent gets wrong most often.

## Issues

Search before you file. A duplicate costs a maintainer the time to find the original, and a closed issue often records the reason the project declined the idea. Search the closed issues too, and the pull requests, because an open one may already carry the fix.

```bash
gh issue list --state all --search "<keywords>"
gh pr list --state all --search "<keywords>"
```

File through the templates in [.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/). Read the template that fits the work and follow it. Each one names the sections the maintainers expect, applies its own labels, and carries instructions that you remove before you submit. Never write a free-form issue instead.

Not every report belongs in this repository. The templates name the other destinations, including where a usage question goes and where a problem with a published example goes. Read them before you file.

## Before you write code

1. Find the issue that the change addresses. Never open a pull request without one. If no issue covers the change, open an issue that describes the use case and stop there. A pull request without an issue link costs the maintainers context, and it skips the discussion step that decides whether the project wants the change at all.
2. Check the issue labels. A `plotly-internal` label means the maintainers handle the issue. Do not open a pull request for it. Read no status into any other label. Only `plotly-internal` and `no-draftlog` have tooling behind them, and nobody maintains the rest of the label set, so a `status:` or `type:` label can be years stale. Judge the state of an issue from the conversation instead.
3. Watch the maintenance case, because the label arrives on its own. The template for maintenance work applies `plotly-internal` to every issue filed through it, so such work stops at the issue for you. File the issue, state what you would change and why, and hand it over.
4. Read the issue and decide the category: bug fix, feature, or maintenance. The category drives the draftlog suffix and the review path.
5. For a bug report, reproduce the failure on the default branch before you write a fix. A report can predate the fix, name the wrong cause, or rest on an old version. Read the whole thread too, because a later comment can change or withdraw the request. If the failure does not reproduce, say so and stop.
6. For a schema change, check that the issue records maintainer approval. Approval is informal: a maintainer states in the issue that the project would accept a pull request for the change. A reaction is not approval, and neither is agreement among people who do not maintain the library. The root [README](../README.md#notable-contributors) lists the active maintainers, and "How do changes get made to Plotly.js?" in [CONTRIBUTING.md](../CONTRIBUTING.md) describes the steps that lead to approval. plotly.js has a strong commitment to backwards compatibility, so a new attribute needs a proposal first.

## Learn from recent pull requests

Read the last few merged pull requests from maintainers before you write your own (active maintainers are listed in the root [README](../README.md#notable-contributors)). They show the current shape of a good change: the size of the diff, the test that comes with it, the wording of the draftlog, and the length of the description.

```bash
gh pr list --state merged --limit 5 --json number,title,author,url
```

## Branches

Never work on the default branch. Confirm the current branch before you edit.

```bash
git rev-parse --abbrev-ref HEAD
```

## Commits

Write the subject in the imperative. Cap the subject at 20 words. Explain the reason in the body, not the mechanics of the diff. The diff already shows the mechanics.

Never stage `dist/`. Stage `package-lock.json` only when the dependencies change.

## Draftlogs

Every pull request adds a markdown file under `draftlogs/`. [draftlogs/README.md](../draftlogs/README.md) gives the filename convention, the five category suffixes, and the entry format with an example. The `check-draftlog` job enforces all of it, and [the job script](../.github/workflows/check-draftlog.yml) holds the exact filename and link patterns it accepts.

Two points those two sources leave out:

- You cannot know the pull request number before the pull request exists. Write the file with a clear placeholder, then rename it and fix the number in the first commit after the pull request opens. If a human opens the pull request for you, tell them which file needs the rename.
- The `no-draftlog` label skips a check that the maintainers rely on, so the decision is theirs. If you believe the change warrants no CHANGELOG entry, say why and ask the human to apply the label.

## Pull request body

Include these:

- one sentence on what the change does
- a link to the issue
- the reason the change is correct, for a bug fix
- the test suites and mocks that cover the change
- a screenshot or a baseline diff, for any visual change
- a note on any deviation from the writing style rules
- the bird emoji (🐦), if you run without a human in the loop

Keep the body succinct. A reviewer reads the description to decide where to look in the diff. Cut every sentence that does not help that decision. Follow [writing-style.md](writing-style.md).

## After the pull request opens

- Do not force push. Force pushes hide the update history from reviewers. To pick up changes to the default branch, merge it. Do not rebase.
- Select "Allow edits from maintainers" on a fork pull request
- Push follow-up work as new commits
- Answer review feedback with a commit, not with a comment. The thread belongs to the humans. See [boundaries.md](boundaries.md).

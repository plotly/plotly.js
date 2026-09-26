# Agent guide for plotly.js

Read this file first. It states the rules that apply to every task in this repository. The `.agents/` folder holds the detail.

This guide is for coding agents. Human contributors must read [CONTRIBUTING.md](CONTRIBUTING.md) and the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) instead.

## The short version

1. Work from an issue. If no issue covers the change, open one and stop there. Never open a PR for an issue labeled with `plotly-internal`.
2. A human reviews the code before it reaches a pull request. If you cannot see the rendered plot, do not open a pull request for a visual change.
3. Backwards compatibility and API consistency come first. Reuse an existing attribute name or enum value before you invent one.
4. Use TypeScript (when possible) for new files. Don't create new types if similar ones already exist in the repo.
5. Use modern JavaScript syntax for new and updated code. Extend existing logic instead of adding a new helper.
6. Every pull request adds a file to `draftlogs/`, one per category of change
7. Never edit `dist/`. Regenerate `test/plot-schema.json` and the generated types with `npm run schema`.
8. Write prose in Simplified Technical English. Cap instruction sentences at 20 words.
9. Name the test suites your change affects. Let the human run the browser tests unless explicitly asked.
10. Report what you actually ran. Never state that a test passed if you did not run it.
11. Walk [.agents/pr-checklist.md](.agents/pr-checklist.md) before you hand the work back, and answer every item

## Documents

| Document | Read it when |
|---|---|
| [.agents/boundaries.md](.agents/boundaries.md) | Before any command that changes state outside the working tree. |
| [.agents/workflow.md](.agents/workflow.md) | You plan a branch, a commit, a draftlog, or a pull request body. |
| [.agents/code-style.md](.agents/code-style.md) | You edit any file under `src/`, `lib/`, `test/`, `tasks/`, or `devtools/`. |
| [.agents/architecture.md](.agents/architecture.md) | You need to find the right file, or you touch the schema. |
| [.agents/testing.md](.agents/testing.md) | You add behavior, fix a bug, or change a mock. |
| [.agents/build-and-tooling.md](.agents/build-and-tooling.md) | You need a local build, a type check, or generated output. |
| [.agents/writing-style.md](.agents/writing-style.md) | You write a comment, a draftlog, a commit message, or a PR body. |
| [.agents/pr-checklist.md](.agents/pr-checklist.md) | You believe the task is done. |

## When the rules conflict

`CONTRIBUTING.md`, `BUILDING.md`, and `draftlogs/README.md` hold the authority on process. This folder adds agent-specific rules on top of them. If a detail disagrees, follow the repository document and tell the human about the conflict.

One exception outranks that rule: where a document in `.agents/` restricts what an agent can do, the restriction wins. The repository documents address a human contributor who can look at a plot, judge a baseline diff, and answer in a review thread. `CONTRIBUTING.md` tells contributors to generate baselines locally and commit them, for example, and [.agents/testing.md](.agents/testing.md) forbids that for you. Follow the restriction and hand the step to a human.

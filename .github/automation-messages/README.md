# Automation messages

The workflows in `.github/workflows/` post these messages as comments when they close an issue or a pull request. Edit a file here to change the text. You do not need to edit the workflow.

| File | Workflow | Posted when |
|---|---|---|
| `issue-no-template.md` | `check-issue-template.yml` | An issue opens without a label from an issue template |
| `pr-no-linked-issue.md` | `check-pr-linked-issue.yml` | A pull request links no issue |
| `pr-issue-not-ready.md` | `check-pr-linked-issue.yml` | No linked issue has the `ready-for-pr` label |
| `pr-issue-assigned-to-other.md` | `check-pr-linked-issue.yml` | Every linked issue with `ready-for-pr` is assigned only to other users |
| `pr-stale-warning.md` | `close-stale-prs.yml` | The author does not respond to a maintainer review for the stale period |
| `pr-stale-close.md` | `close-stale-prs.yml` | The author does not respond for the close period after the warning |
| `issue-unassigned.md` | `close-stale-prs.yml` | An assignee opens no pull request for a `ready-for-pr` issue in the unassign period |
| `issue-ready-removed.md` | `close-stale-prs.yml` | A `ready-for-pr` issue has no assignee and no new pull request for the unready period |

## Placeholders

- `{issue}`: the workflow replaces this with the number of the linked issue
- `{user}`: the workflow replaces this with the login of the removed assignee
- `{days}`: the workflow replaces this with the number of days in the rule that the message describes

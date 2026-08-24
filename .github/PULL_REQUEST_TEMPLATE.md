Thanks for your interest in plotly.js!

### Translations:

- Please @ mention a few other speakers of this language who can help review your translations.
- If you've omitted any keys from [dist/translation_keys.txt](https://github.com/plotly/plotly.js/blob/main/dist/translation-keys.txt) - which means they will fall back on the US English text - just make a short comment about why in the PR description: the English text works fine in your language, or you would like someone else to help translating those, or whatever the reason.
- You should only update files in `lib/locales/`, not those in `dist/`

### Features, Bug fixes, and others:

Before opening a pull request, developer should:
1. make sure they are not on the `main` branch of their fork as using `main` for a pull request would make it difficult to fetch `upstream` changes.
2. fetch latest changes from `upstream/main` into your fork i.e. `origin/main` then pull `origin/main` from you local `main`.
3. then `git rebase main` their local dev branch off the latest `main` which should be sync with `upstream/main` at this time.
4. make sure to **not** `git add` the `dist/` folder (the `dist/` is updated only on version bumps).
5. make sure to commit changes to the `package-lock.json` file (if any new dependency required).
6. provide a title and write an overview of what the PR attempts to do with a link to the issue they are trying to address.
7. select the _Allow edits from maintainers_ option (see this [article](https://help.github.com/articles/allowing-changes-to-a-pull-request-branch-created-from-a-fork/) for more details).

After opening a pull request, developer:
 - should create a new small markdown log file using the PR number e.g. `1010_fix.md` or `1010_add.md` inside `draftlogs` folder as described in this [README](https://github.com/plotly/plotly.js/blob/main/draftlogs/README.md), commit it and push. A CI check enforces this; PRs that don't warrant a CHANGELOG entry can opt out by applying the `no-draftlog` label.
 - should **not** force push (i.e. `git push -f`) to remote branches associated with opened pull requests. Force pushes make it hard for maintainers to keep track of updates. Therefore, if required, please fetch `upstream/main` and "merge" with main instead of "rebase".

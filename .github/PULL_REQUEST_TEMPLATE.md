Thanks for your interest in plotly.js!

Developers are strongly encouraged to first make a PR to their own plotly.js fork and ask one of the maintainers to review the modifications there. Once the pull request is deemed satisfactory, the developer will be asked to make a pull request to the main plotly.js repo and may be asked to squash some commits before doing so.

Before opening a pull request, developer should: 

- `git rebase` their local branch off the latest `master`
- make sure to **not** `git add` the `dist/` folder (the `dist/` is updated only on verion bumps)
- write an overview of what the PR attempts to do.

Note that it is forbidden to force push (i.e. `git push -f`) to remote branches associated with opened pull requests. Force pushes make it hard for maintainers to keep track of updates. Therefore, if required, please `git merge master` into your PR branch instead of `git rebase master`.

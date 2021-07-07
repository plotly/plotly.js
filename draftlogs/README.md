## Directory of draft logs to help prepare the upcoming [CHANGELOG](https://github.com/plotly/plotly.js/blob/master/CHANGELOG.md)

Every pull request should add at least one markdown file to this directory.
The filename must start with a number, preferably the PR number, followed by one of these:
1. `_fix.md` to propose a bug fix
2. `_add.md` to propose new features
3. `_remove.md` to propose a feature removal
4. `_change.md` to propose a minor/major change
5. `_deprecate.md` to propose a feature be deprecated

If your PR falls into more than one category - for example adding a new feature and changing an existing feature - you should include each in a separate file.

### Example filename and content for PR numbered 5546 for adding a new feature
- filename: `5546_add.md`
- content:
```
 - Add `icicle` trace type [[#5546](https://github.com/plotly/plotly.js/pull/5546)]
```
which would render
 - Add `icicle` trace type [[#5546](https://github.com/plotly/plotly.js/pull/5546)]

> Please start your single-line or multiple lined message with a verb. You could basically use the PR description while providing a link to the PR similar to the above example is appreciated too.

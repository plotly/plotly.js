# Contributing to plotly.js

## Opening issues

Search for existing and closed issues. If your problem or idea is not addressed
yet, [please open a new issue](https://github.com/plotly/plotly.js/issues/new).

Bug reports must be accompanied with a reproducible example. We recommend using
[codepen](http://codepen.io/), [jsfiddle](https://jsfiddle.net/) or
[jsbin](https://jsbin.com) to share your example.

Note that GitHub issues are reserved for bug reports and feature requests only.
Implementation questions should be asked on
community.plot.ly (tagged [`plotly-js`](http://community.plot.ly/c/plotly-js)) or on Stack Overflow (tagged
[`plotly`](https://stackoverflow.com/questions/tagged/plotly)).

Comments on GitHub issues or pull requests should add content to the discussions. 
Approbation comments such as *+1* or *I would like this feature to be implemented as well* 
will be deleted by the maintainers. Please use 
[GitHub reactions](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments) 
instead.

## Making pull requests

Developers are strongly encouraged to first make a PR to their own plotly.js
fork and ask one of the maintainers to review the modifications there. Once the
pull request is deemed satisfactory, the developer will be asked to make a pull
request to the main plotly.js repo and may be asked to squash some commits
before doing so.

Developers should `git rebase` their local branch off the latest `master` before 
opening a pull request.

Note that it is forbidden to force push (i.e. `git push -f`) to remote branches
associated with opened pull requests. Force pushes make it hard for maintainers 
to keep track of updates. Therefore, if required, please
`git merge master` into your PR branch instead of `git rebase master`.


## GitHub labels

We use the following [labels](https://github.com/plotly/plotly.js/labels) to track issues and PRs:

| Label | Purpose |
|--------|---------|
| `type: bug` | bug report confirmed by a plotly team member |
| `type: feature` | planned feature additions |
| `type: performance` | performance related tasks |
| `type: maintenace` | source code cleanup resulting in no enhancement for users |
| `type: community` | issue left open for community input and pull requests |
| `type: duplicate` | *self-explanatory* |
| `type: wontfix` | *self-explanatory* |
| `status: discussion needed` | Issue or PR that required discussion among maintaners before moving forward |
| `status: in progress` | PRs that required some intial feedback but not ready to merge |
| `status: reviewable` | PRs that are completed from the author's perspective |
| `status: on hold` | PRs that are put on hold |

## Development

#### Perequisites

- git
- [node.js](https://nodejs.org/en/). We recommend using node.js 4.2.x (LTS).
  Upgrading and managing node versions can be easily done using
  [`nvm`](https://github.com/creationix/nvm) or its Windows alternatives.

#### Step 1: Clone the plotly.js repo and install its dependencies

```
git clone https://github.com/plotly/plotly.js.git
cd plotly.js
npm install
```

#### Step 2: Start the test dashboard

```
npm start
```

This command bundles up the source files with source maps using
[browserify](https://github.com/substack/node-browserify), starts a
[watchify](https://github.com/substack/watchify) file watcher (making the your
dev plotly.js bundle update every time a source file is saved) and opens up a
tab in your browser.

#### Step 3: Open up the console and start developing

A typical workflow is to make some modifications to the source, update the
test dashboard, inspect and debug the changes, then repeat. The test dashboard
comes bundled with some useful tools while developing - all bundled under the
`Tabs` object:


| Method/Property        | Description |
|------------------------|-------------|
| `Tabs.fresh([id])` | Creates a fresh graph div and returns it (default id of `graph`). |
| `Tabs.getGraph([id])` | Returns the default or specified graph div. |
| `Tabs.plotMock(mock, [id])` | Plots the specified mock (`.json` extension is not required). |
| `Tabs.snapshot([id])` | Creates a png snapshot of the plot and places it below. |
| `Tabs.reload()` | Reloads the plotly.js script and will execute `Tabs.onReload` once completed. |
| `Tabs.onReload()` | By default, set to `noop` but you may set `Tabs.onReload` to any function you wish. This is useful for replotting a mock or test every time you reload the plotly.js script. |
| `Tabs.purge()` | Destroys all plots. |

View [the source](https://github.com/plotly/plotly.js/blob/master/devtools/test_dashboard/devtools.js) for more info.

Three additional helpers exist that are refreshed every second:

* `gd` - this is the default plot div
* `fullData` - shortcut to `gd._fullData`
* `fullLayout` - shortcut to `gd._fullLayout`

There is also a search bar in the top right of the dashboard. This fuzzy-searches
image mocks based on their file name and trace type.

#### Other npm scripts

- `npm run preprocess`: pre-processes the css and svg source file in js. This
  script must be run manually when updating the css and svg source files.
- `npm run watch`: starts a watchify file watcher just like the test dashboard but
  without booting up a server.

## Testing

Both jasmine and image tests are run on
[CircleCI](https://circleci.com/gh/plotly/plotly.js) on every push to this
repo.

Jasmine tests are run in a browser using
[karma](https://github.com/karma-runner/karma). To run them locally:

```
npm run test-jasmine
```

To run a specific suite, use:

```
npm run test-jasmine -- tests/<suite>.js
```

where the `<suite>` corresponds to the suite's file name as found in [`test/jasmine/tests/`](https://github.com/plotly/plotly.js/tree/master/test/jasmine/tests).


Image pixel comparison tests are run in a docker container. For more
information on how to run them locally, please refer to [image test
README](https://github.com/plotly/plotly.js/blob/master/test/image/README.md).

Running the test locally outputs the generated png images in `build/test_images/` and the png diffs in `build/test_images_diff/` (two git-ignored directories).

To view the image pixel comparison test results, run

```
npm run start-image_viewer
```
which shows the baseline image, the generated image, the diff and the json mocks of test cases that failed.

To view the results of a run on CircleCI, download the `build/test_images/` and `build/test_images_diff/` artifacts into your local repo and then run `npm run start-image_viewer`.


## Repo organization

- Distributed files are in `dist/`
- CommonJS require-able modules are in `lib/`
- Sources files are in `src/`, including the index
- Build and repo management scripts are in `tasks/`
- All tasks can be run using [`npm run-script`](https://docs.npmjs.com/cli/run-script)
- Tests are `test/`, they are partitioned into `image` and `jasmine` tests
- Test dashboard and image viewer code is in `devtools/`
- Non-distributed, built files are in `build/` (most files in here are git-ignored, the css and font built files are exceptions)


## Coding style

Check if ok, with `npm run lint`

- See [eslintrc](https://github.com/plotly/plotly.js/blob/master/.eslintrc) and
  the eslint [list of rules](http://eslint.org/docs/rules/) for more details.
- Rules listed in the eslintrc file with the ignore flag `0` are the recommended
  rules for new code added.

# Contributing to plotly.js

### Opening issues

Search for existing and closed issues. If your problem or idea is not addressed
yet, [please open a new issue](https://github.com/plotly/plotly.js/issues/new).

Bug reports must be accompanied with a reproducible example. We recommend using
[codepen](http://codepen.io/), [jsfiddle](https://jsfiddle.net/) or
[jsbin](https://jsbin.com) to share your example.

Note that GitHub issues are reserved for bug reports and feature requests only.
Implementation questions should be asked on Stack Overflow (tagged
[`plotly`](https://stackoverflow.com/questions/tagged/plotly)) or on
community.plot.ly (tagged [`plotly-js`](http://community.plot.ly/c/plotly-js)).

### Development

**Prerequisites**:

- git
- [node.js](https://nodejs.org/en/). We recommend using node.js 4.2.1 (LTS).
  Upgrading and managing node versions can be easily done using
  [`nvm`](https://github.com/creationix/nvm) or its Windows alternatives.

**Step 1** Clone the plotly.js repo and install its dependencies

```
git clone https://github.com/plotly/plotly.js.git
cd plotly.js
npm install
```

**Step 2** Start the test dashboard

```
npm run start-test_dashboard
```

This command bundles up the source files with source maps using
[browserify](https://github.com/substack/node-browserify), starts a
[watchify](https://github.com/substack/watchify) file watcher (making the your
dev plotly.js bundle update every time a source file is saved) and opens up a
tab in your browser.

**Step 3** Open up the console and start developing

Make some modifications to the source, refresh the page and check the results
by for example pasting in the console:

```js
Plotly.plot(Tabs.fresh(), [{x:[1,2,3], y:[2,1,2]}]);
```

- `Tabs.fresh()` creates a fresh graph div and return it and
- `Tabs.getGraph()` returns the current graph div.

**Other npm scripts**:

- `npm run preprocess`: pre-processes the css and svg source file in js. This
  script is run automatically on `npm install`.
- `npm run watch`: starts a watchify file watcher just like the test dashboard but
  without booting up a server.

### Testing

Both jasmine and image tests are run on
[CircleCI](https://circleci.com/gh/plotly/plotly.js) on every push to this
repo.

Jasmine tests are run in a browser using
[karma](https://github.com/karma-runner/karma). To run them locally:

```
npm run test-jasmine
```

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


### Repo organization

- Distributed files are in `dist/`
- Sources files are in `src/`, including the index. 
- Build and repo management scripts are in `./tasks/`
- All tasks can be run using [`npm run-srcript`](https://docs.npmjs.com/cli/run-script)
- Tests are `test/`, they are partitioned into `image` and `jasmine` tests
- Test dashboard and image viewer code is in `devtools/`
- Non-distributed, git-ignored built files are in `build/` 


### Coding style

- 4-space indentation
- semi-colons are required
- trailing commas

Check if ok, with `npm run lint`

# Contributing to plotly.js

### Opening issues

Search for existing and closed issues. If your problem or idea is not addressed
yet, [please open a new issue](https://github.com/plotly/plotly.js/issues/new).

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

This command bundles up the source files with source maps, starts
a [watchify](https://github.com/substack/watchify) file watcher (making the your
dev plotly.js bundle update every time a source file is saved) and opens up
a tab in your browser.

**Step 3** Open up the console and start developing

Make some modifications to the source, refresh the page and check the results
by for example pasting in the console:

```js
Plotly.plot(Tabs.fresh(), [{x:[1,2,3], y:[2,1,2]}]);
```

**Other npm scripts**:

- `npm run preprocess`: pre-processes the css and svg source file in js. This
  script is run automatically on `npm install`.
- `npm run watch`: starts a watchify file watcher just like the test dashboard but
  without booting up a server.
- `npm run lint`: runs jshint on all source files

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


### Repo organization

### Coding style

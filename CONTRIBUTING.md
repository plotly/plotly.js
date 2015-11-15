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

**Step 2** Build plotly.js

```
npm run build
```

The build script combines:

- `npm run preprocess`, which converts `scss` and `svg` assets to `js` and
- `npm run bundle`, which runs
  [browserify](https://github.com/substack/node-browserify) on the source files

**Step 3** Start test dashboard

```
npm run start-test_dashboard
```

This command bundles up the source files with source maps, starts
[watchify](https://github.com/substack/watchify) file watcher (making the your
dev plotly.js bundle update every time a source file is saved) and opens up
a tab in your browser.

### Testing

```
npm test
```

Jasmine tests are run in a browser using
[karma](https://github.com/karma-runner/karma)

```
npm run test-jasmine
```

Image pixel comparison tests are run in a docker container

```
npm run test-image
```

### Repo organization

### Coding style

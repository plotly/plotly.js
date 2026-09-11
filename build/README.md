## Directory of generated build files

Most of what lands here is scratch output that git and npm both ignore. The dev server and the image tests read their bundles from here.

There are exceptions for the files listed below. These files are used in the build process, but need to be generated prior to that.

- `plotcss.js`: The stylesheet compiled from `src/css/style.scss`. `src/core.js` requires it, so it must resolve.
- `maplibre_worker.js`: The maplibre-gl web worker, bundled into one standalone script and exported as a string. `src/plots/map/map.js` requires it and turns the string into a blob URL.

These files are committed and shipped in the npm package. Anyone who installs plotly.js and bundles it from `lib/` or `src/` resolves all of these, so leaving any out of the package breaks that build. These are specifically allowlisted in `.gitignore` and `.npmignore` for that reason.

`npm run preprocess` regenerates these files. Run that command and commit the result whenever the input changes.

- For `maplibre_worker.js` this means every time `maplibre-gl` gets upgraded. A stale worker ships against a newer core, so CI runs `npm run maplibre-worker-diff-check` to catch that.
- For `plotcss.js` this means every time a stylesheet under `src/css/` changes, including the partials that `style.scss` pulls in with `@use`. The same command also writes `dist/plotly.css`, which strict-CSP applications load instead of the inlined styles.

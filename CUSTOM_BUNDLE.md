# Custom bundle
You can simply make custom bundles yourself, if none of the [distributed packages](https://github.com/plotly/plotly.js/blob/master/dist/README.md) meet your needs, or you want to make a more optimized bundle file with/without specific traces.

Make sure you have the versions of node/npm that's recommended:
- plotly.js before 2.5: Node 12/npm 6
- plotly.js from 2.5: Node 16/npm 8
- plotly.js from 2.35: Node 18/npm 10

To download a specific node version look [here](https://nodejs.org/en/download/package-manager).

Note: For CI, it's faster to do `git clone --depth 1` to only get one commit.

Clone plotly.js, where the <version> is one of [these](https://github.com/plotly/plotly.js/tags):
```sh
git clone --branch <version> https://github.com/plotly/plotly.js.git
```

Note: If you've already cloned plotly.js, then could switch to another version with:
```sh
git fetch
git checkout <version>
```

Move to plotly.js folder then install plotly.js dependencies:
```sh
cd plotly.js
npm i
```

By default all traces are included in the bundle if you simply run:
```sh
npm run custom-bundle
```

Use the `traces` option to include just the trace types you need.
```sh
npm run custom-bundle -- --traces scatter,scattergl,scatter3d
```
Please note that the `scatter` trace is currently included in all bundles and cannot be removed.
[This behaviour may change in the future](https://github.com/plotly/plotly.js/pull/5535), so we recommend that you explicitly include `scatter` anyway if you need it in your bundle.

Use the `strict` option to use strict trace types where possible.
```sh
npm run custom-bundle -- --traces scatter,scattergl --strict
```

Use the `out` option to change the bundle filename (default `custom`).
The new bundle will be created in the `dist/` directory and named `plotly-<out>.min.js` or `plotly-<out>.js` if unminified.
```sh
npm run custom-bundle -- --out myBundleName
```

Use the `unminified` option to disable compression.
```sh
npm run custom-bundle -- --unminified
```

# Example illustrating use of different options together
To create an unminified custom bundle named `myScatters` including `scatter`, `scattergl` and `scatter3d` traces:
```sh
npm run custom-bundle -- \
    --unminified \
    --out myScatters \
    --traces scatter,scattergl,scatter3d \
```
Or simply on one line:
```sh
npm run custom-bundle -- --unminified --out myScatters --traces scatter,scattergl,scatter3d
```

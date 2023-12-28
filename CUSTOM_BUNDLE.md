# Custom bundle
You can simply make custom bundles yourself, if none of the [distributed packages](https://github.com/plotly/plotly.js/blob/master/dist/README.md) meet your needs, or you want to make a more optimized bundle file with/without specific traces and transforms.

Install plotly.js, move to plotly.js folder then install plotly.js dependencies:
```sh
npm i plotly.js
cd node_modules/plotly.js
npm i
```

By default all traces and transforms are included in the bundle if you simply run:
```sh
npm run custom-bundle
```

Use the `traces` option to include just the trace types you need.
```sh
npm run custom-bundle -- --traces scatter,scattergl,scatter3d
```
Please note that the `scatter` trace is currently included in all bundles and cannot be removed.
[This behaviour may change in the future](https://github.com/plotly/plotly.js/pull/5535), so we recommend that you explicitly include `scatter` anyway if you need it in your bundle.

Use the `transforms` option to specify which should be included.
```sh
npm run custom-bundle -- --transforms sort,filter
```

Or use `transforms none` to exclude them all.
```sh
npm run custom-bundle -- --transforms none
```

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
To create an unminified custom bundle named `myScatters` including `scatter`, `scattergl` and `scatter3d` traces without any transforms:
```sh
npm run custom-bundle -- \
    --unminified \
    --out myScatters \
    --traces scatter,scattergl,scatter3d \
    --transforms none
```
Or simply on one line:
```sh
npm run custom-bundle -- --unminified --out myScatters --traces scatter,scattergl,scatter3d --transforms none
```

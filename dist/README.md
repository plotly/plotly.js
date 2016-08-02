# Using distributed files

All plotly.js dist bundles inject an object `Plotly` into the global scope.

Import plotly.js as:

```html
<script type="text/javascript" src="plotly.min.js"></script>
```

or the un-minified version as:

```html
<script type="text/javascript" src="plotly.js" charset="utf-8"></script>
```

To support IE9, put:

```html
<script>if(typeof window.Int16Array !== 'function')document.write("<scri"+"pt src='extras/typedarray.min.js'></scr"+"ipt>");</script>
```

before the plotly.js script tag.

To add MathJax, put

```html
<script type="text/javascript" src="mathjax/MathJax.js?config=TeX-AMS-MML_SVG"></script>
```

before the plotly.js script tag. You can grab the relevant MathJax files in `./dist/extras/mathjax/`.

# Bundle information

The main plotly.js bundle includes all the official (non-beta) trace modules.

It be can imported as minified javascript
- using dist file `dist/plotly.min.js`
- using CDN URL https://cdn.plot.ly/plotly-plotly-latest.min.js OR https://cdn.plot.ly/plotly-plotly-1.15.0.min.js

or as raw javascript:
- using dist file `dist/plotly.js`
- using CDN URL https://cdn.plot.ly/plotly-plotly-latest.js OR https://cdn.plot.ly/plotly-plotly-1.15.0.js
- using CommonJS with `require('plotly.js')`

If you would like to have access to the attribute meta information (including attribute descriptions as on the [schema reference page](https://plot.ly/javascript/reference/)), use dist file `dist/plotly-with-meta.js`

The main plotly.js bundle weights in at:

| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |
|-----------|---------------|----------------------|---------------------|
| 2.8 MB | 1.2 MB | 378 kB | 2.9 MB |

## Partial bundles

Starting in `v1.15.0`, plotly.js also ships with several _partial_ bundles:

- [basic](#plotlyjs-basic)
- [cartesian](#plotlyjs-cartesian)
- [geo](#plotlyjs-geo)
- [gl3d](#plotlyjs-gl3d)
- [gl2d](#plotlyjs-gl2d)
- [mapbox](#plotlyjs-mapbox)

### plotly.js basic

The `basic` partial bundle contains the `scatter`, `bar`and `pie` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-basic.js` |
| dist bundle (minified) | `dist/plotly-basic.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-basic-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-basic-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-basic-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-basic-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-basic')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 1.4 MB | 541.2 kB | 178.3 kB | 

### plotly.js cartesian

The `cartesian` partial bundle contains the `scatter`, `bar`, `box`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `pie`, `contour`and `scatterternary` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-cartesian.js` |
| dist bundle (minified) | `dist/plotly-cartesian.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-cartesian-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-cartesian-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-cartesian-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-cartesian-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-cartesian')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 1.6 MB | 610.3 kB | 199 kB | 

### plotly.js geo

The `geo` partial bundle contains the `scatter`, `scattergeo`and `choropleth` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-geo.js` |
| dist bundle (minified) | `dist/plotly-geo.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-geo-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-geo-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-geo-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-geo-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-geo')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 1.4 MB | 570.7 kB | 189.2 kB | 

### plotly.js gl3d

The `gl3d` partial bundle contains the `scatter`, `scatter3d`, `surface`and `mesh3d` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-gl3d.js` |
| dist bundle (minified) | `dist/plotly-gl3d.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-gl3d-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-gl3d-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-gl3d-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-gl3d-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-gl3d')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.3 MB | 985.3 kB | 310.3 kB | 

### plotly.js gl2d

The `gl2d` partial bundle contains the `scatter`, `scattergl`, `heatmapgl`and `contourgl` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-gl2d.js` |
| dist bundle (minified) | `dist/plotly-gl2d.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-gl2d-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-gl2d-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-gl2d-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-gl2d-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-gl2d')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2 MB | 849.3 kB | 268.9 kB | 

### plotly.js mapbox

The `mapbox` partial bundle contains the `scatter`and `scattermapbox` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-mapbox.js` |
| dist bundle (minified) | `dist/plotly-mapbox.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-mapbox-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-mapbox-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-mapbox-1.15.0.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-mapbox-1.15.0.min.js |
| CommonJS | `require('plotly.js/lib/index-mapbox')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.3 MB | 958 kB | 283.3 kB | 

----------------

_This file is auto-generated by `npm run stats`. Please do not edit this file directly._
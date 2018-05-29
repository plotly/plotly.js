# Using distributed files

All plotly.js dist bundles inject an object `Plotly` into the global scope.

Import plotly.js as:

```html
<script src="plotly.min.js"></script>
```

or the un-minified version as:

```html
<script src="plotly.js" charset="utf-8"></script>
```

### To support IE9

*Before* the plotly.js script tag, add:

```html
<script>if(typeof window.Int16Array !== 'function')document.write("<scri"+"pt src='extras/typedarray.min.js'></scr"+"ipt>");</script>
<script>document.write("<scri"+"pt src='extras/request_animation_frame.js'></scr"+"ipt>");</script>
```

### To support MathJax

*Before* the plotly.js script tag, add:

```html
<script src="mathjax/MathJax.js?config=TeX-AMS-MML_SVG"></script>
```

You can grab the relevant MathJax files in `./dist/extras/mathjax/`.

### To include localization

Plotly.js defaults to US English (en-US) and includes British English (en) in the standard bundle.
Many other localizations are available - here is an example using Swiss-German (de-CH),
see the contents of this directory for the full list.
They are also available on our CDN as https://cdn.plot.ly/plotly-locale-de-ch-latest.js OR https://cdn.plot.ly/plotly-locale-de-ch-1.38.1.js
Note that the file names are all lowercase, even though the region is uppercase when you apply a locale.

*After* the plotly.js script tag, add:

```html
<script src="plotly-locale-de-ch.js"></script>
<script>Plotly.setPlotConfig({locale: 'de-CH'})</script>
```

The first line loads and registers the locale definition with plotly.js, the second sets it as the default for all Plotly plots.
You can also include multiple locale definitions and apply them to each plot separately as a `config` parameter:

```js
Plotly.newPlot(graphDiv, data, layout, {locale: 'de-CH'})
```

# Bundle information

The main plotly.js bundle includes all the official (non-beta) trace modules.

It be can imported as minified javascript
- using dist file `dist/plotly.min.js`
- using CDN URL https://cdn.plot.ly/plotly-latest.min.js OR https://cdn.plot.ly/plotly-1.38.1.min.js

or as raw javascript:
- using dist file `dist/plotly.js`
- using CDN URL https://cdn.plot.ly/plotly-latest.js OR https://cdn.plot.ly/plotly-1.38.1.js
- using CommonJS with `require('plotly.js')`

If you would like to have access to the attribute meta information (including attribute descriptions as on the [schema reference page](https://plot.ly/javascript/reference/)), use dist file `dist/plotly-with-meta.js`

The main plotly.js bundle weights in at:

| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |
|-----------|---------------|----------------------|---------------------|
| 6.3 MB | 2.6 MB | 791.7 kB | 6.5 MB |

## Partial bundles

Starting in `v1.15.0`, plotly.js also ships with several _partial_ bundles:

- [basic](#plotlyjs-basic)
- [cartesian](#plotlyjs-cartesian)
- [geo](#plotlyjs-geo)
- [gl3d](#plotlyjs-gl3d)
- [gl2d](#plotlyjs-gl2d)
- [mapbox](#plotlyjs-mapbox)
- [finance](#plotlyjs-finance)

### plotly.js basic

The `basic` partial bundle contains the `scatter`, `bar` and `pie` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-basic.js` |
| dist bundle (minified) | `dist/plotly-basic.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-basic-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-basic-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-basic-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-basic-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-basic')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.1 MB | 749.8 kB | 244.2 kB |

### plotly.js cartesian

The `cartesian` partial bundle contains the `scatter`, `bar`, `box`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `pie`, `contour`, `scatterternary` and `violin` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-cartesian.js` |
| dist bundle (minified) | `dist/plotly-cartesian.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-cartesian-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-cartesian-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-cartesian-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-cartesian-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-cartesian')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.4 MB | 860.8 kB | 278.8 kB |

### plotly.js geo

The `geo` partial bundle contains the `scatter`, `scattergeo` and `choropleth` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-geo.js` |
| dist bundle (minified) | `dist/plotly-geo.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-geo-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-geo-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-geo-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-geo-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-geo')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.1 MB | 773.6 kB | 253.4 kB |

### plotly.js gl3d

The `gl3d` partial bundle contains the `scatter`, `scatter3d`, `surface`, `mesh3d` and `cone` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-gl3d.js` |
| dist bundle (minified) | `dist/plotly-gl3d.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-gl3d-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-gl3d-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-gl3d-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-gl3d-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-gl3d')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.1 MB | 1.2 MB | 392.8 kB |

### plotly.js gl2d

The `gl2d` partial bundle contains the `scatter`, `scattergl`, `splom`, `pointcloud`, `heatmapgl`, `contourgl` and `parcoords` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-gl2d.js` |
| dist bundle (minified) | `dist/plotly-gl2d.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-gl2d-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-gl2d-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-gl2d-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-gl2d-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-gl2d')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.1 MB | 1.3 MB | 411.5 kB |

### plotly.js mapbox

The `mapbox` partial bundle contains the `scatter` and `scattermapbox` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-mapbox.js` |
| dist bundle (minified) | `dist/plotly-mapbox.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-mapbox-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-mapbox-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-mapbox-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-mapbox-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-mapbox')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.4 MB | 1.3 MB | 396.4 kB |

### plotly.js finance

The `finance` partial bundle contains the `scatter`, `bar`, `histogram`, `pie`, `ohlc` and `candlestick` trace modules.

| Way to import | Location |
|---------------|----------|
| dist bundle | `dist/plotly-finance.js` |
| dist bundle (minified) | `dist/plotly-finance.min.js` |
| CDN URL (latest) | https://cdn.plot.ly/plotly-finance-latest.js |
| CDN URL (latest minified) | https://cdn.plot.ly/plotly-finance-latest.min.js |
| CDN URL (tagged) | https://cdn.plot.ly/plotly-finance-1.38.1.js |
| CDN URL (tagged minified) | https://cdn.plot.ly/plotly-finance-1.38.1.min.js |
| CommonJS | `require('plotly.js/lib/index-finance')` |

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.2 MB | 779.9 kB | 253.3 kB |

----------------

_This file is auto-generated by `npm run stats`. Please do not edit this file directly._
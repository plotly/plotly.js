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

### To include localization

Plotly.js defaults to US English (en-US) and includes British English (en) in the standard bundle.
Many other localizations are available - here is an example using Swiss-German (de-CH),
see the contents of this directory for the full list.
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

It be can be imported as minified javascript
- using dist file `dist/plotly.min.js`
- using CDN URL https://cdn.plot.ly/plotly-2.0.0-rc.2.min.js

or as raw javascript:
- using the `plotly.js-dist` npm package
- using dist file `dist/plotly.js`
- using CDN URL https://cdn.plot.ly/plotly-2.0.0-rc.2.js
- using CommonJS with `require('plotly.js')`

If you would like to have access to the attribute meta information (including attribute descriptions as on the [schema reference page](https://plotly.com/javascript/reference/)), use dist file `dist/plotly-with-meta.js`

The main plotly.js bundle weights in at:

| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |
|-----------|---------------|----------------------|---------------------|
| 7.9 MB | 3.3 MB | 1015.1 kB | 8.2 MB |

## Partial bundles

plotly.js also ships with several _partial_ bundles:

- [basic](#plotlyjs-basic)
- [cartesian](#plotlyjs-cartesian)
- [geo](#plotlyjs-geo)
- [gl3d](#plotlyjs-gl3d)
- [gl2d](#plotlyjs-gl2d)
- [mapbox](#plotlyjs-mapbox)
- [finance](#plotlyjs-finance)
- [strict](#plotlyjs-strict)

> Each plotly.js partial bundle has a corresponding npm package with no dependencies.

> The minified version of each partial bundle is also published to npm in a separate "dist-min" package.

> The strict partial bundle includes everything except the traces that require function constructors. Over time we hope to include more of the remaining trace types here, after which we intend to work on other strict CSP issues such as inline CSS that we may not be able to include in the main bundle.

### plotly.js basic

The `basic` partial bundle contains trace modules `bar`, `pie` and `scatter`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.7 MB | 1003.6 kB | 325.9 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-basic-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-basic-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-basic-dist-min`](https://www.npmjs.com/package/plotly.js-basic-dist-min) with
```
npm install plotly.js-basic-dist-min
```
#### npm package

Install [`plotly.js-basic-dist`](https://www.npmjs.com/package/plotly.js-basic-dist) with
```
npm install plotly.js-basic-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-basic-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-basic-dist')
```

### plotly.js cartesian

The `cartesian` partial bundle contains trace modules `bar`, `box`, `contour`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `image`, `pie`, `scatter`, `scatterternary` and `violin`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.3 MB | 1.2 MB | 397.1 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-cartesian-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-cartesian-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-cartesian-dist-min`](https://www.npmjs.com/package/plotly.js-cartesian-dist-min) with
```
npm install plotly.js-cartesian-dist-min
```
#### npm package

Install [`plotly.js-cartesian-dist`](https://www.npmjs.com/package/plotly.js-cartesian-dist) with
```
npm install plotly.js-cartesian-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-cartesian-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-cartesian-dist')
```

### plotly.js geo

The `geo` partial bundle contains trace modules `choropleth`, `scatter` and `scattergeo`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.8 MB | 1 MB | 335.7 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-geo-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-geo-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-geo-dist-min`](https://www.npmjs.com/package/plotly.js-geo-dist-min) with
```
npm install plotly.js-geo-dist-min
```
#### npm package

Install [`plotly.js-geo-dist`](https://www.npmjs.com/package/plotly.js-geo-dist) with
```
npm install plotly.js-geo-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-geo-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-geo-dist')
```

### plotly.js gl3d

The `gl3d` partial bundle contains trace modules `cone`, `isosurface`, `mesh3d`, `scatter`, `scatter3d`, `streamtube`, `surface` and `volume`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.8 MB | 1.5 MB | 481.3 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-gl3d-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-gl3d-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-gl3d-dist-min`](https://www.npmjs.com/package/plotly.js-gl3d-dist-min) with
```
npm install plotly.js-gl3d-dist-min
```
#### npm package

Install [`plotly.js-gl3d-dist`](https://www.npmjs.com/package/plotly.js-gl3d-dist) with
```
npm install plotly.js-gl3d-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-gl3d-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-gl3d-dist')
```

### plotly.js gl2d

The `gl2d` partial bundle contains trace modules `heatmapgl`, `parcoords`, `pointcloud`, `scatter`, `scattergl` and `splom`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.8 MB | 1.5 MB | 501.8 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-gl2d-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-gl2d-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-gl2d-dist-min`](https://www.npmjs.com/package/plotly.js-gl2d-dist-min) with
```
npm install plotly.js-gl2d-dist-min
```
#### npm package

Install [`plotly.js-gl2d-dist`](https://www.npmjs.com/package/plotly.js-gl2d-dist) with
```
npm install plotly.js-gl2d-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-gl2d-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-gl2d-dist')
```

### plotly.js mapbox

The `mapbox` partial bundle contains trace modules `choroplethmapbox`, `densitymapbox`, `scatter` and `scattermapbox`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 4.3 MB | 1.7 MB | 523.4 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-mapbox-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-mapbox-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-mapbox-dist-min`](https://www.npmjs.com/package/plotly.js-mapbox-dist-min) with
```
npm install plotly.js-mapbox-dist-min
```
#### npm package

Install [`plotly.js-mapbox-dist`](https://www.npmjs.com/package/plotly.js-mapbox-dist) with
```
npm install plotly.js-mapbox-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-mapbox-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-mapbox-dist')
```

### plotly.js finance

The `finance` partial bundle contains trace modules `bar`, `candlestick`, `funnel`, `funnelarea`, `histogram`, `indicator`, `ohlc`, `pie`, `scatter` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.9 MB | 1.1 MB | 352 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-finance-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-finance-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-finance-dist-min`](https://www.npmjs.com/package/plotly.js-finance-dist-min) with
```
npm install plotly.js-finance-dist-min
```
#### npm package

Install [`plotly.js-finance-dist`](https://www.npmjs.com/package/plotly.js-finance-dist) with
```
npm install plotly.js-finance-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-finance-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-finance-dist')
```

### plotly.js strict

The `strict` partial bundle contains trace modules `bar`, `barpolar`, `box`, `candlestick`, `carpet`, `choropleth`, `choroplethmapbox`, `contour`, `contourcarpet`, `densitymapbox`, `funnel`, `funnelarea`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `image`, `indicator`, `ohlc`, `parcats`, `parcoords`, `pie`, `sankey`, `scatter`, `scattercarpet`, `scattergeo`, `scattergl`, `scattermapbox`, `scatterpolar`, `scatterpolargl`, `scatterternary`, `splom`, `sunburst`, `table`, `treemap`, `violin` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 6.6 MB | 2.8 MB | 835.8 kB |

#### CDN links

| Flavor | URL |
| ------ | --- |
| Tagged | https://cdn.plot.ly/plotly-strict-2.0.0-rc.2.js |
| Tagged minified | https://cdn.plot.ly/plotly-strict-2.0.0-rc.2.min.js |


#### dist-min npm package

Install [`plotly.js-strict-dist-min`](https://www.npmjs.com/package/plotly.js-strict-dist-min) with
```
npm install plotly.js-strict-dist-min
```
#### npm package

Install [`plotly.js-strict-dist`](https://www.npmjs.com/package/plotly.js-strict-dist) with
```
npm install plotly.js-strict-dist
```

ES6 module usage:
```js
import Plotly from 'plotly.js-strict-dist'
```

CommonJS usage:
```js
var Plotly = require('plotly.js-strict-dist')
```

----------------

_This file is auto-generated by `npm run stats`. Please do not edit this file directly._
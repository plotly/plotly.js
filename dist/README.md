# Using distributed files

All plotly.js bundles inject an object `Plotly` into the global scope.

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

The main plotly.js bundle includes all trace modules.

The main plotly.js bundles weight in at:

| plotly.js | plotly.min.js | plotly.min.js + gzip | plotly-with-meta.js |
|-----------|---------------|----------------------|---------------------|
| 10.3 MB | 4.3 MB | 1.3 MB | 10.6 MB |

#### CDN links
> https://cdn.plot.ly/plotly-2.35.3.js

> https://cdn.plot.ly/plotly-2.35.3.min.js


#### npm packages
> [plotly.js](https://www.npmjs.com/package/plotly.js)

> [plotly.js-dist](https://www.npmjs.com/package/plotly.js-dist)

> [plotly.js-dist-min](https://www.npmjs.com/package/plotly.js-dist-min)

#### Meta information
> If you would like to have access to the attribute meta information (including attribute descriptions as on the [schema reference page](https://plotly.com/javascript/reference/)), use dist file `dist/plotly-with-meta.js`
---

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

> The strict bundle now includes all traces, but the regl-based traces are built differently to avoid function constructors. This results in about a 10% larger bundle size, which is why this method is not used by default. Over time we intend to use the strict bundle to work on other strict CSP issues such as inline CSS.

---

### plotly.js basic

The `basic` partial bundle contains trace modules `bar`, `pie` and `scatter`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.7 MB | 1 MB | 347.8 kB |

#### CDN links
> https://cdn.plot.ly/plotly-basic-2.35.3.js

> https://cdn.plot.ly/plotly-basic-2.35.3.min.js


#### npm packages
> [plotly.js-basic-dist](https://www.npmjs.com/package/plotly.js-basic-dist)

> [plotly.js-basic-dist-min](https://www.npmjs.com/package/plotly.js-basic-dist-min)

---

### plotly.js cartesian

The `cartesian` partial bundle contains trace modules `bar`, `box`, `contour`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `image`, `pie`, `scatter`, `scatterternary` and `violin`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.4 MB | 1.3 MB | 437.3 kB |

#### CDN links
> https://cdn.plot.ly/plotly-cartesian-2.35.3.js

> https://cdn.plot.ly/plotly-cartesian-2.35.3.min.js


#### npm packages
> [plotly.js-cartesian-dist](https://www.npmjs.com/package/plotly.js-cartesian-dist)

> [plotly.js-cartesian-dist-min](https://www.npmjs.com/package/plotly.js-cartesian-dist-min)

---

### plotly.js geo

The `geo` partial bundle contains trace modules `choropleth`, `scatter` and `scattergeo`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.1 MB | 1.1 MB | 391.3 kB |

#### CDN links
> https://cdn.plot.ly/plotly-geo-2.35.3.js

> https://cdn.plot.ly/plotly-geo-2.35.3.min.js


#### npm packages
> [plotly.js-geo-dist](https://www.npmjs.com/package/plotly.js-geo-dist)

> [plotly.js-geo-dist-min](https://www.npmjs.com/package/plotly.js-geo-dist-min)

---

### plotly.js gl3d

The `gl3d` partial bundle contains trace modules `cone`, `isosurface`, `mesh3d`, `scatter`, `scatter3d`, `streamtube`, `surface` and `volume`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.8 MB | 1.6 MB | 522 kB |

#### CDN links
> https://cdn.plot.ly/plotly-gl3d-2.35.3.js

> https://cdn.plot.ly/plotly-gl3d-2.35.3.min.js


#### npm packages
> [plotly.js-gl3d-dist](https://www.npmjs.com/package/plotly.js-gl3d-dist)

> [plotly.js-gl3d-dist-min](https://www.npmjs.com/package/plotly.js-gl3d-dist-min)

---

### plotly.js gl2d

The `gl2d` partial bundle contains trace modules `heatmapgl`, `parcoords`, `pointcloud`, `scatter`, `scattergl` and `splom`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 4.5 MB | 1.9 MB | 621.7 kB |

#### CDN links
> https://cdn.plot.ly/plotly-gl2d-2.35.3.js

> https://cdn.plot.ly/plotly-gl2d-2.35.3.min.js


#### npm packages
> [plotly.js-gl2d-dist](https://www.npmjs.com/package/plotly.js-gl2d-dist)

> [plotly.js-gl2d-dist-min](https://www.npmjs.com/package/plotly.js-gl2d-dist-min)

---

### plotly.js mapbox

The `mapbox` partial bundle contains trace modules `choroplethmapbox`, `densitymapbox`, `scatter` and `scattermapbox`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 4.3 MB | 1.8 MB | 550.1 kB |

#### CDN links
> https://cdn.plot.ly/plotly-mapbox-2.35.3.js

> https://cdn.plot.ly/plotly-mapbox-2.35.3.min.js


#### npm packages
> [plotly.js-mapbox-dist](https://www.npmjs.com/package/plotly.js-mapbox-dist)

> [plotly.js-mapbox-dist-min](https://www.npmjs.com/package/plotly.js-mapbox-dist-min)

---

### plotly.js finance

The `finance` partial bundle contains trace modules `bar`, `candlestick`, `funnel`, `funnelarea`, `histogram`, `indicator`, `ohlc`, `pie`, `scatter` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 2.9 MB | 1.1 MB | 378.2 kB |

#### CDN links
> https://cdn.plot.ly/plotly-finance-2.35.3.js

> https://cdn.plot.ly/plotly-finance-2.35.3.min.js


#### npm packages
> [plotly.js-finance-dist](https://www.npmjs.com/package/plotly.js-finance-dist)

> [plotly.js-finance-dist-min](https://www.npmjs.com/package/plotly.js-finance-dist-min)

---

### plotly.js strict

The `strict` partial bundle contains trace modules `bar`, `barpolar`, `box`, `candlestick`, `carpet`, `choropleth`, `choroplethmapbox`, `cone`, `contour`, `contourcarpet`, `densitymapbox`, `funnel`, `funnelarea`, `heatmap`, `heatmapgl`, `histogram`, `histogram2d`, `histogram2dcontour`, `icicle`, `image`, `indicator`, `isosurface`, `mesh3d`, `ohlc`, `parcats`, `parcoords`, `pie`, `pointcloud`, `sankey`, `scatter`, `scattergl`, `scatter3d`, `scattercarpet`, `scattergeo`, `scattermapbox`, `scatterpolar`, `scatterpolargl`, `scattersmith`, `scatterternary`, `splom`, `streamtube`, `sunburst`, `surface`, `table`, `treemap`, `violin`, `volume` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 10.7 MB | 4.7 MB | 1.4 MB |

#### CDN links
> https://cdn.plot.ly/plotly-strict-2.35.3.js

> https://cdn.plot.ly/plotly-strict-2.35.3.min.js


#### npm packages
> [plotly.js-strict-dist](https://www.npmjs.com/package/plotly.js-strict-dist)

> [plotly.js-strict-dist-min](https://www.npmjs.com/package/plotly.js-strict-dist-min)

---


_This file is auto-generated by `npm run stats`. Please do not edit this file directly._
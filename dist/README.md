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
| 10.1 MB | 4.82 MB | 1.48 MB | 10.5 MB |

#### CDN links
> https://cdn.plot.ly/plotly-4.1.1.js

> https://cdn.plot.ly/plotly-4.1.1.min.js


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
- [map](#plotlyjs-map)
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
| 2.94 MB | 1.19 MB | 398 kB |

#### CDN links
> https://cdn.plot.ly/plotly-basic-4.1.1.js

> https://cdn.plot.ly/plotly-basic-4.1.1.min.js


#### npm packages
> [plotly.js-basic-dist](https://www.npmjs.com/package/plotly.js-basic-dist)

> [plotly.js-basic-dist-min](https://www.npmjs.com/package/plotly.js-basic-dist-min)

---

### plotly.js cartesian

The `cartesian` partial bundle contains trace modules `bar`, `box`, `contour`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `image`, `pie`, `scatter`, `scatterternary` and `violin`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.71 MB | 1.5 MB | 500 kB |

#### CDN links
> https://cdn.plot.ly/plotly-cartesian-4.1.1.js

> https://cdn.plot.ly/plotly-cartesian-4.1.1.min.js


#### npm packages
> [plotly.js-cartesian-dist](https://www.npmjs.com/package/plotly.js-cartesian-dist)

> [plotly.js-cartesian-dist-min](https://www.npmjs.com/package/plotly.js-cartesian-dist-min)

---

### plotly.js geo

The `geo` partial bundle contains trace modules `choropleth`, `scatter` and `scattergeo`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.39 MB | 1.4 MB | 467 kB |

#### CDN links
> https://cdn.plot.ly/plotly-geo-4.1.1.js

> https://cdn.plot.ly/plotly-geo-4.1.1.min.js


#### npm packages
> [plotly.js-geo-dist](https://www.npmjs.com/package/plotly.js-geo-dist)

> [plotly.js-geo-dist-min](https://www.npmjs.com/package/plotly.js-geo-dist-min)

---

### plotly.js gl3d

The `gl3d` partial bundle contains trace modules `cone`, `isosurface`, `mesh3d`, `scatter`, `scatter3d`, `streamtube`, `surface` and `volume`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 4.44 MB | 1.75 MB | 562 kB |

#### CDN links
> https://cdn.plot.ly/plotly-gl3d-4.1.1.js

> https://cdn.plot.ly/plotly-gl3d-4.1.1.min.js


#### npm packages
> [plotly.js-gl3d-dist](https://www.npmjs.com/package/plotly.js-gl3d-dist)

> [plotly.js-gl3d-dist-min](https://www.npmjs.com/package/plotly.js-gl3d-dist-min)

---

### plotly.js gl2d

The `gl2d` partial bundle contains trace modules `parcoords`, `scatter`, `scattergl` and `splom`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.68 MB | 1.49 MB | 498 kB |

#### CDN links
> https://cdn.plot.ly/plotly-gl2d-4.1.1.js

> https://cdn.plot.ly/plotly-gl2d-4.1.1.min.js


#### npm packages
> [plotly.js-gl2d-dist](https://www.npmjs.com/package/plotly.js-gl2d-dist)

> [plotly.js-gl2d-dist-min](https://www.npmjs.com/package/plotly.js-gl2d-dist-min)

---

### plotly.js map

The `map` partial bundle contains trace modules `choroplethmap`, `densitymap`, `scatter` and `scattermap`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 5.39 MB | 2.96 MB | 887 kB |

#### CDN links
> https://cdn.plot.ly/plotly-map-4.1.1.js

> https://cdn.plot.ly/plotly-map-4.1.1.min.js


#### npm packages
> [plotly.js-map-dist](https://www.npmjs.com/package/plotly.js-map-dist)

> [plotly.js-map-dist-min](https://www.npmjs.com/package/plotly.js-map-dist-min)

---

### plotly.js finance

The `finance` partial bundle contains trace modules `bar`, `candlestick`, `funnel`, `funnelarea`, `histogram`, `indicator`, `ohlc`, `pie`, `scatter` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 3.2 MB | 1.3 MB | 432 kB |

#### CDN links
> https://cdn.plot.ly/plotly-finance-4.1.1.js

> https://cdn.plot.ly/plotly-finance-4.1.1.min.js


#### npm packages
> [plotly.js-finance-dist](https://www.npmjs.com/package/plotly.js-finance-dist)

> [plotly.js-finance-dist-min](https://www.npmjs.com/package/plotly.js-finance-dist-min)

---

### plotly.js strict

The `strict` partial bundle contains trace modules `bar`, `barpolar`, `box`, `candlestick`, `carpet`, `choropleth`, `choroplethmap`, `cone`, `contour`, `contourcarpet`, `densitymap`, `funnel`, `funnelarea`, `heatmap`, `histogram`, `histogram2d`, `histogram2dcontour`, `icicle`, `image`, `indicator`, `isosurface`, `mesh3d`, `ohlc`, `parcats`, `parcoords`, `pie`, `sankey`, `scatter`, `scattergl`, `scatter3d`, `scattercarpet`, `scattergeo`, `scattermap`, `scatterpolar`, `scatterpolargl`, `scattersmith`, `scatterternary`, `splom`, `streamtube`, `sunburst`, `surface`, `table`, `treemap`, `violin`, `volume` and `waterfall`.

#### Stats

| Raw size | Minified size | Minified + gzip size |
|------|-----------------|------------------------|
| 10.9 MB | 5.16 MB | 1.58 MB |

#### CDN links
> https://cdn.plot.ly/plotly-strict-4.1.1.js

> https://cdn.plot.ly/plotly-strict-4.1.1.min.js


#### npm packages
> [plotly.js-strict-dist](https://www.npmjs.com/package/plotly.js-strict-dist)

> [plotly.js-strict-dist-min](https://www.npmjs.com/package/plotly.js-strict-dist-min)

---


_This file is auto-generated by `npm run stats`. Please do not edit this file directly._
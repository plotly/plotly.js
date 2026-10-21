# Design: a vector tile trace for map subplots

Status: draft for review, second revision. Prototype on branch `claude/bold-brahmagupta-flz6rm`. Working trace name: `vectortilemap`.

NOTE: This folder is scratch material for the design review. Remove `scratch/` before a pull request.

## Contents

1. [Problem](#problem)
2. [Recommendation](#recommendation)
3. [What the code does today](#what-the-code-does-today)
4. [API shape](#api-shape)
5. [Coloring](#coloring)
6. [Events](#events)
7. [Shared sources](#shared-sources)
8. [Colorbar, legend, autorange](#colorbar-legend-autorange)
9. [Interaction with existing map code](#interaction-with-existing-map-code)
10. [Ecosystem integration](#ecosystem-integration)
11. [Real-world use cases: O&G demos](#real-world-use-cases-og-demos)
12. [What this does not solve](#what-this-does-not-solve)
13. [Prototype](#prototype)
14. [Measurements](#measurements)
15. [Open questions, worked through](#open-questions-worked-through)

## Problem

Dash apps that map more than a few thousand features hit three walls today:

- `choroplethmap` sends the whole GeoJSON to the browser. On 84,121 census tracts, the first draw takes 13 to 15 s here, with one main-thread freeze of 6 to 7 s.
- A `z` change runs `convert.js` and `setData()` again. MapLibre then cuts the full GeoJSON into tiles again in its worker. On tracts, that takes 12 to 17 s per change, with a main-thread freeze of 5 to 7 s.
- A hand-written `layout.map.style` with a `vector` source is fast. But it loses the colorbar, `hovertemplate`, `plotly_hover`, `plotly_click`, `plotly_selected` and the legend. Users write MapLibre expressions by hand.

The goal: give vector tile data the Plotly trace API, at about the cost of the hand-written style. The target users include teams that move from Esri or Spotfire, where server-side tiles, scale ranges and attribute renderers are normal.

## Recommendation

Add one new trace type for vector tile sources, with a `layertype` of `fill`, `line` or `circle`. Draw the tiles with ordinary MapLibre layers. Color the features in one of three ways:

- `locations` and `z` from Python, sent to the map as MapLibre feature state. A `z` change costs one `setFeatureState` call for each changed value, and fetches no tile.
- `zkey`, a numeric property in the tile, with `zmin` and `zmax` given. Best for very large layers and for values that the server owns.
- one color, which defaults to the trace color. Best for categories, with one trace for each category.

Get hover and click from `queryRenderedFeatures` at the cursor. The cost does not depend on the number of features. Get box and lasso selection from the rendered features, and send the selection polygon to the server for the full answer. Keep the colorbar, `hovertemplate`, legend and event data as the other map traces have them.

On 84k tracts, the prototype is ready in 0.7 to 1.1 s, a `z` change takes 0.3 to 0.4 s, and hover costs about 2.5 ms per mouse move. `choroplethmap` with a GeoJSON URL takes 13 to 15 s, 12 to 17 s and 18 to 20 ms on the same data. On 644k wells in 11 traces, hover costs about 1 ms per mouse move in total.

## What the code does today

These findings come from reading `src/plots/map/`, `src/traces/{choroplethmap,scattermap,densitymap}/`, `src/lib/geo_location_utils.js` and `src/components/fx/`, and from the experiments.

| Area | Finding | Consequence for a tile trace |
|---|---|---|
| Trace plot objects | Each map trace module returns an object with `update(calcTrace)` and `dispose()`. `Map.updateData` (`plots/map/map.js`) calls `update` on every `calc` or `plot` edit. | A tile trace fits the same pattern. `update` decides if the source must change. |
| Layer order | `updateData` sorts traces by `traceType2orderIndex`. A type that is not in the table sorts as `NaN`. | The new type needs an entry. The prototype uses the `choroplethmap` slot. |
| `below` | `fillBelowLookup` reads `trace.below`, or `_module.getBelow`. | The prototype reuses `choroplethmap.getBelow` (above the water layers). |
| Hover | `Fx.hover` calls `_module.hoverPoints(pointData, lon, lat)`. `xa.c2p` and `ya.c2p` give the pixel of a lon/lat. The `hovertemplate` reads `eventData[0]`, so `%{properties.X}` works when `eventData` sets `properties`. | Hover maps a pixel to a feature with `queryRenderedFeatures`, and a feature id to a data index with a `Map`. |
| Hover skip | `Fx.hover` skips a trace with `_length === 0` (`components/fx/hover.js:539`). | A trace with no data arrays must set `_length = null`, as `image` and `cone` do. |
| Click | The map `click` handler calls `Fx.click`, which reuses the last hover data. | Click works when hover works. No new code. |
| Selection | `updateFx` reports `range` or `lassoPoints` in lon/lat in every `plotly_selected` event. | The selection polygon reaches Dash. A server can query with it. |
| `choroplethmap` `z` edit | `z` has `editType: 'calc'`. The edit runs `calc`, `convert.js` (turf centroid and `polygon.tester` for each feature) and `setData()`. | On tracts the main thread freezes for 5 to 7 s, then the worker cuts 117 MB of GeoJSON into tiles again. Feature state removes all of it. |
| `choroplethmap` hover | A linear scan of `polygon.tester` objects for each mouse move. | About 20 ms per move on tracts. The 400 ms in the brief came from `scattermap` with 566k points, which projects each point. |
| Style compare | `updateMap` compares `JSON.stringify(styleObj)` on every update, not only in `map.layers`. | A large inline style dict costs a stringify on each `Plotly.react`. The tile trace keeps its sources out of the style. |
| `map.layers` compare | `needsNewSource` compares `JSON.stringify(source)` (`plots/map/layers.js`). | The tile trace compares a short string key. It never stringifies data. |
| Errors | `rejectOnError` rejects the plot promise on the first `error` event. | A tile server that cannot be reached rejected `Plotly.newPlot` with "Map error." while the other traces drew. The prototype now warns for errors of its own sources. A 404 tile is no error: MapLibre treats it as empty. |
| Programmatic hover | `Fx.hover(gd, [{curveNumber, pointNumber}])` reads `cdi.lonlat` or `cdi.x`. `Fx.hover(gd, {xval, yval}, 'map')` does not hover map subplots either. | The tile trace returns no hover for these calls. `choroplethmap` has the same gaps. |
| Camera moves | A `map.jumpTo` from code changes the view without a `plotly_relayout`. The next relayout (for example `dragmode`) moves the view back to `layout.map`. | Existing behavior. Apps must move the view through `Plotly.relayout`. |
| Feature state in MapLibre 6.11 | `TileManager.setFeatureState` stores state on the source. `initializeTileState` applies the full stored state to each tile when it loads (`tile/tile_manager.ts`, `source/source_state.ts`). | The trace does not need to apply state again on `sourcedata`, as the brief assumed. But each new tile walks all N stored ids. |
| Feature ids in MapLibre | `getNumericId` turns a numeric string into a number and hashes other strings (`data/feature_position_map.ts`). | `locations` `'001'` colors feature id 1. The prototype now uses the same rule for hover and selection. |
| `promoteId` in MapLibre | With an object `promoteId`, a source layer that the object does not list loses its native feature ids: `getId` reads `properties[undefined]` (`data/feature_index.ts:327`). | A source cannot mix promoted and native ids. See [Shared sources](#shared-sources). Worth an upstream issue. |

## API shape

### Options

1. **A new trace type.** One module with its own `calc`, `plot`, `hoverPoints` and `selectPoints`. Attribute names come from `choroplethmap`, `scattermap` and `map.layers`.
2. **A tiles mode on `choroplethmap`, `scattermap`, and a new line trace.** For example `choroplethmap.source` as an alternative to `geojson`.

### Recommendation: one new trace type with `layertype`

- The two modes share almost no code. `choroplethmap` hover, selection, `ct` event data and `selectedpoints` depend on the full geometry in the browser. A tiles mode needs a second `calc`, `plot`, `hoverPoints` and `selectPoints` behind one name.
- Half the attributes of each trace would have no effect in tiles mode: `geojson`, `scattermap.lon`/`lat`/`mode`/`fill`/`cluster`/`text` positions. The schema, plotly.py validation and the docs cannot tell the user which half applies.
- A vector tile source holds points, lines and polygons. In the demos, one tile URL fed fills, lines and circles in the same figure. One trace type keeps the source sharing, events, feature state and scale range code in one place.
- A new trace type is additive. No saved figure changes.

The cost is one more name to learn. The attribute names stay the same as `choroplethmap`, so the code a user writes for 3,000 counties changes in three lines:

```python
# today
go.Choroplethmap(geojson=counties_url, featureidkey="properties.GEOID",
                 locations=df.GEOID, z=df.rate, colorscale="Viridis",
                 hovertemplate="%{properties.NAME}: %{z}<extra></extra>")

# proposed
go.Vectortilemap(source="/tiles/tracts.json", sourcelayer="tracts", featureidkey="GEOID",
                 locations=df.GEOID, z=df.rate, colorscale="Viridis",
                 hovertemplate="%{properties.NAME}: %{z}<extra></extra>")
```

A wells layer with one trace for each status, as the demos use it:

```python
for layer, name, color in WELL_STATUS:
    fig.add_vectortilemap(name=name, source="/og/wells.json", sourcelayer=layer, layertype="circle",
                          minzoom=9, marker=dict(color=color, size=6),
                          hovertemplate="<b>%{properties.name}</b><br>%{properties.operator}<extra></extra>")
```

### Attributes

Implemented in the prototype: P. Proposed: no mark.

| Attribute | Source of the name | Notes |
|---|---|---|
| `source` P | `map.layers.source` | A TileJSON URL (string), or an array of tile URL templates. Same meaning as `map.layers` with `sourcetype: 'vector'`. Esri VectorTileServer URLs (`tile/{z}/{y}/{x}.pbf`) work as an array. |
| `sourcelayer` P | `map.layers.sourcelayer` | Required. MapLibre needs it for vector layers. |
| `sourceattribution` P | `map.layers.sourceattribution` | |
| `layertype` P | values from `map.layers.type` | `fill` (default), `line`, `circle`. Name open: question 1. |
| `featureidkey` P | `choroplethmap.featureidkey` | Default `'id'` uses the MVT feature id. Any other value becomes `promoteId`. A `properties.` prefix is stripped. No separate `promoteid` attribute. |
| `locations`, `z` P | `choroplethmap` | Sent as feature state. Ids match with the MapLibre rule (`'001'` matches 1). |
| `zkey` P | new | A numeric tile property for color. Needs `zmin` and `zmax`: without them the trace is `visible: false`, with a warning. Name open: question 1. |
| `zmin`, `zmax`, `zmid`, `zauto`, `colorscale`, `reversescale`, `showscale`, `colorbar`, `coloraxis` P | colorscale attributes | For `z` and `zkey`. |
| `marker.color` P | `scattermap` | One color for `fill` and `circle`, without `z` or `zkey`. Defaults to the trace color. |
| `marker.size` P | `scattermap` | Circle diameter in pixels. Scalar. |
| `marker.opacity` P | `choroplethmap` | All layer types. Scalar. |
| `marker.line.color`, `marker.line.width` P | `choroplethmap` | Fill outline, or circle stroke. Scalar. |
| `line.color`, `line.width` P | `scattermap` | For `line`. One color without `z` or `zkey`. |
| `minzoom`, `maxzoom` P | `map.layers` | The scale range: hexagons below zoom 9, wells at zoom 9 and above, in the Dash demo. |
| `below` P | `choroplethmap.below` | |
| `selected`, `unselected` P | `choroplethmap` | `marker.opacity` while a selection is active. |
| `text`, `hovertext`, `hoverinfo`, `hovertemplate` P | `choroplethmap` | `hovertemplate` keys include `properties`. |
| a client-side filter | none yet | See question 12. The demos split categories into server layers. |
| zoom-dependent sizes and widths | none yet | See question 13. The demos needed a different `marker.size` for each view. |
| `selectedpoints` | `choroplethmap` | Not done: a selection by data index from code. |

## Coloring

### Feature state from `locations` and `z`

- `fill-color`, `line-color` or `circle-color` is an `interpolate` expression on `['feature-state', 'z']`. `convert.ts` builds it from `Colorscale.extractScale`, so `reversescale`, `zmin`, `zmax` and `coloraxis` give the same colors as `choroplethmap`. The NYC screenshot pair shows the same colors for the two traces. `Plotly.toImage` gave rgb(253, 231, 37) for z = 4 in Viridis, the exact colorscale stop.
- A discrete colorscale repeats stops. MapLibre needs strictly ascending stops, so equal stops move up by `1e-9` of the range.
- Features with no `z` state get opacity 0, as in `choroplethmap`, which draws only the features in `locations`.
- `updateFeatureState` keeps the last `z` for each location in a `Map`. It calls `setFeatureState` only for changed values, and `removeFeatureState` for locations that left `locations`. A Dash `Patch()` of `z` arrives as `Plotly.react` with a new `z` array.
- A change to `colorscale`, `zmin` or `zmax` only changes the paint expression.
- The state stays until the source is removed: a change of `source`, `featureidkey` or `sourceattribution`, or a new `map.style`.

Cost of feature state, measured on the hexagon tiles (40,479 features) with N `locations`:

| N `locations` | ready | full `z` restyle | of that, `updateFeatureState` | longest task | JS heap |
|---|---|---|---|---|---|
| 40,479 | 0.9 s | 0.18 s | 17 ms | 131 ms | 106 MB |
| 250,000 | 1.2 s | 0.43 s | 114 ms | 261 ms | 166 MB |
| 1,000,000 | 2.7 s | 2.1 s | 569 ms | 1.2 s | 440 MB |

Recommendation: feature state is comfortable up to about 250k `locations`. Above that, color from a tile property (`zkey`), or send only the locations in the view.

### Color from a tile property (`zkey`)

The paint expression reads `['get', zkey]`. The trace needs no `locations`, and Python sends nothing for the colors. The hand-written-style baseline in the measurements uses this path: ready in 0.4 to 0.6 s on tracts, with one long task of about 80 ms.

- `zmin` and `zmax` must be given: the browser sees only the loaded tiles.
- Features with no numeric value are hidden.
- A change of the values means new tiles. The app changes the URL (for example `?v=2`), and the trace makes a new source.
- Hover reads `z` from the properties. `pointNumber` is null, and `id` identifies the feature.

The demos use `zkey` for pipeline diameter, well water depth, well vertical depth and lease year.

### One color, for categories

Without `z` or `zkey`, the trace draws `marker.color` or `line.color`, which default to the trace color. The legend shows a square, a line or a dot. A category is one trace. The demos split categories on the server into source layers (`wells_oil`, `wells_gas`, and so on), so that one tile request feeds all category traces. A client-side filter would remove that server work: question 12.

## Events

### Hover and click

- `hoverPoints` projects the hover lon/lat to a pixel and calls `queryRenderedFeatures` on the trace layer. For circles and lines it queries a box: the circle radius or half the line width, plus 3 px.
- Circles report their pixel distance, so the closest point wins across traces. Fills keep the default distance, so points and lines drawn above them win.
- With `locations`, only features in `locations` get hover. A `Map` from `calc` gives the data index.
- Event data: `id`, `location`, `z`, `properties`, `lon`, `lat`, and `pointNumber` (null without `locations`). `lon`/`lat` is the point of a circle, or the cursor on a line or a fill.
- The hover label color follows the feature color.
- Cost: about 2.5 ms per move for one trace, and about 1 ms per move for the 11 traces of the wells demo. `choroplethmap` takes 18 to 20 ms on tracts.

Limits:

- Only rendered features get hover: in the view, inside `minzoom` and `maxzoom`, and kept by the server at that zoom.
- The properties come from the tile at the current zoom. A server that sends fewer properties at low zoom (the wells server sends only `spud_year` and `depth_ft` below zoom 8) gives `hovertemplatefallback` values in the label.
- Tile coordinates are quantized: one unit of a zoom 0 tile with extent 4096 is about 0.09 degrees. `lon`/`lat` of a circle are as precise as the tile.

### Box and lasso selection

Implemented in `select.ts`:

1. Query the rendered features in the pixel bounding box of the selection.
2. Gather the pieces of each feature by id. One feature can span many tiles. A feature without an id is skipped.
3. Points: the point must be inside. Lines: one rendered vertex must be inside. Polygons: the center of the rendered extent must be inside.
4. Report `pointNumber` (or null), `id`, `location`, `z`, `properties`, `lon`, `lat`. Set `selected` feature state, and dim the others with `unselected.marker.opacity`.

This selects only what is rendered, and the Dash demo shows the consequence. At zoom 12.3, a box held 214 wells, and the browser selection had the same 214. At zoom 7.5, the wells layer was not drawn (`minzoom` 9): the browser selected 0 wells, and DuckDB found 46,571 in the same polygon. So the server must answer from `range` / `lassoPoints`, which every `plotly_selected` event carries in lon/lat. Question 5.

## Shared sources

Traces on one subplot with the same tile URLs share one MapLibre source, so the browser fetches each tile once. The wells demo draws 8 category traces from one source. A source registry with reference counts lives on the subplot.

Rules, from one pass in `fullData` order, so every trace computes the same assignment:

- MapLibre takes one `promoteId` object for a source, and drops the native ids of layers that the object does not list. So a URL gets up to two shared sources: one for traces that promote a property, one for traces that use native ids.
- A trace that sends `z` as feature state, on a source layer where an earlier trace already does, gets its own source. Feature state is per source layer.
- A trace that promotes a different property on a layer than an earlier trace gets its own source.
- Traces with `visible: 'legendonly'` count. A legend click changes the layer visibility and keeps the source: the test makes zero tile requests.

## Colorbar, legend, autorange

- Colorbar: `heatmap/colorbar` and `colorscaleCalc`, as in `choroplethmap`. Works for `z` and `zkey`, and with a shared `coloraxis` across two subplots (tested).
- Legend: on by default, as for `scattermap`. The item shows the layer type, with the colorscale gradient or the trace color. `legendgroup` and `legendgrouptitle` work.
- Map autorange (`_fitBounds`): `get_map_fit_bounds.ts` returns null when a `vectortilemap` trace is on the subplot, as for `choroplethmap`. Question 7.

## Interaction with existing map code

Tested in the prototype:

- Layer order: trace layers carry the `plotly-trace-layer-` prefix. `traceType2orderIndex` puts the trace with `choroplethmap`. Traces draw in `data` order within the type.
- `below`: a change removes and adds the layers, and keeps the source and the feature state.
- `uirevision`: in Dash, a `Patch()` of `z` kept the user's pan and zoom (zoom 12.3 before and after).
- `Plotly.react` with an identical figure: 41 ms, the same source object, zero tile requests.
- `map.style`: a style change removes all sources. The registry adds them again, and the trace sends its full feature state again.
- Two map subplots: each subplot has its own sources and feature state.
- `Plotly.toImage`: the exported PNG holds the tile layers with the exact colors.

## Ecosystem integration

| Piece | Result | Evidence |
|---|---|---|
| plotly.py | Works with no hand-written code. | `commands.py codegen` with this branch's `plot-schema.json` took 7 s and made `go.Vectortilemap`, `fig.add_vectortilemap()`, docstrings and validators. A bad `layertype` raises the usual `ValueError`. `plotly.express` functions are hand-written: a `px` function is separate work. |
| Dash `dcc.Graph` | Uses a custom bundle from `assets/`. | `dcc.Graph` loads its own plotly.js only when `window.Plotly` is missing. |
| Dash `Patch()` | Works, no tile request. | Decade slider: request 270 bytes, response 376 KB (`z` and `customdata` for 40k cells), server 2 ms. Input to idle map: 450 to 890 ms. Of that, `Plotly.react` and the redraw take 380 to 450 ms on software WebGL. |
| Dash `clickData` / `hoverData` | Works, but `properties` does not arrive. | `dcc.Graph` keeps only scalar event fields, plus `bbox`, `customdata` and `pointNumbers`. `id`, `lon`, `lat`, `z` arrive. The demo looks up the well by `id` in DuckDB (21 to 25 ms). `choroplethmap` users lose `properties` the same way today. Fix: one line in `dcc.Graph` to copy `properties`. Question 14. |
| Dash `selectedData` | Works. | Points and `range`/`lassoPoints` arrive. The polygon query in DuckDB took 130 to 190 ms. |
| Static export | Works in the browser. | `Plotly.toImage` in 0.8 s, exact colors. Kaleido and `fig.write_image` use the plotly.js bundled with plotly.py, so they need a release with the trace (not tested). |
| Jupyter `FigureWidget` | Not tested. | Uses the bundled plotly.js: needs a release. |
| DuckDB `ST_AsMVT` | Works. | Feature ids must be int32 in DuckDB 2.0: 12-digit API numbers fail. Use a row number as the id, and keep the API number as a property. |
| Esri VectorTileServer | Works as a `source` array. | Esri's World Basemap v2 tiles, layer `Bathymetry`, colored by `zkey: '_symbol'`, under BOEM data from DuckDB (screenshot `og10`). |
| PMTiles | Not possible today. | PMTiles needs `maplibregl.addProtocol`, and plotly.js does not expose MapLibre. Question 15. |
| PostGIS, Martin, pg_tileserv, tileserver-gl | Not tested. | They serve TileJSON plus MVT, the same contract as the DuckDB server. |

## Real-world use cases: O&G demos

All data is public: Kansas Geological Survey and Colorado ECMC wells, BOEM Gulf of Mexico data, EIA pipelines and plays. `og/` holds the data preparation and the tile server, `demos/` the figures, `dash/` the Dash app. The screenshots are in the review gallery.

| Demo | What it shows | What it found |
|---|---|---|
| Kansas & Colorado wells (`?d=wells`) | 644,104 wells in 8 status traces from one source, EIA pipelines and shale plays underneath. Views: both states, Wattenberg field, Hugoton field. | Points need server thinning: the densest zoom 6 tile is 1.75 MB at one point per pixel. Low-zoom tiles carry fewer properties, so hover templates need a fallback. Sizes must change with the view (question 13). |
| Gulf of Mexico offshore (`?d=offshore`) | BOEM lease blocks as lines, active leases by year, pipelines by status and diameter, platforms, wells by water depth. At zoom 10: directional well paths from surface to bottom hole, by vertical depth. | Status categories needed server layers (`pipelines_active`, `pipelines_inactive`): question 12. BOEM data is NAD27: the server must transform it, or wells sit tens of meters off. |
| Drilling through the decades (`?d=decades`) | 40,479 H3 cells. A slider animates wells spudded per decade, 1910s to 2020s, through feature state. | A frame takes 50 to 300 ms. `updateFeatureState` is 1 to 15 ms of it. The rest is `Plotly.animate` and MapLibre's paint buffer update. |
| U.S. midstream (`?d=midstream`) | 32,921 EIA gas pipeline segments, crude trunklines, shale plays. | Line layers at national scale are cheap: ready in 1.5 s. |
| Esri bathymetry + BOEM (`og10`) | Esri-hosted vector tiles and DuckDB tiles in one figure. | An Esri user can keep their hosted vector tile layers. |
| Dash well console (`dash/app.py`) | Scale range (cells below zoom 9, wells above), `Patch()` slider, click for a DuckDB lookup within one mile, box select with the server count. | `dcc.Graph` drops `properties` (question 14). Selection is the rendered subset: 0 of 46,571 at zoom 7.5 (question 5). |

## What this does not solve

Points that exist only in the browser, with no tile server, still go through `scattermap`. That path makes a JS object and a GeoJSON Feature for each point. Then MapLibre cuts the GeoJSON in its worker again, and hover projects every point.

A typed-array fast path for `scattermap` is separate work. A sketch:

- Read `lon`, `lat` and `marker.color` as typed arrays (plotly.py and Dash can send them as base64 typed arrays already).
- Build the tiles in the MapLibre worker from the typed arrays, with no GeoJSON objects on the main thread. Or draw with a MapLibre custom layer.
- Use a grid index for hover in place of the linear projection scan.

The two fit together. They use the same attribute names (`marker.color`, `marker.size`, `colorscale`, `hovertemplate`) and the same event shape (`pointNumber`, `lon`/`lat`, `id`). A user moves from `scattermap` to `vectortilemap` with `layertype: 'circle'` when the data moves to a server. Data up to roughly 1M points can stay in the browser. Data beyond that, or data that changes on the server, goes to tiles.

## Prototype

Branch `claude/bold-brahmagupta-flz6rm`.

| File | Content |
|---|---|
| `src/traces/vectortilemap/attributes.ts` | Attributes, from `choroplethmap`, `scattermap` and `map.layers` |
| `src/traces/vectortilemap/defaults.ts` | The three color modes, `visible: false` without `source`/`sourcelayer`, or with `zkey` and no range |
| `src/traces/vectortilemap/calc.ts` | Calcdata, `locToIndex`, `featureKey` (the MapLibre id rule), `colorscaleCalc` |
| `src/traces/vectortilemap/convert.ts` | Shared source assignment, paint expressions for each layer type |
| `src/traces/vectortilemap/plot.ts` | Source registry, layers, feature state and selection state |
| `src/traces/vectortilemap/hover.ts`, `select.ts`, `event_data.ts` | Hover, click and selection from rendered features |
| `src/traces/choropleth/hover.js` | Export `makeHoverInfo` for reuse |
| `src/components/legend/style.js` | Legend item for each layer type |
| `src/plots/map/map.js` | Layer order; tile source errors warn instead of reject |
| `src/plots/map/get_map_fit_bounds.ts` | No fit for the new type |
| `lib/`, `tasks/util/constants.js` | Registration in the full, strict and map bundles |
| `test/image/mocks/map_vectortile-choropleth.json` | One z0 tile with three layers (squares, wells, pipes) as a `data:` URL. No network. No baseline committed. |
| `test/jasmine/tests/vectortilemap_test.js` | 19 specs: defaults, three color modes, hover and click, restyle with no tile request, legend toggle, shared sources, box select, id rule, tile errors |

## Measurements

### Census benchmark

#### Setup

- Data: Census cartographic boundary files 2023, 1:500k. 3,144 counties and 84,121 tracts (50 states and DC). The GeoJSON files hold the full 1:500k geometry: 23 MB and 117 MB.
- Tile server: Python `http.server` with DuckDB 2.0 spatial, `ST_AsMVT`, gzip. Pre-simplified columns for zoom 0-5 and 6-9, bbox prefilter, polygons under about 2x2 tile pixels dropped below zoom 8. An in-memory tile cache, warmed by one unmeasured run, so the numbers measure the client. Uncached tiles took 0.1 to 0.6 s.
- Client: this branch (plotly.js 4.1.2-dev, MapLibre 6.11.2), Playwright Chromium 141 headless, SwiftShader WebGL, 4 vCPU, 1000x700 px, `white-bg` style, `marker.line.width: 0`. Compare ratios, not absolute numbers.
- Methods: `choroplethmap` with a GeoJSON URL, `vectortilemap` with `locations`/`z` (all ids), and a hand-written `map.style` that colors from a tile property (`ALAND`) with one empty `scattermap` trace.
- Views: national (zoom 3.4) and metro (New York, zoom 9.5). Each cell: median of 3 runs, a fresh browser context for each run.

Definitions:

- Ready: `Plotly.newPlot` start to the next map `idle` event, so all view tiles are drawn.
- Long tasks: `PerformanceObserver` `longtask` entries that overlap the window. A 10 ms timer heartbeat agreed with the max values.
- Hover: time inside plotly's map `mousemove` listener, for 24 real mouse moves on a grid.
- `z` restyle: `Plotly.restyle(gd, 'z', [reversed z])` to the next `idle`. React: `Plotly.react` with a new `z` array, which is what a Dash `Patch()` does.

#### Results

| data | view | method | ready ms | long tasks: n / total / max ms | JS heap MB | tiles: n / KB | hover ms per move: median / max | `z` restyle ms | restyle long tasks: total / max ms | react ms |
|---|---|---|---|---|---|---|---|---|---|---|
| counties | national | choroplethmap | 2910 | 2 / 1232 / 1114 | 212 | - | 3.0 / 13.3 | 2351 | 987 / 987 | 2387 |
| counties | national | vectortilemap | 465 | 1 / 110 / 110 | 42 | 4 / 156 | 2.2 / 13.8 | 57 | 0 / 0 | 44 |
| counties | national | style | 408 | 1 / 87 / 87 | 37 | 4 / 137 | n/a | n/a | n/a | n/a |
| counties | metro | choroplethmap | 2686 | 2 / 1337 / 1225 | 205 | - | 2.8 / 10.5 | 2068 | 872 / 872 | 2158 |
| counties | metro | vectortilemap | 446 | 1 / 129 / 129 | 37 | 2 / 4 | 2.3 / 12.2 | 48 | 0 / 0 | 37 |
| counties | metro | style | 414 | 1 / 78 / 78 | 36 | 2 / 4 | n/a | n/a | n/a | n/a |
| tracts | national | choroplethmap | 15495 | 2 / 6837 / 6564 | 353 | - | 20.0 / 35.9 | 17504 | 6908 / 6572 | 16670 |
| tracts | national | vectortilemap | 1061 | 7 / 848 / 255 | 82 | 4 / 689 | 2.5 / 10.8 | 379 | 364 / 208 | 317 |
| tracts | national | style | 624 | 1 / 81 / 81 | 42 | 4 / 833 | n/a | n/a | n/a | n/a |
| tracts | metro | choroplethmap | 13189 | 2 / 6451 / 6234 | 1146 | - | 17.9 / 127.0 | 12196 | 5211 / 5154 | 14151 |
| tracts | metro | vectortilemap | 723 | 4 / 601 / 256 | 66 | 2 / 141 | 2.5 / 12.9 | 292 | 269 / 157 | 266 |
| tracts | metro | style | 400 | 1 / 82 / 82 | 37 | 2 / 141 | n/a | n/a | n/a | n/a |

`updateFeatureState` during a full `z` restyle: median 3 ms on counties, 76 ms on tracts. No `z` restyle or react fetched a tile or a GeoJSON. No run logged a page error. These runs used the first prototype revision (fill only). The later revisions did not change the fill path except for the source registry.

#### Reading the results

- On tracts, `vectortilemap` is ready 15x to 18x sooner than `choroplethmap` and its `z` change is 42x to 46x faster. The worst main-thread freeze drops from about 6.5 s to about 0.25 s.
- On counties, `vectortilemap` is 6x faster to ready and about 40x faster on a `z` change.
- `vectortilemap` costs about 0.3 to 0.4 s more than the hand-written style on tracts. That is the feature-state work. The style has no hover, events or colorbar.
- Hover cost does not grow with the feature count in `vectortilemap`. In `choroplethmap` it grows (3 ms to 20 ms here).
- The 1146 MB heap for `choroplethmap` tracts at metro zoom is the median of three runs as measured. The national runs read 353 MB. The difference is probably garbage collection timing. I did not investigate further.

### O&G demos

Same client setup, 1600x1000 px, Carto Dark Matter basemap, a cold tile cache unless noted.

| Measure | Result |
|---|---|
| Ready, wells overview (11 traces, 644k wells) | 1.7 to 2.6 s |
| Ready, Gulf of Mexico (6 traces) | 3.7 s |
| Ready, deepwater with well paths (7 traces) | 1.3 s |
| Hover, wells figure, all `hoverPoints` calls per move | median 0.9 to 1.1 ms, max 14 ms |
| Hover, offshore figures, `mousemove` listener | median 2.2 to 2.4 ms |
| Decade frame (40k cells, `Plotly.animate`) | 50 to 300 ms, of which `updateFeatureState` 1 to 15 ms |
| Wells tile sizes, densest tiles, zoom 5 to 9 | 0.2 to 1.75 MB gzip |
| Dash `Patch()` of `z`, input to idle map | 450 to 890 ms (`Plotly.react` and redraw: 380 to 450 ms) |

### Reproduce

- `bench/`: the Census benchmark (`prepare_data.py`, `server.py`, `bench.mjs`, `summarize.py`, raw `results.json`).
- `og/`: data preparation, tile server, `make_hex_decades.py` for the decades demo. `og/README.md` lists the source URLs.
- `demos/`: the demo figures as plotly.js JSON. `dash/`: the Dash app.
- `experiments/`: the scripts for the screenshots, the Dash run and each experiment below.

## Open questions, worked through

Status: **answered** (an experiment or the code settles it, and the prototype follows the answer), **proposal** (a recommendation that needs a maintainer decision), or **open**.

1. **Names** (proposal). Trace `vectortilemap`, attribute `layertype` with the `map.layers.type` values, attribute `zkey` for the tile property. Alternatives: `tilemap` (short, but reads like a raster basemap) and `choroplethtile` (wrong for lines and points). `zkey` follows `featureidkey`. A maintainer must decide.
2. **One trace with a layer type, or three trace types** (proposal: one). Every demo mixes fills, lines and circles from shared sources, with the same events and options. Three types would triplicate the source registry, the hover code and the docs. The plotly convention of one trace per geometry kind argues for three. The deciding argument is the shared source: one tile URL holds all three kinds.
3. **Shared sources** (answered). Implemented with reference counts on the subplot. MapLibre drops native ids for layers that an object `promoteId` does not list, so a URL has up to two shared sources. Conflicting feature state or `promoteId` gets a source of its own. A legend click keeps the source. See [Shared sources](#shared-sources). Upstream: report the `promoteId` behavior to MapLibre.
4. **Id types** (answered). Before the fix, `locations: ['001']` colored feature 1 but got no hover. Hover and selection now use the MapLibre rule (`featureKey`). Two locations that differ only in leading zeros become one feature, as in MapLibre.
5. **Selection event shape** (proposal). The prototype reports the rendered subset as `points`, as other traces report their points. At zoom 7.5 that was 0 of 46,571 wells. Proposal: document that `points` holds the rendered features, and that `range`/`lassoPoints` is the full selection. A `partial: true` flag in the event is optional.
6. **Tile errors** (answered). A 404 tile is empty, not an error. A tile server that cannot be reached rejected `Plotly.newPlot` while the other traces drew 6,009 features. Now errors of `vectortilemap` sources warn, and other map errors still reject. Maintainers must agree to the change in `rejectOnError`.
7. **Autorange** (proposal). Use the TileJSON `bounds` when `fitbounds` asks for it. The TileJSON arrives after the first draw, so the fit must move the view later, as `updateMap` does for `_fitBounds` today. Not done.
8. **Source zoom range** (answered, with a proposal). With a TileJSON `maxzoom` of 12, the map overzooms tile 12 at zoom 13 to 15. With a tiles array, it requested tiles at zoom 13, 14 and 15 from the server. Proposal: document TileJSON as the normal way, and add `sourceminzoom`/`sourcemaxzoom` only if users ask.
9. **Feature-state cost** (answered). See the table in [Coloring](#coloring). Fine to 250k `locations`. At 1M, a full restyle freezes the main thread for 1.2 s. Recommendation: document the limit, and point large layers to `zkey`.
10. **Image baseline** (open). The mock needs a baseline from the CI artifact.
11. **Hover by point number** (open). `Fx.hover(gd, [{curveNumber, pointNumber}])` cannot find a position for a location that has no rendered feature. A server label point property could give one.
12. **Client-side filter** (proposal). Esri users filter by attribute constantly. The demos split categories on the server, which costs a server change for each new category. Proposal: an attribute that keeps features whose property is in a list, for example `filterkey: 'status'` with `filtervalues: ['Active']`, converted to a MapLibre `filter`. A raw MapLibre expression pass-through is more powerful but not plotly style.
13. **Zoom-dependent sizes** (proposal). A 2 px well dot at zoom 6 is a 6 px dot at zoom 11. The demos set a different `marker.size` for each view. Proposal: let `marker.size` and `line.width` take zoom stops, converted to a MapLibre `interpolate` on `['zoom']`. Name and shape need a decision.
14. **`properties` in Dash events** (proposal, for Dash). `dcc.Graph` drops object-valued event fields. A one-line change in its `filterEventData` copies `properties`, as it copies `bbox`. That also helps `choroplethmap` users today.
15. **PMTiles and other protocols** (open). PMTiles on object storage is a common serverless choice. It needs `maplibregl.addProtocol`, which plotly.js does not expose. Options: expose a hook to register a protocol, or bundle the PMTiles protocol (about 10 kB).
16. **`marker` and `line` arrays** (open). Arrays for `marker.size`, `marker.opacity` and `line.width` could become feature state, as `z` does. Not done.

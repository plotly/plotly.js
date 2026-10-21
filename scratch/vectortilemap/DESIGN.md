# Design: a vector tile trace for map subplots

Status: draft for review. Prototype on branch `claude/bold-brahmagupta-flz6rm`. Working trace name: `vectortilemap`.

NOTE: This folder is scratch material for the design review. Remove `scratch/` before a pull request.

## Problem

Dash apps that map more than a few thousand features hit three walls today:

- `choroplethmap` sends the whole GeoJSON to the browser. On 84,121 census tracts, the first draw takes 15 to 21 s here, with one main-thread freeze of 6 to 9 s (see [Measurements](#measurements)).
- A `z` change runs `convert.js` and `setData()` again. MapLibre then cuts the full GeoJSON into tiles again in its worker. On tracts, that takes about 17 s per change, with a main-thread freeze of 5 to 7 s.
- A hand-written `layout.map.style` with a `vector` source is fast. But it loses the colorbar, `hovertemplate`, `plotly_hover`, `plotly_click`, `plotly_selected` and the legend. Users write MapLibre expressions by hand.

The goal: give vector tile data the Plotly trace API, at the cost of the hand-written style.

## Recommendation in one paragraph

Add one new trace type for vector tile sources. Draw the tiles with ordinary MapLibre layers. Send `z` to the map as MapLibre feature state, keyed by a tile property through `promoteId`. A `z` change then costs one `setFeatureState` call for each changed value. No tile is fetched or cut again. Get hover and click from `queryRenderedFeatures` at the cursor, which costs the same for 3,000 or 3,000,000 features. Keep the colorbar, `hovertemplate` and event data as `choroplethmap` has them. The prototype does this for fill layers. On 84k tracts it is ready in 0.7 to 1.1 s, a `z` change takes 0.3 to 0.4 s, and hover costs about 2.5 ms per mouse move. `choroplethmap` with a GeoJSON URL takes 13 to 15 s, 12 to 17 s and 18 to 20 ms on the same data.

## What the code does today

These findings come from reading `src/plots/map/`, `src/traces/{choroplethmap,scattermap,densitymap}/`, `src/lib/geo_location_utils.js` and `src/components/fx/`, and from the measurements.

| Area | Finding | Consequence for a tile trace |
|---|---|---|
| Trace plot objects | Each map trace module returns an object with `update(calcTrace)` and `dispose()`. `Map.updateData` (`plots/map/map.js`) calls `update` on every `calc` or `plot` edit. | A tile trace fits the same pattern. `update` decides if the source must change. |
| Layer order | `updateData` sorts traces by `traceType2orderIndex`. A type that is not in the table sorts as `NaN`. | The new type needs an entry. The prototype uses the `choroplethmap` slot. |
| `below` | `fillBelowLookup` reads `trace.below`, or `_module.getBelow`. | The prototype reuses `choroplethmap.getBelow` (above the water layers). |
| Hover | `Fx.hover` calls `_module.hoverPoints(pointData, lon, lat)`. `xa.c2p` and `ya.c2p` give the pixel of a lon/lat. The `hovertemplate` reads `eventData[0]`, so `%{properties.X}` works when `eventData` sets `properties`. | Hover maps a pixel to a feature with `queryRenderedFeatures`, and a feature id to a data index with a `Map`. |
| Click | The map `click` handler calls `Fx.click`, which reuses the last hover data. | Click works when hover works. No new code. |
| Selection | `updateFx` reports `range` or `lassoPoints` in lon/lat in every `plotly_selected` event, before any trace runs `selectPoints`. | The selection polygon already reaches Dash. A server can query with it. |
| `choroplethmap` `z` edit | `z` has `editType: 'calc'`. The edit runs `calc`, `convert.js` (turf centroid and `polygon.tester` for each feature) and `setData()`. | On tracts one edit takes about 17 s. The main thread freezes for 5 to 7 s of that (`convert.js`, then the copy of the GeoJSON to the worker). The worker then cuts 117 MB of GeoJSON into tiles again. Feature state removes all three steps. |
| `choroplethmap` hover | A linear scan of `polygon.tester` objects for each mouse move. | About 20 ms per move on tracts here. The 400 ms in the brief came from `scattermap` with 566k points, which projects each point. |
| Style compare | `updateMap` compares `JSON.stringify(styleObj)` on every update, not only in `map.layers`. | A large inline style dict costs a stringify on each `Plotly.react`. The tile trace keeps its source out of the style. |
| `map.layers` compare | `needsNewSource` compares `JSON.stringify(source)` (`plots/map/layers.js`). | The tile trace compares a short string key: URL or tile URLs, `sourcelayer`, promote key, attribution. It never stringifies data. |
| Errors | `rejectOnError` rejects the plot promise on the first `error`, `source.error` or `tile.error` event. | CAUTION: One failed tile request during the first draw rejects `Plotly.newPlot` with "Map error.". A tile server that sends 404 for empty tiles breaks the plot. See open question 6. |
| Programmatic hover | `Fx.hover(gd, [{curveNumber, pointNumber}])` reads `cdi.lonlat` or `cdi.x`. Map traces without `lonlat` get `xval = undefined`. | The tile trace returns no hover for this call. `choroplethmap` has the same gap. |
| Feature state in MapLibre 6.11 | `TileManager.setFeatureState` stores state on the source. `initializeTileState` applies the full stored state to each tile when it loads (`tile/tile_manager.ts`, `source/source_state.ts`). | The trace does not need to apply state again on `sourcedata`. The brief assumed it must. But each new tile walks all N stored ids. With 84k ids, this shows as 150 ms long tasks during tile loads. |
| Feature ids | MapLibre maps ids with `getNumericId`: a numeric string becomes a number, another string gets a hash. | String `locations` match numeric tile ids for coloring. Hover compares `String(id)`, so `"01001"` against a numeric tile value `1001` fails. See open question 4. |

## API shape

### Options

1. **A new trace type.** One module with its own `calc`, `plot`, `hoverPoints` and `selectPoints`. Attribute names come from `choroplethmap` and `map.layers`.
2. **A tiles mode on `choroplethmap`, `scattermap`, and a new line trace.** For example `choroplethmap.source` as an alternative to `geojson`.

### Recommendation: a new trace type

- The two modes share almost no code. `choroplethmap` hover, selection, `ct` event data and `selectedpoints` depend on the full geometry in the browser. A tiles mode needs a second `calc`, `plot`, `hoverPoints` and `selectPoints` behind one name.
- Half the attributes of each trace would have no effect in tiles mode: `geojson`, `scattermap.lon`/`lat`/`mode`/`fill`/`cluster`/`text` positions. The schema, plotly.py validation and the docs cannot tell the user which half applies.
- A vector tile source can hold points, lines and polygons. One trace type with a layer kind covers the three. The source, events, feature state and scale range code stays in one place.
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

plotly.py generates `go.Vectortilemap` from `plot-schema.json` with no hand-written code. `codegen/__init__.py` reads every key under `traces` and has no list of trace names. `plotly.express` functions are hand-written. A `px` function is separate work.

### Attributes

Prototype attributes are marked P. The rest is proposed.

| Attribute | Source of the name | Notes |
|---|---|---|
| `source` P | `map.layers.source` | A TileJSON URL (string), or an array of tile URL templates. Same meaning as `map.layers` with `sourcetype: 'vector'`. |
| `sourcelayer` P | `map.layers.sourcelayer` | Required. MapLibre needs it for vector layers. |
| `sourceattribution` P | `map.layers.sourceattribution` | |
| `featureidkey` P | `choroplethmap.featureidkey` | Default `'id'` uses the MVT feature id. Any other value becomes `promoteId: {[sourcelayer]: key}`. A `properties.` prefix is stripped, so a value copied from a `choroplethmap` figure works. No separate `promoteid` attribute. |
| `locations`, `z` P | `choroplethmap` | Matched against `featureidkey`. Sent as feature state. |
| `zmin`, `zmax`, `zmid`, `zauto`, `colorscale`, `reversescale`, `showscale`, `colorbar`, `coloraxis` P | colorscale attributes | |
| `minzoom`, `maxzoom` P | `map.layers` | The scale range. Two traces on one source give "counties below zoom 7, tracts at zoom 7 and above". |
| `below` P | `choroplethmap.below` | |
| `marker.opacity`, `marker.line.color`, `marker.line.width` P | `choroplethmap` | Scalars only in the prototype. Arrays can become feature state later. |
| `text`, `hovertext`, `hoverinfo`, `hovertemplate` P | `choroplethmap` | `hovertemplate` keys include `properties`. |
| layer kind: `fill`, `line`, `circle` | values from `map.layers.type` | Name not decided: open question 1. The prototype draws `fill` only. |
| `line.width`, `line.color`, `marker.size`, `marker.color` | `scattermap` | For the `line` and `circle` kinds. |
| tile property for color | none yet | Color from a property in the tile, with no `locations`. Working name `zkey`. See [Coloring](#coloring). |
| `selectedpoints`, `selected`, `unselected` | `choroplethmap` | See [Events](#events). |

## Coloring

### Feature state from `locations` and `z` (prototype)

- `plot.ts` adds one `vector` source per trace, with `promoteId` from `featureidkey`. It adds a `fill` layer and a `line` layer.
- `fill-color` is an `interpolate` expression on `['feature-state', 'z']`. `convert.ts` builds it from `Colorscale.extractScale`, so `reversescale`, `zmin`, `zmax` and `coloraxis` give the same colors as `choroplethmap`. A discrete colorscale repeats stops. MapLibre needs strictly ascending stops, so equal stops move up by `1e-9` of the range.
- Features with no `z` state get opacity 0. This copies `choroplethmap`, which draws only the features in `locations`.
- `updateFeatureState` keeps the last `z` for each location in a `Map`. On each update it calls `setFeatureState` only for changed values, and `removeFeatureState` for locations that left `locations`. A Dash `Patch()` of `z` arrives as `Plotly.react` with a new `z` array. That runs `calc` (O(N), no geometry) and the diff.
- A change to `colorscale`, `zmin` or `zmax` only changes the paint expression. No feature state changes.
- MapLibre keeps feature state on the source and applies it to each tile when the tile loads. The trace does not listen to `sourcedata`. The state stays until the source is removed: a change of `source`, `sourcelayer`, `featureidkey` or `sourceattribution`, or a new `map.style` (which rebuilds all trace layers).

What 100k `locations` costs, measured on 84,121 tracts:

- The figure JSON holds 84k GEOID strings (1.3 MB) and 84k numbers (about 0.4 MB with three significant digits). A `Patch()` of `z` sends only the numbers.
- The first draw does 84k `setFeatureState` calls. A change of all 84k values took a median of 76 ms in `updateFeatureState`, and 290 to 380 ms from `Plotly.restyle` to the next idle map. The rest is `calc`, the colorbar and MapLibre's update of the loaded tiles.
- Each tile load walks all 84k stored states (`featureStatesMapToArray` plus a position lookup for each id). On tracts the first draw had 4 to 7 long tasks, 600 to 850 ms in total, max 255 ms. The hand-written style on the same tiles had one long task of about 80 ms.

### Color from a tile property (proposed, not in the prototype)

When the server puts the value in the tile, the trace needs no `locations`. The paint expression reads `['get', key]` in place of `['feature-state', 'z']`. The hand-written-style baseline in the measurements uses this path. It is the fastest: ready in 0.4 to 0.6 s, with one long task of about 80 ms.

- `zmin` and `zmax` must be given. The browser sees only the loaded tiles, so it cannot compute the range. If they are missing, set the trace to `visible: false` and log why.
- A `z` change then means new tiles. The user changes the URL (for example `?v=2`), and the trace makes a new source.
- Hover reads `z` from the feature properties. `pointNumber` has no meaning. Event data carries `properties` and `id`.

Recommendation: support both. `locations` and `z` win when given. A tile property suits static or very large layers. Feature state suits values that Dash changes often.

### Line and circle kinds (proposed)

The same feature-state approach works for `line-color`, `line-width`, `circle-color` and `circle-radius`. All four accept feature state in MapLibre. `marker.size` arrays become feature state `s`, with the same diff. Text and icon layers (`symbol`) cannot read feature state in `layout` properties. Leave `symbol` out of the first version.

## Events

### Hover and click (prototype)

- `hoverPoints` projects the hover lon/lat to a pixel with `xa.c2p`/`ya.c2p`. It calls `map.queryRenderedFeatures(pixel, {layers: [fillLayerId]})`.
- The first feature whose id is in `t.locToIndex` wins. `locToIndex` is a `Map` that `calc` builds once (O(N)).
- `pointData` gets `index`, `location`, `z`, `zLabel`, and `properties` from the tile feature. `makeHoverInfo` is shared with `choropleth/hover.js` (now exported).
- `eventData` adds `location`, `z` and `properties`. `hovertemplate` with `%{properties.NAME}` works. Dash `hoverData` and `clickData` carry `pointNumber`, `location`, `z` and `properties`.
- The label sits at the cursor. A tile feature has no centroid in the browser. `choroplethmap` puts the label at the centroid.
- Cost: a median of 2.2 to 2.5 ms per move for counties and tracts. `choroplethmap` is 3 ms on counties and 18 to 20 ms on tracts (max 127 ms).

Limits:

- Only rendered features get hover: in the view, inside `minzoom` and `maxzoom`, and kept by the server at that zoom. A tract that the server drops below zoom 8 gets no hover there.
- The properties come from the tile at the current zoom. Keep the hover properties in every zoom level of the tiles.
- Hover by `pointNumber` from code returns nothing (see the table above).

### Box and lasso selection (proposed)

What is feasible with rendered features only:

1. Query `queryRenderedFeatures` with the pixel bounding box of the selection, on the trace layers.
2. Remove duplicates by feature id. One feature can span many tiles.
3. Test one point of each feature against the selection polygon. A representative point from the server (`label_x`, `label_y` properties) is exact and cheap. A point computed from the clipped tile geometry is approximate at tile edges.
4. Report `pointNumber` (from `locToIndex`), `location`, `z`. Set `selected` feature state for `selected.marker.opacity`.

This selects only what is rendered. Features below the server's size threshold at this zoom, and features outside the view, are missing. So the event must say so. Recommendation:

- Report the points found, as other traces do.
- Rely on `range` / `lassoPoints`, which `plotly_selected` already carries in lon/lat. A Dash callback sends that polygon to DuckDB or PostGIS (`ST_Intersects`) for the full answer.
- Document that `points` is the rendered subset. Possibly add a flag to the event, for example `partial: true`. Open question 5.

## Colorbar, legend, autorange

- Colorbar: the prototype uses `heatmap/colorbar` and `colorscaleCalc` on `z`, the same as `choroplethmap`. It works with no change.
- `zmin` and `zmax` come from `z` when `zauto` is true. With tile-property coloring they must be given.
- Legend: `showlegend` defaults to false, as in `choroplethmap`. A legend item could toggle visibility with no refetch (layer `visibility`).
- Map autorange (`_fitBounds`): `get_map_fit_bounds.ts` now returns null when a `vectortilemap` trace is on the subplot, as it does for `choroplethmap`. A TileJSON `bounds` could drive the fit later. Open question 7.

## Interaction with existing map code

- Layer order: the `fill` and `line` layers carry the `plotly-trace-layer-` prefix, so `map.layers` with `below: 'traces'` goes under them. `traceType2orderIndex` puts the trace with `choroplethmap`.
- `below`: a change removes and adds the two layers, and keeps the source and the feature state.
- `uirevision`: the map view belongs to the subplot. The trace keeps no view state. Loaded tiles and feature state survive `Plotly.react` while the source key stays the same.
- `Plotly.react` diffing: `source` is `valType: 'any'` with `editType: 'calc'`. A react with an equal URL string does not change the source key, so no new source. The trace never stringifies data, and an array `source` is short.
- `map.style`: a style change calls `setStyle`, which removes all sources. `map.js` clears `traceHash`, so the trace object, its source and its full feature state come back. A `map.style` dict keeps working as before. The trace adds nothing to the style object.
- Several traces can point at one tile URL. Each trace has its own source today. Two sources on one URL fetch the tiles twice. Open question 3.

## What this does not solve

Points that exist only in the browser, with no tile server, still go through `scattermap`. That path makes a JS object and a GeoJSON Feature for each point. Then MapLibre cuts the GeoJSON in its worker again, and hover projects every point.

A typed-array fast path for `scattermap` is separate work. A sketch:

- Read `lon`, `lat` and `marker.color` as typed arrays (plotly.py and Dash can send them as base64 typed arrays already).
- Build the tiles in the MapLibre worker from the typed arrays, with no GeoJSON objects on the main thread. Or draw with a MapLibre custom layer.
- Use a grid index for hover in place of the linear projection scan.

The two fit together like this. Same attribute names (`marker.color`, `marker.size`, `colorscale`, `hovertemplate`). Same event shape (`pointNumber`, `lon`/`lat` or `properties`). A user moves from `scattermap` to the `circle` kind of the tile trace when the data moves to a server. Data up to roughly 1M points stays in the browser. Data beyond that, or data that changes on the server, goes to tiles.

## Prototype

Branch `claude/bold-brahmagupta-flz6rm`.

| File | Content |
|---|---|
| `src/traces/vectortilemap/attributes.ts` | Attributes, from `choroplethmap` and `map.layers` |
| `src/traces/vectortilemap/defaults.ts` | `visible: false` without `source`, `sourcelayer`, `locations` or `z` |
| `src/traces/vectortilemap/calc.ts` | Calcdata, `locToIndex`, `colorscaleCalc` |
| `src/traces/vectortilemap/convert.ts` | Source options, source key, paint expressions |
| `src/traces/vectortilemap/plot.ts` | Source and layers, feature state diff |
| `src/traces/vectortilemap/hover.ts`, `event_data.ts` | Hover through `queryRenderedFeatures` |
| `src/traces/choropleth/hover.js` | Export `makeHoverInfo` for reuse |
| `src/plots/map/map.js`, `get_map_fit_bounds.ts` | Layer order and fit bounds for the new type |
| `lib/`, `tasks/util/constants.js` | Registration in the full, strict and map bundles |
| `test/image/mocks/map_vectortile-choropleth.json` | Five squares in one z0 tile, as a `data:` URL inside a `data:` TileJSON. No network. No baseline committed. |
| `test/jasmine/tests/vectortilemap_test.js` | Defaults, coloring, hover with `hovertemplate`, click, `z` restyle with no tile request, removal of state, `featureidkey` change, `marker.line.width: 0` |

Not in the prototype: `line` and `circle` kinds, tile-property coloring, `selectPoints`, `selectedpoints`, arrays for `marker.opacity` and `marker.line`.

## Measurements

### Setup

- Data: Census cartographic boundary files 2023, 1:500k. 3,144 counties and 84,121 tracts (50 states and DC). The GeoJSON files hold the full 1:500k geometry: 23 MB and 117 MB.
- Tile server: Python `http.server` with DuckDB 2.0 spatial, `ST_AsMVT`, gzip. Pre-simplified columns for zoom 0-5 and 6-9, bbox prefilter, polygons under about 2x2 tile pixels dropped below zoom 8. An in-memory tile cache, warmed by one unmeasured run, so the numbers measure the client. Uncached tiles took 0.1 to 0.6 s.
- Client: this branch (plotly.js 4.1.2-dev, MapLibre 6.11.2), Playwright Chromium 141 headless, SwiftShader WebGL, 4 vCPU, 1000x700 px, `white-bg` style, `marker.line.width: 0`. Compare ratios, not absolute numbers.
- Methods: `choroplethmap` with a GeoJSON URL, `vectortilemap` with `locations`/`z` (all ids), and a hand-written `map.style` that colors from a tile property (`ALAND`) with one empty `scattermap` trace.
- Views: national (zoom 3.4) and metro (New York, zoom 9.5).
- Each cell: median of 3 runs, a fresh browser context for each run.

Definitions:

- Ready: `Plotly.newPlot` start to the next map `idle` event, so all view tiles are drawn.
- Long tasks: `PerformanceObserver` `longtask` entries that overlap the window. A 10 ms timer heartbeat agreed with the max values.
- Hover: time inside plotly's map `mousemove` listener, for 24 real mouse moves on a grid. 14 to 19 of the 24 moves hit a feature (the rest are over water).
- `z` restyle: `Plotly.restyle(gd, 'z', [reversed z])` to the next `idle`. React: `Plotly.react` with a new `z` array, which is what a Dash `Patch()` does.

### Results

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

`updateFeatureState` during a full `z` restyle: median 3 ms on counties, 76 ms on tracts. No `z` restyle or react fetched a tile or a GeoJSON. No run logged a page error.

### Reading the results

- On tracts, `vectortilemap` is ready 15x to 18x sooner than `choroplethmap` and its `z` change is 42x to 46x faster. The worst main-thread freeze drops from about 6.5 s to about 0.25 s.
- On counties, `choroplethmap` is usable but `vectortilemap` is still 6x faster to ready and 40x faster on a `z` change.
- `vectortilemap` costs about 0.3 to 0.4 s more than the hand-written style on tracts. That is the feature-state work: 84k `setFeatureState` calls, and the walk over all stored states on each tile load. The style has no hover, events or colorbar.
- Hover cost does not grow with the feature count in `vectortilemap`. In `choroplethmap` it grows with the feature count (3 ms to 20 ms here).
- The 1146 MB heap for `choroplethmap` tracts at metro zoom is the median of three runs as measured. The national runs read 353 MB. The difference is probably garbage collection timing. I did not investigate further.
- Not measured: points (`scattermap` with 566k wells), line networks, uncached tile latency in the time to ready, and a real GPU.

### Reproduce

The scripts are in `scratch/vectortilemap/bench/`. `prepare_data.py` downloads the Census files and builds the DuckDB database. `server.py` serves tiles and pages. `bench.mjs` runs the matrix and `summarize.py` prints the table. `results.json` holds the raw runs for the table above.

## Open questions for maintainers

1. **Names.** Trace name (`vectortilemap`, `tilemap`, `choroplethtile`). The attribute name for the layer kind (`fill`/`line`/`circle`). The attribute name for tile-property coloring (`zkey`?).
2. **One trace with a layer kind, or three trace types** (`choroplethtile`, `scattertile`, `linetile`)? This doc recommends one type. The plotly convention of one trace per geometry kind argues for three.
3. **Shared sources.** Two traces on one URL make two sources and fetch the tiles twice. Share by URL with reference counts? Feature state is per source and per source layer, so two traces on one source layer would share state. That conflicts for two traces that color the same features differently.
4. **Id types.** Hover compares `String(feature.id)` with `String(location)`. Normalize with MapLibre's rule (numeric strings become numbers), or document that types must match?
5. **Selection event shape.** Points of rendered features only, plus `range`/`lassoPoints`. Is a `partial` flag acceptable in event data?
6. **Tile errors.** `rejectOnError` rejects `newPlot` on the first tile error. Should errors from trace tile sources only log a warning?
7. **Autorange.** Use TileJSON `bounds` for `_fitBounds`? That needs the TileJSON before the first draw.
8. **Source zoom range.** A tiles array has no `minzoom`/`maxzoom` for the source, so MapLibre requests tiles up to zoom 22 instead of overzooming. TileJSON fixes this. Is a TileJSON URL the documented way, or add `sourceminzoom`/`sourcemaxzoom`?
9. **Feature-state cost per tile.** MapLibre walks all stored states on each tile load. With 1M `locations` that cost grows. Do we accept it, document a limit, or ask MapLibre for an index by source layer?
10. **Image baseline.** The mock needs a baseline from CI.

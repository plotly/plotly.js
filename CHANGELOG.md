# plotly.js changelog

For more context information, please read through the
[release notes](https://github.com/plotly/plotly.js/releases).

To see all merged commits on the master branch that will be part of the next plotly.js release, go to:

https://github.com/plotly/plotly.js/compare/vX.Y.Z...master

where X.Y.Z is the semver of most recent plotly.js release.


## [1.31.2] -- 2017-10-23

### Fixed
- Fix multiple `table` restyle bugs [#2107]
- Fix selection work when `visible: false` choropleth traces are present [#2099, #2109]
- Fix (another) contour generation bug [#2091]


## [1.31.1] -- 2017-10-16

### Fixed
- Fix IE and Edge SVG `toImage` support [#2068]
- Return empty set during selections of `visible: false` traces [#2081]
- Fix scroll glitch in `table` traces [#2064]
- Fix handling of 1D header values in `table` [#2072]
- Fix `table` line style defaults [#2074]
- Do not attempt to start drag on right-click [#2087]
- Phase out `alignment-baseline` attributes in SVG text nodes [#2076]
- Listen to document events on drag instead of relying on
  cover-slip node [#2075]


## [1.31.0] -- 2017-10-05

### Added
- Add `table` trace type [#2030]
- Add `geo.center` making geo views fully reproducible using layout attributes [#2030]
- Add lasso and select-box drag modes to `scattergeo` and `choropleth` traces
  [#2030]
- Add lasso and select-box drag modes to `bar` and `histogram` traces [#2045]
- Add `scale` option to `Plotly.toImage` and `Plotly.downloadImage` [#1979]
- Add `plot-schema.json` to `dist/`[#1999]

### Changed
- Throttle lasso and select-box events for smoother behavior [#2040]
- Harmonize gl3d and gl2d zoom speed with cartesian behavior [#2041]

### Fixed
- Fix numerous `restyle` and `relayout` bugs [#1999]
- Fix handling of extreme off-plot data points in scatter lines [#2060]
- Fix `hoverinfo` array support for `scattergeo`, `choropleth`,
  `scatterternary` and `scattermapbox` traces [#2055]
- Fix `Plotly.plot` MathJax promise chain resolution [#1991]
- Fix legend double-click trace isolation behavior for graphs with
  `visible: false` traces [#2019]
- Fix legend visibility toggling for traces with `groupby` transforms [#2019]
- Fix single-bin histogram edge case [#2028]
- Fix autorange for bar with base zero [#2050]
- Fix annotations arrow rendering when graph div is off the DOM [#2046]
- Fix hover for graphs with `scattergeo` markers outside 'usa' scope [#2030]
- Fix handling of cross anti-meridian geo `lonaxis` ranges [#2030]
- Fix miter limit for lines on geo subplots [#2030]
- Fix `marker.opacity` handling for `scattergeo` bubbles [#2030]
- Fix layout animation of secondary axes [#1999]
- Fix `sankey` hover text placement for empty `link.label` items [#2016]
- Fix `sankey` rendering of nodes with very small values [#2017, #2021]
- Fix `sankey` hover label positioning on pages that style the
  'svg-container' div node [#2027]
- Fix aggregation transforms restyle calls [#2031]


## [1.30.1] -- 2017-09-06

### Fixed
- Fix shapes on overlaid axes [#1975]
- Correctly clear cartesian axis titles on full axis updates [#1981]
- Make cartesian hover spikes work when no tick labels are present [#1980]

## [1.30.0] -- 2017-08-21

### Added
- Add aggregate transform [#1924]
- Add `constraintext` attribute for bar traces [#1931]
- Add axis `layer` attribute to ternary axes [#1952]
- Add cross-trace matching auto-binning logic to histogram traces [#1944]
- Add `data/layout/config` api to `Plotly.toImage` to generate a static
  graph without having to render an interactive graph first [#1939]
- Add `nameformat` attribute to `groupby` transforms to set pattern by which
  grouped traces are named [#1919]

### Fixed
- Fix hover label exponents [#1932, #1949]
- Fix scatter fill with isolated endpoints [#1933]
- Fix parcoords axis tick scale when `ticktext` is unordered [#1945]
- Fix sankey with 4 multi-links or more [#1934]
- Fix exponent labels beyond SI prefixes [#1930]
- Fix image generation for marker gradient legend items [#1928]
- Fix parcoords image generation when multiple parcoords graphs
  are present on page [#1947]
- Ignore bare closing tags in pseudo-html string inputs [#1926]


## [1.29.3] -- 2017-07-27

### Fixed
- Fix `groupby` / `filter` interactions when filter includes `target` data
  [#1892]


## [1.29.2] -- 2017-07-26

### Fixed
- Add fallback for `ArrayBuffer.isView` fixing gl2d and gl3d rendering
  in environments that don't support it (e.g. RStudio) [#1915]


## [1.29.1] -- 2017-07-25

### Fixed
- Fix axis line rendering when `showticklabels` is false
  (bug introduced in 1.29.0) [#1910]
- Fix histogram auto bin restyle [#1901]
- Fix colorbar edge case that caused infinite loops [#1906]


## [1.29.0] -- 2017-07-19

### Added
- Add touch interactions to cartesian, gl2d and ternary subplots including for
  select and lasso drag modes [#1804, #1890]
- Add support for contour line labels in `contour` and `contourcarpet` traces
  [#1815]
- Add support for select and lasso drag modes on `scattermapbox` traces [#1836]
- Add double click interactions to mapbox subplots [#1883]
- Add reset view and toggle hover mode bar buttons to mapbox subplots [#1883]
- Add support for array `marker.opacity` settings in `scattermapbox` traces
  [#1836]
- Add `namelength` layout and trace attribute to control the trace name's
  visible length in hover labels [#1822]
- Add `cliponaxis` attribute to `scatter` and `scatterternary` traces to allow
  markers and text nodes to be displayed above their subplot's axes [#1861]
- Add axis `layer` attribute with `'above traces'` and `'below traces'` values
  [#1871]
- Add granular `editable` configuration options [#1895]
- Expanded traces generated by transforms now have unique colors [#1830]

### Fixed
- Fix axis line width, length, and positioning for coupled subplots [#1854]
- Fix alignment of cartesian tick labels [#1854]
- Fix rendering and updates of overlaying axis lines [#1855]
- Fix hover for 2D traces with custom colorbar `tickvals` [#1891]
- Fix hover and event data for `heatmapgl` and `contourgl` traces [#1884]
- Fix event data for `pie` and `sankey` traces [#1896]
- Fix drag mode `'pan'`in IE and Edge [#1871]
- Fix bar, error bar and box point scaling on scroll zoom [#1897]
- Fix shading issue in `surface` trace in iOS [#1868]
- Fix lasso and select drag modes for `scatterternary` traces [#1831]
- Fix cases of intersecting `contour` lines on log axes [#1856]
- Safer construction of `popup` click handler [#1888]
- Fix animation of annotations, shapes and images [#1315]
- Fix histogram bin computation when more than 5000 bins are needed [#1887]
- Fix tick label rendering when more than 1000 labels are present [#1898]
- Fix handling of empty `transforms` item [#1829]


## [1.28.3] -- 2017-06-26

### Fixed
- Fix deselect on double-clicking for gl2d traces [#1811]
- Fix `Plotly.purge` for gl2d and gl3d subplots
  (bug introduced in 1.28.0, leading to memory leaks) [#1821]
- Fix hover labels for `ohlc` and `candlestick` traces
  (bug introduced in 1.28.0) [#1808]
- Fix event data for `scattergeo` traces [#1819]
- Fix support of HTML entity number in pseudo-html inputs [#1820]


## [1.28.2] -- 2017-06-21

### Fixed
- Fix IE rendering error (`node.children` doesn't work on SVG nodes in IE) [#1803]


## [1.28.1] -- 2017-06-20

### Fixed
- Fix `scattergl` selected points. Points do not disappear after zoom any more
  in fast mode [#1800]


## [1.28.0] -- 2017-06-19

### Added
- Allow constraints by domain on cartesian axes using new axis attributes:
  `contrain: 'domain'` and `contraintoward` [#1767]
- Add gl3d annotations [#1638, #1786]
- Add support for lasso and select `dragmode` on `scattergl` traces [#1657]
- Add 48 new `scattergl` marker symbols (for total of 56) [#1781]
- Add array support for `hoverinfo` [#1761]
- Add animation support for `fillcolor` attribute [#1722]
- Add `colorscale` attributes to `mesh3d` traces [#1719]
- Add support for target and popup attributes pseudo-html text links [#1726]
- Add per-`direction` updatemenu dropdown arrows [#1792]
- Add `execute` attribute to sliders and updatemenus to skip method calls while
  still triggering associated events [#1700]
- Add `skip` value to the `method` attribute for sliders and updatemenus which
  acts as a no-op [#1699]

### Changed
- Include values of all array attributes in hover/click/select event data
  including `ids` and `customdata` [#1770]
- Make gl2d axis tick labels on-par with SVG versions [#1766]
- Build SVG text nodes directly instead of using `DOMParser` [#1783]
- Rework transform style into array syntax [#1794]
- Recompute hover on click to increase click robustness [#1646]
- Miscellaneous performance improvements including improved bounding box caching
  and adding a few short-circuit [#1772, #1792]

### Fixed
- Fix pan/zoom for layout component linked to `category` axes [#1748, #1791]
- Fix non-`linear` gl3d axis range settings [#1730]
- Fix `ohlc` and `candlestick` when open value equals close value [#1655]
- Fix annotations positioning when MathJax symbols are present [#1788]
- Fix array values in event data for transformed traces [#1717, #1727, #1737]
- Fix relayout event data for gl3d camera interactions [#1732]
- Fix scatter markers and text nodes linked to `ids` ordering on updates [#1709]
- Fix `Plotly.validate` for dynamic enumerated attribute
  (e.g. axis `anchor`, `overlaying`) [#1769]
- Fix pseudo-html handling in sliders, updatemenus, range-sliders,
  range-selectors and carpet traces [#1792]
- Fix annotation bounding box and arrow heads in IE [#1782]
- Fix svg exports in IE for graphs with multiple clip paths [#1740]
- Fix `sankey` positioning in IE [#1723, #1731, #1729, #1735]
- Fix relative links in IE [#1715]
- Suppress render warning in gl3d graphs with error bars [#1718]


## [1.27.1] -- 2017-05-17

### Fixed
- Fix text box positioning on scrolled windows (bug introduced in 1.27.0) [#1683, #1690]
- Fix styling over links in annotation text [#1681]
- Fix `mesh3d` with `vertexcolor` coloring [#1686]
- Fix `sort` transform with set `categoryarray` [#1689]
- Fix `scatter` text node data join [#1672]
- Fix `plot` promise resolution in graphs with layout images in IE11 [#1691]

## [1.27.0] -- 2017-05-10

### Added
- Sankey diagram with new trace type `sankey` [#1591, #1664]
- Add `hoverlabel` trace and layout attributes to customize hover label colors
  and fonts [#1582]
- Add `marker.gradient` attributes for `scatter`, `scattergeo`, `scatterternary`
  and `scattercarpet` traces [#1620]
- Add `sort` transform [#1609]
- Add `preservegaps` `filter` transform attribute [#1589]
- Add `!=` (not equal) `filter` transform operation [#1589]
- Add `labelfont`, `tickfont` and `rangefont` attributes for `parcoords` traces
  [#1624]
- Pass DOM mouse event on `plotly_clickannotations` events [#1652]

### Changed
- Performance optimization for range sliders and Drawing cache [#1585]

### Fixed
- Fix `scattergl` marker symbol positioning (bug introduced in 1.25.0) [#1633]
- Fix gl2d zoom where two clicks would trigger a zoom box (bug introduced 1.26.0) [#1632]
- Fix legend double click handler for `carpet` traces [#1636]
- Fix `restyle` for `scattercarpet` for style attributes with array support [#1641]
- Fix `restyle` for array layout components when more than 10 items are present
  [#1639]
- Fix select-box and lasso selections so that they don't include bad-data items
  [#1656]
- Fix `restyle` for contour `zmin` and `zmax` [#1653]
- Fix `scatter` text node transitions [#1616, #1626]


## [1.26.1] -- 2017-04-21

### Fixed
- Fix `pie` fill opacity [#1615]
- Fix `contour.value` declaration for `contourcarpet` trace [#1612]


## [1.26.0] -- 2017-04-18

### Added
- Carpets plots with new trace types: `carpet`, `scattercarpet` and
  `contourcarpet` [#1595, #1596]
- Axis constraints with new cartesian and gl2d axis attributes `scaleanchor` and
  `scaleratio` [#1522]
- Annotations `width`, `height`, `valign` and `xshift` and `yshift` attributes
  [#1551, #1590]
- Hover text over annotations with `hovertext` and `hoverlabel` attributes
  [#1573, #1590]
- Add `hovertext` attribute to trace types that can show `text` values on graph
  to allow setting hover text independently [#1523]
- Add `spikes` interactions functionality to cartesian subplots [#1461]
- Pass mouse DOM mouse event during `plotly_click`, `plotly_hover` and
  `plotly_unhover` [#1505]
- Add `visible` attribute to cartesian and gl3d axes to easily make them
  disappear [#1595, #1599]
- Make `deleteFrames(gd)` delete all frames [#1531]

### Changed
- Lock down `gl-plot3d` and `matrix-camera-controller` dependencies to include
  latest memory management improvements [#1570]
- Performance improvements for `category` axes [#1544]
- Skip overhead for `showLink` config option is false [#1557]
- Optimize scatter trace sorting on updates [#1555]
- Lock down `gl-scatter2d-sdf` dependency to `1.3.4` while waiting for bug fix
  there [#1572]

### Fixed
- Fix bar sizes of traces with (x,y) `NaN` items [#1519]
- Fix handling of `NaN` items in array-ok attributes for `scattergeo` and
  `scattermapbox` traces [#1538, #1564]
- Fix hover label position for `bar` traces with set `width` [#1527]
- Fix `restyle` for attribute containers [#1536]
- Fix `restyle` exception for `scattergl` traces with no `y` data [#1567]
- Fix animation of text nodes that contain `<br>`s [#1602]
- Fix `toImage` for mapbox subplots when access token is set in the config
  options [#1598]
- Emit `plotly_hover` on `pie` traces when `hoverinfo: 'none'` [#1505]
- Pass trace info during `plotly_click` on `pie` traces [#1505]
- Pass through the wheel event if the scrollbar is at the very top or bottom
  [#1588]


## [1.25.2] -- 2017-03-31

### Fixed
- rm `const` token from dist bundles that depend on `big-rat`,
  see https://github.com/rat-nest/big-rat/pull/4 for more details.


## [1.25.1] -- 2017-03-28

### Fixed
- Fix `restyle` for `scattergl` traces with array `marker.size` (bug introduced
  in `1.25.0`) [#1521]
- Fix `relayout` for `histogram2dcontour` traces [#1520]
- Do not unnecessary mutate `parcoords` full trace objects when computing
  line color and colorscale [#1509, #1508]
- Do not unnecessary coerce trace opacity in `parcoords` traces [#1506]


## [1.25.0] -- 2017-03-20

### Added
- Double click handler on legend items to isolate 1 traces / group on graph
  [#1432]

### Changed
- Use signed distance fields (SDF) method to render heterogeneous `scattergl`
  traces improving performance [#1398]
- Improve first-render performance in `scattergl` traces by only creating
  visible objects [#1444]
- Use `color-rgba` instead of `tinycolor2` to convert plotly color definitions to
  WebGL buffers improving performance for gl3d and gl2d traces [#1443]
- Bump `uglify-js` minifier to version `2.8.12` [#1450]

### Fixed
- Fix 3D trace ordering on visibility toggle [#1466]
- Fix gl2d trace ordering on visibility toggle [#1444]
- Fix autorange routine for bar traces [#1475]
- Fix shapes and images referencing a missing subplot [#1481]
- Ensure array attributes can be restyled in all situations [#1488]
- Fix XYZ-column-to-2D-z convert routine for columns containing nulls [#1491]
- Fix range slider display when anchored to log axes [#1472]
- Make sure all trace types can be deleted from range sliders [#1472]
- Let the `parcoords` object tree be garbage collected on `restyle` [#1479]
- Bring back support for histogram colorscales (bug introduced in `1.21.3`)
  [#1500]
- Support all axis types for clicktoshow annotations [#1497]
- Fix 3D margin relayout calls (bug introduced in `1.24.1`) [#1494]
- Fix `relayout` when trying to update empty axis containers (bug introduced in
  `1.24.0`) [#1494]


## [1.24.2] -- 2017-03-10

### Fixed
- Fix removal of last annotation or shape [#1451]
- Fix shape and image clip path removal [#1453]
- Fix overdrawing of data-referenced images [#1453]
- Make handling of `layer: 'below'` shape more robust [#1453]
- Allow multiple `parcoords` dimensions with the same label [#1457]


## [1.24.1] -- 2017-03-07

### Fixed
- Ensure that calling restyle or relayout in a `plotly_unhover` handler does not
  result in an infinite loop (bug introduced in 1.24.0) [#1448]
- Ensure autorange routine is bypassed when axis range is set (bug introduced in
  1.24.0) [#1425]
- Fix annotations dragging in editable mode (bug introduced in 1.22.0) [#1441]
- Show correct curve number in gl2d hover data [#1427]
- Clear parcoords canvas specially if no panel exist [#1440]
- Fix parcoords to render last block increment [#1447]
- Axis refs in hover data are not plagued by circular references [#1431]


## [1.24.0] -- 2017-02-27

### Added
- Add `parcoords` trace type (parallel coordinate plots) [#1256]
- Add support for multiple range sliders [#1355]
- Add `'aitoff'` and `'sinusoidal'` geo projection types [#1422]
- Implement `scene.dragmode: false` to disable drag interaction on 3D subplots
  [#1377]
- Add `showAxisDragHandles` and `showAxisRangeEntryBoxes` configuration options
  [#1389]
- Add `customdata` attribute to scatter traces to add custom data to scatter SVG
  nodes [#1379]

### Changed
- Consistent handling of array containers during `relayout` [#1403]
- Improve hover for `choropleth` traces [#1401]
- Make range slider handles and mask crispier [#1409]
- Bump `country-regex` dependency to `1.1.0` [#1392]

### Fixed
- Fix 3D on iOS devices [#1411]
- Fix `surface` trace opacity scaling [#1415]
- Fix hover data in animations [#1274]
- Fix annotations edit when dragging from one axis to another [#1403]
- Fix 3D hover labels for date axes [#1414]
- Deleting cartesian subplots now clear their corresponding axis titles [#1393]
- Fix hover for xyz column `heatmap` trace `'text'` [#1417]
- Fix `scattermapbox` lines with trailing gaps [#1421]
- Make `restyle`, `relayout` and `update` not mutate input update objects [#1376]
- Fix race condition in gl2d `toImage` [#1388]
- Fix handling of `Virgin Islands` country name [#1392]
- Fix `Plotly.validate` for `colorscale` attributes [#1420]


## [1.23.2] -- 2017-02-15

### Changed
- Bower installs now fetch un-minified `dist/plotly.js` bundle [#1373]
- Add package to packagist repository [#1375]


## [1.23.1] -- 2017-02-13

### Fixed
- Fix `relayout` for `scene.camera` values [#1364]
- Fix scaling on axis corner drag interactions for `bar` traces [#1370]
- Allow `bar` and `histogram` traces to coexist on same subplot [#1365]
- Fix `bar` position computations when placeholder traces are present [#1310]
- Fix auto-axis-type routine for data-less `candelestick`traces [#1359]


## [1.23.0] -- 2017-02-06

### Added
- Add scrollbox to long dropdown updatemenus [#1214]

### Fixed
- Multiple IE9 fixes [#1332]
- Ensure that `plotly_afterplot` is fired before `Plotly.plot` promise is
  resolved [#1342]
- Fix exception when dragging graphs with empty text labels [#1336]
- Fix exception when creating empty `ohlc` and `candlestick` traces [#1348]
- Fix `editable: true` legend items logic for `ohlc` and `candlestick` traces [#1349]
- Fix restyle for contour traces in cases where autocontour is defaulted to true
  [#1338]
- Fix edge case in axis label tick assignments [#1324]
- Fix vanishing titles text in `editable: true` [#1351]
- Fix 3D thumbnail image generation [#1327]


## [1.22.0] -- 2017-01-19

### Added
- Add `cumulative` histogram attributes to generate Cumulative Distribution
  Functions [#1189]
- Add `standoff` attribute for annotations to move the arrowhead away from the
  point it's marking [#1265]
- Add `clicktoshow`, `xclick` and `yclick` attributes for annotations to
  show/hide annotations on click [#1265]
- Support data-referenced annotation in gl2d subplots [#1301, #1319]
- Honor `fixedrange: false` in y-axes anchored to xaxis with range slider
  [#1261]
- Add fallbacks for IE9 so that all cartesian traces can render without any
  polyfill [#1297, #1299]

### Changed
- Adapt plot schema output for plotly.py 2.0 [#1292]
- Bump `mouse-change` dep to `^1.4.0` [#1305]
- Improve performance in `visible` toggling for `scattergl` [#1300]

### Fixed
- Fix XSS vulnerability in trace name on hover [#1307]
- Fix ternary and geo subplot with `visible: false` first trace [#1291]
- Fix opacity for `mode: 'lines'` items in legend [#1204]
- Fix legend items style for bar trace with marker arrays [#1289]
- Fix range slider svg / pdf and eps image exports [#1306]
- Fix scattergl `visible: false` traces with empty data arrays [#1300]
- Fix a few contour trace edge cases [#1309]
- Updatemenus buttons now render above sliders [#1302]
- Add fallback for categorical histogram on linear axes [#1284]
- Allow style fields in sub and sup text [#1288]


## [1.21.3] -- 2017-01-05

### Fixed
- Fix zoom behavior on transformed traces [#1257]
- Compute axis auto-range after transform operation [#1260]
- Fix contour trace blowing up on zoom [#591]
- Fix `scattermapbox` and `scattergeo` handling of blank strings `text` [#1283]
- Lock `mouse-change@1.3.0` fixing 3D hover labels on fresh `npm install`
  [#1281]


## [1.21.2] -- 2016-12-14

### Fixed
- Fix handling of calendar in `filter` transforms where distinct calendars can
  now be set for both the `target` and `value` [#1253]
- Make `Plotly.addFrames` skip over non-plain-objects inputs [#1254]
- Make `Plots.graphJson` aware of `frames` [#1255]


## [1.21.1] -- 2016-12-14

### Fixed
- Fix `ms2datetime` routine for Chinese calendar [#1252]
- Fix `tickformat` for world calendars [#1252]


## [1.21.0] -- 2016-12-12

### Added
- Bar labels via `text` and `textposition` [#1159]
- Add support for 16 non-gregorian calendars for date inputs and display [#1220,
  #1230, #1237]
- Add support for ISO-8601 timestamps [#1194]
- Extend histogram bin auto-shifting algorithm to date axes [#1201]
- Trace type `heatmapgl` is now included in the main plotly.js bundle [#1197]

### Changed
- Linearize date coordinates using UTC rather than local milliseconds [#1194]

### Fixed
- Fix wrongly computed date positions around daylight savings time [#1194]
- Fix erroneous traces in multi-subplot layout containing fill-to scatter
  traces (and plotly.py violin plots) [#1198]
- Fix clip path URL on pages with query hashes [#1203]
- Ensure that numeric frame name are handle correctly [#1236]
- Fallback for manual manipulation of slider/frames [#1233]


## [1.20.5] -- 2016-11-23

### Fixed
- Fix 1.20.0 regression in handling numerical strings including commas and spaces
  [#1185]
- Fix 1.20.0 regression involving date histograms [#1186]
- Fix numerous  tickvals` and `ticktext` edge cases [#1191]


## [1.20.4] -- 2016-11-21

### Fixed
- Fix metaKeys field `PlotSchema.get()` output

## [1.20.3] -- 2016-11-21

### Fixed
- Remove infinite loop when plotting 1-pt `scattergl` traces [#1168]
- Fix updatemenu bug where the wrong button was set to active [#1176]
- Fix `addTraces` when called with existing traces as input [#1175]


## [1.20.2] -- 2016-11-17

### Fixed
- Fix hover labels in stacked bar charts [#1163]
- Fix mode bar zoom buttons on date axes [#1162]


## [1.20.1] -- 2016-11-16

### Fixed
- Fix annotation positioning on categorical axes [#1155]


## [1.20.0] -- 2016-11-15

### Added
- Allow date string inputs for axis ranges, `tick0`, `dtick`, annotation / image
  positions, histogram bins [#1078, #1150]
- Add special `dtick` values for log axes [#1078]
- Add `visible` attribute to annotations, shapes and images items [#1110]
- Expose events on slider start/change/end [#1126]
- Expose event on updatemenu button click [#1128]
- Allow custom transform module to have supply layout default handler [#1122]

### Changed
- Increase `scattergl` precision [#1114]
- Use `topojson-client` to convert topojson to geojson [#1147]

### Fixed
- Fix hover labels for multi-trace `scattergl` graphs (bug introduced in
  `1.18.0`) [#1148]
- Fix date format on hover on full hour [#1078]
- Fix bar labels for non-zero `base` values [#1142]
- Scatter colorscale now yield correct colors when cmin and cmax ashow re equal
  [#1112]
- Fix `filter` transform for categorical `target` arrays with range operations
  [#1120]
- Make sure frames with `null` values clear array containers [#1118]
- Fix animations involving trace `opacity` [#1146]
- Fix fallback for non-animatable trace modules (bug introduced in `1.18.1`)
  [#1141]
- Fix race condition in animation resolution when coupled with `relayout`
  [#1108]
- Enforce casting requested frame names to strings [#1124]
- `Plotly.animte` no longer breaks when passing `null` frames [#1121]
- `Plotly.PlotSchema.get` now correctly list rangeslider and rangeselector under
  `xaxis` only [#1144]
- `Plotly.relayout` correctly updates arbitrary layout attributes [#1133]


## [1.19.2] -- 2016-11-02

### Fixed
- Fix hover label positioning on bar traces [#1107]


## [1.19.1] -- 2016-10-27

### Fixed
- Fix dist bundles [#1094]


## [1.19.0] -- 2016-10-27

**Unpublished on npm and CDN** due to broken dist bundles.

### Added
- Add two-argument `Plotly.plot` call signature [#1014]
- Add two-way binding functionality to updatemenus and sliders [#1016]
- Add `width`, `base` and `offset` attribute to bar trace [#1075]
- Add `fromcurrent` and `direction` animation options [#1087]
- Add ability to filter by arbitrary array [#1062]

### Changed
- Rename `filtersrc` filter transform attribute `target` (with
  backward-compatible map) [#1062]
- Bump `sane-topojson` requirement to 2.0.0. New topojson dist files fix
  the Michigan state border [#1077]
- scattergl now handles higher resolution dates [#1033]
- Improve error messages in `Plotly.animate` [#1088]

### Fixed
- `Plotly.newPlot` now respect user-defined layout `height` and `width` [#537]
- Fix dendrogram cartesian axis layers [#1063]
- Fix RGBA colorscale handler for contour [#1090]
- Fix gl2d axis title positioning [#1067]
- Fix gl2d multi-line axis tick labels display [#1087]
- Fix performance deficit of scattergl trace type with date coordinates [#1021]
- Fix ohlc trace offset computation [#1066]
- Fix ohlc and candlestick default trace names [#1073]
- Make `Plotly.animate` work with frames container array containers (e.g
  annotations) [#1081]
- Make `restyle` and `relayout` consistently remove items in array containers
  when called with value argument `null` [#1086]


## [1.18.1] -- 2016-10-18

### Fixed
- Fix cartesian subplot resize [#1049]
- Fix cartesian interactivity after click [#1049]
- Fix `scattergeo` traces with not-found country names [#1046]
- Honor `'name'` hoverinfo flag in `ohlc` traces [#1050]
- Fix animation merging for frames including array containers [#1041. #1048]
- Fix `requestAnimationFrame` polyfill for script-tag imports [#1039]


## [1.18.0] -- 2016-10-13

### Added
- Add `ohlc` and `candlestick` trace types [#1020]
- Add slider layout component [#986, #1029]
- Add filter and groupby transforms [#936, #978]
- Add support for all cartesian trace types and subplot configuration in
  range slider range plots [#946, #1017]
- Add update menus `'buttons'` type, `direction` and `showactive` options [#974]
- Add `pad` attributes to update menus for more intuitive positioning [#989]
- Add `plotly_hover`, `plotly_click` and `plotly_unhover` event emitters
  on gl2d subplot [#994]
- Make `'text'` mode  scatter traces animatable [#1011]
- Add picking for `'line'` mode scattergeo traces [#1004]
- Add support for `fill: 'toself'` in scattergeo traces [#1004]

### Changed
- Allow null / undefined frames in `Plotly.addFrames`[#1013]

### Fixed
- Allow range sliders to properly relayout [#962]
- Fix handling of `NaN` gaps in range slider range plots [#946, #1017]
- Properly skip over `NaN`s in scattergeo data arrays [#1004]
- Fix handling graph div with style `visibility: inherit` [#990]
- Fix `Plotly.update` for updates that require a full data + layout replot [#971]
- Let update menus use `Plotly.update` method value [#972]
- Fix tickfont relayout call on 3D subplot [#982]


## [1.17.3] -- 2016-09-21

### Fixed
- Fix scatter text node translations on range relayout [#956]
- Fix `Plotly.restyle` for scatter trace `mode` [#956]
- Fix color mapping discontinuity in `surface` trace with circular colorscale
  [#959]
- Fix `Plotly.redraw` when scatter traces are added to the graph [#947]
- Fix double click side-effects in gl2d plots [#958]
- Emit event animatingframe frame during animations [#953]


## [1.17.2] -- 2016-09-12

### Fixed
- 3D colored axis backgrounds and axis labels are rendered again (bug introduced
  in 1.17.0) [#931]


## [1.17.1] -- 2016-09-09

### Fixed
- Restyling `visible` to `false` on all scatter traces present on a graph
  is now working again (bug introduced in 1.17.0) [#920]
- Relayouting `paper_bgcolor` now properly propagate to legend
  and updatemenu `bgcolor [#921]
- Mapbox plot routine no longer make request to public Mapbox server
  when linked to a Mapbox Atlas instance [#919]


## [1.17.0] -- 2016-09-07

### Added
- Add support for animations for scatter trace [#802]
- Add frames and animate API -> `Plotly.animate`, `Plotly.addFrames` and
  `Plotly.deleteFrames` [#802]
- Add `Plotly.update` method which can perform data and layout update in one
  call [#875]
- Add `pointcloud` gl2d trace type [#850, #869]
- Add `xgap` and `ygap` to heatmap traces to define space between heatmap bricks
  [#868]
- Add `separatethousands` axis attribute which determines whether four-digit
  numbers are separated or not [#848]
- Add `'skip'` value to trace `hoverinfo` corresponding to traces transparent to
  the hover picking routine [#851]
- Add support for trace opacity in `toself` filled trace [#896]
- Add global transform config option [#852]
- Add `requestAnimationFrame` to `dist/`[#904]

### Changed
- Explicitly skip undefined props on `restyle` and `relayout` [#844]
- Removed a few circular dependency patterns [#833, #837, #845, #878]

### Fixed
- Fix legend trace toggle background attributes on restyle [#909]
- Make 'yanchor' default be its intended value of `'top'` [#894]
- Fix box plot jitter algorithm when IQR = 0 [#915]
- Fix box plot jitter algorithm when data range is 0 [#915]
- Fix mapbox event firing duplicates [#901]
- Fix mapbox visible false traces handling on first draw [#900]
- Avoid draw buffer to display buffer copy in gl2d plots [#843]
- Do not extend data array on event emission [#842, #866]
- Make `Plotly.redraw` throw an error when called on non plotly graph div [#907]
- Make `plotly.min.js` work when injected in Require.js environment [#914]


## [1.16.3] -- 2016-08-23

### Fixed
- Fix SVG exports for graphs with layout images [#846]
- Properly handles duplicate categories in non-default `categoryorder` [#863]
- Fix range selector position logic for overlaying axes [#873]
- Autorange is now properly computed for heatmapgl and contourgl traces [#855,
  #874]
- Trace toggling via legend preserves axis ranges in gl2d plots [#855, #874]
- Bump `mapbox-gl` dependency to 0.22.0 [#867]


## [1.16.2] -- 2016-08-09

### Fixed
- Fix decoding for the supported HTML entities (bug introduced in 1.16.0) [#835]
- Fix layout images position on subplots [#831]
- Fix a few cartesian autorange edge cases [#813]


## [1.16.1] -- 2016-08-05

### Changed
- Drop support for plotting in child windows which broke `Plotly.plot` in
  some numerous browsers (e.g. FF46, FF47, FF48) [#829]


## [1.16.0] -- 2016-08-04

### Added
- Add `updatemenus` (aka dropdowns) layout components [#770]
- Trace type `scattermapbox` is now part of the main bundle [#816]
- Add support for `plot` in child windows [#764, #806]
- Horizontal legends with many items are now wrapped into multiple lines [#786]
- Active color of range selector button is now configurable via `activecolor`
  [#796]
- Add support for mapbox style JSON [#795]

### Changed
- Promise queue is cleared on `restyle` and `relayout` instead of in
  the `plot` catch handler (which ate up user-defined catch handlers as of
  1.15.0) [#776, #789]
- Improve performance in `convertToSVG` step [#791, #804]

### Fixed
- Skip over non-container arrays in relink private key step (performance bug
  introduced in 1.15.0) [#817]
- Categorical heatmap traces with insufficient brick are now functional again
  (bug introduced in 1.14.0) [#783, #812]
- Fix `Plotly.validate` for info and container array attributes [#814, #819]
- Range selector buttons can now be deleted via `relayout` [#793]


## [1.15.0] -- 2016-07-25

### Added
- Add `Plotly.validate` method [#697]
- Add support for transforms plugins modules [#499]
- Some partial bundles are now distributed  in `dist/` [#740]
- Mapbox access token can now be set in `layout.mapbox` [#729]
- Undo/Redo queue length is now configurable via configuration option
  `queueLength` [#737]

### Changed
- Improve performance in gl2d request animation frame loop [#731]
- Improve `Lib.extendDeep` performance for primitive arrays [#732]
- Improve potential XSS input in `text` fields [#736]
- Improve scaling on scroll zoom for scatter lines and markers [#761, #762]

### Fixed
- `toImage` pixel output for gl2d graphs are now scaled properly [#735]
- `scattermapbox` marker size and color arrays are now correctly converted when
  they include repeated values [#747]
- Fix scatter3d marker line color inheritance [#754]
- `text` fields can now support link with query params `=` and `&` [#736]
- Fix Chrome 50 bug where tester svg blocked other DOM nodes [#745]


## [1.14.2] -- 2016-07-11

### Fixed
- `Plotly.newPlot` correctly clears all present WebGL contexts [#724]
- Bar traces with `layout.bargap` 0 and unset `marker.line.width` are functional
  again (bug introduced in 1.3.0) [#709]
- Stacked bar traces now correctly set the first bar position when leading gaps
  are present (bug introduced in 1.11.0) [#716]
- Bar traces with `layout.barmode` relative now correctly compute the bar sum of
  the first position when positive and negative values are present [#723]
- Event `plotly_relayout` is emitted upon pan / zoom on a mapbox subplot [#727]
- Lasso and select box drag modes now work with fixed ranged axes [#728]
- gl2d trace objects are purged when their parent scenes are destroyed [#724]


## [1.14.1] -- 2016-06-28

### Fixed
- Fix colorscale restyle calls on heatmap traces (bug introduced in 1.14.0)
  [#694]
- Hover after zoom / pan is now functional again in ternary plots (bug
  introduced in 1.14.0) [#688]
- Fix mapbox layer relayout starting from invisible layer [#693]
- Hover labels when `hoveron: 'fills'` are now constrained to the viewports
  [#688]
- Fix `surface` countours description [#696]
- Fix `mapbox.layers.line` description [#690]


## [1.14.0] -- 2016-06-22

### Added
- Attribute `line.color` in `scatter3d` traces now support color scales [#617]
- Annotations tail positions can now be set in data coordinates via the new
  `axref` and `ayref` attributes [#610]
- Attribute `hoveron` is added for `scatter` and `scatterternary` traces which
  adds the option to show hover labels about fill regions (instead of simply of
  about data points) [#673]
- Layout shapes can now be moved and resized (except for 'path' shapes) in
  editable contexts [#660]

### Changed
- Numerous additions and changes where made to the mapbox layout layers
  attributes (introduced in 1.13.0). Namely, `circle` and `symbol` layer type
  where added. Note that some style attributes have been renamed to match the
  mapbox-gl API more closely. [#681]

### Fixed
- Off-screen heatmap traces are properly deleted (bug introduced in 1.5.1)
  [#655]
- Hover labels for multi-heatmap subplot is functional again (bug introduced in
  1.4.0) [#655]
- Heatmap x/y brick generation is now functional for 0 and 1 item columns [#651]
- Multiple layout images can now shared the same image source [#672]
- Updating legend border and bgcolor attribute now works via `Plotly.relayout`
  [#652]
- Dragmode 'select' and 'lasso' no longer throw exception when selecting
  `legendonly` traces [#644]
- Ternary plots now respect the `staticPlot` config option [#645]
- Descriptions for axes `nticks` and contour traces `ncountours`now properly
  describe their behavior [#662]


## [1.13.0] -- 2016-06-13

### Added
- Beta version of the `scattermapbox` trace type - which allows users to create
  `mapbox-gl` maps using the plotly.js API. Note that `scattermapbox` is only
  available through custom bundling in this release [#626]
- Configurable log levels. All plotly.js logging is now turned off by default.
  Use `Plotly.setPlotConfig({ logging: /* 1 or 2 */ })` to (1) display warnings
  only or (2) all logs [#590]
- Thorough `mesh3d` attribute descriptions [#593]

### Changed
- Generalize hover picking routine (to make more easily re-usable for other plot
  types) [#575, #631]

### Fixed
- Fix `Plotly.toImage` and `Plotly.downloadImage` bug specific to Chrome 51 on
  OSX [#604]
- Fix `Plotly.downloadImage` for `svg` types [#604]
- Fix `scattergl` opacity and connectgaps for `'lines'` mode [#589]
- Make legend scroll bar keep its position after redraws [#584]
- Properly handle axis-reference shapes on overlaid axes [#612]
- Fix `Plotly.relayout` calls for `layout.images` in `{ astr: val }` notation
  [#624]
- Bring back correct default value for `lightposition` in surface traces (bug
  introduced in 1.12.0) [#571]
- Fix typos in contours descriptions in contour traces [#583]
- Fix typos in `axis.ticktext` description [#607]
- Fix ambiguities in histogram `nbin` descriptions [#623]


## [1.12.0] -- 2016-05-26

### Added
- Light positions, face normal epsilon and vertex normal epsilon are now
  configurable in `mesh3d` traces [#556]
- Light position is now configurable in `surface` traces [#556]
- `surface` and `mesh3d` lighting attributes are now accompanied with
  comprehensive descriptions. [#556]

### Changed
- Plot modules are now allowed to have their own `toSVG` method for
  subplot-specific to-svg logic [#554]

### Fixed
- gl2d plots are now functional in `core-js` environments (e.g. in babel es6
  presets) [#569]
- gl2d replot calls from a blank plot are now functional [#570]
- SVG graph config argument `scrollZoom` is now again functional (bug introduced
  in v1.10.0) [#564]
- `layout.separators` is now honored in pie text labels [#547]
- Heatmap `zsmooth` value `'fast'` is now functional for arbitrary layout widths
  [#548]
- Range sliders now respond to all axis range relayout calls [#568]


## [1.11.0] -- 2016-05-17

### Added
- Add top-level methods `Plotly.toImage` to convert a plotly graph to an image
  data URL (svg, png, jpg, and webp are supported) and `Plotly.downloadImage` to
  download a plotly graph as an image [#446]
- Add the ability to add arbitrary images loaded from a url to a plot's layout
  [#525]
- Add the option of making legend span horizontally [#535]
- Add `connectgaps` attribute to `scattergl` traces [#449]
- Add new 'relative' bar mode which stacks on top of one another with negative
  values below the axis, positive values above [#517]
- Add support for the 'winkel tripel' projection in geo subplots [#492]
- Event `plotly_relayout` is now emitted on gl2d subplot drag/pan/zoom
  interactions [#466]
- Add support for fill coloring in `contourgl` traces [#522, #543]

### Changed
- Cartesian on-hover routine is now uses a 50ms interval between search calls
  instead of 100ms for smoother displaying hover labels [#514]
- [Internal change] fullLayout `_has` fields are replaced by a `_has` method
  which checks if a particular plot type is present on a graph [#491]

### Fixed
- Bar widths of traces with null coordinates are now correctly computed [#542]
- Error bar spans on bar traces with null coordinates are now correctly computed
  [#542]
- All promises spawn in `Plotly.plot` are now guaranteed to be resolved before
  the final resolve [#521]
- Restyling `scatterternary` data attributes is now working [#540]
- Error bar of 0 length in log axes are not included in hover labels (instead of
  showing `NaN`s) [#533]


## [1.10.2] -- 2016-05-05

### Fixed
- Subplot and range slider clip paths are now functional in AngularJS [#509]
- `relayout` call involving axis `categoryorder` and `categoryarray` are now
  working [#510]
- Annotation drag interactions in `editable: true` mode are now functional (bug
  introduced in 1.10.0)[#505]
- Improved attribute description for shape `xref` and `yref` [#506]


## [1.10.1] -- 2016-05-02

### Fixed
- Resizing a graph (e.g. via `Plotly.relayout` or Plotly.Plots.resize)
  properly updates the plot area clip paths (bug introduced in 1.10.0) [#490]
- `Plotly.Snapshot.toSVG` is now functional again in IE11 and old version of
  Chrome and FF (bug introduced in 1.10.0) [#489]
- Hover labels of superimposed traces when 'hovermode' is set to 'closest' are
  properly displayed (bug introduced in 1.10.0) [#495]
- Surface contour highlights are toggleable [#459]
- Surface contour highlights style attributes are lower cased [#459]
- Zoom overlay are drawn over shapes [#448]
- Legend are draggable in `editable: true` contexts (bug introduced in 1.6.0)
  [#487]
- Legend scroll box are drawn outside the legend [#478]


## [1.10.0] -- 2016-04-12

### Added
- Beta version of two new 2D WebGL trace types: `heatmapgl` and `contourgl`
  [#427, #434]
- Two new `scatter` line `fill` modes: `'toself'` and `'tonext'` [#462]
- Fills for `scatterternary` traces are now supported [#462]
- Configurable axis category ordering with `categoryorder` and an optional
  `categoryarray` axis attributes [#419]
- Configurable shapes layer position with shape attribute `layer` [#439]
- Configurable range slider range (so that the initial xaxis range can differ
  from the range slider range) [#473]

### Changed
- Nested SVG elements in SVG image exports are removed, making the to-image mode
  bar button work in RStudio and SVG export compatible with Adobe Illustrator
  [#415, #454, #442]
- Use `country-regex` npm package instead of hard-coded file of ISO-3 code to
  country regular expressions [#461]

### Fixed
- Legend positioning does not break on negative `x` and `y` settings (bug
  introduced in 1.6.0) [#417]
- Shapes are properly deleted when clearing all of them at once (bug introduced
  in 1.9.0) [#465]
- Promise are return after first render in gl3d and gl2d plots [#421]
- Click and hover events are properly triggered when trace `hoverinfo` is set to
  `'none'` [#438]
- `plotly_unhover` events is now properly triggered on geo trace types [#429]
- `plotly_relayout` event is now properly triggered on gl3d set camera [#458]
- RGBA colors are now supported in `scatter` and `bar` custom color scales
  [#422]
- Range slider is now functional with `x0`/`dx` data [#441]
- Range slider is now compatible with mode bar axis range buttons and double
  click [#471]


## [1.9.0] -- 2016-04-12

### Added
- Ternary plots with support for scatter traces (trace type `scatterternary`) [#390]

### Fixed
- Toggling the visibility of `scatter3d` traces with `surfaceaxis` now works [#405]
- `scatter3d` traces with `surfaceaxis` turned now feature real 3D opacity [#408]
- `plotly_unhover` is now properly triggered over `pie` traces [#407]
- Better grammar in `scatter` attribute descriptions [#406]


## [1.8.0] -- 2016-04-04

### Added
- Range slider functionality for scatter traces [#336, #368, #377]
- Range selector functionality for cartesian and gl2d plot types [#373]
- Support for connectgaps in scatter3d traces [#361]

### Fixed
- gl2d toImage mode bar button is now again functional (bug introduced in 1.7.0) [#369]
- IE / Edge handling of getComputedTextLength is now functional [#376]
- improved marker color attribute description [#366]


## [1.7.1] -- 2016-03-30

### Fixed
- Legend dimensions are correctly updated (bug introduced in 1.7.0) [#365]
- Friction between cartesian double-click and drag interactions is reduced [#355]
- Ultra-zoomed svg line paths are correctly computed [#353]
- Initial axis ranges are no longer reset on data-updating restyle calls [#351]
- Events now work in jQuery no-conflict scopes (bug introduced in 1.7.0) [#352]


## [1.7.0] -- 2016-03-22

### Added
- Custom surface color functionality (for 4D plotting) is added to surface traces [#347]
- Top-level `Plotly.purge` method (which returns the graph div in its
  pre-Plotly.plot state) is added [#300]
- Support for custom hover labels on multiple subplots in `Plotly.Fx.hover` is
  added [#301]

### Fixed
- Error bars node ordering now respect the trace ordering [#343]
- Geo traces nodes now update properly on streaming plot calls [#324]
- jQuery check in event module is made more robust [#328]


## [1.6.3] -- 2016-03-07

### Fixed
-  Argument parsing for vertex and face colors of mesh3d traces is now
   functional [#287]


## [1.6.2] -- 2016-03-03

### Fixed
- SVG overflow property is now properly set for IE11 [#305, #306]
- Hover labels associated with `text` arrays with falsy values are properly
  skipped over [#310]
- Snapshot routines now strip browser-only user-select style attributes [#311]


## [1.6.1] -- 2016-03-01

### Fixed
- Legend scroll bars are no longer invalid SVG elements (bug introduced in 1.6.0) [#304]
- Colorscale YlGnBu and YlOrRd are now properly identified [#295]


## [1.6.0] -- 2016-02-29

### Added
- SVG cartesian, 3D, geographic maps and pie charts can now coexist on the same
  graph [#246, #258, #289]
- Legends with long item lists are now scrollable (instead of being cropped)
  [#243]
- Event `plotly_deselect` is now emitted after double-clicking in `select` and
  `lasso` drag modes.
- Event `plotly_doubleclick` is now emitted after double-clicking on SVG cartesian
  graphs in `zoom` and `pan` drag modes.
- Layout attributes `dragmode` and `hovermode` can now be set individually in
  each scene [#258]
- `Plotly.Plots.resize` now returns a promise. [#253, #262]

### Fixed

- `Plotly.deleteTraces` now properly deletes the last trace of a cartesian
  subplot [#289]
- `Plotly.deleteTraces` now works on heatmap, contour, pie, surface, mesh3d and
  geo trace types [#289]
- `Plotly.deleteTraces` now properly delete color bars associated with deleted
  traces
- Clearing cartesian axes via `relayout` no longer results in an uncaught error
  [#289]
- Events `plotly_hover`, `plotly_unhover` and `plotly_click` are properly
  emitted on 3D graphs [#240]
- Null and undefined categories are properly skipped over [#286]
- Hover labels on 3D graphs are now properly hidden when `hovermode` is set to
  false [#258]
- Multi-scene 3D graphs now set their camera position via their own scene
  attributes [#258]
- Toggling `hovermode` on 3D graphs no longer resets the scene domain [#258]
- Resetting the camera position on scenes where the `camera` attribute was
  supplied no longer results in an uncaught error [#258]
- Axis attributes `hoverformat`, `tickprefix`, `ticksuffix` are honored even
  when `showticklabels` is set to false [#267]
- Config option `doubleClick` set to `'reset'` now properly handles auto-ranged
  axes [#285]


## [1.5.2] -- 2016-02-10

### Fixed
- Fix geo trace visibility toggling (bug introduced in 1.5.1) [#245]


## [1.5.1] -- 2016-02-01

### Fixed
- Scattergeo and choropleth now correctly fire hover and click events [#215]
- Heatmap and contour traces are redrawn in the correct order [#194]
- Early returns in `Plotly.plot` now correctly return Promise rejections [#226]
- Soon to be deprecated `SVGElement.offsetParent` calls are removed [#222]
- Geo zoom in button is now correctly titled `Zoom in` [#219]
- All attribute description are correctly stripped from the dist files (bug
  introduced in 1.5.0) [#223]
- Insecure dev dependencies `ecstatic` and `uglify-js` are bumped [#225]
- Outdated karma-browserify dev dependency is bumped [#229]


## [1.5.0] -- 2016-01-22

### Added
- Modularize the library (first iteration). Trace types can be required in
  one-by-one to make custom plotly.js bundles of lesser size. [#180, #187, #193, #202]

### Changed
- Remove json assets from the js source files (to better support Webpack bundling) [#183]
- Update d3, tinycolor2, topojson dependencies [#195]
- Improve `'colorscale'` attribute description [#186]

### Fixed
- Fix pan mode drag delay [#188]
- Make `Plotly.deleteTrace` handle big-indices-array properly [#203]


## [1.4.1] -- 2016-01-11

### Fixed
- Click events work properly after being broken in 1.4.0 [#174]


## [1.4.0] -- 2016-01-11

### Added
- Lasso and rectangular selection interactions for scatter-marker and scatter-text traces [#154, #169]
- Un-gitignore css and svg font built files, removing post-install step and
  dependency on node-sass [#164]

### Changed
- Clean up Pie, Box and Choropleth trace module [#158, #159, #165]

### Fixed
- Surface traces correctly handle `zmin` and `zmax` attributes [#153]
- Pie trace correctly trigger hover events [#150]


## [1.3.1] -- 2016-01-04

### Fixed
- Fix `Plotly.addTraces` for gl3d and gl2d trace types [#140]


## [1.3.0] -- 2015-12-21

### Added
- Trigger click event on pie charts [#111]
- Add attribute descriptions for mesh3d trace type [#115]

### Changed
- [Internal] Trace module have now a 1-to-1 correspondence with trace type [#124]
- [Internal] Remove circularize import in colorbar and colorscale module [#136]

### Fixed
- Fixed zeroline behavior in gl3d plots [#112]
- Axis `tickangle` consistently used degrees in both svg and gl plots [#131]
- `Plotly.newPlot` destroy mode bar before plotting new one [#125]
- `Plotly.newPlot` removes all event listeners from graph div [#117]
- Fixed attribute description for scatter3d marker opacity [#114]


## [1.2.1] -- 2015-12-14

### Changed
- Improve XSS check in anchor href [#100]

### Fixed
- Fix Fifefox 42 to-image failures [#104]
- Fix error bar with type 'sqrt' logic making them visible without
  specifying the 'value' field [#91]
- Fix cartesian zoom/drag cover attributes for Firefox 31 [#92]


## [1.2.0] -- 2015-12-07

### Added
- All `Plotly.____` methods now return a promise, and pass the graph-div as an argument [#77]
- `package.json` now has `webpack` field so plotly.js can be used by webpack users [#68]
- Add support for rgba colours in pie-charts [#63]

### Changed
- Optimized by calling window.getComputedStyle only once [#81]
- Improved npm install process for topojson file resolve [#48]

### Fixed
- Fixed geo-plot promises [#52]
- Typo fixed in `No DOM element` error message [#64]
- Fix hover labels with hoverinfo 'text' [#70]
- Fix scaling for gl3d error bars [#74]


## [1.1.1] -- 2015-12-01

### Fixed
- Fix `displayModeBar` plot config logic [#57]
- Fix length-1 bins count as ascending in `Lib.findBin` [#47]
- Fix jasmine test runner on windows [#46]


## [1.1.0] -- 2015-11-25

### Added
- Add three plot config options: `modeBarButtonsToRemove`,
  `modeBarButtonsToAdd` and `modeBarButtons` which combine
  to add the ability to remove specific mode bar buttons add
  custom mode bar buttons and fully customize the mode bar.

### Fixed
- Fix installation from npm3 [#12]
- Fix UMD in plotly.js dist files [#18]
- Fix for blank elements in a text array [#31]

## [1.0.0] -- 2015-11-17

First fully open source release.

### Added
- Add 2D WebGL plot engine

### Changed
- Save to cloud is now done via a modebar button by default,
  the `'Edit chart'` link is still available through the
  `'showLink'` plot config.
- Better double-click notifier CSS

### Fixed
- Fix `Plotly.newPlot` 3D and geo bug.
- Fix `plotly_click` event bug in latest Chrome and Firefox.

### Known limitations
- Different plot types cannot be mixed in subplots.
- 2D WebGL has no image test support.
- Click and hover events are not hooked for gl3d, geo and gl2d
  plot types.
- Polar chart are under-developed.

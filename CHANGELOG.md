# plotly.js changelog

For more context information, please read through the
[release notes](https://github.com/plotly/plotly.js/releases).

To see all merged commits on the master branch that will be part of the next plotly.js release, go to:

https://github.com/plotly/plotly.js/compare/vX.Y.Z...master

where X.Y.Z is the semver of most recent plotly.js release.


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

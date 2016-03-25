# plotly.js changelog

For more context information, please read through the
[release notes](https://github.com/plotly/plotly.js/releases).

To see all merged commits on the master branch that will be part of the next plotly.js release, go to:

https://github.com/plotly/plotly.js/compare/vX.Y.Z...master

where X.Y.Z is the semver of most recent plotly.js release.

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

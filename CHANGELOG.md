# plotly.js changelog

For more context information, please read through the
[release notes](https://github.com/plotly/plotly.js/releases).

To see all merged commits on the master branch that will be part of the next plotly.js release, go to:

<https://github.com/plotly/plotly.js/compare/vX.Y.Z...master>

where X.Y.Z is the semver of most recent plotly.js release.

## [2.35.3] -- 2024-12-13

### Fixed
 - Set height and width on the `.plotly-container` div to 100% [[#7314](https://github.com/plotly/plotly.js/pull/7314)]


## [2.35.2] -- 2024-09-10

### Fixed
 - Fix require path to maplibre-gl.css (regression introduced in 2.35.1) [[#7146](https://github.com/plotly/plotly.js/pull/7146)],
  with thanks to @birkskyum for the contribution!


## [2.35.1] -- 2024-09-09

### Fixed
 - Fix rendering traces with `zorder` on overlayed subplots case of multiple traces in each subplot [[#7141](https://github.com/plotly/plotly.js/pull/7141)]
 - Fix missing CSS for map(maplibre) subplots when used offline [[#7140](https://github.com/plotly/plotly.js/pull/7140)],
   with thanks to @birkskyum for the contribution!


## [2.35.0] -- 2024-08-29

### Added
 - Add new traces: scattermap, choroplethmap and densitymap and map subplots which use maplibre to render maps [[#7015](https://github.com/plotly/plotly.js/pull/7015), [#7060](https://github.com/plotly/plotly.js/pull/7060), [#7085](https://github.com/plotly/plotly.js/pull/7085), [#7088](https://github.com/plotly/plotly.js/pull/7088), [#7090](https://github.com/plotly/plotly.js/pull/7090), [#7092](https://github.com/plotly/plotly.js/pull/7092), [#7094](https://github.com/plotly/plotly.js/pull/7094), [#7134](https://github.com/plotly/plotly.js/pull/7134)],
 with thanks to @birkskyum for the contribution!

### Changed
 - Deprecate mapbox traces and mapbox subplot [[#7087](https://github.com/plotly/plotly.js/pull/7087)]
 - Drop obsolete `npm v6` installation [[#7095](https://github.com/plotly/plotly.js/pull/7095)]
 - Use `Node.js v18` and `npm v10` in development [[#7078](https://github.com/plotly/plotly.js/pull/7078)]
 - Update npm lockfile to v3 [[#7099](https://github.com/plotly/plotly.js/pull/7099)]
 - Update turf to v7 [[#7116](https://github.com/plotly/plotly.js/pull/7116)]

### Fixed
 - Fix centroid calculation in turf [[#7115](https://github.com/plotly/plotly.js/pull/7115)],
   with thanks to @birkskyum for the contribution!
 - Fix missing cursor for Ternary Plot[[#7057](https://github.com/plotly/plotly.js/pull/7057)],
   with thanks to @Lexachoc for the contribution!
 - Elaborate on the Custom Bundle guide [[#7101](https://github.com/plotly/plotly.js/pull/7101)]


## [2.34.0] -- 2024-07-18

### Added
 - Add `subtitle` attribute to `layout.title` to enable adding subtitles to plots [[#7012](https://github.com/plotly/plotly.js/pull/7012)]
 - Introduce "u" and "s" pseudo html tags to add partial underline and strike-through styles to SVG text elements [[#7043](https://github.com/plotly/plotly.js/pull/7043)]
 - Add geometric mean functionality and 'geometric mean ascending' + 'geometric mean descending' to `category_order` on cartesian axes [[#6223](https://github.com/plotly/plotly.js/pull/6223)],
   with thanks to @acxz and @prabhathc for the contribution!
 - Add axis property `ticklabelindex` for drawing the label for each minor tick n positions away from a major tick,
   with thanks to @my-tien for the contribution! [[#7036](https://github.com/plotly/plotly.js/pull/7036)]
 - Add property `ticklabelstandoff` and `ticklabelshift` to cartesian axes to adjust positioning of tick labels,
   with thanks to @my-tien for the contribution! [[#7006](https://github.com/plotly/plotly.js/pull/7006)]
 - Add `x0shift`, `x1shift`, `y0shift`, `y1shift` to shapes to add control over positioning of shape vertices on (multi-)category axes,
   with thanks to @my-tien for the contribution! [[#7005](https://github.com/plotly/plotly.js/pull/7005)]

### Fixed
 - Fix displaying scattergl traces while zooming or panning (regression introduced in 2.26.0) [[#7018](https://github.com/plotly/plotly.js/pull/7018)],
   with thanks to @eiriklv for the contribution!
 - Fix for excessive hoverlabel removal and overlap for plots with both scatter and bar traces [[#6954](https://github.com/plotly/plotly.js/pull/6954)],
   with thanks to @mbant for the contribution!
 - Fix adding cartesian "togglehover" when included in `modebar.add` [[#5879](https://github.com/plotly/plotly.js/pull/5879)],
   with thanks to @Sizurka for the contribution!
 - Handle `zorder` between overlaying cartesian subplots [[#7032](https://github.com/plotly/plotly.js/pull/7032)],
   This feature was anonymously sponsored: thank you to our sponsor!


## [2.33.0] -- 2024-05-29

### Added
 - Add support for numeric text font `weight` [[#6990](https://github.com/plotly/plotly.js/pull/6990)]
 - Add `shadow`, `lineposition` and `textcase` options to SVG fonts [[#6983](https://github.com/plotly/plotly.js/pull/6983)]

### Fixed
 - Fix unicode variable names in @plotly/d3 [[#6992](https://github.com/plotly/plotly.js/pull/6992)],
   with thanks to @GeorchW for the contribution!
 - Fix `getFullTransformMatrix` in shadow DOM [[#6996](https://github.com/plotly/plotly.js/pull/6996)],
   with thanks to @OpportunityLiu for the contribution!
 - Fix drag on legend scrollbar while `edits.legendPosition` is `true` [[#6997](https://github.com/plotly/plotly.js/pull/6997)],
   with thanks to @OpportunityLiu for the contribution!
 - Fix numerical instability in 3D plots [[6998](https://github.com/plotly/plotly.js/pull/6998)],
   with thanks to @hborchardt for the contribution!
 - Fix numerical precision of drawing surface trace [[6999](https://github.com/plotly/plotly.js/pull/6999)],
   with thanks to @hborchardt for the contribution!
 - Fix isosurface maximum value calculation when `isomax` is set to null [[#7002](https://github.com/plotly/plotly.js/pull/7002)]


## [2.32.0] -- 2024-04-23

### Added
 - Add "bold" weight, "italic" style and "small-caps" variant options to fonts [[#6956](https://github.com/plotly/plotly.js/pull/6956)]

### Fixed
 - Fix applying `autotickangles` on axes with `showdividers` as well as cases
   where `tickson` is set to "boundaries" [[#6967](https://github.com/plotly/plotly.js/pull/6967)],
   with thanks to @my-tien for the contribution!
 - Fix positioning of multi-line axis titles with `standoff` [[#6970](https://github.com/plotly/plotly.js/pull/6970)],
   with thanks to @my-tien for the contribution!


## [2.31.1] -- 2024-04-15

### Fixed
 - Maintain original drawing order of traces when traces with similar type are sent to back [[#6962](https://github.com/plotly/plotly.js/pull/6962)]
 - Ensure winning points of hover are listed first when hoversubplots is set to "axis" and sorting by distance [[#6963](https://github.com/plotly/plotly.js/pull/6963)]
 - Fix duplicated points in splom hover when `hoversubplots` is set to "axis" [[#6965](https://github.com/plotly/plotly.js/pull/6965)]


## [2.31.0] -- 2024-04-10

### Added
 - Add `zorder` attribute to various cartesian traces for controlling stacking order of SVG traces drawn into a subplot [[#6918](https://github.com/plotly/plotly.js/pull/6918), [#6953](https://github.com/plotly/plotly.js/pull/6953)],
   This feature was anonymously sponsored: thank you to our sponsor!
 - Add "between" option to shape layer for placing them above grid lines and below traces [[#6927](https://github.com/plotly/plotly.js/pull/6927)],
   with thanks to @my-tien for the contribution!
 - Add "raw" `sizemode` to cone trace [[#6938](https://github.com/plotly/plotly.js/pull/6938)]
 - Add `layout.hoversubplots` to enable hover effects across multiple cartesian suplots sharing one axis [[#6947](https://github.com/plotly/plotly.js/pull/6947), [#6950](https://github.com/plotly/plotly.js/pull/6950)]

### Changed
 - Regenerate `stackgl_modules/index.js` using updated dependencies [[#6937](https://github.com/plotly/plotly.js/pull/6937)]

### Fixed
 - Fix hover count in parcats trace [[#6944](https://github.com/plotly/plotly.js/pull/6944)],
   with thanks to @weiweikee for the contribution!


## [2.30.1] -- 2024-03-15

### Fixed
 - Fix centering multi-line headers for treemap traces [[#6923](https://github.com/plotly/plotly.js/pull/6923)]
 - Fix heatmap text color and `texttemplate` on cells with missing data [[#6924](https://github.com/plotly/plotly.js/pull/6924)]
 - Fix scattergl rendering when colors include capital letters [[#6928](https://github.com/plotly/plotly.js/pull/6928)],
   with thanks to @28raining and @dy for the contribution!


## [2.30.0] -- 2024-03-06

### Added
- Add fill gradients for scatter traces [[#6905](https://github.com/plotly/plotly.js/pull/6905)],
  with thanks to @lumip for the contribution!
- Add `indentation` to legend [[#6874](https://github.com/plotly/plotly.js/pull/6874)],
  with thanks to @my-tien for the contribution!

### Fixed
- Fix tooltip pointer position [[#6901](https://github.com/plotly/plotly.js/pull/6901)],
  with thanks to @OBe95 for the contribution!
- Fix standoff position [[#6889](https://github.com/plotly/plotly.js/pull/6889), [#6914](https://github.com/plotly/plotly.js/pull/6914)],
  with thanks to @ayjayt for the contribution!
- Fix resizing `pie` and `funnelarea` traces when textinfo is set to "none" [[#6893](https://github.com/plotly/plotly.js/pull/6893)],
  with thanks to @robbtraister for the contribution!
- Fix `insiderange` on category axes [[#6910](https://github.com/plotly/plotly.js/pull/6910)]
- Fix display of "boundaries" `tickson` when `tickmode` is set to "array" [[#6912](https://github.com/plotly/plotly.js/pull/6912)]


## [2.29.1] -- 2024-02-12

### Fixed
 - Fix bug where plots with axis `type='categorical'`, `tickson = "boundaries"` and `showgrid=true` wouldn't load [[#6885](https://github.com/plotly/plotly.js/pull/6885)]
 - Respect `insiderange` when multiple overlaid axes having `insideticklabel` [[#6817](https://github.com/plotly/plotly.js/pull/6817)]


## [2.29.0] -- 2024-02-01

### Added
 - Add `layout.barcornerradius` and `trace.marker.cornerradius` properties to support rounding the corners of bar traces [[#6761](https://github.com/plotly/plotly.js/pull/6761)],
   with thanks to [Displayr](https://www.displayr.com) for sponsoring development!
 - Add `autotickangles` to cartesian and radial axes [[#6790](https://github.com/plotly/plotly.js/pull/6790)],
  with thanks to @my-tien for the contribution!

### Changed
 - Improve hover detection for for scatter plot fill tonext* [[#6865](https://github.com/plotly/plotly.js/pull/6865)],
   with thanks to @lumip for the contribution!
 - Improve rendering of heatmap bricks for log-scale axes [[#5991](https://github.com/plotly/plotly.js/issues/5991)],
   with thanks to @andrew-matteson for the contribution!
 - Adjust Sankey trace to allow user-defined link hover style override [[#6864](https://github.com/plotly/plotly.js/pull/6864)],
   with thanks to @TortoiseHam for the contribution!
 - Adjust 'decimal' and 'thousands' formats for Brazilian Portuguese locale file [[#6866](https://github.com/plotly/plotly.js/pull/6866)],
   with thanks to @pazuza for the contribution!

### Fixed
 - Fix modifying selections on traces on overlaying axes [[#6870](https://github.com/plotly/plotly.js/pull/6870)]


## [2.28.0] -- 2024-01-05

### Added
 - Add `align` option to sankey nodes to control horizontal alignment [[#6800](https://github.com/plotly/plotly.js/pull/6800)],
   with thanks to @adamreeve for the contribution!
 - Add the possibility of loading "virtual-webgl" script for WebGL 1 to help display several WebGL contexts on a page [[#6784](https://github.com/plotly/plotly.js/pull/6784)], with thanks to @greggman for the contribution!
 - Add options to use base64 encoding (`bdata`) and `shape` (for 2 dimensional arrays) to declare various typed arrays i.e. `dtype=(float64|float32|int32|int16|int8|uint32|uint16|uint8)` [[#5230](https://github.com/plotly/plotly.js/pull/5230)]

### Fixed
 - Fix scattergl rendering bug on M1 mac devices [[#6830](https://github.com/plotly/plotly.js/pull/6830)],
   with thanks to @justinjhendrick for the contribution!
 - Fix hovering over sankey node only fully highlights first trace [[#6799](https://github.com/plotly/plotly.js/pull/6799)],
   with thanks to @DominicWuest for the contribution!
 - Fix error when the mouse moves to x=0 while dragging a rangeslider [[#6780](https://github.com/plotly/plotly.js/pull/6780)],
   with thanks to @david-bezero for the contribution!
 - Fix duplicated of major and minor ticks in calc data [[#6829](https://github.com/plotly/plotly.js/pull/6829)],
   with thanks to @ayjayt for the contribution!
 - Fix charset test dashboard [[#6826](https://github.com/plotly/plotly.js/pull/6826)],
   with thanks to @ayjayt for the contribution!
 - Fix range defaults to take into account `minallowed` and `maxallowed` values of the axis [[#6796](https://github.com/plotly/plotly.js/pull/6796)]
 - Fix `scattergl` legend when `marker.angle` is an array [[#6787](https://github.com/plotly/plotly.js/pull/6787)]
 - Fix plot schema not to show `line.shape` options for `scatterpolargl` trace [[#6781](https://github.com/plotly/plotly.js/pull/6781)]


## [2.27.1] -- 2023-11-08

### Changed
 - Adjust stamen styles to point to `stadiamaps.com`, the users may also need to provide their own API_KEY via `config.mapboxAccessToken` [[#6776](https://github.com/plotly/plotly.js/pull/6776), [#6778](https://github.com/plotly/plotly.js/pull/6778)]

### Fixed
 - Fix handling multi-line text in title `automargin` [[#6758](https://github.com/plotly/plotly.js/pull/6758)]


## [2.27.0] -- 2023-10-20

### Added
 - Add `insiderange` to cartesian axes to help avoid overlap between visible grid lines and tick labels of the counter axis when they are positioned inside [[#6735](https://github.com/plotly/plotly.js/pull/6735)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Fixed
 - Fix column order changes on hover [[#6718](https://github.com/plotly/plotly.js/pull/6718)],
   with thanks to @bhavinpatel1109 for the contribution!
 - Fix hover at timestamp '1970-01-01 00:00:00' [[#6752](https://github.com/plotly/plotly.js/pull/6752)],
   with thanks to @adamjhawley for the contribution!
 - Fix clearing empty `candlestick` using react [[#6757](https://github.com/plotly/plotly.js/pull/6757)]


## [2.26.2] -- 2023-10-04

### Fixed
 - Fix range interactions affecting partial ranges in other subplots [[#6743](https://github.com/plotly/plotly.js/pull/6743)]
 - Fix to emit `plotly_click` event on touchscreens with "select" `dragmode` [[#6724](https://github.com/plotly/plotly.js/pull/6724)]),
   with thanks to @lvlte for the contribution!
 - Fix error display for failing builds [[#6739](https://github.com/plotly/plotly.js/pull/6739)],
   with thanks to @dmt0 for the contribution!
 - Use the "willReadFrequently" 2d context creation attribute to optimize readback performance for heat map traces [[#6741](https://github.com/plotly/plotly.js/pull/6741)],
   with thanks to @bebeal for the contribution!


## [2.26.1] -- 2023-09-22

### Fixed
 - Fix horizontal title alignment [[#6725](https://github.com/plotly/plotly.js/issues/6725)],
   with thanks to @28raining for the contribution!
 - Fix single-point histogram when user has provided bin widths [[#6725](https://github.com/plotly/plotly.js/issues/6725)],
   with thanks to @28raining for the contribution!
 - Fix to allow custom `plotly_legenddoubleclick` handlers to execute even when the default `plotly_legendclick` event is cancelled (returns false) [[#6727](https://github.com/plotly/plotly.js/pull/6727)], with thanks to @andrej-vasilj for the contribution!
 - Fix Finnish translation for "Download plot" in `fi` locale [[#6723](https://github.com/plotly/plotly.js/issues/6723)],
   with thanks to @wkmor1 for the contribution!
 - Fix Czech number separators in `cs` locale [[#6734](https://github.com/plotly/plotly.js/pull/6734)],
   with thanks to @vlastimil-dolejs for the contribution!


## [2.26.0] -- 2023-08-24

### Added
 - Add "min", "max", "min reversed" and "max reversed" autorange options and handle partial ranges (i.e. one end being null), add `autorangeoptions` (`clipmin`, `clipmax`, `minallowed`, `maxallowed`, `include`) as well as `minallowed` and `maxallowed` to cartesian, gl3d and radial axes [[#6547](https://github.com/plotly/plotly.js/pull/6547)]
 - Add [n]-sigma (std deviations) box plots as an alternative to quartiles [[#6697](https://github.com/plotly/plotly.js/issues/6697)], with thanks to @28raining for the contribution!
 - Add "top left" & "top center" side options to legend title [[#6711](https://github.com/plotly/plotly.js/pull/6711)], with thanks to @28raining for the contribution!
- Add "false" option to `scaleanchor` to allow removing a constraint that is set by default [[#6712](https://github.com/plotly/plotly.js/pull/6712)], with thanks to @lvlte for the contribution!


## [2.25.2] -- 2023-08-11

### Changed
 - Update Croatian translations in `hr` locale [[#6690](https://github.com/plotly/plotly.js/pull/6690)],
   with thanks to @Mkranj for the contribution!

### Fixed
 - Fix potential prototype pollution in plot API calls [[#6703](https://github.com/plotly/plotly.js/pull/6703), [6704](https://github.com/plotly/plotly.js/pull/6704)]


## [2.25.1] -- 2023-08-02

### Fixed
 - Fix clearing legend using react (regression introduced in 2.25.0) [[#6695](https://github.com/plotly/plotly.js/pull/6695)]


## [2.25.0] -- 2023-07-25

### Added
 - Add "Equal Earth" projection to geo subplots [[#6670](https://github.com/plotly/plotly.js/pull/6670)],
   with thanks to @apparebit for the contribution!
 - Add options to include legends for shapes and `newshape` [[#6653](https://github.com/plotly/plotly.js/pull/6653)]
 - Add Plotly.deleteActiveShape command [[#6679](https://github.com/plotly/plotly.js/pull/6679)]

### Fixed
 - Fix contour plot colorscale domain (take account of `zmin`, `zmax`, `cmin` and `cmax`) [[#6625](https://github.com/plotly/plotly.js/pull/6625)],
   with thanks to @lvlte for the contribution!
 - Fix text markers on non-mapbox styled maps [[#6652](https://github.com/plotly/plotly.js/pull/6652)],
   with thanks to @baurt for the contribution!
 - Fix unhide isolated traces in multi legend cases (regression introduced in 2.24.3) [[#6684](https://github.com/plotly/plotly.js/pull/6684)]


## [2.24.3] -- 2023-07-05

### Fixed
 - Fix double clicking one item in a legend hides traces in other legends [[#6655](https://github.com/plotly/plotly.js/pull/6655)]
 - Fix double click pie slices when having multiple legends [[#6657](https://github.com/plotly/plotly.js/pull/6657)]
 - Fix per legend group and traceorder defaults when having multiple legends [[#6664](https://github.com/plotly/plotly.js/pull/6664)]


## [2.24.2] -- 2023-06-09

### Fixed
 - Fix legend groups toggle (regression introduced in 2.22.0) [#6639]((https://github.com/plotly/plotly.js/issues/6639))
 - Fix waterfall `hovertemplate` not showing delta on totals similar [#6635]((https://github.com/plotly/plotly.js/issues/6635))


## [2.24.1] -- 2023-06-07

### Fixed
 - Fix minimal copying of arrays in minExtend function
  (regression introduced in 2.24.0) [#6632]((https://github.com/plotly/plotly.js/issues/6632))


## [2.24.0] -- 2023-06-06

### Added
 - add pattern to pie, funnelarea, sunburst, icicle and treemap traces [[#6601](https://github.com/plotly/plotly.js/pull/6601), [#6619](https://github.com/plotly/plotly.js/pull/6619), [#6622](https://github.com/plotly/plotly.js/pull/6622), [#6626](https://github.com/plotly/plotly.js/pull/6626), [#6627](https://github.com/plotly/plotly.js/pull/6627), [#6628](https://github.com/plotly/plotly.js/pull/6628), [#6629](https://github.com/plotly/plotly.js/pull/6629)],
  with thanks to @thierryVergult for the contribution!

### Fixed
 - Fix to prevent accessing undefined (hoverText.hoverLabels) in case all currently shown markers
   have hoverinfo: "none" (regression introduced in 2.6.0) [#6614]((https://github.com/plotly/plotly.js/issues/6614)),
   with thanks to @Domino987 for the contribution!
 - Fix to ensure only minimum margin spacing is added for container-referenced legends and colorbars [[#6616](https://github.com/plotly/plotly.js/pull/6616)]


## [2.23.2] -- 2023-05-19

### Fixed
 - Fix text rendering while drawing new shapes [[#6608](https://github.com/plotly/plotly.js/pull/6608)],
   with thanks to the [Volkswagen](https://www.volkswagenag.com) Center of Excellence for Battery Systems for sponsoring development!


## [2.23.1] -- 2023-05-16

### Fixed
 - Fix heatmap rendering on iOS and Safari when `zsmooth` is set to false [[#6605](https://github.com/plotly/plotly.js/pull/6605)], with thanks to @lvlte for the contribution!


## [2.23.0] -- 2023-05-12

### Added
 - Add `legend.xref` and `legend.yref` to enable container-referenced positioning of legends [[#6589](https://github.com/plotly/plotly.js/pull/6589)], with thanks to [Gamma Technologies](https://www.gtisoft.com/) for sponsoring the related development.
 - Add `colorbar.xref` and `colorbar.yref` to enable container-referenced positioning of colorbars [[#6593](https://github.com/plotly/plotly.js/pull/6593)], with thanks to [Gamma Technologies](https://www.gtisoft.com/) for sponsoring the related development.

### Changed
 - Improve heatmap rendering performance when `zsmooth` is set to false [[#6574](https://github.com/plotly/plotly.js/pull/6574)], with thanks to @lvlte for the contribution!


## [2.22.0] -- 2023-04-27

### Added
 - Add `legend` references to traces and `legend2`, `legend3`, etc. to layout,
   also add `visible` to legend i.e. to allow positioning multiple legends on a graph [[#6535](https://github.com/plotly/plotly.js/pull/6535)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Changed
 - Update Norwegian translations in `no` locale [[#5410](https://github.com/plotly/plotly.js/pull/5410)],
   with thanks to @bjornol for the contribution!
 - Update Slovak translations and number formats in `sk` locale [[#6580](https://github.com/plotly/plotly.js/pull/6580)], with thanks to @Libco for the contribution!

### Fixed
 - Fix `plotly_click` in gl3d scenes to fire on touch devices [[#6563](https://github.com/plotly/plotly.js/pull/6563)],
   with thanks to @NickTominaga for the contribution!
 - Fix scatter3d when `marker.opacity` is set to zero [[#6581](https://github.com/plotly/plotly.js/pull/6581)], with thanks to @dmyronuk for the contribution!
 - Fix scattermapbox visibility restyle [[#6567](https://github.com/plotly/plotly.js/pull/6567)]


## [2.21.0] -- 2023-04-17

### Added
 - Add `texttemplate` to shape.label for parametric shapes i.e. line, rect and circle [[#6527](https://github.com/plotly/plotly.js/pull/6527)],
   with thanks to the [Volkswagen](https://www.volkswagenag.com) Center of Excellence for Battery Systems for sponsoring development!
 - Add strict option to custom bundle command [[#6557](https://github.com/plotly/plotly.js/pull/6557)],
   with thanks to @CallumNZ for the contribution!

### Fixed
 - Fix dragging of legend when xanchor is not 'left' or yanchor is not 'top' [[#6528](https://github.com/plotly/plotly.js/pull/6528)],
   with thanks to @bmaranville for the contribution!
 - Fix heatmap rendering bug and improve performance when `zsmooth` is set to "fast" [[#6565](https://github.com/plotly/plotly.js/pull/6565)],
   with thanks to @lvlte for the contribution!


## [2.20.0] -- 2023-03-15

### Added
 - Add `title.automargin` to enable automatic top and bottom margining for both container and paper referenced titles [[#6428](https://github.com/plotly/plotly.js/pull/6428)],
   with thanks to [Gamma Technologies](https://www.gtisoft.com/) for sponsoring the related development.


## [2.19.1] -- 2023-03-14

### Fixed
 - Ensure slider range stays in bounds during the drag [[#4448](https://github.com/plotly/plotly.js/pull/4448)],
   with thanks to @jay-bis for the contribution!


## [2.19.0] -- 2023-03-13

### Added
 - Add `label` attribute to shapes [[#6454](https://github.com/plotly/plotly.js/pull/6454)],
   with thanks to the [Volkswagen](https://www.volkswagenag.com) Center of Excellence for Battery Systems for sponsoring development!
 - Add `labelalias` to various axes namely cartesian, gl3d, polar, smith, ternary, carpet,
   indicator and colorbar [[#6481](https://github.com/plotly/plotly.js/pull/6481)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Changed
 - Upgrade `is-mobile` dependency [[#6517](https://github.com/plotly/plotly.js/pull/6517)]

### Fixed
 - Avoid overlap of point and axis hover labels for `hovermode: 'x'|'y'` [[#6442](https://github.com/plotly/plotly.js/pull/6442)],
   with thanks to @dagroe for the contribution!


## [2.18.2] -- 2023-02-15

### Fixed
 - Avoid attaching internal d3 object to the window (regression introduced in 2.17.0) [[#6487](https://github.com/plotly/plotly.js/pull/6487)]
 - Correct the order of lower fence and upper fence in the French locale (fr) [[#6476](https://github.com/plotly/plotly.js/pull/6476)],
   with thanks to @Gagaro for the contribution!
 - Correct formats in the Peruvian locale (es-pe) [[#6451](https://github.com/plotly/plotly.js/pull/6451)],
   with thanks to @andresrcs for the contribution!


## [2.18.1] -- 2023-02-02

### Changed
 - Bump `d3-interpolate` and `d3-color` to v3 to address audit warnings [[#6463](https://github.com/plotly/plotly.js/pull/6463)]

### Fixed
 - Fix scaling of exports e.g. the SVG format by not adding `vector-effect` CSS to static plots [[#6445](https://github.com/plotly/plotly.js/pull/6445)]
 - Fix hover on IE (regression introduced in 2.5.0) [[#6466](https://github.com/plotly/plotly.js/pull/6466)]


## [2.18.0] -- 2023-01-19

### Added
- Add `sync` tickmode option [[#6356](https://github.com/plotly/plotly.js/pull/6356), [#6443](https://github.com/plotly/plotly.js/pull/6443)],
  with thanks to @filipesantiagoAM and @VictorBezak for the contribution!

### Changed
 - Improve detection of mobile & tablet devices for WebGL rendering by upgrading `is-mobile` [[#6432](https://github.com/plotly/plotly.js/pull/6432)]

### Fixed
 - Fix library's imported name using `requirejs` AMD loader (regression introduced in 2.17.0) [[#6440](https://github.com/plotly/plotly.js/pull/6440)]


## [2.17.1] -- 2023-01-09

### Fixed
 - Fix line redraw (regression introduced in 2.15.0) [[#6429](https://github.com/plotly/plotly.js/pull/6429)]


## [2.17.0] -- 2022-12-22

### Added
 - Add `shift` and `autoshift` to cartesian y axes to help avoid overlapping of multiple axes [[#6334](https://github.com/plotly/plotly.js/pull/6334)],
   with thanks to [Gamma Technologies](https://www.gtisoft.com) for sponsoring the related development!
 - Introduce group attributes for `scatter` trace i.e. `alignmentgroup`, `offsetgroup`, `scattermode` and `scattergap` [[#6381](https://github.com/plotly/plotly.js/pull/6381)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add `marker.cornerradius` attribute to `treemap` trace [[#6351](https://github.com/plotly/plotly.js/pull/6351)]

### Changed
 - Change bundler from browserify to webpack [[#6355](https://github.com/plotly/plotly.js/pull/6355)]

### Fixed
 - Fix auto `backoff` when marker symbols and sizes are arrays [[#6414](https://github.com/plotly/plotly.js/pull/6414)]
 - Avoid displaying resize cursor on static sliders [[#6397](https://github.com/plotly/plotly.js/pull/6397)]


## [2.16.5] -- 2022-12-13

### Fixed
 - Disable slider interactions when `staticPlot` is set to true [[#6393](https://github.com/plotly/plotly.js/pull/6393)]


## [2.16.4] -- 2022-12-07

### Fixed
 - Fix `scattermapbox` redraw (regression introduced in 2.16.0) [[#6387](https://github.com/plotly/plotly.js/pull/6387)]


## [2.16.3] -- 2022-11-16

### Fixed
 - Fix hover on multicategory axes [[#6360](https://github.com/plotly/plotly.js/pull/6360)],
   with thanks to @filipesantiagoAM for the contribution!


## [2.16.2] -- 2022-11-11

### Fixed
 - Fix mapbox clearOutline calls (regression introduced in 2.13.0) [[#6367](https://github.com/plotly/plotly.js/pull/6367)]


## [2.16.1] -- 2022-10-21

### Fixed
 - Fix `choroplethmapbox` selection when adding new traces on top [[#6345](https://github.com/plotly/plotly.js/pull/6345)]


## [2.16.0] -- 2022-10-14

### Added
 - Add clustering options to `scattermapbox` [[#5827](https://github.com/plotly/plotly.js/pull/5827)],
   with thanks to @elben10 for the contribution!
 - Add bounds to mapbox suplots [[6339](https://github.com/plotly/plotly.js/pull/6339)]


## [2.15.1] -- 2022-10-11

### Fixed
 - Fix latest version of plotly.js main module on npm 


## [2.15.0] -- 2022-10-06

### Added
 - Add `angle`, `angleref` and `standoff` to `marker` and add `backoff` to `line`; also introduce new arrow symbols to facilitate drawing networks [[#6297](https://github.com/plotly/plotly.js/pull/6297)]
 - Add `minreducedwidth` and `minreducedheight` to layout for increasing control over automargin [[#6307](https://github.com/plotly/plotly.js/pull/6307)]
 - Add `entrywidth` and `entrywidthmode` to legend [[#6202](https://github.com/plotly/plotly.js/pull/6202), [#6324](https://github.com/plotly/plotly.js/pull/6324)]

### Changed
 - Use valType of `angle` for `rotation` in `pie` [[#6304](https://github.com/plotly/plotly.js/pull/6304)]

### Fixed
 - Fix mapbox `touch event` after switching back from select mode [[#6281](https://github.com/plotly/plotly.js/pull/6281)],
   with thanks to @mmtmr for the contribution!
 - Fix automargin to update axis titles in redraws [[#6312](https://github.com/plotly/plotly.js/pull/6312)]
 - Fix exporting patterns with transparent color [[#6318](https://github.com/plotly/plotly.js/pull/6318)]
 - Fix exporting text on empty slices [[#6335](https://github.com/plotly/plotly.js/pull/6335)]
 - Disable interactions for `treemap`, `icicle`, `sunburst`, `pie`, `funnelarea`, 
   `parcats`, `parcoords` and `sankey` traces when `staticPlot` is set to true [[#6296](https://github.com/plotly/plotly.js/pull/6296)]
   

## [2.14.0] -- 2022-08-10

### Added
 - Add support for sankey links with arrows [[#6276](https://github.com/plotly/plotly.js/pull/6276)],
   with thanks to @Andy2003 for the contribution!
 - Add `editSelection` option to config [[#6285](https://github.com/plotly/plotly.js/pull/6285)]

### Changed
 - Update dutch translations and fix dateMonth format for `nl` locale to confirm with expected nl format [[#6261](https://github.com/plotly/plotly.js/pull/6261)],
   with thanks to @eirvandelden for the contribution!


## [2.13.3] -- 2022-07-25

### Fixed
 - Emit plotly_selected event on plot API calls and GUI edits [[#6277](https://github.com/plotly/plotly.js/pull/6277)]


## [2.13.2] -- 2022-07-21

### Fixed
 - Fix `sankey` select error (regression introduced in 2.13.0) [[#6265](https://github.com/plotly/plotly.js/pull/6265)]
 - Handle missing drag layer of invisible `sankey` traces to fix select error [[#6267](https://github.com/plotly/plotly.js/pull/6267)]
 - Emit selection event in shape drawing `dragmode`s when an existing selection is modified [[#6262](https://github.com/plotly/plotly.js/pull/6262)]


## [2.13.1] -- 2022-07-14

### Fixed
 - Avoid attaching `selections` to undefined eventData (regression introduced in 2.13.0) [[#6260](https://github.com/plotly/plotly.js/pull/6260)]


## [2.13.0] -- 2022-07-14

### Added
 - Add `selections`, `newselection` and `activeselection` layout attributes to have
   persistent and editable selections over cartesian subplots [[#6243](https://github.com/plotly/plotly.js/pull/6243)]
 - Add `unselected.line.color` and `unselected.line.opacity` options to `parcoords` trace [[#6216](https://github.com/plotly/plotly.js/pull/6216), [#6236](https://github.com/plotly/plotly.js/pull/6236)]
 - Add "exclusive" and "inclusive" quartile-computing algorithm to `violin` trace
   via `quartilemethod` attribute [[#6187](https://github.com/plotly/plotly.js/pull/6187)]
 - Add flaglist options including "left", "right", "top", "bottom", "width" and "height"
   to control the direction of `automargin` on cartesian axes [[#6193](https://github.com/plotly/plotly.js/pull/6193)]
 - Add `delta.prefix` and `delta.suffix` to `indicator` trace [[#6246](https://github.com/plotly/plotly.js/pull/6246)],
   with thanks to @paulovieira for the contribution!
 - Add official Chinese (Taiwan) translation (locale `zh-tw`) [[#6247](https://github.com/plotly/plotly.js/pull/6247)],
   with thanks to @sec2 for the contribution!
 - Add official Sinhala translation (locale `si`) [[#6238](https://github.com/plotly/plotly.js/pull/6238)],
   with thanks to @sujithranga for the contribution!

### Changed
 - Display Plotly's new logo in the modebar [[#6232](https://github.com/plotly/plotly.js/pull/6232)]

### Fixed
 - Fix undesirable missing hover labels of `box` & `violin` traces [[#6189](https://github.com/plotly/plotly.js/pull/6189)]
 - Fix `xref` description of `shapes` [[#6194](https://github.com/plotly/plotly.js/pull/6194)]


## [2.12.1] -- 2022-05-09

### Fixed
 - Fix for disabling polar rotation when `dragmode` is set to false [[#6147](https://github.com/plotly/plotly.js/pull/6147)],
   with thanks to @jonfunkhouser for the contribution!
 - Fix custom modebar buttons mutate the input [[#6177](https://github.com/plotly/plotly.js/pull/6177)]
 - Fix various missing and duplicate spaces in plot schema descriptions [[#6183](https://github.com/plotly/plotly.js/pull/6183)]


## [2.12.0] -- 2022-05-02

### Added
 - Add `griddash` axis property to cartesian, polar, smith, ternary and geo subplots and add `griddash` and `minorgriddash` to `carpet` trace [[6144](https://github.com/plotly/plotly.js/pull/6144)], with thanks to @njwhite for the contribution!
 - Implement various options to position and style `minor` ticks and grid lines on cartesian axis types including
   `minor.tickmode`, `minor.tickvals`, `minor.tickcolor`, `minor.ticklen`, `minor.tickwidth`, `minor.dtick`, `minor.tick0`, `minor.nticks`, `minor.ticks`,
   `minor.showgrid`, `minor.gridcolor`, `minor.griddash` and `minor.gridwidth` [[6166](https://github.com/plotly/plotly.js/pull/6166)]

### Changed
 - Use the "willReadFrequently" 2d context creation attribute to optimize readback performance [[#6084](https://github.com/plotly/plotly.js/pull/6084)],
   with thanks to @junov for the contribution!

### Fixed
 - avoid drawing blank tick labels on cartesian axes [[#6163](https://github.com/plotly/plotly.js/pull/6163)]


## [2.11.1] -- 2022-03-15

### Fixed
 - Regenerate functions of regl-based traces in the "strict" bundle [[#6141](https://github.com/plotly/plotly.js/pull/6141)]


## [2.11.0] -- 2022-03-11

### Added
 - Add a CSP complaint variation of regl-based traces i.e. `parcoords`, `splom`, `scattergl`, `scatterpolargl` to the "strict" bundle [[#6083](https://github.com/plotly/plotly.js/pull/6083)]
 - Add `scattersmith` trace to the "strict" bundle [[#6135](https://github.com/plotly/plotly.js/pull/6135)]


## [2.10.1] -- 2022-03-08

### Fixed
 - Fix `mesh3d` generation when `alphahull` is a positive number (regression introduced in 2.5.1) [[#6133](https://github.com/plotly/plotly.js/pull/6133)]


## [2.10.0] -- 2022-03-04

### Added
 - Add support to use version 3 of MathJax and add `typesetMath` attribute to config [[#6073](https://github.com/plotly/plotly.js/pull/6073)],
   with thanks to [Equinor](https://www.equinor.com) for sponsoring the related development!
 - Add `fillpattern` options to `scatter` trace [[#6101](https://github.com/plotly/plotly.js/pull/6101)],
   with thanks to @s417-lama for the contribution!


## [2.9.0] -- 2022-02-04

### Added
 - Implement `ticklabelstep` to reduce labels on 2D axes and colorbars [[#6088](https://github.com/plotly/plotly.js/pull/6088)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Changed
 - Display the version of plotly.js when hovering over the modebar [[#6077](https://github.com/plotly/plotly.js/pull/6077)]
 - Various dependency updates as listed under [the v2.9.0 milestone](https://github.com/plotly/plotly.js/milestone/69?closed=1)

### Fixed
 - Fix vertical spacing of legend items in horizontal mode [[#6094](https://github.com/plotly/plotly.js/pull/6094)]


## [2.8.3] -- 2021-12-20

### Fixed
 - Correct formatted x/y `texttempate` for `histogram` trace [[#6070](https://github.com/plotly/plotly.js/pull/6070)]


## [2.8.2] -- 2021-12-20

### Fixed
 - Fix missing x/y `texttemplate` for `histogram`, `bar`, `funnel` and `waterfall` traces [[#6069](https://github.com/plotly/plotly.js/pull/6069)]


## [2.8.1] -- 2021-12-15

### Fixed
 - Do not exceed layout font size when `textfont` is set to "auto" for `heatmap`, `histogram2d`, `contour` and
   `histogram2dcontour` traces [[#6061](https://github.com/plotly/plotly.js/pull/6061)]


## [2.8.0] -- 2021-12-10

### Added
 - Introduce horizontal colorbars [[#6024](https://github.com/plotly/plotly.js/pull/6024)]
 - Implement `legend.grouptitlefont` and `hoverlabel.grouptitlefont` [[#6040](https://github.com/plotly/plotly.js/pull/6040)]
 - Add `texttemplate` and `textfont` to `heatmap` and `histogram2d` traces as well as
   `histogram2dcontour` and `contour` traces when `coloring` is set "heatmap" [[#6028](https://github.com/plotly/plotly.js/pull/6028)]

### Fixed
 - Fix to discard negative values from `pie` chart post-aggregation instead of during summation [[#6051](https://github.com/plotly/plotly.js/pull/6051)],
   with thanks to @destiny-wu for the contribution!


## [2.7.0] -- 2021-12-02

### Added
 - Add `texttemplate`, `textposition`, `textfont`, `textangle`,
   `outsidetextfont`, `insidetextfont`, `insidetextanchor`,
   `constraintext` and `cliponaxis` to `histogram` trace [[#6038](https://github.com/plotly/plotly.js/pull/6038)]

### Changed
 - Bump `probe-image-size` module to v7.2.2 [[#6036](https://github.com/plotly/plotly.js/pull/6036)]

### Fixed
 - Fix mapbox derived coordinate for Retina displays [[#6039](https://github.com/plotly/plotly.js/pull/6039)]
 - Fix interaction between `uirevision` and `autorange`. Because we push `autorange` and `range` back into `layout`,
   there can be times it looks like we're applying GUI-driven changes on top of explicit autorange and other times
   it's an implicit autorange, even though the user's intent was always implicit. This fix treats them as equivalent. [[#6046](https://github.com/plotly/plotly.js/pull/6046)]


## [2.6.4] -- 2021-11-26

### Fixed
 - Avoid bar with text to jump when selected [[#6043](https://github.com/plotly/plotly.js/pull/6043)]


## [2.6.3] -- 2021-11-12

### Fixed
 - Fix hover events in Shadow DOM [[#6021](https://github.com/plotly/plotly.js/pull/6021)],
   with thanks to @SabineWren for the contribution!


## [2.6.2] -- 2021-11-05

### Fixed
 - Fix loading issue in [orca](https://github.com/plotly/orca) (regression introduced in 2.6.0) [[#6011](https://github.com/plotly/plotly.js/pull/6011)]


## [2.6.1] -- 2021-11-03

### Fixed
 - Fix to avoid including local stackgl_modules/node_modules in the package (regression introduced in 2.6.0) [[#6008](https://github.com/plotly/plotly.js/pull/6008)]


## [2.6.0] -- 2021-10-29

### Added
 - Add `smith` subplots and the `scattersmith` trace type for displaying Smith charts [[#5956](https://github.com/plotly/plotly.js/pull/5956), [#5992](https://github.com/plotly/plotly.js/pull/5992)],
   with thanks to Kitware and @waxlamp for kicking off this effort.

### Changed
 - Improve drawing the contour lines in non-linear space e.g. on log axes [[#5985](https://github.com/plotly/plotly.js/pull/5985)], with thanks to @andrew-matteson for the contribution!
 - Bump eslint to v8 release candidate including fixes for `no-new-func` test [[#5969](https://github.com/plotly/plotly.js/pull/5969)]

### Fixed
 - Fix `npm install` problem for `npm v6` users (regression introduced in 2.5.0) [[#6004](https://github.com/plotly/plotly.js/pull/6004)]
 - Fix unhover event data for gl3d subplots [[#5954](https://github.com/plotly/plotly.js/pull/5954)],
   with thanks to @dwoznicki for the contribution!
 - Fix scatter3d opacity restyle bug [[#5958](https://github.com/plotly/plotly.js/pull/5958)],
   with thanks to @dwoznicki for the contribution!
 - Skip `"hoverinfo": "none"` trace display for hover modes [[#5854](https://github.com/plotly/plotly.js/pull/5854)],
   with thanks to @Domino987 for the contribution!
 - Display prefix and suffix of invisible polar axes in hover [[#5964](https://github.com/plotly/plotly.js/pull/5964)]
 - Reduce calls to `getBoundingClientRect` in `convertToTspans` [[#5976](https://github.com/plotly/plotly.js/pull/5976)]
 - Avoid wrapping legend items if already on the first column [[#5996](https://github.com/plotly/plotly.js/pull/5996)]
 - Fix horizontal alignment of colorbar in editable mode when `xanchor` is set to "center" [[#6002](https://github.com/plotly/plotly.js/pull/6002)]
 - Fix to improve rendering of graphs with Mathjax on Firefox v82 and higher [[#5993](https://github.com/plotly/plotly.js/pull/5993)]


## [2.5.1] -- 2021-09-16

### Fixed
 - Reduce bundle sizes by updating `surface-nets`, `robust-determinant`, `robust-linear-solve` modules [[#5934](https://github.com/plotly/plotly.js/pull/5934), [#5935](https://github.com/plotly/plotly.js/pull/5935), [#5936](https://github.com/plotly/plotly.js/pull/5936)]
 - Update CONTRIBUTING guidelines to use `npm v7` and `node.js v16` [[#5933](https://github.com/plotly/plotly.js/pull/5933)],
   with thanks to @sleighsoft for the contribution!


## [2.5.0] -- 2021-09-03

### Added
 - Include `surface`, `isosurface`, `volume`, `streamtube`, `cone`, `mesh3d`, `scatter3d`, `pointcloud`
   and `heatmapgl` in the "strict" bundle by avoid function generation for these traces at runtime [[#5888](https://github.com/plotly/plotly.js/pull/5888)]

### Changed
 - Use `node.js v16` and `npm v7` in development and upgrade the version of `package-lock.json` [[#5922](https://github.com/plotly/plotly.js/pull/5922), [#5919](https://github.com/plotly/plotly.js/pull/5919)]

### Fixed
 - Adjust position of hover in respect to CSS transform [[#5916](https://github.com/plotly/plotly.js/pull/5916)]


## [2.4.2] -- 2021-08-31

### Fixed
 - Fix positioning unified hover box when div has zero height
   (regression introduced in 2.3.0) [[#5913](https://github.com/plotly/plotly.js/pull/5913)]


## [2.4.1] -- 2021-08-27

### Fixed
 - Fix double click legends when `groupclick` is set to "toggleitem" [[#5909](https://github.com/plotly/plotly.js/pull/5909)]


## [2.4.0] -- 2021-08-27

### Added
 - Add `legend.groupclick` options [[#5849](https://github.com/plotly/plotly.js/pull/5849), [#5906](https://github.com/plotly/plotly.js/pull/5906)],
   with thanks to @brussee for the contribution!
 - Add touch support to `slider` component [[#5856](https://github.com/plotly/plotly.js/pull/5856)],
  with thanks to @keul for the contribution!
 - Provide `bbox` of hover items in event data [[#5512](https://github.com/plotly/plotly.js/pull/5512)]

### Changed
 - Upgrade `regl` module from version 1.6.1 to version 2.1.0 [[#5870](https://github.com/plotly/plotly.js/pull/5870)]

### Fixed
 - Fix invalid call to `lib.promiseError` in lib.syncOrAsync  [[#5878](https://github.com/plotly/plotly.js/pull/5878)],
   with thanks to @jklimke for the contribution!
 - Use `hoverlabel.font` for group titles in unified hover modes [[#5895](https://github.com/plotly/plotly.js/pull/5895)]


## [2.3.1] -- 2021-07-30

### Fixed
 - Fix period positioned hover to work in different time zones as well as on grouped bars [[#5864](https://github.com/plotly/plotly.js/pull/5864)]
 - Use ids from axes when making hover data keys [[#5852](https://github.com/plotly/plotly.js/pull/5852)]
 - Do not include regl based traces `parcoords`, `splom`, `scattergl` and `scatterpolargl` in the "strict" bundle so that it could be used with CSP without WebGL warning [[#5865](https://github.com/plotly/plotly.js/pull/5865)]


## [2.3.0] -- 2021-07-23

### Added
 - Add new number formatting and text alignment options by upgrading `d3.format` method from d3@v3 to version 1.4.5 of `d3-format` module [[#5125](https://github.com/plotly/plotly.js/pull/5125), [#5842](https://github.com/plotly/plotly.js/pull/5842)]
 - Add "satellite" and several other projection types to geo subplots [[#5801](https://github.com/plotly/plotly.js/pull/5801)]
 - Improve rendering of `scattergl`, `splom` and `parcoords` by implementing `plotGlPixelRatio` for those traces [[#5500](https://github.com/plotly/plotly.js/pull/5500)]

### Changed
 - Upgrade `d3.geo` method from d3@v3 to version 1.12.1 of `d3-geo` module and version 2.9.0 of `d3-geo-projection` module [[#5112](https://github.com/plotly/plotly.js/pull/5112)]
 - Upgrade `d3.interpolate` method from d3@v3 to version 1.4.0 of `d3-interpolate` module in `icicle`, `indicator`, `parcats`, `sunburst` and `treemap` [[#5826](https://github.com/plotly/plotly.js/pull/5826)]
 - Upgrade `regl-scatter2d`, `regl-line2d` and `regl-error2d` modules to use version 1.1.0 of `to-float32` module to improve the performance [[#5786](https://github.com/plotly/plotly.js/pull/5786)],
   with thanks to @Seranicio for the contribution!
 - Edit the type of `constraintrange` in `parcoords` trace to pass validation [[#5673](https://github.com/plotly/plotly.js/pull/5673)]
 - Sort object key values in schema [[#5813](https://github.com/plotly/plotly.js/pull/5813)]
 - Sort plot-schema and add test to track plot-schema changes [[#5776](https://github.com/plotly/plotly.js/pull/5776)]
 - Preview CHANGELOG when building dist on master [[#5780](https://github.com/plotly/plotly.js/pull/5780), [#5808](https://github.com/plotly/plotly.js/pull/5808)]
 - Preview plot-schema changes between releases when building dist on master [[#5814](https://github.com/plotly/plotly.js/pull/5814)]
 - Display changes made to package.json between versions and add identical tags to draft bundles created by `publish-dist` job on CircleCI [[#5815](https://github.com/plotly/plotly.js/pull/5815)]
 - Simplify devtool by relying on `XMLHttpRequest` instead of `d3.json` [[#5832](https://github.com/plotly/plotly.js/pull/5832)]
 - Update CONTRIBUTING guidelines on how to submit pull requests and generate new baseline [[#5791](https://github.com/plotly/plotly.js/pull/5791), [#5792](https://github.com/plotly/plotly.js/pull/5792)]
 - More maintenance work listed under [the v2.3.0 milestone](https://github.com/plotly/plotly.js/milestone/63?closed=1)

### Fixed
 - Fix unknown filename when exporting charts using new versions of Safari [[#5609](https://github.com/plotly/plotly.js/pull/5609), [5838](https://github.com/plotly/plotly.js/pull/5838)],
 with thanks to @rlreamy for the contribution!
 - Improve README for ES6 module import [[#5779](https://github.com/plotly/plotly.js/pull/5779)],
   with thanks to @andreafonso for the contribution!
 - Position hover in respect to the average of values in (x|y) unified modes (regression introduced in 2.0.0) [[#5845](https://github.com/plotly/plotly.js/pull/5845)]
 - Fix hover with period alignment points and improve positioning of spikes and unified hover label
   in order not to obscure referring data points and fit inside plotting area [[#5846](https://github.com/plotly/plotly.js/pull/5846)]
 - Allow clickable legend group titles when group has no pie-like traces [[#5771](https://github.com/plotly/plotly.js/pull/5771)]
 - Fix mapbox line text example [[#5804](https://github.com/plotly/plotly.js/pull/5804)]
 - Fix links to time format options so that they point to the d3-time-format v2.2.3 applied not the latest [[#5818](https://github.com/plotly/plotly.js/pull/5818)]


## [2.2.1] -- 2021-07-06

### Fixed
 - Fix to improve sanitizing href inputs for SVG and HTML text elements [[#5803](https://github.com/plotly/plotly.js/pull/5803)]


## [1.58.5] -- 2021-07-06

### Fixed
 - Fix to improve sanitizing href inputs for SVG and HTML text elements [[#5803](https://github.com/plotly/plotly.js/pull/5803)]


## [2.2.0] -- 2021-06-28

### Added
 - Legend group titles [[#5752](https://github.com/plotly/plotly.js/pull/5752)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add half-year directive (%h) for formatting dates and improve descriptions to include extra date formatting options [[#5762](https://github.com/plotly/plotly.js/pull/5762)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Changed
 - Modernize the process of creating baselines using [Kaleido](https://github.com/plotly/Kaleido) and improve image & other export test systems [[#5724](https://github.com/plotly/plotly.js/pull/5724)]
 - Centralize jsdom utility to return Plotly object in node.js test scripts and use it in generating plot-schema [[#5755](https://github.com/plotly/plotly.js/pull/5755)]
 - Bump turf bbox dependency to v6.4.0 [[#5747](https://github.com/plotly/plotly.js/pull/5747)]
 - Bump turf area dependency to v6.4.0 [[#5748](https://github.com/plotly/plotly.js/pull/5748)]
 - More maintenance work listed under [the v2.2.0 milestone](https://github.com/plotly/plotly.js/milestone/62?closed=1)

### Fixed
 - Cache values and patterns in set_convert for axes with `rangebreaks` to improve performance [[#5659](https://github.com/plotly/plotly.js/pull/5659)],
   with thanks to @spasovski for the contribution!
 - Fix fetching geojson when ES6 import is used to load the library [[#5763](https://github.com/plotly/plotly.js/pull/5763)]
 - Correct readme links [[#5746](https://github.com/plotly/plotly.js/pull/5746)]


## [2.1.0] -- 2021-06-18

### Added
 - Add `icicle` trace type [[#5546](https://github.com/plotly/plotly.js/pull/5546)]
   with thanks to @Kully and @mtwichan of [Zyphr](https://www.zyphr.ca/) for their contribution!
 - Implement `legendrank` attribute in traces [[#5591](https://github.com/plotly/plotly.js/pull/5591)]
 - Implement `fgopacity`, `fgcolor` & "overlay" `fillmode` for bars and
   handle bar `pattern` and `legend` when `marker.colorscale` is present [[#5733](https://github.com/plotly/plotly.js/pull/5733)]

### Changed
 - Replace deprecated [node-sass](https://www.npmjs.com/package/node-sass) modules with [Sass](https://www.npmjs.com/package/sass) and update plot CSS [[#5729](https://github.com/plotly/plotly.js/pull/5729)]
 - Bump `probe-image-size` to v7.2.1 [[#5739](https://github.com/plotly/plotly.js/pull/5739)]
 - More maintenance work listed under [the v2.1.0 milestone](https://github.com/plotly/plotly.js/milestone/61?closed=1)

### Fixed
 - Fix setting the width of categorical bars & boxes to unit [[#5732](https://github.com/plotly/plotly.js/pull/5732)]


## [2.0.0] -- 2021-06-07

### Added
 - CSP safety: refactored to avoid usage of function constructors from `basic`, `cartesian`, `finance`, `geo`, and `mapbox`
   partial bundles and added tests to ensure that they will not again do so in the future [[#5359](https://github.com/plotly/plotly.js/pull/5359), [#5383](https://github.com/plotly/plotly.js/pull/5383), [#5387](https://github.com/plotly/plotly.js/pull/5387)],
   with thanks to [Equinor](https://www.equinor.com) for sponsoring the related development!
 - Add `strict` partial bundle [[#5413](https://github.com/plotly/plotly.js/pull/5413), [#5444](https://github.com/plotly/plotly.js/pull/5444)], which includes
   the maximal subset of the library which does not rely on function constructors
 - Add `custom-bundle` script to facilitate generation of custom bundles [[#5527](https://github.com/plotly/plotly.js/pull/5527), [#5508](https://github.com/plotly/plotly.js/pull/5508), [#5605](https://github.com/plotly/plotly.js/pull/5605), [#5712](https://github.com/plotly/plotly.js/pull/5712)]
 - Add mock validation utility [[#5653](https://github.com/plotly/plotly.js/pull/5653)]
 - Implement "fast" `zsmooth` option for `image` trace [[#5354](https://github.com/plotly/plotly.js/pull/5354), [#5386](https://github.com/plotly/plotly.js/pull/5386)],
   with thanks to @almarklein for the contribution!
 - Implement various `marker.pattern` options in `histogram`, `bar` and `barpolar` traces [[#5520](https://github.com/plotly/plotly.js/pull/5520), [#5537](https://github.com/plotly/plotly.js/pull/5537)]
   with thanks to @s417-lama for the contribution!
 - Implement `ticklabeloverflow` options on cartesian axes and colorbars to drop tick labels going outside div or domain [[#5584](https://github.com/plotly/plotly.js/pull/5584)]
 - Implement `(x|y|z)hoverformat`, `(u|v|w)hoverformat` and `valueformat` to  cartesian and gl3d traces [[#5563](https://github.com/plotly/plotly.js/pull/5563)]
 - Implement "(x|y)other" `hovertemplate` options to format differing positions in compare and unified modes [[#5690](https://github.com/plotly/plotly.js/pull/5690)]
 - Add layout and template attributes to facilitate enabling and disabling predefined modebar buttons e.g. shape drawing and "v1hovermode" via `modebar.add` and `modebar.remove` [[#5660](https://github.com/plotly/plotly.js/pull/5660)]

### Removed
 - Drop support for old browsers IE9 and IE10 [[#5376](https://github.com/plotly/plotly.js/pull/5376), [#5380](https://github.com/plotly/plotly.js/pull/5380), [#5460](https://github.com/plotly/plotly.js/pull/5460), [#5491](https://github.com/plotly/plotly.js/pull/5491)]
 - Stop exporting v3 of d3 under `Plotly.d3` [[#5400](https://github.com/plotly/plotly.js/pull/5400), [#5406](https://github.com/plotly/plotly.js/pull/5406)]
 - Stop attaching `_has*` plot types to `fullLayout` [[#5409](https://github.com/plotly/plotly.js/pull/5409)]
 - Stop injecting MathJax config by default [[#5514](https://github.com/plotly/plotly.js/pull/5514)]
 - Remove `sane-topojson` and MathJax v2.3 files from dist folder and change supported MathJax version to v2.7.5 [[#5487](https://github.com/plotly/plotly.js/pull/5487), [#5492](https://github.com/plotly/plotly.js/pull/5492), [#5494](https://github.com/plotly/plotly.js/pull/5494)]
 - Reduce the number of exported methods from `Plotly.Fx` and `Plotly.Plots` in the API [[#5420](https://github.com/plotly/plotly.js/pull/5420)]
 - Drop `Plotly.plot` from the API [[#5412](https://github.com/plotly/plotly.js/pull/5412), [#5370](https://github.com/plotly/plotly.js/pull/5370), [#5393](https://github.com/plotly/plotly.js/pull/5393)]
 - Drop `Plotly.Queue` from the API [[#5423](https://github.com/plotly/plotly.js/pull/5423)]
 - Drop non-object `role` keys from attribute definition [[#5425](https://github.com/plotly/plotly.js/pull/5425), [#5432](https://github.com/plotly/plotly.js/pull/5432)]
 - Drop deprecated `contourgl` and `area` traces as well as deprecated legacy
   pre-`scatterpolar` polar-related attributes `bar.t`, `bar.r`,
   `scatter.t`, `scatter.r`, `layout.radialaxis`, `layout.angularaxis` and
   `gd.framework` [[#5399](https://github.com/plotly/plotly.js/pull/5399), [#5408](https://github.com/plotly/plotly.js/pull/5408), [#5409](https://github.com/plotly/plotly.js/pull/5409), [#5398](https://github.com/plotly/plotly.js/pull/5398), [#5438](https://github.com/plotly/plotly.js/pull/5438)]
 - Stop overwriting the "latest" bundles on CDN, please specify the version [[#5462](https://github.com/plotly/plotly.js/pull/5462), [#5697](https://github.com/plotly/plotly.js/pull/#5697)]

### Deprecated
 - Deprecate `heatmapgl` and `pointcloud` trace types for later removal [[#5447](https://github.com/plotly/plotly.js/pull/5447)]
 - Deprecate `transform` attributes [[#5657](https://github.com/plotly/plotly.js/pull/5657)]

### Changed
 - No longer show "Aa" text in legends unless there is only text in the legend item [[#5682](https://github.com/plotly/plotly.js/pull/5682)]
 - New defaults for `legend.title.font` and `colorbar.title.font` to depend on `legend.font` and `colorbar.tickfont` and increase their sizes [[#5611](https://github.com/plotly/plotly.js/pull/5611)]
 - New defaults for spikes by setting `spikedistance` to "-1" and `axis.spikesnap` to "hovered data" [[#5648](https://github.com/plotly/plotly.js/pull/5648)]
 - Default `hovermode` to "closest" [[#5647](https://github.com/plotly/plotly.js/pull/5647)]
 - Default `textposition` to "auto" in `bar`, `histogram` and `waterfall` traces [[#5638](https://github.com/plotly/plotly.js/pull/5638)]
 - Hide hover and spike modebar buttons by default while `layout.modebar.add` or `config.modeBarButtonsToAdd` could be used to bring them back in [[#5654](https://github.com/plotly/plotly.js/pull/5654), [#5658](https://github.com/plotly/plotly.js/pull/5658)]
 - Switch to `native-promise-only` module to handle es6 promises [[#5358](https://github.com/plotly/plotly.js/pull/5358)]
 - Switch to `probe-image-size` module to get width and height of images [[#5388](https://github.com/plotly/plotly.js/pull/5388), [#5635](https://github.com/plotly/plotly.js/pull/#5635)]
 - Relax test for plain objects to enable validation in node.js and multiple window contexts [[#5411](https://github.com/plotly/plotly.js/pull/5411), [#5498](https://github.com/plotly/plotly.js/pull/5498)]
 - Display latitudes before longitudes in mapbox and geo hoverlabels to comply with ISO 6709 (Standard representation of geographic point location by coordinates) [[#5485](https://github.com/plotly/plotly.js/pull/5485), [#5676](https://github.com/plotly/plotly.js/pull/5676)]
 - Adjust text shadow color in respect to `paper_bgcolor` for better dark mode display of
   `sankey`, `parcoords` and `parcats` traces [[#5506](https://github.com/plotly/plotly.js/pull/5506)]
 - Improve `sankey` text namely support pseudo-html, fix `textfont.color` and avoid clipping [[#5531](https://github.com/plotly/plotly.js/pull/5531)]
 - Make selection event data of `scattergl` on par with `scatter` traces [[#5534](https://github.com/plotly/plotly.js/pull/5534)]
 - Fire `plotly_unhover` event when dragging [[#5407](https://github.com/plotly/plotly.js/pull/5407)],
   with thanks to @rreusser for the contribution!
 - Include transforms and calendars in partial bundles [[#5379](https://github.com/plotly/plotly.js/pull/5379), [#5422](https://github.com/plotly/plotly.js/pull/5422)]
 - Require unminified `mapbox-gl` dependency for unminified bundles and
   revisit compression options for minified bundles [[#5449](https://github.com/plotly/plotly.js/pull/5449)]
 - Remove header comments from the source files and only add headers to the top of
   dist files at build time [[#5436](https://github.com/plotly/plotly.js/pull/5436), [#5446](https://github.com/plotly/plotly.js/pull/5446)]
 - Guard against unexpected characters at build time [[#5424](https://github.com/plotly/plotly.js/pull/5424)]
 - Minimize indentation in plot-schema [[#5663](https://github.com/plotly/plotly.js/pull/5663)]
 - More maintenance work listed under [the 60th milestone](https://github.com/plotly/plotly.js/milestone/60?closed=1)!

### Fixed
 - Fix "toself" `fill` for `scattergl` traces to handle multiple polygons [[#5355](https://github.com/plotly/plotly.js/pull/5355)],
   with thanks to @ruijin for the contribution!
 - Fix element targeting on hover in shadow DOM [[#5256](https://github.com/plotly/plotly.js/pull/5256)],
   with thanks to @dbluhm for the contribution!
 - Fix hover interaction on geo subplots in Firefox [[#5607](https://github.com/plotly/plotly.js/pull/5607)],
   with thanks to @LucaVazz for the contribution!
 - Improve `scattergl` performance when using typed arrays [[#5632](https://github.com/plotly/plotly.js/pull/5632)],
   with thanks to @Seranicio for the contribution!
 - Fix native ES6 import [[#5708](https://github.com/plotly/plotly.js/pull/5708)],
   with thanks to @oldrich-svec suggestion!
 - Hide gridlines and ticks overlapping "inside" ticklabels [[#5550](https://github.com/plotly/plotly.js/pull/5550), [#5586](https://github.com/plotly/plotly.js/pull/5586), [#5589](https://github.com/plotly/plotly.js/pull/5589), [#5610](https://github.com/plotly/plotly.js/pull/5610), [#5684](https://github.com/plotly/plotly.js/pull/5684)]
 - Improve hover in compare and unified modes [[#5543](https://github.com/plotly/plotly.js/pull/5543), [#5618](https://github.com/plotly/plotly.js/pull/5618), [#5662](https://github.com/plotly/plotly.js/pull/5662), [#5664](https://github.com/plotly/plotly.js/pull/5664), [#5668](https://github.com/plotly/plotly.js/pull/5668), [#5683](https://github.com/plotly/plotly.js/pull/5683)]
 - Fix spike on `bar`-like traces [[#5542](https://github.com/plotly/plotly.js/pull/5542)]
 - Fix `bar` inside text font color default when using colorscale [[#5666](https://github.com/plotly/plotly.js/pull/5666)]
 - Fix `texttemplate` on log axes [[#5622](https://github.com/plotly/plotly.js/pull/5622)]
 - Fix displaying zero `threshold` for `indicator` trace [[#5430](https://github.com/plotly/plotly.js/pull/5430)]
 - Fix axis constraints for `heatmapgl` [[#5476](https://github.com/plotly/plotly.js/pull/5476)]
 - Fix setTimeout functions to return in the case of undefined layouts [[#5482](https://github.com/plotly/plotly.js/pull/5482)]
 - Fix misinterpreted clip-path by some programs after export [[#5686](https://github.com/plotly/plotly.js/pull/5686)]
 - Avoid redundant number casting in `Lib.ensureNumber` function [[#5637](https://github.com/plotly/plotly.js/pull/5637)]
 - Avoid duplicate keys in object literals within plotly builds [[#5458](https://github.com/plotly/plotly.js/pull/5458)]
 - Revise attributions of Carto, Stamen and Open Street Map styles [[#5696](https://github.com/plotly/plotly.js/pull/5696)]
 - Improve attribute compression and avoid redundant copyright comments in non-minified
   bundles [[#5426](https://github.com/plotly/plotly.js/pull/5426), [#5429](https://github.com/plotly/plotly.js/pull/5429), [#5439](https://github.com/plotly/plotly.js/pull/5439)]
 - Provide links to all pull requests in the changelog [[#5469](https://github.com/plotly/plotly.js/pull/5469)]
 - Provide documention for creating custom bundles and improve readme files [[#5702](https://github.com/plotly/plotly.js/pull/#5702), [#5703](https://github.com/plotly/plotly.js/pull/#5703), [#5704](https://github.com/plotly/plotly.js/pull/#5704), [#5705](https://github.com/plotly/plotly.js/pull/#5705), [#5713](https://github.com/plotly/plotly.js/pull/#5713)]
 - Provide a link to plotly.js dependencies when publishing various plotly.js-dist packages to npm [[#5711](https://github.com/plotly/plotly.js/pull/5711)]
 - Adjust npm publish script to use relevant tag e.g. "rc" when publishing various plotly.js-dist packages [[#5467](https://github.com/plotly/plotly.js/pull/5467)]
 - Place CDN publish script inside plotly.js repository [[#5468](https://github.com/plotly/plotly.js/pull/5468), [#5470](https://github.com/plotly/plotly.js/pull/5470)]
- Fix syntax test on the dist files [[#5471](https://github.com/plotly/plotly.js/pull/5471)]


## [1.58.4] -- 2020-12-21

### Fixed
 - Fix `preserveDrawingBuffer` WebGL config for displaying transparent gl3d scenes
   on Apple devices running latest Safari versions (v13 and higher) [[#5351](https://github.com/plotly/plotly.js/pull/5351)]
 - Fix spelling [[#5349](https://github.com/plotly/plotly.js/pull/5349), [#5356](https://github.com/plotly/plotly.js/pull/5356)] with thanks to @jbampton for the contribution!


## [1.58.3] -- 2020-12-17

### Fixed
 - Fix `autorange` for inside tick label positions [[#5332](https://github.com/plotly/plotly.js/pull/5332)]
 - Fix "nonnegative" and "tozero" `rangemode` for inside tick label positions
   (regression introduced in 1.58.2) [[#5331](https://github.com/plotly/plotly.js/pull/5331)]
 - Fix missing categories and tick labels on react updates
   (regression introduced in 1.54.6) [[#5345](https://github.com/plotly/plotly.js/pull/5345)]
 - Fix to avoid "autoscale" error when axis `autorange` is set to false
   (regression introduced in 1.42.0) [[#5336](https://github.com/plotly/plotly.js/pull/5336)]


## [1.58.2] -- 2020-12-08

### Fixed
 - Fix `root.color` error for `treemap` and `sunburst` traces
   (regression introduced in 1.58.0) [[#5330](https://github.com/plotly/plotly.js/pull/5330)]
 - Avoid infinite redraws to compute autorange for "inside" tick labels
   on the axes linked with `scaleanchor` and/or `matches` [[#5329](https://github.com/plotly/plotly.js/pull/5329)]
 - Provide padding for "inside" tick labels of various cartesian traces
   e.g. `heatmap`, `bar` and `line` plots [[#5325](https://github.com/plotly/plotly.js/pull/5325)]
 - Adjust position of multi-line dates for tick labels in respect to
   `side` and `ticklabelposition` on x-axis [[#5326](https://github.com/plotly/plotly.js/pull/5326)]
 - Move `tape` to dev-dependencies [[#5323](https://github.com/plotly/plotly.js/pull/5323)]


## [1.58.1] -- 2020-12-04

### Fixed
 - Fix `automargin` bug for the case of short remaining height or width for plot [[#5315](https://github.com/plotly/plotly.js/pull/5315)],
   (regression introduced in 1.58.0)


## [1.58.0] -- 2020-12-02

### Added
 - Add `ticklabelposition` attribute to cartesian axes and colorbars [[#5275](https://github.com/plotly/plotly.js/pull/5275)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add "strict" `autotypenumbers` to axes and `layout` [[#5240](https://github.com/plotly/plotly.js/pull/5240)]
 - Add `itemwidth` to legends [[#5212](https://github.com/plotly/plotly.js/pull/5212)],
   with thanks to @s417-lama for the contribution!
 - Add `root.color` attribute to `sunburst` and `treemap` traces [[#5232](https://github.com/plotly/plotly.js/pull/5232), [#5245](https://github.com/plotly/plotly.js/pull/5245)],
   with thanks to @thierryVergult for the contribution!

### Changed
 - Enable fast `image` rendering for all linear axes [[#5307](https://github.com/plotly/plotly.js/pull/5307)],
   with thanks to @almarklein for the contribution!
 - Rework `matches` and `scaleanchor` so they work together [[#5287](https://github.com/plotly/plotly.js/pull/5287)]

### Fixed
 - Fix hover on mobile and tablet devices for gl3d subplots [[#5239](https://github.com/plotly/plotly.js/pull/5239)]
   (regression introduced in 1.34.0), with thanks to @jdpaterson for the contribution!
 - Fix interactions when static/dynamic CSS transforms e.g. scale and translate are applied to the
   graph div or its parents [[#5193](https://github.com/plotly/plotly.js/pull/5193), [#5302](https://github.com/plotly/plotly.js/pull/5302)], with thanks to @alexhartstone for the contribution!
 - Fix reordering of mapbox raster and image layers on update [[#5269](https://github.com/plotly/plotly.js/pull/5269)]
 - Fix `categoryorder` for missing values in cartesian traces [[#5268](https://github.com/plotly/plotly.js/pull/5268)]
 - Fix `automargin` bug to provide space for long axis labels [[#5237](https://github.com/plotly/plotly.js/pull/5237)]
 - Avoid styling of backgrounds during `automargin` redraws [[#5236](https://github.com/plotly/plotly.js/pull/5236)]
 - Fix displaying zero length bars with `staticPlot` config option [[#5294](https://github.com/plotly/plotly.js/pull/5294)]
 - Fix setting false locale to "en-US" [[#5293](https://github.com/plotly/plotly.js/pull/5293)]
 - Fix typo in Czech locale file [[#5255](https://github.com/plotly/plotly.js/pull/5255)],
   with thanks to @helb for the contribution!
 - Fix `gl3d` scene initialization [[#5233](https://github.com/plotly/plotly.js/pull/5233)]


## [1.57.1] -- 2020-10-20

### Changed
 - Update template for new pull requests [[#5220](https://github.com/plotly/plotly.js/pull/5220)]
 - Provide a default `hovertemplate` label for attribute "base" in `bar` traces [[#5216](https://github.com/plotly/plotly.js/pull/5216)]

### Fixed
 - Fix `staticPlot` behaviour for `rangeslider` and `legend` [[#5210](https://github.com/plotly/plotly.js/pull/5210)],
   with thanks to @miqh for the contribution!
 - Fix `colorbar` react to new styles [[#5217](https://github.com/plotly/plotly.js/pull/5217)],
   with thanks to @anaplian for the contribution!
 - Fix `computed` margins when plot involves too many redraws [[#5225](https://github.com/plotly/plotly.js/pull/5225)]
 - Fix build issue for Chart Studio Cloud (regression introduced in 1.56.0) [[#5223](https://github.com/plotly/plotly.js/pull/5223)]


## [1.57.0] -- 2020-10-15

### Added
 - Introduce "domain" axis references in layout `images`, `shapes` and `annotations` [[#5014](https://github.com/plotly/plotly.js/pull/5014)]
 - Add `rotation` attribute to `sunburst` traces [[#5171](https://github.com/plotly/plotly.js/pull/5171), [#5201](https://github.com/plotly/plotly.js/pull/5201)],
   with thanks to @thierryVergult for the contribution!
 - Provide computed margins in "full-json" export [[#5203](https://github.com/plotly/plotly.js/pull/5203)],
   this feature was anonymously sponsored: thank you to our sponsor!

### Changed
 - Mention the "full-json" option in the `Plotly.toImage` warning [[#5204](https://github.com/plotly/plotly.js/pull/5204)]
 - Use current graph dimensions in `Plotly.downloadImage` [[#5209](https://github.com/plotly/plotly.js/pull/5209)]

### Fixed
 - Fix importing color modules for webpack users (regression introduced in 1.56.0) [[#5189](https://github.com/plotly/plotly.js/pull/5189)]
 - Fix positioning ticks and labels on axes with `rangebreaks` and/or "period" `ticklabelmode` [[#5187](https://github.com/plotly/plotly.js/pull/5187), [#5208](https://github.com/plotly/plotly.js/pull/5208)]
 - Fix autorange computation when a category matches a range extreme [[#5211](https://github.com/plotly/plotly.js/pull/5211)],
   with thanks to @LoganWlv for the contribution!
 - Fix displaying modebar after `Plotly.restyle` [[#5181](https://github.com/plotly/plotly.js/pull/5181)],
   with thanks to @Yook74 for the contribution!


## [1.56.0] -- 2020-09-30

### Added
 - Introduce period positioning attributes on date axes in various cartesian traces [[#5074](https://github.com/plotly/plotly.js/pull/5074), [#5175](https://github.com/plotly/plotly.js/pull/5175)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add `minexponent` attribute to improve control over SI prefixes in axis tick labels [[#5121](https://github.com/plotly/plotly.js/pull/5121)],
   with thanks to @ignamv for the contribution!
 - Add `sort` attribute to `sunburst` and `treemap` traces to disable automatic sort [[#5164](https://github.com/plotly/plotly.js/pull/5164)],
   with thanks to @thierryVergult for the contribution!
 - Handle `rgba` colors in `colorscale` of `surface` traces [[#5166](https://github.com/plotly/plotly.js/pull/5166)],
   with thanks to @lucapinello for the contribution!

### Changed
 - Disable undesirable text selections on graphs [[#5165](https://github.com/plotly/plotly.js/pull/5165)]
 - Adjust `tick0` for weekly periods [[#5180](https://github.com/plotly/plotly.js/pull/5180)]
 - More informative error messages when creating `sunburst` and `treemap` charts [[#5163](https://github.com/plotly/plotly.js/pull/5163)]

### Fixed
 - Fix positioning `legend` items [[#5139](https://github.com/plotly/plotly.js/pull/5139)],
   with thanks to @fredrikw for the contribution!
 - Fix rounding big numbers in `pie` and `sunburst` traces [[#5152](https://github.com/plotly/plotly.js/pull/5152)]
 - Display `marker` and `line` colors in `scatter3d` and `scattergl` when hovering [[#4867](https://github.com/plotly/plotly.js/pull/4867)]


## [1.55.2] -- 2020-09-08

### Fixed
 - Fix `automargin` when `ticklabelmode` is set to "period" [[#5134](https://github.com/plotly/plotly.js/pull/5134)]


## [1.55.1] -- 2020-09-02

### Fixed
 - Install `image-size` module in dependencies [[#5119](https://github.com/plotly/plotly.js/pull/5119)]


## [1.55.0] -- 2020-09-02

### Added
 - Introduce "period" `ticklabelmode` on cartesian date axes [[#4993](https://github.com/plotly/plotly.js/pull/4993), [#5055](https://github.com/plotly/plotly.js/pull/5055), [#5060](https://github.com/plotly/plotly.js/pull/5060), [#5065](https://github.com/plotly/plotly.js/pull/5065), [#5088](https://github.com/plotly/plotly.js/pull/5088), [#5089](https://github.com/plotly/plotly.js/pull/5089)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add new formatting options for weeks and quarters [[#5026](https://github.com/plotly/plotly.js/pull/5026)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add `source` attribute to `image` traces for fast rendering [[#5075](https://github.com/plotly/plotly.js/pull/5075)]
 - Add `zsmooth` attribute for discrete `heatmapgl` traces [[#4953](https://github.com/plotly/plotly.js/pull/4953)], with thanks to @ordiology for the contribution!
 - Add horizontal and vertical markers for arrow charts [[#5010](https://github.com/plotly/plotly.js/pull/5010)]
 - Add touch support to `rangeslider` [[#5025](https://github.com/plotly/plotly.js/pull/5025)], with thanks to @priyanomi, @cristiantx, @JasDev42 for their contribution!

### Changed
 - Improve contribution guide & readme, add code of conduct [[#5068](https://github.com/plotly/plotly.js/pull/5068)]
 - Bump various dev-dependencies namely bubleify and glslify [[#5084](https://github.com/plotly/plotly.js/pull/5084), [#5085](https://github.com/plotly/plotly.js/pull/5085), [#5118](https://github.com/plotly/plotly.js/pull/5118)]

### Fixed
 - Fix updating `title` and tick labels during transition with react [[#5045](https://github.com/plotly/plotly.js/pull/5045)]
 - Fix `table` wheel scroll for Firefox [[#5051](https://github.com/plotly/plotly.js/pull/5051)], with thanks to @ManelBH for the contribution!
 - Fix ISO-8601 short time zone format [[#5015](https://github.com/plotly/plotly.js/pull/5015)], with thanks to @mtgto for the contribution!
 - Fix numeric periods on date axes for `bar` with `base` [[#5061](https://github.com/plotly/plotly.js/pull/5061)]
 - Fix `bar` and `box` widths on categorical axes in "overlay" mode [[#5072](https://github.com/plotly/plotly.js/pull/5072)]
 - Fix `symbol` numbers in string format [[#5073](https://github.com/plotly/plotly.js/pull/5073)]
 - Fix gl2d marker sizes [[#5093](https://github.com/plotly/plotly.js/pull/5093)]
 - Fix default latitude span in `geo` subplots [[#5033](https://github.com/plotly/plotly.js/pull/5033)]
 - Improve axis tick increment [[#5114](https://github.com/plotly/plotly.js/pull/5114)]


## [1.54.7] -- 2020-07-23

### Changed
 - Revert [[#4904](https://github.com/plotly/plotly.js/pull/4904)] to fix a template regression introduced in 1.54.4 [[#5016](https://github.com/plotly/plotly.js/pull/5016)]


## [1.54.6] -- 2020-07-09

### Fixed
 - Link matching axes categories during `Plotly.relayout` calls
   (regression introduced in 1.54.2) [[#4977](https://github.com/plotly/plotly.js/pull/4977)]
 - Fix "median" aggregation transforms [[#4969](https://github.com/plotly/plotly.js/pull/4969)]
 - Fix `parcats` category order when the dimension only includes numbers [[#4973](https://github.com/plotly/plotly.js/pull/4973)]
 - Fix numeric sort in `ternary` drag [[#4975](https://github.com/plotly/plotly.js/pull/4975)]
 - Fix `heatmapgl` supply defaults not to add unimplemented attributes
   `xcalendar`, `ycalendar`, `xgap`, `ygap`, `zsmooth`, `zhoverformat`,
   `hoverongaps` and `hovertemplate` to `gd._fullData`  [[#4950](https://github.com/plotly/plotly.js/pull/4950)]
 - Fix `contourgl` supply defaults not to add unimplemented attributes
   `xcalendar`, `ycalendar` to `gd._fullData`  [[#4951](https://github.com/plotly/plotly.js/pull/4951)]


## [1.54.5] -- 2020-06-23

### Fixed
 - Fix placement of dividers on reversed-range `multicategory` axes [[#4939](https://github.com/plotly/plotly.js/pull/4939)]
 - Fix placement of `candlestick`, `ohlc` and `box` plots on axes with `rangebreaks` [[#4937](https://github.com/plotly/plotly.js/pull/4937)]
 - Handle undefined layout and data arguments in `Plotly.validate` [[#4938](https://github.com/plotly/plotly.js/pull/4938)]


## [1.54.4] -- 2020-06-22

### Changed
 - Bump `ecstatic`, `gl-selet-static`, `gl-plot2d` & `gl-plot3d` and drop `cwise` to simplify build process & address security warnings [[#4929](https://github.com/plotly/plotly.js/pull/4929), [#4930](https://github.com/plotly/plotly.js/pull/4930), [#4934](https://github.com/plotly/plotly.js/pull/4934)]

### Fixed
 - Fix setting width and color of lines via template various attributes namely `tickcolor`, `tickwidth`, `ticklen`, `linecolor`, `linewidth`, `zerolinecolor`, `zerolinewidth`, `gridcolor`, `gridwidth`, etc. [[#4904](https://github.com/plotly/plotly.js/pull/4904)]


## [1.54.3] -- 2020-06-16

### Fixed
 - Fix `autosize` case of hidden div with non-px size [[#4925](https://github.com/plotly/plotly.js/pull/4925)]


## [1.54.2] -- 2020-06-10

### Changed
 - Bump `regl` dependency to v1.6.1 [[#4881](https://github.com/plotly/plotly.js/pull/4881)]
 - Bump `ndarray` dependency to v1.0.19 [[#4910](https://github.com/plotly/plotly.js/pull/4910)]
 - Bump `mapbox-gl` dependency to v1.10.1 [[#4859](https://github.com/plotly/plotly.js/pull/4859)]
 - Improve docs about building Plotly with Angular [[#4182](https://github.com/plotly/plotly.js/pull/4182)]

### Fixed
 - Fix wheel event for IE-11 [[#4385](https://github.com/plotly/plotly.js/pull/4385)]
 - Fix `plot_bgcolor` react [[#4816](https://github.com/plotly/plotly.js/pull/4816)]
 - Fix `legend.title` react [[#4827](https://github.com/plotly/plotly.js/pull/4827)]
 - Fix `rangebreaks` on `candlestick` & `ohlc` traces [[#4814](https://github.com/plotly/plotly.js/pull/4814)]
 - Fix `rangebreaks` on `heatmap` traces with 2-D `z` array [[#4821](https://github.com/plotly/plotly.js/pull/4821)]
 - Fix `rangebreaks` on `histogram2d` traces [[#4829](https://github.com/plotly/plotly.js/pull/4829)]
 - Fix `rangebreaks` overlapping and tick positions [[#4831](https://github.com/plotly/plotly.js/pull/4831)]
 - Fix "array" `tickmode` on date & log axes [[#4851](https://github.com/plotly/plotly.js/pull/4851)]
 - Fix category order of matching axes when calling react [[#4832](https://github.com/plotly/plotly.js/pull/4832)]
 - Fix for bypassing non-string ids during matching axes [[#4858](https://github.com/plotly/plotly.js/pull/4858)]
 - Fix selection of single value `dimensions` in `parcoords` traces [[#4878](https://github.com/plotly/plotly.js/pull/4878)]
 - Fix `bar` lengths in milliseconds from `base` [[#4900](https://github.com/plotly/plotly.js/pull/4900)]
 - Fix gl3d ticks when converting dates to milliseconds
   (regression introduced in 1.21.0) [[#4903](https://github.com/plotly/plotly.js/pull/4903)]


## [1.54.1] -- 2020-05-04

### Changed
 - Update dependencies in package.json & package-lock.json [[#4799](https://github.com/plotly/plotly.js/pull/4799), [#4800](https://github.com/plotly/plotly.js/pull/4800), [#4802](https://github.com/plotly/plotly.js/pull/4802), [#4805](https://github.com/plotly/plotly.js/pull/4805), [#4811](https://github.com/plotly/plotly.js/pull/4811)]

### Fixed
 - Set pointer-events only for editable shapes to allow pan, zoom & hover
   events to work inside shapes (regression introduced in 1.54.0) [[#4810](https://github.com/plotly/plotly.js/pull/4810)]
 - Update and validate various mocks [[#4762](https://github.com/plotly/plotly.js/pull/4762)]


## [1.54.0] -- 2020-04-30

### Added
 - Introduce new drag modes "drawline", "drawrect", "drawcircle", "drawopenpath", "drawclosedpath" &
   add optional modebar buttons for drawing & removing new shapes inside cartesian subplots &
   add `newshape` and `activeshape` attributes to `layout` &
   add `editable` and `fillrule` attributes to `layout.shapes` [[#4775](https://github.com/plotly/plotly.js/pull/4775)]
 - Add `angle` and `allowoverlap` attributes to `marker` of `scattermapbox` traces [[#4575](https://github.com/plotly/plotly.js/pull/4575), [#4794](https://github.com/plotly/plotly.js/pull/4794)]
 - Add Portuguese (Portugal) `pt-pt` locale [[#4736](https://github.com/plotly/plotly.js/pull/4736)]

### Changed
 - Bump WebGL modules including mapbox-gl and is-mobile [[#4731](https://github.com/plotly/plotly.js/pull/4731), [#4752](https://github.com/plotly/plotly.js/pull/4752), [#4791](https://github.com/plotly/plotly.js/pull/4791)]
 - Bump jsdom, d3-force, minify-stream, topojson-client and es6-promise [[#4751](https://github.com/plotly/plotly.js/pull/4751), [#4768](https://github.com/plotly/plotly.js/pull/4768), [#4772](https://github.com/plotly/plotly.js/pull/4772), [#4773](https://github.com/plotly/plotly.js/pull/4773), [#4774](https://github.com/plotly/plotly.js/pull/4774)]

### Fixed
 - Sanitize `sourceattribution` in mapbox `layers` [[#4793](https://github.com/plotly/plotly.js/pull/4793)]
 - Fix `react`to mapbox `style` changes [[#4720](https://github.com/plotly/plotly.js/pull/4720)]
 - Fix transform sort order with gaps [[#4783](https://github.com/plotly/plotly.js/pull/4783)]
 - Fix autorange for `bar` and `waterfall` when `base` is present [[#4714](https://github.com/plotly/plotly.js/pull/4714)]
 - Fix "extremes" `opacityscale` option for `volume` and `surface` [[#4725](https://github.com/plotly/plotly.js/pull/4725)]
 - Fix no-WebGL warning for `scattergl` and `splom` traces [[#4777](https://github.com/plotly/plotly.js/pull/4777)]
 - Fix notifier CSS to have a fallback in font stack [[#4778](https://github.com/plotly/plotly.js/pull/4778)]


## [1.53.0] -- 2020-03-31

### Added
 - Introduce `rangebreaks` on date axes mainly thanks to [[#4614](https://github.com/plotly/plotly.js/pull/4614)] with API revision & improvements in
   [[#4639](https://github.com/plotly/plotly.js/pull/4639), [#4641](https://github.com/plotly/plotly.js/pull/4641), [#4644](https://github.com/plotly/plotly.js/pull/4644), [#4649](https://github.com/plotly/plotly.js/pull/4649), [#4652](https://github.com/plotly/plotly.js/pull/4652), [#4653](https://github.com/plotly/plotly.js/pull/4653), [#4660](https://github.com/plotly/plotly.js/pull/4660), [#4661](https://github.com/plotly/plotly.js/pull/4661), [#4670](https://github.com/plotly/plotly.js/pull/4670), [#4677](https://github.com/plotly/plotly.js/pull/4677), [#4684](https://github.com/plotly/plotly.js/pull/4684), [#4688](https://github.com/plotly/plotly.js/pull/4688), [#4695](https://github.com/plotly/plotly.js/pull/4695), [#4696](https://github.com/plotly/plotly.js/pull/4696), [#4698](https://github.com/plotly/plotly.js/pull/4698), [#4699](https://github.com/plotly/plotly.js/pull/4699)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Introduce "(x|y) unified" `hovermode` [[#4620](https://github.com/plotly/plotly.js/pull/4620), [#4664](https://github.com/plotly/plotly.js/pull/4664), [#4669](https://github.com/plotly/plotly.js/pull/4669), [#4687](https://github.com/plotly/plotly.js/pull/4687)],
   this feature was anonymously sponsored: thank you to our sponsor!
 - Add "hovered data" mode to `spikesnap` [[#4665](https://github.com/plotly/plotly.js/pull/4665)]
 - Add "full-json" export format to `Plotly.toImage` and `Plotly.dowloadImage` [[#4593](https://github.com/plotly/plotly.js/pull/4593)]
 - Add `node.customdata` and `link.customdata` to `sankey` traces [[#4621](https://github.com/plotly/plotly.js/pull/4621)]
 - Add `opacityscale` for `surface` traces [[#4480](https://github.com/plotly/plotly.js/pull/4480)]

### Changed
 - Improve `contour` labels (add extra pad) and correct minus sign [[#4540](https://github.com/plotly/plotly.js/pull/4540)]
 - Improve sizing text inside `pie` and `sunburst` (add extra pad) [[#4519](https://github.com/plotly/plotly.js/pull/4519)]
 - Improve display of spikelines when `spikedistance` is set to -1 [[#4637](https://github.com/plotly/plotly.js/pull/4637)]
 - Improve compare `hovermode` to include all points at same coordinate [[#4664](https://github.com/plotly/plotly.js/pull/4664)]
 - Improve `histogram` hover labels (harmonize start & end values) [[#4662](https://github.com/plotly/plotly.js/pull/4662)]
 - Display new colors on Plotly's logo [[#4691](https://github.com/plotly/plotly.js/pull/4691)]
 - Update links & descriptions to Chart Studio Cloud and plotly.com website [[#4694](https://github.com/plotly/plotly.js/pull/4694)]
 - Update contributing guidelines & add info about trace module architecture [[#4624](https://github.com/plotly/plotly.js/pull/4624)]
 - Require `config.plotlyServerURL` to be set for Chart Studio export [[#4690](https://github.com/plotly/plotly.js/pull/4690)]

### Fixed
 - Fix `Plotly.downloadImage` to match transparencies in gl3d plots with the on-screen render [[#4566](https://github.com/plotly/plotly.js/pull/4566)]
 - Fix amount of transparency applied by `opacity` in `surface` traces [[#4480](https://github.com/plotly/plotly.js/pull/4480), [#4642](https://github.com/plotly/plotly.js/pull/4642)]
 - Fix gaps in `bar` traces (regression introduced in 1.50.0) [[#4634](https://github.com/plotly/plotly.js/pull/4634)]
 - Fix gaps in `funnel` & `waterfall` [[#4663](https://github.com/plotly/plotly.js/pull/4663)]
 - Fix `template` to set axis `type`, `tickformatstops`, `tick0`, `dtick`, `tickvals` and `tickmode` [[#4670](https://github.com/plotly/plotly.js/pull/4670), [#4685](https://github.com/plotly/plotly.js/pull/4685)]


## [1.52.3] -- 2020-03-02

## Fixed
- Make identical bundles on different nodes [[#4601](https://github.com/plotly/plotly.js/pull/4601)]
- Fix (regression introduced in 1.52.1) and improve interactive display of narrow points of `bar`-like traces [[#4568](https://github.com/plotly/plotly.js/pull/4568)]
- Ensure text fits inside `sunburst` sectors with zero values [[#4580](https://github.com/plotly/plotly.js/pull/4580)]
- Reset `splom` selectBatch and unselectBatch on updates [[#4595](https://github.com/plotly/plotly.js/pull/4595)]
- Retry different mobile/tablet config to render gl3d subplots on various devices & browsers e.g. Brave [[#4549](https://github.com/plotly/plotly.js/pull/4549)]
- Bump `is-mobile` to handle iPad Pro & iPad 7th + iOs v13 + Safari [[#4548](https://github.com/plotly/plotly.js/pull/4548)]
- Fix `orthographic` hover after scroll zoom [[#4562](https://github.com/plotly/plotly.js/pull/4562)]
- Preserve gl3d `scene aspectratio` after `orthographic` scroll zoom [[#4578](https://github.com/plotly/plotly.js/pull/4578)]
- Include gl3d `scene.aspectmode` changes in relayout updates [[#4579](https://github.com/plotly/plotly.js/pull/4579)]
- Apply utf-8 charset in test_dashboard [[#4554](https://github.com/plotly/plotly.js/pull/4554)]


## [1.52.2] -- 2020-02-03

## Fixed
- Handle 'missing' matching axes [[#4529](https://github.com/plotly/plotly.js/pull/4529)]
- Fix hover for `mesh3d`, `isosurface` and `volume`
  when using `plotGlPixelRatio > 1` (bug introduced in 1.45.0) [[#4534](https://github.com/plotly/plotly.js/pull/4534)]
- Fix hover of `mesh3d` traces with `facecolor` and `intensitymode: 'cell'` [[#4539](https://github.com/plotly/plotly.js/pull/4539)]
- Fix gl3d rendering on iPad Pro & iPad 7th + iOs v13 + Safari [[#4360](https://github.com/plotly/plotly.js/pull/4360), [#4546](https://github.com/plotly/plotly.js/pull/4546)]
- Fix pixel-rounding logic for blank bars [[#4522](https://github.com/plotly/plotly.js/pull/4522)]
- Fix `pathbar.visible` updates in `treemap` traces [[#4516](https://github.com/plotly/plotly.js/pull/4516)]
- Fix `waterfall` `'closest'` hover when cursor is below the size axis [[#4537](https://github.com/plotly/plotly.js/pull/4537)]
- Fix mapbox layout layer opacity for raster types [[#4525](https://github.com/plotly/plotly.js/pull/4525)]
- Allow `0` in `grouby` transform `nameformat` templates [[#4526](https://github.com/plotly/plotly.js/pull/4526)]
- Fix `Plotly.validate` for `valType:'any'` attributes [[#4526](https://github.com/plotly/plotly.js/pull/4526)]
- Bump `d3-interpolate` to v1.4.0 [[#4475](https://github.com/plotly/plotly.js/pull/4475)]
- Bump `d3-hierarchy` to v1.1.9 [[#4475](https://github.com/plotly/plotly.js/pull/4475)]
- Fix typo in annotation `align` attribute description [[#4528](https://github.com/plotly/plotly.js/pull/4528)]
- Fix `plot_bgcolor` and `paper_bgcolor` attribute description [[#4536](https://github.com/plotly/plotly.js/pull/4536)]
- Fix `insidetextorientation` description for pie and sunburst traces [[#4523](https://github.com/plotly/plotly.js/pull/4523)]


## [1.52.1] -- 2020-01-13

### Fixed
- Fix handling of `geo.visible` false edge case in order to
  override `template.layout.geo.show*` attributes [[#4483](https://github.com/plotly/plotly.js/pull/4483)]


## [1.52.0] -- 2020-01-08

### Added
- Add `uniformtext` behavior to `bar`, `funnel`, `waterfall`, `pie`, `funnelarea`,
 `sunburst` and `treemap` traces [[#4420](https://github.com/plotly/plotly.js/pull/4420), [#4444](https://github.com/plotly/plotly.js/pull/4444), [#4469](https://github.com/plotly/plotly.js/pull/4469)]
- Add "pre-computed" q1/median/q3 input signature for `box` traces [[#4432](https://github.com/plotly/plotly.js/pull/4432)]
- Add support for legend titles [[#4386](https://github.com/plotly/plotly.js/pull/4386)]
- Add legend items for `choropleth`, `choroplethmapbox`, `cone`, `densitymapbox`,
  `heatmap`, `histogram2d`, `isosurface`, `mesh3d`, `streamtube`,
  `surface`, `volume` traces [[#4386](https://github.com/plotly/plotly.js/pull/4386), [#4441](https://github.com/plotly/plotly.js/pull/4441)]
- Add "auto-fitting" behavior to geo subplots via `geo.fitbounds` attribute [[#4419](https://github.com/plotly/plotly.js/pull/4419)]
- Add support for custom geojson geometries in `choropleth`
  and `scattergeo` traces [[#4419](https://github.com/plotly/plotly.js/pull/4419)]
- Add "exclusive" and "inclusive" quartile-computing algorithm to `box` traces
  via `quartilemethod` attribute [[#4432](https://github.com/plotly/plotly.js/pull/4432)]
- Add `insidetextorientation` attribute to `pie` and `sunburst` traces [[#4420](https://github.com/plotly/plotly.js/pull/4420)]
- Add `intensitymode` to allow cell intensity values in `mesh3d` traces [[#4446](https://github.com/plotly/plotly.js/pull/4446)]
- Add `featureidkey` attribute to `choroplethmapbox`, `choropleth`
  and `scattergeo` traces [[#4419](https://github.com/plotly/plotly.js/pull/4419)]
- Add `geo.visible` shortcut attribute [[#4419](https://github.com/plotly/plotly.js/pull/4419)]
- Add coordinates of mapbox subplot view as a derived property in `plotly_relayout`
  event data [[#4413](https://github.com/plotly/plotly.js/pull/4413)]
- Add modebar buttons `zoomInMapbox` and `zoomOutMapbox` [[#4398](https://github.com/plotly/plotly.js/pull/4398)]
- Add support for typed array in `groupby` transforms `groups` [[#4410](https://github.com/plotly/plotly.js/pull/4410)]
- Add `notifyOnLogging` config option that allows log/warn/error messages
  to show up in notifiers pop-ups [[#4464](https://github.com/plotly/plotly.js/pull/4464)]
- Enable loading locale bundles before plotly.js bundles [[#4453](https://github.com/plotly/plotly.js/pull/4453)]
- Add Korean `ko` locale [[#4315](https://github.com/plotly/plotly.js/pull/4315)]

### Changed
- Skip mapbox subplot map position updates while panning/zooming removing
  potential stuttering [[#4418](https://github.com/plotly/plotly.js/pull/4418)]
- Optimize mapbox `raster` layout layer updates [[#4418](https://github.com/plotly/plotly.js/pull/4418)]
- Improve `sunburst` and `treemap` click events behavior [[#4454](https://github.com/plotly/plotly.js/pull/4454)]
- Improve attribute description of sunburst/treemap `outsidetextfont` [[#4463](https://github.com/plotly/plotly.js/pull/4463)]
- Update source and dist file headers to 2020 [[#4457](https://github.com/plotly/plotly.js/pull/4457)]

### Fixed
- Fix `streamtube` traces with numeric string coordinates
  (bug introduced in 1.51.0) [[#4431](https://github.com/plotly/plotly.js/pull/4431)]
- Correctly handle different data orders in `isosurface` and `volume` traces [[#4431](https://github.com/plotly/plotly.js/pull/4431)]
- Fix symbol numbers in `scattergl` and `splom` traces [[#4465](https://github.com/plotly/plotly.js/pull/4465)]
- Fix `coloraxis` colorbars for `sunburst` and `treemap` with
  values colorscales [[#4444](https://github.com/plotly/plotly.js/pull/4444)]
- Fix inside text fitting for `bar`, `funnel` and `waterfall` traces with
  set `textangle` [[#4444](https://github.com/plotly/plotly.js/pull/4444)]
- Fix handling of invalid values and zero totals for `pie` and `funnelarea` [[#4416](https://github.com/plotly/plotly.js/pull/4416)]
- Fix colorbar of `reversescale` colorscales of heatmap-coloring contours [[#4437](https://github.com/plotly/plotly.js/pull/4437)]
- Fix colorbar templating for "non-root" colorscales [[#4470](https://github.com/plotly/plotly.js/pull/4470)]
- Fix event data and some hover templates for x/y/z heatmap + contour [[#4472](https://github.com/plotly/plotly.js/pull/4472)]
- Fix "toggleothers" behavior for graphs with traces not in legend [[#4406](https://github.com/plotly/plotly.js/pull/4406)]
- Fix `histogram` bingroup logic when `calendars` module is not registered [[#4439](https://github.com/plotly/plotly.js/pull/4439)]
- Fix "almost equal" `branchvalue: 'total'` partial sum cases [[#4442](https://github.com/plotly/plotly.js/pull/4442)]
- Fix handling of `treemap` `pathbar.textfont` [[#4444](https://github.com/plotly/plotly.js/pull/4444)]


## [1.51.3] -- 2019-12-16

### Fixed
- Fix `Plotly.Plots.resize` edge cases ensuring now that
  its promises always resolve [[#4392](https://github.com/plotly/plotly.js/pull/4392)]
- Fix position of link hover labels in vertical `sankey` [[#4404](https://github.com/plotly/plotly.js/pull/4404)]
- Fix `box` autorange for traces with "inverted" notched [[#4388](https://github.com/plotly/plotly.js/pull/4388)]


## [1.51.2] -- 2019-11-25

### Fixed
- Fix `texttemplate`formatting on axes that define
  tick prefixes and suffixes [[#4380](https://github.com/plotly/plotly.js/pull/4380), [#4384](https://github.com/plotly/plotly.js/pull/4384)]
- Fix `cmin` and `cmax` computations during color
  value updates on shared color axes [[#4366](https://github.com/plotly/plotly.js/pull/4366)]
- Fix `contour` and `histogram2dcontour` legend item
  rendering when `reversescale` is turned on [[#4356](https://github.com/plotly/plotly.js/pull/4356)]
- Fix `contour` and `histogram2dcontour` legend item
  rendering when set to a shared color axis [[#4356](https://github.com/plotly/plotly.js/pull/4356)]
- Handle missing `vertexcolor` and `facecolor` during `mesh3d` rendering [[#4353](https://github.com/plotly/plotly.js/pull/4353)]
- No longer coerce `contour` and `colorscale` attributes for `mesh3d`
  when not needed [[#4346](https://github.com/plotly/plotly.js/pull/4346)]
- Remove a duplicate function call in `parcoords` code [[#4357](https://github.com/plotly/plotly.js/pull/4357)]
- Include `opacity` in the `surface` trace plot schema [[#4344](https://github.com/plotly/plotly.js/pull/4344)]
- Mention `legend.bgcolor` default in attribute description [[#4362](https://github.com/plotly/plotly.js/pull/4362)]


## [1.51.1] -- 2019-11-04

### Fixed
- Fix `scattergl` missing points plot and react (bug introduced in 1.33.0) [[#4323](https://github.com/plotly/plotly.js/pull/4323)]
- Skip non-numeric values in `image` trace plot [[#4325](https://github.com/plotly/plotly.js/pull/4325)]


## [1.51.0] -- 2019-10-29

### Added
- Add `image` trace type [[#4289](https://github.com/plotly/plotly.js/pull/4289), [#4307](https://github.com/plotly/plotly.js/pull/4307), [#4313](https://github.com/plotly/plotly.js/pull/4313), [#4319](https://github.com/plotly/plotly.js/pull/4319)]
- Add `automargin` attribute in pie traces, enabling outside text labels
  to push the margins [[#4278](https://github.com/plotly/plotly.js/pull/4278)]
- Add `title.standoff` attribute to cartesian axes, setting the
  distance in pixels between the tick labels and the axis title [[#4279](https://github.com/plotly/plotly.js/pull/4279)]
- Add `hoverongaps` attribute to `heatmap` and `contour` traces,
  for suppressing hover labels on missing data [[#4291](https://github.com/plotly/plotly.js/pull/4291)]
- Add `args2` attribute to `updatemenus` buttons which can be used to
  create toggle buttons [[#4305](https://github.com/plotly/plotly.js/pull/4305)]
- Add `zh-CN` locale [[#4276](https://github.com/plotly/plotly.js/pull/4276), [#4310](https://github.com/plotly/plotly.js/pull/4310)]

### Changed
- Introduce workarounds for "common" (aka axis) hover label clipping
  about the graph's viewport [[#4298](https://github.com/plotly/plotly.js/pull/4298)]
- No longer accept trace `domain` settings where end is not greater
  than start [[#4304](https://github.com/plotly/plotly.js/pull/4304)]

### Fixed
- Fix `streamtube` coloring and positioning when generated
  with non-`xyz` grid signatures [[#4271](https://github.com/plotly/plotly.js/pull/4271)]
- Fix trace-type update calls on mapbox subplots [[#4295](https://github.com/plotly/plotly.js/pull/4295)]
- Fix width of `box` and `violin` items on log position axes [[#4283](https://github.com/plotly/plotly.js/pull/4283)]
- Fix box/meanline offset for one-sided vertical `violin` traces [[#4314](https://github.com/plotly/plotly.js/pull/4314)]
- Fix missing gaps in some `scattergl` line traces [[#4316](https://github.com/plotly/plotly.js/pull/4316)]
- Fix event data during scroll on gl3d subplots with orthographic projections [[#4292](https://github.com/plotly/plotly.js/pull/4292)]
- Handle data with identical positions in `cone` traces [[#4306](https://github.com/plotly/plotly.js/pull/4306)]
- Handle invalid entry before trying to render `treemap` trace [[#4312](https://github.com/plotly/plotly.js/pull/4312)]
- Fix `heatmap` and `contour` description for `connectgaps` [[#4284](https://github.com/plotly/plotly.js/pull/4284)]


## [1.50.1] -- 2019-10-15

### Fixed
- Guard against mirrored + automargin `anchor:'free'` axes (bug introduced in 1.50.0) [[#4273](https://github.com/plotly/plotly.js/pull/4273)]
- Fix `streamtube` trace `starts` case when missing a dimension [[#4265](https://github.com/plotly/plotly.js/pull/4265)]
- Fix `scattergl` performance for drawing legend items of traces with typed arrays [[#4268](https://github.com/plotly/plotly.js/pull/4268)]
- Fix legend item style for markers with typed array colors [[#4268](https://github.com/plotly/plotly.js/pull/4268)]
- Do not attempt to re-hover on exiting subplots [[#4269](https://github.com/plotly/plotly.js/pull/4269)]
- Fix "layout first" transition race condition [[#4262](https://github.com/plotly/plotly.js/pull/4262)]


## [1.50.0] -- 2019-10-07

### Added
- Add `treemap` trace type [[#4185](https://github.com/plotly/plotly.js/pull/4185), [#4219](https://github.com/plotly/plotly.js/pull/4219), [#4227](https://github.com/plotly/plotly.js/pull/4227), [#4242](https://github.com/plotly/plotly.js/pull/4242)]
- Add `texttemplate` attribute to all traces that support on-graph text [[#4071](https://github.com/plotly/plotly.js/pull/4071), [#4179](https://github.com/plotly/plotly.js/pull/4179)]
- Add date custom formatting in `hovertemplate` and `texttemplate` e.g.
  `'%{x|%b %-d, %Y}'` [[#4071](https://github.com/plotly/plotly.js/pull/4071)]
- Add transition support to `bar` trace length, width, on-graph text positioning,
  marker style and error bars [[#4180](https://github.com/plotly/plotly.js/pull/4180), [#4186](https://github.com/plotly/plotly.js/pull/4186)]
- Add attribute `count`, colorscale support and many `hoverinfo` / `textinfo` flags
  to `sunburst` traces [[#4185](https://github.com/plotly/plotly.js/pull/4185), [#4245](https://github.com/plotly/plotly.js/pull/4245)]
- Add constraint info to `parcats` click and hover events [[#4211](https://github.com/plotly/plotly.js/pull/4211)]
- Add support for legend scrolling via touch interactions [[#3873](https://github.com/plotly/plotly.js/pull/3873), [#4214](https://github.com/plotly/plotly.js/pull/4214)]
- Add `ru` and `uk` locales [[#4204](https://github.com/plotly/plotly.js/pull/4204)]
- Publish minified dist npm packages for the main plotly.js bundle and
  all our partial bundles [[#4169](https://github.com/plotly/plotly.js/pull/4169)]

### Changed
- Cap the number of redraws triggered by the auto-margin routine,
  which should prevent all potential infinite redraw loops [[#4216](https://github.com/plotly/plotly.js/pull/4216)]
- Improve cartesian axis draw performance by (1) computing its bounding box
  only when required and (2) using a bounding-box computation cache [[#4165](https://github.com/plotly/plotly.js/pull/4165)]
- Log message when margin-push values are too big to be considered during
  auto-margin computations [[#4160](https://github.com/plotly/plotly.js/pull/4160)]
- Log message when legend position is constrained into graph viewbox [[#4160](https://github.com/plotly/plotly.js/pull/4160)]
- Process layout image using data URI synchronously [[#4105](https://github.com/plotly/plotly.js/pull/4105)]
- Adapt default axis ranges to `rangemode` values `'tozero'` and `'nonnegative'` [[#4171](https://github.com/plotly/plotly.js/pull/4171)]
- Show zeroline even when no grid lines are present [[#4189](https://github.com/plotly/plotly.js/pull/4189)]
- Use `mapbox-gl` version 1.3.2 [[#4230](https://github.com/plotly/plotly.js/pull/4230)]
- Make `touchmove` event listener non passive on mobile drag [[#4231](https://github.com/plotly/plotly.js/pull/4231)]
- Improve `streamtube` trace description [[#4181](https://github.com/plotly/plotly.js/pull/4181)]
- Improve `indicator` trace description [[#4246](https://github.com/plotly/plotly.js/pull/4246)]
- Improve legend `x` and `y` attribute descriptions [[#4160](https://github.com/plotly/plotly.js/pull/4160)]

### Fixed
- Fix attempt at fixing gl3d in Chrome 77 problems [[#4256](https://github.com/plotly/plotly.js/pull/4256)]
- Fix numerous legend positioning bug [[#4160](https://github.com/plotly/plotly.js/pull/4160)]
- Fix numerous axis `automargin` bugs [[#4165](https://github.com/plotly/plotly.js/pull/4165), [#4216](https://github.com/plotly/plotly.js/pull/4216)]
- Correctly handle `<br>` and `\n` in `scattermapbox` on-graph text [[#4176](https://github.com/plotly/plotly.js/pull/4176)]
- Fix `scattergl` hover over nulls (bug introduced in 1.45.0) [[#4213](https://github.com/plotly/plotly.js/pull/4213)]
- Correctly remove off-screen annotations during pan interactions
  (bug introduced in 1.40.0) [[#4170](https://github.com/plotly/plotly.js/pull/4170)]
- Fix `contour` and `contourcarpet` label formatting via colorbar settings
  (bug introduced in 1.48.0) [[#4177](https://github.com/plotly/plotly.js/pull/4177)]
- Fix background rectangle dimensions for horizontal grouped legends [[#4160](https://github.com/plotly/plotly.js/pull/4160)]
- Correctly handle non-linear axis types during transitions [[#4249](https://github.com/plotly/plotly.js/pull/4249)]
- Fix `branchvalues: 'total'` for generated sunburst sectors [[#4253](https://github.com/plotly/plotly.js/pull/4253)]
- Fix `Download plot` translations [[#4148](https://github.com/plotly/plotly.js/pull/4148)]
- Fix `fr` translations for "Click to enter --- title" [[#4204](https://github.com/plotly/plotly.js/pull/4204)]
- Fix tiny zoombox behavior [[#4188](https://github.com/plotly/plotly.js/pull/4188)]
- Fix rendering of constraint contours with rounded-off edge path [[#4102](https://github.com/plotly/plotly.js/pull/4102)]
- Fix "autoscale" modebar button bug where it sometimes toggled axis `showspikes` [[#4241](https://github.com/plotly/plotly.js/pull/4241)]
- Fix multi-axis transition axis-to-axis range "leaks" [[#4167](https://github.com/plotly/plotly.js/pull/4167)]
- Fix `toggleHover` and `resetViews` modebar buttons for
  some partial bundle + graph setups [[#4184](https://github.com/plotly/plotly.js/pull/4184)]
- Correctly list `color-rgba`  module as dependency [[#4207](https://github.com/plotly/plotly.js/pull/4207)]
- Fix third-party dependency listing for `gl-cone3d` and `gl-streamtube3d` [[#4208](https://github.com/plotly/plotly.js/pull/4208), [#4215](https://github.com/plotly/plotly.js/pull/4215)]
- Fix `line.width` attr declaration in `*contour` traces [[#4218](https://github.com/plotly/plotly.js/pull/4218)]
- Remove hover attribute from `carpet` and `contourcarpet` schema
  (as they do not support hover yet) [[#4102](https://github.com/plotly/plotly.js/pull/4102)]


## [1.49.5] -- 2019-09-18

### Changed
-  Drop support for IE10 and IE9 as part of browserify upgrade [[#4168](https://github.com/plotly/plotly.js/pull/4168)]

### Fixed
- Clear rejected promises from queue when calling `Plotly.react` [[#4197](https://github.com/plotly/plotly.js/pull/4197)]
- Do not attempt to remove non-existing mapbox layout source and layers [[#4197](https://github.com/plotly/plotly.js/pull/4197)]
- Invalid mapbox layout layers with blank-string tile entries [[#4197](https://github.com/plotly/plotly.js/pull/4197)]
- Fix hover labels for `choroplethmapbox` with number `locations` items [[#4197](https://github.com/plotly/plotly.js/pull/4197)]


## [1.49.4] -- 2019-08-22

### Fixed
- Fix access token validation logic for custom mapbox style URLs
  (regression introduced in 1.49.0) [[#4144](https://github.com/plotly/plotly.js/pull/4144)]
- Fix rendering of cartesian ticks under `mirror: 'all'` [[#4140](https://github.com/plotly/plotly.js/pull/4140)]


## [1.49.3] -- 2019-08-20

### Fixed
- Fix graphs with `visible: false` `sankey` traces [[#4123](https://github.com/plotly/plotly.js/pull/4123)]
- Fix `scattergl` with `mode: 'text'` and `text` arrays longer
  than the coordinates arrays [[#4125](https://github.com/plotly/plotly.js/pull/4125), [#4126](https://github.com/plotly/plotly.js/pull/4126)]
- Fix `rangeslider` positioning when left margin is pushed
  by other component [[#4127](https://github.com/plotly/plotly.js/pull/4127)]


## [1.49.2] -- 2019-08-13

### Fixed
- Fix gl3d hover behavior when multiple points share identical position [[#4096](https://github.com/plotly/plotly.js/pull/4096)]
- Fix `mapbox-gl@1.1.1` dependency version listing in `package.json` [[#4094](https://github.com/plotly/plotly.js/pull/4094)]
- Fix decimal and thousands separator declaration for Italian (`it`) locale [[#4122](https://github.com/plotly/plotly.js/pull/4122)]
- Fix `indicator` `steps` attribute declaration [[#4115](https://github.com/plotly/plotly.js/pull/4115)]
- Performance fix - use `Axes.prepTicks` (not `Axes.calcTicks`) for `indicator`
  number and delta formatting [[#4099](https://github.com/plotly/plotly.js/pull/4099)]


## [1.49.1] -- 2019-07-31

### Fixed
- Fix `parcoords` bug when dimension values are all zeroes (bug introduced in 1.49.0) [[#4080](https://github.com/plotly/plotly.js/pull/4080)]
- Fix `parcoords` select line rendering when constraint range falls below range [[#4083](https://github.com/plotly/plotly.js/pull/4083)]
- Fix `parcoords` select line rendering when selecting outside displayed axis range [[#4087](https://github.com/plotly/plotly.js/pull/4087)]
- Fix `parcoords` select by click when preceded by click away from axis [[#4089](https://github.com/plotly/plotly.js/pull/4089)]
- Fix `mapbox.style` values in attribution declaration [[#4079](https://github.com/plotly/plotly.js/pull/4079)]
- Remove unused variable from `scatter3d` shader [[#4090](https://github.com/plotly/plotly.js/pull/4090)]


## [1.49.0] -- 2019-07-24

### Added
- Add `indicator` traces [[#3978](https://github.com/plotly/plotly.js/pull/3978), [#4007](https://github.com/plotly/plotly.js/pull/4007), [#4014](https://github.com/plotly/plotly.js/pull/4014), [#4037](https://github.com/plotly/plotly.js/pull/4037), [#4029](https://github.com/plotly/plotly.js/pull/4029)]
- Add `choroplethmapbox` traces [[#3988](https://github.com/plotly/plotly.js/pull/3988)]
- Add `densitymapbox` traces [[#3993](https://github.com/plotly/plotly.js/pull/3993)]
- Add new mapbox `style` values: `open-street-map`, `carto-positron`, `carto-darkmatter`,
  `stamen-terrain`, `stamen-toner`, `stamen-watercolor` and `white-bg`
  that do not require a Mapbox access token [[#3987](https://github.com/plotly/plotly.js/pull/3987), [#4068](https://github.com/plotly/plotly.js/pull/4068)]
- Add support for `sourcetype` value `raster` and `image` and `type` `raster`
  for mapbox layout layers [[#4006](https://github.com/plotly/plotly.js/pull/4006)]
- Add `below` attribute to `scattermapbox` traces [[#4058](https://github.com/plotly/plotly.js/pull/4058)]
- Add support for `below: 'traces'` in mapbox layout layers [[#4058](https://github.com/plotly/plotly.js/pull/4058)]
- Add `sourceattribution` attribute to mapbox layout layers [[#4069](https://github.com/plotly/plotly.js/pull/4069)]
- Add `labelangle` and `labelside` attributes to `parcoords` traces [[#3966](https://github.com/plotly/plotly.js/pull/3966)]
- Add `doubleClickDelay` config option [[#3991](https://github.com/plotly/plotly.js/pull/3991)]
- Add `showEditInChartStudio` config option [[#4061](https://github.com/plotly/plotly.js/pull/4061)]

### Changed
- Bump `mapbox-gl` to `v1.1.1` [[#3987](https://github.com/plotly/plotly.js/pull/3987), [#4035](https://github.com/plotly/plotly.js/pull/4035)]
- Include source attribution on mapbox subplots and image exports [[#4069](https://github.com/plotly/plotly.js/pull/4069)]
- Improve mapbox error messages and attribute descriptions [[#4035](https://github.com/plotly/plotly.js/pull/4035)]
- Do not try to resize hidden graph divs under `responsive:true` [[#3972](https://github.com/plotly/plotly.js/pull/3972)]
- Improve robustness of `sankey` traces with circular links [[#3932](https://github.com/plotly/plotly.js/pull/3932)]
- Use `URL.createObjectURL` during `Plotly.toImage` and
  `Plotly.downloadImage` improving performance [[#4008](https://github.com/plotly/plotly.js/pull/4008)]
- Make `parcoords` pick layer 100% invisible [[#3946](https://github.com/plotly/plotly.js/pull/3946)]
- (dev-only) drop "pull-font-svg" pre-process step [[#4062](https://github.com/plotly/plotly.js/pull/4062)]

### Fixed
- Fix rendering of geo traces with `locationmode` and no base layers
  (bug introduced in 1.48.0) [[#3994](https://github.com/plotly/plotly.js/pull/3994)]
- Fix lakes and rivers geometry on scoped geo subplots
  (bug introduced in 1.48.0) [[#4048](https://github.com/plotly/plotly.js/pull/4048)]
- Fix `heatmap` rendering for traces with extra categorical coordinates
  (bug introduced in 1.48.0) [[#4038](https://github.com/plotly/plotly.js/pull/4038)]
- Do not show zero-height bar rendering when their `marker.line.width` is zero
  (bug introduced in 1.48.3) [[#4056](https://github.com/plotly/plotly.js/pull/4056)]
- Do not show prefix and suffix on log axis minor ticks showing digits [[#4064](https://github.com/plotly/plotly.js/pull/4064)]
- Fix inconsistent `parcoords` behavior when data is outside range [[#3794](https://github.com/plotly/plotly.js/pull/3794)]
- Fix `parcoods` default tick formatting [[#3966](https://github.com/plotly/plotly.js/pull/3966), [#4011](https://github.com/plotly/plotly.js/pull/4011), [#4013](https://github.com/plotly/plotly.js/pull/4013)]
- Fix pseudo-html and MathJax rendering for `parcoords` traces [[#3966](https://github.com/plotly/plotly.js/pull/3966)]
- Fix `marker.line.color` default for `choropleth` traces [[#3988](https://github.com/plotly/plotly.js/pull/3988)]
- Fix `scatter3d` and `scattergl` handling of `rgb` colors
  with extra alpha values [[#3904](https://github.com/plotly/plotly.js/pull/3904), [#4009](https://github.com/plotly/plotly.js/pull/4009)]
- Fix zoomed-in box/violin hover labels edge cases [[#3965](https://github.com/plotly/plotly.js/pull/3965)]
- Fix `hoverinfo` & `hovertemplate` initial, delta and final flags
  for `waterfall` traces [[#3963](https://github.com/plotly/plotly.js/pull/3963)]
- Fix `hovertemplate` default number formatting for
  `choropleth`, `scattergeo`, `scatterpolar(gl)`, `barpolar`
  and `scatterternary` traces [[#3968](https://github.com/plotly/plotly.js/pull/3968)]
- Remove `sliders` / `updatemenus` command observer mutation [[#4023](https://github.com/plotly/plotly.js/pull/4023)]
- Fix plot-schema `anim` listing for traces that do not (yet) animate [[#4024](https://github.com/plotly/plotly.js/pull/4024)]
- Fix `rangeslider` style during selections [[#4022](https://github.com/plotly/plotly.js/pull/4022)]
- Fix per-value `categoryorder` for `box` and `violin` traces [[#3983](https://github.com/plotly/plotly.js/pull/3983)]
- Fix handling of non-numeric `marker.line.width` array items [[#4056](https://github.com/plotly/plotly.js/pull/4056), [#4063](https://github.com/plotly/plotly.js/pull/4063)]
- Fix `downloadImage` for images of more than 2MB in size in Chrome [[#4008](https://github.com/plotly/plotly.js/pull/4008)]
- Fix `plotly_clickannotation` triggering when `editable:true` [[#3979](https://github.com/plotly/plotly.js/pull/3979)]
- Remove unused `font-atlas-sdf` dependency [[#3952](https://github.com/plotly/plotly.js/pull/3952)]
- Fix `tickformat` attribute description links to d3 formatting language [[#4044](https://github.com/plotly/plotly.js/pull/4044)]
- Fix typo in `error_(x|y).type` description [[#4030](https://github.com/plotly/plotly.js/pull/4030)]
- Fix typo in `colorscale` description [[#4060](https://github.com/plotly/plotly.js/pull/4060)]


## [1.48.3] -- 2019-06-13

### Fixed
- Fix `hoverinfo` and `hovertemplate` behavior for `funnel` traces [[#3958](https://github.com/plotly/plotly.js/pull/3958)]


## [1.48.2] -- 2019-06-11

### Fixed
- Fix rendering after 1d -> 2d -> 1d drag motion
  under `dragmode: 'zoom'` (bug introduced in 1.48.0) [[#3950](https://github.com/plotly/plotly.js/pull/3950)]
- Fix for `scattergl` hover and click events to give the 'top' point
  instead of the 'bottom' point [[#3924](https://github.com/plotly/plotly.js/pull/3924)]
- Fix `contour` label rendering for non-monotonically increasing x/y [[#3934](https://github.com/plotly/plotly.js/pull/3934)]
- Fix `carpet` axis title position for decreasing a/b coords [[#3927](https://github.com/plotly/plotly.js/pull/3927)]
- Fix multiple single-valued overlaid autobinned `histogram` edge case [[#3935](https://github.com/plotly/plotly.js/pull/3935)]
- Fix `parcoords` `tickvals` and `ticktext` documentation [[#3925](https://github.com/plotly/plotly.js/pull/3925)]


## [1.48.1] -- 2019-05-30

### Fixed
- Fix single-sample-point `histogram2d` traces with set bins settings [[#3922](https://github.com/plotly/plotly.js/pull/3922)]
- Fix bingroup attributes for `histogram2dcontour` traces [[#3922](https://github.com/plotly/plotly.js/pull/3922)]
- Fix hover label content on empty `histogram2d` bins [[#3922](https://github.com/plotly/plotly.js/pull/3922)]


## [1.48.0] -- 2019-05-28

### Added
- Add `funnel` traces [[#3817](https://github.com/plotly/plotly.js/pull/3817), [#3911](https://github.com/plotly/plotly.js/pull/3911)]
- Add `funnelarea` traces [[#3876](https://github.com/plotly/plotly.js/pull/3876), [#3912](https://github.com/plotly/plotly.js/pull/3912)]
- Add support for shared color axes via `coloraxis` attributes
  in the layout [[#3803](https://github.com/plotly/plotly.js/pull/3803), [#3786](https://github.com/plotly/plotly.js/pull/3786), [#3901](https://github.com/plotly/plotly.js/pull/3901), [#3916](https://github.com/plotly/plotly.js/pull/3916)]
- Add support for sorting categorical cartesian axes by value [[#3864](https://github.com/plotly/plotly.js/pull/3864)]
- Add `bingroup` to `histogram`, `histogram2d` and `histogram2dcontour` to group
  traces to have compatible auto-bin values [[#3845](https://github.com/plotly/plotly.js/pull/3845)]
- Add legend `itemclick` and `itemdoubleclick` attributes to set or disable
  the legend item click and double-click behavior [[#3862](https://github.com/plotly/plotly.js/pull/3862)]
- Add `insidetextanchor` attribute for `bar` and `waterfall` traces [[#3817](https://github.com/plotly/plotly.js/pull/3817)]
- Add `textangele` attribute for `bar` and `waterfall` traces [[#3817](https://github.com/plotly/plotly.js/pull/3817)]
- Add `textinfo` to `waterfall` traces [[#3790](https://github.com/plotly/plotly.js/pull/3790)]
- Add support for side-by-side `scatter3d` `marker` and `line` colorbars [[#3803](https://github.com/plotly/plotly.js/pull/3803)]
- Add `meta` attribute to traces to complement `layout.meta` [[#3865](https://github.com/plotly/plotly.js/pull/3865)]
- Emit `plotly_relayouting` during drag motion on subplots [[#3888](https://github.com/plotly/plotly.js/pull/3888)]
- Add Swedish locale (`sv`) [[#3821](https://github.com/plotly/plotly.js/pull/3821)]

### Changed
- Use `sane-topojson@v3.0.1` (backed by Natural Earth v4.1.0 shapefiles)
  to generate geographic features in `geo` subplots. Most notably, the Russia/Ukraine
  border has been updated [[#3856](https://github.com/plotly/plotly.js/pull/3856)]
- Draw `box` and `violin` points as legend item when other parts have opacity `0` [[#3846](https://github.com/plotly/plotly.js/pull/3846)]
- Draw `marker.line` for bars with no-span [[#3848](https://github.com/plotly/plotly.js/pull/3848)]
- Do not make request for topojson files when drawing geo subplot
  without geographic features [[#3856](https://github.com/plotly/plotly.js/pull/3856)]

### Fixed
- Fix `categoryarray` ordering for `heatmap` and `contour` traces [[#3827](https://github.com/plotly/plotly.js/pull/3827)]
- Fix `heatmap` brick positioning for non-overlapping categories [[#3827](https://github.com/plotly/plotly.js/pull/3827)]
- Fix `Plotly.update` calls that resulted in removal of modebar buttons [[#3825](https://github.com/plotly/plotly.js/pull/3825)]
- Fix auto-range for one-sided `violin` with set `width` [[#3842](https://github.com/plotly/plotly.js/pull/3842)]
- Fix hover label placement for one-sided `violin` with set `width` [[#3842](https://github.com/plotly/plotly.js/pull/3842)]
- Fix `scattergl` mode ordering in/out of selections [[#3810](https://github.com/plotly/plotly.js/pull/3810)]
- Fix `scattergl` unselected styling in/out of select/lasso dragmode [[#3810](https://github.com/plotly/plotly.js/pull/3810)]
- Fix `automargin` edge cases where draw code can be stuck in infinite loops [[#3811](https://github.com/plotly/plotly.js/pull/3811)]
- Fix `locationmode: 'USA-states'` on world scope under `50m` resolution [[#3856](https://github.com/plotly/plotly.js/pull/3856)]
- Fix reset view interactions on geo subplots following `geo.scope` updates [[#3856](https://github.com/plotly/plotly.js/pull/3856)]
- Fix `Plotly.animate`  on graphs with multiple subplot types [[#3860](https://github.com/plotly/plotly.js/pull/3860)]
- Fix `filter` transforms that result in empty coordinate arrays [[#3766](https://github.com/plotly/plotly.js/pull/3766)]
- Fix handling of `0` number in `pie` and `sunburst` text and hover [[#3847](https://github.com/plotly/plotly.js/pull/3847)]
- Fix `sunburst`  text in sectors centered around theta=180 [[#3907](https://github.com/plotly/plotly.js/pull/3907)]
- Fix handling of number `0` in `sunburst` ids/parents [[#3903](https://github.com/plotly/plotly.js/pull/3903)]
- Fix selection range event data on category axes [[#3869](https://github.com/plotly/plotly.js/pull/3869)]
- Fix `contour` with heatmap coloring rendering after graph resize [[#3803](https://github.com/plotly/plotly.js/pull/3803)]
- Fix `histogram2d` hover label content for trace with bins spanning multiple `y` sample values [[#3890](https://github.com/plotly/plotly.js/pull/3890)]
- Fix `parcoords` rendering of first value when it is part of own `constraintrange` [[#3915](https://github.com/plotly/plotly.js/pull/3915)]
- Fix rgba colorscale fallback for `parcoords` traces [[#3917](https://github.com/plotly/plotly.js/pull/3917)]
- Fix de-selected style of error bar on `bar` traces [[#3644](https://github.com/plotly/plotly.js/pull/3644)]
- Fix hover labels rendering for some zoomed-in `violin` traces [[#3889](https://github.com/plotly/plotly.js/pull/3889)]
- Fix `mesh3d` `vertexcolor` attribute description [[#3688](https://github.com/plotly/plotly.js/pull/3688)]


## [1.47.4] -- 2019-04-25

### Fixed
- Fix graphs with `sankey` and cartesian subplots [[#3802](https://github.com/plotly/plotly.js/pull/3802)]
- Fix selection of `bar` traces on subplot with a range slider [[#3806](https://github.com/plotly/plotly.js/pull/3806)]


## [1.47.3] -- 2019-04-18

### Fixed
- Fix MathJax rendering in Firefox [[#3783](https://github.com/plotly/plotly.js/pull/3783)]
- Fix `waterfall` hover under `hovermode: 'closest'` [[#3778](https://github.com/plotly/plotly.js/pull/3778)]
- Fix `waterfall` `connector.line.width` updates [[#3789](https://github.com/plotly/plotly.js/pull/3789)]
- Fix `waterfall` positioning on date axes [[#3791](https://github.com/plotly/plotly.js/pull/3791)]
- Fix `waterfall` default connector line color [[#3788](https://github.com/plotly/plotly.js/pull/3788)]
- Fix `hoverlabel.align` behavior for centered hover labels [[#3781](https://github.com/plotly/plotly.js/pull/3781)]


## [1.47.2] -- 2019-04-15

### Fixed
- Fix bar `'auto'` and `'inside'` `textposition` rendering on log size axes [[#3762](https://github.com/plotly/plotly.js/pull/3762), [#3773](https://github.com/plotly/plotly.js/pull/3773)]
- Fix matching axes autorange algorithm for date axes [[#3772](https://github.com/plotly/plotly.js/pull/3772)]
- Fix SVG gradient rendering (colorbar and marker gradient) when `<base>` is present on page [[#3765](https://github.com/plotly/plotly.js/pull/3765)]


## [1.47.1] -- 2019-04-10

### Fixed
- Fix console errors during selections (bug introduced in 1.47.0) [[#3755](https://github.com/plotly/plotly.js/pull/3755)]


## [1.47.0] -- 2019-04-09

### Added
- New `volume` gl3d trace type [[#3488](https://github.com/plotly/plotly.js/pull/3488)]
- Implement node grouping via box and lasso selections for `sankey` traces [[#3712](https://github.com/plotly/plotly.js/pull/3712), [#3750](https://github.com/plotly/plotly.js/pull/3750)]
- Implement `hovermode: 'x'`  for `sankey` traces,
  allowing users to compare links in a flow on hover [[#3730](https://github.com/plotly/plotly.js/pull/3730)]
- Add way for `Plotly.toImage` and `Plotly.downloadImage` to export images
  with current graph width/height by passing width/height option as `null` [[#3746](https://github.com/plotly/plotly.js/pull/3746)]
- Add legend attribute `itemsizing` with value `'constant'` making legend item symbol sizing
  independent of the sizing of their corresponding trace item [[#3732](https://github.com/plotly/plotly.js/pull/3732)]
- Add `hoverlabel.align` with value `'left'`, `'right'` and `'auto'` to set the horizontal
  alignment of the text content within hover labels [[#3753](https://github.com/plotly/plotly.js/pull/3753)]
- Add `contour.start`, `contour.end` and `contour.size` attribute to `surface` traces [[#3469](https://github.com/plotly/plotly.js/pull/3469)]
- Add `isosurface` and `volume` to the `gl3d` bundle [[#3488](https://github.com/plotly/plotly.js/pull/3488)]

### Changed
- Allow re-plot during drag interactions [[#3716](https://github.com/plotly/plotly.js/pull/3716)]
- Use high-precision in `scattergl` error bars shader [[#3739](https://github.com/plotly/plotly.js/pull/3739)]

### Fixed
- Fix implementation of geo `lonaxis` and `lataxis` attribute `tick0` [[#3706](https://github.com/plotly/plotly.js/pull/3706)]
- Fix `scrollZoom: false` configuration on mapbox subplots [[#3745](https://github.com/plotly/plotly.js/pull/3745)]
- Fix rendering of alpha channel in `mesh3d` traces [[#3744](https://github.com/plotly/plotly.js/pull/3744)]
- Fix `hoverlabel.namelength: 0` case [[#3734](https://github.com/plotly/plotly.js/pull/3734)]
- Fix implementation of `hoverlabel.namelength` for `pie`, `sankey`, `sunburst` and
  the gl3d traces [[#3734](https://github.com/plotly/plotly.js/pull/3734)]
- Fix `waterfall` rendering when transforms filter out all
  increasing or decreasing bars [[#3720](https://github.com/plotly/plotly.js/pull/3720)]
- Fix clip-path attributes for pages with parenthesis in their `<base>` URL [[#3725](https://github.com/plotly/plotly.js/pull/3725)]


## [1.46.1] -- 2019-04-02

### Fixed
- Fix `bar` traces that set `textfont` but don't have `text`
  (bug introduced in 1.46.0) [[#3715](https://github.com/plotly/plotly.js/pull/3715)]
- Fix hover text formatting in `waterfall` traces [[#3711](https://github.com/plotly/plotly.js/pull/3711)]
- Fix `surface` and `mesh3d` color scales with more than 256 items [[#3702](https://github.com/plotly/plotly.js/pull/3702)]


## [1.46.0] -- 2019-04-01

### Added
- New `waterfall` trace type [[#3531](https://github.com/plotly/plotly.js/pull/3531), [#3708](https://github.com/plotly/plotly.js/pull/3708)]
- New `sunburst` trace type [[#3594](https://github.com/plotly/plotly.js/pull/3594)]
- Add attributes `node.x` and `node.y` to `sankey` traces [[#3583](https://github.com/plotly/plotly.js/pull/3583)]
- Implement `connectgaps` on `surface` traces [[#3638](https://github.com/plotly/plotly.js/pull/3638)]
- Implement `hovertemplate` for `box` and `violin` points [[#3685](https://github.com/plotly/plotly.js/pull/3685)]

### Changed
- Display hover labels above modebar, ensuring that the hover labels
  are always visible within the graph div [[#3589](https://github.com/plotly/plotly.js/pull/3589), [#3678](https://github.com/plotly/plotly.js/pull/3678)]

### Fixed
- Fix horizontal legend item wrapping by pushing overflowed items to newline [[#3628](https://github.com/plotly/plotly.js/pull/3628)]
- Fix erroneous gap for histogram under relative `barmode` [[#3652](https://github.com/plotly/plotly.js/pull/3652)]
- Fix position of overlapping grouped bars within trace [[#3680](https://github.com/plotly/plotly.js/pull/3680)]
- Fix `violin` `bandwidth` logic for traces with identical values in sample [[#3626](https://github.com/plotly/plotly.js/pull/3626)]
- Fix `violin` trace `scalegroup` description [[#3687](https://github.com/plotly/plotly.js/pull/3687)]
- Fix stacked scatter for groupby traces [[#3692](https://github.com/plotly/plotly.js/pull/3692)]
- Fix outside text on empty items in `bar` traces under `textposition: 'outside'` [[#3701](https://github.com/plotly/plotly.js/pull/3701)]
- Fix `pie` un-hover event emission after updates [[#3662](https://github.com/plotly/plotly.js/pull/3662), 3690]
- Fix `scatter` line decimation algo for filled trace with far-away data points [[#3696](https://github.com/plotly/plotly.js/pull/3696)]
- Fix `heatmap` and `contour` computation for traces with category coordinates containing `0` [[#3691](https://github.com/plotly/plotly.js/pull/3691)]
- Fix zoom interactions on gl3d subplots using an orthographic projection [[#3601](https://github.com/plotly/plotly.js/pull/3601)]
- Fix miscellaneous gl3d camera on-initialization bugs [[#3585](https://github.com/plotly/plotly.js/pull/3585)]
- Fix `surface` contour line rendering in some Firefox versions [[#3670](https://github.com/plotly/plotly.js/pull/3670)]
- Fix rendering of marker points and gl3d subplots on date axes (or with coordinates close to 64K floating limits)
  for WebGL-based traces on some iOS devices [[#3666](https://github.com/plotly/plotly.js/pull/3666), [#3672](https://github.com/plotly/plotly.js/pull/3672), [#3674](https://github.com/plotly/plotly.js/pull/3674), [#3676](https://github.com/plotly/plotly.js/pull/3676)]
- Fix center-aligned hover labels positioning [[#3681](https://github.com/plotly/plotly.js/pull/3681)]


## [1.45.3] -- 2019-03-19

### Fixed
- Fix legend click dispatch on legend item symbols (bug introduced in 1.44.0) [[#3635](https://github.com/plotly/plotly.js/pull/3635)]
- Fix overlapping of "very close" hover labels [[#3645](https://github.com/plotly/plotly.js/pull/3645)]
- Fix `hovermode` default logic for stacked `scatter` traces [[#3646](https://github.com/plotly/plotly.js/pull/3646)]
- Fix `glPixelRatio` handling in `surface` contour lines [[#3641](https://github.com/plotly/plotly.js/pull/3641)]
- Fix `gl2d` subplot zoombox appearance (bug introduced in 1.32.0) [[#3647](https://github.com/plotly/plotly.js/pull/3647)]
- Fix axis label updates on `gl2d` subplots on scroll (bug introduced in 1.32.0) [[#3647](https://github.com/plotly/plotly.js/pull/3647)]
- Fix `dragmode` relayout calls on `gl2d` subplots [[#3647](https://github.com/plotly/plotly.js/pull/3647)]
- Improve info about `<extra>` in `hovertemplate` description [[#3623](https://github.com/plotly/plotly.js/pull/3623)]


## [1.45.2] -- 2019-03-07

### Fixed
- Fix webpack builds that include `sankey` by upgrading d3-sankey-circular to 0.33.0 (bug introduced in 1.45.0) [[#3611](https://github.com/plotly/plotly.js/pull/3611)]

## [1.45.1] -- 2019-03-05

### Fixed
- Fix axis automargin pushes for rotated tick labels [[#3605](https://github.com/plotly/plotly.js/pull/3605)]
- Fix automargin logic on (very) small graphs [[#3605](https://github.com/plotly/plotly.js/pull/3605)]
- Fix locales support in `hovertemplate` strings [[#3586](https://github.com/plotly/plotly.js/pull/3586)]
- Fix gl3d reset camera buttons for scenes with orthographic projection [[#3597](https://github.com/plotly/plotly.js/pull/3597)]
- Fix typed array support for `parcoords` dimensions values and `line.color` [[#3598](https://github.com/plotly/plotly.js/pull/3598)]
- Fix `cone` rendering on some older browsers [[#3591](https://github.com/plotly/plotly.js/pull/3591)]
- Fix `lightposition` behavior for `cone` traces [[#3591](https://github.com/plotly/plotly.js/pull/3591)]
- Fix `lightposition` behavior for `streamtube` trace [[#3593](https://github.com/plotly/plotly.js/pull/3593)]
- Remove unused files from `gl-cone3d` dependency [[#3591](https://github.com/plotly/plotly.js/pull/3591)]
- Remove unused files from `gl-streamtube3d` dependency [[#3593](https://github.com/plotly/plotly.js/pull/3593)]


## [1.45.0] -- 2019-02-26

### Added
- Add support for circular networks in `sankey` traces [[#3406](https://github.com/plotly/plotly.js/pull/3406), [#3535](https://github.com/plotly/plotly.js/pull/3535), [#3564](https://github.com/plotly/plotly.js/pull/3564)]
- Add matching axes behavior to cartesian axes via new axis attribute and
  new splom attribute dimensions attribute `matches` [[#3506](https://github.com/plotly/plotly.js/pull/3506), [#3565](https://github.com/plotly/plotly.js/pull/3565)]
- Add attributes `alignmentgroup` and `offsetgroup` to `bar`, `histogram`, `box`
  and `violin` traces to make cross-trace positioning easier [[#3529](https://github.com/plotly/plotly.js/pull/3529)]
- Add support for orthographic projections in gl3d subplots via new attribute
  `scene.camera.projection.type` [[#3550](https://github.com/plotly/plotly.js/pull/3550)]
- Add `cmid` and `zmid` colorscale attributes to pick the middle of the color
  range during the auto-colorscale computations [[#3549](https://github.com/plotly/plotly.js/pull/3549)]
- Add support for `sankey` grouping via new attribute `groups` [[#3556](https://github.com/plotly/plotly.js/pull/3556)]
- Add support for `sankey` concentration `colorscales` [[#3501](https://github.com/plotly/plotly.js/pull/3501)]
- Add support for `hovertemplate` for all `gl3d` traces, `contour`,
  `heatmap`, `histogram*`, `parcats`, `scattercarpet` and `splom` traces [[#3530](https://github.com/plotly/plotly.js/pull/3530)]
- Add `hovertext` attribute to all traces that support hover 'text',
  for consistency with traces that already have an `hovertext` attribute [[#3553](https://github.com/plotly/plotly.js/pull/3553)]
- Add support for layout `meta` templating in trace `name`,
  `rangeselector`, `updatemenus` and `sliders` labels as well as
  within `hovertemplate` [[#3548](https://github.com/plotly/plotly.js/pull/3548)]
- Add support for `opacity` to `isosurface` traces [[#3545](https://github.com/plotly/plotly.js/pull/3545)]
- Add `mapbox.layers` attributes: `minzoom`, `maxzoom`, `line.dash` and `symbol.placement` [[#3399](https://github.com/plotly/plotly.js/pull/3399)]

### Changed
- More consistency pass down WebGL pixel ratio to gl3d renderers,
  this leads to better axis line and error bar rendering on some hardwares [[#3573](https://github.com/plotly/plotly.js/pull/3573)]
- Performance boost for `isosurface` trace generation [[#3521](https://github.com/plotly/plotly.js/pull/3521)]
- Export template string regex of `Lib` [[#3548](https://github.com/plotly/plotly.js/pull/3548)]
- Do no cluster points in  `scattergl` trace with less than 1e5 data pts,
  this fixes reported "missing data points" scenarios [[#3578](https://github.com/plotly/plotly.js/pull/3578)]

### Fixed
- Fix selection outline clearing during cartesian axis-range relayout calls
  (bug introduced in 1.42.0) [[#3577](https://github.com/plotly/plotly.js/pull/3577)]
- Fix modebar interactions on graphs with `scatter3d` traces with
  marker colorscales (bug introduced in 1.44.0) [[#3554](https://github.com/plotly/plotly.js/pull/3554)]
- Fix axis `automargin` for superimposed subplots (bug introduced in 1.44.3) [[#3566](https://github.com/plotly/plotly.js/pull/3566)]
- Fix polar angular tick labels placement [[#3538](https://github.com/plotly/plotly.js/pull/3538)]
- Fix `scattergl` updates after selections for trace with on-graph text [[#3575](https://github.com/plotly/plotly.js/pull/3575)]
- Fix `responsive: true` config option for graph with WebGL traces [[#3500](https://github.com/plotly/plotly.js/pull/3500)]
- Fix `modebar.bgcolor` for vertical modebars with wrapped buttons [[#3500](https://github.com/plotly/plotly.js/pull/3500)]
- Fix `ohlc` and `candlestick` auto-range computations [[#3544](https://github.com/plotly/plotly.js/pull/3544)]


## [1.44.4] -- 2019-02-12

### Fixed
- Fix `Plotly.react` used with `uirevision` when removing traces [[#3527](https://github.com/plotly/plotly.js/pull/3527)]
- Fix `scattergl` update calls that change the number of on-graph text elements [[#3536](https://github.com/plotly/plotly.js/pull/3536)]
- Fix annotations SVG errors on trace-less subplots [[#3534](https://github.com/plotly/plotly.js/pull/3534)]
- Fix `ohlc` and `candlestick` hover on blank coordinates (bug introduced in 1.43.2) [[#3537](https://github.com/plotly/plotly.js/pull/3537)]


## [1.44.3] -- 2019-02-06

### Fixed
- Fix axis `automargin` push offset which resulted in clipped
  tick labels in some scenarios [[#3510](https://github.com/plotly/plotly.js/pull/3510)]
- Fix handling of alpha channel in marker, line and error bar `rgba`
  coloring in `scatter3d` traces [[#3496](https://github.com/plotly/plotly.js/pull/3496)]
- Fix subplots with multiple `carpet` traces each with a `scattercarpet`
  trace on top of them [[#3512](https://github.com/plotly/plotly.js/pull/3512)]
- Fix MathJax placement in ternary `aaxis` titles [[#3513](https://github.com/plotly/plotly.js/pull/3513)]


## [1.44.2] -- 2019-02-04

### Fixed
- Fix vertical modebars in IE11 [@3491]
- Fix `hovertemplate` for traces with blank `name` [[#3480](https://github.com/plotly/plotly.js/pull/3480)]
- Fix 3D grid lines and tick labels colored by rgba color
  with full transparency [[#3494](https://github.com/plotly/plotly.js/pull/3494)]
- Fix white highlights rendering problems for `mesh3d` trace on
  some devices (bug introduced in 1.44.0) [[#3483](https://github.com/plotly/plotly.js/pull/3483)]
- Fix `fill.color` description for `table` traces [[#3481](https://github.com/plotly/plotly.js/pull/3481)]


## [1.44.1] -- 2019-01-24

### Fixed
- Fix `mesh3d` rendering on (some) mobile devices (bug introduced in 1.44.0) [[#3463](https://github.com/plotly/plotly.js/pull/3463)]
- Fix scene camera update when changing to `turntable` mode when `up.z` is zero
  (bug introduced in 1.43.0) [[#3465](https://github.com/plotly/plotly.js/pull/3465), [#3475](https://github.com/plotly/plotly.js/pull/3475)]
- Fix `react` when cartesian axis `scaleanchor` patterns change [[#3461](https://github.com/plotly/plotly.js/pull/3461)]
- Fix "days" entries in polish (`pl`) locales [[#3464](https://github.com/plotly/plotly.js/pull/3464)]
- Remove inner function declarations in our `vectorize-text` that caused
  bundling errors for some (bug introduced in 1.43.0) [[#3474](https://github.com/plotly/plotly.js/pull/3474)]


## [1.44.0] -- 2019-01-22

### Added
- Add `isosurface` gl3d trace type [[#3438](https://github.com/plotly/plotly.js/pull/3438)]
- Add support for transitions from `Plotly.react` via new layout
 `transition` attribute [[#3217](https://github.com/plotly/plotly.js/pull/3217)]
- Add `meta` layout attribute, intended for making references
  to strings in text templates [[#3439](https://github.com/plotly/plotly.js/pull/3439)]
- Add support for `line.color` colorbars for `scatter3d` traces [[#3384](https://github.com/plotly/plotly.js/pull/3384)]
- Add support for `hovertemplate` on `scatterpolar`, `scatterpolargl`,
  `scatterternary`, `barpolar`, `choropleth`, `scattergeo` and
  `scattermapbox` trace [[#3398](https://github.com/plotly/plotly.js/pull/3398), [#3436](https://github.com/plotly/plotly.js/pull/3436)]
- Add `width` attribute to `box` and `violin` traces [[#3234](https://github.com/plotly/plotly.js/pull/3234)]
- Add support for `<sup>`, `<sup>`, `<b>`, `<i>` and `<em>` pseudo-html
  tags in extra (aka trace "name") hover labels [[#3443](https://github.com/plotly/plotly.js/pull/3443)]
- Add support for div id as 1st arg to `Plotly.makeTemplate` [[#3375](https://github.com/plotly/plotly.js/pull/3375)]
- Add `config` option in plot-schema JSON output [[#3376](https://github.com/plotly/plotly.js/pull/3376)]

### Changed
- Config option `scrollZoom` is now a flaglist (instead of a boolean),
  each flag corresponding to subplot types where scroll is to be enabled [[#3422](https://github.com/plotly/plotly.js/pull/3422)]
- Use `glslify@7.0.0` across all our dependencies [[#3421](https://github.com/plotly/plotly.js/pull/3421)]

### Fixed
- Fix `error_(x|y|z)` color attribute inheritance [[#3408](https://github.com/plotly/plotly.js/pull/3408)]
- Fix `scrollZoom: false` config behavior for `geo`, `gl3d` and `mapbox` subplots [[#3422](https://github.com/plotly/plotly.js/pull/3422)]
- Fix cartesian scroll zoom when `responsive` config option is turned on [[#3424](https://github.com/plotly/plotly.js/pull/3424)]
- Fix cartesian scroll zoom when the page where the graph is embedded is scrollable [[#3424](https://github.com/plotly/plotly.js/pull/3424)]
- Fix `box` / `violin` autorange edge cases [[#3234](https://github.com/plotly/plotly.js/pull/3234)]
- Fix `box` / `violin` points hover labels on numeric positions [[#3441](https://github.com/plotly/plotly.js/pull/3441), [#3458](https://github.com/plotly/plotly.js/pull/3458)]
- Fix `box` / `violin` grouping algorithm for subplots with as many distinct positions
  as the number of traces [[#3445](https://github.com/plotly/plotly.js/pull/3445)]
- Fix bar autorange calculations for trace with `base` above zero [[#3452](https://github.com/plotly/plotly.js/pull/3452)]
- Fix bar + errorbar autorange calculations [[#3452](https://github.com/plotly/plotly.js/pull/3452)]
- Fix `lightposition` behavior for `mesh3d` traces [[#3415](https://github.com/plotly/plotly.js/pull/3415)]
- Fix legend `valign` behavior for `pie` traces [[#3435](https://github.com/plotly/plotly.js/pull/3435)]
- Fix wrapped horizontal legends height edge cases [[#3446](https://github.com/plotly/plotly.js/pull/3446)]
- Fix hover label alignment for hover labels with multi-line extra (aka trace "name") labels [[#3443](https://github.com/plotly/plotly.js/pull/3443)]
- Fix cartesian axis domain lower limit [[#3404](https://github.com/plotly/plotly.js/pull/3404)]
- Fix dynamic imports of `lib/` trace modules [[#3448](https://github.com/plotly/plotly.js/pull/3448)]
- Fix `scl` and `reversescl` backward-compatible logic [[#3423](https://github.com/plotly/plotly.js/pull/3423)]
- Fix range slider `borderwidth` attribute description [[#3453](https://github.com/plotly/plotly.js/pull/3453)]


## [1.43.2] -- 2019-01-08

First 2019 release.

### Fixed
- Fix `uirevision` behavior for `gl3d`, `geo` and `mapbox` subplots [[#3394](https://github.com/plotly/plotly.js/pull/3394)]
- Fix `reversescale` behavior for `surface`, `mesh3d` and `streamtube`
  traces (bug introduced in 1.43.0) [[#3418](https://github.com/plotly/plotly.js/pull/3418)]
- Fix modebar hover styling (bug introduced in 1.43.0) [[#3397](https://github.com/plotly/plotly.js/pull/3397)]
- Fix horizontal `box` / `violin` hover label misalignment under
  `hovermode:'closest'` [[#3401](https://github.com/plotly/plotly.js/pull/3401)]
- Fix `ohlc` and `candlestick` hover for traces with empty items [[#3366](https://github.com/plotly/plotly.js/pull/3366)]
- Fix `surface` trace `visible` logic [[#3365](https://github.com/plotly/plotly.js/pull/3365)]
- Fix `mesh3d` trace `visible` logic [[#3369](https://github.com/plotly/plotly.js/pull/3369)]


## [1.43.1] -- 2018-12-21

### Fixed
- Fix z-axis auto-type for cartesian + gl3d graphs (bug introduced in 1.43.0) [[#3360](https://github.com/plotly/plotly.js/pull/3360)]
- Fix `multicategory` axis coordinate sorting [[#3362](https://github.com/plotly/plotly.js/pull/3362)]
- Fix `multicategory` y-axes clearance [[#3354](https://github.com/plotly/plotly.js/pull/3354)]
- Fix contour label clipPath segments for reversed axes [[#3352](https://github.com/plotly/plotly.js/pull/3352)]
- Fix axis autorange on double-click on graph `fixedrange:true` [[#3351](https://github.com/plotly/plotly.js/pull/3351)]


## [1.43.0] -- 2018-12-19

### Added
- Add `hovertemplate` attribute to `scatter`, `scattergl`, `bar`, `histogram`,
  `pie` and `sankey` traces [[#3126](https://github.com/plotly/plotly.js/pull/3126), [#3265](https://github.com/plotly/plotly.js/pull/3265), [#3284](https://github.com/plotly/plotly.js/pull/3284)]
- Add `layout.title` placement attributes `x`, `y`, `xref`, `yref`,
  `xanchor`, `yanchor` and `pad` [[#3276](https://github.com/plotly/plotly.js/pull/3276)]
- Add support for `<br>`, `<sup>`, and `<sub>` pseudo-html in `scatter3d` and `gl3d`
  scene text [[#3207](https://github.com/plotly/plotly.js/pull/3207)]
- Add `multicategory` axis type, allowing for "multi-level" categorical axis labels
  and category dividers with axis attributes: `showdividers`,
  `dividercolor` and `diverwidth` [[#3254](https://github.com/plotly/plotly.js/pull/3254), [#3300](https://github.com/plotly/plotly.js/pull/3300), [#3326](https://github.com/plotly/plotly.js/pull/3326)]
- Add cartesian axis attribute `tickson` with value '`boundaries`' to
  place categorical ticks on the category boundaries [[#3254](https://github.com/plotly/plotly.js/pull/3254), [#3275](https://github.com/plotly/plotly.js/pull/3275)]
- Add `uirevision` attributes to control the persistence of user-driven changes
  on the graph [[#3236](https://github.com/plotly/plotly.js/pull/3236)]
- Add `legend.valign` to set the vertical alignment of the legend symbols
  with respect to their associated text labels [[#3263](https://github.com/plotly/plotly.js/pull/3263)]
- Implement `arrayOk` `textposition` for `scatter3d` traces [[#3200](https://github.com/plotly/plotly.js/pull/3200)]
- Add layout attributes `colorscale.sequential`, `colorscale.sequentialminus` and
 `colorscale.diverging` to set graph-wide colorscale defaults [[#3274](https://github.com/plotly/plotly.js/pull/3274)]
- Add `dragmode: false` to disable all drag interactions on cartesian subplots [[#3170](https://github.com/plotly/plotly.js/pull/3170)]
- Add `plotly.js-locales` npm packages that includes all official locales modules [[#3223](https://github.com/plotly/plotly.js/pull/3223)]
- Add `watermark` config option to permanently show Plotly's logo
  in the mode bar (set to false by default) [[#3280](https://github.com/plotly/plotly.js/pull/3280)]
- Add Finnish locale (`fi`) [[#3325](https://github.com/plotly/plotly.js/pull/3325)]

### Changed
- Remove "Edit in Chart Studio" button by default [[#3307](https://github.com/plotly/plotly.js/pull/3307)]
- `title` attributes linked to strings are now deprecated. Please use
  `title.text` instead to fill in your title text [[#3276](https://github.com/plotly/plotly.js/pull/3276)]
- `title*` attributes are new deprecated. They moved to `title.*`. For
  example, `colorbar.titleside` is now `colorbar.title.side` [[#3276](https://github.com/plotly/plotly.js/pull/3276)]
- No longer mutate `colorscale` values into user data [[#3341](https://github.com/plotly/plotly.js/pull/3341)]
- No longer mutate `zmin`/`zmax`, `cmin`/`cmax` values into user data [[#3341](https://github.com/plotly/plotly.js/pull/3341)]

### Fixed
- Fix `react` when updates trigger a new set of auto-margins [[#3323](https://github.com/plotly/plotly.js/pull/3323)]
- Fix `scattergl` coloring when more than 255 marker colors are present [[#3328](https://github.com/plotly/plotly.js/pull/3328), [#3334](https://github.com/plotly/plotly.js/pull/3334)]
- More `scattergl` IE11 fixes [[#3333](https://github.com/plotly/plotly.js/pull/3333), [#3335](https://github.com/plotly/plotly.js/pull/3335)]
- Multiple `surface` rendering fixes [[#3281](https://github.com/plotly/plotly.js/pull/3281)]
- Correctly default `scene.dragmode` to `'orbit'` when camera up vector is
  tilted [[#3256](https://github.com/plotly/plotly.js/pull/3256)]
- Fix hover on `scatter3d` traces with `opacity: 1` on Ubuntu [[#3301](https://github.com/plotly/plotly.js/pull/3301)]
- Fix console error _Uncaught ax.dtick error: NaN_ in gl3d subplots [[#3233](https://github.com/plotly/plotly.js/pull/3233)]
- Fix histogram hover event triggers when hovering from bar to bar [[#3345](https://github.com/plotly/plotly.js/pull/3345)]
- Fix graphs with empty and non-empty histogram traces [[#3343](https://github.com/plotly/plotly.js/pull/3343)]
- Fix contour labels on reversed axes [[#3279](https://github.com/plotly/plotly.js/pull/3279)]
- Fix `autocolorscale` toggling [[#3341](https://github.com/plotly/plotly.js/pull/3341)]
- Fix template support for `marker.colorscale` [[#3341](https://github.com/plotly/plotly.js/pull/3341)]
- Fix `scatter3D` trace with `mode: 'lines+markers'` with line color array error [[#3341](https://github.com/plotly/plotly.js/pull/3341)]
- Do not add `<base>` href to SVG clip paths during toImage [[#3272](https://github.com/plotly/plotly.js/pull/3272)]
- Fix table scrolling that leaked into window scope [[#3327](https://github.com/plotly/plotly.js/pull/3327)]
- Fix fills on segment-less marker-less traces [[#3282](https://github.com/plotly/plotly.js/pull/3282)]
- Fix rangesliders on reversed-range axes [[#3304](https://github.com/plotly/plotly.js/pull/3304)]
- Fix rangesliders on `side: 'top'`x-axes [[#3329](https://github.com/plotly/plotly.js/pull/3329)]
- Fix typed array support for `ohlc` and `candlestick` traces [[#3342](https://github.com/plotly/plotly.js/pull/3342)]
- Fix `restyle` with `impliedEdits` on trace with `groupby` transforms [[#3236](https://github.com/plotly/plotly.js/pull/3236)]
- Fix `editable: true` drag on `marker` colorbars [[#3236](https://github.com/plotly/plotly.js/pull/3236)]


## [1.42.5] -- 2018-11-08

### Fixed
- Fix `scattergl` / `scatterpolargl` with `mode: lines` and
  more than 1e5 pts (bug introduced in 1.42.0) [[#3228](https://github.com/plotly/plotly.js/pull/3228)]


## [1.42.4] -- 2018-11-07

### Fixed
- Remove rendering artifacts from `table` orca PDF exports [[#3220](https://github.com/plotly/plotly.js/pull/3220)]


## [1.42.3] -- 2018-11-06

### Fixed
- Fix `histogram` binning for typed array inputs (bug introduced in 1.42.0) [[#3211](https://github.com/plotly/plotly.js/pull/3211)]
- Fix textfont color `restyle` calls for `pie` traces [[#3214](https://github.com/plotly/plotly.js/pull/3214)]
- Fix textfont color `editType` for `bar` traces [[#3214](https://github.com/plotly/plotly.js/pull/3214)]
- Fix array `hoverinfo` support for `ohlc` and `candelestick` [[#3213](https://github.com/plotly/plotly.js/pull/3213)]
- Correctly list `parcats` hoverinfo attributes which does not support array inputs [[#3213](https://github.com/plotly/plotly.js/pull/3213)]


## [1.42.2] -- 2018-11-01

### Fixed
- Fix runaway loops for `scattergl` lines and fill traces
  (bug introduced in 1.42.0) [[#3199](https://github.com/plotly/plotly.js/pull/3199)]
- Fix size and alignment vertical modebar [[#3193](https://github.com/plotly/plotly.js/pull/3193)]
- Fix legend item rendering for traces with typed array marker
  settings [[#3192](https://github.com/plotly/plotly.js/pull/3192)]


## [1.42.1] -- 2018-10-31

### Fixed
- Fix IE regression introduced in 1.42.0 [[#3187](https://github.com/plotly/plotly.js/pull/3187)]
- Fix `parcats` text-shadowing on dark `plot_bgcolor` [[#3191](https://github.com/plotly/plotly.js/pull/3191)]
- Fix `scatter3d` text alignment [[#3180](https://github.com/plotly/plotly.js/pull/3180)]
- Fix `hoverinfo` flags in attribute descriptions [[#3158](https://github.com/plotly/plotly.js/pull/3158)]
- No longer coerce unused `hoverlabel` attribute in `parcoods` [[#3158](https://github.com/plotly/plotly.js/pull/3158)]
- No longer coerce `transforms` attributes in traces that don't support them [[#3158](https://github.com/plotly/plotly.js/pull/3158)]


## [1.42.0] -- 2018-10-29

### Added
- Add `parcats` (aka parallel categories) trace type [[#2963](https://github.com/plotly/plotly.js/pull/2963), [#3072](https://github.com/plotly/plotly.js/pull/3072)]
- Add new gl3d tick and title auto-rotation algorithm that limits text
  overlaps [[#3084](https://github.com/plotly/plotly.js/pull/3084), [#3104](https://github.com/plotly/plotly.js/pull/3104), [#3131](https://github.com/plotly/plotly.js/pull/3131)]
- Add support for reversed-range axes on gl3d subplots [[#3141](https://github.com/plotly/plotly.js/pull/3141)]
- Add modebar layout style attributes: `orientation`, `bgcolor`, `color`
  and `activecolor` [[#3068](https://github.com/plotly/plotly.js/pull/3068), [#3091](https://github.com/plotly/plotly.js/pull/3091)]
- Add `title`, `titleposition` and `titlefont` attributes to `pie` traces [[#2987](https://github.com/plotly/plotly.js/pull/2987)]
- Add `hoverlabel.split` attribute to `ohlc` and `candlestick` traces to split
  hover labels into multiple pieces [[#2959](https://github.com/plotly/plotly.js/pull/2959)]
- Add support for `line.shape` values 'hv', 'vh', 'hvh' and 'vhv'
  in `scattergl` traces [[#3087](https://github.com/plotly/plotly.js/pull/3087)]
- Add handler for `PlotlyConfig.MathJaxConfig: 'local'` to override our default
  MathJax behavior which modifies the global MathJax config on load [[#2994](https://github.com/plotly/plotly.js/pull/2994)]
- Add support for graph div as first argument for `Plotly.makeTemplate`
  and `Plotly.validateTemplate` [[#3111](https://github.com/plotly/plotly.js/pull/3111), [#3118](https://github.com/plotly/plotly.js/pull/3118)]
- Implement trace, node and link hoverinfo for `sankey` traces [[#3096](https://github.com/plotly/plotly.js/pull/3096), [#3150](https://github.com/plotly/plotly.js/pull/3150)]
- Implement per-sector textfont settings in `pie` traces [[#3130](https://github.com/plotly/plotly.js/pull/3130)]

## Changed
- Use new Plotly logo in "Produced with Plotly" modebar button [[#3068](https://github.com/plotly/plotly.js/pull/3068)]
- Improve `histogram` autobin algorithm: allow partial bin specification,
  deprecate `autobin(x|y)` attributes, force stacked/grouped histograms to match size
  and have compatible `start` value [[#3044](https://github.com/plotly/plotly.js/pull/3044)]
- Count distinct values for category and date axis auto-type, which
  improves the detection of "NaN" string values in numerical data [[#3070](https://github.com/plotly/plotly.js/pull/3070)]
- Improve bar and pie textfont color inheritance [[#3130](https://github.com/plotly/plotly.js/pull/3130)]
- Improve `splom` first-render, axis range relayout and marker restyle
  performance [[#3057](https://github.com/plotly/plotly.js/pull/3057), [#3161](https://github.com/plotly/plotly.js/pull/3161)]
- Make `splom` `xaxes` and `yaxes` list always have same length as the trace
  `dimensions` regardless of their partial visibilities [[#3057](https://github.com/plotly/plotly.js/pull/3057)]
- Improve axis `overlaying` documentation [[#3082](https://github.com/plotly/plotly.js/pull/3082)]

### Fixed
- Fix `gl3d` subplots on tablets [[#3088](https://github.com/plotly/plotly.js/pull/3088)]
- Fix responsive behavior under flexbox and grid CSS [[#3056](https://github.com/plotly/plotly.js/pull/3056), [#3090](https://github.com/plotly/plotly.js/pull/3090), [#3122](https://github.com/plotly/plotly.js/pull/3122)]
- Fix relayout calls turning back `autosize` on [[#3120](https://github.com/plotly/plotly.js/pull/3120)]
- Fix MathJax rendering (for recent versions of MathJax) [[#2994](https://github.com/plotly/plotly.js/pull/2994)]
- Fix `scattergl` update on graphs with fractional computed dimensions [[#3132](https://github.com/plotly/plotly.js/pull/3132)]
- Fix `scattergl` symbols in MS Edge [[#2750](https://github.com/plotly/plotly.js/pull/2750)]
- Fix `scattergl` selections on overlaying axes [[#3067](https://github.com/plotly/plotly.js/pull/3067)]
- Fix `scattergl` `tozero` fills with bad values [[#3087](https://github.com/plotly/plotly.js/pull/3087), [#3168](https://github.com/plotly/plotly.js/pull/3168)]
- Fix `scattergl` fill layer ordering [[#3087](https://github.com/plotly/plotly.js/pull/3087)]
- Fix `scattergl` lines on reversed-range axes [[#3078](https://github.com/plotly/plotly.js/pull/3078)]
- Fix axis auto-type routine for boolean data [[#3070](https://github.com/plotly/plotly.js/pull/3070)]
- Fix `splom` axis placement when the diagonal is missing [[#3057](https://github.com/plotly/plotly.js/pull/3057)]
- Fix line `restyle` calls on `parcoords` traces [[#3178](https://github.com/plotly/plotly.js/pull/3178)]
- Fix `parcoods` rendering after `hovermode` relayout calls [[#3123](https://github.com/plotly/plotly.js/pull/3123)]
- Fix WebGL warnings for `scatter3d` traces with blank text items [[#3171](https://github.com/plotly/plotly.js/pull/3171), [#3177](https://github.com/plotly/plotly.js/pull/3177)]
- Fix WebGL warnings for `scatter3d` trace with empty lines [[#3174](https://github.com/plotly/plotly.js/pull/3174)]
- Fix rendering of `scatter3d` lines for certain scene angles [[#3163](https://github.com/plotly/plotly.js/pull/3163)]
- Fix handling of large pad values in `sankey` traces [[#3143](https://github.com/plotly/plotly.js/pull/3143)]
- Fix `scatterpolargl`  to `scatterpolar` toggling [[#3098](https://github.com/plotly/plotly.js/pull/3098)]
- Fix `scatterpolargl` axis-autorange padding [[#3098](https://github.com/plotly/plotly.js/pull/3098)]
- Fix `bar` text position for traces with set `base` [[#3156](https://github.com/plotly/plotly.js/pull/3156)]
- Fix `bar` support for typed arrays for `width` and `offset` attributes [[#3169](https://github.com/plotly/plotly.js/pull/3169)]
- Fix aggregate transforms with bad group values [[#3093](https://github.com/plotly/plotly.js/pull/3093)]
- Fix transforms operating on auto-invisible traces [[#3139](https://github.com/plotly/plotly.js/pull/3139)]
- Fix templating for polar and carpet axes [[#3092](https://github.com/plotly/plotly.js/pull/3092), [#3095](https://github.com/plotly/plotly.js/pull/3095)]
- Ignore invalid trace indices in restyle and update [[#3114](https://github.com/plotly/plotly.js/pull/3114)]
- Fix grid style `relayout` calls on graph with large `splom` traces [[#3067](https://github.com/plotly/plotly.js/pull/3067)]
- Fix logging on some old browsers [[#3137](https://github.com/plotly/plotly.js/pull/3137)]
- Remove erroneous warning `WARN: unrecognized full object value` when
  relayouting array containers [[#3053](https://github.com/plotly/plotly.js/pull/3053)]


## [1.41.3] -- 2018-09-25

### Fixed
- Fix handling of hover `text` in `barpolar` traces [[#3040](https://github.com/plotly/plotly.js/pull/3040)]
- Fix `scatterpolar[gl]` `text` placement in hover label [[#3040](https://github.com/plotly/plotly.js/pull/3040)]
- Fix `pie` trace support for individual stroke width values [[#3030](https://github.com/plotly/plotly.js/pull/3030)]
- Fix handling of CSS `max-width` and `max-height` in auto-size routine [[#3033](https://github.com/plotly/plotly.js/pull/3033)]
- Rotate hover labels when `hovermode: 'y'` and a single trace produces multiple
  labels [[#3043](https://github.com/plotly/plotly.js/pull/3043)]
- Rotate hover labels when `hovermode: 'closest'` and multiple labels are
  generated including one from an horizontal trace [[#3043](https://github.com/plotly/plotly.js/pull/3043)]
- Fix hover label coloring on white bgcolor [[#3048](https://github.com/plotly/plotly.js/pull/3048)]
- Do not coerce nor validate `polar?.bar*` attributes on
  subplots w/o visible `barpolar` traces [[#3023](https://github.com/plotly/plotly.js/pull/3023)]
- Fix legacy polar attribute descriptions [[#3023](https://github.com/plotly/plotly.js/pull/3023)]


## [1.41.2] -- 2018-09-19

### Fixed
- Fix two-sided zoombox -> double-click -> one-sided zoombox behavior [[#3028](https://github.com/plotly/plotly.js/pull/3028)]


## [1.41.1] -- 2018-09-18

### Fixed
- Bring back hover labels on "touch" hover (bug introduced in 1.29.0) [[#2997](https://github.com/plotly/plotly.js/pull/2997)]
- Fix MathJax rendering in legends [[#3018](https://github.com/plotly/plotly.js/pull/3018)]
- Fix fill and layering for multiple stack-groups and unstacked `scatter` traces [[#3005](https://github.com/plotly/plotly.js/pull/3005)]
- Fix removal of `scatter` traces with set `stackgroup` [[#3005](https://github.com/plotly/plotly.js/pull/3005)]
- Fix stacked area gap insertion edge case [[#3017](https://github.com/plotly/plotly.js/pull/3017)]
- Fix zeroline logic for `splom`-generated axes [[#3015](https://github.com/plotly/plotly.js/pull/3015)]
- Fix `error_x` and `error_y` on `scatter3d` w/o `error_z` [[#3011](https://github.com/plotly/plotly.js/pull/3011)]
- Fix `scatter3d` error bars on log axes [[#2992](https://github.com/plotly/plotly.js/pull/2992)]
- Fix `Plotly.react` when updating geo axis `dtick` [[#3016](https://github.com/plotly/plotly.js/pull/3016)]
- Fix `polar.hole=1` case [[#3021](https://github.com/plotly/plotly.js/pull/3021)]
- Fix handling of `polar.sector` that span more than 360 degrees [[#3021](https://github.com/plotly/plotly.js/pull/3021)]


## [1.41.0] -- 2018-09-12

### Added
- Enable selection by clicking on points via new layout attribute `clickmode`
  and flag `'select'` [[#2944](https://github.com/plotly/plotly.js/pull/2944)]
- Add stacked area charts via new attributes `stackgroup` and `stackgaps` in
  `scatter` traces [[#2960](https://github.com/plotly/plotly.js/pull/2960)]
- Add `barpolar` traces - which replace and augment `area` traces [[#2954](https://github.com/plotly/plotly.js/pull/2954)]
- Add `polar.hole` to punch hole at the middle of polar subplot offsetting the
  start of the radial range [[#2977](https://github.com/plotly/plotly.js/pull/2977), [#2996](https://github.com/plotly/plotly.js/pull/2996)]
- Add an 'inner' radial axis drag box on polar subplots [[#2977](https://github.com/plotly/plotly.js/pull/2977)]
- Add `{responsive: true}` plot config option [[#2974](https://github.com/plotly/plotly.js/pull/2974)]
- Emit `plotly_webglcontextlost` event on WebGL context lost [[#2986](https://github.com/plotly/plotly.js/pull/2986)]
- Support all numbered HTML entities (decimal and hex) in text elements [[#2932](https://github.com/plotly/plotly.js/pull/2932)]
- Add Welsh (`cy`) locale [[#2945](https://github.com/plotly/plotly.js/pull/2945)]

### Changed
- Attribute meta information is now stripped be stripped out of bundles (made
  with bundlers that support browserify transforms) by default [[#1584](https://github.com/plotly/plotly.js/pull/1584)]
- Draw polar axis ticks above polar axis lines [[#2977](https://github.com/plotly/plotly.js/pull/2977)]
- Improve ordering of trace hover labels for matching positions [[#2960](https://github.com/plotly/plotly.js/pull/2960)]
- Speed polar subplot radial drag interactions [[#2954](https://github.com/plotly/plotly.js/pull/2954)]
- Improve pseudo-html conversion performance [[#2932](https://github.com/plotly/plotly.js/pull/2932)]
- Bump `regl-splom` requirement to `^1.0.4` [[#2956](https://github.com/plotly/plotly.js/pull/2956)]
- Bump `glslify` requirement to `^6.3.1` [[#2990](https://github.com/plotly/plotly.js/pull/2990)]
- Use `gl-text` instead of `@etpinard/gl-text` [[#2956](https://github.com/plotly/plotly.js/pull/2956)]

### Fixed
- Fix `scatter` ordering in inner SVG `<g>` on some restyle calls [[#2978](https://github.com/plotly/plotly.js/pull/2978)]
- Fix cartesian axis autorange edge cases [[#2960](https://github.com/plotly/plotly.js/pull/2960)]
- Fix double-decoding of some HTML entities in text nodes [[#2927](https://github.com/plotly/plotly.js/pull/2927)]
- Fix `scattergl` line traces rendered after non-line traces [[#2990](https://github.com/plotly/plotly.js/pull/2990)]
- Fix legend positioning on graphs with very large margins [[#2983](https://github.com/plotly/plotly.js/pull/2983)]
- Fix rendering of ternary subplots fix with `showticklabels: false` [[#2993](https://github.com/plotly/plotly.js/pull/2993)]
- Fix show/hide updates of tick and tick labels on ternary subplots [[#2993](https://github.com/plotly/plotly.js/pull/2993)]
- Fix handling of multi-selections in ternary subplots [[#2944](https://github.com/plotly/plotly.js/pull/2944)]
- Fix `sankey` hover under `hovermode: false` [[#2949](https://github.com/plotly/plotly.js/pull/2949)]
- Fix `sankey` positioning for non-default `domain.x` values [[#2984](https://github.com/plotly/plotly.js/pull/2984)]
- Fix `type: 'date'` polar radial axes [[#2954](https://github.com/plotly/plotly.js/pull/2954)]
- Fix send-to-cloud modebar buttons on graphs with typed arrays [[#2995](https://github.com/plotly/plotly.js/pull/2995)]
- Fix handling of custom transforms that make their own data arrays in
  `Plotly.react`[[#2973](https://github.com/plotly/plotly.js/pull/2973)]
- Fix missing violin and colorbar attributes in `gd._fullData` [[#2850](https://github.com/plotly/plotly.js/pull/2850)]


## [1.40.1] -- 2018-08-22

### Changed
- Bump `browserify` to `v16` [[#2923](https://github.com/plotly/plotly.js/pull/2923)]
- Bump `glslify` to `v6.2.1` [[#2923](https://github.com/plotly/plotly.js/pull/2923)]
- Use `color-normlize@1.3.0` throughout code base [[#2923](https://github.com/plotly/plotly.js/pull/2923)]

### Fixed
- Fix logic for hiding zero lines when they conflict with axis lines [[#2936](https://github.com/plotly/plotly.js/pull/2936)]
- Fix `exponentformat` values `'e'` and `'E'` on log axes [[#2921](https://github.com/plotly/plotly.js/pull/2921)]
- Fix dynamic layer ordering of `heatmap` and `carpet` traces [[#2917](https://github.com/plotly/plotly.js/pull/2917)]
- Fix `Plotly.downloadImage` when using graph id or figure object
  as first argument [[#2931](https://github.com/plotly/plotly.js/pull/2931)]
- Fix regl-based rendering when WebGL buffer dimensions don't match canvas
  dimensions [[#2939](https://github.com/plotly/plotly.js/pull/2939)]

## [1.40.0] -- 2018-08-16

### Added
- Allow `contour`, `contourcarpet` and `histogram2dcontour` to have
  corresponding legend items using `showlegend` [[#2891](https://github.com/plotly/plotly.js/pull/2891), [#2914](https://github.com/plotly/plotly.js/pull/2914)]
- Add `scatterpolar` and `scatterpolargl` attributes `r0`, `dr`, `theta0` and
  `dtheta` [[#2895](https://github.com/plotly/plotly.js/pull/2895)]
- Add layout attributes `piecolorway` and `extendpiecolors`
  for more control over `pie` colors [[#2870](https://github.com/plotly/plotly.js/pull/2870)]
- Add splom attribute `dimensions[i].axis.type` to easily override axis type
  in splom-generated axes [[#2899](https://github.com/plotly/plotly.js/pull/2899)]
- Add support for on-graph text in `scatterpolargl` traces [[#2895](https://github.com/plotly/plotly.js/pull/2895)]

### Changed
- Use `derequire` browserify plugin to make bundling distributed npm package
  with browserify possible [[#2905](https://github.com/plotly/plotly.js/pull/2905)]
- Speed up cartesian axis autorange edits (and thus double-click interactions) [[#2823](https://github.com/plotly/plotly.js/pull/2823)]
- Do not clear WebGL context when `scattergl` graph has no `visible:true`
  traces, which speeds up e.g. legend interactions [[#2860](https://github.com/plotly/plotly.js/pull/2860)]
- Compute data extremes per trace, which improves performance in some cases [[#2860](https://github.com/plotly/plotly.js/pull/2860)]
- Use `<linearGradient>` to render filled colorbars [[#2910](https://github.com/plotly/plotly.js/pull/2910), [#2914](https://github.com/plotly/plotly.js/pull/2914)]
- Rename trace module `setPositions` methods `crossTraceCalc` [[#2868](https://github.com/plotly/plotly.js/pull/2868)]
- Use `regl@1.3.7` [[#2863](https://github.com/plotly/plotly.js/pull/2863)]

### Fixed
- Fix scalar `marker.size` bounds in legend items [[#2840](https://github.com/plotly/plotly.js/pull/2840)]
- Fix positioning of legend symbols for traces with fills [[#2891](https://github.com/plotly/plotly.js/pull/2891)]
- Fix `scattergl` select -> double-click -> pan behavior [[#2815](https://github.com/plotly/plotly.js/pull/2815)]
- Fix `scattergl` marker for IE11 [[#2863](https://github.com/plotly/plotly.js/pull/2863)]
- Fix inheritance of explicit `pie` colors by later traces [[#2870](https://github.com/plotly/plotly.js/pull/2870)]
- Fix layer ordering on graphs with multiple `contour` traces with heatmap
  coloring [[#2891](https://github.com/plotly/plotly.js/pull/2891)]
- Fix layer ordering on `visible` toggling for `contour`-like traces [[#2891](https://github.com/plotly/plotly.js/pull/2891)]
- Fix cases where colorbars would be drawn over its bounds [[#2910](https://github.com/plotly/plotly.js/pull/2910)]
- Fix `tickwidth` edits on `ohlc` traces [[#2823](https://github.com/plotly/plotly.js/pull/2823)]
- Fix labels on splom-generated axes with categorical data [[#2899](https://github.com/plotly/plotly.js/pull/2899)]
- Fix handling of splom dimensions on axes of conflicting types [[#2899](https://github.com/plotly/plotly.js/pull/2899)]
- Fix `splom` trace `visible` edits [[#2860](https://github.com/plotly/plotly.js/pull/2860)]
- Fix `splom` select -> double-click -> pan behavior [[#2899](https://github.com/plotly/plotly.js/pull/2899)]
- Fix `scatterpolargl` behavior during angular and radial drag interactions [[#2888](https://github.com/plotly/plotly.js/pull/2888)]
- Fix handling of auto date ticks below our 100 microseconds limit [[#2912](https://github.com/plotly/plotly.js/pull/2912)]
- Fix `scatter3d` attributes which had incorrectly labeled `textposition`
  and `textfont.family` as `arrayOk` and contained unimplemented `line.showscale`
  and `line.colorbar` [[#2879](https://github.com/plotly/plotly.js/pull/2879)]
- Fix `scattergl` and `scatterpolargl` attribute declarations for `hoveron` [[#2895](https://github.com/plotly/plotly.js/pull/2895)]


## [1.39.4] -- 2018-08-02

### Fixed
- Fix tenths of milliseconds handling in old numeric date data
  (bug introduced in 1.21.0) [[#2847](https://github.com/plotly/plotly.js/pull/2847)]
- Fix `yaxis` overlaying `yaxis2` layouts
  (bug introduced in 1.39.3) [[#2857](https://github.com/plotly/plotly.js/pull/2857)]


## [1.39.3] -- 2018-07-25

### Fixed
- Fix overlaying subplot configuration relayouts [[#2831](https://github.com/plotly/plotly.js/pull/2831)]
- Fix trace toggling from position-editable horizontal legends [[#2829](https://github.com/plotly/plotly.js/pull/2829)]
- Fix `[un]selected.marker.opacity` settings on `scattergeo` traces [[#2827](https://github.com/plotly/plotly.js/pull/2827)]
- Fix selections on some Robinson projections [[#2827](https://github.com/plotly/plotly.js/pull/2827)]


## [1.39.2] -- 2018-07-16

### Fixed
- Fix scattergl selection after resize relayouts [[#2801](https://github.com/plotly/plotly.js/pull/2801)]
- Fix scattergl layout replot edits [[#2793](https://github.com/plotly/plotly.js/pull/2793)]
- Fix cartesian axis range animations (bug introduced in 1.37.0) [[#2788](https://github.com/plotly/plotly.js/pull/2788)]
- Fix contour labels that require thousands suffixes [[#2806](https://github.com/plotly/plotly.js/pull/2806)]
- Fix 'legendonly' legend items link to array `marker.symbol` [[#2816](https://github.com/plotly/plotly.js/pull/2816)]
- Fix handling of duplicate points under `line.simplify` [[#2814](https://github.com/plotly/plotly.js/pull/2814)]
- Fix transform removal via `Plotly.react` [[#2805](https://github.com/plotly/plotly.js/pull/2805)]
- Fix out-of-subplot scroll zoom on some geo projection types [[#2811](https://github.com/plotly/plotly.js/pull/2811)]
- Fix hover label in RTL pages [[#2790](https://github.com/plotly/plotly.js/pull/2790)]
- Reduce minified bundle back to their 1.39.0 sizes [[#2792](https://github.com/plotly/plotly.js/pull/2792)]


## [1.39.1] -- 2018-07-09

### Fixed
- Fix mapbox subplots in our minified bundles (bug introduced in 1.39.0) [[#2789](https://github.com/plotly/plotly.js/pull/2789)]
- Fix box and violin traces inner parts removal (bug introduced in 1.37.0) [[#2785](https://github.com/plotly/plotly.js/pull/2785)]


## [1.39.0] -- 2018-07-05

### Added
- Add distributed npm packages for the main plotly.js bundle and all our partial
  bundles for easy installation and bundling [[#2670](https://github.com/plotly/plotly.js/pull/2670)]
- Add template machinery along with helpers methods `Plotly.makeTemplate` and
  `Plotly.validateTemplate` [[#2764](https://github.com/plotly/plotly.js/pull/2764)]
- Add 3D `streamtube` traces [[#2658](https://github.com/plotly/plotly.js/pull/2658)]
- Add support for on-graph text in `scattergl` traces [[#2737](https://github.com/plotly/plotly.js/pull/2737), [#2783](https://github.com/plotly/plotly.js/pull/2783)]
- Add `gridshape` attribute to polar subplots with values `'circular'` (the
  default) and `'linear'` (to draw polygon grids) [[#2739](https://github.com/plotly/plotly.js/pull/2739)]
- Add `'range'` and `'change'` `aggregate` transform functions [[#2764](https://github.com/plotly/plotly.js/pull/2764)]
- Add `visible` attribute to `rangeselector` and `updatemenu` buttons,  slider
  steps and `mapbox` layout layers as well as `tickformatstops` items [[#2761](https://github.com/plotly/plotly.js/pull/2761)]
- Add support for colorbar linked to `marker.color` values for `splom`,
  `scatterpolar` and `scatterpolargl` traces [[#2681](https://github.com/plotly/plotly.js/pull/2681)]
- Revamp icon settings in custom mode bar buttons, allowing users to specify
  their own dimensions and SVG transforms [[#2762](https://github.com/plotly/plotly.js/pull/2762)]
- Add `plotlyServerURL` config option [[#2760](https://github.com/plotly/plotly.js/pull/2760)]
- Added no-WebGL warnings for graphs with `scattergl`, `scatterpolargl`, `splom`
  and `parcoords` traces [[#2697](https://github.com/plotly/plotly.js/pull/2697)]

### Changed
- `plotly_afterplot` is now emitted after all edit types [[#2773](https://github.com/plotly/plotly.js/pull/2773)]
- Trace `uid` is no longer mutated into user trace objects [[#2681](https://github.com/plotly/plotly.js/pull/2681)]
- No longer add `marker.line` in `scattermapbox` fullData [[#2766](https://github.com/plotly/plotly.js/pull/2766)]
- Use `regl@1.3.6` [[#2694](https://github.com/plotly/plotly.js/pull/2694)]
- Use `mapbox-gl@0.45.0` [[#2709](https://github.com/plotly/plotly.js/pull/2709)]

### Fixed
- Fix `Plotly.react`'s handling of changing auto-margins [[#2681](https://github.com/plotly/plotly.js/pull/2681)]
- Make plotting/updating WebGL-based traces fail gracefully when WebGL isn't
  supported [[#2697](https://github.com/plotly/plotly.js/pull/2697)]
- Fix mapbox layout layer updates [[#2734](https://github.com/plotly/plotly.js/pull/2734)]
- Fix mapbox event inconsistencies [[#2766](https://github.com/plotly/plotly.js/pull/2766)]
- Correctly emit `plotly_relayout` at end of scroll on mapbox subplots [[#2709](https://github.com/plotly/plotly.js/pull/2709)]
- Fix `scatter3d` scalar `hovertext` handling [[#2698](https://github.com/plotly/plotly.js/pull/2698)]
- Fix line decimation for segments crossing the viewport [[#2705](https://github.com/plotly/plotly.js/pull/2705)]
- Fix `surface` trace contours when first level has length zero [[#2712](https://github.com/plotly/plotly.js/pull/2712)]
- Fix `contour(x|y|z).highlight` partial settings [[#2712](https://github.com/plotly/plotly.js/pull/2712)]
- Fix old date timezone precision in Chrome 67+ [[#2747](https://github.com/plotly/plotly.js/pull/2747)]
- Fix `Plotly.validate` for attribute with trailing numbers (e.g. `x0`, `y1`) [[#2761](https://github.com/plotly/plotly.js/pull/2761)]
- Fix x-only zoom moves when `xaxis.fixedrange: true`[[#2776](https://github.com/plotly/plotly.js/pull/2776)]
- Fix colorbar edits for `parcoords` and `histogram` traces [[#2681](https://github.com/plotly/plotly.js/pull/2681)]
- Fix bandwidth for single-value violins [[#2775](https://github.com/plotly/plotly.js/pull/2775)]
- Sanitize `margin` after 'autosize' relayouts [[#2758](https://github.com/plotly/plotly.js/pull/2758)]
- Make `Plots.resize` work when `layout` attribute is gone from graph div [[#2710](https://github.com/plotly/plotly.js/pull/2710)]
- Fix `colorscale` attribute descriptions [[#2658](https://github.com/plotly/plotly.js/pull/2658)]


## [1.38.3] -- 2018-06-11

### Fixed
- Fix `cone` axis padding when under `sizemode: 'absolute'` [[#2715](https://github.com/plotly/plotly.js/pull/2715)]
- Fix `cone` scaling on irregular grids [[#2715](https://github.com/plotly/plotly.js/pull/2715)]
- Fix `cone` `sizemode: 'absolute'` scaling and attribute description [[#2715](https://github.com/plotly/plotly.js/pull/2715)]
- Improve `cone` hover picking [[#2715](https://github.com/plotly/plotly.js/pull/2715)]
- Fix exception during histogram cross-trace computation [[#2724](https://github.com/plotly/plotly.js/pull/2724)]
- Fix handling of custom transforms that make their own data arrays [[#2714](https://github.com/plotly/plotly.js/pull/2714)]


## [1.38.2] -- 2018-06-04

### Fixed
- Fix bar text removal (bug introduced in 1.36.0) [[#2689](https://github.com/plotly/plotly.js/pull/2689)]
- Fix handling number `0` in hover labels and on-graph text [[#2682](https://github.com/plotly/plotly.js/pull/2682)]


## [1.38.1] -- 2018-05-29

### Fixed
- Fix transforms on `scattergl` traces [[#2677](https://github.com/plotly/plotly.js/pull/2677)]
- Fix `marker.line.width` scaling in `scattergl` traces [[#2677](https://github.com/plotly/plotly.js/pull/2677)]
- Fix `[un]selected.marker.size` scaling in `scattergl` traces [[#2677](https://github.com/plotly/plotly.js/pull/2677)]
- Create two not three WebGL contexts for scattergl/splom graphs
  (bug introduced 1.36.0) [[#2656](https://github.com/plotly/plotly.js/pull/2656)]
- Fix `z` updates of interpolated values on heatmap and contour traces with gaps [[#2657](https://github.com/plotly/plotly.js/pull/2657)]
- Fix select/pan double-click behavior when relayout from one another
  (bug introduced in 1.36.0) [[#2668](https://github.com/plotly/plotly.js/pull/2668)]
- Fix shift selection behavior after pan/scroll
  (bug introduced in 1.36.0) [[#2676](https://github.com/plotly/plotly.js/pull/2676)]


## [1.38.0] -- 2018-05-23

### Added

- Add 3D `cone` traces to visualize vector fields [[#2641](https://github.com/plotly/plotly.js/pull/2641), [#2647](https://github.com/plotly/plotly.js/pull/2647)]
- Add ability to interactively change length and rotate line shapes [[#2594](https://github.com/plotly/plotly.js/pull/2594)]
- Add `toImageButtonOptions` config object to override to-image mode bar button
  options [[#2607](https://github.com/plotly/plotly.js/pull/2607)]
- Add Brazilian Portuguese (`pt-br`) locale [[#2622](https://github.com/plotly/plotly.js/pull/2622)]
- Add Italian (`it`) locale [[#2632](https://github.com/plotly/plotly.js/pull/2632)]

### Changed
- Improve cartesian scroll and pan (mostly) performance for graphs with
  many marker or/and text nodes [[#2623](https://github.com/plotly/plotly.js/pull/2623)]
- Improve `splom` first render and axis-range relayout performance [[#2628](https://github.com/plotly/plotly.js/pull/2628)]
- Improve multi-axis axis-range relayout performance by updating minimal set of
  axes instead of all axes [[#2628](https://github.com/plotly/plotly.js/pull/2628)]
- Use "grab" cursor to denote when annotations and shapes are draggable [[#2594](https://github.com/plotly/plotly.js/pull/2594)]
- Ignore zero and negative link values in `sankey` traces [[#2629](https://github.com/plotly/plotly.js/pull/2629)]
- Ignore unused and malformed links `sankey` traces without logging [[#2629](https://github.com/plotly/plotly.js/pull/2629)]

### Fixed
- Fix `scattergl` error bar computations when input value are numeric strings [[#2620](https://github.com/plotly/plotly.js/pull/2620)]
- Fix `scattergl` error bar computations for `x0`/`dx` and `y0`/`dy` coordinates [[#2620](https://github.com/plotly/plotly.js/pull/2620)]
- Fix `violin` kde span edge cases [[#2650](https://github.com/plotly/plotly.js/pull/2650)]
- Make `sankey` traces accept numeric strings [[#2629](https://github.com/plotly/plotly.js/pull/2629)]
- Fix axis range edits under axis constraints [[#2620](https://github.com/plotly/plotly.js/pull/2620)]
- Fix "sloppy click" event emission during cartesian zoom [[#2649](https://github.com/plotly/plotly.js/pull/2649)]
- Fix layout `grid` validation which lead to exceptions [[#2638](https://github.com/plotly/plotly.js/pull/2638)]
- Fix `parcoords` rendering in old Safari version [[#2612](https://github.com/plotly/plotly.js/pull/2612)]
- Link to <https://get.webgl.org> instead of http version in no WebGL message [[#2617](https://github.com/plotly/plotly.js/pull/2617)]


## [1.37.1] -- 2018-05-02

### Fixed
- Fix `Plotly.react` when adding/removing traces (bug introduced in 1.37.0) [[#2603](https://github.com/plotly/plotly.js/pull/2603)]


## [1.37.0] -- 2018-05-01

### Added
- Add `plotly_legendclick` and `plotly_legenddoubleclick` events [[#2581](https://github.com/plotly/plotly.js/pull/2581)]
- Add Swahili (`sw`) locale [[#2526](https://github.com/plotly/plotly.js/pull/2526)]

### Changed
- Improve cartesian trace update and removal by using more d3-iomatic patterns.
  This results in some performance improvements during redraws [[#2574](https://github.com/plotly/plotly.js/pull/2574)]
- Our internal `Lib.nestedProperty` no longer prunes empty containers in
  `gd.data`, `gd.layout`, `gd._fullData` and `gd._fulllayout`.
  We made this change to clean up some of the `Plotly.react` internals.
  This also lead to a slight performance boost [[#2577](https://github.com/plotly/plotly.js/pull/2577)]

### Fixed
- Fix `Plotly.react`'s handling of transformed traces [[#2577](https://github.com/plotly/plotly.js/pull/2577)]
- Fix Safari support for `scattergl` and `splom` traces [[#2593](https://github.com/plotly/plotly.js/pull/2593)]
- Fix `scattergl` point clustering edge cases [[#2593](https://github.com/plotly/plotly.js/pull/2593)]
- Fix `scattergl` selection after double-click on graphs
  with more than 1e5 points [[#2593](https://github.com/plotly/plotly.js/pull/2593)]
- Fix artificial number of lines limit in `scattergl` traces [[#2568](https://github.com/plotly/plotly.js/pull/2568)]
- Fix typed array support in color array in `scattergl` traces [[#2596](https://github.com/plotly/plotly.js/pull/2596)]
- Fix typed array support for `splom` traces [[#2596](https://github.com/plotly/plotly.js/pull/2596)]
- Make `scatter` and `scattercarpet` coexist on same subplot [[#2574](https://github.com/plotly/plotly.js/pull/2574)]
- Fix incorrect fallback border color for axis common hover labels [[#2557](https://github.com/plotly/plotly.js/pull/2557)]
- Fix handling of blank editable legend items [[#2587](https://github.com/plotly/plotly.js/pull/2587)]
- Fix spikelines positioning in Firefox [[#2590](https://github.com/plotly/plotly.js/pull/2590)]
- Fix `Plotly.react` modebar updates when the locale changes [[#2592](https://github.com/plotly/plotly.js/pull/2592)]
- Fix `scatter` selection performance regression (dating back to 1.32.0) [[#2583](https://github.com/plotly/plotly.js/pull/2583)]
- Fix `plotly_beforeplot` and `plotly_beforehover` event handlers when attached
  with `gd.once` [[#2581](https://github.com/plotly/plotly.js/pull/2581)]


## [1.36.1] -- 2018-04-18

### Fixed
- Fix `scattergl` in dist and CDN bundles
  (due to `browser-pack-flat` discrepancy introduced in 1.36.0)
  by removing `browser-pack-flat` from our bundling pipeline [[#2572](https://github.com/plotly/plotly.js/pull/2572)]


## [1.36.0] -- 2018-04-17

### Added
- Add `splom` (aka scatter plot matrix) traces [[#2505](https://github.com/plotly/plotly.js/pull/2505)]
- Add multi-selection and click-to-select on `parcoords` axes [[#2415](https://github.com/plotly/plotly.js/pull/2415)]
- Add selection and improve legend items for `ohlc` and `candlestick` [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Add 'fixed size' layout shapes through new shape attributes
  `xsizemode`, `ysizemode`, `xanchor`  and `yanchor` [[#2532](https://github.com/plotly/plotly.js/pull/2532)]
- Add layout attribute `selectdirection` to restrict select-box direction [[#2506](https://github.com/plotly/plotly.js/pull/2506)]
- Add support for selections on graphs with range sliders [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Add support for ragged `table` inputs [[#2511](https://github.com/plotly/plotly.js/pull/2511)]
- Add Czech (`cs`) locale [[#2483](https://github.com/plotly/plotly.js/pull/2483)]
- Add Japanese (`ja`) locale [[#2558](https://github.com/plotly/plotly.js/pull/2558)]

### Changed
- Multiple performance improvements for cartesian subplots, most noticeable
  on graphs with many cartesian subplots [[#2474](https://github.com/plotly/plotly.js/pull/2474), [#2487](https://github.com/plotly/plotly.js/pull/2487), [#2527](https://github.com/plotly/plotly.js/pull/2527)]
- Use new `gl-mesh3d` version that attempts to make lighting results less
  hardware-dependent [[#2365](https://github.com/plotly/plotly.js/pull/2365)]
- New and improved point-clustering algorithm for `scattergl` [[#2499](https://github.com/plotly/plotly.js/pull/2499)]
- Improved `regl-line2d` component [[#2556](https://github.com/plotly/plotly.js/pull/2556)]

### Fixed
- Fix memory leak in `parcoords` traces [[#2415](https://github.com/plotly/plotly.js/pull/2415)]
- Fix `scattergl` `selectedpoints` clearance under select/lasso drag modes [[#2492](https://github.com/plotly/plotly.js/pull/2492)]
- Fix `scattergl` horizontal lines rendering [[#2564](https://github.com/plotly/plotly.js/pull/2564)]
- Fix `scattergl` unselected marker opacity for array marker opacity traces [[#2503](https://github.com/plotly/plotly.js/pull/2503)]
- Fix `scattergl` hover over data gaps [[#2499](https://github.com/plotly/plotly.js/pull/2499)]
- Fix `ohlc` on category axes [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Fix inconsistencies in `ohlc` and `candlestick` event data [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Fix hover `text` for `candlestick` traces [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Fix `scattermapbox` selections for traces with data gaps [[#2513](https://github.com/plotly/plotly.js/pull/2513)]
- Fix `table` border cases that got previously cut off [[#2511](https://github.com/plotly/plotly.js/pull/2511)]
- Fix `box` traces with one jittered outlier [[#2530](https://github.com/plotly/plotly.js/pull/2530)]
- Fix `cliponfalse: false` on reversed axes [[#2533](https://github.com/plotly/plotly.js/pull/2533)]
- Fix buggy `plot_bgcolor` rendering when updating axis `overlaying` attribute [[#2516](https://github.com/plotly/plotly.js/pull/2516)]
- Fix buggy `Plotly.react` behavior for `carpet`, `contourcarpet`, `scattercarpet`,
  `table` and x/y/z column `heatmap` traces [[#2525](https://github.com/plotly/plotly.js/pull/2525)]
- Fix buggy `Plotly.react` behavior for `ohlc` and `candlestick` traces [[#2561](https://github.com/plotly/plotly.js/pull/2561)]
- Fix ordered categories on graphs with `visible: false` traces [[#2489](https://github.com/plotly/plotly.js/pull/2489)]
- Fix ordered categories in multi-subplot graphs [[#2489](https://github.com/plotly/plotly.js/pull/2489)]
- Fix inconsistencies when ordering number and numeric string categories [[#2489](https://github.com/plotly/plotly.js/pull/2489)]
- Fix format `days` in English locale [[#2490](https://github.com/plotly/plotly.js/pull/2490)]
- Handle HTML links with encoded URIs correctly in svg text labels [[#2471](https://github.com/plotly/plotly.js/pull/2471)]


## [1.35.2] -- 2018-03-09

### Fixed
- Ping `mapbox-gl` to `0.44.1` so that users on fresh
  `npm install` do not get the wrong mapbox-gl version message [[#2467](https://github.com/plotly/plotly.js/pull/2467)]
- Fix swapping between `scatter` and `scatter3d` traces and other
  potential problems caused by incorrect axis constraints resetting [[#2465](https://github.com/plotly/plotly.js/pull/2465)]


## [1.35.1] -- 2018-03-08

### Fixed
- Fix `scatterpolar` in dist and CDN bundles
  (due to `browser-pack-flat` discrepancy introduced in 1.35.0) [[#2458](https://github.com/plotly/plotly.js/pull/2458)]
- Fix removing and adding scatter(gl) as not the first module [[#2455](https://github.com/plotly/plotly.js/pull/2455)]
- Ensure we don't draw ticks if there are none to draw [[#2454](https://github.com/plotly/plotly.js/pull/2454)]


## [1.35.0] -- 2018-03-07

### Added
- Add `automargin` attribute to cartesian axes which auto-expands margins
  when ticks, tick labels and/or axis titles do not fit on the graph [[#2243](https://github.com/plotly/plotly.js/pull/2243)]
- Add support for typed arrays as data array inputs [[#2388](https://github.com/plotly/plotly.js/pull/2388)]
- Add layout `grids` attribute for easy subplot generation [[#2399](https://github.com/plotly/plotly.js/pull/2399)]
- Implement `cliponaxis: false` for bar text [[#2378](https://github.com/plotly/plotly.js/pull/2378)]
- Add opposite axis attributes for range slider to control y axis range behavior [[#2364](https://github.com/plotly/plotly.js/pull/2364)]
- Generalize `hoverdistance` and `spikedistance` for area-like objects [[#2379](https://github.com/plotly/plotly.js/pull/2379)]
- Bring `scattergl` auto-range logic to par with SVG `scatter` [[#2404](https://github.com/plotly/plotly.js/pull/2404)]
- Add selected/unselected marker color size support to `scattermapbox` traces [[#2361](https://github.com/plotly/plotly.js/pull/2361)]

### Changed
- Remove all circular dependencies in our `src/` directory [[#2429](https://github.com/plotly/plotly.js/pull/2429)]
- Build our CDN bundles with `browser-pack-flat` browserify plugin [[#2447](https://github.com/plotly/plotly.js/pull/2447)]
- Bump `mapbox-gl` to `v0.44.0` [[#2361](https://github.com/plotly/plotly.js/pull/2361)]
- Bump `glslify` to `v6.1.1` [[#2377](https://github.com/plotly/plotly.js/pull/2377)]
- Stop relinking `customdata`, `ids` and any matching objects
  in `gd._fullLayout` during `Plots.supplyDefaults` [[#2375](https://github.com/plotly/plotly.js/pull/2375)]

### Fixed
- Fix buggy auto-range / auto-margin interaction
  leading to axis range inconsistencies on redraws
  (this bug was mostly noticeable on graphs with legends) [[#2437](https://github.com/plotly/plotly.js/pull/2437)]
- Bring back `scattergl` lines under select/lasso `dragmode`
  (bug introduced in `1.33.0`) [[#2377](https://github.com/plotly/plotly.js/pull/2377)]
- Fix `scattergl` visible toggling for graphs with multiple traces
  with different modes (bug introduced in `1.33.0`) [[#2442](https://github.com/plotly/plotly.js/pull/2442)]
- Bring back `spikelines` for traces other than `scatter`
  (bug introduced in `1.33.0`) [[#2379](https://github.com/plotly/plotly.js/pull/2379)]
- Fix `Plotly.Fx.hover` acting on multiple subplots
  (bug introduced in `1.32.0`) [[#2379](https://github.com/plotly/plotly.js/pull/2379)]
- Fix range slider with stacked y axes positioning
  (bug introduced in `1.32.0`) [[#2451](https://github.com/plotly/plotly.js/pull/2451)]
- Fix `scattergl` color clustering [[#2377](https://github.com/plotly/plotly.js/pull/2377)]
- Fix `Plotly.restyle` for `scattergl` `fill` [[#2377](https://github.com/plotly/plotly.js/pull/2377)]
- Fix multi-line y-axis label positioning [[#2424](https://github.com/plotly/plotly.js/pull/2424)]
- Fix centered hover labels edge cases [[#2440](https://github.com/plotly/plotly.js/pull/2440), [#2445](https://github.com/plotly/plotly.js/pull/2445)]
- Fix hover labels in bar groups in compare mode [[#2414](https://github.com/plotly/plotly.js/pull/2414)]
- Fix axes and axis lines removal [[#2416](https://github.com/plotly/plotly.js/pull/2416)]
- Fix auto-sizing in `Plotly.react` [[#2437](https://github.com/plotly/plotly.js/pull/2437)]
- Fix error bars for `Plotly.react` and uneven data arrays [[#2360](https://github.com/plotly/plotly.js/pull/2360)]
- Fix edits for date-string referenced annotations [[#2368](https://github.com/plotly/plotly.js/pull/2368)]
- Fix `z` hover labels with exponents [[#2422](https://github.com/plotly/plotly.js/pull/2422)]
- Fix yet another histogram edge case [[#2413](https://github.com/plotly/plotly.js/pull/2413)]
- Fix fall back for contour labels when there's only one contour [[#2411](https://github.com/plotly/plotly.js/pull/2411)]
- Fix `scatterpolar` category angular period calculations [[#2449](https://github.com/plotly/plotly.js/pull/2449)]
- Clear select outlines on mapbox zoomstart [[#2361](https://github.com/plotly/plotly.js/pull/2361)]
- Fix legend click to causes legend scroll bug [[#2426](https://github.com/plotly/plotly.js/pull/2426)]


## [1.34.0] -- 2018-02-12

### Added
- Add `Plotly.react`, a new do-it-all API method that creates and update graphs
  using the same API signature [[#2341](https://github.com/plotly/plotly.js/pull/2341)]
- Add constraint-type contours to `contour` traces [[#2270](https://github.com/plotly/plotly.js/pull/2270)]
- Add `notched` and `notchwidth` attributes to `box` traces [[#2305](https://github.com/plotly/plotly.js/pull/2305)]
- Add localization machinery to auto-formatted date axis ticks [[#2261](https://github.com/plotly/plotly.js/pull/2261)]
- Add support for `text` in `mesh3d` traces [[#2327](https://github.com/plotly/plotly.js/pull/2327)]
- Add support for scalar `text` in `surface` traces [[#2327](https://github.com/plotly/plotly.js/pull/2327)]
- Make mode bar for graphs with multiple subplot types more usable [[#2339](https://github.com/plotly/plotly.js/pull/2339)]
- Add `npm@5` package-lock file [[#2323](https://github.com/plotly/plotly.js/pull/2323)]

### Changed
- All of gl-vis dependencies now use `gl-shader@4.2.1` [[#2293](https://github.com/plotly/plotly.js/pull/2293), [#2306](https://github.com/plotly/plotly.js/pull/2306)]
- All our dependencies and source now use `glslify@6.1.0` [[#2326](https://github.com/plotly/plotly.js/pull/2326)]

### Fixed
- Prevent page scroll on mobile device on `gl2d` and `gl3d` subplots [[#2296](https://github.com/plotly/plotly.js/pull/2296)]
- Fix multi-marker `scattergl` selection errors (bug introduced in `1.33.0`) [[#2295](https://github.com/plotly/plotly.js/pull/2295)]
- Fix `Plotly.addTraces` in `scattergl` selection call backs (bug introduced in `1.33.0`) [[#2298](https://github.com/plotly/plotly.js/pull/2298)]
- Fix trace `opacity` restyle for `scattergl` traces (bug introduced in `1.33.0`) [[#2299](https://github.com/plotly/plotly.js/pull/2299)]
- Fix `scattergl` handling of `selectedpoints` across multiple traces [[#2311](https://github.com/plotly/plotly.js/pull/2311)]
- Fix `scattergl` horizontal and vertical line rendering [[#2340](https://github.com/plotly/plotly.js/pull/2340)]
- Fix restyle for scalar `hoverinfo` for `scatter3d`, `surface` and `mesh3d` traces [[#2327](https://github.com/plotly/plotly.js/pull/2327)]
- Fix `table` when content-less cells and headers are supplied [[#2314](https://github.com/plotly/plotly.js/pull/2314)]
- Fix `Plotly.animate` for attribute nested in `dimensions` containers [[#2324](https://github.com/plotly/plotly.js/pull/2324)]
- Fix `hoverformat` on `visible: false` cartesian axes (bug introduced in `1.33.0`) [[#2329](https://github.com/plotly/plotly.js/pull/2329)]
- Fix handling of double negative translate transform values [[#2339](https://github.com/plotly/plotly.js/pull/2339)]
- Fix compare `hovermode` fallback for non-cartesian subplot types [[#2339](https://github.com/plotly/plotly.js/pull/2339)]
- Fix animation error messages when overriding and ignoring frames updates [[#2313](https://github.com/plotly/plotly.js/pull/2313)]


## [1.33.1] -- 2018-01-24

### Fixed

- Fix selection on `scattergl` plots with >20k points [[#2266](https://github.com/plotly/plotly.js/pull/2266)]
- Update Spanish localization with new strings [[#2268](https://github.com/plotly/plotly.js/pull/2268)]
- Fix test_dashboard overly rigid restriction so parcoods works there [[#2273](https://github.com/plotly/plotly.js/pull/2273)]
- Make `layout.colorway` compatible with `sankey` traces [[#2277](https://github.com/plotly/plotly.js/pull/2277)]
- Fix click events on `fixedrange` subplots [[#2279](https://github.com/plotly/plotly.js/pull/2279)]
- Remove ghost fill when trace data is emptied out [[#2280](https://github.com/plotly/plotly.js/pull/2280)]
- Fix resizing of new `scattergl` plots [[#2283](https://github.com/plotly/plotly.js/pull/2283)]
- Fix positioning of carpet axis titles for `cheaterslope` edge cases [[#2285](https://github.com/plotly/plotly.js/pull/2285)]
- Fix coloring and hover info for heatmaps and contour maps with nonuniform bins [[#2288](https://github.com/plotly/plotly.js/pull/2288)]


## [1.33.0] -- 2018-01-18

### Added
- Completely rewritten `scattergl` trace type using `regl` [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
- Completely rewritten polar chart renderer accompanied by new
  `scatterpolar` and `scatterpolargl` trace types [[#2200](https://github.com/plotly/plotly.js/pull/2200)]
- Add the ability to draw layout images and layout shapes on subplot
  with `scattergl` traces [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
- Add `fill` capabilities to `scattergl` traces [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
- Add `spikedistance`, `hoverdistance` and `skipsnap` for more customizable
  spikes and hover behavior on cartesian subplots [[#2247](https://github.com/plotly/plotly.js/pull/2247)]
- Add official Spanish translation (locale `es`) [[#2249](https://github.com/plotly/plotly.js/pull/2249)]
- Add official French translation (locale `fr`) [[#2252](https://github.com/plotly/plotly.js/pull/2252)]
- Add locale machinery to annotation _new text_ placeholder [[#2257](https://github.com/plotly/plotly.js/pull/2257)]

### Changed
- Old polar trace types (`scatter` with `(r,t)` coordinates,
  `bar` with `(r,t)` coordinates and `area`) are now deprecated.

### Fixed

- Fix `gl2d` tick label on pan interaction regression [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
- Fix `candlestick` hover label regression (bug introduced in v1.32.0) [[#2264](https://github.com/plotly/plotly.js/pull/2264)]
- Fix several `gl2d` axis related bugs with new regl-based `scattergl` [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
  See full list under the On-par gl2d milestone <https://github.com/plotly/plotly.js/milestone/3>
- Fix several polar bugs with `scatterpolar` [[#2200](https://github.com/plotly/plotly.js/pull/2200)].
  See full list under the On-par polar milestone <https://github.com/plotly/plotly.js/milestone/2>
- Fix `scattergl` marker.colorscale handling [[#2258](https://github.com/plotly/plotly.js/pull/2258)]
- Fix ternary relayout calls involving axis tick styles and titles [[#2200](https://github.com/plotly/plotly.js/pull/2200)]
- Fix decimal and thousands settings in `de` locale [[#2246](https://github.com/plotly/plotly.js/pull/2246)]
- Make scroll handler _passive_, removing those annoying console warnings [[#2251](https://github.com/plotly/plotly.js/pull/2251)]


## [1.32.0] -- 2018-01-11

### Added

- Add localization machinery including an official German translation (locale `de`) [[#2195](https://github.com/plotly/plotly.js/pull/2195), [#2207](https://github.com/plotly/plotly.js/pull/2207), [#2210](https://github.com/plotly/plotly.js/pull/2210), [#2232](https://github.com/plotly/plotly.js/pull/2232), [#2217](https://github.com/plotly/plotly.js/pull/2217)]
- Add `violin` trace type [[#2116](https://github.com/plotly/plotly.js/pull/2116)]
- Add `selected` and `unselected` attribute containers to customize selection states [[#2135](https://github.com/plotly/plotly.js/pull/2135)]
- Add support for multi-selections [[#2140](https://github.com/plotly/plotly.js/pull/2140)]
- Add layout `colorway` to custom the trace-to-trace color sequence [[#2156](https://github.com/plotly/plotly.js/pull/2156)]
- Add `tickformatstops` to set tick format per cartesian axis range [[#1965](https://github.com/plotly/plotly.js/pull/1965)]
- Add hover labels and selections to box points [[#2094](https://github.com/plotly/plotly.js/pull/2094)]
- Histogram events & bin hover label improvements [[#2113](https://github.com/plotly/plotly.js/pull/2113)]
- Add support for aggregation in `pie` traces [[#2117](https://github.com/plotly/plotly.js/pull/2117)]
- Add annotations `startarrowhead`, `arrowside`, `startarrowsize` and `startstandoff` attributes [[#2164](https://github.com/plotly/plotly.js/pull/2164)]
- Add `zhoverformat` to format `z` values in `heatmap`, `contour` and 2d histogram traces [[#2106](https://github.com/plotly/plotly.js/pull/2106), [#2127](https://github.com/plotly/plotly.js/pull/2127)]
- Add `marker.opacity` to bar traces [[#2163](https://github.com/plotly/plotly.js/pull/2163)]
- Add `Cividis` colorscale [[#2178](https://github.com/plotly/plotly.js/pull/2178)]
- Implement transform inverse mapping [[#2126](https://github.com/plotly/plotly.js/pull/2126), [#2162](https://github.com/plotly/plotly.js/pull/2162)]

### Changed

- Selections are now persistent [[#2135](https://github.com/plotly/plotly.js/pull/2135)]
- Make subplot initialization and removal more robust and consistent [[#2227](https://github.com/plotly/plotly.js/pull/2227)]
- Share WebGL context between `gl2d` and `parcoords` subplots [[#2159](https://github.com/plotly/plotly.js/pull/2159), [#2238](https://github.com/plotly/plotly.js/pull/2238)]
- Rename _Save and edit plot in cloud_ mode bar button _Edit in Chart Studio_ [[#2183](https://github.com/plotly/plotly.js/pull/2183)]
- Minify bundles using `minify-stream` instead of UglifyJS2 [[#2187](https://github.com/plotly/plotly.js/pull/2187)]
- Update header for new year 2018 [[#2231](https://github.com/plotly/plotly.js/pull/2231)]
- Remove `type="text/javascript"` from `<script>` tags present in our docs and test utilities [[#2217](https://github.com/plotly/plotly.js/pull/2217)]

### Fixed

- Fix right-click handling [[#2241](https://github.com/plotly/plotly.js/pull/2241)]
- Miscellaneous fixes for `table` traces [[#2107](https://github.com/plotly/plotly.js/pull/2107), [#2182](https://github.com/plotly/plotly.js/pull/2182)]
- Fix horizontal legend items alignment edge case [[#2149](https://github.com/plotly/plotly.js/pull/2149)]
- Fix shape and updatemenu layering [[#2121](https://github.com/plotly/plotly.js/pull/2121)]
- Fix bar with error bar with set `ids` edge case [[#2169](https://github.com/plotly/plotly.js/pull/2169)]
- Fix `cliponaxis: false` for non linear cartesian axes [[#2177](https://github.com/plotly/plotly.js/pull/2177)]
- Fix heatmap non-uniform brick gaps problem [[#2213](https://github.com/plotly/plotly.js/pull/2213)]
- Fix choropleth selection when `visible: false` trace are present on graph [[#2099](https://github.com/plotly/plotly.js/pull/2099), [#2109](https://github.com/plotly/plotly.js/pull/2109)]
- Fix yet another contour drawing bug [[#2091](https://github.com/plotly/plotly.js/pull/2091)]
- Clean up pie event data [[#2117](https://github.com/plotly/plotly.js/pull/2117)]
- Fix scatter + bar hover edge cases [[#2218](https://github.com/plotly/plotly.js/pull/2218)]
- Allow hover labels to extend to edges of graph area [[#2215](https://github.com/plotly/plotly.js/pull/2215)]
- Harden location-to-feature against non-string country names for geo subplot [[#2122](https://github.com/plotly/plotly.js/pull/2122)]
- Remove obsolete `smith` attribute from plot schema [[#2093](https://github.com/plotly/plotly.js/pull/2093)]
- Fix colorbar class name [[#2139](https://github.com/plotly/plotly.js/pull/2139)]
- Make `Plotly.Plots.resize` accept graph ids (as well as graph divs) [[#2212](https://github.com/plotly/plotly.js/pull/2212)]


## [1.31.2] -- 2017-10-23

### Fixed
- Fix multiple `table` restyle bugs [[#2107](https://github.com/plotly/plotly.js/pull/2107)]
- Fix selection work when `visible: false` choropleth traces are present [[#2099](https://github.com/plotly/plotly.js/pull/2099), [#2109](https://github.com/plotly/plotly.js/pull/2109)]
- Fix (another) contour generation bug [[#2091](https://github.com/plotly/plotly.js/pull/2091)]


## [1.31.1] -- 2017-10-16

### Fixed
- Fix IE and Edge SVG `toImage` support [[#2068](https://github.com/plotly/plotly.js/pull/2068)]
- Return empty set during selections of `visible: false` traces [[#2081](https://github.com/plotly/plotly.js/pull/2081)]
- Fix scroll glitch in `table` traces [[#2064](https://github.com/plotly/plotly.js/pull/2064)]
- Fix handling of 1D header values in `table` [[#2072](https://github.com/plotly/plotly.js/pull/2072)]
- Fix `table` line style defaults [[#2074](https://github.com/plotly/plotly.js/pull/2074)]
- Do not attempt to start drag on right-click [[#2087](https://github.com/plotly/plotly.js/pull/2087)]
- Phase out `alignment-baseline` attributes in SVG text nodes [[#2076](https://github.com/plotly/plotly.js/pull/2076)]
- Listen to document events on drag instead of relying on
  cover-slip node [[#2075](https://github.com/plotly/plotly.js/pull/2075)]


## [1.31.0] -- 2017-10-05

### Added
- Add `table` trace type [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Add `geo.center` making geo views fully reproducible using layout attributes [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Add lasso and select-box drag modes to `scattergeo` and `choropleth` traces
  [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Add lasso and select-box drag modes to `bar` and `histogram` traces [[#2045](https://github.com/plotly/plotly.js/pull/2045)]
- Add `scale` option to `Plotly.toImage` and `Plotly.downloadImage` [[#1979](https://github.com/plotly/plotly.js/pull/1979)]
- Add `plot-schema.json` to `dist/`[[#1999](https://github.com/plotly/plotly.js/pull/1999)]

### Changed
- Throttle lasso and select-box events for smoother behavior [[#2040](https://github.com/plotly/plotly.js/pull/2040)]
- Harmonize gl3d and gl2d zoom speed with cartesian behavior [[#2041](https://github.com/plotly/plotly.js/pull/2041)]

### Fixed
- Fix numerous `restyle` and `relayout` bugs [[#1999](https://github.com/plotly/plotly.js/pull/1999)]
- Fix handling of extreme off-plot data points in scatter lines [[#2060](https://github.com/plotly/plotly.js/pull/2060)]
- Fix `hoverinfo` array support for `scattergeo`, `choropleth`,
  `scatterternary` and `scattermapbox` traces [[#2055](https://github.com/plotly/plotly.js/pull/2055)]
- Fix `Plotly.plot` MathJax promise chain resolution [[#1991](https://github.com/plotly/plotly.js/pull/1991)]
- Fix legend double-click trace isolation behavior for graphs with
  `visible: false` traces [[#2019](https://github.com/plotly/plotly.js/pull/2019)]
- Fix legend visibility toggling for traces with `groupby` transforms [[#2019](https://github.com/plotly/plotly.js/pull/2019)]
- Fix single-bin histogram edge case [[#2028](https://github.com/plotly/plotly.js/pull/2028)]
- Fix autorange for bar with base zero [[#2050](https://github.com/plotly/plotly.js/pull/2050)]
- Fix annotations arrow rendering when graph div is off the DOM [[#2046](https://github.com/plotly/plotly.js/pull/2046)]
- Fix hover for graphs with `scattergeo` markers outside 'usa' scope [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Fix handling of cross anti-meridian geo `lonaxis` ranges [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Fix miter limit for lines on geo subplots [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Fix `marker.opacity` handling for `scattergeo` bubbles [[#2030](https://github.com/plotly/plotly.js/pull/2030)]
- Fix layout animation of secondary axes [[#1999](https://github.com/plotly/plotly.js/pull/1999)]
- Fix `sankey` hover text placement for empty `link.label` items [[#2016](https://github.com/plotly/plotly.js/pull/2016)]
- Fix `sankey` rendering of nodes with very small values [[#2017](https://github.com/plotly/plotly.js/pull/2017), [#2021](https://github.com/plotly/plotly.js/pull/2021)]
- Fix `sankey` hover label positioning on pages that style the
  'svg-container' div node [[#2027](https://github.com/plotly/plotly.js/pull/2027)]
- Fix aggregation transforms restyle calls [[#2031](https://github.com/plotly/plotly.js/pull/2031)]


## [1.30.1] -- 2017-09-06

### Fixed
- Fix shapes on overlaid axes [[#1975](https://github.com/plotly/plotly.js/pull/1975)]
- Correctly clear cartesian axis titles on full axis updates [[#1981](https://github.com/plotly/plotly.js/pull/1981)]
- Make cartesian hover spikes work when no tick labels are present [[#1980](https://github.com/plotly/plotly.js/pull/1980)]

## [1.30.0] -- 2017-08-21

### Added
- Add aggregate transform [[#1924](https://github.com/plotly/plotly.js/pull/1924)]
- Add `constraintext` attribute for bar traces [[#1931](https://github.com/plotly/plotly.js/pull/1931)]
- Add axis `layer` attribute to ternary axes [[#1952](https://github.com/plotly/plotly.js/pull/1952)]
- Add cross-trace matching auto-binning logic to histogram traces [[#1944](https://github.com/plotly/plotly.js/pull/1944)]
- Add `data/layout/config` api to `Plotly.toImage` to generate a static
  graph without having to render an interactive graph first [[#1939](https://github.com/plotly/plotly.js/pull/1939)]
- Add `nameformat` attribute to `groupby` transforms to set pattern by which
  grouped traces are named [[#1919](https://github.com/plotly/plotly.js/pull/1919)]

### Fixed
- Fix hover label exponents [[#1932](https://github.com/plotly/plotly.js/pull/1932), [#1949](https://github.com/plotly/plotly.js/pull/1949)]
- Fix scatter fill with isolated endpoints [[#1933](https://github.com/plotly/plotly.js/pull/1933)]
- Fix parcoords axis tick scale when `ticktext` is unordered [[#1945](https://github.com/plotly/plotly.js/pull/1945)]
- Fix sankey with 4 multi-links or more [[#1934](https://github.com/plotly/plotly.js/pull/1934)]
- Fix exponent labels beyond SI prefixes [[#1930](https://github.com/plotly/plotly.js/pull/1930)]
- Fix image generation for marker gradient legend items [[#1928](https://github.com/plotly/plotly.js/pull/1928)]
- Fix parcoords image generation when multiple parcoords graphs
  are present on page [[#1947](https://github.com/plotly/plotly.js/pull/1947)]
- Ignore bare closing tags in pseudo-html string inputs [[#1926](https://github.com/plotly/plotly.js/pull/1926)]


## [1.29.3] -- 2017-07-27

### Fixed
- Fix `groupby` / `filter` interactions when filter includes `target` data
  [[#1892](https://github.com/plotly/plotly.js/pull/1892)]


## [1.29.2] -- 2017-07-26

### Fixed
- Add fallback for `ArrayBuffer.isView` fixing gl2d and gl3d rendering
  in environments that don't support it (e.g. RStudio) [[#1915](https://github.com/plotly/plotly.js/pull/1915)]


## [1.29.1] -- 2017-07-25

### Fixed
- Fix axis line rendering when `showticklabels` is false
  (bug introduced in 1.29.0) [[#1910](https://github.com/plotly/plotly.js/pull/1910)]
- Fix histogram auto bin restyle [[#1901](https://github.com/plotly/plotly.js/pull/1901)]
- Fix colorbar edge case that caused infinite loops [[#1906](https://github.com/plotly/plotly.js/pull/1906)]


## [1.29.0] -- 2017-07-19

### Added
- Add touch interactions to cartesian, gl2d and ternary subplots including for
  select and lasso drag modes [[#1804](https://github.com/plotly/plotly.js/pull/1804), [#1890](https://github.com/plotly/plotly.js/pull/1890)]
- Add support for contour line labels in `contour` and `contourcarpet` traces
  [[#1815](https://github.com/plotly/plotly.js/pull/1815)]
- Add support for select and lasso drag modes on `scattermapbox` traces [[#1836](https://github.com/plotly/plotly.js/pull/1836)]
- Add double click interactions to mapbox subplots [[#1883](https://github.com/plotly/plotly.js/pull/1883)]
- Add reset view and toggle hover mode bar buttons to mapbox subplots [[#1883](https://github.com/plotly/plotly.js/pull/1883)]
- Add support for array `marker.opacity` settings in `scattermapbox` traces
  [[#1836](https://github.com/plotly/plotly.js/pull/1836)]
- Add `namelength` layout and trace attribute to control the trace name's
  visible length in hover labels [[#1822](https://github.com/plotly/plotly.js/pull/1822)]
- Add `cliponaxis` attribute to `scatter` and `scatterternary` traces to allow
  markers and text nodes to be displayed above their subplot's axes [[#1861](https://github.com/plotly/plotly.js/pull/1861)]
- Add axis `layer` attribute with `'above traces'` and `'below traces'` values
  [[#1871](https://github.com/plotly/plotly.js/pull/1871)]
- Add granular `editable` configuration options [[#1895](https://github.com/plotly/plotly.js/pull/1895)]
- Expanded traces generated by transforms now have unique colors [[#1830](https://github.com/plotly/plotly.js/pull/1830)]

### Fixed
- Fix axis line width, length, and positioning for coupled subplots [[#1854](https://github.com/plotly/plotly.js/pull/1854)]
- Fix alignment of cartesian tick labels [[#1854](https://github.com/plotly/plotly.js/pull/1854)]
- Fix rendering and updates of overlaying axis lines [[#1855](https://github.com/plotly/plotly.js/pull/1855)]
- Fix hover for 2D traces with custom colorbar `tickvals` [[#1891](https://github.com/plotly/plotly.js/pull/1891)]
- Fix hover and event data for `heatmapgl` and `contourgl` traces [[#1884](https://github.com/plotly/plotly.js/pull/1884)]
- Fix event data for `pie` and `sankey` traces [[#1896](https://github.com/plotly/plotly.js/pull/1896)]
- Fix drag mode `'pan'`in IE and Edge [[#1871](https://github.com/plotly/plotly.js/pull/1871)]
- Fix bar, error bar and box point scaling on scroll zoom [[#1897](https://github.com/plotly/plotly.js/pull/1897)]
- Fix shading issue in `surface` trace in iOS [[#1868](https://github.com/plotly/plotly.js/pull/1868)]
- Fix lasso and select drag modes for `scatterternary` traces [[#1831](https://github.com/plotly/plotly.js/pull/1831)]
- Fix cases of intersecting `contour` lines on log axes [[#1856](https://github.com/plotly/plotly.js/pull/1856)]
- Safer construction of `popup` click handler [[#1888](https://github.com/plotly/plotly.js/pull/1888)]
- Fix animation of annotations, shapes and images [[#1315](https://github.com/plotly/plotly.js/pull/1315)]
- Fix histogram bin computation when more than 5000 bins are needed [[#1887](https://github.com/plotly/plotly.js/pull/1887)]
- Fix tick label rendering when more than 1000 labels are present [[#1898](https://github.com/plotly/plotly.js/pull/1898)]
- Fix handling of empty `transforms` item [[#1829](https://github.com/plotly/plotly.js/pull/1829)]


## [1.28.3] -- 2017-06-26

### Fixed
- Fix deselect on double-clicking for gl2d traces [[#1811](https://github.com/plotly/plotly.js/pull/1811)]
- Fix `Plotly.purge` for gl2d and gl3d subplots
  (bug introduced in 1.28.0, leading to memory leaks) [[#1821](https://github.com/plotly/plotly.js/pull/1821)]
- Fix hover labels for `ohlc` and `candlestick` traces
  (bug introduced in 1.28.0) [[#1808](https://github.com/plotly/plotly.js/pull/1808)]
- Fix event data for `scattergeo` traces [[#1819](https://github.com/plotly/plotly.js/pull/1819)]
- Fix support of HTML entity number in pseudo-html inputs [[#1820](https://github.com/plotly/plotly.js/pull/1820)]


## [1.28.2] -- 2017-06-21

### Fixed
- Fix IE rendering error (`node.children` doesn't work on SVG nodes in IE) [[#1803](https://github.com/plotly/plotly.js/pull/1803)]


## [1.28.1] -- 2017-06-20

### Fixed
- Fix `scattergl` selected points. Points do not disappear after zoom any more
  in fast mode [[#1800](https://github.com/plotly/plotly.js/pull/1800)]


## [1.28.0] -- 2017-06-19

### Added
- Allow constraints by domain on cartesian axes using new axis attributes:
  `contrain: 'domain'` and `contraintoward` [[#1767](https://github.com/plotly/plotly.js/pull/1767)]
- Add gl3d annotations [[#1638](https://github.com/plotly/plotly.js/pull/1638), [#1786](https://github.com/plotly/plotly.js/pull/1786)]
- Add support for lasso and select `dragmode` on `scattergl` traces [[#1657](https://github.com/plotly/plotly.js/pull/1657)]
- Add 48 new `scattergl` marker symbols (for total of 56) [[#1781](https://github.com/plotly/plotly.js/pull/1781)]
- Add array support for `hoverinfo` [[#1761](https://github.com/plotly/plotly.js/pull/1761)]
- Add animation support for `fillcolor` attribute [[#1722](https://github.com/plotly/plotly.js/pull/1722)]
- Add `colorscale` attributes to `mesh3d` traces [[#1719](https://github.com/plotly/plotly.js/pull/1719)]
- Add support for target and popup attributes pseudo-html text links [[#1726](https://github.com/plotly/plotly.js/pull/1726)]
- Add per-`direction` updatemenu dropdown arrows [[#1792](https://github.com/plotly/plotly.js/pull/1792)]
- Add `execute` attribute to sliders and updatemenus to skip method calls while
  still triggering associated events [[#1700](https://github.com/plotly/plotly.js/pull/1700)]
- Add `skip` value to the `method` attribute for sliders and updatemenus which
  acts as a no-op [[#1699](https://github.com/plotly/plotly.js/pull/1699)]

### Changed
- Include values of all array attributes in hover/click/select event data
  including `ids` and `customdata` [[#1770](https://github.com/plotly/plotly.js/pull/1770)]
- Make gl2d axis tick labels on-par with SVG versions [[#1766](https://github.com/plotly/plotly.js/pull/1766)]
- Build SVG text nodes directly instead of using `DOMParser` [[#1783](https://github.com/plotly/plotly.js/pull/1783)]
- Rework transform style into array syntax [[#1794](https://github.com/plotly/plotly.js/pull/1794)]
- Recompute hover on click to increase click robustness [[#1646](https://github.com/plotly/plotly.js/pull/1646)]
- Miscellaneous performance improvements including improved bounding box caching
  and adding a few short-circuit [[#1772](https://github.com/plotly/plotly.js/pull/1772), [#1792](https://github.com/plotly/plotly.js/pull/1792)]

### Fixed
- Fix pan/zoom for layout component linked to `category` axes [[#1748](https://github.com/plotly/plotly.js/pull/1748), [#1791](https://github.com/plotly/plotly.js/pull/1791)]
- Fix non-`linear` gl3d axis range settings [[#1730](https://github.com/plotly/plotly.js/pull/1730)]
- Fix `ohlc` and `candlestick` when open value equals close value [[#1655](https://github.com/plotly/plotly.js/pull/1655)]
- Fix annotations positioning when MathJax symbols are present [[#1788](https://github.com/plotly/plotly.js/pull/1788)]
- Fix array values in event data for transformed traces [[#1717](https://github.com/plotly/plotly.js/pull/1717), [#1727](https://github.com/plotly/plotly.js/pull/1727), [#1737](https://github.com/plotly/plotly.js/pull/1737)]
- Fix relayout event data for gl3d camera interactions [[#1732](https://github.com/plotly/plotly.js/pull/1732)]
- Fix scatter markers and text nodes linked to `ids` ordering on updates [[#1709](https://github.com/plotly/plotly.js/pull/1709)]
- Fix `Plotly.validate` for dynamic enumerated attribute
  (e.g. axis `anchor`, `overlaying`) [[#1769](https://github.com/plotly/plotly.js/pull/1769)]
- Fix pseudo-html handling in sliders, updatemenus, range-sliders,
  range-selectors and carpet traces [[#1792](https://github.com/plotly/plotly.js/pull/1792)]
- Fix annotation bounding box and arrow heads in IE [[#1782](https://github.com/plotly/plotly.js/pull/1782)]
- Fix svg exports in IE for graphs with multiple clip paths [[#1740](https://github.com/plotly/plotly.js/pull/1740)]
- Fix `sankey` positioning in IE [[#1723](https://github.com/plotly/plotly.js/pull/1723), [#1731](https://github.com/plotly/plotly.js/pull/1731), [#1729](https://github.com/plotly/plotly.js/pull/1729), [#1735](https://github.com/plotly/plotly.js/pull/1735)]
- Fix relative links in IE [[#1715](https://github.com/plotly/plotly.js/pull/1715)]
- Suppress render warning in gl3d graphs with error bars [[#1718](https://github.com/plotly/plotly.js/pull/1718)]


## [1.27.1] -- 2017-05-17

### Fixed
- Fix text box positioning on scrolled windows (bug introduced in 1.27.0) [[#1683](https://github.com/plotly/plotly.js/pull/1683), [#1690](https://github.com/plotly/plotly.js/pull/1690)]
- Fix styling over links in annotation text [[#1681](https://github.com/plotly/plotly.js/pull/1681)]
- Fix `mesh3d` with `vertexcolor` coloring [[#1686](https://github.com/plotly/plotly.js/pull/1686)]
- Fix `sort` transform with set `categoryarray` [[#1689](https://github.com/plotly/plotly.js/pull/1689)]
- Fix `scatter` text node data join [[#1672](https://github.com/plotly/plotly.js/pull/1672)]
- Fix `plot` promise resolution in graphs with layout images in IE11 [[#1691](https://github.com/plotly/plotly.js/pull/1691)]

## [1.27.0] -- 2017-05-10

### Added
- Sankey diagram with new trace type `sankey` [[#1591](https://github.com/plotly/plotly.js/pull/1591), [#1664](https://github.com/plotly/plotly.js/pull/1664)]
- Add `hoverlabel` trace and layout attributes to customize hover label colors
  and fonts [[#1582](https://github.com/plotly/plotly.js/pull/1582)]
- Add `marker.gradient` attributes for `scatter`, `scattergeo`, `scatterternary`
  and `scattercarpet` traces [[#1620](https://github.com/plotly/plotly.js/pull/1620)]
- Add `sort` transform [[#1609](https://github.com/plotly/plotly.js/pull/1609)]
- Add `preservegaps` `filter` transform attribute [[#1589](https://github.com/plotly/plotly.js/pull/1589)]
- Add `!=` (not equal) `filter` transform operation [[#1589](https://github.com/plotly/plotly.js/pull/1589)]
- Add `labelfont`, `tickfont` and `rangefont` attributes for `parcoords` traces
  [[#1624](https://github.com/plotly/plotly.js/pull/1624)]
- Pass DOM mouse event on `plotly_clickannotations` events [[#1652](https://github.com/plotly/plotly.js/pull/1652)]

### Changed
- Performance optimization for range sliders and Drawing cache [[#1585](https://github.com/plotly/plotly.js/pull/1585)]

### Fixed
- Fix `scattergl` marker symbol positioning (bug introduced in 1.25.0) [[#1633](https://github.com/plotly/plotly.js/pull/1633)]
- Fix gl2d zoom where two clicks would trigger a zoom box (bug introduced 1.26.0) [[#1632](https://github.com/plotly/plotly.js/pull/1632)]
- Fix legend double click handler for `carpet` traces [[#1636](https://github.com/plotly/plotly.js/pull/1636)]
- Fix `restyle` for `scattercarpet` for style attributes with array support [[#1641](https://github.com/plotly/plotly.js/pull/1641)]
- Fix `restyle` for array layout components when more than 10 items are present
  [[#1639](https://github.com/plotly/plotly.js/pull/1639)]
- Fix select-box and lasso selections so that they don't include bad-data items
  [[#1656](https://github.com/plotly/plotly.js/pull/1656)]
- Fix `restyle` for contour `zmin` and `zmax` [[#1653](https://github.com/plotly/plotly.js/pull/1653)]
- Fix `scatter` text node transitions [[#1616](https://github.com/plotly/plotly.js/pull/1616), [#1626](https://github.com/plotly/plotly.js/pull/1626)]


## [1.26.1] -- 2017-04-21

### Fixed
- Fix `pie` fill opacity [[#1615](https://github.com/plotly/plotly.js/pull/1615)]
- Fix `contour.value` declaration for `contourcarpet` trace [[#1612](https://github.com/plotly/plotly.js/pull/1612)]


## [1.26.0] -- 2017-04-18

### Added
- Carpets plots with new trace types: `carpet`, `scattercarpet` and
  `contourcarpet` [[#1595](https://github.com/plotly/plotly.js/pull/1595), [#1596](https://github.com/plotly/plotly.js/pull/1596)]
- Axis constraints with new cartesian and gl2d axis attributes `scaleanchor` and
  `scaleratio` [[#1522](https://github.com/plotly/plotly.js/pull/1522)]
- Annotations `width`, `height`, `valign` and `xshift` and `yshift` attributes
  [[#1551](https://github.com/plotly/plotly.js/pull/1551), [#1590](https://github.com/plotly/plotly.js/pull/1590)]
- Hover text over annotations with `hovertext` and `hoverlabel` attributes
  [[#1573](https://github.com/plotly/plotly.js/pull/1573), [#1590](https://github.com/plotly/plotly.js/pull/1590)]
- Add `hovertext` attribute to trace types that can show `text` values on graph
  to allow setting hover text independently [[#1523](https://github.com/plotly/plotly.js/pull/1523)]
- Add `spikes` interactions functionality to cartesian subplots [[#1461](https://github.com/plotly/plotly.js/pull/1461)]
- Pass mouse DOM mouse event during `plotly_click`, `plotly_hover` and
  `plotly_unhover` [[#1505](https://github.com/plotly/plotly.js/pull/1505)]
- Add `visible` attribute to cartesian and gl3d axes to easily make them
  disappear [[#1595](https://github.com/plotly/plotly.js/pull/1595), [#1599](https://github.com/plotly/plotly.js/pull/1599)]
- Make `deleteFrames(gd)` delete all frames [[#1531](https://github.com/plotly/plotly.js/pull/1531)]

### Changed
- Lock down `gl-plot3d` and `matrix-camera-controller` dependencies to include
  latest memory management improvements [[#1570](https://github.com/plotly/plotly.js/pull/1570)]
- Performance improvements for `category` axes [[#1544](https://github.com/plotly/plotly.js/pull/1544)]
- Skip overhead for `showLink` config option is false [[#1557](https://github.com/plotly/plotly.js/pull/1557)]
- Optimize scatter trace sorting on updates [[#1555](https://github.com/plotly/plotly.js/pull/1555)]
- Lock down `gl-scatter2d-sdf` dependency to `1.3.4` while waiting for bug fix
  there [[#1572](https://github.com/plotly/plotly.js/pull/1572)]

### Fixed
- Fix bar sizes of traces with (x,y) `NaN` items [[#1519](https://github.com/plotly/plotly.js/pull/1519)]
- Fix handling of `NaN` items in array-ok attributes for `scattergeo` and
  `scattermapbox` traces [[#1538](https://github.com/plotly/plotly.js/pull/1538), [#1564](https://github.com/plotly/plotly.js/pull/1564)]
- Fix hover label position for `bar` traces with set `width` [[#1527](https://github.com/plotly/plotly.js/pull/1527)]
- Fix `restyle` for attribute containers [[#1536](https://github.com/plotly/plotly.js/pull/1536)]
- Fix `restyle` exception for `scattergl` traces with no `y` data [[#1567](https://github.com/plotly/plotly.js/pull/1567)]
- Fix animation of text nodes that contain `<br>`s [[#1602](https://github.com/plotly/plotly.js/pull/1602)]
- Fix `toImage` for mapbox subplots when access token is set in the config
  options [[#1598](https://github.com/plotly/plotly.js/pull/1598)]
- Emit `plotly_hover` on `pie` traces when `hoverinfo: 'none'` [[#1505](https://github.com/plotly/plotly.js/pull/1505)]
- Pass trace info during `plotly_click` on `pie` traces [[#1505](https://github.com/plotly/plotly.js/pull/1505)]
- Pass through the wheel event if the scrollbar is at the very top or bottom
  [[#1588](https://github.com/plotly/plotly.js/pull/1588)]


## [1.25.2] -- 2017-03-31

### Fixed
- rm `const` token from dist bundles that depend on `big-rat`,
  see <https://github.com/rat-nest/big-rat/pull/4> for more details.


## [1.25.1] -- 2017-03-28

### Fixed
- Fix `restyle` for `scattergl` traces with array `marker.size` (bug introduced
  in `1.25.0`) [[#1521](https://github.com/plotly/plotly.js/pull/1521)]
- Fix `relayout` for `histogram2dcontour` traces [[#1520](https://github.com/plotly/plotly.js/pull/1520)]
- Do not unnecessary mutate `parcoords` full trace objects when computing
  line color and colorscale [[#1509](https://github.com/plotly/plotly.js/pull/1509), [#1508](https://github.com/plotly/plotly.js/pull/1508)]
- Do not unnecessary coerce trace opacity in `parcoords` traces [[#1506](https://github.com/plotly/plotly.js/pull/1506)]


## [1.25.0] -- 2017-03-20

### Added
- Double click handler on legend items to isolate 1 traces / group on graph
  [[#1432](https://github.com/plotly/plotly.js/pull/1432)]

### Changed
- Use signed distance fields (SDF) method to render heterogeneous `scattergl`
  traces improving performance [[#1398](https://github.com/plotly/plotly.js/pull/1398)]
- Improve first-render performance in `scattergl` traces by only creating
  visible objects [[#1444](https://github.com/plotly/plotly.js/pull/1444)]
- Use `color-rgba` instead of `tinycolor2` to convert plotly color definitions to
  WebGL buffers improving performance for gl3d and gl2d traces [[#1443](https://github.com/plotly/plotly.js/pull/1443)]
- Bump `uglify-js` minifier to version `2.8.12` [[#1450](https://github.com/plotly/plotly.js/pull/1450)]

### Fixed
- Fix 3D trace ordering on visibility toggle [[#1466](https://github.com/plotly/plotly.js/pull/1466)]
- Fix gl2d trace ordering on visibility toggle [[#1444](https://github.com/plotly/plotly.js/pull/1444)]
- Fix autorange routine for bar traces [[#1475](https://github.com/plotly/plotly.js/pull/1475)]
- Fix shapes and images referencing a missing subplot [[#1481](https://github.com/plotly/plotly.js/pull/1481)]
- Ensure array attributes can be restyled in all situations [[#1488](https://github.com/plotly/plotly.js/pull/1488)]
- Fix XYZ-column-to-2D-z convert routine for columns containing nulls [[#1491](https://github.com/plotly/plotly.js/pull/1491)]
- Fix range slider display when anchored to log axes [[#1472](https://github.com/plotly/plotly.js/pull/1472)]
- Make sure all trace types can be deleted from range sliders [[#1472](https://github.com/plotly/plotly.js/pull/1472)]
- Let the `parcoords` object tree be garbage collected on `restyle` [[#1479](https://github.com/plotly/plotly.js/pull/1479)]
- Bring back support for histogram colorscales (bug introduced in `1.21.3`)
  [[#1500](https://github.com/plotly/plotly.js/pull/1500)]
- Support all axis types for clicktoshow annotations [[#1497](https://github.com/plotly/plotly.js/pull/1497)]
- Fix 3D margin relayout calls (bug introduced in `1.24.1`) [[#1494](https://github.com/plotly/plotly.js/pull/1494)]
- Fix `relayout` when trying to update empty axis containers (bug introduced in
  `1.24.0`) [[#1494](https://github.com/plotly/plotly.js/pull/1494)]


## [1.24.2] -- 2017-03-10

### Fixed
- Fix removal of last annotation or shape [[#1451](https://github.com/plotly/plotly.js/pull/1451)]
- Fix shape and image clip path removal [[#1453](https://github.com/plotly/plotly.js/pull/1453)]
- Fix overdrawing of data-referenced images [[#1453](https://github.com/plotly/plotly.js/pull/1453)]
- Make handling of `layer: 'below'` shape more robust [[#1453](https://github.com/plotly/plotly.js/pull/1453)]
- Allow multiple `parcoords` dimensions with the same label [[#1457](https://github.com/plotly/plotly.js/pull/1457)]


## [1.24.1] -- 2017-03-07

### Fixed
- Ensure that calling restyle or relayout in a `plotly_unhover` handler does not
  result in an infinite loop (bug introduced in 1.24.0) [[#1448](https://github.com/plotly/plotly.js/pull/1448)]
- Ensure autorange routine is bypassed when axis range is set (bug introduced in
  1.24.0) [[#1425](https://github.com/plotly/plotly.js/pull/1425)]
- Fix annotations dragging in editable mode (bug introduced in 1.22.0) [[#1441](https://github.com/plotly/plotly.js/pull/1441)]
- Show correct curve number in gl2d hover data [[#1427](https://github.com/plotly/plotly.js/pull/1427)]
- Clear parcoords canvas specially if no panel exist [[#1440](https://github.com/plotly/plotly.js/pull/1440)]
- Fix parcoords to render last block increment [[#1447](https://github.com/plotly/plotly.js/pull/1447)]
- Axis refs in hover data are not plagued by circular references [[#1431](https://github.com/plotly/plotly.js/pull/1431)]


## [1.24.0] -- 2017-02-27

### Added
- Add `parcoords` trace type (parallel coordinate plots) [[#1256](https://github.com/plotly/plotly.js/pull/1256)]
- Add support for multiple range sliders [[#1355](https://github.com/plotly/plotly.js/pull/1355)]
- Add `'aitoff'` and `'sinusoidal'` geo projection types [[#1422](https://github.com/plotly/plotly.js/pull/1422)]
- Implement `scene.dragmode: false` to disable drag interaction on 3D subplots
  [[#1377](https://github.com/plotly/plotly.js/pull/1377)]
- Add `showAxisDragHandles` and `showAxisRangeEntryBoxes` configuration options
  [[#1389](https://github.com/plotly/plotly.js/pull/1389)]
- Add `customdata` attribute to scatter traces to add custom data to scatter SVG
  nodes [[#1379](https://github.com/plotly/plotly.js/pull/1379)]

### Changed
- Consistent handling of array containers during `relayout` [[#1403](https://github.com/plotly/plotly.js/pull/1403)]
- Improve hover for `choropleth` traces [[#1401](https://github.com/plotly/plotly.js/pull/1401)]
- Make range slider handles and mask crispier [[#1409](https://github.com/plotly/plotly.js/pull/1409)]
- Bump `country-regex` dependency to `1.1.0` [[#1392](https://github.com/plotly/plotly.js/pull/1392)]

### Fixed
- Fix 3D on iOS devices [[#1411](https://github.com/plotly/plotly.js/pull/1411)]
- Fix `surface` trace opacity scaling [[#1415](https://github.com/plotly/plotly.js/pull/1415)]
- Fix hover data in animations [[#1274](https://github.com/plotly/plotly.js/pull/1274)]
- Fix annotations edit when dragging from one axis to another [[#1403](https://github.com/plotly/plotly.js/pull/1403)]
- Fix 3D hover labels for date axes [[#1414](https://github.com/plotly/plotly.js/pull/1414)]
- Deleting cartesian subplots now clear their corresponding axis titles [[#1393](https://github.com/plotly/plotly.js/pull/1393)]
- Fix hover for xyz column `heatmap` trace `'text'` [[#1417](https://github.com/plotly/plotly.js/pull/1417)]
- Fix `scattermapbox` lines with trailing gaps [[#1421](https://github.com/plotly/plotly.js/pull/1421)]
- Make `restyle`, `relayout` and `update` not mutate input update objects [[#1376](https://github.com/plotly/plotly.js/pull/1376)]
- Fix race condition in gl2d `toImage` [[#1388](https://github.com/plotly/plotly.js/pull/1388)]
- Fix handling of `Virgin Islands` country name [[#1392](https://github.com/plotly/plotly.js/pull/1392)]
- Fix `Plotly.validate` for `colorscale` attributes [[#1420](https://github.com/plotly/plotly.js/pull/1420)]


## [1.23.2] -- 2017-02-15

### Changed
- Bower installs now fetch un-minified `dist/plotly.js` bundle [[#1373](https://github.com/plotly/plotly.js/pull/1373)]
- Add package to packagist repository [[#1375](https://github.com/plotly/plotly.js/pull/1375)]


## [1.23.1] -- 2017-02-13

### Fixed
- Fix `relayout` for `scene.camera` values [[#1364](https://github.com/plotly/plotly.js/pull/1364)]
- Fix scaling on axis corner drag interactions for `bar` traces [[#1370](https://github.com/plotly/plotly.js/pull/1370)]
- Allow `bar` and `histogram` traces to coexist on same subplot [[#1365](https://github.com/plotly/plotly.js/pull/1365)]
- Fix `bar` position computations when placeholder traces are present [[#1310](https://github.com/plotly/plotly.js/pull/1310)]
- Fix auto-axis-type routine for data-less `candelestick`traces [[#1359](https://github.com/plotly/plotly.js/pull/1359)]


## [1.23.0] -- 2017-02-06

### Added
- Add scrollbox to long dropdown updatemenus [[#1214](https://github.com/plotly/plotly.js/pull/1214)]

### Fixed
- Multiple IE9 fixes [[#1332](https://github.com/plotly/plotly.js/pull/1332)]
- Ensure that `plotly_afterplot` is fired before `Plotly.plot` promise is
  resolved [[#1342](https://github.com/plotly/plotly.js/pull/1342)]
- Fix exception when dragging graphs with empty text labels [[#1336](https://github.com/plotly/plotly.js/pull/1336)]
- Fix exception when creating empty `ohlc` and `candlestick` traces [[#1348](https://github.com/plotly/plotly.js/pull/1348)]
- Fix `editable: true` legend items logic for `ohlc` and `candlestick` traces [[#1349](https://github.com/plotly/plotly.js/pull/1349)]
- Fix restyle for contour traces in cases where autocontour is defaulted to true
  [[#1338](https://github.com/plotly/plotly.js/pull/1338)]
- Fix edge case in axis label tick assignments [[#1324](https://github.com/plotly/plotly.js/pull/1324)]
- Fix vanishing titles text in `editable: true` [[#1351](https://github.com/plotly/plotly.js/pull/1351)]
- Fix 3D thumbnail image generation [[#1327](https://github.com/plotly/plotly.js/pull/1327)]


## [1.22.0] -- 2017-01-19

### Added
- Add `cumulative` histogram attributes to generate Cumulative Distribution
  Functions [[#1189](https://github.com/plotly/plotly.js/pull/1189)]
- Add `standoff` attribute for annotations to move the arrowhead away from the
  point it's marking [[#1265](https://github.com/plotly/plotly.js/pull/1265)]
- Add `clicktoshow`, `xclick` and `yclick` attributes for annotations to
  show/hide annotations on click [[#1265](https://github.com/plotly/plotly.js/pull/1265)]
- Support data-referenced annotation in gl2d subplots [[#1301](https://github.com/plotly/plotly.js/pull/1301), [#1319](https://github.com/plotly/plotly.js/pull/1319)]
- Honor `fixedrange: false` in y-axes anchored to xaxis with range slider
  [[#1261](https://github.com/plotly/plotly.js/pull/1261)]
- Add fallbacks for IE9 so that all cartesian traces can render without any
  polyfill [[#1297](https://github.com/plotly/plotly.js/pull/1297), [#1299](https://github.com/plotly/plotly.js/pull/1299)]

### Changed
- Adapt plot schema output for plotly.py 2.0 [[#1292](https://github.com/plotly/plotly.js/pull/1292)]
- Bump `mouse-change` dep to `^1.4.0` [[#1305](https://github.com/plotly/plotly.js/pull/1305)]
- Improve performance in `visible` toggling for `scattergl` [[#1300](https://github.com/plotly/plotly.js/pull/1300)]

### Fixed
- Fix XSS vulnerability in trace name on hover [[#1307](https://github.com/plotly/plotly.js/pull/1307)]
- Fix ternary and geo subplot with `visible: false` first trace [[#1291](https://github.com/plotly/plotly.js/pull/1291)]
- Fix opacity for `mode: 'lines'` items in legend [[#1204](https://github.com/plotly/plotly.js/pull/1204)]
- Fix legend items style for bar trace with marker arrays [[#1289](https://github.com/plotly/plotly.js/pull/1289)]
- Fix range slider svg / pdf and eps image exports [[#1306](https://github.com/plotly/plotly.js/pull/1306)]
- Fix scattergl `visible: false` traces with empty data arrays [[#1300](https://github.com/plotly/plotly.js/pull/1300)]
- Fix a few contour trace edge cases [[#1309](https://github.com/plotly/plotly.js/pull/1309)]
- Updatemenus buttons now render above sliders [[#1302](https://github.com/plotly/plotly.js/pull/1302)]
- Add fallback for categorical histogram on linear axes [[#1284](https://github.com/plotly/plotly.js/pull/1284)]
- Allow style fields in sub and sup text [[#1288](https://github.com/plotly/plotly.js/pull/1288)]


## [1.21.3] -- 2017-01-05

### Fixed
- Fix zoom behavior on transformed traces [[#1257](https://github.com/plotly/plotly.js/pull/1257)]
- Compute axis auto-range after transform operation [[#1260](https://github.com/plotly/plotly.js/pull/1260)]
- Fix contour trace blowing up on zoom [#591]
- Fix `scattermapbox` and `scattergeo` handling of blank strings `text` [[#1283](https://github.com/plotly/plotly.js/pull/1283)]
- Lock `mouse-change@1.3.0` fixing 3D hover labels on fresh `npm install`
  [[#1281](https://github.com/plotly/plotly.js/pull/1281)]


## [1.21.2] -- 2016-12-14

### Fixed
- Fix handling of calendar in `filter` transforms where distinct calendars can
  now be set for both the `target` and `value` [[#1253](https://github.com/plotly/plotly.js/pull/1253)]
- Make `Plotly.addFrames` skip over non-plain-objects inputs [[#1254](https://github.com/plotly/plotly.js/pull/1254)]
- Make `Plots.graphJson` aware of `frames` [[#1255](https://github.com/plotly/plotly.js/pull/1255)]


## [1.21.1] -- 2016-12-14

### Fixed
- Fix `ms2datetime` routine for Chinese calendar [[#1252](https://github.com/plotly/plotly.js/pull/1252)]
- Fix `tickformat` for world calendars [[#1252](https://github.com/plotly/plotly.js/pull/1252)]


## [1.21.0] -- 2016-12-12

### Added
- Bar labels via `text` and `textposition` [[#1159](https://github.com/plotly/plotly.js/pull/1159)]
- Add support for 16 non-gregorian calendars for date inputs and display [[#1220](https://github.com/plotly/plotly.js/pull/1220),
  [#1230](https://github.com/plotly/plotly.js/pull/1230), [#1237](https://github.com/plotly/plotly.js/pull/1237)]
- Add support for ISO-8601 timestamps [[#1194](https://github.com/plotly/plotly.js/pull/1194)]
- Extend histogram bin auto-shifting algorithm to date axes [[#1201](https://github.com/plotly/plotly.js/pull/1201)]
- Trace type `heatmapgl` is now included in the main plotly.js bundle [[#1197](https://github.com/plotly/plotly.js/pull/1197)]

### Changed
- Linearize date coordinates using UTC rather than local milliseconds [[#1194](https://github.com/plotly/plotly.js/pull/1194)]

### Fixed
- Fix wrongly computed date positions around daylight savings time [[#1194](https://github.com/plotly/plotly.js/pull/1194)]
- Fix erroneous traces in multi-subplot layout containing fill-to scatter
  traces (and plotly.py violin plots) [[#1198](https://github.com/plotly/plotly.js/pull/1198)]
- Fix clip path URL on pages with query hashes [[#1203](https://github.com/plotly/plotly.js/pull/1203)]
- Ensure that numeric frame name are handle correctly [[#1236](https://github.com/plotly/plotly.js/pull/1236)]
- Fallback for manual manipulation of slider/frames [[#1233](https://github.com/plotly/plotly.js/pull/1233)]


## [1.20.5] -- 2016-11-23

### Fixed
- Fix 1.20.0 regression in handling numerical strings including commas and spaces
  [[#1185](https://github.com/plotly/plotly.js/pull/1185)]
- Fix 1.20.0 regression involving date histograms [[#1186](https://github.com/plotly/plotly.js/pull/1186)]
- Fix numerous `tickvals` and `ticktext` edge cases [[#1191](https://github.com/plotly/plotly.js/pull/1191)]


## [1.20.4] -- 2016-11-21

### Fixed
- Fix metaKeys field `PlotSchema.get()` output

## [1.20.3] -- 2016-11-21

### Fixed
- Remove infinite loop when plotting 1-pt `scattergl` traces [[#1168](https://github.com/plotly/plotly.js/pull/1168)]
- Fix updatemenu bug where the wrong button was set to active [[#1176](https://github.com/plotly/plotly.js/pull/1176)]
- Fix `addTraces` when called with existing traces as input [[#1175](https://github.com/plotly/plotly.js/pull/1175)]


## [1.20.2] -- 2016-11-17

### Fixed
- Fix hover labels in stacked bar charts [[#1163](https://github.com/plotly/plotly.js/pull/1163)]
- Fix mode bar zoom buttons on date axes [[#1162](https://github.com/plotly/plotly.js/pull/1162)]


## [1.20.1] -- 2016-11-16

### Fixed
- Fix annotation positioning on categorical axes [[#1155](https://github.com/plotly/plotly.js/pull/1155)]


## [1.20.0] -- 2016-11-15

### Added
- Allow date string inputs for axis ranges, `tick0`, `dtick`, annotation / image
  positions, histogram bins [[#1078](https://github.com/plotly/plotly.js/pull/1078), [#1150](https://github.com/plotly/plotly.js/pull/1150)]
- Add special `dtick` values for log axes [[#1078](https://github.com/plotly/plotly.js/pull/1078)]
- Add `visible` attribute to annotations, shapes and images items [[#1110](https://github.com/plotly/plotly.js/pull/1110)]
- Expose events on slider start/change/end [[#1126](https://github.com/plotly/plotly.js/pull/1126)]
- Expose event on updatemenu button click [[#1128](https://github.com/plotly/plotly.js/pull/1128)]
- Allow custom transform module to have supply layout default handler [[#1122](https://github.com/plotly/plotly.js/pull/1122)]

### Changed
- Increase `scattergl` precision [[#1114](https://github.com/plotly/plotly.js/pull/1114)]
- Use `topojson-client` to convert topojson to geojson [[#1147](https://github.com/plotly/plotly.js/pull/1147)]

### Fixed
- Fix hover labels for multi-trace `scattergl` graphs (bug introduced in
  `1.18.0`) [[#1148](https://github.com/plotly/plotly.js/pull/1148)]
- Fix date format on hover on full hour [[#1078](https://github.com/plotly/plotly.js/pull/1078)]
- Fix bar labels for non-zero `base` values [[#1142](https://github.com/plotly/plotly.js/pull/1142)]
- Scatter colorscale now yield correct colors when cmin and cmax ashow re equal
  [[#1112](https://github.com/plotly/plotly.js/pull/1112)]
- Fix `filter` transform for categorical `target` arrays with range operations
  [[#1120](https://github.com/plotly/plotly.js/pull/1120)]
- Make sure frames with `null` values clear array containers [[#1118](https://github.com/plotly/plotly.js/pull/1118)]
- Fix animations involving trace `opacity` [[#1146](https://github.com/plotly/plotly.js/pull/1146)]
- Fix fallback for non-animatable trace modules (bug introduced in `1.18.1`)
  [[#1141](https://github.com/plotly/plotly.js/pull/1141)]
- Fix race condition in animation resolution when coupled with `relayout`
  [[#1108](https://github.com/plotly/plotly.js/pull/1108)]
- Enforce casting requested frame names to strings [[#1124](https://github.com/plotly/plotly.js/pull/1124)]
- `Plotly.animte` no longer breaks when passing `null` frames [[#1121](https://github.com/plotly/plotly.js/pull/1121)]
- `Plotly.PlotSchema.get` now correctly list rangeslider and rangeselector under
  `xaxis` only [[#1144](https://github.com/plotly/plotly.js/pull/1144)]
- `Plotly.relayout` correctly updates arbitrary layout attributes [[#1133](https://github.com/plotly/plotly.js/pull/1133)]


## [1.19.2] -- 2016-11-02

### Fixed
- Fix hover label positioning on bar traces [[#1107](https://github.com/plotly/plotly.js/pull/1107)]


## [1.19.1] -- 2016-10-27

### Fixed
- Fix dist bundles [[#1094](https://github.com/plotly/plotly.js/pull/1094)]


## [1.19.0] -- 2016-10-27

**Unpublished on npm and CDN** due to broken dist bundles.

### Added
- Add two-argument `Plotly.plot` call signature [[#1014](https://github.com/plotly/plotly.js/pull/1014)]
- Add two-way binding functionality to updatemenus and sliders [[#1016](https://github.com/plotly/plotly.js/pull/1016)]
- Add `width`, `base` and `offset` attribute to bar trace [[#1075](https://github.com/plotly/plotly.js/pull/1075)]
- Add `fromcurrent` and `direction` animation options [[#1087](https://github.com/plotly/plotly.js/pull/1087)]
- Add ability to filter by arbitrary array [[#1062](https://github.com/plotly/plotly.js/pull/1062)]

### Changed
- Rename `filtersrc` filter transform attribute `target` (with
  backward-compatible map) [[#1062](https://github.com/plotly/plotly.js/pull/1062)]
- Bump `sane-topojson` requirement to 2.0.0. New topojson dist files fix
  the Michigan state border [[#1077](https://github.com/plotly/plotly.js/pull/1077)]
- scattergl now handles higher resolution dates [[#1033](https://github.com/plotly/plotly.js/pull/1033)]
- Improve error messages in `Plotly.animate` [[#1088](https://github.com/plotly/plotly.js/pull/1088)]

### Fixed
- `Plotly.newPlot` now respect user-defined layout `height` and `width` [#537]
- Fix dendrogram cartesian axis layers [[#1063](https://github.com/plotly/plotly.js/pull/1063)]
- Fix RGBA colorscale handler for contour [[#1090](https://github.com/plotly/plotly.js/pull/1090)]
- Fix gl2d axis title positioning [[#1067](https://github.com/plotly/plotly.js/pull/1067)]
- Fix gl2d multi-line axis tick labels display [[#1087](https://github.com/plotly/plotly.js/pull/1087)]
- Fix performance deficit of scattergl trace type with date coordinates [[#1021](https://github.com/plotly/plotly.js/pull/1021)]
- Fix ohlc trace offset computation [[#1066](https://github.com/plotly/plotly.js/pull/1066)]
- Fix ohlc and candlestick default trace names [[#1073](https://github.com/plotly/plotly.js/pull/1073)]
- Make `Plotly.animate` work with frames container array containers (e.g
  annotations) [[#1081](https://github.com/plotly/plotly.js/pull/1081)]
- Make `restyle` and `relayout` consistently remove items in array containers
  when called with value argument `null` [[#1086](https://github.com/plotly/plotly.js/pull/1086)]


## [1.18.1] -- 2016-10-18

### Fixed
- Fix cartesian subplot resize [[#1049](https://github.com/plotly/plotly.js/pull/1049)]
- Fix cartesian interactivity after click [[#1049](https://github.com/plotly/plotly.js/pull/1049)]
- Fix `scattergeo` traces with not-found country names [[#1046](https://github.com/plotly/plotly.js/pull/1046)]
- Honor `'name'` hoverinfo flag in `ohlc` traces [[#1050](https://github.com/plotly/plotly.js/pull/1050)]
- Fix animation merging for frames including array containers [[#1041](https://github.com/plotly/plotly.js/pull/1041). [#1048](https://github.com/plotly/plotly.js/pull/1048)]
- Fix `requestAnimationFrame` polyfill for script-tag imports [[#1039](https://github.com/plotly/plotly.js/pull/1039)]


## [1.18.0] -- 2016-10-13

### Added
- Add `ohlc` and `candlestick` trace types [[#1020](https://github.com/plotly/plotly.js/pull/1020)]
- Add slider layout component [#986, [#1029](https://github.com/plotly/plotly.js/pull/1029)]
- Add filter and groupby transforms [#936, #978]
- Add support for all cartesian trace types and subplot configuration in
  range slider range plots [#946, [#1017](https://github.com/plotly/plotly.js/pull/1017)]
- Add update menus `'buttons'` type, `direction` and `showactive` options [#974]
- Add `pad` attributes to update menus for more intuitive positioning [#989]
- Add `plotly_hover`, `plotly_click` and `plotly_unhover` event emitters
  on gl2d subplot [#994]
- Make `'text'` mode  scatter traces animatable [[#1011](https://github.com/plotly/plotly.js/pull/1011)]
- Add picking for `'line'` mode scattergeo traces [[#1004](https://github.com/plotly/plotly.js/pull/1004)]
- Add support for `fill: 'toself'` in scattergeo traces [[#1004](https://github.com/plotly/plotly.js/pull/1004)]

### Changed
- Allow null / undefined frames in `Plotly.addFrames`[[#1013](https://github.com/plotly/plotly.js/pull/1013)]

### Fixed
- Allow range sliders to properly relayout [#962]
- Fix handling of `NaN` gaps in range slider range plots [#946, [#1017](https://github.com/plotly/plotly.js/pull/1017)]
- Properly skip over `NaN`s in scattergeo data arrays [[#1004](https://github.com/plotly/plotly.js/pull/1004)]
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
- Fix `surface` contours description [#696]
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
- Argument parsing for vertex and face colors of mesh3d traces is now
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
- Fix Firefox 42 to-image failures [#104]
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

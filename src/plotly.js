/*
 * Pack internal modules unto an object.
 *
 * This object is require'ed in as 'Plotly' in numerous src and test files.
 * Require'ing 'Plotly' bypasses circular dependencies.
 *
 * Future development should move away from this pattern.
 *
 */

// promise polyfill
require('es6-promise').polyfill();

exports.Lib = require('./lib/lib');
exports.util = require('./lib/svg_text_utils');

// plot icons svg and plot css
exports.Icons = require('../build/ploticon');
require('../build/plotcss');

// configuration
exports.MathJaxConfig = require('./fonts/mathjax_config');
exports.defaultConfig = require('./plot_api/plot_config');

// plots
exports.Plots = require('./plots/plots');
exports.Axes = require('./plots/cartesian/axes');
exports.Fx = require('./plots/cartesian/graph_interact');
exports.Scene = require('./plots/gl3d/scene');
exports.Gl3dLayout = require('./plots/gl3d/layout/layout');
exports.Geo = require('./plots/geo/geo');
exports.GeoLayout = require('./plots/geo/layout/layout');
exports.Scene2D = require('./plots/gl2d/scene2d');
exports.micropolar = require('./plots/polar/micropolar');

// components
exports.Color = require('./components/color/color');
exports.Drawing = require('./components/drawing/drawing');
exports.Colorscale = require('./components/colorscale/colorscale');
exports.Colorbar = require('./components/colorbar/colorbar');
exports.ErrorBars = require('./components/errorbars/errorbars');
exports.Annotations = require('./components/annotations/annotations');
exports.Shapes = require('./components/shapes/shapes');
exports.Titles = require('./components/titles/titles');
exports.Legend = require('./components/legend/legend');
exports.ModeBar = require('./components/modebar/modebar');

// traces
exports.Scatter = require('./traces/scatter/scatter');
exports.Bars = require('./traces/bars/bars');
exports.Boxes = require('./traces/boxes/boxes');
exports.Heatmap = require('./traces/heatmap/heatmap');
exports.Histogram = require('./traces/histogram/histogram');
exports.Pie = require('./traces/pie/pie');
exports.Contour = require('./traces/contour/contour');
exports.Scatter3D = require('./traces/scatter3d/scatter3d');
exports.Surface = require('./traces/surface/surface');
exports.Mesh3D = require('./traces/mesh3d/mesh3d');
exports.ScatterGeo = require('./traces/scattergeo/scattergeo');
exports.Choropleth = require('./traces/choropleth/choropleth');
exports.ScatterGl = require('./traces/scattergl/scattergl');

// plot api
require('./plot_api/plot_api');
exports.PlotSchema = require('./plot_api/plot_schema');

// imaging routines
exports.Snapshot = require('./snapshot/snapshot');

// queue for undo/redo
exports.Queue = require('./lib/queue');

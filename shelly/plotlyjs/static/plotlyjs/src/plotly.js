require('es6-promise').polyfill();

// order of requires should matter only for interdependencies
// in attributes definitions. put the common modules first

exports.Lib = require('./lib/lib');
exports.util = require('./lib/plotly_util');

// icons, css and configuration
exports.Icons = require('../build/ploticon');
require('../build/plotcss');
exports.MathJaxConfig = require('./fonts/mathjax_config');
exports.defaultConfig = require('./config');

exports.Color = require('./color');
exports.Colorscale = require('./colorscale');
exports.Drawing = require('./drawing');
// then the plot structure
exports.Plots = require('./graph_obj');
exports.Axes = require('./axes');
exports.Colorbar = require('./colorbar');
exports.Fx = require('./graph_interact');
// then trace modules - scatter has to come first
exports.Scatter = require('./scatter');
exports.Bars = require('./bars');
exports.Boxes = require('./boxes');
exports.ErrorBars = require('./errorbars');
exports.Heatmap = require('./heatmap');
exports.Histogram = require('./histogram');
exports.Pie = require('./pie');
exports.Contour = require('./contour');
// and extra plot components
exports.Annotations = require('./annotations');
exports.Shapes = require('./shapes');
exports.Legend = require('./legend');
exports.ModeBar = require('./modebar');

// polar
exports.micropolar = require('./polar/micropolar');
exports.micropolar.manager = require('./polar/micropolar_manager');

// GL3D
exports.Gl3dLayout = require('./gl3d/defaults/gl3dlayout');
exports.Gl3dAxes = require('./gl3d/defaults/gl3daxes');
exports.Scatter3D = require('./gl3d/defaults/scatter3d');
exports.Surface = require('./gl3d/defaults/surface');
exports.Mesh3D = require('./gl3d/defaults/mesh3d');
exports.Scene = require('./gl3d/scene');

// Geo
exports.GeoLayout = require('./geo/defaults/geolayout');
exports.GeoAxes = require('./geo/defaults/geoaxes');
exports.ScatterGeo = require('./geo/defaults/scattergeo');
exports.Choropleth = require('./geo/defaults/choropleth');
exports.Geo = require('./geo/geo');

// GL2D
exports.ScatterGl = require('./gl2d/scattergl/scattergl');
exports.Scene2D = require('./gl2d/scene2d');

// plot schema
exports.PlotSchema = require('./plotschema');

// imaging Routines
exports.Snapshot = require('./snapshot/snapshot');

// Queue for undo/redo
exports.Queue = require('./queue');

// exports d3 used in the bundle
exports.d3 = require('d3');

// --- above will be in the plotly.js repo,
// below will be in the streambed plotlyjs only

// override defaultConfig
exports.defaultConfig.showSource = require('./addons/show_sources');

// custom styling injected via envify/uglifyify
if(process.env.PLOTLY_CUSTOM_STYLE === "open-office-2015") {
    require('./styles/open_office_2015')();
}

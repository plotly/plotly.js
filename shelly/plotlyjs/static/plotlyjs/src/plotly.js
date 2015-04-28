exports.micropolar = require('./micropolar');
exports.micropolar.manager = require('./micropolar_manager');

// order of requires should matter only for interdependencies
// in attributes definitions. put the common modules first
exports.Lib = require('./lib');
exports.util = require('./plotly_util');
exports.Color = require('./color');
exports.Drawing = require('./drawing');
// then the plot structure
exports.Plots = require('./graph_obj');
exports.Axes = require('./axes');
exports.Fx = require('./graph_interact');
// then trace modules - scatter has to come first
exports.Scatter = require('./scatter');
exports.Bars = require('./bars');
exports.Boxes = require('./boxes');
exports.Contour = require('./contour');
exports.ErrorBars = require('./errorbars');
exports.Heatmap = require('./heatmap');
exports.Histogram = require('./histogram');
// and extra plot components
exports.Annotations = require('./annotations');
exports.Shapes = require('./shapes');
exports.Legend = require('./legend');
exports.Colorbar = require('./colorbar');
exports.ModeBar = require('./modebar');
exports.Icons = require('../build/ploticon');
require('../build/plotcss');

// 3D
exports.Gl3dLayout = require('./gl3d/defaults/gl3dlayout');
exports.Gl3dAxes = require('./gl3d/defaults/gl3daxes');
exports.Scatter3D = require('./gl3d/defaults/scatter3d');
exports.Surface = require('./gl3d/defaults/surface');
exports.Scene = require('./gl3d/scene');

// configuration
exports.Config = require('./config');

// promise polyfill, embed rather than requiring dependencies
require('../../../../shelly/static/js/plugins/promise-1.0.0.min.js');
require('../../../../shelly/static/js/plugins/promise-done-1.0.0.js');

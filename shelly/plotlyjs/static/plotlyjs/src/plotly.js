var Plotly = {};
exports.Plotly = Plotly;

Plotly.micropolar = require('./micropolar');
Plotly.micropolar.manager = require('./micropolar_manager');

// order of requires should matter only for interdependencies
// in attributes definitions. put the common modules first
Plotly.Lib = require('./lib');
Plotly.util = require('./plotly_util');
Plotly.Color = require('./color');
Plotly.Drawing = require('./drawing');
// then the plot structure
Plotly.Plots = require('./graph_obj');
Plotly.Axes = require('./axes');
Plotly.Fx = require('./graph_interact');
// then trace modules - scatter has to come first
Plotly.Scatter = require('./scatter');
Plotly.Bars = require('./bars');
Plotly.Boxes = require('./boxes');
Plotly.Contour = require('./contour');
Plotly.ErrorBars = require('./errorbars');
Plotly.Heatmap = require('./heatmap');
Plotly.Histogram = require('./histogram');
// and extra plot components
Plotly.Annotations = require('./annotations');
Plotly.Shapes = require('./shapes');
Plotly.Legend = require('./legend');
Plotly.Colorbar = require('./colorbar');

// Modebar doesn't attach to Plotly object
// TODO: it should.
require('./modebar');

// promise polyfill, embed rather than requiring dependencies
// var promise = require('promise')
// if(!Promise) Promise = promise;
// else Promise.prototype.done = promise.prototype.done;
require('../../../../shelly/static/js/plugins/promise-1.0.0.min.js');
require('../../../../shelly/static/js/plugins/promise-done-1.0.0.js');

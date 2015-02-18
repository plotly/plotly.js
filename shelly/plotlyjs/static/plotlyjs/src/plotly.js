var Plotly = {};
exports.Plotly = Plotly;

Plotly.micropolar = require('./micropolar');
Plotly.micropolar.manager = require('./micropolar_manager');

Plotly.Lib = require('./lib');
Plotly.util = require('./plotly_util');
Plotly.Axes = require('./axes');
Plotly.Plots = require('./graph_obj');
Plotly.Color = require('./color');
Plotly.Drawing = require('./drawing');
Plotly.Scatter = require('./scatter');
Plotly.Annotations = require('./annotations');
Plotly.Bars = require('./bars');
Plotly.Boxes = require('./boxes');
Plotly.Colorbar = require('./colorbar');
Plotly.Contour = require('./contour');
Plotly.ErrorBars = require('./errorbars');
Plotly.Fx = require('./graph_interact');
Plotly.Heatmap = require('./heatmap');
Plotly.Histogram = require('./histogram');
Plotly.Legend = require('./legend');

// Modebar doesn't attach to Plotly object
// TODO: it should.
require('./modebar');

// promise polyfill, embed rather than requiring dependencies
var promise = require('promise')
if(!Promise) Promise = promise;
else Promise.prototype.done = promise.prototype.done;

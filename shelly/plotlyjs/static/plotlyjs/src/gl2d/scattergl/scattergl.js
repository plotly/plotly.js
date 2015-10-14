'use strict';

var Plotly = require('../../plotly');

var ScatterGl = module.exports = {};

Plotly.Plots.register(ScatterGl, 'scattergl',
    ['gl2d', 'showLegend', 'errorBarsOK', 'markerColorscale'], {
    description: [
        'The data visualized as scatter point or lines is set in `x` and `y`',
        'using the WebGl plotting engine.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
});

ScatterGl.attributes = require('./attributes');

ScatterGl.supplyDefaults = require('./defaults');

ScatterGl.colorbar = Plotly.Scatter.colorbar;

ScatterGl.calc = function(gd, trace) {
    var cd = [{x: false, y: false, trace: trace, t: {}}];

    Plotly.Scatter.arraysToCalcdata(cd);
    Plotly.Scatter.calcMarkerColorscales(trace);

    return cd;
};

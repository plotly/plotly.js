'use strict';

var Plotly = require('../../plotly');
var ScatterGl = require('./scattergl');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, ScatterGl.attributes, attr, dflt);
    }

    var len = Scatter.handleXYDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode', len < Scatter.PTS_LINESONLY ? 'lines+markers' : 'lines');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        Scatter.fillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Plotly.ErrorBars) {
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
    }
};

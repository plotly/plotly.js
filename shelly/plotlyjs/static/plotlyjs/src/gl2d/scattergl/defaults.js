'use strict';

var Plotly = require('../../plotly'),
    ScatterGl = require('./scattergl');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
      return Plotly.Lib.coerce(traceIn, traceOut, ScatterGl.attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, coerce);
    if(!len) {
      traceOut.visible = false;
      return;
    }

    coerce('text');
    coerce('mode', len < Scatter.PTS_LINESONLY ? 'lines+markers' : 'lines');

    coerce('fill');
    coerce('fillcolor');  // TODO add inherit routine for scatter.js

    if(Scatter.hasLines(traceOut)) {
      Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
      Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(Plotly.ErrorBars) {
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
    }
};

function handleXYDefaults(traceIn, traceOut, coerce) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y');

    if(x && y) {
        len = Math.min(x.length, y.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
        if(len < y.length) traceOut.y = y.slice(0, len);
    }

    return len;
}

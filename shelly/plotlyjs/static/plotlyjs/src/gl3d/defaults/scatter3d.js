'use strict';

var Plotly = require('../../plotly');

var Scatter3D = module.exports = {};

Plotly.Plots.register(Scatter3D,
    'scatter3d', ['gl3d', 'symbols', 'markerColorscale', 'showLegend']);

Scatter3D.attributes = require('../attributes/scatter3d');

Scatter3D.handleXYZDefaults = function(traceIn, traceOut, coerce) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y'),
        z = coerce('z');

    if(x && y && z) {
        len = Math.min(x.length, y.length, z.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
        if(len < y.length) traceOut.y = y.slice(0, len);
        if(len < z.length) traceOut.z = z.slice(0, len);
    }

    return len;
};

Scatter3D.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut,
                                 Scatter3D.attributes, attr, dflt);
    }

    var len = Scatter3D.handleXYZDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(Scatter.hasText(traceOut)) {
        Scatter.textDefaults(traceIn, traceOut, layout, coerce);
    }

    var lineColor = (traceOut.line || {}).color ,
        markerColor = (traceOut.marker || {}).color;
    if(coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

    var dims = ['x', 'y', 'z'];
    for(var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if(coerce(projection + '.show')) {
            coerce(projection + '.opacity');
            coerce(projection + '.scale');
        }
    }

    if(Plotly.ErrorBars) {
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});
    }
};

Scatter3D.colorbar = Plotly.Scatter.colorbar;

Scatter3D.calc = function(gd, trace) {
    // this is a kludge to put the array attributes into
    // calcdata the way Scatter.plot does, so that legends and
    // popovers know what to do with them.
    var cd = [{x: false, y: false, trace: trace, t: {}}];
    Plotly.Scatter.arraysToCalcdata(cd);

    Plotly.Scatter.calcMarkerColorscales(trace);

    return cd;
};

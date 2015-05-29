'use strict';

var MARKER_SYMBOLS = require('../lib/markers.json');
var Plotly = require('../../plotly');

var scatterAttrs = Plotly.Scatter.attributes,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line,
    extendFlat = Plotly.Lib.extendFlat;

var Scatter3D = {};

Plotly.Plots.register(Scatter3D, 'scatter3d', ['gl3d', 'symbols']);

Scatter3D.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    text: scatterAttrs.text,
    surfaceaxis: {
        type: 'enumerated',
        values: [-1,0,1,2],
        dflt: -1
    },
    surfacecolor: {
        type: 'color'
    },
    projection: {
        x: {
            show: {
                type: 'boolean',
                dflt: false
            },
            opacity: {
                type: 'number',
                min: 0,
                max: 1,
                dflt: 1
            },
            scale: {
                type: 'number',
                min: 0,
                max: 10,
                dflt: 2/3
            }
        },
        y: {
            show: {
                type: 'boolean',
                dflt: false
            },
            opacity: {
                type: 'number',
                min: 0,
                max: 1,
                dflt: 1
            },
            scale: {
                type: 'number',
                min: 0,
                max: 10,
                dflt: 2/3
            }
        },
        z: {
            show: {
                type: 'boolean',
                dflt: false
            },
            opacity: {
                type: 'number',
                min: 0,
                max: 1,
                dflt: 1
            },
            scale: {
                type: 'number',
                min: 0,
                max: 10,
                dflt: 2/3
            }
        }
    },
    mode: extendFlat(scatterAttrs.mode,  // shouldn't this be on-par with 2D?
                     {dflt: 'lines+markers'}),
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {  // Parity with scatter.js?
        color: scatterMarkerAttrs.color,
        symbol: scatterMarkerAttrs.symbol,
        size: extendFlat(scatterMarkerAttrs.size,
                         {dflt: 8}),
        opacity: extendFlat(scatterMarkerAttrs.opacity,
                            {dflt: 1}),
        line: {
            color: extendFlat(scatterMarkerLineAttrs.color,
                              {dflt: 'rgb(0,0,0)'}),
            width: extendFlat(scatterMarkerLineAttrs.width,
                              {dflt: 0, arrayOk: false})
        }

    },
    textposition: extendFlat(scatterAttrs.textposition,
                             {dflt: 'top center'}),
    textfont: scatterAttrs.textfont,
    _nestedModules: {  // nested module coupling
        'error_x': 'ErrorBars',
        'error_y': 'ErrorBars',
        'error_z': 'ErrorBars'
    }
};


module.exports = Scatter3D;


Scatter3D.handleXYZDefaults = function (traceIn, traceOut, coerce) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y'),
        z = coerce('z');

    if (x && y && z) {
        len = Math.min(x.length, y.length, z.length);
        if(len<x.length) traceOut.x = x.slice(0, len);
        if(len<y.length) traceOut.y = y.slice(0, len);
        if(len<z.length) traceOut.z = z.slice(0, len);
    }

    return len;
};

Scatter3D.markerSymbols = MARKER_SYMBOLS;

Scatter3D.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var _this = this,
        Scatter = Plotly.Scatter,
        lineColor,
        markerColor,
        isBubble;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

    this.handleXYZDefaults(traceIn, traceOut, coerce);

    coerce('text');
    coerce('mode');

    isBubble = Scatter.isBubble(traceIn);

    if (Scatter.hasMarkers(traceOut)) {
        markerColor = coerce('marker.color', defaultColor);
        coerce('marker.symbol');
        coerce('marker.size');
        coerce('marker.opacity', isBubble ? 0.7 : 1);
        coerce('marker.line.width', isBubble ? 1 : 0);
        coerce('marker.line.color', isBubble ? Plotly.Color.background : Plotly.Color.defaultLine);
    }

    if (Scatter.hasLines(traceOut)) {
        // don't try to inherit a color array
        lineColor = coerce('line.color', (Array.isArray(markerColor) ? false : markerColor) ||
                             defaultColor);
        coerce('line.width');
        coerce('line.dash');
    }

    if (Scatter.hasText(traceOut)) {
        coerce('textposition');
        coerce('textfont', layout.font);
    }

    if (coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

    var dims = ['x','y','z'];
    for (var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if (coerce(projection+'.show')) {
            coerce(projection+'.opacity');
            coerce(projection+'.scale');
        }
    }

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});
};

Scatter3D.calc = function(gd, trace) {
    // this is a kludge to put the array attributes into
    // calcdata the way Scatter.plot does, so that legends and
    // popovers know what to do with them.
    var cd = [{x: false, y: false, trace: trace, t: {}}];
    Plotly.Scatter.arraysToCalcdata(cd);
    return cd;
};

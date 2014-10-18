module.exports = Scatter3D;


function Scatter3D (config) {

    this.config = config;

}

var proto = Scatter3D.prototype;

proto.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    text: {from: 'Scatter'},
    scene: {
        type: 'sceneid',
        dflt: 'scene'
    },
    surfaceaxis: {
        type: 'enumerated',
        values: [-1,0,1,2],
        dflt: -1
    },
    surfacecolor: {
        type: 'color'
    },
    mode: {from: 'Scatter'},
    line: {
        color: {from: 'Scatter'},
        width: {from: 'Scatter'},
        dash: {from: 'Scatter'}
    },
    marker: {
        symbol: {from: 'Scatter'},
        size: {from: 'Scatter'},
        opacity: {from: 'Scatter'},
        line: {
            color: {from: 'Scatter'},
            width: {from: 'Scatter'}
        }

    },
    textposition: {from: 'Scatter'},
    textfont: {from: 'Scatter'}
};


proto.supplyXYZ = function (traceIn, traceOut) {
    var _this = this;
    var Plotly = this.config.Plotly;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

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

proto.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {
    var _this = this;
    var Plotly = this.config.Plotly;
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

    function coerceScatter(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, Scatter.attributes, attr, dflt);
    }

    this.supplyXYZ(traceIn, traceOut);

    coerceScatter('mode', 'lines+markers');
    coerceScatter('text');

    if (Scatter.hasLines(traceOut)) {
        coerceScatter('line.color', (traceIn.marker||{}).color || defaultColor);
        coerceScatter('line.width');
        coerceScatter('line.dash');
    }

    if (Scatter.hasMarkers(traceOut)) {
        coerceScatter('marker.color', defaultColor);
        coerceScatter('marker.symbol');
        coerceScatter('marker.size');
        coerceScatter('marker.opacity', 1);
        coerceScatter('marker.line.width', 0);
        // TODO parity with scatter.js
        coerceScatter('marker.line.color', 'rgb(0,0,0)');

    }

    if (Scatter.hasText(traceOut)) {
        coerceScatter('textposition');
        coerceScatter('textfont', layout.font);
    }

    coerce('scene');
    coerce('surfaceaxis');
    coerce('surfacecolor');

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});

};

'use strict';

var createScatterLine = require('./line-with-markers'),
    tinycolor = require('tinycolor2'),
    arrtools = require('arraytools'),
    calculateError = require('./calc-errors');

function Scatter3D (config) {

    this.config = config;

}

module.exports = Scatter3D;

var proto = Scatter3D.prototype;

proto.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},
    text: {from: 'Scatter'},
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
    var linecolor, markercolor;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, _this.attributes, attr, dflt);
    }

    function coerceScatter(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, Scatter.attributes, attr, dflt);
    }

    this.supplyXYZ(traceIn, traceOut);

    if (coerceScatter('text')) coerceScatter('mode', 'lines+markers+text');
    else coerceScatter('mode', 'lines+markers');

    if (Scatter.hasLines(traceOut)) {
        linecolor = coerceScatter('line.color', (traceIn.marker||{}).color || defaultColor);
        coerceScatter('line.width');
        coerceScatter('line.dash');
    }

    if (Scatter.hasMarkers(traceOut)) {
        markercolor = coerceScatter('marker.color', defaultColor);
        coerceScatter('marker.symbol');
        coerceScatter('marker.size', 8);
        coerceScatter('marker.opacity', 1);
        coerceScatter('marker.line.width', 0);
        // TODO parity with scatter.js
        coerceScatter('marker.line.color', 'rgb(0,0,0)');
    }

    if (Scatter.hasText(traceOut)) {
        coerceScatter('textposition', 'top center');
        coerceScatter('textfont', layout.font);
    }

    if (coerce('surfaceaxis') >= 0) coerce('surfacecolor', linecolor || markercolor);

    var dims = ['x','y','z'];
    for (var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if (coerce(projection+'.show')) {
            // adaptor until Mikola makes axes independent projection configs
            coerce('projection.x.opacity');
            coerce('projection.x.scale');
            //
            coerce(projection+'.opacity');
            coerce(projection+'.scale');
        }
    }

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});

};

function isTrue (bool) {
    return bool;
}

function calculateErrorParams(errors) {
    /*jshint camelcase: false */
    var capSize = [0.0, 0.0, 0.0], i, e;
    var color = [[0,0,0],[0,0,0],[0,0,0]];
    var lineWidth = [0.0, 0.0, 0.0];
    for(i=0; i<3; ++i) {
        e = errors[i];
        if (e && e.copy_zstyle !== false) {
            e = errors[2];
        }
        if(!e) continue;
        capSize[i] = e.width / 100.0;  //Ballpark rescaling, attempt to make consistent with plot.ly
        color[i] = str2RgbaArray(e.color);
        lineWidth = e.thickness;

    }
    return {capSize: capSize, color: color, lineWidth: lineWidth};
}

function calculateTextOffset(textposition) {
    //Read out text properties
    var textOffset = [0,0];
    if (textposition.indexOf('bottom') >= 0) {
        textOffset[1] += 1;
    }
    if (textposition.indexOf('top') >= 0) {
        textOffset[1] -= 1;
    }
    if (textposition.indexOf('left') >= 0) {
        textOffset[0] -= 1;
    }
    if (textposition.indexOf('right') >= 0) {
        textOffset[0] += 1;
    }
    return textOffset;
}

function str2RgbaArray(color) {
    color = tinycolor(color);
    return arrtools.str2RgbaArray(color.toRgbString());
}

function colorFormatter(colorIn, opacityIn) {
    var colorOut = null,
        colorLength = colorIn.length;
    if (Array.isArray(colorIn)) {
        colorOut = [];
        for (var i = 0; i < colorLength; ++i) {
            colorOut[i]     = str2RgbaArray(colorIn[i]);
            colorOut[i][3] *= opacityIn;
        }
    } else {
            colorOut     = str2RgbaArray(colorIn);
            colorOut[3] *= opacityIn;
    }
    return colorOut;
}

function sizeScaler(sizeIn) {
    var sizeOut = null;
    // rough parity with Plotly 2D markers
    function scale(size) { return size * 2; }
    if (Array.isArray(sizeIn)) {
        sizeOut = sizeIn.map(scale);
    } else {
        sizeOut = scale(sizeIn);
    }
    return sizeOut;
}

proto.update = function update (scene, sceneLayout, data, scatter) {
    /*jshint camelcase: false */
    // handle visible trace cases

    var params, i,
        points = [],
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        errorParams = calculateErrorParams([ data.error_x, data.error_y, data.error_z ]),
        xc, x = data.x,
        yc, y = data.y,
        zc, z = data.z,
        len = x.length;

    //Convert points
    for (i = 0; i < len; i++) {
        // sanitize numbers and apply transforms based on axes.type
        xc = xaxis.d2l(x[i]);
        yc = yaxis.d2l(y[i]);
        zc = zaxis.d2l(z[i]);

        points[i] = [xc, yc, zc];
    }

    //Build object parameters
    params = {
        position: points,
        mode:     data.mode
    };

    if ('line' in data) {
        params.lineColor     = str2RgbaArray(data.line.color);
        params.lineWidth     = data.line.width;
        params.lineDashes    = data.line.dash;
    }

    if ('marker' in data) {
        params.scatterColor         = colorFormatter(data.marker.color, data.marker.opacity);
        params.scatterSize          = sizeScaler(data.marker.size);
        params.scatterMarker        = this.markerSymbols[data.marker.symbol];
        params.scatterLineWidth     = data.marker.line.width;
        params.scatterLineColor     = str2RgbaArray(data.marker.line.color);
        params.scatterLineColor[3] *= data.marker.opacity;
        params.scatterAngle         = 0;
    }

    if ('textposition' in data) {
        params.text           = data.text;
        params.textOffset     = calculateTextOffset(data.textposition);
        params.textColor      = str2RgbaArray(data.textfont.color);
        params.textSize       = data.textfont.size;
        params.textFont       = data.textfont.family;
        params.textAngle      = 0;
    }

    var dims = ['x', 'y', 'z'];
    params.project = [];
    for (i = 0; i < 3; ++i) {
        var projection = data.projection[dims[i]];
        if ((params.project[i] = projection.show)) {
            // Mikolas API doesn't current support axes dependent
            // configuration. Its coming though.
            params.projectOpacity = data.projection.x.opacity;
            params.projectScale = data.projection.x.scale;
        }
    }

    params.errorBounds    = calculateError(data);
    params.errorColor     = errorParams.color;
    params.errorLineWidth = errorParams.lineWidth;
    params.errorCapSize   = errorParams.capSize;

    params.delaunayAxis       = data.surfaceaxis;
    params.delaunayColor      = str2RgbaArray(data.surfacecolor);

    if (scatter) scatter.update(params);
    else {
        var pickIds = scene.allocIds(4);

        params.pickId0   = pickIds.ids[0];
        params.pickId1   = pickIds.ids[1];
        params.pickId2   = pickIds.ids[2];
        params.pickId3   = pickIds.ids[3];
        scatter          = createScatterLine(scene.shell.gl, params);
        scatter.groupId  = pickIds.group;
        scatter.plotlyType  = data.type;
    }

    scatter.uid = data.uid;

    return scatter;
};


proto.markerSymbols = {
    'circle': '●',
    'circle-open': '○',
    'square': '■',
    'square-open': '□',
    'diamond': '◆',
    'diamond-open': '◇',
    'cross': '+',
    'x': '❌'
};

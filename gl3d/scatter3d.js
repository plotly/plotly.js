'use strict';

var createScatterLine = require('./line-with-markers'),
    tinycolor = require('tinycolor2'),
    arrtools = require('arraytools'),
    arrayCopy1D = arrtools.copy1D,
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
    showprojection: [
        {type: 'boolean', dflt: false},
        {type: 'boolean', dflt: false},
        {type: 'boolean', dflt: false}
    ],
    projectopacity: {
        type: 'number',
        min: 0,
        max: 1,
        dflt: 1
    },
    projectscale: {
        type: 'number',
        min: 0,
        max: 10,
        dflt: 2/3
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
    coerce('showprojection[0]');
    coerce('showprojection[1]');
    coerce('showprojection[2]');
    if (traceOut.showprojection.some(isTrue)) {
        coerce('projectopacity');
        coerce('projectscale');
    }

    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});

};

function isTrue (bool) {
    return bool;
}

function calculateErrorCapSize(errors) {
    /*jshint camelcase: false */
    var result = [0.0,0.0,0.0], i, e;
    for(i=0; i<3; ++i) {
        e = errors[i];
        if (e && e.copy_zstyle !== false) {
            e = errors[2];
        }
        if(!e) {
            continue;
        }
        if(e && 'width' in e) {
            result[i] = e.width / 100.0;  //Ballpark rescaling, attempt to make consistent with plot.ly
        }
    }
    return result;
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


proto.plot = function Scatter (scene, sceneLayout, data) {
    /*jshint camelcase: false */
    /*
     * data object {x,y,z and  marker: {size:size, color:color}}
     */

    // if (!('marker' in data)) data.marker = {};

    var params, scatter, idx, i,
        points = [],
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        errorProperties = [ data.error_x, data.error_y, data.error_z ],
        xc, x = data.x,
        yc, y = data.y,
        zc, z = data.z,
        len = x.length;


    //Convert points
    idx = 0;
    for (i = 0; i < len; i++) {
        // sanitize numbers
        xc = xaxis.d2c(x[i]);
        yc = yaxis.d2c(y[i]);
        zc = zaxis.d2c(z[i]);

        // apply any axis transforms
        if (xaxis.type === 'log') xc = xaxis.c2l(xc);
        if (yaxis.type === 'log') yc = yaxis.c2l(yc);
        if (zaxis.type === 'log') zc = zaxis.c2l(zc);

        points[idx] = [xc, yc, zc];
        ++idx;
    }
    if (!points.length) {
        return void 0;
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
        params.scatterColor         = str2RgbaArray(data.marker.color);
        params.scatterColor[3]     *= data.marker.opacity;
        params.scatterSize          = 2*data.marker.size;  // rough parity with Plotly 2D markers
        params.scatterMarker        = this.markerSymbols[data.marker.symbol];
        params.scatterLineWidth     = data.marker.line.width;
        params.scatterLineColor     = str2RgbaArray(data.marker.line.color);
        params.scatterLineColor[3] *= data.marker.opacity;
        params.scatterAngle         = 0;
    }

    if ('error_z' in data) {
        params.errorBounds    = calculateError(data),
        params.errorColor     = errorProperties.map( function (e) {
            return str2RgbaArray(e.color);
        });
        params.errorLineWidth = errorProperties.map( function (e) {
            return e.thickness;
        });
        params.errorCapSize   = calculateErrorCapSize(errorProperties);
    }

    if ('textposition' in data) {
        params.text           = data.text;
        params.textOffset     = calculateTextOffset(data.position);
        params.textColor      = str2RgbaArray(data.textfont.color);
        params.textSize       = data.textfont.size;
        params.textFont       = data.textfont.family;
        params.textAngle      = 0;
    }

    if (data.showprojection) {
        params.project = [true, true, true]; //arrayCopy1D(data.showprojection);
        params.projectOpacity = data.projectopacity;
        params.projectScale = data.projectscale;
    }

    params.delaunayAxis       = data.surfaceaxis;
    params.delaunayColor      = str2RgbaArray(data.surfacecolor);

    scatter = scene.glDataMap[data.uid];

    if (scatter) {
        /*
         * We already have drawn this surface,
         * lets just update it with the latest params
         */
        scatter.update(params);
    } else {
        /*
         * Push it onto the render queue
         */
        params.pickId0   = (scene.objectCount++)%256;
        params.pickId1   = (scene.objectCount++)%256;
        params.pickId2   = (scene.objectCount++)%256;
        params.pickId3   = (scene.objectCount++)%256;
        scatter          = createScatterLine(scene.shell.gl, params);
        scatter.groupId  = (scene.objectCount-1)>>8;
        scatter.plotlyType  = data.type;

        scene.glDataMap[data.uid] = scatter;
    }
    // uids determine which data is tied to which gl-object
    scatter.uid = data.uid;
    scatter.visible = data.visible;
    scene.update(sceneLayout, scatter);
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

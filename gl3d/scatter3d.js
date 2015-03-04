'use strict';

var createScatterLine = require('./line-with-markers'),
    str2RgbaArray = require('./str2rgbarray'),
    calculateError = require('./calc-errors');

function Scatter3D (config) {

    this.config = config;

    var Plotly = config.Plotly,
        scatterAttrs = Plotly.Scatter.attributes,
        scatterLineAttrs = scatterAttrs.line,
        scatterMarkerAttrs = scatterAttrs.marker,
        scatterMarkerLineAttrs = scatterMarkerAttrs.line,
        extendFlat = Plotly.Lib.extendFlat;

    this.attributes = {
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
}

module.exports = Scatter3D;

var proto = Scatter3D.prototype;


proto.handleXYZDefaults = function (traceIn, traceOut, coerce) {
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
    var _this = this,
        Plotly = this.config.Plotly,
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

proto.formatColor = function formatColor(colorIn, opacityIn, len) {
    var colorDflt = this.config.Plotly.Color.defaultLine,
        opacityDflt = 1,
        isArrayColorIn = Array.isArray(colorIn),
        isArrayOpacityIn = Array.isArray(opacityIn),
        colorOut = [],
        getColor,
        getOpacity,
        colori,
        opacityi;

    function calculateColor(colorIn, opacityIn) {
        var colorOut = str2RgbaArray(colorIn);
        colorOut[3] *= opacityIn;
        return colorOut;
    }

    if (isArrayColorIn) {
        getColor = function(c, i){
            return (c[i]===undefined) ? colorDflt : c[i];
        };
    } else {
        getColor = function(c) { return c; };
    }

    if (isArrayOpacityIn) {
        getOpacity = function(o, i){
            return (o[i]===undefined) ? opacityDflt : o[i];
        };
    } else {
        getOpacity = function(o){ return o; };
    }

    if (isArrayColorIn || isArrayOpacityIn) {
        for (var i = 0; i < len; i++) {
            colori = getColor(colorIn, i);
            opacityi = getOpacity(opacityIn, i);
            colorOut[i] = calculateColor(colori, opacityi);
        }
    } else {
        colorOut = calculateColor(colorIn, opacityIn);
    }

    return colorOut;
};

function calculateSize(sizeIn) {
    // rough parity with Plotly 2D markers
    return sizeIn * 2;
}

function calculateSymbol(symbolIn) {
    return proto.markerSymbols[symbolIn];
}

function formatParam(paramIn, len, calculate, dflt) {
    var paramOut = null;

    if (Array.isArray(paramIn)) {
        paramOut = [];

        for (var i = 0; i < len; i++) {
            if (paramIn[i]===undefined) paramOut[i] = dflt;
            else paramOut[i] = calculate(paramIn[i]);
        }

    } else paramOut = calculate(paramIn);

    return paramOut;
}

proto.update = function update (scene, sceneLayout, data, scatter) {
    /*jshint camelcase: false */
    // handle visible trace cases

    var params, i,
        points = [],
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        marker = data.marker,
        line = data.line,
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
        params.lineColor     = str2RgbaArray(line.color);
        params.lineWidth     = line.width;
        params.lineDashes    = line.dash;
    }

    if ('marker' in data) {
        params.scatterColor         = this.formatColor(marker.color, marker.opacity, len);
        params.scatterSize          = formatParam(marker.size, len, calculateSize, 20);
        params.scatterMarker        = formatParam(marker.symbol, len, calculateSymbol, '●');
        params.scatterLineWidth     = marker.line.width;  // arrayOk === false
        params.scatterLineColor     = this.formatColor(marker.line.color, marker.opacity, len);
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

'use strict';

var createLinePlot    = require('gl-line3d'),
    createScatterPlot = require('gl-scatter3d'),
    createErrorBars   = require('gl-error3d'),
    createMesh        = require('gl-mesh3d'),
    triangulate       = require('delaunay-triangulate'),
    str2RgbaArray     = require('../lib/str2rgbarray'),
    calculateError    = require('../lib/calc-errors'),
    DASH_PATTERNS     = require('../lib/dashes.json'),
    MARKER_SYMBOLS    = require('../lib/markers.json'),
    proto;

module.exports = createLineWithMarkers;

function LineWithMarkers(scene, uid) {
    this.scene              = scene;
    this.uid                = uid;
    this.linePlot           = null;
    this.scatterPlot        = null;
    this.errorBars          = null;
    this.textMarkers        = null;
    this.delaunayMesh       = null;
    this.mode               = '';
    this.dataPoints         = [];
    this.axesBounds         = [[-Infinity,-Infinity,-Infinity],
                               [Infinity,Infinity,Infinity]];
}

proto = LineWithMarkers.prototype;

proto.handlePick = function(selection) {
    if( selection.object &&
        (selection.object === this.linePlot ||
         selection.object === this.delaunayMesh ||
         selection.object === this.textMarkers)) {
        if(selection.object.highlight) {
            selection.object.highlight(null);
        }
        if(this.scatterPlot) {
            selection.object = this.scatterPlot;
            this.scatterPlot.highlight(selection.data);
        }
    }
}

function constructDelaunay(points, color, axis) {
    var u = (axis+1)%3;
    var v = (axis+2)%3;
    var filteredPoints = [];
    var filteredIds    = [];
    for(var i=0; i<points.length; ++i) {
        var p = points[i];
        if(isNaN(p[u]) || !isFinite(p[u]) ||
           isNaN(p[v]) || !isFinite(p[v])) {
            continue;
        }
        filteredPoints.push([p[u], p[v]]);
        filteredIds.push(i);
    }
    var cells = triangulate(filteredPoints);
    for(var i=0; i<cells.length; ++i) {
        var c = cells[i];
        for(var j=0; j<c.length; ++j) {
            c[j] = filteredIds[c[j]];
        }
    }
    return {
        positions:  points,
        cells:      cells,
        meshColor:  color
    };
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


function formatColor(Plotly, colorIn, opacityIn, len) {
    var colorDflt = Plotly.Color.defaultLine,
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
}

function calculateSize(sizeIn) {
    // rough parity with Plotly 2D markers
    return sizeIn * 2;
}

function calculateSymbol(symbolIn) {
    return MARKER_SYMBOLS[symbolIn];
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


function convertPlotlyOptions(scene, data) {
    var params, i,
        points = [],
        Plotly = scene.Plotly,
        sceneLayout = scene.fullSceneLayout,
        xaxis = sceneLayout.xaxis,
        yaxis = sceneLayout.yaxis,
        zaxis = sceneLayout.zaxis,
        marker = data.marker,
        line = data.line,
        errorParams = calculateErrorParams([ data.error_x, data.error_y, data.error_z ]),
        xc, x = data.x || [],
        yc, y = data.y || [],
        zc, z = data.z || [],
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
        params.scatterColor         = formatColor(Plotly, marker.color, marker.opacity, len);
        params.scatterSize          = formatParam(marker.size, len, calculateSize, 20);
        params.scatterMarker        = formatParam(marker.symbol, len, calculateSymbol, '●');
        params.scatterLineWidth     = marker.line.width;  // arrayOk === false
        params.scatterLineColor     = formatColor(Plotly, marker.line.color, marker.opacity, len);
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
    params.project = [false, false, false];
    params.projectScale = [1,1,1]
    params.projectOpacity = [1,1,1]
    for (i = 0; i < 3; ++i) {
        var projection = data.projection[dims[i]];
        if ((params.project[i] = projection.show)) {
            params.projectOpacity[i] = projection.opacity;
            params.projectScale[i] = projection.scale;
        }
    }

    params.errorBounds    = calculateError(data);
    params.errorColor     = errorParams.color;
    params.errorLineWidth = errorParams.lineWidth;
    params.errorCapSize   = errorParams.capSize;

    params.delaunayAxis       = data.surfaceaxis;
    params.delaunayColor      = str2RgbaArray(data.surfacecolor);

    return params;
}

proto.update = function(data) {
    var gl = this.scene.glplot.gl,
        lineOptions,
        scatterOptions,
        errorOptions,
        textOptions,
        dashPattern = DASH_PATTERNS['solid'];

    //Run data conversion
    var options = convertPlotlyOptions(this.scene, data);

    if('mode' in options) {
        this.mode = options.mode;
    }
    if('lineDashes' in options) {
        if(options.lineDashes in DASH_PATTERNS) {
            dashPattern = DASH_PATTERNS[options.lineDashes];
        }
    }

    //Save data points
    this.dataPoints = options.position;

    lineOptions = {
        gl:         gl,
        position:   options.position,
        color:      options.lineColor,
        lineWidth:  options.lineWidth || 1,
        dashes:     dashPattern[0],
        dashScale:  dashPattern[1]
    };

    if (this.mode.indexOf('lines') !== -1) {
        if (this.linePlot) this.linePlot.update(lineOptions);
        else {
            this.linePlot = createLinePlot(lineOptions);
            this.scene.glplot.add(this.linePlot);
        }
    } else if (this.linePlot) {
        this.scene.glplot.remove(this.linePlot);
        this.linePlot.dispose();
        this.linePlot = null;
    }

    scatterOptions = {
        gl:           gl,
        position:     options.position,
        color:        options.scatterColor,
        size:         options.scatterSize,
        glyph:        options.scatterMarker,
        orthographic: true,
        lineWidth:    options.scatterLineWidth,
        lineColor:    options.scatterLineColor,
        project:      options.project,
        projectScale: options.projectScale,
        projectOpacity: options.projectOpacity
    };

    if(this.mode.indexOf('markers') !== -1) {
        if (this.scatterPlot) this.scatterPlot.update(scatterOptions);
        else {
            this.scatterPlot = createScatterPlot(scatterOptions);
            this.scene.glplot.add(this.scatterPlot);
        }
    } else if(this.scatterPlot) {
        this.scene.glplot.remove(this.scatterPlot);
        this.scatterPlot.dispose();
        this.scatterPlot = null;
    }

    textOptions = {
        gl:           gl,
        position:     options.position,
        glyph:        options.text,
        color:        options.textColor,
        size:         options.textSize,
        angle:        options.textAngle,
        alignment:    options.textOffset,
        font:         options.textFont,
        orthographic: true,
        lineWidth:    0,
        project:      false
    };

    if(this.mode.indexOf('text') !== -1) {
        if (this.textMarkers) this.textMarkers.update(textOptions);
        else {
            this.textMarkers = createScatterPlot(textOptions);
            this.scene.glplot.add(this.textMarkers)
        }
    } else if (this.textMarkers) {
        this.scene.glplot.remove(this.textMarkers);
        this.textMarkers.dispose();
        this.textMarkers = null;
    }

    errorOptions = {
        gl:           gl,
        position:     options.position,
        color:        options.errorColor,
        error:        options.errorBounds,
        lineWidth:    options.errorLineWidth,
        capSize:      options.errorCapSize
    };
    if(this.errorBars) {
        if(options.errorBounds) {
            this.errorBars.update(errorOptions);
        } else {
            this.scene.glplot.remove(this.errorBars);
            this.errorBars.dispose();
            this.errorBars = null;
        }
    } else if(options.errorBounds) {
        this.errorBars = createErrorBars(errorOptions);
        this.scene.glplot.add(this.errorBars);
    }

    if(options.delaunayAxis >= 0) {
        var delaunayOptions = constructDelaunay(
            options.position,
            options.delaunayColor,
            options.delaunayAxis);
        if(this.delaunayMesh) {
            this.delaunayMesh.update(delaunayOptions);
        } else {
            delaunayOptions.gl = gl;
            this.delaunayMesh = createMesh(delaunayOptions);
            this.scene.glplot.add(this.delaunayMesh);
        }
    } else if(this.delaunayMesh) {
        this.scene.glplot.remove(this.delaunayMesh);
        this.delaunayMesh.dispose();
        this.delaunayMesh = null;
    }
};

proto.dispose = function() {
    if(this.linePlot) {
        this.scene.glplot.remove(this.linePlot);
        this.linePlot.dispose();
    }
    if(this.scatterPlot) {
        this.scene.glplot.remove(this.scatterPlot);
        this.scatterPlot.dispose();
    }
    if(this.errorBars) {
        this.scene.remove(this.errorBars);
        this.errorBars.dispose();
    }
    if(this.textMarkers) {
        this.scene.glplot.remove(this.textMarkers);
        this.textMarkers.dispose();
    }
    if(this.delaunayMesh) {
        this.scene.glplot.remove(this.textMarkers);
        this.delaunayMesh.dispose();
    }
}

function createLineWithMarkers(scene, data) {
    var plot = new LineWithMarkers(scene, data.uid);
    plot.update(data);
    return plot;
}

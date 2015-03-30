'use strict';

var createLinePlot    = require('gl-line3d'),
    createScatterPlot = require('gl-scatter3d'),
    createErrorBars   = require('gl-error-bars'),
    createMesh        = require('gl-mesh3d'),
    triangulate       = require('delaunay-triangulate'),
    DASH_PATTERNS     = require('../lib/dashes.json'),
    proto;

module.exports = createLineWithMarkers;

function LineWithMarkers(gl, linePlot, scatterPlot, errorBars, textMarkers, delaunayMesh, mode) {
    this.gl                 = gl;
    this.linePlot           = linePlot;
    this.scatterPlot        = scatterPlot;
    this.errorBars          = errorBars;
    this.textMarkers        = textMarkers;
    this.delaunayMesh       = delaunayMesh;
    this.mode               = mode;
    this.bounds             = [[ Infinity, Infinity, Infinity],
                               [-Infinity,-Infinity,-Infinity]];
    this.clipBounds         = [[-Infinity,-Infinity,-Infinity],
                               [ Infinity, Infinity, Infinity]];
    this.pickId0            = 0;
    this.pickId1            = 1;
    this.pickId2            = 2;
    this.pickId3            = 3;
    this.lineTransparent    = false;
    this.scatterTransparent = false;
    this.errorTransparent   = false;
    this.textTransparent    = false;
    this.fillTransparent    = false;
    this.meshTransparent    = false;
    this.dataPoints         = [];
    this.axesBounds         = [[-Infinity,-Infinity,-Infinity],
                               [Infinity,Infinity,Infinity]];
}

proto = LineWithMarkers.prototype;

proto.supportsTransparency = true;

proto.draw = function(cameraParams, transparent) {
    if(this.linePlot    && this.lineTransparent === transparent) {
        this.linePlot.clipBounds = this.clipBounds;
        this.linePlot.draw(cameraParams);
    }
    if(this.scatterPlot && this.scatterTransparent === transparent) {
        this.scatterPlot.clipBounds = this.clipBounds;
        this.scatterPlot.axesBounds = this.axesBounds;
        this.scatterPlot.draw(cameraParams);
    }
    if(this.textMarkers && this.textTransparent === transparent) {
        this.textMarkers.clipBounds = this.clipBounds;
        this.textMarkers.draw(cameraParams);
    }
    if(this.errorBars && this.errorTransparent === transparent) {
        this.errorBars.clipBounds = this.clipBounds;
        this.errorBars.draw(cameraParams);
    }
    if(this.delaunayMesh && this.meshTransparent === transparent) {
        this.delaunayMesh.clipBounds = this.clipBounds;
        this.delaunayMesh.draw(cameraParams);
    }
};

proto.drawPick = function(cameraParams) {
    if(this.linePlot) {
        this.linePlot.clipBounds = this.clipBounds;
        this.linePlot.drawPick(cameraParams);
    }
    if(this.scatterPlot) {
        this.scatterPlot.clipBounds = this.clipBounds;
        this.scatterPlot.axesBounds = this.axesBounds;
        this.scatterPlot.drawPick(cameraParams);
    }
    if(this.textMarkers) {
        this.textMarkers.clipBounds = this.clipBounds;
        this.textMarkers.drawPick(cameraParams);
    }
    if(this.delaunayMesh) {
        this.delaunayMesh.clipBounds = this.clipBounds;
        this.delaunayMesh.drawPick(cameraParams);
    }
}

proto.pick = function(pickResult) {
    var result = null;
    if(this.linePlot) {
        result = this.linePlot.pick(pickResult);
    }
    if(this.scatterPlot) {
        result = result || this.scatterPlot.pick(pickResult);
    }
    if(this.textMarkers) {
        result = result || this.textMarkers.pick(pickResult);
    }
    if(this.delaunayMesh) {
        result = result || this.delaunayMesh.pick(pickResult);
    }
    return result;
}

function isTransparent(color) {
    if(Array.isArray(color[0])) {
        for(var i=0; i<color.length; ++i) {
            var c = color[i];
            if(c.length === 4 && c[3] < 1) {
                return true;
            }
        }
        return false;
    }
    if(color.length === 3) {
        return false;
    }
    return color[3] < 1;
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
    }
}

proto.update = function(options) {
    var gl = this.gl,
        lineOptions,
        scatterOptions,
        errorOptions,
        textOptions,
        dashPattern = DASH_PATTERNS['solid'];

    options = options || {};

    if('mode' in options) {
        this.mode = options.mode;
    }
    if('clipBounds' in options) {
        this.clipBounds = options.clipBounds;
    }
    if('lineDashes' in options) {
        if(options.lineDashes in DASH_PATTERNS) {
            dashPattern = DASH_PATTERNS[options.lineDashes];
        }
    }
    if('pickId0' in options) {
        this.pickId0 = options.pickId0;
    }
    if('pickId1' in options) {
        this.pickId1 = options.pickId1;
    }
    if('pickId2' in options) {
        this.pickId2 = options.pickId2;
    }
    if('pickId3' in options) {
        this.pickId3 = options.pickId3;
    }

    //Save data points
    this.dataPoints = options.position;

    lineOptions = {
        position:   options.position,
        color:      options.lineColor,
        pickId:     this.pickId0,
        lineWidth:  options.lineWidth || 1,
        dashes:     dashPattern[0],
        dashScale:  dashPattern[1]
    };

    if (this.mode.indexOf('lines') !== -1) {
        this.lineTransparent = isTransparent(options.lineColor);
        if (this.linePlot) this.linePlot.update(lineOptions);
        else this.linePlot = createLinePlot(gl, lineOptions);
    } else if (this.linePlot) {
        this.linePlot.dispose();
        this.linePlot = null;
    }

    scatterOptions = {
        position:     options.position,
        color:        options.scatterColor,
        size:         options.scatterSize,
        glyph:        options.scatterMarker,
        orthographic: true,
        pickId:       this.pickId1,
        lineWidth:    options.scatterLineWidth,
        lineColor:    options.scatterLineColor,
        project:      options.project,
        projectScale: options.projectScale,
        projectOpacity: options.projectOpacity
    };

    if(this.mode.indexOf('markers') !== -1) {
        this.scatterTransparent = isTransparent(options.scatterColor) ||
            isTransparent(options.scatterLineColor);
        if (this.scatterPlot) this.scatterPlot.update(scatterOptions);
        else this.scatterPlot = createScatterPlot(gl, scatterOptions);
    } else if(this.scatterPlot) {
        this.scatterPlot.dispose();
        this.scatterPlot = null;
    }

    textOptions = {
        position:     options.position,
        glyph:        options.text,
        color:        options.textColor,
        size:         options.textSize,
        angle:        options.textAngle,
        alignment:    options.textOffset,
        font:         options.textFont,
        orthographic: true,
        pickId:       this.pickId2,
        lineWidth:    0
    };

    if(this.mode.indexOf('text') !== -1) {
        this.textTransparent = isTransparent(options.textColor);
        if (this.textMarkers) this.textMarkers.update(textOptions);
        else this.textMarkers = createScatterPlot(gl, textOptions);
    } else if (this.textMarkers) {
        this.textMarkers.dispose();
        this.textMarkers = null;
    }

    errorOptions = {
        position:     options.position,
        color:        options.errorColor,
        error:        options.errorBounds,
        lineWidth:    options.errorLineWidth,
        capSize:      options.errorCapSize
    };

    if(this.errorBars) {
        this.errorTransparent = isTransparent(options.errorColor);
        if(options.errorBounds) {
            this.errorBars.update(errorOptions);
        } else {
            this.errorBars.dispose();
            this.errorBars = null;
        }
    } else if(options.errorBounds) {
        this.errorTransparent = isTransparent(options.errorColor);
        this.errorBars = createErrorBars(gl, errorOptions);
    }

    if(options.delaunayAxis >= 0) {
        var delaunayOptions = constructDelaunay(
            options.position,
            options.delaunayColor,
            options.delaunayAxis);
        delaunayOptions.pickId = this.pickId3;
        this.meshTransparent = isTransparent(options.delaunayColor);
        if(this.delaunayMesh) {
            this.delaunayMesh.update(delaunayOptions);
        } else {
            this.delaunayMesh = createMesh(gl, delaunayOptions);
        }
    } else if(this.delaunayMesh) {
        this.delaunayMesh.dispose();
        this.delaunayMesh = null;
    }


    //Update bounding box
    var bounds = this.bounds = [[Infinity,Infinity,Infinity], [-Infinity,-Infinity,-Infinity]];
    function mergeBounds(object) {
        if(object) {
            var b = object.bounds;
            for(var i=0; i<3; ++i) {
                bounds[0][i] = Math.min(bounds[0][i], b[0][i]);
                bounds[1][i] = Math.max(bounds[1][i], b[1][i]);
            }
        }
    }
    mergeBounds(this.scatterPlot);
    mergeBounds(this.errorBars);
    mergeBounds(this.linePlot);
    mergeBounds(this.textMarkers);
    mergeBounds(this.delaunayMesh);
}

proto.dispose = function() {
    if(this.linePlot) {
        this.linePlot.dispose();
    }
    if(this.scatterPlot) {
        this.scatterPlot.dispose();
    }
    if(this.errorBars) {
        this.errorBars.dispose();
    }
    if(this.textMarkers) {
        this.textMarkers.dispose();
    }
    if(this.delaunayMesh) {
        this.delaunayMesh.dispose();
    }
}

function createLineWithMarkers(gl, options) {
    var plot = new LineWithMarkers(gl, null, null, null, null, '');
    plot.update(options);
    return plot;
}

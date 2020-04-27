/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var dragHelpers = require('../../dragelement/helpers');
var drawMode = dragHelpers.drawMode;
var openMode = dragHelpers.openMode;

var constants = require('./constants');
var i000 = constants.i000;
var i090 = constants.i090;
var i180 = constants.i180;
var i270 = constants.i270;
var cos45 = constants.cos45;
var sin45 = constants.sin45;

var cartesianHelpers = require('../../../plots/cartesian/helpers');
var p2r = cartesianHelpers.p2r;
var r2p = cartesianHelpers.r2p;

var handleOutline = require('../../../plots/cartesian/handle_outline');
var clearSelect = handleOutline.clearSelect;

var helpers = require('./helpers');
var readPaths = helpers.readPaths;
var writePaths = helpers.writePaths;
var ellipseOver = helpers.ellipseOver;


module.exports = function newShapes(outlines, dragOptions) {
    if(!outlines.length) return;
    var e = outlines[0][0]; // pick first
    if(!e) return;
    var d = e.getAttribute('d');

    var gd = dragOptions.gd;
    var drwStyle = gd._fullLayout.newshape;

    var plotinfo = dragOptions.plotinfo;
    var xaxis = plotinfo.xaxis;
    var yaxis = plotinfo.yaxis;
    var xPaper = !!plotinfo.domain || !plotinfo.xaxis;
    var yPaper = !!plotinfo.domain || !plotinfo.yaxis;

    var isActiveShape = dragOptions.isActiveShape;
    var dragmode = dragOptions.dragmode;

    var shapes = (gd.layout || {}).shapes || [];

    if(!drawMode(dragmode) && isActiveShape !== undefined) {
        var id = gd._fullLayout._activeShapeIndex;
        if(id < shapes.length) {
            switch(gd._fullLayout.shapes[id].type) {
                case 'rect':
                    dragmode = 'drawrect';
                    break;
                case 'circle':
                    dragmode = 'drawcircle';
                    break;
                case 'line':
                    dragmode = 'drawline';
                    break;
                case 'path':
                    var path = shapes[id].path || '';
                    if(path[path.length - 1] === 'Z') {
                        dragmode = 'drawclosedpath';
                    } else {
                        dragmode = 'drawopenpath';
                    }
                    break;
            }
        }
    }

    var isOpenMode = openMode(dragmode);

    var polygons = readPaths(d, gd, plotinfo, isActiveShape);

    var newShape = {
        editable: true,

        xref: xPaper ? 'paper' : xaxis._id,
        yref: yPaper ? 'paper' : yaxis._id,

        layer: drwStyle.layer,
        opacity: drwStyle.opacity,
        line: {
            color: drwStyle.line.color,
            width: drwStyle.line.width,
            dash: drwStyle.line.dash
        }
    };

    if(!isOpenMode) {
        newShape.fillcolor = drwStyle.fillcolor;
        newShape.fillrule = drwStyle.fillrule;
    }

    var cell;
    // line, rect and circle can be in one cell
    // only define cell if there is single cell
    if(polygons.length === 1) cell = polygons[0];

    if(
        cell &&
        dragmode === 'drawrect'
    ) {
        newShape.type = 'rect';
        newShape.x0 = cell[0][1];
        newShape.y0 = cell[0][2];
        newShape.x1 = cell[2][1];
        newShape.y1 = cell[2][2];
    } else if(
        cell &&
        dragmode === 'drawline'
    ) {
        newShape.type = 'line';
        newShape.x0 = cell[0][1];
        newShape.y0 = cell[0][2];
        newShape.x1 = cell[1][1];
        newShape.y1 = cell[1][2];
    } else if(
        cell &&
        dragmode === 'drawcircle'
    ) {
        newShape.type = 'circle'; // an ellipse!

        var xA = cell[i000][1];
        var xB = cell[i090][1];
        var xC = cell[i180][1];
        var xD = cell[i270][1];

        var yA = cell[i000][2];
        var yB = cell[i090][2];
        var yC = cell[i180][2];
        var yD = cell[i270][2];

        var xDateOrLog = plotinfo.xaxis && (
            plotinfo.xaxis.type === 'date' ||
            plotinfo.xaxis.type === 'log'
        );

        var yDateOrLog = plotinfo.yaxis && (
            plotinfo.yaxis.type === 'date' ||
            plotinfo.yaxis.type === 'log'
        );

        if(xDateOrLog) {
            xA = r2p(plotinfo.xaxis, xA);
            xB = r2p(plotinfo.xaxis, xB);
            xC = r2p(plotinfo.xaxis, xC);
            xD = r2p(plotinfo.xaxis, xD);
        }

        if(yDateOrLog) {
            yA = r2p(plotinfo.yaxis, yA);
            yB = r2p(plotinfo.yaxis, yB);
            yC = r2p(plotinfo.yaxis, yC);
            yD = r2p(plotinfo.yaxis, yD);
        }

        var x0 = (xB + xD) / 2;
        var y0 = (yA + yC) / 2;
        var rx = (xD - xB + xC - xA) / 2;
        var ry = (yD - yB + yC - yA) / 2;
        var pos = ellipseOver({
            x0: x0,
            y0: y0,
            x1: x0 + rx * cos45,
            y1: y0 + ry * sin45
        });

        if(xDateOrLog) {
            pos.x0 = p2r(plotinfo.xaxis, pos.x0);
            pos.x1 = p2r(plotinfo.xaxis, pos.x1);
        }

        if(yDateOrLog) {
            pos.y0 = p2r(plotinfo.yaxis, pos.y0);
            pos.y1 = p2r(plotinfo.yaxis, pos.y1);
        }

        newShape.x0 = pos.x0;
        newShape.y0 = pos.y0;
        newShape.x1 = pos.x1;
        newShape.y1 = pos.y1;
    } else {
        newShape.type = 'path';
        if(xaxis && yaxis) fixDatesForPaths(polygons, xaxis, yaxis);
        newShape.path = writePaths(polygons);
        cell = null;
    }

    clearSelect(gd);

    var editHelpers = dragOptions.editHelpers;
    var modifyItem = (editHelpers || {}).modifyItem;

    var allShapes = [];
    for(var q = 0; q < shapes.length; q++) {
        var beforeEdit = gd._fullLayout.shapes[q];
        allShapes[q] = beforeEdit._input;

        if(
            isActiveShape !== undefined &&
            q === gd._fullLayout._activeShapeIndex
        ) {
            var afterEdit = newShape;

            switch(beforeEdit.type) {
                case 'line':
                case 'rect':
                case 'circle':
                    modifyItem('x0', afterEdit.x0);
                    modifyItem('x1', afterEdit.x1);
                    modifyItem('y0', afterEdit.y0);
                    modifyItem('y1', afterEdit.y1);
                    break;

                case 'path':
                    modifyItem('path', afterEdit.path);
                    break;
            }
        }
    }

    if(isActiveShape === undefined) {
        allShapes.push(newShape); // add new shape
        return allShapes;
    }

    return editHelpers ? editHelpers.getUpdateObj() : {};
};

function fixDatesForPaths(polygons, xaxis, yaxis) {
    var xIsDate = xaxis.type === 'date';
    var yIsDate = yaxis.type === 'date';
    if(!xIsDate && !yIsDate) return polygons;

    for(var i = 0; i < polygons.length; i++) {
        for(var j = 0; j < polygons[i].length; j++) {
            for(var k = 0; k + 2 < polygons[i][j].length; k += 2) {
                if(xIsDate) polygons[i][j][k + 1] = polygons[i][j][k + 1].replace(' ', '_');
                if(yIsDate) polygons[i][j][k + 2] = polygons[i][j][k + 2].replace(' ', '_');
            }
        }
    }

    return polygons;
}

'use strict';

var axis_ids = require('../../../plots/cartesian/axis_ids');

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

var cartesianHelpers = require('../../selections/helpers');
var p2r = cartesianHelpers.p2r;
var r2p = cartesianHelpers.r2p;

var handleOutline = require('.././handle_outline');
var clearOutline = handleOutline.clearOutline;

var helpers = require('./helpers');
var readPaths = helpers.readPaths;
var writePaths = helpers.writePaths;
var ellipseOver = helpers.ellipseOver;
var fixDatesForPaths = helpers.fixDatesForPaths;

function newShapes(outlines, dragOptions) {
    if(!outlines.length) return;
    var e = outlines[0][0]; // pick first
    if(!e) return;

    var gd = dragOptions.gd;

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

    var newShape = createShapeObj(outlines, dragOptions, dragmode);

    clearOutline(gd);

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

                    var xaxis = axis_ids.getFromId(gd, beforeEdit.xref);
                    if (beforeEdit.xref.charAt(0) === 'x' && xaxis.type.includes('category')) {
                        modifyItem('x0', afterEdit.x0 - (beforeEdit.x0shift || 0));
                        modifyItem('x1', afterEdit.x1 - (beforeEdit.x1shift || 0));
                    } else {
                        modifyItem('x0', afterEdit.x0);
                        modifyItem('x1', afterEdit.x1);
                    }
                    var yaxis = axis_ids.getFromId(gd, beforeEdit.yref);
                    if (beforeEdit.yref.charAt(0) === 'y' && yaxis.type.includes('category')) {
                        modifyItem('y0', afterEdit.y0 - (beforeEdit.y0shift || 0));
                        modifyItem('y1', afterEdit.y1 - (beforeEdit.y1shift || 0));
                    } else {
                        modifyItem('y0', afterEdit.y0);
                        modifyItem('y1', afterEdit.y1);
                    }
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
}

function createShapeObj(outlines, dragOptions, dragmode) {
    var e = outlines[0][0]; // pick first outline
    var gd = dragOptions.gd;

    var d = e.getAttribute('d');
    var newStyle = gd._fullLayout.newshape;
    var plotinfo = dragOptions.plotinfo;
    var isActiveShape = dragOptions.isActiveShape;

    var xaxis = plotinfo.xaxis;
    var yaxis = plotinfo.yaxis;
    var xPaper = !!plotinfo.domain || !plotinfo.xaxis;
    var yPaper = !!plotinfo.domain || !plotinfo.yaxis;

    var isOpenMode = openMode(dragmode);
    var polygons = readPaths(d, gd, plotinfo, isActiveShape);

    var newShape = {
        editable: true,

        visible: newStyle.visible,
        name: newStyle.name,
        showlegend: newStyle.showlegend,
        legend: newStyle.legend,
        legendwidth: newStyle.legendwidth,
        legendgroup: newStyle.legendgroup,
        legendgrouptitle: {
            text: newStyle.legendgrouptitle.text,
            font: newStyle.legendgrouptitle.font
        },
        legendrank: newStyle.legendrank,

        label: newStyle.label,

        xref: xPaper ? 'paper' : xaxis._id,
        yref: yPaper ? 'paper' : yaxis._id,

        layer: newStyle.layer,
        opacity: newStyle.opacity,
        line: {
            color: newStyle.line.color,
            width: newStyle.line.width,
            dash: newStyle.line.dash
        }
    };

    if(!isOpenMode) {
        newShape.fillcolor = newStyle.fillcolor;
        newShape.fillrule = newStyle.fillrule;
    }

    var cell;
    // line, rect and circle can be in one cell
    // only define cell if there is single cell
    if(polygons.length === 1) cell = polygons[0];

    if(
        cell &&
        cell.length === 5 && // ensure we only have 4 corners for a rect
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
    return newShape;
}

module.exports = {
    newShapes: newShapes,
    createShapeObj: createShapeObj,
};

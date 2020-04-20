/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var parseSvgPath = require('parse-svg-path');

var dragElement = require('../../components/dragelement');
var dragHelpers = require('../../components/dragelement/helpers');
var drawMode = dragHelpers.drawMode;
var openMode = dragHelpers.openMode;

var Registry = require('../../registry');
var Lib = require('../../lib');
var setCursor = require('../../lib/setcursor');

var constants = require('./constants');
var MINSELECT = constants.MINSELECT;
var CIRCLE_SIDES = 32; // should be divisible by 8
var i000 = 0;
var i045 = CIRCLE_SIDES / 8;
var i090 = CIRCLE_SIDES / 4;
var i180 = CIRCLE_SIDES / 2;
var i270 = CIRCLE_SIDES / 4 * 3;
var cos45 = Math.cos(Math.PI / 4);
var sin45 = Math.sin(Math.PI / 4);
var SQRT2 = Math.sqrt(2);

var helpers = require('./helpers');
var p2r = helpers.p2r;

var handleOutline = require('./handle_outline');
var clearOutlineControllers = handleOutline.clearOutlineControllers;
var clearSelect = handleOutline.clearSelect;

function recordPositions(polygonsOut, polygonsIn) { // copy & clean (i.e. skip duplicates)
    for(var i = 0; i < polygonsIn.length; i++) {
        polygonsOut[i] = [];
        var len = polygonsIn[i].length;
        for(var newJ = 0, j = 0; j < len; j++) {
            // skip close points
            if(j > 0 && dist(polygonsIn[i][j], polygonsIn[i][(j + 1) % len]) < 1) continue;

            polygonsOut[i][newJ] = [];
            for(var k = 0; k < polygonsIn[i][newJ].length; k++) {
                polygonsOut[i][newJ][k] = polygonsIn[i][j][k];
            }
            newJ++;
        }
    }
    return polygonsOut;
}

function displayOutlines(polygonsIn, outlines, dragOptions, nCalls) {
    var polygons = recordPositions([], polygonsIn);

    if(!nCalls) nCalls = 0;

    var gd = dragOptions.gd;

    function redraw() {
        // recursive call
        displayOutlines(polygons, outlines, dragOptions, nCalls++);

        dragOptions.isActiveShape = false; // i.e. to disable controllers
        var shapes = addNewShapes(outlines, dragOptions);
        if(shapes) {
            Registry.call('_guiRelayout', gd, {
                shapes: shapes // update active shape
            });
        }
    }


    // remove previous controllers - only if there is an active shape
    if(gd._fullLayout._activeShapeIndex >= 0) clearOutlineControllers(gd);

    var isActiveShape = dragOptions.isActiveShape;
    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;

    var dragmode = dragOptions.dragmode;
    var isDrawMode = drawMode(dragmode);
    var isOpenMode = openMode(dragmode);

    if(isDrawMode) gd._fullLayout._drawing = true;

    // make outline
    outlines.attr('d', writePaths(polygons, isOpenMode));

    // add controllers
    var rVertexController = MINSELECT * 1.5; // bigger vertex buttons
    var vertexDragOptions;
    var shapeDragOptions;
    var indexI; // cell index
    var indexJ; // vertex or cell-controller index
    var copyPolygons;

    copyPolygons = recordPositions([], polygons);

    if(isActiveShape) {
        var g = zoomLayer.append('g').attr('class', 'outline-controllers');
        addVertexControllers(g);
        addShapeControllers();
    }

    function startDragVertex(evt) {
        indexI = +evt.srcElement.getAttribute('data-i');
        indexJ = +evt.srcElement.getAttribute('data-j');

        vertexDragOptions[indexI][indexJ].moveFn = moveVertexController;
    }

    function moveVertexController(dx, dy) {
        if(!polygons.length) return;

        var x0 = copyPolygons[indexI][indexJ][1];
        var y0 = copyPolygons[indexI][indexJ][2];

        var cell = polygons[indexI];
        var len = cell.length;
        if(pointsShapeRectangle(cell)) {
            for(var q = 0; q < len; q++) {
                if(q === indexJ) continue;

                // move other corners of rectangle
                var pos = cell[q];

                if(pos[1] === cell[indexJ][1]) {
                    pos[1] = x0 + dx;
                }

                if(pos[2] === cell[indexJ][2]) {
                    pos[2] = y0 + dy;
                }
            }
            // move the corner
            cell[indexJ][1] = x0 + dx;
            cell[indexJ][2] = y0 + dy;

            if(!pointsShapeRectangle(cell)) {
                // reject result to rectangles with ensure areas
                for(var j = 0; j < len; j++) {
                    for(var k = 0; k < 3; k++) {
                        cell[j][k] = copyPolygons[indexI][j][k];
                    }
                }
            }
        } else { // other polylines
            cell[indexJ][1] = x0 + dx;
            cell[indexJ][2] = y0 + dy;
        }

        redraw();
    }

    function endDragVertexController(evt) {
        Lib.noop(evt);
    }

    function removeVertex() {
        if(!polygons.length) return;

        var newPolygon = [];
        for(var j = 0; j < polygons[indexI].length; j++) {
            if(j !== indexJ) {
                newPolygon.push(
                    polygons[indexI][j]
                );
            }
        }
        polygons[indexI] = newPolygon;
    }

    function clickVertexController(numClicks) {
        if(numClicks === 2) {
            var cell = polygons[indexI];
            if(cell.length > 4) {
                removeVertex();
            }

            redraw();
        }
    }

    function addVertexControllers(g) {
        vertexDragOptions = [];

        for(var i = 0; i < polygons.length; i++) {
            var cell = polygons[i];

            var onRect = pointsShapeRectangle(cell);
            var onEllipse = !onRect && pointsShapeEllipse(cell);

            var minX;
            var minY;
            var maxX;
            var maxY;
            if(onRect) {
                // compute bounding box
                minX = calcMin(cell, 1);
                minY = calcMin(cell, 2);
                maxX = calcMax(cell, 1);
                maxY = calcMax(cell, 2);
            }

            vertexDragOptions[i] = [];
            for(var j = 0; j < cell.length; j++) {
                if(onEllipse &&
                    j !== 0 &&
                    j !== CIRCLE_SIDES * 0.25 &&
                    j !== CIRCLE_SIDES * 0.5 &&
                    j !== CIRCLE_SIDES * 0.75
                ) {
                    continue;
                }

                var x = cell[j][1];
                var y = cell[j][2];

                var rIcon = 3;
                var button = g.append(onRect ? 'rect' : 'circle')
                .style({
                    'mix-blend-mode': 'luminosity',
                    fill: 'black',
                    stroke: 'white',
                    'stroke-width': 1
                });

                if(onRect) {
                    button
                        .attr('x', x - rIcon)
                        .attr('y', y - rIcon)
                        .attr('width', 2 * rIcon)
                        .attr('height', 2 * rIcon);
                } else {
                    button
                        .attr('cx', x)
                        .attr('cy', y)
                        .attr('r', rIcon);
                }

                var vertex = g.append(onRect ? 'rect' : 'circle')
                .attr('data-i', i)
                .attr('data-j', j)
                .style({
                    opacity: 0
                });

                if(onRect) {
                    var ratioX = (x - minX) / (maxX - minX);
                    var ratioY = (y - minY) / (maxY - minY);
                    if(isFinite(ratioX) && isFinite(ratioY)) {
                        setCursor(
                            vertex,
                            dragElement.getCursor(ratioX, 1 - ratioY)
                        );
                    }

                    vertex
                        .attr('x', x - rVertexController)
                        .attr('y', y - rVertexController)
                        .attr('width', 2 * rVertexController)
                        .attr('height', 2 * rVertexController);
                } else {
                    vertex
                        .classed('cursor-grab', true)
                        .attr('cx', x)
                        .attr('cy', y)
                        .attr('r', rVertexController);
                }

                vertexDragOptions[i][j] = {
                    element: vertex.node(),
                    gd: gd,
                    prepFn: startDragVertex,
                    doneFn: endDragVertexController,
                    clickFn: clickVertexController
                };

                dragElement.init(vertexDragOptions[i][j]);
            }
        }
    }

    function moveShape(dx, dy) {
        if(!polygons.length) return;

        for(var i = 0; i < polygons.length; i++) {
            for(var j = 0; j < polygons[i].length; j++) {
                var x0 = copyPolygons[i][j][1];
                var y0 = copyPolygons[i][j][2];

                polygons[i][j][1] = x0 + dx;
                polygons[i][j][2] = y0 + dy;
            }
        }
    }

    function moveShapeController(dx, dy) {
        moveShape(dx, dy);

        redraw();
    }

    function startDragShapeController(evt) {
        indexI = +evt.srcElement.getAttribute('data-i');
        if(!indexI) indexI = 0; // ensure non-existing move button get zero index

        shapeDragOptions[indexI].moveFn = moveShapeController;
    }

    function endDragShapeController(evt) {
        Lib.noop(evt);
    }

    function addShapeControllers() {
        shapeDragOptions = [];

        if(!polygons.length) return;

        var i = 0;
        shapeDragOptions[i] = {
            element: outlines[0][0],
            gd: gd,
            prepFn: startDragShapeController,
            doneFn: endDragShapeController
        };

        dragElement.init(shapeDragOptions[i]);
    }
}

function writePaths(polygons, isOpenMode) {
    var nI = polygons.length;
    if(!nI) return 'M0,0Z';

    var str = '';
    for(var i = 0; i < nI; i++) {
        var nJ = polygons[i].length;
        for(var j = 0; j < nJ; j++) {
            var nK = polygons[i][j].length;
            for(var k = 0; k < nK; k++) {
                str += polygons[i][j][k];
                if(k > 0 && k < nK - 1) {
                    str += ',';
                }
            }
        }
        if(!isOpenMode) str += 'Z';
    }
    return str;
}

function readPaths(str, plotinfo, size, isActiveShape) {
    var cmd = parseSvgPath(str);

    var polys = [];
    var n = -1;
    var newPoly = function() {
        n++;
        polys[n] = [];
    };

    var x = 0;
    var y = 0;
    var initX;
    var initY;
    var recStart = function() {
        initX = x;
        initY = y;
    };

    recStart();
    for(var i = 0; i < cmd.length; i++) {
        var newPos = [];

        var c = cmd[i][0];
        var w = c;
        switch(c) {
            case 'M':
                newPoly();
                x = +cmd[i][1];
                y = +cmd[i][2];
                newPos.push([x, y]);

                recStart();
                break;

            case 'L':
                x = +cmd[i][1];
                y = +cmd[i][2];
                newPos.push([x, y]);

                break;

            case 'H':
                w = 'L'; // convert to line
                x = +cmd[i][1];
                newPos.push([x, y]);

                break;

            case 'V':
                w = 'L'; // convert to line
                y = +cmd[i][1];
                newPos.push([x, y]);

                break;

            case 'A':
                w = 'L'; // convert to line (for now)
                var rx = +cmd[i][1];
                var ry = +cmd[i][2];
                if(!+cmd[i][4]) {
                    rx = -rx;
                    ry = -ry;
                }

                var cenX = x - rx;
                var cenY = y;
                for(var k = 1; k <= CIRCLE_SIDES / 2; k++) {
                    var t = 2 * Math.PI * k / CIRCLE_SIDES;
                    newPos.push([
                        cenX + rx * Math.cos(t),
                        cenY + ry * Math.sin(t)
                    ]);
                }

                break;
        }

        if(c === 'Z') {
            x = initX;
            y = initY;
        } else {
            for(var j = 0; j < newPos.length; j++) {
                x = newPos[j][0];
                y = newPos[j][1];

                if(!plotinfo || !(plotinfo.xaxis && plotinfo.yaxis)) {
                    polys[n].push([
                        w,
                        x,
                        y
                    ]);
                } else if(plotinfo.domain) {
                    polys[n].push([
                        w,
                        plotinfo.domain.x[0] + x / size.w,
                        plotinfo.domain.y[1] - y / size.h
                    ]);
                } else if(isActiveShape === false) {
                    polys[n].push([
                        w,
                        p2r(plotinfo.xaxis, x - plotinfo.xaxis._offset),
                        p2r(plotinfo.yaxis, y - plotinfo.yaxis._offset)
                    ]);
                } else {
                    polys[n].push([
                        w,
                        p2r(plotinfo.xaxis, x),
                        p2r(plotinfo.yaxis, y)
                    ]);
                }
            }
        }
    }

    return polys;
}

function fixDatesOnPaths(path, xaxis, yaxis) {
    var xIsDate = xaxis.type === 'date';
    var yIsDate = yaxis.type === 'date';
    if(!xIsDate && !yIsDate) return path;

    for(var i = 0; i < path.length; i++) {
        if(xIsDate) path[i][1] = path[i][1].replace(' ', '_');
        if(yIsDate) path[i][2] = path[i][2].replace(' ', '_');
    }

    return path;
}

function almostEq(a, b) {
    return Math.abs(a - b) <= 1e-6;
}

function dist(a, b) {
    var dx = b[1] - a[1];
    var dy = b[2] - a[2];
    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}

function calcMin(cell, dim) {
    var v = Infinity;
    for(var i = 0; i < cell.length; i++) {
        v = Math.min(v, cell[i][dim]);
    }
    return v;
}

function calcMax(cell, dim) {
    var v = -Infinity;
    for(var i = 0; i < cell.length; i++) {
        v = Math.max(v, cell[i][dim]);
    }
    return v;
}

function pointsShapeRectangle(cell, len) {
    if(!len) len = cell.length;
    if(len !== 4) return false;
    for(var j = 1; j < 3; j++) {
        var e01 = cell[0][j] - cell[1][j];
        var e32 = cell[3][j] - cell[2][j];

        if(!almostEq(e01, e32)) return false;

        var e03 = cell[0][j] - cell[3][j];
        var e12 = cell[1][j] - cell[2][j];
        if(!almostEq(e03, e12)) return false;
    }

    // N.B. rotated rectangles are not valid rects since rotation is not supported in shapes for now.
    if(
        !almostEq(cell[0][1], cell[1][1]) &&
        !almostEq(cell[0][1], cell[3][1])
    ) return false;

    // reject cases with zero area
    return !!(
        dist(cell[0], cell[1]) *
        dist(cell[0], cell[3])
    );
}

function pointsShapeEllipse(cell, len) {
    if(!len) len = cell.length;
    if(len !== CIRCLE_SIDES) return false;
    // opposite diagonals should be the same
    for(var i = 0; i < len; i++) {
        var k = (len * 2 - i) % len;

        var k2 = (len / 2 + k) % len;
        var i2 = (len / 2 + i) % len;

        if(!almostEq(
            dist(cell[i], cell[i2]),
            dist(cell[k], cell[k2])
        )) return false;
    }
    return true;
}

function handleEllipse(isEllipse, start, end) {
    if(!isEllipse) return [start, end]; // i.e. case of line

    var pos = ellipseOver({
        x0: start[0],
        y0: start[1],
        x1: end[0],
        y1: end[1]
    });

    var cx = (pos.x1 + pos.x0) / 2;
    var cy = (pos.y1 + pos.y0) / 2;
    var rx = (pos.x1 - pos.x0) / 2;
    var ry = (pos.y1 - pos.y0) / 2;

    // make a circle when one dimension is zero
    if(!rx) rx = ry = ry / SQRT2;
    if(!ry) ry = rx = rx / SQRT2;

    var cell = [];
    for(var i = 0; i < CIRCLE_SIDES; i++) {
        var t = i * 2 * Math.PI / CIRCLE_SIDES;
        cell.push([
            cx + rx * Math.cos(t),
            cy + ry * Math.sin(t),
        ]);
    }
    return cell;
}

function ellipseOver(pos) {
    var x0 = pos.x0;
    var y0 = pos.y0;
    var x1 = pos.x1;
    var y1 = pos.y1;

    var dx = x1 - x0;
    var dy = y1 - y0;

    x0 -= dx;
    y0 -= dy;

    var cx = (x0 + x1) / 2;
    var cy = (y0 + y1) / 2;

    var scale = SQRT2;
    dx *= scale;
    dy *= scale;

    return {
        x0: cx - dx,
        y0: cy - dy,
        x1: cx + dx,
        y1: cy + dy
    };
}

function addNewShapes(outlines, dragOptions) {
    if(!outlines.length) return;
    var e = outlines[0][0]; // pick first
    if(!e) return;
    var d = e.getAttribute('d');

    var gd = dragOptions.gd;
    var drwStyle = gd._fullLayout.newshape;

    var plotinfo = dragOptions.plotinfo;
    var xaxis = plotinfo.xaxis;
    var yaxis = plotinfo.yaxis;
    var onPaper = plotinfo.domain || !plotinfo || !(plotinfo.xaxis && plotinfo.yaxis);

    var isActiveShape = dragOptions.isActiveShape;
    var dragmode = dragOptions.dragmode;
    if(isActiveShape !== undefined) {
        var id = gd._fullLayout._activeShapeIndex;
        if(id < gd._fullLayout.shapes.length) {
            switch(gd._fullLayout.shapes[id].type) {
                case 'rect':
                    dragmode = 'rectdraw';
                    break;
                case 'circle':
                    dragmode = 'ellipsedraw';
                    break;
                case 'line':
                    dragmode = 'linedraw';
                    break;
                case 'path':
                    var path = gd._fullLayout.shapes[id].path || '';
                    if(path[path.length - 1] === 'Z') {
                        dragmode = 'closedfreedraw';
                    } else {
                        dragmode = 'openfreedraw';
                    }
                    break;
            }
        }
    }
    var isOpenMode = openMode(dragmode);

    var polygons = readPaths(d, plotinfo, gd._fullLayout._size, isActiveShape);
    if(isOpenMode) {
        var last = polygons[0].length - 1;
        if( // ensure first and last positions are not the same on an open path
            polygons[0][0][1] === polygons[0][last][1] &&
            polygons[0][0][2] === polygons[0][last][2]
        ) {
            polygons[0].pop();
        }
    }

    var newShapes = [];
    for(var i = 0; i < polygons.length; i++) {
        var cell = polygons[i];
        var len = cell.length;
        if(
            cell[0][1] === cell[len - 1][1] &&
            cell[0][2] === cell[len - 1][2]
        ) {
            len -= 1;
        }
        if(len < 2) continue;

        var shape = {
            editable: true,

            xref: onPaper ? 'paper' : xaxis._id,
            yref: onPaper ? 'paper' : yaxis._id,

            layer: drwStyle.layer,
            opacity: drwStyle.opacity,
            line: {
                color: drwStyle.line.color,
                width: drwStyle.line.width,
                dash: drwStyle.line.dash
            }
        };

        if(!isOpenMode) {
            shape.fillcolor = drwStyle.fillcolor;
            shape.fillrule = drwStyle.fillrule;
        }

        if(
            dragmode === 'rectdraw' &&
            pointsShapeRectangle(cell, len) // should pass len here which is equal to cell.length - 1 i.e. because of the closing point
        ) {
            shape.type = 'rect';
            shape.x0 = cell[0][1];
            shape.y0 = cell[0][2];
            shape.x1 = cell[2][1];
            shape.y1 = cell[2][2];
        } else if(
            dragmode === 'linedraw'
        ) {
            shape.type = 'line';
            shape.x0 = cell[0][1];
            shape.y0 = cell[0][2];
            shape.x1 = cell[1][1];
            shape.y1 = cell[1][2];
        } else if(
            dragmode === 'ellipsedraw' &&
            (isActiveShape === false || pointsShapeEllipse(cell, len)) // should pass len here which is equal to cell.length - 1 i.e. because of the closing point
        ) {
            shape.type = 'circle'; // an ellipse!
            var pos = {};
            if(isActiveShape === false) {
                var x0 = (cell[i090][1] + cell[i270][1]) / 2;
                var y0 = (cell[i000][2] + cell[i180][2]) / 2;
                var rx = (cell[i270][1] - cell[i090][1] + cell[i180][1] - cell[i000][1]) / 2;
                var ry = (cell[i270][2] - cell[i090][2] + cell[i180][2] - cell[i000][2]) / 2;
                pos = ellipseOver({
                    x0: x0,
                    y0: y0,
                    x1: x0 + rx * cos45,
                    y1: y0 + ry * sin45
                });
            } else {
                pos = ellipseOver({
                    x0: (cell[i000][1] + cell[i180][1]) / 2,
                    y0: (cell[i000][2] + cell[i180][2]) / 2,
                    x1: cell[i045][1],
                    y1: cell[i045][2]
                });
            }

            shape.x0 = pos.x0;
            shape.y0 = pos.y0;
            shape.x1 = pos.x1;
            shape.y1 = pos.y1;
        } else {
            shape.type = 'path';
            if(xaxis && yaxis) {
                fixDatesOnPaths(cell, xaxis, yaxis);
            }

            shape.path = writePaths([cell], isOpenMode);
        }

        newShapes.push(shape);
    }

    clearSelect(gd);

    var shapes;
    if(newShapes.length) {
        var updatedActiveShape = false;
        shapes = [];
        for(var q = 0; q < gd._fullLayout.shapes.length; q++) {
            var beforeEdit = gd._fullLayout.shapes[q];
            shapes[q] = beforeEdit._input;

            if(
                isActiveShape !== undefined &&
                q === gd._fullLayout._activeShapeIndex
            ) {
                var afterEdit = newShapes[0]; // pick first

                switch(beforeEdit.type) {
                    case 'line':
                    case 'rect':
                    case 'circle':
                        updatedActiveShape = hasChanged(beforeEdit, afterEdit, ['x0', 'x1', 'y0', 'y1']);
                        if(updatedActiveShape) { // update active shape
                            shapes[q].x0 = afterEdit.x0;
                            shapes[q].x1 = afterEdit.x1;
                            shapes[q].y0 = afterEdit.y0;
                            shapes[q].y1 = afterEdit.y1;
                        }
                        break;

                    case 'path':
                        updatedActiveShape = hasChanged(beforeEdit, afterEdit, ['path']);
                        if(updatedActiveShape) { // update active shape
                            shapes[q].path = afterEdit.path;
                        }
                        break;
                }
            }
        }

        if(isActiveShape === undefined) {
            shapes = shapes.concat(newShapes); // add new shapes
        }
    }

    return shapes;
}

function hasChanged(beforeEdit, afterEdit, keys) {
    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if(beforeEdit[k] !== afterEdit[k]) {
            return true;
        }
    }
    return false;
}

module.exports = {
    displayOutlines: displayOutlines,
    handleEllipse: handleEllipse,
    addNewShapes: addNewShapes,
    readPaths: readPaths
};

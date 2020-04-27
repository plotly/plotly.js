/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var dragElement = require('../../dragelement');
var dragHelpers = require('../../dragelement/helpers');
var drawMode = dragHelpers.drawMode;

var Registry = require('../../../registry');
var setCursor = require('../../../lib/setcursor');

var MINSELECT = require('../../../plots/cartesian/constants').MINSELECT;
var constants = require('./constants');
var i000 = constants.i000;
var i090 = constants.i090;
var i180 = constants.i180;
var i270 = constants.i270;

var handleOutline = require('../../../plots/cartesian/handle_outline');
var clearOutlineControllers = handleOutline.clearOutlineControllers;

var helpers = require('./helpers');
var pointsShapeRectangle = helpers.pointsShapeRectangle;
var pointsShapeEllipse = helpers.pointsShapeEllipse;
var writePaths = helpers.writePaths;
var newShapes = require('./newshapes');

module.exports = function displayOutlines(polygons, outlines, dragOptions, nCalls) {
    if(!nCalls) nCalls = 0;

    var gd = dragOptions.gd;

    function redraw() {
        // recursive call
        displayOutlines(polygons, outlines, dragOptions, nCalls++);

        if(pointsShapeEllipse(polygons[0])) {
            update({redrawing: true});
        }
    }

    function update(opts) {
        dragOptions.isActiveShape = false; // i.e. to disable controllers

        var updateObject = newShapes(outlines, dragOptions);
        if(Object.keys(updateObject).length) {
            Registry.call(opts && opts.redrawing ? 'relayout' : '_guiRelayout', gd, updateObject);
        }
    }


    // remove previous controllers - only if there is an active shape
    if(gd._fullLayout._activeShapeIndex >= 0) clearOutlineControllers(gd);

    var isActiveShape = dragOptions.isActiveShape;
    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;

    var dragmode = dragOptions.dragmode;
    var isDrawMode = drawMode(dragmode);

    if(isDrawMode) gd._fullLayout._drawing = true;

    // make outline
    outlines.attr('d', writePaths(polygons));

    // add controllers
    var rVertexController = MINSELECT * 1.5; // bigger vertex buttons
    var vertexDragOptions;
    var shapeDragOptions;
    var indexI; // cell index
    var indexJ; // vertex or cell-controller index
    var copyPolygons;

    if(isActiveShape) {
        if(!nCalls) copyPolygons = recordPositions([], polygons);

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
                    for(var k = 0; k < cell[j].length; k++) {
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

    function endDragVertexController() {
        update();
    }

    function removeVertex() {
        if(!polygons.length) return;
        if(!polygons[indexI]) return;
        if(!polygons[indexI].length) return;

        var newPolygon = [];
        for(var j = 0; j < polygons[indexI].length; j++) {
            if(j !== indexJ) {
                newPolygon.push(
                    polygons[indexI][j]
                );
            }
        }

        if(newPolygon.length > 1 && !(
            newPolygon.length === 2 && newPolygon[1][0] === 'Z')
        ) {
            if(indexJ === 0) {
                newPolygon[0][0] = 'M';
            }

            polygons[indexI] = newPolygon;

            redraw();
            update();
        }
    }

    function clickVertexController(numClicks, evt) {
        if(numClicks === 2) {
            indexI = +evt.srcElement.getAttribute('data-i');
            indexJ = +evt.srcElement.getAttribute('data-j');

            var cell = polygons[indexI];
            if(
                !pointsShapeRectangle(cell) &&
                !pointsShapeEllipse(cell)
            ) {
                removeVertex();
            }
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
                if(cell[j][0] === 'Z') continue;

                if(onEllipse &&
                    j !== i000 &&
                    j !== i090 &&
                    j !== i180 &&
                    j !== i270
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
                for(var k = 0; k + 2 < polygons[i][j].length; k += 2) {
                    polygons[i][j][k + 1] = copyPolygons[i][j][k + 1] + dx;
                    polygons[i][j][k + 2] = copyPolygons[i][j][k + 2] + dy;
                }
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

    function endDragShapeController() {
        update();
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
};

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

function recordPositions(polygonsOut, polygonsIn) {
    for(var i = 0; i < polygonsIn.length; i++) {
        var cell = polygonsIn[i];
        polygonsOut[i] = [];
        for(var j = 0; j < cell.length; j++) {
            polygonsOut[i][j] = [];
            for(var k = 0; k < cell[j].length; k++) {
                polygonsOut[i][j][k] = cell[j][k];
            }
        }
    }
    return polygonsOut;
}

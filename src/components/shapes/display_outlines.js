'use strict';

var Lib = require('../../lib');
var strTranslate = Lib.strTranslate;

var dragElement = require('../dragelement');
var dragHelpers = require('../dragelement/helpers');
var drawMode = dragHelpers.drawMode;
var selectMode = dragHelpers.selectMode;

var Registry = require('../../registry');
var Color = require('../color');

var constants = require('./draw_newshape/constants');
var i000 = constants.i000;
var i090 = constants.i090;
var i180 = constants.i180;
var i270 = constants.i270;

var handleOutline = require('./handle_outline');
var clearOutlineControllers = handleOutline.clearOutlineControllers;

var helpers = require('./draw_newshape/helpers');
var pointsOnRectangle = helpers.pointsOnRectangle;
var pointsOnEllipse = helpers.pointsOnEllipse;
var writePaths = helpers.writePaths;
var newShapes = require('./draw_newshape/newshapes').newShapes;
var createShapeObj = require('./draw_newshape/newshapes').createShapeObj;
var newSelections = require('../selections/draw_newselection/newselections');
var drawLabel = require('./display_labels');


module.exports = function displayOutlines(polygons, outlines, dragOptions, nCalls) {
    if(!nCalls) nCalls = 0;

    var gd = dragOptions.gd;

    function redraw() {
        // recursive call
        displayOutlines(polygons, outlines, dragOptions, nCalls++);

        if(pointsOnEllipse(polygons[0]) || dragOptions.hasText) {
            update({redrawing: true});
        }
    }

    function update(opts) {
        var updateObject = {};

        if(dragOptions.isActiveShape !== undefined) {
            dragOptions.isActiveShape = false; // i.e. to disable shape controllers
            updateObject = newShapes(outlines, dragOptions);
        }

        if(dragOptions.isActiveSelection !== undefined) {
            dragOptions.isActiveSelection = false; // i.e. to disable selection controllers
            updateObject = newSelections(outlines, dragOptions);

            gd._fullLayout._reselect = true;
        }

        if(Object.keys(updateObject).length) {
            Registry.call((opts || {}).redrawing ? 'relayout' : '_guiRelayout', gd, updateObject);
        }
    }

    var fullLayout = gd._fullLayout;
    var zoomLayer = fullLayout._zoomlayer;

    var dragmode = dragOptions.dragmode;
    var isDrawMode = drawMode(dragmode);
    var isSelectMode = selectMode(dragmode);

    if(isDrawMode || isSelectMode) {
        gd._fullLayout._outlining = true;
    }

    clearOutlineControllers(gd);

    // make outline
    outlines.attr('d', writePaths(polygons));

    // add controllers
    var vertexDragOptions;
    var groupDragOptions;
    var indexI; // cell index
    var indexJ; // vertex or cell-controller index
    var copyPolygons;

    if(!nCalls && (
        dragOptions.isActiveShape ||
        dragOptions.isActiveSelection
    )) {
        copyPolygons = recordPositions([], polygons);

        var g = zoomLayer.append('g').attr('class', 'outline-controllers');
        addVertexControllers(g);
        addGroupControllers();
    }

    // draw label
    if(isDrawMode && dragOptions.hasText) {
        var shapeGroup = zoomLayer.select('.label-temp');
        var shapeOptions = createShapeObj(outlines, dragOptions, dragOptions.dragmode);
        drawLabel(gd, 'label-temp', shapeOptions, shapeGroup);
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
        if(pointsOnRectangle(cell)) {
            var _dx = dx;
            var _dy = dy;
            if(dragOptions.isActiveSelection) {
                // handle an edge contoller for rect selections
                var nextPoint = getNextPoint(cell, indexJ);
                if(nextPoint[1] === cell[indexJ][1]) { // a vertical edge
                    _dy = 0;
                } else { // a horizontal edge
                    _dx = 0;
                }
            }

            for(var q = 0; q < len; q++) {
                if(q === indexJ) continue;

                // move other corners of rectangle
                var pos = cell[q];

                if(pos[1] === cell[indexJ][1]) {
                    pos[1] = x0 + _dx;
                }

                if(pos[2] === cell[indexJ][2]) {
                    pos[2] = y0 + _dy;
                }
            }
            // move the corner
            cell[indexJ][1] = x0 + _dx;
            cell[indexJ][2] = y0 + _dy;

            if(!pointsOnRectangle(cell)) {
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
                !pointsOnRectangle(cell) &&
                !pointsOnEllipse(cell)
            ) {
                removeVertex();
            }
        }
    }

    function addVertexControllers(g) {
        vertexDragOptions = [];

        for(var i = 0; i < polygons.length; i++) {
            var cell = polygons[i];

            var onRect = pointsOnRectangle(cell);
            var onEllipse = !onRect && pointsOnEllipse(cell);

            vertexDragOptions[i] = [];
            var len = cell.length;
            for(var j = 0; j < len; j++) {
                if(cell[j][0] === 'Z') continue;

                if(onEllipse &&
                    j !== i000 &&
                    j !== i090 &&
                    j !== i180 &&
                    j !== i270
                ) {
                    continue;
                }

                var rectSelection = onRect && dragOptions.isActiveSelection;
                var nextPoint;
                if(rectSelection) nextPoint = getNextPoint(cell, j);

                var x = cell[j][1];
                var y = cell[j][2];

                var vertex = g.append(rectSelection ? 'rect' : 'circle')
                    .attr('data-i', i)
                    .attr('data-j', j)
                    .style({
                        fill: Color.background,
                        stroke: Color.defaultLine,
                        'stroke-width': 1,
                        'shape-rendering': 'crispEdges',
                    });

                if(rectSelection) {
                    // convert a vertex controller to an edge controller for rect selections
                    var dx = nextPoint[1] - x;
                    var dy = nextPoint[2] - y;

                    var width = dy ? 5 : Math.max(Math.min(25, Math.abs(dx) - 5), 5);
                    var height = dx ? 5 : Math.max(Math.min(25, Math.abs(dy) - 5), 5);

                    vertex.classed(dy ? 'cursor-ew-resize' : 'cursor-ns-resize', true)
                        .attr('width', width)
                        .attr('height', height)
                        .attr('x', x - width / 2)
                        .attr('y', y - height / 2)
                        .attr('transform', strTranslate(dx / 2, dy / 2));
                } else {
                    vertex.classed('cursor-grab', true)
                        .attr('r', 5)
                        .attr('cx', x)
                        .attr('cy', y);
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

    function moveGroup(dx, dy) {
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

    function moveGroupController(dx, dy) {
        moveGroup(dx, dy);

        redraw();
    }

    function startDragGroupController(evt) {
        indexI = +evt.srcElement.getAttribute('data-i');
        if(!indexI) indexI = 0; // ensure non-existing move button get zero index

        groupDragOptions[indexI].moveFn = moveGroupController;
    }

    function endDragGroupController() {
        update();
    }

    function clickGroupController(numClicks) {
        if(numClicks === 2) {
            eraseActiveSelection(gd);
        }
    }

    function addGroupControllers() {
        groupDragOptions = [];

        if(!polygons.length) return;

        var i = 0;
        groupDragOptions[i] = {
            element: outlines[0][0],
            gd: gd,
            prepFn: startDragGroupController,
            doneFn: endDragGroupController,
            clickFn: clickGroupController
        };

        dragElement.init(groupDragOptions[i]);
    }
};

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

function getNextPoint(cell, j) {
    var x = cell[j][1];
    var y = cell[j][2];
    var len = cell.length;
    var nextJ, nextX, nextY;
    nextJ = (j + 1) % len;
    nextX = cell[nextJ][1];
    nextY = cell[nextJ][2];

    // avoid potential double points (closing points)
    if(nextX === x && nextY === y) {
        nextJ = (j + 2) % len;
        nextX = cell[nextJ][1];
        nextY = cell[nextJ][2];
    }

    return [nextJ, nextX, nextY];
}

function eraseActiveSelection(gd) {
    // Do not allow removal of selections on other dragmodes.
    // This ensures the user could still double click to
    // deselect all trace.selectedpoints,
    // if that's what they wanted.
    // Also double click to zoom back won't result in
    // any surprising selection removal.
    if(!selectMode(gd._fullLayout.dragmode)) return;

    clearOutlineControllers(gd);

    var id = gd._fullLayout._activeSelectionIndex;
    var selections = (gd.layout || {}).selections || [];
    if(id < selections.length) {
        var list = [];
        for(var q = 0; q < selections.length; q++) {
            if(q !== id) {
                list.push(selections[q]);
            }
        }

        delete gd._fullLayout._activeSelectionIndex;

        var erasedSelection = gd._fullLayout.selections[id];
        gd._fullLayout._deselect = {
            xref: erasedSelection.xref,
            yref: erasedSelection.yref
        };

        Registry.call('_guiRelayout', gd, {
            selections: list
        });
    }
}

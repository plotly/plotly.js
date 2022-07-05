'use strict';

var dragElement = require('../../dragelement');
var dragHelpers = require('../../dragelement/helpers');
var drawMode = dragHelpers.drawMode;
var selectMode = dragHelpers.selectMode;

var Registry = require('../../../registry');
var Color = require('../../color');

var constants = require('./constants');
var i000 = constants.i000;
var i090 = constants.i090;
var i180 = constants.i180;
var i270 = constants.i270;

var handleOutline = require('../../selections/handle_outline');
var clearOutlineControllers = handleOutline.clearOutlineControllers;

var helpers = require('./helpers');
var pointsOnRectangle = helpers.pointsOnRectangle;
var pointsOnEllipse = helpers.pointsOnEllipse;
var writePaths = helpers.writePaths;
var newShapes = require('./newshapes');
var newSelections = require('../../selections/draw_newselection/newselections');

module.exports = function displayOutlines(polygons, outlines, dragOptions, nCalls) {
    if(!nCalls) nCalls = 0;

    var gd = dragOptions.gd;

    function redraw() {
        // recursive call
        displayOutlines(polygons, outlines, dragOptions, nCalls++);

        if(pointsOnEllipse(polygons[0])) {
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
    } else if(
        gd._fullLayout._activeShapeIndex >= 0 ||
        gd._fullLayout._activeSelectionIndex >= 0
    ) {
        clearOutlineControllers(gd);
    }

    // make outline
    outlines.attr('d', writePaths(polygons));

    // add controllers
    var vertexDragOptions;
    var regionDragOptions;
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
        addRegionControllers();
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

                var vertex = g.append('circle')
                    .classed('cursor-grab', true)
                    .attr('data-i', i)
                    .attr('data-j', j)
                    .attr('cx', x)
                    .attr('cy', y)
                    .attr('r', 4)
                    .style({
                        fill: Color.background,
                        stroke: Color.defaultLine,
                        'stroke-width': 1,
                        'shape-rendering': 'crispEdges',
                    });

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

    function moveRegion(dx, dy) {
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

    function moveRegionController(dx, dy) {
        moveRegion(dx, dy);

        redraw();
    }

    function startDragRegionController(evt) {
        indexI = +evt.srcElement.getAttribute('data-i');
        if(!indexI) indexI = 0; // ensure non-existing move button get zero index

        regionDragOptions[indexI].moveFn = moveRegionController;
    }

    function endDragRegionController() {
        update();
    }

    function addRegionControllers() {
        regionDragOptions = [];

        if(!polygons.length) return;

        var i = 0;
        regionDragOptions[i] = {
            element: outlines[0][0],
            gd: gd,
            prepFn: startDragRegionController,
            doneFn: endDragRegionController
        };

        dragElement.init(regionDragOptions[i]);
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

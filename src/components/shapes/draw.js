/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Color = require('../color');
var Drawing = require('../drawing');

var dragElement = require('../dragelement');
var setCursor = require('../../lib/setcursor');

var constants = require('./constants');
var helpers = require('./helpers');


// Shapes are stored in gd.layout.shapes, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw
// if opt is blank, val can be 'add' or a full options object to add a new
//  annotation at that point in the array, or 'remove' to delete this one

module.exports = {
    draw: draw,
    drawOne: drawOne
};

function draw(gd) {
    var fullLayout = gd._fullLayout;

    // Remove previous shapes before drawing new in shapes in fullLayout.shapes
    fullLayout._shapeUpperLayer.selectAll('path').remove();
    fullLayout._shapeLowerLayer.selectAll('path').remove();
    fullLayout._shapeSubplotLayer.selectAll('path').remove();

    for(var i = 0; i < fullLayout.shapes.length; i++) {
        if(fullLayout.shapes[i].visible) {
            drawOne(gd, i);
        }
    }

    // may need to resurrect this if we put text (LaTeX) in shapes
    // return Plots.previousPromises(gd);
}

function drawOne(gd, index) {
    var i, n;

    // remove the existing shape if there is one.
    // because indices can change, we need to look in all shape layers
    gd._fullLayout._paper
        .selectAll('.shapelayer [data-index="' + index + '"]')
        .remove();

    var optionsIn = gd.layout.shapes[index],
        options = gd._fullLayout.shapes[index];

    // this shape is gone - quit now after deleting it
    // TODO: use d3 idioms instead of deleting and redrawing every time
    if(!optionsIn || options.visible === false) return;

    var clipAxes;
    if(options.layer !== 'below') {
        clipAxes = (options.xref + options.yref).replace(/paper/g, '');
        drawShape(gd._fullLayout._shapeUpperLayer);
    }
    else if(options.xref === 'paper' && options.yref === 'paper') {
        clipAxes = '';
        drawShape(gd._fullLayout._shapeLowerLayer);
    }
    else {
        var plots = gd._fullLayout._plots || {},
            subplots = Object.keys(plots),
            plotinfo;

        for(i = 0, n = subplots.length; i < n; i++) {
            plotinfo = plots[subplots[i]];
            clipAxes = subplots[i];

            if(isShapeInSubplot(gd, options, plotinfo)) {
                drawShape(plotinfo.shapelayer);
            }
        }
    }

    function drawShape(shapeLayer) {
        var attrs = {
                'data-index': index,
                'fill-rule': 'evenodd',
                d: getPathString(gd, options)
            },
            lineColor = options.line.width ?
                options.line.color : 'rgba(0,0,0,0)';

        var path = shapeLayer.append('path')
            .attr(attrs)
            .style('opacity', options.opacity)
            .call(Color.stroke, lineColor)
            .call(Color.fill, options.fillcolor)
            .call(Drawing.dashLine, options.line.dash, options.line.width);

        if(clipAxes) {
            path.call(Drawing.setClipUrl,
                'clip' + gd._fullLayout._uid + clipAxes);
        }

        if(gd._context.editable) setupDragElement(gd, path, options, index);
    }
}

function setupDragElement(gd, shapePath, shapeOptions, index) {
    var MINWIDTH = 10,
        MINHEIGHT = 10;

    var update;
    var x0, y0, x1, y1, astrX0, astrY0, astrX1, astrY1;
    var n0, s0, w0, e0, astrN, astrS, astrW, astrE, optN, optS, optW, optE;
    var pathIn, astrPath;

    var xa, ya, x2p, y2p, p2x, p2y;

    var dragOptions = {
            setCursor: updateDragMode,
            element: shapePath.node(),
            prepFn: startDrag,
            doneFn: endDrag
        },
        dragBBox = dragOptions.element.getBoundingClientRect(),
        dragMode;

    dragElement.init(dragOptions);

    function updateDragMode(evt) {
        // choose 'move' or 'resize'
        // based on initial position of cursor within the drag element
        var w = dragBBox.right - dragBBox.left,
            h = dragBBox.bottom - dragBBox.top,
            x = evt.clientX - dragBBox.left,
            y = evt.clientY - dragBBox.top,
            cursor = (w > MINWIDTH && h > MINHEIGHT && !evt.shiftKey) ?
                dragElement.getCursor(x / w, 1 - y / h) :
                'move';

        setCursor(shapePath, cursor);

        // possible values 'move', 'sw', 'w', 'se', 'e', 'ne', 'n', 'nw' and 'w'
        dragMode = cursor.split('-')[0];
    }

    function startDrag(evt) {
        // setup conversion functions
        xa = Axes.getFromId(gd, shapeOptions.xref);
        ya = Axes.getFromId(gd, shapeOptions.yref);

        x2p = helpers.getDataToPixel(gd, xa);
        y2p = helpers.getDataToPixel(gd, ya, true);
        p2x = helpers.getPixelToData(gd, xa);
        p2y = helpers.getPixelToData(gd, ya, true);

        // setup update strings and initial values
        var astr = 'shapes[' + index + ']';
        if(shapeOptions.type === 'path') {
            pathIn = shapeOptions.path;
            astrPath = astr + '.path';
        }
        else {
            x0 = x2p(shapeOptions.x0);
            y0 = y2p(shapeOptions.y0);
            x1 = x2p(shapeOptions.x1);
            y1 = y2p(shapeOptions.y1);

            astrX0 = astr + '.x0';
            astrY0 = astr + '.y0';
            astrX1 = astr + '.x1';
            astrY1 = astr + '.y1';
        }

        if(x0 < x1) {
            w0 = x0; astrW = astr + '.x0'; optW = 'x0';
            e0 = x1; astrE = astr + '.x1'; optE = 'x1';
        }
        else {
            w0 = x1; astrW = astr + '.x1'; optW = 'x1';
            e0 = x0; astrE = astr + '.x0'; optE = 'x0';
        }
        if(y0 < y1) {
            n0 = y0; astrN = astr + '.y0'; optN = 'y0';
            s0 = y1; astrS = astr + '.y1'; optS = 'y1';
        }
        else {
            n0 = y1; astrN = astr + '.y1'; optN = 'y1';
            s0 = y0; astrS = astr + '.y0'; optS = 'y0';
        }

        update = {};

        // setup dragMode and the corresponding handler
        updateDragMode(evt);
        dragOptions.moveFn = (dragMode === 'move') ? moveShape : resizeShape;
    }

    function endDrag(dragged) {
        setCursor(shapePath);
        if(dragged) {
            Plotly.relayout(gd, update);
        }
    }

    function moveShape(dx, dy) {
        if(shapeOptions.type === 'path') {
            var moveX = function moveX(x) { return p2x(x2p(x) + dx); };
            if(xa && xa.type === 'date') moveX = helpers.encodeDate(moveX);

            var moveY = function moveY(y) { return p2y(y2p(y) + dy); };
            if(ya && ya.type === 'date') moveY = helpers.encodeDate(moveY);

            shapeOptions.path = movePath(pathIn, moveX, moveY);
            update[astrPath] = shapeOptions.path;
        }
        else {
            update[astrX0] = shapeOptions.x0 = p2x(x0 + dx);
            update[astrY0] = shapeOptions.y0 = p2y(y0 + dy);
            update[astrX1] = shapeOptions.x1 = p2x(x1 + dx);
            update[astrY1] = shapeOptions.y1 = p2y(y1 + dy);
        }

        shapePath.attr('d', getPathString(gd, shapeOptions));
    }

    function resizeShape(dx, dy) {
        if(shapeOptions.type === 'path') {
            // TODO: implement path resize
            var moveX = function moveX(x) { return p2x(x2p(x) + dx); };
            if(xa && xa.type === 'date') moveX = helpers.encodeDate(moveX);

            var moveY = function moveY(y) { return p2y(y2p(y) + dy); };
            if(ya && ya.type === 'date') moveY = helpers.encodeDate(moveY);

            shapeOptions.path = movePath(pathIn, moveX, moveY);
            update[astrPath] = shapeOptions.path;
        }
        else {
            var newN = (~dragMode.indexOf('n')) ? n0 + dy : n0,
                newS = (~dragMode.indexOf('s')) ? s0 + dy : s0,
                newW = (~dragMode.indexOf('w')) ? w0 + dx : w0,
                newE = (~dragMode.indexOf('e')) ? e0 + dx : e0;

            if(newS - newN > MINHEIGHT) {
                update[astrN] = shapeOptions[optN] = p2y(newN);
                update[astrS] = shapeOptions[optS] = p2y(newS);
            }

            if(newE - newW > MINWIDTH) {
                update[astrW] = shapeOptions[optW] = p2x(newW);
                update[astrE] = shapeOptions[optE] = p2x(newE);
            }
        }

        shapePath.attr('d', getPathString(gd, shapeOptions));
    }
}

function isShapeInSubplot(gd, shape, plotinfo) {
    var xa = Axes.getFromId(gd, plotinfo.id, 'x')._id,
        ya = Axes.getFromId(gd, plotinfo.id, 'y')._id,
        isBelow = shape.layer === 'below',
        inSuplotAxis = (xa === shape.xref || ya === shape.yref),
        isNotAnOverlaidSubplot = !!plotinfo.shapelayer;
    return isBelow && inSuplotAxis && isNotAnOverlaidSubplot;
}

function getPathString(gd, options) {
    var type = options.type,
        xa = Axes.getFromId(gd, options.xref),
        ya = Axes.getFromId(gd, options.yref),
        gs = gd._fullLayout._size,
        x2r,
        x2p,
        y2r,
        y2p;

    if(xa) {
        x2r = helpers.shapePositionToRange(xa);
        x2p = function(v) { return xa._offset + xa.r2p(x2r(v, true)); };
    }
    else {
        x2p = function(v) { return gs.l + gs.w * v; };
    }

    if(ya) {
        y2r = helpers.shapePositionToRange(ya);
        y2p = function(v) { return ya._offset + ya.r2p(y2r(v, true)); };
    }
    else {
        y2p = function(v) { return gs.t + gs.h * (1 - v); };
    }

    if(type === 'path') {
        if(xa && xa.type === 'date') x2p = helpers.decodeDate(x2p);
        if(ya && ya.type === 'date') y2p = helpers.decodeDate(y2p);
        return convertPath(options.path, x2p, y2p);
    }

    var x0 = x2p(options.x0),
        x1 = x2p(options.x1),
        y0 = y2p(options.y0),
        y1 = y2p(options.y1);

    if(type === 'line') return 'M' + x0 + ',' + y0 + 'L' + x1 + ',' + y1;
    if(type === 'rect') return 'M' + x0 + ',' + y0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z';
    // circle
    var cx = (x0 + x1) / 2,
        cy = (y0 + y1) / 2,
        rx = Math.abs(cx - x0),
        ry = Math.abs(cy - y0),
        rArc = 'A' + rx + ',' + ry,
        rightPt = (cx + rx) + ',' + cy,
        topPt = cx + ',' + (cy - ry);
    return 'M' + rightPt + rArc + ' 0 1,1 ' + topPt +
        rArc + ' 0 0,1 ' + rightPt + 'Z';
}


function convertPath(pathIn, x2p, y2p) {
    // convert an SVG path string from data units to pixels
    return pathIn.replace(constants.segmentRE, function(segment) {
        var paramNumber = 0,
            segmentType = segment.charAt(0),
            xParams = constants.paramIsX[segmentType],
            yParams = constants.paramIsY[segmentType],
            nParams = constants.numParams[segmentType];

        var paramString = segment.substr(1).replace(constants.paramRE, function(param) {
            if(xParams[paramNumber]) param = x2p(param);
            else if(yParams[paramNumber]) param = y2p(param);
            paramNumber++;

            if(paramNumber > nParams) param = 'X';
            return param;
        });

        if(paramNumber > nParams) {
            paramString = paramString.replace(/[\s,]*X.*/, '');
            Lib.log('Ignoring extra params in segment ' + segment);
        }

        return segmentType + paramString;
    });
}

function movePath(pathIn, moveX, moveY) {
    return pathIn.replace(constants.segmentRE, function(segment) {
        var paramNumber = 0,
            segmentType = segment.charAt(0),
            xParams = constants.paramIsX[segmentType],
            yParams = constants.paramIsY[segmentType],
            nParams = constants.numParams[segmentType];

        var paramString = segment.substr(1).replace(constants.paramRE, function(param) {
            if(paramNumber >= nParams) return param;

            if(xParams[paramNumber]) param = moveX(param);
            else if(yParams[paramNumber]) param = moveY(param);

            paramNumber++;

            return param;
        });

        return segmentType + paramString;
    });
}

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Plotly = require('../../plotly');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Color = require('../color');
var Drawing = require('../drawing');

var dragElement = require('../dragelement');
var setCursor = require('../../lib/setcursor');

var shapes = module.exports = {};

shapes.layoutAttributes = require('./attributes');

shapes.supplyLayoutDefaults = function(layoutIn, layoutOut) {
    var containerIn = layoutIn.shapes || [],
        containerOut = layoutOut.shapes = [];

    for(var i = 0; i < containerIn.length; i++) {
        containerOut.push(handleShapeDefaults(containerIn[i] || {}, layoutOut));
    }
};

function handleShapeDefaults(shapeIn, fullLayout) {
    var shapeOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(shapeIn, shapeOut, shapes.layoutAttributes, attr, dflt);
    }

    coerce('layer');
    coerce('opacity');
    coerce('fillcolor');
    coerce('line.color');
    coerce('line.width');
    coerce('line.dash');
    var dfltType = shapeIn.path ? 'path' : 'rect',
        shapeType = coerce('type', dfltType);

    // positioning
    var axLetters = ['x', 'y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            tdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Axes.coerceRef(shapeIn, shapeOut, tdMock, axLetter);

        if(shapeType !== 'path') {
            var dflt0 = 0.25,
                dflt1 = 0.75;
            if(axRef !== 'paper') {
                var ax = Axes.getFromId(tdMock, axRef),
                    convertFn = linearToData(ax);
                dflt0 = convertFn(ax.range[0] + dflt0 * (ax.range[1] - ax.range[0]));
                dflt1 = convertFn(ax.range[0] + dflt1 * (ax.range[1] - ax.range[0]));
            }
            // x0, x1 (and y0, y1)
            coerce(axLetter + '0', dflt0);
            coerce(axLetter + '1', dflt1);
        }
    }

    if(shapeType === 'path') {
        coerce('path');
    } else {
        Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
    }

    return shapeOut;
}

// special position conversion functions... category axis positions can't be
// specified by their data values, because they don't make a continuous mapping.
// so these have to be specified in terms of the category serial numbers,
// but can take fractional values. Other axis types we specify position based on
// the actual data values.
// TODO: this should really be part of axes, but for now it's only used here.
// eventually annotations and axis ranges will use this too.
// what should we do, invent a new letter for "data except if it's category"?
function dataToLinear(ax) { return ax.type === 'category' ? ax.c2l : ax.d2l; }

function linearToData(ax) { return ax.type === 'category' ? ax.l2c : ax.l2d; }

shapes.drawAll = function(gd) {
    var fullLayout = gd._fullLayout;

    // Remove previous shapes before drawing new in shapes in fullLayout.shapes
    fullLayout._shapeUpperLayer.selectAll('path').remove();
    fullLayout._shapeLowerLayer.selectAll('path').remove();
    fullLayout._shapeSubplotLayer.selectAll('path').remove();

    for(var i = 0; i < fullLayout.shapes.length; i++) {
        shapes.draw(gd, i);
    }
    // may need to resurrect this if we put text (LaTeX) in shapes
    // return Plotly.Plots.previousPromises(gd);
};

shapes.add = function(gd) {
    var nextShape = gd._fullLayout.shapes.length;
    Plotly.relayout(gd, 'shapes[' + nextShape + ']', 'add');
};

// -----------------------------------------------------
// make or edit an annotation on the graph
// -----------------------------------------------------

// shapes are stored in gd.layout.shapes, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw
// if opt is blank, val can be 'add' or a full options object to add a new
//  annotation at that point in the array, or 'remove' to delete this one
shapes.draw = function(gd, index, opt, value) {
    if(!isNumeric(index) || index === -1) {
        // no index provided - we're operating on ALL shapes
        if(!index && Array.isArray(value)) {
            replaceAllShapes(gd, value);
            return;
        }
        else if(value === 'remove') {
            deleteAllShapes(gd);
            return;
        }
        else if(opt && value !== 'add') {
            updateAllShapes(gd, opt, value);
            return;
        }
        else {
            // add a new empty annotation
            index = gd._fullLayout.shapes.length;
            gd._fullLayout.shapes.push({});
        }
    }

    if(!opt && value) {
        if(value === 'remove') {
            deleteShape(gd, index);
            return;
        }
        else if(value === 'add' || Lib.isPlainObject(value)) {
            insertShape(gd, index, value);
        }
    }

    updateShape(gd, index, opt, value);
};

function replaceAllShapes(gd, newShapes) {
    gd.layout.shapes = newShapes;
    shapes.supplyLayoutDefaults(gd.layout, gd._fullLayout);
    shapes.drawAll(gd);
}

function deleteAllShapes(gd) {
    delete gd.layout.shapes;
    gd._fullLayout.shapes = [];
    shapes.drawAll(gd);
}

function updateAllShapes(gd, opt, value) {
    for(var i = 0; i < gd._fullLayout.shapes.length; i++) {
        shapes.draw(gd, i, opt, value);
    }
}

function deleteShape(gd, index) {
    getShapeLayer(gd, index)
        .selectAll('[data-index="' + index + '"]')
        .remove();

    gd._fullLayout.shapes.splice(index, 1);

    gd.layout.shapes.splice(index, 1);

    for(var i = index; i < gd._fullLayout.shapes.length; i++) {
        // redraw all shapes past the removed one,
        // so they bind to the right events
        getShapeLayer(gd, i)
            .selectAll('[data-index="' + (i + 1) + '"]')
            .attr('data-index', i);
        shapes.draw(gd, i);
    }
}

function insertShape(gd, index, newShape) {
    gd._fullLayout.shapes.splice(index, 0, {});

    var rule = Lib.isPlainObject(newShape) ?
        Lib.extendFlat({}, newShape) :
        {text: 'New text'};

    if(gd.layout.shapes) {
        gd.layout.shapes.splice(index, 0, rule);
    } else {
        gd.layout.shapes = [rule];
    }

    // there is no need to call shapes.draw(gd, index),
    // because updateShape() is called from within shapes.draw()

    for(var i = gd._fullLayout.shapes.length - 1; i > index; i--) {
        getShapeLayer(gd, i)
            .selectAll('[data-index="' + (i - 1) + '"]')
            .attr('data-index', i);
        shapes.draw(gd, i);
    }
}

function updateShape(gd, index, opt, value) {
    var i, n;

    // remove the existing shape if there is one
    getShapeLayer(gd, index)
        .selectAll('[data-index="' + index + '"]')
        .remove();

    // remember a few things about what was already there,
    var optionsIn = gd.layout.shapes[index];

    // (from annos...) not sure how we're getting here... but C12 is seeing a bug
    // where we fail here when they add/remove annotations
    // TODO: clean this up and remove it.
    if(!optionsIn) return;

    var oldRef = {xref: optionsIn.xref, yref: optionsIn.yref};

    // alter the input shape as requested
    var optionsEdit = {};
    if(typeof opt === 'string' && opt) optionsEdit[opt] = value;
    else if(Lib.isPlainObject(opt)) optionsEdit = opt;

    var optionKeys = Object.keys(optionsEdit);
    for(i = 0; i < optionKeys.length; i++) {
        var k = optionKeys[i];
        Lib.nestedProperty(optionsIn, k).set(optionsEdit[k]);
    }

    var posAttrs = ['x0', 'x1', 'y0', 'y1'];
    for(i = 0; i < 4; i++) {
        var posAttr = posAttrs[i];
        // if we don't have an explicit position already,
        // don't set one just because we're changing references
        // or axis type.
        // the defaults will be consistent most of the time anyway,
        // except in log/linear changes
        if(optionsEdit[posAttr] !== undefined ||
                optionsIn[posAttr] === undefined) {
            continue;
        }

        var axLetter = posAttr.charAt(0),
            axOld = Axes.getFromId(gd,
                Axes.coerceRef(oldRef, {}, gd, axLetter)),
            axNew = Axes.getFromId(gd,
                Axes.coerceRef(optionsIn, {}, gd, axLetter)),
            position = optionsIn[posAttr],
            linearizedPosition;

        if(optionsEdit[axLetter + 'ref'] !== undefined) {
            // first convert to fraction of the axis
            if(axOld) {
                linearizedPosition = dataToLinear(axOld)(position);
                position = (linearizedPosition - axOld.range[0]) /
                    (axOld.range[1] - axOld.range[0]);
            } else {
                position = (position - axNew.domain[0]) /
                    (axNew.domain[1] - axNew.domain[0]);
            }

            if(axNew) {
                // then convert to new data coordinates at the same fraction
                linearizedPosition = axNew.range[0] + position *
                    (axNew.range[1] - axNew.range[0]);
                position = linearToData(axNew)(linearizedPosition);
            } else {
                // or scale to the whole plot
                position = axOld.domain[0] +
                    position * (axOld.domain[1] - axOld.domain[0]);
            }
        }

        optionsIn[posAttr] = position;
    }

    var options = handleShapeDefaults(optionsIn, gd._fullLayout);
    gd._fullLayout.shapes[index] = options;

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

        x2p = getDataToPixel(gd, xa);
        y2p = getDataToPixel(gd, ya, true);
        p2x = getPixelToData(gd, xa);
        p2y = getPixelToData(gd, ya, true);

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
            if(xa && xa.type === 'date') moveX = encodeDate(moveX);

            var moveY = function moveY(y) { return p2y(y2p(y) + dy); };
            if(ya && ya.type === 'date') moveY = encodeDate(moveY);

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
            if(xa && xa.type === 'date') moveX = encodeDate(moveX);

            var moveY = function moveY(y) { return p2y(y2p(y) + dy); };
            if(ya && ya.type === 'date') moveY = encodeDate(moveY);

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

function getShapeLayer(gd, index) {
    var shape = gd._fullLayout.shapes[index],
        shapeLayer = gd._fullLayout._shapeUpperLayer;

    if(!shape) {
        Lib.log('getShapeLayer: undefined shape: index', index);
    }
    else if(shape.layer === 'below') {
        shapeLayer = (shape.xref === 'paper' && shape.yref === 'paper') ?
            gd._fullLayout._shapeLowerLayer :
            gd._fullLayout._shapeSubplotLayer;
    }

    return shapeLayer;
}

function isShapeInSubplot(gd, shape, plotinfo) {
    var xa = Plotly.Axes.getFromId(gd, plotinfo.id, 'x')._id,
        ya = Plotly.Axes.getFromId(gd, plotinfo.id, 'y')._id,
        isBelow = shape.layer === 'below',
        inSuplotAxis = (xa === shape.xref || ya === shape.yref),
        isNotAnOverlaidSubplot = !!plotinfo.shapelayer;
    return isBelow && inSuplotAxis && isNotAnOverlaidSubplot;
}

function decodeDate(convertToPx) {
    return function(v) {
        if(v.replace) v = v.replace('_', ' ');
        return convertToPx(v);
    };
}

function encodeDate(convertToDate) {
    return function(v) { return convertToDate(v).replace(' ', '_'); };
}

function getDataToPixel(gd, axis, isVertical) {
    var gs = gd._fullLayout._size,
        dataToPixel;

    if(axis) {
        var d2l = dataToLinear(axis);

        dataToPixel = function(v) {
            return axis._offset + axis.l2p(d2l(v, true));
        };

        if(axis.type === 'date') dataToPixel = decodeDate(dataToPixel);
    }
    else if(isVertical) {
        dataToPixel = function(v) { return gs.t + gs.h * (1 - v); };
    }
    else {
        dataToPixel = function(v) { return gs.l + gs.w * v; };
    }

    return dataToPixel;
}

function getPixelToData(gd, axis, isVertical) {
    var gs = gd._fullLayout._size,
        pixelToData;

    if(axis) {
        var l2d = linearToData(axis);
        pixelToData = function(p) { return l2d(axis.p2l(p - axis._offset)); };
    }
    else if(isVertical) {
        pixelToData = function(p) { return 1 - (p - gs.t) / gs.h; };
    }
    else {
        pixelToData = function(p) { return (p - gs.l) / gs.w; };
    }

    return pixelToData;
}

function getPathString(gd, options) {
    var type = options.type,
        xa = Axes.getFromId(gd, options.xref),
        ya = Axes.getFromId(gd, options.yref),
        gs = gd._fullLayout._size,
        x2l,
        x2p,
        y2l,
        y2p;

    if(xa) {
        x2l = dataToLinear(xa);
        x2p = function(v) { return xa._offset + xa.l2p(x2l(v, true)); };
    }
    else {
        x2p = function(v) { return gs.l + gs.w * v; };
    }

    if(ya) {
        y2l = dataToLinear(ya);
        y2p = function(v) { return ya._offset + ya.l2p(y2l(v, true)); };
    }
    else {
        y2p = function(v) { return gs.t + gs.h * (1 - v); };
    }

    if(type === 'path') {
        if(xa && xa.type === 'date') x2p = decodeDate(x2p);
        if(ya && ya.type === 'date') y2p = decodeDate(y2p);
        return shapes.convertPath(options.path, x2p, y2p);
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

var segmentRE = /[MLHVQCTSZ][^MLHVQCTSZ]*/g,
    paramRE = /[^\s,]+/g,

    // which numbers in each path segment are x (or y) values
    // drawn is which param is a drawn point, as opposed to a
    // control point (which doesn't count toward autorange.
    // TODO: this means curved paths could extend beyond the
    // autorange bounds. This is a bit tricky to get right
    // unless we revert to bounding boxes, but perhaps there's
    // a calculation we could do...)
    paramIsX = {
        M: {0: true, drawn: 0},
        L: {0: true, drawn: 0},
        H: {0: true, drawn: 0},
        V: {},
        Q: {0: true, 2: true, drawn: 2},
        C: {0: true, 2: true, 4: true, drawn: 4},
        T: {0: true, drawn: 0},
        S: {0: true, 2: true, drawn: 2},
        // A: {0: true, 5: true},
        Z: {}
    },

    paramIsY = {
        M: {1: true, drawn: 1},
        L: {1: true, drawn: 1},
        H: {},
        V: {0: true, drawn: 0},
        Q: {1: true, 3: true, drawn: 3},
        C: {1: true, 3: true, 5: true, drawn: 5},
        T: {1: true, drawn: 1},
        S: {1: true, 3: true, drawn: 5},
        // A: {1: true, 6: true},
        Z: {}
    },
    numParams = {
        M: 2,
        L: 2,
        H: 1,
        V: 1,
        Q: 4,
        C: 6,
        T: 2,
        S: 4,
        // A: 7,
        Z: 0
    };

shapes.convertPath = function(pathIn, x2p, y2p) {
    // convert an SVG path string from data units to pixels
    return pathIn.replace(segmentRE, function(segment) {
        var paramNumber = 0,
            segmentType = segment.charAt(0),
            xParams = paramIsX[segmentType],
            yParams = paramIsY[segmentType],
            nParams = numParams[segmentType];

        var paramString = segment.substr(1).replace(paramRE, function(param) {
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
};

function movePath(pathIn, moveX, moveY) {
    return pathIn.replace(segmentRE, function(segment) {
        var paramNumber = 0,
            segmentType = segment.charAt(0),
            xParams = paramIsX[segmentType],
            yParams = paramIsY[segmentType],
            nParams = numParams[segmentType];

        var paramString = segment.substr(1).replace(paramRE, function(param) {
            if(paramNumber >= nParams) return param;

            if(xParams[paramNumber]) param = moveX(param);
            else if(yParams[paramNumber]) param = moveY(param);

            paramNumber++;

            return param;
        });

        return segmentType + paramString;
    });
}

shapes.calcAutorange = function(gd) {
    var fullLayout = gd._fullLayout,
        shapeList = fullLayout.shapes,
        i,
        shape,
        ppad,
        ax,
        bounds;

    if(!shapeList.length || !gd._fullData.length) return;

    for(i = 0; i < shapeList.length; i++) {
        shape = shapeList[i];
        ppad = shape.line.width / 2;
        if(shape.xref !== 'paper') {
            ax = Axes.getFromId(gd, shape.xref);
            bounds = shapeBounds(ax, shape.x0, shape.x1, shape.path, paramIsX);
            if(bounds) Axes.expand(ax, bounds, {ppad: ppad});
        }
        if(shape.yref !== 'paper') {
            ax = Axes.getFromId(gd, shape.yref);
            bounds = shapeBounds(ax, shape.y0, shape.y1, shape.path, paramIsY);
            if(bounds) Axes.expand(ax, bounds, {ppad: ppad});
        }
    }
};

function shapeBounds(ax, v0, v1, path, paramsToUse) {
    var convertVal = (ax.type === 'category') ? Number : ax.d2c;

    if(v0 !== undefined) return [convertVal(v0), convertVal(v1)];
    if(!path) return;

    var min = Infinity,
        max = -Infinity,
        segments = path.match(segmentRE),
        i,
        segment,
        drawnParam,
        params,
        val;

    if(ax.type === 'date') convertVal = decodeDate(convertVal);

    for(i = 0; i < segments.length; i++) {
        segment = segments[i];
        drawnParam = paramsToUse[segment.charAt(0)].drawn;
        if(drawnParam === undefined) continue;

        params = segments[i].substr(1).match(paramRE);
        if(!params || params.length < drawnParam) continue;

        val = convertVal(params[drawnParam]);
        if(val < min) min = val;
        if(val > max) max = val;
    }
    if(max >= min) return [min, max];
}

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var isNumeric = require('fast-isnumeric');

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
        return Plotly.Lib.coerce(shapeIn, shapeOut,
                                 shapes.layoutAttributes,
                                 attr, dflt);
    }

    coerce('opacity');
    coerce('fillcolor');
    coerce('line.color');
    coerce('line.width');
    coerce('line.dash');
    var dfltType = shapeIn.path ? 'path' : 'rect',
        shapeType = coerce('type', dfltType);

    // positioning
    var axLetters = ['x','y'];
    for(var i = 0; i < 2; i++) {
        var axLetter = axLetters[i],
            tdMock = {_fullLayout: fullLayout};

        // xref, yref
        var axRef = Plotly.Axes.coerceRef(shapeIn, shapeOut, tdMock, axLetter);

        if(shapeType !== 'path') {
            var dflt0 = 0.25,
                dflt1 = 0.75;
            if(axRef !== 'paper') {
                var ax = Plotly.Axes.getFromId(tdMock, axRef),
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
        Plotly.Lib.noneOrAll(shapeIn, shapeOut, ['x0', 'x1', 'y0', 'y1']);
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
    fullLayout._shapelayer.selectAll('path').remove();
    for(var i = 0; i < fullLayout.shapes.length; i++) {
        shapes.draw(gd, i);
    }
    // may need to resurrect this if we put text (LaTeX) in shapes
    // return Plotly.Plots.previousPromises(gd);
};

shapes.add = function(gd) {
    var nextShape = gd._fullLayout.shapes.length;
    Plotly.relayout(gd, 'shapes['+nextShape+']', 'add');
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
    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        i;

    // TODO: abstract out these drawAll, add, and remove blocks for shapes and annotations
    if(!isNumeric(index) || index===-1) {
        // no index provided - we're operating on ALL shapes
        if(!index && Array.isArray(value)) {
            // a whole annotation array is passed in
            // (as in, redo of delete all)
            layout.shapes = value;
            shapes.supplyLayoutDefaults(layout, fullLayout);
            shapes.drawAll(gd);
            return;
        }
        else if(value==='remove') {
            // delete all
            delete layout.shapes;
            fullLayout.shapes = [];
            shapes.drawAll(gd);
            return;
        }
        else if(opt && value!=='add') {
            // make the same change to all shapes
            for(i = 0; i < fullLayout.shapes.length; i++) {
                shapes.draw(gd, i, opt, value);
            }
            return;
        }
        else {
            // add a new empty annotation
            index = fullLayout.shapes.length;
            fullLayout.shapes.push({});
        }
    }

    if(!opt && value) {
        if(value==='remove') {
            fullLayout._shapelayer.selectAll('[data-index="'+index+'"]')
                .remove();
            fullLayout.shapes.splice(index,1);
            layout.shapes.splice(index,1);
            for(i=index; i<fullLayout.shapes.length; i++) {
                fullLayout._shapelayer
                    .selectAll('[data-index="'+(i+1)+'"]')
                    .attr('data-index',String(i));

                // redraw all shapes past the removed one,
                // so they bind to the right events
                shapes.draw(gd,i);
            }
            return;
        }
        else if(value==='add' || Plotly.Lib.isPlainObject(value)) {
            fullLayout.shapes.splice(index,0,{});

            var rule = Plotly.Lib.isPlainObject(value) ?
                    Plotly.Lib.extendFlat({}, value) :
                    {text: 'New text'};

            if(layout.shapes) {
                layout.shapes.splice(index, 0, rule);
            } else {
                layout.shapes = [rule];
            }

            for(i=fullLayout.shapes.length-1; i>index; i--) {
                fullLayout._shapelayer
                    .selectAll('[data-index="'+(i-1)+'"]')
                    .attr('data-index',String(i));
                shapes.draw(gd,i);
            }
        }
    }

    // remove the existing shape if there is one
    fullLayout._shapelayer.selectAll('[data-index="'+index+'"]').remove();

    // remember a few things about what was already there,
    var optionsIn = layout.shapes[index];

    // (from annos...) not sure how we're getting here... but C12 is seeing a bug
    // where we fail here when they add/remove annotations
    // TODO: clean this up and remove it.
    if(!optionsIn) return;

    var oldRef = {xref: optionsIn.xref, yref: optionsIn.yref};

    // alter the input shape as requested
    var optionsEdit = {};
    if(typeof opt === 'string' && opt) optionsEdit[opt] = value;
    else if(Plotly.Lib.isPlainObject(opt)) optionsEdit = opt;

    var optionKeys = Object.keys(optionsEdit);
    for(i = 0; i < optionsEdit.length; i++) {
        var k = optionKeys[i];
        Plotly.Lib.nestedProperty(optionsIn, k).set(optionsEdit[k]);
    }

    var posAttrs = ['x0', 'x1', 'y0', 'y1'];
    for(i = 0; i < 4; i++) {
        var posAttr = posAttrs[i];
        // if we don't have an explicit position already,
        // don't set one just because we're changing references
        // or axis type.
        // the defaults will be consistent most of the time anyway,
        // except in log/linear changes
        if(optionsEdit[posAttr]!==undefined ||
                optionsIn[posAttr]===undefined) {
            continue;
        }

        var axLetter = posAttr.charAt(0),
            axOld = Plotly.Axes.getFromId(gd,
                Plotly.Axes.coerceRef(oldRef, {}, gd, axLetter)),
            axNew = Plotly.Axes.getFromId(gd,
                Plotly.Axes.coerceRef(optionsIn, {}, gd, axLetter)),
            position = optionsIn[posAttr],
            linearizedPosition;

        if(optionsEdit[axLetter + 'ref']!==undefined) {
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

    var options = handleShapeDefaults(optionsIn, fullLayout);
    fullLayout.shapes[index] = options;

    var attrs = {
            'data-index': String(index),
            'fill-rule': 'evenodd',
            d: shapePath(gd, options)
        },
        clipAxes = (options.xref + options.yref).replace(/paper/g, '');

    var lineColor = options.line.width ? options.line.color : 'rgba(0,0,0,0)';

    var path = fullLayout._shapelayer.append('path')
        .attr(attrs)
        .style('opacity', options.opacity)
        .call(Plotly.Color.stroke, lineColor)
        .call(Plotly.Color.fill, options.fillcolor)
        .call(Plotly.Drawing.dashLine, options.line.dash, options.line.width);

    if(clipAxes) path.call(Plotly.Drawing.setClipUrl, 'clip' + fullLayout._uid + clipAxes);
};

function decodeDate(convertToPx) {
    return function(v) { return convertToPx(v.replace('_', ' ')); };
}

function shapePath(gd, options) {
    var type = options.type,
        xa = Plotly.Axes.getFromId(gd, options.xref),
        ya = Plotly.Axes.getFromId(gd, options.yref),
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

    if(type==='path') {
        if(xa && xa.type==='date') x2p = decodeDate(x2p);
        if(ya && ya.type==='date') y2p = decodeDate(y2p);
        return shapes.convertPath(options.path, x2p, y2p);
    }

    var x0 = x2p(options.x0),
        x1 = x2p(options.x1),
        y0 = y2p(options.y0),
        y1 = y2p(options.y1);

    if(type==='line') return 'M'+x0+','+y0+'L'+x1+','+y1;
    if(type==='rect') return 'M'+x0+','+y0+'H'+x1+'V'+y1+'H'+x0+'Z';
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
            console.log('ignoring extra params in segment ' + segment);
        }

        return segmentType + paramString;
    });
};

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
            ax = Plotly.Axes.getFromId(gd, shape.xref);
            bounds = shapeBounds(ax, shape.x0, shape.x1, shape.path, paramIsX);
            if(bounds) Plotly.Axes.expand(ax, bounds, {ppad: ppad});
        }
        if(shape.yref !== 'paper') {
            ax = Plotly.Axes.getFromId(gd, shape.yref);
            bounds = shapeBounds(ax, shape.y0, shape.y1, shape.path, paramIsY);
            if(bounds) Plotly.Axes.expand(ax, bounds, {ppad: ppad});
        }
    }
};

function shapeBounds(ax, v0, v1, path, paramsToUse) {
    var convertVal = (ax.type==='category') ? Number : ax.d2c;

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

    if(ax.type==='date') convertVal = decodeDate(convertVal);

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

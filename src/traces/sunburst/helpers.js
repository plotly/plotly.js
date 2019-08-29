/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var setCursor = require('../../lib/setcursor');
var getTransform = require('../bar/plot').getTransform;

function has(v) {
    return v || v === 0;
}

exports.findEntryWithLevel = function(hierarchy, level) {
    var out;
    if(level) {
        hierarchy.eachAfter(function(pt) {
            if(exports.getPtId(pt) === level) {
                return out = pt.copy();
            }
        });
    }
    return out || hierarchy;
};

exports.findEntryWithChild = function(hierarchy, childId) {
    var out;
    hierarchy.eachAfter(function(pt) {
        var children = pt.children || [];
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            if(exports.getPtId(child) === childId) {
                return out = pt.copy();
            }
        }
    });
    return out || hierarchy;
};

exports.findChildPt = function(hierarchy, childId) {
    var out = {};
    hierarchy.eachAfter(function(pt) {
        var children = pt.children || [];
        for(var i = 0; i < children.length; i++) {
            var child = children[i];
            if(exports.getPtId(child) === childId) {
                out = {
                    x0: child.x0,
                    x1: child.x1,
                    y0: child.y0,
                    y1: child.y1,
                };
            }
        }
    });
    return out;
};

exports.isEntry = function(pt) {
    return !has(pt.parent);
};

exports.isLeaf = function(pt) {
    return !has(pt.children);
};

exports.getPtId = function(pt) {
    return pt.data.data.id;
};

exports.isHierarchyRoot = function(pt) {
    return pt.data.data.pid === '';
};

exports.setSliceCursor = function(sliceTop, gd, opts) {
    var pt = sliceTop.datum();
    var isTransitioning = (opts || {}).isTransitioning;
    setCursor(sliceTop, (
        isTransitioning ||
        exports.isLeaf(pt) ||
        exports.isHierarchyRoot(pt)
    ) ? null : 'pointer');
};

function determineOutsideTextFont(trace, pt, layoutFont) {
    return {
        color: exports.getOutsideTextFontKey('color', trace, pt, layoutFont),
        family: exports.getOutsideTextFontKey('family', trace, pt, layoutFont),
        size: exports.getOutsideTextFontKey('size', trace, pt, layoutFont)
    };
}

function determineInsideTextFont(trace, pt, layoutFont, cont) {
    var cdi = pt.data.data;
    var ptNumber = cdi.i;

    var customColor = Lib.castOption(trace, ptNumber, 'insidetextfont.color');
    if(!customColor && trace._input.textfont) {
        // Why not simply using trace.textfont? Because if not set, it
        // defaults to layout.font which has a default color. But if
        // textfont.color and insidetextfont.color don't supply a value,
        // a contrasting color shall be used.
        customColor = Lib.castOption(trace._input, ptNumber, 'textfont.color');
    }

    return {
        color: customColor || Color.contrast(cdi.color),
        family: exports.getInsideTextFontKey('family', cont || trace, pt, layoutFont),
        size: exports.getInsideTextFontKey('size', cont || trace, pt, layoutFont)
    };
}

exports.getInsideTextFontKey = function(keyStr, trace, pt, layoutFont) {
    var ptNumber = pt.data.data.i;

    return (
        Lib.castOption(trace, ptNumber, 'insidetextfont.' + keyStr) ||
        Lib.castOption(trace, ptNumber, 'textfont.' + keyStr) ||
        layoutFont.size
    );
};

exports.getOutsideTextFontKey = function(keyStr, trace, pt, layoutFont) {
    var ptNumber = pt.data.data.i;

    return (
        Lib.castOption(trace, ptNumber, 'outsidetextfont.' + keyStr) ||
        Lib.castOption(trace, ptNumber, 'textfont.' + keyStr) ||
        layoutFont.size
    );
};

exports.isOutsideText = function(trace, pt) {
    return !trace._hasColorscale && exports.isHierarchyRoot(pt);
};

exports.determineTextFont = function(trace, pt, layoutFont, cont) {
    return exports.isOutsideText(trace, pt) ?
        determineOutsideTextFont(trace, pt, layoutFont) :
        determineInsideTextFont(trace, pt, layoutFont, cont);
};

exports.hasTransition = function(transitionOpts) {
    // We could optimize hasTransition per trace,
    // as sunburst & treemap have no cross-trace logic!
    return !!(transitionOpts && transitionOpts.duration > 0);
};

exports.strTransform = function(d) {
    return getTransform({
        textX: d.transform.textX,
        textY: d.transform.textY,
        targetX: d.transform.targetX,
        targetY: d.transform.targetY,
        scale: d.transform.scale,
        rotate: d.transform.rotate
    });
};

exports.getMaxDepth = function(trace) {
    return trace.maxdepth >= 0 ? trace.maxdepth : Infinity;
};

exports.isHeader = function(pt, trace) { // it is only used in treemap.
    return !(exports.isLeaf(pt) || pt.depth === trace._maxDepth - 1);
};

exports.getLabelStr = function(label) {
    return has(label) ? label.split('<br>').join(' ') : '';
};

exports.getLabelString = function(label) { // used in hover to reference to the "root"
    var str = exports.getLabelStr(label);
    return str ? str : '"root"';
};

exports.getPath = function(d) {
    var labelStr = exports.getLabelStr(d.data.label) + '/';
    return has(d.parent) ? exports.getPath(d.parent) + labelStr : labelStr;
};

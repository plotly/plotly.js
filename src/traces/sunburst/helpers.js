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

function hasLabel(label) {
    return label || label === 0;
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

exports.isEntry = function(pt) {
    return !pt.parent;
};

exports.isLeaf = function(pt) {
    return !pt.children;
};

exports.getPtId = function(pt) {
    return pt.data.data.id;
};

exports.isHierarchyRoot = function(pt) {
    return pt.data.data.pid === '';
};

exports.setSliceCursor = function(sliceTop, gd, opts) {
    var hide = opts.isTransitioning;
    if(!hide) {
        var pt = sliceTop.datum();
        hide = (
            (opts.hideOnRoot && exports.isHierarchyRoot(pt)) ||
            (opts.hideOnLeaves && exports.isLeaf(pt))
        );
    }
    setCursor(sliceTop, hide ? null : 'pointer');
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

exports.getMaxDepth = function(trace) {
    return trace.maxdepth >= 0 ? trace.maxdepth : Infinity;
};

exports.isHeader = function(pt, trace) { // it is only used in treemap.
    return !(exports.isLeaf(pt) || pt.depth === trace._maxDepth - 1);
};

exports.getLabelStr = function(label) {
    return hasLabel(label) ? label.split('<br>').join(' ') : '';
};

exports.getLabelString = function(label) { // used in hover to reference to the "root"
    var str = exports.getLabelStr(label);
    return str ? str : '"root"';
};

exports.getPath = function(d) {
    if(!d.parent) return '';
    return exports.getLabelStr(d.parent.data.label) + '/';
};

exports.listPath = function(d, keyStr) {
    if(!d.parent) return [];
    var list = keyStr ? [d.parent.data[keyStr]] : [d];
    return exports.listPath(d.parent, keyStr).concat(list);
};

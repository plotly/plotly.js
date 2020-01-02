/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var setCursor = require('../../lib/setcursor');
var pieHelpers = require('../pie/helpers');

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

exports.getPtLabel = function(pt) {
    return pt.data.data.label;
};

exports.getValue = function(d) {
    return d.value;
};

exports.isHierarchyRoot = function(pt) {
    return getParentId(pt) === '';
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

function determineInsideTextFont(trace, pt, layoutFont, opts) {
    var onPathbar = (opts || {}).onPathbar;

    var cdi = pt.data.data;
    var ptNumber = cdi.i;

    var customColor = Lib.castOption(trace, ptNumber,
        (onPathbar ? 'pathbar.textfont' : 'insidetextfont') + '.color'
    );

    if(!customColor && trace._input.textfont) {
        // Why not simply using trace.textfont? Because if not set, it
        // defaults to layout.font which has a default color. But if
        // textfont.color and insidetextfont.color don't supply a value,
        // a contrasting color shall be used.
        customColor = Lib.castOption(trace._input, ptNumber, 'textfont.color');
    }

    return {
        color: customColor || Color.contrast(cdi.color),
        family: exports.getInsideTextFontKey('family', trace, pt, layoutFont, opts),
        size: exports.getInsideTextFontKey('size', trace, pt, layoutFont, opts)
    };
}

exports.getInsideTextFontKey = function(keyStr, trace, pt, layoutFont, opts) {
    var onPathbar = (opts || {}).onPathbar;
    var cont = onPathbar ? 'pathbar.textfont' : 'insidetextfont';
    var ptNumber = pt.data.data.i;

    return (
        Lib.castOption(trace, ptNumber, cont + '.' + keyStr) ||
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

exports.determineTextFont = function(trace, pt, layoutFont, opts) {
    return exports.isOutsideText(trace, pt) ?
        determineOutsideTextFont(trace, pt, layoutFont) :
        determineInsideTextFont(trace, pt, layoutFont, opts);
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

function getParentId(pt) {
    return pt.data.data.pid;
}

exports.getParent = function(hierarchy, pt) {
    return exports.findEntryWithLevel(hierarchy, getParentId(pt));
};

exports.listPath = function(d, keyStr) {
    var parent = d.parent;
    if(!parent) return [];
    var list = keyStr ? [parent.data[keyStr]] : [parent];
    return exports.listPath(parent, keyStr).concat(list);
};

exports.getPath = function(d) {
    return exports.listPath(d, 'label').join('/') + '/';
};

exports.formatValue = pieHelpers.formatPieValue;

// TODO: should combine the two in a separate PR - Also please note Lib.formatPercent should support separators.
exports.formatPercent = function(v, separators) {
    var tx = Lib.formatPercent(v, 0); // use funnel(area) version
    if(tx === '0%') tx = pieHelpers.formatPiePercent(v, separators); // use pie version
    return tx;
};

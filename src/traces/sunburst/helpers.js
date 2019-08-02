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
var appendArrayPointValue = require('../../components/fx/helpers').appendArrayPointValue;

exports.makeEventData = function(pt, trace) {
    var cdi = pt.data.data;

    var out = {
        curveNumber: trace.index,
        pointNumber: cdi.i,
        data: trace._input,
        fullData: trace,

        // TODO more things like 'children', 'siblings', 'hierarchy?
    };

    appendArrayPointValue(out, trace, cdi.i);

    return out;
};

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

exports.isHierachyRoot = function(pt) {
    var cdi = pt.data.data;
    return cdi.pid === '';
};

exports.isEntry = function(pt) {
    return !pt.parent;
};

exports.isLeaf = function(pt) {
    return !pt.children;
};

exports.getPtId = function(pt) {
    var cdi = pt.data.data;
    return cdi.id;
};

exports.setSliceCursor = function(sliceTop, gd, opts) {
    var pt = sliceTop.datum();
    var isTransitioning = (opts || {}).isTransitioning;
    setCursor(sliceTop, (isTransitioning || exports.isLeaf(pt) || exports.isHierachyRoot(pt)) ? null : 'pointer');
};

exports.determineOutsideTextFont = function(trace, pt, layoutFont) {
    var cdi = pt.data.data;
    var ptNumber = cdi.i;

    var color = Lib.castOption(trace, ptNumber, 'outsidetextfont.color') ||
        Lib.castOption(trace, ptNumber, 'textfont.color') ||
        layoutFont.color;

    var family = Lib.castOption(trace, ptNumber, 'outsidetextfont.family') ||
        Lib.castOption(trace, ptNumber, 'textfont.family') ||
        layoutFont.family;

    var size = Lib.castOption(trace, ptNumber, 'outsidetextfont.size') ||
        Lib.castOption(trace, ptNumber, 'textfont.size') ||
        layoutFont.size;

    return {
        color: color,
        family: family,
        size: size
    };
};

exports.determineInsideTextFont = function(trace, pt, layoutFont) {
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

    var family = Lib.castOption(trace, ptNumber, 'insidetextfont.family') ||
        Lib.castOption(trace, ptNumber, 'textfont.family') ||
        layoutFont.family;

    var size = Lib.castOption(trace, ptNumber, 'insidetextfont.size') ||
        Lib.castOption(trace, ptNumber, 'textfont.size') ||
        layoutFont.size;

    return {
        color: customColor || Color.contrast(cdi.color),
        family: family,
        size: size
    };
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// special position conversion functions... category axis positions can't be
// specified by their data values, because they don't make a continuous mapping.
// so these have to be specified in terms of the category serial numbers,
// but can take fractional values. Other axis types we specify position based on
// the actual data values.
// TODO: this should really be part of axes, but for now it's only used here.
// eventually annotations and axis ranges will use this too.
// what should we do, invent a new letter for "data except if it's category"?

exports.dataToLinear = function(ax) {
    return ax.type === 'category' ? ax.c2l : ax.d2l;
};

exports.linearToData = function(ax) {
    return ax.type === 'category' ? ax.l2c : ax.l2d;
};

exports.decodeDate = function(convertToPx) {
    return function(v) {
        if(v.replace) v = v.replace('_', ' ');
        return convertToPx(v);
    };
};

exports.encodeDate = function(convertToDate) {
    return function(v) { return convertToDate(v).replace(' ', '_'); };
};

exports.getDataToPixel = function(gd, axis, isVertical) {
    var gs = gd._fullLayout._size,
        dataToPixel;

    if(axis) {
        var d2l = exports.dataToLinear(axis);

        dataToPixel = function(v) {
            return axis._offset + axis.l2p(d2l(v, true));
        };

        if(axis.type === 'date') dataToPixel = exports.decodeDate(dataToPixel);
    }
    else if(isVertical) {
        dataToPixel = function(v) { return gs.t + gs.h * (1 - v); };
    }
    else {
        dataToPixel = function(v) { return gs.l + gs.w * v; };
    }

    return dataToPixel;
};

exports.getPixelToData = function(gd, axis, isVertical) {
    var gs = gd._fullLayout._size,
        pixelToData;

    if(axis) {
        var l2d = exports.linearToData(axis);
        pixelToData = function(p) { return l2d(axis.p2l(p - axis._offset)); };
    }
    else if(isVertical) {
        pixelToData = function(p) { return 1 - (p - gs.t) / gs.h; };
    }
    else {
        pixelToData = function(p) { return (p - gs.l) / gs.w; };
    }

    return pixelToData;
};

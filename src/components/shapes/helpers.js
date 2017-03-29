/**
* Copyright 2012-2017, Plotly, Inc.
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
// TODO: in V2.0 (when log axis ranges are in data units) range and shape position
// will be identical, so rangeToShapePosition and shapePositionToRange can be
// removed entirely.

exports.rangeToShapePosition = function(ax) {
    return (ax.type === 'log') ? ax.r2d : function(v) { return v; };
};

exports.shapePositionToRange = function(ax) {
    return (ax.type === 'log') ? ax.d2r : function(v) { return v; };
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
        var d2r = exports.shapePositionToRange(axis);

        dataToPixel = function(v) {
            return axis._offset + axis.r2p(d2r(v, true));
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
        var r2d = exports.rangeToShapePosition(axis);
        pixelToData = function(p) { return r2d(axis.p2r(p - axis._offset)); };
    }
    else if(isVertical) {
        pixelToData = function(p) { return 1 - (p - gs.t) / gs.h; };
    }
    else {
        pixelToData = function(p) { return (p - gs.l) / gs.w; };
    }

    return pixelToData;
};

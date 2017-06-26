/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var constants = require('./constants');

// look for either subplot or xaxis and yaxis attributes
exports.getSubplot = function getSubplot(trace) {
    return trace.subplot || (trace.xaxis + trace.yaxis) || trace.geo;
};

// convenience functions for mapping all relevant axes
exports.flat = function flat(subplots, v) {
    var out = new Array(subplots.length);
    for(var i = 0; i < subplots.length; i++) {
        out[i] = v;
    }
    return out;
};

exports.p2c = function p2c(axArray, v) {
    var out = new Array(axArray.length);
    for(var i = 0; i < axArray.length; i++) {
        out[i] = axArray[i].p2c(v);
    }
    return out;
};

exports.getDistanceFunction = function getDistanceFunction(mode, dx, dy, dxy) {
    if(mode === 'closest') return dxy || quadrature(dx, dy);
    return mode === 'x' ? dx : dy;
};

exports.getClosest = function getClosest(cd, distfn, pointData) {
    // do we already have a point number? (array mode only)
    if(pointData.index !== false) {
        if(pointData.index >= 0 && pointData.index < cd.length) {
            pointData.distance = 0;
        }
        else pointData.index = false;
    }
    else {
        // apply the distance function to each data point
        // this is the longest loop... if this bogs down, we may need
        // to create pre-sorted data (by x or y), not sure how to
        // do this for 'closest'
        for(var i = 0; i < cd.length; i++) {
            var newDistance = distfn(cd[i]);
            if(newDistance <= pointData.distance) {
                pointData.index = i;
                pointData.distance = newDistance;
            }
        }
    }
    return pointData;
};

// for bar charts and others with finite-size objects: you must be inside
// it to see its hover info, so distance is infinite outside.
// But make distance inside be at least 1/4 MAXDIST, and a little bigger
// for bigger bars, to prioritize scatter and smaller bars over big bars
//
// note that for closest mode, two inbox's will get added in quadrature
// args are (signed) difference from the two opposite edges
// count one edge as in, so that over continuous ranges you never get a gap
exports.inbox = function inbox(v0, v1) {
    if(v0 * v1 < 0 || v0 === 0) {
        return constants.MAXDIST * (0.6 - 0.3 / Math.max(3, Math.abs(v0 - v1)));
    }
    return Infinity;
};

function quadrature(dx, dy) {
    return function(di) {
        var x = dx(di),
            y = dy(di);
        return Math.sqrt(x * x + y * y);
    };
}

/** Appends values inside array attributes corresponding to given point number
 *
 * @param {object} pointData : point data object (gets mutated here)
 * @param {object} trace : full trace object
 * @param {number} pointNumber : point number
 */
exports.appendArrayPointValue = function(pointData, trace, pointNumber) {
    var arrayAttrs = trace._arrayAttrs;

    if(!arrayAttrs) {
        return;
    }

    for(var i = 0; i < arrayAttrs.length; i++) {
        var astr = arrayAttrs[i];
        var key;

        if(astr === 'ids') key = 'id';
        else if(astr === 'locations') key = 'location';
        else key = astr;

        if(pointData[key] === undefined) {
            var val = Lib.nestedProperty(trace, astr).get();
            pointData[key] = Array.isArray(pointNumber) ?
                val[pointNumber[0]][pointNumber[1]] :
                val[pointNumber];
        }
    }
};

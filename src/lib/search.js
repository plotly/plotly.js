/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../lib');


/**
 * findBin - find the bin for val - note that it can return outside the
 * bin range any pos. or neg. integer for linear bins, or -1 or
 * bins.length-1 for explicit.
 * bins is either an object {start,size,end} or an array length #bins+1
 * bins can be either increasing or decreasing but must be monotonic
 * for linear bins, we can just calculate. For listed bins, run a binary
 * search linelow (truthy) says the bin boundary should be attributed to
 * the lower bin rather than the default upper bin
 */
exports.findBin = function(val, bins, linelow) {
    if(isNumeric(bins.start)) {
        return linelow ?
            Math.ceil((val - bins.start) / bins.size) - 1 :
            Math.floor((val - bins.start) / bins.size);
    }
    else {
        var n1 = 0,
            n2 = bins.length,
            c = 0,
            n,
            test;
        if(bins[bins.length - 1] >= bins[0]) {
            test = linelow ? lessThan : lessOrEqual;
        } else {
            test = linelow ? greaterOrEqual : greaterThan;
        }
        // c is just to avoid infinite loops if there's an error
        while(n1 < n2 && c++ < 100) {
            n = Math.floor((n1 + n2) / 2);
            if(test(bins[n], val)) n1 = n + 1;
            else n2 = n;
        }
        if(c > 90) Lib.log('Long binary search...');
        return n1 - 1;
    }
};

function lessThan(a, b) { return a < b; }
function lessOrEqual(a, b) { return a <= b; }
function greaterThan(a, b) { return a > b; }
function greaterOrEqual(a, b) { return a >= b; }

exports.sorterAsc = function(a, b) { return a - b; };
exports.sorterDes = function(a, b) { return b - a; };

/**
 * find distinct values in an array, lumping together ones that appear to
 * just be off by a rounding error
 * return the distinct values and the minimum difference between any two
 */
exports.distinctVals = function(valsIn) {
    var vals = valsIn.slice();  // otherwise we sort the original array...
    vals.sort(exports.sorterAsc);

    var l = vals.length - 1,
        minDiff = (vals[l] - vals[0]) || 1,
        errDiff = minDiff / (l || 1) / 10000,
        v2 = [vals[0]];

    for(var i = 0; i < l; i++) {
        // make sure values aren't just off by a rounding error
        if(vals[i + 1] > vals[i] + errDiff) {
            minDiff = Math.min(minDiff, vals[i + 1] - vals[i]);
            v2.push(vals[i + 1]);
        }
    }

    return {vals: v2, minDiff: minDiff};
};

/**
 * return the smallest element from (sorted) array arrayIn that's bigger than val,
 * or (reverse) the largest element smaller than val
 * used to find the best tick given the minimum (non-rounded) tick
 * particularly useful for date/time where things are not powers of 10
 * binary search is probably overkill here...
 */
exports.roundUp = function(val, arrayIn, reverse) {
    var low = 0,
        high = arrayIn.length - 1,
        mid,
        c = 0,
        dlow = reverse ? 0 : 1,
        dhigh = reverse ? 1 : 0,
        rounded = reverse ? Math.ceil : Math.floor;
    // c is just to avoid infinite loops if there's an error
    while(low < high && c++ < 100) {
        mid = rounded((low + high) / 2);
        if(arrayIn[mid] <= val) low = mid + dlow;
        else high = mid - dhigh;
    }
    return arrayIn[low];
};

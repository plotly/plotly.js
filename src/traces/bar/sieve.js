/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = Sieve;

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;

/**
 * Helper class to sieve data from traces into bins
 *
 * @class
 * @param {Array}   traces
 *                  Array of calculated traces
 * @param {boolean} [separateNegativeValues]
 *                  If true, then split data at the same position into a bar
 *                  for positive values and another for negative values
 * @param {boolean} [dontMergeOverlappingData]
 *                  If true, then don't merge overlapping bars into a single bar
 */
function Sieve(traces, separateNegativeValues, dontMergeOverlappingData) {
    this.traces = traces;
    this.separateNegativeValues = separateNegativeValues;
    this.dontMergeOverlappingData = dontMergeOverlappingData;

    var positions = [];
    for(var i = 0; i < traces.length; i++) {
        var trace = traces[i];
        for(var j = 0; j < trace.length; j++) {
            var bar = trace[j];
            if(bar.p !== BADNUM) positions.push(bar.p);
        }
    }
    this.positions = positions;

    var dv = Lib.distinctVals(this.positions);
    this.distinctPositions = dv.vals;
    this.minDiff = dv.minDiff;

    this.binWidth = this.minDiff;

    this.bins = {};
}

/**
 * Sieve datum
 *
 * @method
 * @param {number} position
 * @param {number} value
 * @returns {number} Previous bin value
 */
Sieve.prototype.put = function put(position, value) {
    var label = this.getLabel(position, value),
        oldValue = this.bins[label] || 0;

    this.bins[label] = oldValue + value;

    return oldValue;
};

/**
 * Get current bin value for a given datum
 *
 * @method
 * @param {number} position  Position of datum
 * @param {number} [value]   Value of datum
 *                           (required if this.separateNegativeValues is true)
 * @returns {number} Current bin value
 */
Sieve.prototype.get = function put(position, value) {
    var label = this.getLabel(position, value);
    return this.bins[label] || 0;
};

/**
 * Get bin label for a given datum
 *
 * @method
 * @param {number} position  Position of datum
 * @param {number} [value]   Value of datum
 *                           (required if this.separateNegativeValues is true)
 * @returns {string} Bin label
 * (prefixed with a 'v' if value is negative and this.separateNegativeValues is
 * true; otherwise prefixed with '^')
 */
Sieve.prototype.getLabel = function getLabel(position, value) {
    var prefix = (value < 0 && this.separateNegativeValues) ? 'v' : '^',
        label = (this.dontMergeOverlappingData) ?
            position :
            Math.round(position / this.binWidth);
    return prefix + label;
};

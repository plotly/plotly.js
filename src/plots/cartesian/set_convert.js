/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var FP_SAFE = Lib.FP_SAFE;
var BADNUM = Lib.BADNUM;

var constants = require('./constants');
var cleanDatum = require('./clean_datum');
var axisIds = require('./axis_ids');


/**
 * Define the conversion functions for an axis data is used in 5 ways:
 *
 *  d: data, in whatever form it's provided
 *  c: calcdata: turned into numbers, but not linearized
 *  l: linearized - same as c except for log axes (and other nonlinear
 *      mappings later?) this is used when we need to know if it's
 *      *possible* to show some data on this axis, without caring about
 *      the current range
 *  p: pixel value - mapped to the screen with current size and zoom
 *  r: ranges, tick0, and annotation positions match one of the above
 *     but are handled differently for different types:
 *     - linear and date: data format (d)
 *     - category: calcdata format (c), and will stay that way because
 *       the data format has no continuous mapping
 *     - log: linearized (l) format
 *       TODO: in v2.0 we plan to change it to data format. At that point
 *       shapes will work the same way as ranges, tick0, and annotations
 *       so they can use this conversion too.
 *
 * Creates/updates these conversion functions
 * also clears the autorange bounds ._min and ._max
 * and the autotick constraints ._minDtick, ._forceTick0,
 * and looks for date ranges that aren't yet in numeric format
 */
module.exports = function setConvert(ax) {

    // clipMult: how many axis lengths past the edge do we render?
    // for panning, 1-2 would suffice, but for zooming more is nice.
    // also, clipping can affect the direction of lines off the edge...
    var clipMult = 10;

    function toLog(v, clip) {
        if(v > 0) return Math.log(v) / Math.LN10;

        else if(v <= 0 && clip && ax.range && ax.range.length === 2) {
            // clip NaN (ie past negative infinity) to clipMult axis
            // length past the negative edge
            var r0 = ax.range[0],
                r1 = ax.range[1];
            return 0.5 * (r0 + r1 - 3 * clipMult * Math.abs(r0 - r1));
        }

        else return BADNUM;
    }

    function fromLog(v) {
        return Math.pow(10, v);
    }

    function num(v) {
        if(!isNumeric(v)) return BADNUM;
        v = Number(v);
        if(v < -FP_SAFE || v > FP_SAFE) return BADNUM;
        return isNumeric(v) ? Number(v) : BADNUM;
    }

    function cleanNum(v) {
        v = cleanDatum(v);
        return num(v);
    }

    // normalize date format to date string, in case it starts as
    // a Date object or milliseconds
    function cleanDate(v) {
        if(v.getTime || typeof v === 'number') {
            // NOTE: if someone puts in a year as a number rather than a string,
            // this will mistakenly convert it thinking it's milliseconds from 1970
            // that is: '2012' -> Jan. 1, 2012, but 2012 -> 2012 epoch milliseconds
            return Lib.ms2DateTime(+v);
        }
        else if(!Lib.isDateTime(v)) {
            Lib.error('unrecognized date', v);
        }
        return v;
    }

    ax.c2l = (ax.type === 'log') ? toLog : num;
    ax.l2c = (ax.type === 'log') ? fromLog : num;
    ax.l2d = function(v) { return ax.c2d(ax.l2c(v)); };
    ax.p2d = function(v) { return ax.l2d(ax.p2l(v)); };

    // set scaling to pixels
    ax.setScale = function(usePrivateRange) {
        var gs = ax._gd._fullLayout._size,
            axLetter = ax._id.charAt(0),
            i, dflt;

        if(ax.type === 'date') dflt = constants.DFLTRANGEDATE;
        else if(axLetter === 'y') dflt = constants.DFLTRANGEY;
        else dflt = constants.DFLTRANGEX;

        // TODO cleaner way to handle this case
        if(!ax._categories) ax._categories = [];

        // make sure we have a domain (pull it in from the axis
        // this one is overlaying if necessary)
        if(ax.overlaying) {
            var ax2 = axisIds.getFromId(ax._gd, ax.overlaying);
            ax.domain = ax2.domain;
        }

        // While transitions are occuring, occurring, we get a double-transform
        // issue if we transform the drawn layer *and* use the new axis range to
        // draw the data. This allows us to construct setConvert using the pre-
        // interaction values of the range:
        var rangeAttr = (usePrivateRange && ax._r) ? '_r' : 'range';
        var range = ax[rangeAttr];

        // make sure we have a range (linearized data values)
        // and that it stays away from the limits of javascript numbers
        if(!range || range.length !== 2) {
            ax[rangeAttr] = range = dflt;
        }
        for(i = 0; i < 2; i++) {
            if(ax.type === 'date') {
                if(!Lib.isDateTime(range[i])) {
                    ax[rangeAttr] = range = dflt;
                    break;
                }

                if(range[i] < Lib.MIN_MS) range[i] = Lib.MIN_MS;
                if(range[i] > Lib.MAX_MS) range[i] = Lib.MAX_MS;

                if(range[0] === range[1]) {
                    // split by +/- 1 second
                    range[0] = ax.l2r(ax.r2l(range[0]) - 1000);
                    range[1] = ax.l2r(ax.r2l(range[1]) + 1000);
                    break;
                }
            }
            else {
                if(!isNumeric(range[i])) {
                    if(isNumeric(range[1 - i])) {
                        range[i] = range[1 - i] * (i ? 10 : 0.1);
                    }
                    else {
                        ax[rangeAttr] = range = dflt;
                        break;
                    }
                }

                if(range[i] < -FP_SAFE) range[i] = -FP_SAFE;
                else if(range[i] > FP_SAFE) range[i] = FP_SAFE;

                if(range[0] === range[1]) {
                    var inc = Math.max(1, Math.abs(range[0] * 1e-6));
                    range[0] -= inc;
                    range[1] += inc;
                }
            }
        }

        var rangeLinear = range.map(ax.r2l);

        if(axLetter === 'y') {
            ax._offset = gs.t + (1 - ax.domain[1]) * gs.h;
            ax._length = gs.h * (ax.domain[1] - ax.domain[0]);
            ax._m = ax._length / (rangeLinear[0] - rangeLinear[1]);
            ax._b = -ax._m * rangeLinear[1];
        }
        else {
            ax._offset = gs.l + ax.domain[0] * gs.w;
            ax._length = gs.w * (ax.domain[1] - ax.domain[0]);
            ax._m = ax._length / (rangeLinear[1] - rangeLinear[0]);
            ax._b = -ax._m * rangeLinear[0];
        }

        if(!isFinite(ax._m) || !isFinite(ax._b)) {
            Lib.notifier(
                'Something went wrong with axis scaling',
                'long');
            ax._gd._replotting = false;
            throw new Error('axis scaling');
        }
    };

    ax.l2p = function(v) {
        if(!isNumeric(v)) return BADNUM;

        // include 2 fractional digits on pixel, for PDF zooming etc
        return d3.round(ax._b + ax._m * v, 2);
    };

    ax.p2l = function(px) { return (px - ax._b) / ax._m; };

    ax.c2p = function(v, clip) { return ax.l2p(ax.c2l(v, clip)); };
    ax.p2c = function(px) { return ax.l2c(ax.p2l(px)); };

    if(['linear', 'log', '-'].indexOf(ax.type) !== -1) {
        ax.c2d = num;
        ax.d2c = cleanNum;
        if(ax.type === 'log') {
            ax.d2l = function(v, clip) {
                return ax.c2l(ax.d2c(v), clip);
            };
            ax.d2r = ax.d2l;
            ax.r2d = ax.l2d;
        }
        else {
            ax.d2l = cleanNum;
            ax.d2r = cleanNum;
            ax.r2d = num;
        }
        ax.r2l = num;
        ax.l2r = num;
    }
    else if(ax.type === 'date') {
        ax.c2d = function(v) {
            return isNumeric(v) ? Lib.ms2DateTime(v) : BADNUM;
        };

        ax.d2c = function(v) {
            // NOTE: Changed this behavior: previously we took any numeric value
            // to be a ms, even if it was a string that could be a bare year.
            // Now we convert it as a date if at all possible, and only try
            // as ms if that fails.
            var ms_from_str = Lib.dateTime2ms(v);
            if(ms_from_str === false) {
                if(isNumeric(v)) return Number(v);
                return BADNUM;
            }
            return ms_from_str;
        };

        ax.d2l = ax.d2c;
        ax.r2l = ax.d2c;
        ax.l2r = ax.c2d;
        ax.d2r = Lib.identity; // TODO: do we want this to validate?
        ax.r2d = Lib.identity;

        // check if milliseconds or js date objects are provided for range
        // or tick0 and convert to date strings
        if(ax.range && ax.range.length > 1) {
            ax.range = ax.range.map(cleanDate);
        }
        if(ax.tick0 !== undefined) {
            ax.tick0 = cleanDate(ax.tick0);
        }
    }
    else if(ax.type === 'category') {

        ax.c2d = function(v) {
            return ax._categories[Math.round(v)];
        };

        ax.d2c = function(v) {
            // create the category list
            // this will enter the categories in the order it
            // encounters them, ie all the categories from the
            // first data set, then all the ones from the second
            // that aren't in the first etc.
            // it is assumed that this function is being invoked in the
            // already sorted category order; otherwise there would be
            // a disconnect between the array and the index returned

            if(v !== null && v !== undefined && ax._categories.indexOf(v) === -1) {
                ax._categories.push(v);
            }

            var c = ax._categories.indexOf(v);
            return c === -1 ? BADNUM : c;
        };

        ax.d2l = ax.d2c;
        ax.r2l = num;
        ax.l2r = num;
        ax.d2r = ax.d2c;
        ax.r2d = ax.c2d;
    }

    // makeCalcdata: takes an x or y array and converts it
    // to a position on the axis object "ax"
    // inputs:
    //      tdc - a data object from td.data
    //      axletter - a string, either 'x' or 'y', for which item
    //          to convert (TODO: is this now always the same as
    //          the first letter of ax._id?)
    // in case the expected data isn't there, make a list of
    // integers based on the opposite data
    ax.makeCalcdata = function(tdc, axletter) {
        var arrayIn, arrayOut, i;

        if(axletter in tdc) {
            arrayIn = tdc[axletter];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = ax.d2c(arrayIn[i]);
        }
        else {
            var v0 = ((axletter + '0') in tdc) ?
                    ax.d2c(tdc[axletter + '0']) : 0,
                dv = (tdc['d' + axletter]) ?
                    Number(tdc['d' + axletter]) : 1;

            // the opposing data, for size if we have x and dx etc
            arrayIn = tdc[{x: 'y', y: 'x'}[axletter]];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = v0 + i * dv;
        }
        return arrayOut;
    };

    // for autoranging: arrays of objects:
    //      {val: axis value, pad: pixel padding}
    // on the low and high sides
    ax._min = [];
    ax._max = [];

    // and for bar charts and box plots: reset forced minimum tick spacing
    ax._minDtick = null;
    ax._forceTick0 = null;
};

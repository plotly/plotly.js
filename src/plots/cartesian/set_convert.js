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
var numConstants = require('../../constants/numerical');
var FP_SAFE = numConstants.FP_SAFE;
var BADNUM = numConstants.BADNUM;

var constants = require('./constants');
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
 * Creates/updates these conversion functions, as well as cleaner functions:
 *  ax.d2d and ax.clean2r
 * also clears the autorange bounds ._min and ._max
 * and the autotick constraints ._minDtick, ._forceTick0
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

    ax.c2l = (ax.type === 'log') ? toLog : num;
    ax.l2c = (ax.type === 'log') ? fromLog : num;
    ax.l2d = function(v) { return ax.c2d(ax.l2c(v)); };
    ax.p2d = function(v) { return ax.l2d(ax.p2l(v)); };

    /*
     * fn to make sure range is a couplet of valid & distinct values
     * keep numbers away from the limits of floating point numbers,
     * and dates away from the ends of our date system (+/- 9999 years)
     *
     * optional param rangeAttr: operate on a different attribute, like
     * ax._r, rather than ax.range
     */
    ax.cleanRange = function(rangeAttr) {
        if(!rangeAttr) rangeAttr = 'range';
        var range = ax[rangeAttr],
            axLetter = (ax._id || 'x').charAt(0),
            i, dflt;

        if(ax.type === 'date') dflt = constants.DFLTRANGEDATE;
        else if(axLetter === 'y') dflt = constants.DFLTRANGEY;
        else dflt = constants.DFLTRANGEX;

        // make sure we don't later mutate the defaults
        dflt = dflt.slice();

        if(!range || range.length !== 2) {
            ax[rangeAttr] = dflt;
            return;
        }

        if(ax.type === 'date') {
            // check if milliseconds or js date objects are provided for range
            // and convert to date strings
            range[0] = Lib.cleanDate(range[0]);
            range[1] = Lib.cleanDate(range[1]);
        }

        for(i = 0; i < 2; i++) {
            if(ax.type === 'date') {
                if(!Lib.isDateTime(range[i])) {
                    ax[rangeAttr] = dflt;
                    break;
                }

                if(range[i] < Lib.MIN_MS) range[i] = Lib.MIN_MS;
                if(range[i] > Lib.MAX_MS) range[i] = Lib.MAX_MS;

                if(ax.r2l(range[0]) === ax.r2l(range[1])) {
                    // split by +/- 1 second
                    var linCenter = Lib.constrain(ax.r2l(range[0]),
                        Lib.MIN_MS + 1000, Lib.MAX_MS - 1000);
                    range[0] = ax.l2r(linCenter - 1000);
                    range[1] = ax.l2r(linCenter + 1000);
                    break;
                }
            }
            else {
                if(!isNumeric(range[i])) {
                    if(isNumeric(range[1 - i])) {
                        range[i] = range[1 - i] * (i ? 10 : 0.1);
                    }
                    else {
                        ax[rangeAttr] = dflt;
                        break;
                    }
                }

                if(range[i] < -FP_SAFE) range[i] = -FP_SAFE;
                else if(range[i] > FP_SAFE) range[i] = FP_SAFE;

                if(range[0] === range[1]) {
                    // somewhat arbitrary: split by 1 or 1ppm, whichever is bigger
                    var inc = Math.max(1, Math.abs(range[0] * 1e-6));
                    range[0] -= inc;
                    range[1] += inc;
                }
            }
        }
    };

    // find the range value at the specified (linear) fraction of the axis
    ax.fraction2r = function(v) {
        var rl0 = ax.r2l(ax.range[0]),
            rl1 = ax.r2l(ax.range[1]);
        return ax.l2r(rl0 + v * (rl1 - rl0));
    };

    // find the fraction of the range at the specified range value
    ax.r2fraction = function(v) {
        var rl0 = ax.r2l(ax.range[0]),
            rl1 = ax.r2l(ax.range[1]);
        return (ax.r2l(v) - rl0) / (rl1 - rl0);
    };

    // set scaling to pixels
    ax.setScale = function(usePrivateRange) {
        var gs = ax._gd._fullLayout._size,
            axLetter = ax._id.charAt(0);

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
        ax.cleanRange(rangeAttr);

        var rl0 = ax.r2l(ax[rangeAttr][0]),
            rl1 = ax.r2l(ax[rangeAttr][1]);

        if(axLetter === 'y') {
            ax._offset = gs.t + (1 - ax.domain[1]) * gs.h;
            ax._length = gs.h * (ax.domain[1] - ax.domain[0]);
            ax._m = ax._length / (rl0 - rl1);
            ax._b = -ax._m * rl1;
        }
        else {
            ax._offset = gs.l + ax.domain[0] * gs.w;
            ax._length = gs.w * (ax.domain[1] - ax.domain[0]);
            ax._m = ax._length / (rl1 - rl0);
            ax._b = -ax._m * rl0;
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

    // clip doesn't do anything here yet, but in v2.0 when log axes get
    // refactored it will... so including it now so we don't forget.
    ax.r2p = function(v, clip) { return ax.l2p(ax.r2l(v, clip)); };
    ax.p2r = function(px) { return ax.l2r(ax.p2l(px)); };

    ax.r2c = function(v) { return ax.l2c(ax.r2l(v)); };
    ax.c2r = function(v) { return ax.l2r(ax.c2l(v)); };

    if(['linear', 'log', '-'].indexOf(ax.type) !== -1) {
        ax.c2d = num;
        ax.d2c = Lib.cleanNumber;
        if(ax.type === 'log') {
            ax.d2l = function(v, clip) {
                return ax.c2l(ax.d2c(v), clip);
            };
            ax.d2r = ax.d2l;
            ax.r2d = ax.l2d;
        }
        else {
            ax.d2l = Lib.cleanNumber;
            ax.d2r = Lib.cleanNumber;
            ax.r2d = num;
        }
        ax.r2l = num;
        ax.l2r = num;
    }
    else if(ax.type === 'date') {
        ax.c2d = Lib.ms2DateTime;

        ax.d2c = function(v) {
            // NOTE: Changed this behavior: previously we took any numeric value
            // to be a ms, even if it was a string that could be a bare year.
            // Now we convert it as a date if at all possible, and only try
            // as ms if that fails.
            var ms = Lib.dateTime2ms(v);
            if(ms === BADNUM) {
                if(isNumeric(v)) ms = Number(v);
                else return BADNUM;
            }
            return Lib.constrain(ms, Lib.MIN_MS, Lib.MAX_MS);
        };

        ax.d2l = ax.d2c;
        ax.r2l = ax.d2c;
        ax.l2r = ax.c2d;
        ax.d2r = Lib.identity;
        ax.r2d = Lib.identity;
        ax.cleanr = function(v) {
            /*
             * If v is already a date string this is a noop,  but running it
             * through d2c and back validates the value:
             * normalizes Date objects, milliseconds, and out-of-bounds dates
             * so we always end up with either a clean date string or BADNUM
             */
            return ax.c2d(ax.d2c(v));
        };
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
    //      trace - a data object from gd.data
    //      axLetter - a string, either 'x' or 'y', for which item
    //          to convert (TODO: is this now always the same as
    //          the first letter of ax._id?)
    // in case the expected data isn't there, make a list of
    // integers based on the opposite data
    ax.makeCalcdata = function(trace, axLetter) {
        var arrayIn, arrayOut, i;

        if(axLetter in trace) {
            arrayIn = trace[axLetter];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = ax.d2c(arrayIn[i]);
        }
        else {
            var v0 = ((axLetter + '0') in trace) ?
                    ax.d2c(trace[axLetter + '0']) : 0,
                dv = (trace['d' + axLetter]) ?
                    Number(trace['d' + axLetter]) : 1;

            // the opposing data, for size if we have x and dx etc
            arrayIn = trace[{x: 'y', y: 'x'}[axLetter]];
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
    delete ax._minDtick;
    delete ax._forceTick0;
};

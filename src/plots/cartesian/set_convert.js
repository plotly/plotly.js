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

var constants = require('./constants');
var cleanDatum = require('./clean_datum');
var axisIds = require('./axis_ids');


/**
 * Define the conversion functions for an axis data is used in 4 ways:
 *
 *  d: data, in whatever form it's provided
 *  c: calcdata: turned into numbers, but not linearized
 *  l: linearized - same as c except for log axes (and other
 *      mappings later?) this is used by ranges, and when we
 *      need to know if it's *possible* to show some data on
 *      this axis, without caring about the current range
 *  p: pixel value - mapped to the screen with current size and zoom
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
        if(v>0) return Math.log(v)/Math.LN10;

        else if(v<=0 && clip && ax.range && ax.range.length===2) {
            // clip NaN (ie past negative infinity) to clipMult axis
            // length past the negative edge
            var r0 = ax.range[0],
                r1 = ax.range[1];
            return 0.5*(r0 + r1 - 3 * clipMult * Math.abs(r0 - r1));
        }

        else return constants.BADNUM;
    }
    function fromLog(v) { return Math.pow(10,v); }
    function num(v) { return isNumeric(v) ? Number(v) : constants.BADNUM; }

    ax.c2l = (ax.type==='log') ? toLog : num;
    ax.l2c = (ax.type==='log') ? fromLog : num;
    ax.l2d = function(v) { return ax.c2d(ax.l2c(v)); };
    ax.p2d = function(v) { return ax.l2d(ax.p2l(v)); };

    // set scaling to pixels
    ax.setScale = function() {
        var gs = ax._gd._fullLayout._size,
            i;

        // TODO cleaner way to handle this case
        if(!ax._categories) ax._categories = [];

        // make sure we have a domain (pull it in from the axis
        // this one is overlaying if necessary)
        if(ax.overlaying) {
            var ax2 = axisIds.getFromId(ax._gd, ax.overlaying);
            ax.domain = ax2.domain;
        }

        // make sure we have a range (linearized data values)
        // and that it stays away from the limits of javascript numbers
        if(!ax.range || ax.range.length!==2 || ax.range[0]===ax.range[1]) {
            ax.range = [-1,1];
        }
        for(i=0; i<2; i++) {
            if(!isNumeric(ax.range[i])) {
                ax.range[i] = isNumeric(ax.range[1-i]) ?
                    (ax.range[1-i] * (i ? 10 : 0.1)) :
                    (i ? 1 : -1);
            }

            if(ax.range[i]<-(Number.MAX_VALUE/2)) {
                ax.range[i] = -(Number.MAX_VALUE/2);
            }
            else if(ax.range[i]>Number.MAX_VALUE/2) {
                ax.range[i] = Number.MAX_VALUE/2;
            }

        }

        if(ax._id.charAt(0)==='y') {
            ax._offset = gs.t+(1-ax.domain[1])*gs.h;
            ax._length = gs.h*(ax.domain[1]-ax.domain[0]);
            ax._m = ax._length/(ax.range[0]-ax.range[1]);
            ax._b = -ax._m*ax.range[1];
        }
        else {
            ax._offset = gs.l+ax.domain[0]*gs.w;
            ax._length = gs.w*(ax.domain[1]-ax.domain[0]);
            ax._m = ax._length/(ax.range[1]-ax.range[0]);
            ax._b = -ax._m*ax.range[0];
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
        if(!isNumeric(v)) return constants.BADNUM;

        // include 2 fractional digits on pixel, for PDF zooming etc
        return d3.round(ax._b + ax._m * v, 2);
    };

    ax.p2l = function(px) { return (px-ax._b)/ax._m; };

    ax.c2p = function(v, clip) { return ax.l2p(ax.c2l(v, clip)); };
    ax.p2c = function(px) { return ax.l2c(ax.p2l(px)); };

    if(['linear','log','-'].indexOf(ax.type)!==-1) {
        ax.c2d = num;
        ax.d2c = function(v) {
            v = cleanDatum(v);
            return isNumeric(v) ? Number(v) : constants.BADNUM;
        };
        ax.d2l = function(v, clip) {
            if(ax.type === 'log') return ax.c2l(ax.d2c(v), clip);
            else return ax.d2c(v);
        };
    }
    else if(ax.type==='date') {
        ax.c2d = function(v) {
            return isNumeric(v) ? Lib.ms2DateTime(v) : constants.BADNUM;
        };

        ax.d2c = function(v) {
            return (isNumeric(v)) ? Number(v) : Lib.dateTime2ms(v);
        };

        ax.d2l = ax.d2c;

        // check if date strings or js date objects are provided for range
        // and convert to ms
        if(ax.range && ax.range.length>1) {
            try {
                var ar1 = ax.range.map(Lib.dateTime2ms);
                if(!isNumeric(ax.range[0]) && isNumeric(ar1[0])) {
                    ax.range[0] = ar1[0];
                }
                if(!isNumeric(ax.range[1]) && isNumeric(ar1[1])) {
                    ax.range[1] = ar1[1];
                }
            }
            catch(e) { console.log(e, ax.range); }
        }
    }
    else if(ax.type==='category') {

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
            return c === -1 ? constants.BADNUM : c;
        };

        ax.d2l = ax.d2c;
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
            var v0 = ((axletter+'0') in tdc) ?
                    ax.d2c(tdc[axletter+'0']) : 0,
                dv = (tdc['d'+axletter]) ?
                    Number(tdc['d'+axletter]) : 1;

            // the opposing data, for size if we have x and dx etc
            arrayIn = tdc[{x: 'y',y: 'x'}[axletter]];
            arrayOut = new Array(arrayIn.length);

            for(i = 0; i < arrayIn.length; i++) arrayOut[i] = v0+i*dv;
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

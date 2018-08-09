/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var setConvertCartesian = require('../cartesian/set_convert');

var deg2rad = Lib.deg2rad;
var rad2deg = Lib.rad2deg;
var isFullCircle = Lib.isFullCircle;

/**
 * setConvert for polar axes!
 *
 * @param {object} ax
 *   axis in question (works for both radial and angular axes)
 * @param {object} polarLayout
 *   full polar layout of the subplot associated with 'ax'
 * @param {object} fullLayout
 *   full layout
 *
 * Here, reuse some of the Cartesian setConvert logic,
 * but we must extend some of it, as both radial and angular axes
 * don't have domains and angular axes don't have _true_ ranges.
 *
 * Moreover, we introduce two new coordinate systems:
 * - 'g' for geometric coordinates and
 * - 't' for angular ticks
 *
 * Radial axis coordinate systems flow:
 * - d2c (in calc) just like for cartesian axes
 * - c2g (in plot) translates calcdata about `radialaxis.range[0]`
 *
 * Angular axis coordinate systems flow:
 * + for linear axes:
 *   - d2c (in calc) angles -> 'data' radians
 *   - c2g (in plot) 'data' -> 'geometric' radians (fn of ax rotation & direction)
 *   - t2g (in updateAngularAxis) 'tick' value (in degrees) -> 'geometric' radians
 * + for category axes:
 *   - d2c (in calc) just like for cartesian axes
 *   - c2g (in plot) category indices -> 'geometric' radians
 *   - t2g (in updateAngularAxis) 'tick' value (as category indices) -> 'geometric' radians
 *
 * Then, 'g'eometric data is ready to be converted to (x,y).
 */
module.exports = function setConvert(ax, polarLayout, fullLayout) {
    setConvertCartesian(ax, fullLayout);

    switch(ax._id) {
        case 'x':
        case 'radialaxis':
            setConvertRadial(ax);
            break;
        case 'angular':
        case 'angularaxis':
            setConvertAngular(ax, polarLayout);
            break;
    }
};

function setConvertRadial(ax) {
    ax.setGeometry = function() {
        var rng = ax.range;

        var rFilter = rng[0] > rng[1] ?
            function(v) { return v <= 0; } :
            function(v) { return v >= 0; };

        ax.c2g = function(v) {
            var r = ax.c2r(v) - rng[0];
            return rFilter(r) ? r : 0;
        };

        ax.g2c = function(v) {
            return ax.r2c(v + rng[0]);
        };
    };
}

function toRadians(v, unit) {
    return unit === 'degrees' ? deg2rad(v) : v;
}

function fromRadians(v, unit) {
    return unit === 'degrees' ? rad2deg(v) : v;
}

function setConvertAngular(ax, polarLayout) {
    var axType = ax.type;

    if(axType === 'linear') {
        var _d2c = ax.d2c;
        var _c2d = ax.c2d;

        ax.d2c = function(v, unit) { return toRadians(_d2c(v), unit); };
        ax.c2d = function(v, unit) { return _c2d(fromRadians(v, unit)); };
    }

    // override makeCalcdata to handle thetaunit and special theta0/dtheta logic
    ax.makeCalcdata = function(trace, coord) {
        var arrayIn = trace[coord];
        var len = trace._length;
        var arrayOut, i;

        var _d2c = function(v) { return ax.d2c(v, trace.thetaunit); };

        if(arrayIn) {
            if(Lib.isTypedArray(arrayIn) && axType === 'linear') {
                if(len === arrayIn.length) {
                    return arrayIn;
                } else if(arrayIn.subarray) {
                    return arrayIn.subarray(0, len);
                }
            }

            arrayOut = new Array(len);
            for(i = 0; i < len; i++) {
                arrayOut[i] = _d2c(arrayIn[i]);
            }
        }
        return arrayOut;
    };

    // N.B. we mock the axis 'range' here
    ax.setGeometry = function() {
        var sector = polarLayout.sector;
        var dir = {clockwise: -1, counterclockwise: 1}[ax.direction];
        var rot = deg2rad(ax.rotation);

        ax.rad2g = function(v) { return dir * v + rot; };
        ax.g2rad = function(v) { return (v - rot) / dir; };

        switch(axType) {
            case 'linear':
                ax.c2rad = ax.rad2c = Lib.identity;
                ax.t2rad = deg2rad;
                ax.rad2r = rad2deg;

                // Set the angular range in degrees to make auto-tick computation cleaner,
                // changing rotation/direction should not affect the angular tick value.
                ax.range = isFullCircle(sector) ?
                    sector.slice() :
                    sector.map(deg2rad).map(ax.g2rad).map(rad2deg);
                break;

            case 'category':
                var catLen = ax._categories.length;
                var _period = ax._period = ax.period ? Math.max(ax.period, catLen) : catLen;

                ax.c2rad = ax.t2rad = function(v) { return v * 2 * Math.PI / _period; };
                ax.rad2c = ax.rad2t = function(v) { return v * _period / Math.PI / 2; };

                ax.range = [0, _period];
                break;
        }

        ax.c2g = function(v) { return ax.rad2g(ax.c2rad(v)); };
        ax.g2c = function(v) { return ax.rad2c(ax.g2rad(v)); };

        ax.t2g = function(v) { return ax.rad2g(ax.t2rad(v)); };
        ax.g2t = function(v) { return ax.rad2t(ax.g2rad(v)); };
    };
}

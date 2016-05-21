/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');


// outlier definition based on http://www.physics.csbsju.edu/stats/box2.html
module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        orientation = trace.orientation,
        cd = [],
        valAxis, valLetter, val, valBinned,
        posAxis, posLetter, pos, posDistinct, dPos;

    // Set value (val) and position (pos) keys via orientation
    if(orientation === 'h') {
        valAxis = xa;
        valLetter = 'x';
        posAxis = ya;
        posLetter = 'y';
    } else {
        valAxis = ya;
        valLetter = 'y';
        posAxis = xa;
        posLetter = 'x';
    }

    val = valAxis.makeCalcdata(trace, valLetter);  // get val

    // size autorange based on all source points
    // position happens afterward when we know all the pos
    Axes.expand(valAxis, val, {padded: true});

    // In vertical (horizontal) box plots:
    // if no x (y) data, use x0 (y0), or name
    // so if you want one box
    // per trace, set x0 (y0) to the x (y) value or category for this trace
    // (or set x (y) to a constant array matching y (x))
    function getPos(gd, trace, posLetter, posAxis, val) {
        var pos0;
        if(posLetter in trace) pos = posAxis.makeCalcdata(trace, posLetter);
        else {
            if(posLetter + '0' in trace) pos0 = trace[posLetter + '0'];
            else if('name' in trace && (
                        posAxis.type === 'category' ||
                        (isNumeric(trace.name) &&
                            ['linear', 'log'].indexOf(posAxis.type) !== -1) ||
                        (Lib.isDateTime(trace.name) &&
                         posAxis.type === 'date')
                    )) {
                pos0 = trace.name;
            }
            else pos0 = gd.numboxes;
            pos0 = posAxis.d2c(pos0);
            pos = val.map(function() { return pos0; });
        }
        return pos;
    }

    pos = getPos(gd, trace, posLetter, posAxis, val);

    // get distinct positions and min difference
    var dv = Lib.distinctVals(pos);
    posDistinct = dv.vals;
    dPos = dv.minDiff / 2;

    function binVal(cd, val, pos, posDistinct, dPos) {
        var posDistinctLength = posDistinct.length,
            valLength = val.length,
            valBinned = [],
            bins = [],
            i, p, n, v;

        // store distinct pos in cd, find bins, init. valBinned
        for(i = 0; i < posDistinctLength; ++i) {
            p = posDistinct[i];
            cd[i] = {pos: p};
            bins[i] = p - dPos;
            valBinned[i] = [];
        }
        bins.push(posDistinct[posDistinctLength - 1] + dPos);

        // bin the values
        for(i = 0; i < valLength; ++i) {
            v = val[i];
            if(!isNumeric(v)) continue;
            n = Lib.findBin(pos[i], bins);
            if(n >= 0 && n < valLength) valBinned[n].push(v);
        }

        return valBinned;
    }

    valBinned = binVal(cd, val, pos, posDistinct, dPos);

    // sort the bins and calculate the stats
    function calculateStats(cd, valBinned) {
        var v, l, cdi, i;

        for(i = 0; i < valBinned.length; ++i) {
            v = valBinned[i].sort(Lib.sorterAsc);
            l = v.length;
            cdi = cd[i];

            cdi.val = v;  // put all values into calcdata
            cdi.min = v[0];
            cdi.max = v[l - 1];
            cdi.mean = Lib.mean(v, l);
            cdi.sd = Lib.stdev(v, l, cdi.mean);
            cdi.q1 = Lib.interp(v, 0.25);  // first quartile
            cdi.med = Lib.interp(v, 0.5);  // median
            cdi.q3 = Lib.interp(v, 0.75);  // third quartile
            // lower and upper fences - last point inside
            // 1.5 interquartile ranges from quartiles
            cdi.lf = Math.min(cdi.q1, v[
                Math.min(Lib.findBin(2.5 * cdi.q1 - 1.5 * cdi.q3, v, true) + 1, l - 1)]);
            cdi.uf = Math.max(cdi.q3, v[
                Math.max(Lib.findBin(2.5 * cdi.q3 - 1.5 * cdi.q1, v), 0)]);
            // lower and upper outliers - 3 IQR out (don't clip to max/min,
            // this is only for discriminating suspected & far outliers)
            cdi.lo = 4 * cdi.q1 - 3 * cdi.q3;
            cdi.uo = 4 * cdi.q3 - 3 * cdi.q1;
        }
    }

    calculateStats(cd, valBinned);

    // remove empty bins
    cd = cd.filter(function(cdi) { return cdi.val && cdi.val.length; });
    if(!cd.length) return [{t: {emptybox: true}}];

    // add numboxes and dPos to cd
    cd[0].t = {boxnum: gd.numboxes, dPos: dPos};
    gd.numboxes++;
    return cd;
};

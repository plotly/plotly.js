/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var _ = Lib._;
var Axes = require('../../plots/cartesian/axes');

module.exports = function(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = Axes.getFromId(gd, trace.xaxis);
    var ya = Axes.getFromId(gd, trace.yaxis);
    var cd = [];

    var x = xa.makeCalcdata(trace, 'x');
    var o = ya.makeCalcdata(trace, 'open');
    var h = ya.makeCalcdata(trace, 'high');
    var l = ya.makeCalcdata(trace, 'low');
    var c = ya.makeCalcdata(trace, 'close');

    var hasTextArray = Array.isArray(trace.text);

    for(var i = 0; i < x.length; i++) {
        var xi = x[i];
        var oi = o[i];
        var hi = h[i];
        var li = l[i];
        var ci = c[i];

        if(xi !== undefined && oi !== undefined && hi !== undefined && li !== undefined && ci !== undefined) {
            var increasing = ci >= oi;

            var pt = {
                pos: xi,
                min: li,
                q1: increasing ? oi : ci,
                med: ci,
                q3: increasing ? ci : oi,
                max: hi,
                i: i,
                candle: increasing ? 'increasing' : 'decreasing'
            };

            if(hasTextArray) pt.tx = trace.text[i];

            cd.push(pt);
        }
    }

    Axes.expand(ya, l.concat(h), {padded: true});

    if(cd.length) {
        cd[0].t = {
            num: fullLayout._numBoxes,
            dPos: Lib.distinctVals(x).minDiff / 2,
            posLetter: 'x',
            valLetter: 'y',
            labels: {
                open: _(gd, 'open:') + ' ',
                high: _(gd, 'high:') + ' ',
                low: _(gd, 'low:') + ' ',
                close: _(gd, 'close:') + ' '
            }
        };

        fullLayout._numBoxes++;
        return cd;
    } else {
        return [{t: {empty: true}}];
    }
};

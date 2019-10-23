/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {
    var i, j, k;

    var u = trace.u;
    var v = trace.v;
    var w = trace.w;
    var x = trace.x;
    var y = trace.y;
    var z = trace.z;
    var len = Math.min(x.length, y.length, z.length, u.length, v.length, w.length);

    var slen = 0;
    var startx, starty, startz;
    if(trace.starts) {
        startx = trace.starts.x || [];
        starty = trace.starts.y || [];
        startz = trace.starts.z || [];
        slen = Math.min(startx.length, starty.length, startz.length);
    }

    var normMax = 0;
    var normMin = Infinity;

    for(i = 0; i < len; i++) {
        var uu = u[i];
        var vv = v[i];
        var ww = w[i];
        var norm = Math.sqrt(uu * uu + vv * vv + ww * ww);

        normMax = Math.max(normMax, norm);
        normMin = Math.min(normMin, norm);
    }

    colorscaleCalc(gd, trace, {
        vals: [normMin, normMax],
        containerStr: '',
        cLetter: 'c'
    });

    var xMax = -Infinity;
    var xMin = Infinity;
    var yMax = -Infinity;
    var yMin = Infinity;
    var zMax = -Infinity;
    var zMin = Infinity;

    var gridFill = '';
    var filledX;
    var filledY;
    var filledZ;
    var firstX;
    var firstY;
    var firstZ;
    if(len) {
        firstX = x[0];
        firstY = y[0];
        firstZ = z[0];
    }

    for(i = 0; i < len; i++) {
        xMax = Math.max(xMax, x[i]);
        xMin = Math.min(xMin, x[i]);

        yMax = Math.max(yMax, y[i]);
        yMin = Math.min(yMin, y[i]);

        zMax = Math.max(zMax, z[i]);
        zMin = Math.min(zMin, z[i]);

        if(!filledX && x[i] !== firstX) {
            filledX = true;
            gridFill += 'x';
        }
        if(!filledY && y[i] !== firstY) {
            filledY = true;
            gridFill += 'y';
        }
        if(!filledZ && z[i] !== firstZ) {
            filledZ = true;
            gridFill += 'z';
        }
    }
    // fill if not filled - case of having dimension(s) with one item
    if(!filledX) gridFill += 'x';
    if(!filledY) gridFill += 'y';
    if(!filledZ) gridFill += 'z';

    var Xs = distinctVals(trace.x.slice(0, len));
    var Ys = distinctVals(trace.y.slice(0, len));
    var Zs = distinctVals(trace.z.slice(0, len));

    gridFill = gridFill.replace('x', (x[0] > x[len - 1] ? '-' : '+') + 'x');
    gridFill = gridFill.replace('y', (y[0] > y[len - 1] ? '-' : '+') + 'y');
    gridFill = gridFill.replace('z', (z[0] > z[len - 1] ? '-' : '+') + 'z');

    var empty = function() {
        len = 0;
        Xs = [];
        Ys = [];
        Zs = [];
    };

    // Over-specified mesh case, this would error in tube2mesh
    if(!len || len < Xs.length * Ys.length * Zs.length) empty();

    var getArray = function(c) { return c === 'x' ? x : c === 'y' ? y : z; };
    var getVals = function(c) { return c === 'x' ? Xs : c === 'y' ? Ys : Zs; };
    var getDir = function(c) { return (c[len - 1] < c[0]) ? -1 : 1; };

    var arrK = getArray(gridFill[1]);
    var arrJ = getArray(gridFill[3]);
    var arrI = getArray(gridFill[5]);
    var nk = getVals(gridFill[1]).length;
    var nj = getVals(gridFill[3]).length;
    var ni = getVals(gridFill[5]).length;

    var arbitrary = false;

    var getIndex = function(_i, _j, _k) {
        return nk * (nj * _i + _j) + _k;
    };

    var dirK = getDir(getArray(gridFill[1]));
    var dirJ = getDir(getArray(gridFill[3]));
    var dirI = getDir(getArray(gridFill[5]));

    for(i = 0; i < ni - 1; i++) {
        for(j = 0; j < nj - 1; j++) {
            for(k = 0; k < nk - 1; k++) {
                var q000 = getIndex(i, j, k);
                var q001 = getIndex(i, j, k + 1);
                var q010 = getIndex(i, j + 1, k);
                var q100 = getIndex(i + 1, j, k);

                if(
                    !(arrK[q000] * dirK < arrK[q001] * dirK) ||
                    !(arrJ[q000] * dirJ < arrJ[q010] * dirJ) ||
                    !(arrI[q000] * dirI < arrI[q100] * dirI)
                ) {
                    arbitrary = true;
                }

                if(arbitrary) break;
            }
            if(arbitrary) break;
        }
        if(arbitrary) break;
    }

    if(arbitrary) {
        Lib.warn('Encountered arbitrary coordinates! Unable to input data grid.');
        empty();
    }

    for(i = 0; i < slen; i++) {
        var sx = startx[i];
        xMax = Math.max(xMax, sx);
        xMin = Math.min(xMin, sx);

        var sy = starty[i];
        yMax = Math.max(yMax, sy);
        yMin = Math.min(yMin, sy);

        var sz = startz[i];
        zMax = Math.max(zMax, sz);
        zMin = Math.min(zMin, sz);
    }

    trace._len = len;
    trace._slen = slen;
    trace._normMax = normMax;
    trace._xbnds = [xMin, xMax];
    trace._ybnds = [yMin, yMax];
    trace._zbnds = [zMin, zMax];
    trace._Xs = Xs;
    trace._Ys = Ys;
    trace._Zs = Zs;
    trace._gridFill = gridFill;
};

function distinctVals(col) {
    return Lib.distinctVals(col).vals;
}

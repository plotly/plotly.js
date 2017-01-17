/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function smoothFill2dArray(data, a, b) {
    var i, j, k;
    var ip = [];
    var jp = [];

    var ni = data.length;
    var nj = data[0].length;

    function avgSurrounding(i, j) {
        var sum = 0.0;
        var val;
        var cnt = 0;
        if(i > 0 && (val = data[i - 1][j]) !== undefined) {
            cnt++;
            sum += val;
        }
        if(i < ni - 1 && (val = data[i + 1][j]) !== undefined) {
            cnt++;
            sum += val;
        }
        if(j > 0 && (val = data[i][j - 1]) !== undefined) {
            cnt++;
            sum += val;
        }
        if(j < nj - 1 && (val = data[i][j + 1]) !== undefined) {
            cnt++;
            sum += val;
        }
        return sum / Math.max(1, cnt);
    }

    // Track the maximum magnitude so that we can track error relative
    // to the maximum:
    var dmax = 0.0;
    for(i = 0; i < ni; i++) {
        for(j = 0; j < nj; j++) {
            if(data[i][j] === undefined) {
                ip.push(i);
                jp.push(j);
                data[i][j] = avgSurrounding(i, j);
            }
            dmax = Math.max(dmax, Math.abs(data[i][j]));
        }
    }

    if(!ip.length) return data;

    // The tolerance doesn't need to be excessive. It's just for display positioning
    var dxp, dxm, dap, dam, dbp, dbm, c, d, diff, reldiff;
    var tol = 1e-5;
    var resid = 0;
    var itermax = 100;
    var iter = 0;
    var n = ip.length;
    do {
        resid = 0;
        for(k = 0; k < n; k++) {
            i = ip[k];
            j = jp[k];

            // Note the second-derivative = 0 condition at the edges.
            var contribCnt = 0;
            var newVal = 0;

            var d0, d1, x0, x1, i0, j0;
            if(i === 0) {
                i0 = Math.min(ni - 1, 2);
                x0 = a[i0];
                x1 = a[1];
                d0 = data[i0][j];
                d1 = data[1][j];
                newVal += d1 + (d1 - d0) * (a[0] - x1) / (x1 - x0);
                contribCnt++;
            } else if(i === ni - 1) {
                i0 = Math.max(0, ni - 3);
                x0 = a[i0];
                x1 = a[ni - 2];
                d0 = data[i0][j];
                d1 = data[ni - 2][j];
                newVal += d1 + (d1 - d0) * (a[ni - 1] - x1) / (x1 - x0);
                contribCnt++;
            }

            if((i === 0 || i === ni - 1) && (j > 0 && j < nj - 1)) {
                dxp = b[j + 1] - b[j];
                dxm = b[j] - b[j - 1];
                newVal += (dxm * data[i][j + 1] + dxp * data[i][j - 1]) / (dxm + dxp);
                contribCnt++;
            }

            if(j === 0) {
                j0 = Math.min(nj - 1, 2);
                x0 = b[j0];
                x1 = b[1];
                d0 = data[i][j0];
                d1 = data[i][1];
                newVal += d1 + (d1 - d0) * (b[0] - x1) / (x1 - x0);
                contribCnt++;
            } else if(j === nj - 1) {
                j0 = Math.max(0, nj - 3);
                x0 = b[j0];
                x1 = b[nj - 2];
                d0 = data[i][j0];
                d1 = data[i][nj - 2];
                newVal += d1 + (d1 - d0) * (b[ni - 1] - x1) / (x1 - x0);
                contribCnt++;
            }

            if((j === 0 || j === nj - 1) && (i > 0 && i < ni - 1)) {
                dxp = a[i + 1] - a[i];
                dxm = a[i] - a[i - 1];
                newVal += (dxm * data[i + 1][j] + dxp * data[i - 1][j]) / (dxm + dxp);
                contribCnt++;
            }

            if(!contribCnt) {
                // interior point, so simply average:
                // Get the grid spacing on either side:
                dap = a[i + 1] - a[i];
                dam = a[i] - a[i - 1];
                dbp = b[j + 1] - b[j];
                dbm = b[j] - b[j - 1];
                // Some useful constants:
                c = dap * dam * (dap + dam);
                d = dbp * dbm * (dbp + dbm);

                newVal = (c * (dbm * data[i][j + 1] + dbp * data[i][j - 1]) + d * (dam * data[i + 1][j] + dap * data[i - 1][j])) /
                    (d * (dam + dap) + c * (dbm + dbp));

            } else {
                newVal /= contribCnt;
            }

            diff = newVal - data[i][j];
            reldiff = diff / dmax;
            resid += reldiff * reldiff;

            // Gauss-Seidel-ish iteration, omega chosen based on heuristics and some
            // quick tests.
            //
            // NB: Don't overrelax the boundaries
            data[i][j] += diff * (1 + (contribCnt ? 0 : 0.8));
        }

        resid = Math.sqrt(resid);
    } while(iter++ < itermax && resid > tol);

    Lib.log('Smoother converged to', resid, 'after', iter, 'iterations');

    return data;
};

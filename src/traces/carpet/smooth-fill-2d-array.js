/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function smoothFill2dArray (data) {
    var i, j, k, n;
    var ip = [];
    var jp = [];

    var ni = data.length;
    var nj = data[0].length;

    function avgSurrounding (i, j) {
        var sum = 0.0;
        var val;
        var cnt = 0;
        if (i > 0 && (val = data[i - 1][j]) !== undefined) {
            cnt++;
            sum += val;
        }
        if (i < ni - 1 && (val = data[i + 1][j]) !== undefined) {
            cnt++;
            sum += val;
        }
        if (j > 0 && (val = data[i][j - 1]) !== undefined) {
            cnt++;
            sum += val;
        }
        if (j < nj - 1 && (val = data[i][j + 1]) !== undefined) {
            cnt++;
            sum += val;
        }
        return sum / Math.max(1, cnt);
    }

    // Track the maximum magnitude so that we can track error relative
    // to the maximum:
    var dmax = 0.0;
    for (i = 0; i < ni; i++) {
        for (j = 0; j < nj; j++) {
            if (data[i][j] === undefined) {
                ip.push(i);
                jp.push(j);
                data[i][j] = avgSurrounding(i, j);
            }
            dmax = Math.max(dmax, Math.abs(data[i][j]));
        }
    }

    // The tolerance doesn't need to be too low. It's just for display positioning
    var tol = 1e-6;
    var resid = 0;
    var itermax = 100;
    var iter = 0;
    var n = ip.length;
    do {
        resid = 0;
        for(k = 0; k < n; k++) {
            i = ip[k];
            j = jp[k];

            // Note the second-derivative = 0 condition at the edges. This may seem
            // like overkill, except this is for layout so that pure Neumann conditions
            // (deriv = 0) will just dump all the points on top of one another.
            var boundaryCnt = 0;
            var newVal = 0;

            if (i === 0) {
                newVal += 2.0 * data[1][j] - data[2][j];
                boundaryCnt++;
            } else if (i === ni - 1) {
                newVal += 2.0 * data[ni - 2][j] - data[ni - 3][j];
                boundaryCnt++;
            }

            if (j === 0) {
                newVal += 2.0 * data[i][1] - data[i][2];
                boundaryCnt++;
            } else if (j === ni - 1) {
                newVal += 2.0 * data[i][nj - 2] - data[i][nj - 3];
                boundaryCnt++;
            }

            if (!boundaryCnt) {
                // interior point, so simply average:
                newVal = 0.25 * (
                    data[i - 1][j] +
                    data[i + 1][j] +
                    data[i][j - 1] +
                    data[i][j + 1]
                );
            } else {
                newVal /= boundaryCnt;
            }

            var diff = newVal - data[i][j];
            var reldiff = diff / dmax;
            resid += reldiff * reldiff;

            // Gauss-Seidel-ish iteration, omega chosen based on heuristics and some
            // quick tests.
            //
            // NB: Don't overrelax the boundaries
            data[i][j] += diff * (1 + (boundaryCnt ? 0 : 0.8));
        }

        resid = Math.sqrt(resid);
    } while (iter++ < itermax && resid > tol);

    //console.log('residual is', resid, 'after', iter, 'iterations');

    return data;
}


/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function (arrays, asmoothing, bsmoothing) {
    if (asmoothing && bsmoothing) {
        return function (out, i0, j0, u, v) {
            if (!out) out = [];
            var f0, f1, f2, f3, ak, k;

            // Since it's a grid of control points, the actual indices are * 3:
            i0 *= 3;
            j0 *= 3;

            // Precompute some numbers:
            var u2 = u * u;
            var u3 = u2 * u;
            var ou = 1 - u;
            var ou2 = ou * ou;
            var ou3 = ou2 * ou;

            var v2 = v * v;
            var v3 = v2 * v;
            var ov = 1 - v;
            var ov2 = ov * ov;
            var ov3 = ov2 * ov;

            for (k = 0; k < arrays.length; k++) {
                ak = arrays[k];
                // Compute the derivatives in the u-direction:
                f0 = 3 * ((v2 - 1) * ak[i0    ][j0] + ov2 * ak[i0    ][j0 + 1] + v * (2 - 3 * v) * ak[i0    ][j0 + 2] + v2 * ak[i0    ][j0 + 3]);
                f1 = 3 * ((v2 - 1) * ak[i0 + 1][j0] + ov2 * ak[i0 + 1][j0 + 1] + v * (2 - 3 * v) * ak[i0 + 1][j0 + 2] + v2 * ak[i0 + 1][j0 + 3]);
                f2 = 3 * ((v2 - 1) * ak[i0 + 2][j0] + ov2 * ak[i0 + 2][j0 + 1] + v * (2 - 3 * v) * ak[i0 + 2][j0 + 2] + v2 * ak[i0 + 2][j0 + 3]);
                f3 = 3 * ((v2 - 1) * ak[i0 + 3][j0] + ov2 * ak[i0 + 3][j0 + 1] + v * (2 - 3 * v) * ak[i0 + 3][j0 + 2] + v2 * ak[i0 + 3][j0 + 3]);

                // Now just interpolate in the v-direction since it's all separable:
                out[k] = ou3 * f0 + 3 * (ou2 * u * f1 + ou * u2 * f2) + u3 * f3;
            }

            return out;
        };
    } else if (asmoothing) {
        // Handle smooth in the a-direction but linear in the b-direction by performing four
        // linear interpolations followed by one cubic interpolation of the result
        return function (out, i0, j0, v, u) {
            if (!out) out = [];
            var f0, f1, f2, f3, k, ak;
            i0 *= 3;
            var u2 = u * u;
            var u3 = u2 * u;
            var ou = 1 - u;
            var ou2 = ou * ou;
            var ou3 = ou2 * ou;
            var ov = 1 - v;
            for (k = 0; k < arrays.length; k++) {
                ak = arrays[k];
                f0 = 3 * ((u2 - 1) * ak[i0][j0    ] + ou2 * ak[i0][j0    ] + u * (2 - 3 * u) * ak[i0][j0    ] + u2 * ak[i0][j0    ]);
                f1 = 3 * ((u2 - 1) * ak[i0][j0 + 1] + ou2 * ak[i0][j0 + 1] + u * (2 - 3 * u) * ak[i0][j0 + 1] + u2 * ak[i0][j0 + 1]);

                out[k] = ov * f0 + v * f1;
            }
            return out;
        };
    } else if (bsmoothing) {
        // Same as the above case, except reversed:
        return function (out, i0, j0, u, v) {
            if (!out) out = [];
            var f0, f1, f2, f3, k, ak;
            j0 *= 3;
            var v2 = v * v;
            var ov = 1 - v;
            var ov2 = ov * ov;
            var ou = 1 - u;
            for (k = 0; k < arrays.length; k++) {
                ak = arrays[k];
                f0 = 3 * ((v2 - 1) * ak[i0    ][j0] + ov2 * ak[i0    ][j0 + 1] + v * (2 - 3 * v) * ak[i0    ][j0 + 2] + v2 * ak[i0    ][j0 + 3]);
                f1 = 3 * ((v2 - 1) * ak[i0 + 1][j0] + ov2 * ak[i0 + 1][j0 + 1] + v * (2 - 3 * v) * ak[i0 + 1][j0 + 2] + v2 * ak[i0 + 1][j0 + 3]);

                out[k] = ou * f0 + u * f1;
            }
            return out;
        };
    } else {
        // Finally, both directions are linear:
        return function (out, i0, j0, v, u) {
            if (!out) out = [];
            var f0, f1, k, ak;
            var ov = 1 - v;
            for (k = 0; k < arrays.length; k++) {
                ak = arrays[k];
                f0 = ak[i0 + 1][j0] - ak[i0][j0];
                f1 = ak[i0 + 1][j0 + 1] - ak[i0][j0 + 1];

                out[k] = ov * f0 + v * f1;
            }
            return out;
        };
    }

}

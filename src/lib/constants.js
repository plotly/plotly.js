/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    /**
     * Standardize all missing data in calcdata to use undefined
     * never null or NaN.
     * That way we can use !==undefined, or !== BADNUM,
     * to test for real data
     */
    BADNUM: undefined,

    /*
     * Limit certain operations to well below floating point max value
     * to avoid glitches: Make sure that even when you multiply it by the
     * number of pixels on a giant screen it still works
     */
    FP_SAFE: Number.MAX_VALUE / 10000
};

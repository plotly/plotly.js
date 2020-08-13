/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function handlePeriodDefaults(traceIn, traceOut, layout, coerce, opts) {
    if(!opts) {
        opts = {
            x: true,
            y: true
        };
    }

    if(opts.x) {
        var xperiodalignment = coerce('xperiodalignment');
        if(xperiodalignment !== 'start') {
            coerce('xperiod');
        }
    }

    if(opts.y) {
        var yperiodalignment = coerce('yperiodalignment');
        if(yperiodalignment !== 'start') {
            coerce('yperiod');
        }
    }
};

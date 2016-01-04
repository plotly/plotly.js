/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function handleBinDefaults(traceIn, traceOut, coerce, binDirections) {
    coerce('histnorm');

    binDirections.forEach(function(binDirection) {
        // data being binned - note that even though it's a little weird,
        // it's possible to have bins without data, if there's inferred data
        var binstrt = coerce(binDirection + 'bins.start'),
            binend = coerce(binDirection + 'bins.end'),
            autobin = coerce('autobin' + binDirection, !(binstrt && binend));

        if(autobin) coerce('nbins' + binDirection);
        else coerce(binDirection + 'bins.size');
    });

    return traceOut;
};

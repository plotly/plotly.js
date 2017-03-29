/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


module.exports = function handleBinDefaults(traceIn, traceOut, coerce, binDirections) {
    coerce('histnorm');

    binDirections.forEach(function(binDirection) {
        /*
         * Because date axes have string values for start and end,
         * and string options for size, we cannot validate these attributes
         * now. We will do this during calc (immediately prior to binning)
         * in ./clean_bins, and push the cleaned values back to _fullData.
         */
        coerce(binDirection + 'bins.start');
        coerce(binDirection + 'bins.end');
        coerce(binDirection + 'bins.size');
        coerce('autobin' + binDirection);
        coerce('nbins' + binDirection);
    });

    return traceOut;
};

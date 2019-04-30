/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

var BADNUM = require('../../constants/numerical').BADNUM;
var axisIds = require('../../plots/cartesian/axis_ids');
var Lib = require('../../lib');

var attributes = require('./attributes');

var BINDIRECTIONS = ['x', 'y'];

// Handle bin attrs and relink auto-determined values so fullData is complete
// does not have cross-trace coupling, but moved out here so we have axis types
// and relinked trace._autoBin
module.exports = function crossTraceDefaults(fullData, fullLayout) {
    var i, j, traceOut, binDirection;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    for(i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];
        var type = traceOut.type;
        if(type !== 'histogram2d' && type !== 'histogram2dcontour') continue;

        for(j = 0; j < BINDIRECTIONS.length; j++) {
            binDirection = BINDIRECTIONS[j];
            var binAttr = binDirection + 'bins';
            var autoBins = (traceOut._autoBin || {})[binDirection] || {};
            coerce(binAttr + '.start', autoBins.start);
            coerce(binAttr + '.end', autoBins.end);
            coerce(binAttr + '.size', autoBins.size);

            cleanBins(traceOut, binDirection, fullLayout, autoBins);

            if(!(traceOut[binAttr] || {}).size) coerce('nbins' + binDirection);
        }
    }
};

function cleanBins(trace, binDirection, fullLayout, autoBins) {
    var ax = fullLayout[axisIds.id2name(trace[binDirection + 'axis'])];
    var axType = ax.type;
    var binAttr = binDirection + 'bins';
    var bins = trace[binAttr];
    var calendar = trace[binDirection + 'calendar'];

    if(!bins) bins = trace[binAttr] = {};

    var cleanBound = (axType === 'date') ?
        function(v, dflt) { return (v || v === 0) ? Lib.cleanDate(v, BADNUM, calendar) : dflt; } :
        function(v, dflt) { return isNumeric(v) ? Number(v) : dflt; };

    bins.start = cleanBound(bins.start, autoBins.start);
    bins.end = cleanBound(bins.end, autoBins.end);

    // logic for bin size is very similar to dtick (cartesian/tick_value_defaults)
    // but without the extra string options for log axes
    // ie the only strings we accept are M<n> for months
    var sizeDflt = autoBins.size;
    var binSize = bins.size;

    if(isNumeric(binSize)) {
        bins.size = (binSize > 0) ? Number(binSize) : sizeDflt;
    } else if(typeof binSize !== 'string') {
        bins.size = sizeDflt;
    } else {
        // date special case: "M<n>" gives bins every (integer) n months
        var prefix = binSize.charAt(0);
        var sizeNum = binSize.substr(1);

        sizeNum = isNumeric(sizeNum) ? Number(sizeNum) : 0;
        if((sizeNum <= 0) || !(
                axType === 'date' && prefix === 'M' && sizeNum === Math.round(sizeNum)
            )) {
            bins.size = sizeDflt;
        }
    }
}

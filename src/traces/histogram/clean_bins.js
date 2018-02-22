/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';
var isNumeric = require('fast-isnumeric');
var cleanDate = require('../../lib').cleanDate;
var constants = require('../../constants/numerical');
var ONEDAY = constants.ONEDAY;
var BADNUM = constants.BADNUM;

/*
 * cleanBins: validate attributes autobin[xy] and [xy]bins.(start, end, size)
 * Mutates trace so all these attributes are valid.
 *
 * Normally this kind of thing would happen during supplyDefaults, but
 * in this case we need to know the axis type, and axis type isn't set until
 * after trace supplyDefaults are completed. So this gets called during the
 * calc step, when data are inserted into bins.
 */
module.exports = function cleanBins(trace, ax, binDirection) {
    var axType = ax.type,
        binAttr = binDirection + 'bins',
        bins = trace[binAttr];

    if(!bins) bins = trace[binAttr] = {};

    var cleanBound = (axType === 'date') ?
        function(v) { return (v || v === 0) ? cleanDate(v, BADNUM, bins.calendar) : null; } :
        function(v) { return isNumeric(v) ? Number(v) : null; };

    bins.start = cleanBound(bins.start);
    bins.end = cleanBound(bins.end);

    // logic for bin size is very similar to dtick (cartesian/tick_value_defaults)
    // but without the extra string options for log axes
    // ie the only strings we accept are M<n> for months
    var sizeDflt = (axType === 'date') ? ONEDAY : 1,
        binSize = bins.size;

    if(isNumeric(binSize)) {
        bins.size = (binSize > 0) ? Number(binSize) : sizeDflt;
    }
    else if(typeof binSize !== 'string') {
        bins.size = sizeDflt;
    }
    else {
        // date special case: "M<n>" gives bins every (integer) n months
        var prefix = binSize.charAt(0),
            sizeNum = binSize.substr(1);

        sizeNum = isNumeric(sizeNum) ? Number(sizeNum) : 0;
        if((sizeNum <= 0) || !(
                axType === 'date' && prefix === 'M' && sizeNum === Math.round(sizeNum)
            )) {
            bins.size = sizeDflt;
        }
    }

    var autoBinAttr = 'autobin' + binDirection;

    if(typeof trace[autoBinAttr] !== 'boolean') {
        trace[autoBinAttr] = trace._fullInput[autoBinAttr] = trace._input[autoBinAttr] = !(
            (bins.start || bins.start === 0) &&
            (bins.end || bins.end === 0)
        );
    }

    if(!trace[autoBinAttr]) {
        delete trace['nbins' + binDirection];
        delete trace._fullInput['nbins' + binDirection];
    }
};

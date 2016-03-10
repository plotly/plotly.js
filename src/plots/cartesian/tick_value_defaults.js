/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var layoutAttributes = require('./layout_attributes');

module.exports = function handleTickValueDefaults(containerIn, containerOut, coerce, axType) {
    var tickmodeDefault = 'auto';

    if(containerIn.tickmode === 'array' &&
            (axType === 'log' || axType === 'date')) {
        containerIn.tickmode = 'auto';
    }

    if(Array.isArray(containerIn.tickvals)) tickmodeDefault = 'array';
    else if(containerIn.dtick && isNumeric(containerIn.dtick)) {
        tickmodeDefault = 'linear';
    }
    var tickmode = coerce('tickmode', tickmodeDefault);
    
    if(tickmode === 'auto') {
        var nticks = coerce('nticks');
        
        //Only use tickpadding if tickmode is 'auto' and the user doesn't specify nticks
        if(nticks === layoutAttributes.nticks.dflt) {
            coerce('tickpadding');
        }
        else {
            containerOut.tickpadding = layoutAttributes.tickpadding.dflt;
        }
    }
    else if(tickmode === 'linear') {
        coerce('tick0');
        coerce('dtick');
    }
    else {
        var tickvals = coerce('tickvals');
        if(tickvals === undefined) containerOut.tickmode = 'auto';
        else coerce('ticktext');
    }
};

/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

function _supply(layoutIn, layoutOut, fullData, coerce, traceType) {
    var i, trace;

    var category = traceType + 'Layout';
    var hasTraceType = false;
    var tracesWithGroupAttrs = [];

    for(i = 0; i < fullData.length; i++) {
        trace = fullData[i];

        if(Registry.traceIs(trace, category)) {
            hasTraceType = true;

            if(trace.alignmentgroup || trace.offsetgroup) {
                tracesWithGroupAttrs.push(trace);
            }
        }
    }
    if(!hasTraceType) return;

    var mode = coerce(traceType + 'mode');
    coerce(traceType + 'gap');
    coerce(traceType + 'groupgap');

    if(mode !== 'group') {
        for(i = 0; i < tracesWithGroupAttrs.length; i++) {
            trace = tracesWithGroupAttrs[i];
            delete trace.alignmentgroup;
            delete trace.offsetgroup;
        }
    }
}

function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }
    _supply(layoutIn, layoutOut, fullData, coerce, 'box');
}

module.exports = {
    supplyLayoutDefaults: supplyLayoutDefaults,
    _supply: _supply
};

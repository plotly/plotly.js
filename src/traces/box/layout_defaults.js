/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');

function _supply(layoutIn, layoutOut, fullData, coerce, prefix) {
    var hasBoxes;
    for(var i = 0; i < fullData.length; i++) {
        if(Registry.traceIs(fullData[i], 'box')) {
            hasBoxes = true;
            break;
        }
    }
    if(!hasBoxes) return;

    coerce(prefix + 'mode');
    coerce(prefix + 'gap');
    coerce(prefix + 'groupgap');
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

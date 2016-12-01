/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var constants = require('./constants');
var handleXYDefaults = require('./xy_defaults');
var handleABDefaults = require('./ab_defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('carpetid');

    var len = handleXYDefaults(traceIn, traceOut, coerce);

    if (!len) {
        traceOut.visible = false;
        return;
    }

    handleABDefaults(traceIn, traceOut, coerce);

    coerce('cheaterslope');
};

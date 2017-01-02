/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var handleOHLC = require('../ohlc/ohlc_defaults');
var handleDirectionDefaults = require('../ohlc/direction_defaults');
var helpers = require('../ohlc/helpers');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    helpers.pushDummyTransformOpts(traceIn, traceOut);

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleOHLC(traceIn, traceOut, coerce, layout);
    if(len === 0) {
        traceOut.visible = false;
        return;
    }

    coerce('line.width');

    handleDirection(traceIn, traceOut, coerce, 'increasing');
    handleDirection(traceIn, traceOut, coerce, 'decreasing');

    coerce('text');
    coerce('whiskerwidth');
};

function handleDirection(traceIn, traceOut, coerce, direction) {
    handleDirectionDefaults(traceIn, traceOut, coerce, direction);

    coerce(direction + '.line.color');
    coerce(direction + '.line.width', traceOut.line.width);
    coerce(direction + '.fillcolor');
}

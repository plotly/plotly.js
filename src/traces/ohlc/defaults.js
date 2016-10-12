/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var handleOHLC = require('./ohlc_defaults');
var handleDirectionDefaults = require('./direction_defaults');
var attributes = require('./attributes');
var helpers = require('./helpers');

module.exports = function supplyDefaults(traceIn, traceOut) {
    helpers.pushDummyTransformOpts(traceIn, traceOut);

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleOHLC(traceIn, traceOut, coerce);
    if(len === 0) {
        traceOut.visible = false;
        return;
    }

    coerce('line.width');
    coerce('line.dash');

    handleDirection(traceIn, traceOut, coerce, 'increasing');
    handleDirection(traceIn, traceOut, coerce, 'decreasing');

    coerce('text');
    coerce('tickwidth');
};

function handleDirection(traceIn, traceOut, coerce, direction) {
    handleDirectionDefaults(traceIn, traceOut, coerce, direction);

    coerce(direction + '.line.color');
    coerce(direction + '.line.width', traceOut.line.width);
    coerce(direction + '.line.dash', traceOut.line.dash);
}

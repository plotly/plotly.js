/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var OHLCattrs = require('../ohlc/attributes');
var boxAttrs = require('../box/attributes');

var directionAttrs = {
    visible: {
        valType: 'enumerated',
        values: [true, false, 'legendonly'],
        role: 'info',
        dflt: true,
        description: [

        ].join(' ')
    },

    color: Lib.extendFlat({}, boxAttrs.line.color),
    width: Lib.extendFlat({}, boxAttrs.line.width),
    fillcolor: Lib.extendFlat({}, boxAttrs.fillcolor),
    tickwidth: Lib.extendFlat({}, boxAttrs.whiskerwidth, { dflt: 0 }),
};

module.exports = {
    t: OHLCattrs.t,
    open: OHLCattrs.open,
    high: OHLCattrs.high,
    low: OHLCattrs.low,
    close: OHLCattrs.close,

    increasing: Lib.extendDeep({}, directionAttrs, {
        color: { dflt: 'green' }
    }),

    decreasing: Lib.extendDeep({}, directionAttrs, {
        color: { dflt: 'red' }
    }),

    text: OHLCattrs.text
};

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
    name: OHLCattrs.increasing.name,
    showlegend: OHLCattrs.increasing.showlegend,

    line: {
        color: Lib.extendFlat({}, boxAttrs.line.color),
        width: Lib.extendFlat({}, boxAttrs.line.width)
    },

    fillcolor: Lib.extendFlat({}, boxAttrs.fillcolor),
};

module.exports = {
    x: OHLCattrs.x,
    open: OHLCattrs.open,
    high: OHLCattrs.high,
    low: OHLCattrs.low,
    close: OHLCattrs.close,

    line: {
        width: Lib.extendFlat({}, boxAttrs.line.width, {
            description: [
                boxAttrs.line.width.description,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.width` and',
                '`decreasing.line.width`.'
            ].join(' ')
        })
    },

    increasing: Lib.extendDeep({}, directionAttrs, {
        line: { color: { dflt: OHLCattrs.increasing.line.color.dflt } }
    }),

    decreasing: Lib.extendDeep({}, directionAttrs, {
        line: { color: { dflt: OHLCattrs.decreasing.line.color.dflt } }
    }),

    text: OHLCattrs.text,
    whiskerwidth: Lib.extendFlat({}, boxAttrs.whiskerwidth, { dflt: 0 })
};

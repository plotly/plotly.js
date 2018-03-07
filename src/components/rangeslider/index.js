/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attrs = require('./attributes');
var oppAxisAttrs = require('./oppaxis_attributes');

module.exports = {
    moduleType: 'component',
    name: 'rangeslider',

    schema: {
        subplots: {
            xaxis: {
                rangeslider: Lib.extendFlat({}, attrs, {
                    yaxis: oppAxisAttrs
                })
            }
        }
    },

    layoutAttributes: require('./attributes'),
    handleDefaults: require('./defaults'),
    calcAutorange: require('./calc_autorange'),
    draw: require('./draw')
};

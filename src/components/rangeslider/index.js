'use strict';

var Lib = require('../../lib');
var attrs = require('./attributes');
var oppAxisAttrs = require('./oppaxis_attributes');
var helpers = require('./helpers');

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
    draw: require('./draw'),
    isVisible: helpers.isVisible,
    makeData: helpers.makeData,
    autoMarginOpts: helpers.autoMarginOpts
};

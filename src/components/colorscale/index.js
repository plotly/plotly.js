'use strict';

var scales = require('./scales');
var helpers = require('./helpers');

module.exports = {
    moduleType: 'component',
    name: 'colorscale',

    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),

    supplyLayoutDefaults: require('./layout_defaults'),
    handleDefaults: require('./defaults'),
    crossTraceDefaults: require('./cross_trace_defaults'),

    calc: require('./calc'),

    // ./scales.js is required in lib/coerce.js ;
    // it needs to be a separate module to avoid a circular dependency
    scales: scales.scales,
    defaultScale: scales.defaultScale,
    getScale: scales.get,
    isValidScale: scales.isValid,

    hasColorscale: helpers.hasColorscale,
    extractOpts: helpers.extractOpts,
    extractScale: helpers.extractScale,
    flipScale: helpers.flipScale,
    makeColorScaleFunc: helpers.makeColorScaleFunc,
    makeColorScaleFuncFromTrace: helpers.makeColorScaleFuncFromTrace
};

'use strict';

var handleAutorangeOptionsDefaults = require('./autorange_options_defaults');

module.exports = function handleRangeDefaults(containerIn, containerOut, coerce, options) {
    var axTemplate = containerOut._template || {};
    var axType = containerOut.type || axTemplate.type || '-';

    coerce('minallowed');
    coerce('maxallowed');

    var range = coerce('range');
    var autorangeDflt = containerOut.getAutorangeDflt(range, options);
    var autorange = coerce('autorange', autorangeDflt);

    var shouldAutorange;

    // validate range and set autorange true for invalid partial ranges
    if(range && (
        (range[0] === null && range[1] === null) ||
        ((range[0] === null || range[1] === null) && (autorange === 'reversed' || autorange === true)) ||
        (range[0] !== null && (autorange === 'min' || autorange === 'max reversed')) ||
        (range[1] !== null && (autorange === 'max' || autorange === 'min reversed'))
    )) {
        range = undefined;
        delete containerOut.range;
        containerOut.autorange = true;
        shouldAutorange = true;
    }

    if(!shouldAutorange) {
        autorangeDflt = containerOut.getAutorangeDflt(range, options);
        autorange = coerce('autorange', autorangeDflt);
    }

    if(autorange) {
        handleAutorangeOptionsDefaults(coerce, autorange, range);
        if(axType === 'linear' || axType === '-') coerce('rangemode');
    }

    containerOut.cleanRange();
};

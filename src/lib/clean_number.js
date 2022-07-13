'use strict';

var isNumeric = require('fast-isnumeric');

var BADNUM = require('../constants/numerical').BADNUM;

// precompile for speed
var JUNK = /^['"%,$#\s']+|[, ]|['"%,$#\s']+$/g;

/**
 * cleanNumber: remove common leading and trailing cruft
 * Always returns either a number or BADNUM.
 */
module.exports = function cleanNumber(v) {
    if(typeof v === 'string') {
        v = v.replace(JUNK, '');
    }

    if(isNumeric(v)) return Number(v);

    return BADNUM;
};

'use strict';

var wrap = require('../../lib/gup').wrap;

module.exports = function calc() {
    // we don't actually need to include the trace here, since that will be added
    // by Plots.doCalcdata, and that's all we actually need later.
    return wrap({});
};

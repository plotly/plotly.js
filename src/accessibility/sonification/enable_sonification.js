'use strict';

var c2mPlotly = require('../accessibility/sonification');

function enable_sonification(gd) {
    // Collecting defaults
    var defaultConfig = gd._context.sonification;
    c2mPlotly.initC2M(gd, defaultConfig);
}
exports.enable_sonification = enable_sonification;

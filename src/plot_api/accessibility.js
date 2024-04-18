'use strict';

var c2mPlotly = require('../accessibility/c2m');

function enable(gd) {
    // Collecting defaults
    var defaultConfig = gd._context.accessibility;

    if(defaultConfig.library === 'chart2music') {
        c2mPlotly.initC2M(gd, defaultConfig);
    } else {
        // User has some bunk configuration values, what do we do here?
        return;
    }
}
exports.enable = enable;

'use strict';

var Lib = require('../../lib');

var layoutAttributes = require('./layout_attributes');


/**
 * options: inherits outerTicks from axes.handleAxisDefaults
 */
module.exports = function handleTickDefaults(containerIn, containerOut, coerce, options) {
    var tickLen = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'ticklen');
    var tickWidth = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickwidth');
    var tickColor = Lib.coerce2(containerIn, containerOut, layoutAttributes, 'tickcolor', containerOut.color);
    var showTicks = coerce('ticks', (options.outerTicks || tickLen || tickWidth || tickColor) ? 'outside' : '');

    if(!showTicks) {
        delete containerOut.ticklen;
        delete containerOut.tickwidth;
        delete containerOut.tickcolor;
    }
};

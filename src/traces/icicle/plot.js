'use strict';

var draw = require('../treemap/draw');
var drawDescendants = require('./draw_descendants');

module.exports = function _plot(gd, cdmodule, transitionOpts, makeOnCompleteCallback) {
    return draw(gd, cdmodule, transitionOpts, makeOnCompleteCallback, {
        type: 'icicle',
        drawDescendants: drawDescendants
    });
};

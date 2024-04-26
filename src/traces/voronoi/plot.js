'use strict';

var draw = require('./draw');
var drawDescendants = require('./draw_descendants');

module.exports = function _plot(gd, cdmodule, transitionOpts, makeOnCompleteCallback) {
    return draw(gd, cdmodule, transitionOpts, makeOnCompleteCallback, {
        type: 'treemap',
        drawDescendants: drawDescendants
    });
};

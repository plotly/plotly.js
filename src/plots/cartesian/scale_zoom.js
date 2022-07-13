'use strict';

var FROM_BL = require('../../constants/alignment').FROM_BL;

module.exports = function scaleZoom(ax, factor, centerFraction) {
    if(centerFraction === undefined) {
        centerFraction = FROM_BL[ax.constraintoward || 'center'];
    }

    var rangeLinear = [ax.r2l(ax.range[0]), ax.r2l(ax.range[1])];
    var center = rangeLinear[0] + (rangeLinear[1] - rangeLinear[0]) * centerFraction;

    ax.range = ax._input.range = [
        ax.l2r(center + (rangeLinear[0] - center) * factor),
        ax.l2r(center + (rangeLinear[1] - center) * factor)
    ];
    ax.setScale();
};

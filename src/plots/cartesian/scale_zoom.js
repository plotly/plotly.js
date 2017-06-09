/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function scaleZoom(ax, factor, centerFraction) {
    if(centerFraction === undefined) centerFraction = 0.5;

    var rangeLinear = [ax.r2l(ax.range[0]), ax.r2l(ax.range[1])];
    var center = rangeLinear[0] + (rangeLinear[1] - rangeLinear[0]) * centerFraction;
    var newHalfSpan = (center - rangeLinear[0]) * factor;

    ax.range = ax._input.range = [
        ax.l2r(center - newHalfSpan),
        ax.l2r(center + newHalfSpan)
    ];
};

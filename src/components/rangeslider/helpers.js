/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var constants = require('./constants');
var name = constants.name;

function isVisible(ax) {
    var rangeSlider = ax && ax[name];
    return rangeSlider && rangeSlider.visible;
}
exports.isVisible = isVisible;

exports.makeData = function(fullLayout) {
    var axes = Axes.list({ _fullLayout: fullLayout }, 'x', true);
    var margin = fullLayout.margin;
    var rangeSliderData = [];

    if(!fullLayout._has('gl2d')) {
        for(var i = 0; i < axes.length; i++) {
            var ax = axes[i];

            if(isVisible(ax)) {
                rangeSliderData.push(ax);

                var opts = ax[name];
                opts._id = name + ax._id;
                opts._height = (fullLayout.height - margin.b - margin.t) * opts.thickness;
                opts._offsetShift = Math.floor(opts.borderwidth / 2);
            }
        }
    }

    fullLayout._rangeSliderData = rangeSliderData;
};

exports.autoMarginOpts = function(gd, ax) {
    var opts = ax[name];

    var oppBottom = Infinity;
    var subplotData = Axes.getSubplots(gd, ax);
    for(var j = 0; j < subplotData.length; j++) {
        var subplotj = subplotData[j];
        var oppAxis = Axes.getFromId(gd, subplotj.substr(subplotj.indexOf('y')));
        oppBottom = Math.min(oppBottom, oppAxis.domain[0]);
    }

    var tickHeight = (ax.side === 'bottom' && ax._boundingBox.height) || 0;

    return {
        x: 0,
        y: oppBottom,
        l: 0,
        r: 0,
        t: 0,
        b: opts._height + gd._fullLayout.margin.b + tickHeight,
        pad: constants.extraPad + opts._offsetShift * 2
    };
};

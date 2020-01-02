/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var axisIDs = require('../../plots/cartesian/axis_ids');
var svgTextUtils = require('../../lib/svg_text_utils');
var constants = require('./constants');
var LINE_SPACING = require('../../constants/alignment').LINE_SPACING;
var name = constants.name;

function isVisible(ax) {
    var rangeSlider = ax && ax[name];
    return rangeSlider && rangeSlider.visible;
}
exports.isVisible = isVisible;

exports.makeData = function(fullLayout) {
    var axes = axisIDs.list({ _fullLayout: fullLayout }, 'x', true);
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
    var fullLayout = gd._fullLayout;
    var opts = ax[name];
    var axLetter = ax._id.charAt(0);

    var bottomDepth = 0;
    var titleHeight = 0;
    if(ax.side === 'bottom') {
        bottomDepth = ax._depth;
        if(ax.title.text !== fullLayout._dfltTitle[axLetter]) {
            // as in rangeslider/draw.js
            titleHeight = 1.5 * ax.title.font.size + 10 + opts._offsetShift;
            // multi-line extra bump
            var extraLines = (ax.title.text.match(svgTextUtils.BR_TAG_ALL) || []).length;
            titleHeight += extraLines * ax.title.font.size * LINE_SPACING;
        }
    }

    return {
        x: 0,
        y: ax._counterDomainMin,
        l: 0,
        r: 0,
        t: 0,
        b: opts._height + bottomDepth + Math.max(fullLayout.margin.b, titleHeight),
        pad: constants.extraPad + opts._offsetShift * 2
    };
};

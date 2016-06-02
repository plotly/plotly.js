/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var colorMix = require('tinycolor2').mix;

var Lib = require('../../../lib');

var layoutAttributes = require('./axis_attributes');
var handleAxisDefaults = require('../../cartesian/axis_defaults');

var axesNames = ['xaxis', 'yaxis', 'zaxis'];
var noop = function() {};

// TODO: hard-coded lightness fraction based on gridline default colors
// that differ from other subplot types.
var gridLightness = 100 * (204 - 0x44) / (255 - 0x44);

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, options) {
    var containerIn, containerOut;

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    for(var j = 0; j < axesNames.length; j++) {
        var axName = axesNames[j];
        containerIn = layoutIn[axName] || {};

        containerOut = {
            _id: axName[0] + options.scene,
            _name: axName
        };

        layoutOut[axName] = containerOut = handleAxisDefaults(
            containerIn,
            containerOut,
            coerce, {
                font: options.font,
                letter: axName[0],
                data: options.data,
                showGrid: true,
                bgColor: options.bgColor
            });

        coerce('gridcolor', colorMix(containerOut.color, options.bgColor, gridLightness).toRgbString());
        coerce('title', axName[0]);  // shouldn't this be on-par with 2D?

        containerOut.setScale = noop;

        if(coerce('showspikes')) {
            coerce('spikesides');
            coerce('spikethickness');
            coerce('spikecolor', containerOut.color);
        }

        coerce('showaxeslabels');
        if(coerce('showbackground')) coerce('backgroundcolor');
    }
};

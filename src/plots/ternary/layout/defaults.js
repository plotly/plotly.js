/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Color = require('../../components/color');

var handleSubplotDefaults = require('../../subplot_defaults');
var layoutAttributes = require('./layout_attributes');
var handleAxisDefaults = require('./axis_defaults');

var axesNames = ['aaxis', 'baxis', 'caxis'];

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    if(!layoutOut._hasTernary) return;

    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'ternary',
        attributes: layoutAttributes,
        handleDefaults: handleTernaryDefaults,
        font: layoutOut.font,
        paper_bgcolor: layoutOut.paper_bgcolor
    });
};

function handleTernaryDefaults(ternaryLayoutIn, ternaryLayoutOut, coerce, options) {
    var bgColor = coerce('bgcolor');
    coerce('sum');
    options.bgColor = Color.combine(bgColor, options.paper_bgcolor);
    var axName, containerIn, containerOut;

    for(var j = 0; j < axesNames.length; j++) {
        axName = axesNames[j];
        containerIn = ternaryLayoutIn[axName] || {};
        containerOut = {_name: axName};

        handleAxisDefaults(containerIn, containerOut, options);
    }
}

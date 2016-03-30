/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Color = require('../../../components/color');

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
    var sum = coerce('sum');
    options.bgColor = Color.combine(bgColor, options.paper_bgcolor);
    var axName, containerIn, containerOut;

    // TODO: allow most (if not all) axis attributes to be set
    // in the outer container and used as defaults in the individual axes?

    for(var j = 0; j < axesNames.length; j++) {
        axName = axesNames[j];
        containerIn = ternaryLayoutIn[axName] || {};
        containerOut = ternaryLayoutOut[axName] = {_name: axName};

        handleAxisDefaults(containerIn, containerOut, options);
    }

    // if the min values contradict each other, set them all to default (0)
    // and delete *all* the inputs so the user doesn't get confused later by
    // changing one and having them all change.
    var aaxis = ternaryLayoutOut.aaxis,
        baxis = ternaryLayoutOut.baxis,
        caxis = ternaryLayoutOut.caxis;
    if(aaxis.min + baxis.min + caxis.min >= sum) {
        aaxis.min = 0;
        baxis.min = 0;
        caxis.min = 0;
        if(ternaryLayoutIn.aaxis) delete ternaryLayoutIn.aaxis.min;
        if(ternaryLayoutIn.baxis) delete ternaryLayoutIn.baxis.min;
        if(ternaryLayoutIn.caxis) delete ternaryLayoutIn.caxis.min;
    }
}

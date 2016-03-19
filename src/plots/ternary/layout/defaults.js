/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var handleSubplotDefaults = require('../../subplot_defaults');
var layoutAttributes = require('./layout_attributes');
var supplyTernaryAxisLayoutDefaults = require('./axis_defaults');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    if(!layoutOut._hasTernary) return;

    handleSubplotDefaults(layoutIn, layoutOut, fullData, {
        type: 'ternary',
        attributes: layoutAttributes,
        handleDefaults: handleTernaryDefaults,
        font: layoutOut.font
    });
};

function handleTernaryDefaults(ternaryLayoutIn, ternaryLayoutOut, coerce, options) {
    coerce('bgcolor');
    coerce('sum');

    supplyTernaryAxisLayoutDefaults(ternaryLayoutIn, ternaryLayoutOut, options);
}

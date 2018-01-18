/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterPolarAttrs = require('../scatterpolar/attributes');
var scatterGlAttrs = require('../scattergl/attributes');

module.exports = {
    mode: scatterPolarAttrs.mode,
    r: scatterPolarAttrs.r,
    theta: scatterPolarAttrs.theta,
    thetaunit: scatterPolarAttrs.thetaunit,

    text: scatterPolarAttrs.text,
    // no hovertext

    line: scatterGlAttrs.line,
    connectgaps: scatterGlAttrs.connectgaps,

    marker: scatterGlAttrs.marker,
    // no cliponaxis

    fill: scatterGlAttrs.fill,
    fillcolor: scatterGlAttrs.fillcolor,

    hoverinfo: scatterPolarAttrs.hoverinfo,
    hoveron: scatterPolarAttrs.hoveron,

    selected: scatterPolarAttrs.selected,
    unselected: scatterPolarAttrs.unselected
};

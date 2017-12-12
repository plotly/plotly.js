/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterGl = require('../scattergl');
var ScatterPolar = require('../scatterpolar');

function calc(gd, trace) {
    var cd = ScatterPolar.calc(gd, trace);

    trace.x = cd.map(function(d) { return cd.x; });
    trace.y = cd.map(function(d) { return cd.y; });

    trace.error_x = {};
    trace.error_y = {};

    return ScatterGl.calc(gd, trace);
}

function plot(container, subplot, cdata) {

    console.log(container.xaxis, container.yaxis)


    ScatterGl.plot(container, subplot, cdata);
}

module.exports = {
    moduleType: 'trace',
    name: 'scatterpolargl',
    basePlotModule: require('../../plots/polar'),
    categories: ['gl', 'regl', 'polar', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'],

    // TODO scatterpolargl won't support text
    // should have its own attributes and defaults
    attributes: require('../scatterpolar/attributes'),
    supplyDefaults: require('../scatterpolar/defaults'),

    calc: calc,
    plot: plot,
    style: ScatterGl.style,
    hoverPoints: ScatterGl.hoverPoints,
    selectPoints: ScatterGl.selectPoints,

    meta: {
        hrName: 'scatter_polar_gl',
        description: [
            '!!! GL VERSION OF SCATTERPOLAR !!!',

            'The scatterpolar trace type encompasses line charts, scatter charts, text charts, and bubble charts.',
            'in polar coordinates.',
            'The data visualized as scatter point or lines is set in',
            '`r` (radial) and `theta` (angular). coordintes',
            'Text (appearing either on the chart or on hover only) is via `text`.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to numerical arrays.'
        ].join(' ')
    }
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var axesAttrs = require('../../cartesian/layout_attributes');
var extendFlat = require('../../../lib/extend').extendFlat;


module.exports = {
    title: axesAttrs.title,
    titlefont: axesAttrs.titlefont,
    color: axesAttrs.color,
    // ticks
    tickmode: axesAttrs.tickmode,
    nticks: extendFlat({}, axesAttrs.nticks, {dflt: 6, min: 1}),
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    tickvals: axesAttrs.tickvals,
    ticktext: axesAttrs.ticktext,
    ticks: axesAttrs.ticks,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    showtickprefix: axesAttrs.showtickprefix,
    tickprefix: axesAttrs.tickprefix,
    showticksuffix: axesAttrs.showticksuffix,
    ticksuffix: axesAttrs.ticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    separatethousands: axesAttrs.separatethousands,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    tickformat: axesAttrs.tickformat,
    hoverformat: axesAttrs.hoverformat,
    // lines and grids
    showline: extendFlat({}, axesAttrs.showline, {dflt: true}),
    linecolor: axesAttrs.linecolor,
    linewidth: axesAttrs.linewidth,
    showgrid: extendFlat({}, axesAttrs.showgrid, {dflt: true}),
    gridcolor: axesAttrs.gridcolor,
    gridwidth: axesAttrs.gridwidth,
    // range
    min: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        min: 0,
        description: [
            'The minimum value visible on this axis.',
            'The maximum is determined by the sum minus the minimum',
            'values of the other two axes. The full view corresponds to',
            'all the minima set to zero.'
        ].join(' ')
    }
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var axesAttrs = require('../../cartesian/layout_attributes');
var colorAttrs = require('../../components/color/attributes');
var extendFlat = require('../../../lib/extend').extendFlat;


module.exports = {
    title: axesAttrs.title,
    titlefont: axesAttrs.titlefont,
    color: {  // TODO: support this for all other kinds of axes as well
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        role: 'style',
        description: [
            'Sets line, font, tick, and grid color for this axis',
            'all at once. Individual pieces can override this.'
        ].join(' ')
    },
    // ticks
    nticks: axesAttrs.nticks,
    ticks: axesAttrs.ticks,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    // lines and grids
    showline: extendFlat({}, axesAttrs.showline, {dflt: true}),
    linecolor: axesAttrs.linecolor,
    linewidth: axesAttrs.linewidth,
    showgrid: axesAttrs.showgrid,
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

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
    showspikes: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Sets whether or not spikes starting from',
            'data points to this axis\' wall are shown on hover.'
        ].join(' ')
    },
    spikesides: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Sets whether or not spikes extending from the',
            'projection data points to this axis\' wall boundaries',
            'are shown on hover.'
        ].join(' ')
    },
    spikethickness: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 2,
        description: 'Sets the thickness (in px) of the spikes.'
    },
    spikecolor: {
        valType: 'color',
        role: 'style',
        dflt: 'rgb(0,0,0)',
        description: 'Sets the color of the spikes.'
    },
    showbackground: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Sets whether or not this axis\' wall',
            'has a background color.'
        ].join(' ')
    },
    backgroundcolor: {
        valType: 'color',
        role: 'style',
        dflt: 'rgba(204, 204, 204, 0.5)',
        description: 'Sets the background color of this axis\' wall.'
    },
    showaxeslabels: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: 'Sets whether or not this axis is labeled'
    },
    title: axesAttrs.title,
    titlefont: axesAttrs.titlefont,
    type: axesAttrs.type,
    autorange: axesAttrs.autorange,
    rangemode: axesAttrs.rangemode,
    range: axesAttrs.range,
    fixedrange: axesAttrs.fixedrange,
    // ticks
    tickmode: axesAttrs.tickmode,
    nticks: axesAttrs.nticks,
    tick0: axesAttrs.tick0,
    dtick: axesAttrs.dtick,
    tickvals: axesAttrs.tickvals,
    ticktext: axesAttrs.ticktext,
    ticks: axesAttrs.ticks,
    mirror: axesAttrs.mirror,
    ticklen: axesAttrs.ticklen,
    tickwidth: axesAttrs.tickwidth,
    tickcolor: axesAttrs.tickcolor,
    showticklabels: axesAttrs.showticklabels,
    tickfont: axesAttrs.tickfont,
    tickangle: axesAttrs.tickangle,
    tickprefix: axesAttrs.tickprefix,
    showtickprefix: axesAttrs.showtickprefix,
    ticksuffix: axesAttrs.ticksuffix,
    showticksuffix: axesAttrs.showticksuffix,
    showexponent: axesAttrs.showexponent,
    exponentformat: axesAttrs.exponentformat,
    tickformat: axesAttrs.tickformat,
    hoverformat: axesAttrs.hoverformat,
    // lines and grids
    showline: axesAttrs.showline,
    linecolor: axesAttrs.linecolor,
    linewidth: axesAttrs.linewidth,
    showgrid: axesAttrs.showgrid,
    gridcolor: extendFlat({}, axesAttrs.gridcolor,  // shouldn't this be on-par with 2D?
        {dflt: 'rgb(204, 204, 204)'}),
    gridwidth: axesAttrs.gridwidth,
    zeroline: axesAttrs.zeroline,
    zerolinecolor: axesAttrs.zerolinecolor,
    zerolinewidth: axesAttrs.zerolinewidth
};

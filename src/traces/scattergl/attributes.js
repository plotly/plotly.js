/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var plotAttrs = require('../../plots/attributes');
var scatterAttrs = require('../scatter/attributes');
var colorAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var DASHES = require('./constants').DASHES;

var scatterLineAttrs = scatterAttrs.line;
var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var attrs = module.exports = overrideAll({
    x: scatterAttrs.x,
    x0: scatterAttrs.x0,
    dx: scatterAttrs.dx,
    y: scatterAttrs.y,
    y0: scatterAttrs.y0,
    dy: scatterAttrs.dy,

    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (x,y) pair to appear on hover.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (x,y) coordinates.'
        ].join(' ')
    }),
    hovertext: scatterAttrs.hovertext,

    textposition: scatterAttrs.textposition,
    textfont: scatterAttrs.textfont,

    mode: {
        valType: 'flaglist',
        flags: ['lines', 'markers', 'text'],
        extras: ['none'],
        role: 'info',
        description: [
            'Determines the drawing mode for this scatter trace.'
        ].join(' ')
    },
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: {
            valType: 'enumerated',
            values: Object.keys(DASHES),
            dflt: 'solid',
            role: 'style',
            description: 'Sets the style of the lines.'
        }
    },
    marker: extendFlat({}, colorAttrs('marker'), {
        symbol: scatterMarkerAttrs.symbol,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        opacity: scatterMarkerAttrs.opacity,
        colorbar: scatterMarkerAttrs.colorbar,
        line: extendFlat({}, colorAttrs('marker.line'), {
            width: scatterMarkerLineAttrs.width
        })
    }),
    connectgaps: scatterAttrs.connectgaps,
    fill: scatterAttrs.fill,
    fillcolor: scatterAttrs.fillcolor,

    hoveron: scatterAttrs.hoveron,

    selected: {
        marker: scatterAttrs.selected.marker,
        textfont: scatterAttrs.selected.textfont
    },
    unselected: {
        marker: scatterAttrs.unselected.marker,
        textfont: scatterAttrs.unselected.textfont
    },

    opacity: plotAttrs.opacity

}, 'calc', 'nested');

attrs.x.editType = attrs.y.editType = attrs.x0.editType = attrs.y0.editType = 'calc+clearAxisTypes';

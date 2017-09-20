/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var colorAttributes = require('../../components/colorscale/color_attributes');

var DASHES = require('../../constants/gl2d_dashes');
var MARKERS = require('../../constants/gl2d_markers');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

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
    mode: {
        valType: 'flaglist',
        flags: ['lines', 'markers'],
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
    marker: extendFlat({}, colorAttributes('marker'), {
        symbol: {
            valType: 'enumerated',
            values: Object.keys(MARKERS),
            dflt: 'circle',
            arrayOk: true,
            role: 'style',
            description: 'Sets the marker symbol type.'
        },
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        opacity: scatterMarkerAttrs.opacity,
        showscale: scatterMarkerAttrs.showscale,
        colorbar: scatterMarkerAttrs.colorbar,
        line: extendFlat({}, colorAttributes('marker.line'), {
            width: scatterMarkerLineAttrs.width
        })
    }),
    connectgaps: scatterAttrs.connectgaps,
    fill: extendFlat({}, scatterAttrs.fill, {
        values: ['none', 'tozeroy', 'tozerox']
    }),
    fillcolor: scatterAttrs.fillcolor,

    error_y: scatterAttrs.error_y,
    error_x: scatterAttrs.error_x
}, 'calc', 'nested');

attrs.x.editType = attrs.y.editType = attrs.x0.editType = attrs.y0.editType = 'calc+clearAxisTypes';

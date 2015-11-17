/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


var scatterAttrs = require('../scatter/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var scatterLineAttrs = scatterAttrs.line;

module.exports = {
    _composedModules: {  // composed module coupling
        'contour': 'Heatmap',
        'histogram2dcontour': 'Heatmap'
    },
    autocontour: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
        description: [
            'Determines whether of not the contour level attributes at',
            'picked by an algorithm.',
            'If *true*, the number of contour levels can be set in `ncontours`.',
            'If *false*, set the contour level attributes in `contours`.'
        ].join(' ')
    },
    ncontours: {
        valType: 'integer',
        dflt: 0,
        role: 'style',
        description: 'Sets the number of contour levels.'
    },
    contours: {
        start: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: 'Sets the starting contour level value.'
        },
        end: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: 'Sets the end contour level value.'
        },
        size: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: 'Sets the step between each contour level.'
        },
        coloring: {
            valType: 'enumerated',
            values: ['fill', 'heatmap', 'lines', 'none'],
            dflt: 'fill',
            role: 'style',
            description: [
                'Determines the coloring method showing the contour values.',
                'If *fill*, coloring is done evenly between each contour level',
                'If *heatmap*, a heatmap gradient is coloring is applied',
                'between each contour level.',
                'If *lines*, coloring is done on the contour lines.',
                'If *none*, no coloring is applied on this trace.'
            ].join(' ')
        },
        showlines: {
            valType: 'boolean',
            dflt: true,
            role: 'style',
            description: [
                'Determines whether or not the contour lines are drawn.',
                'Has only an effect if `contours.coloring` is set to *fill*.'
            ].join(' ')
        }
    },
    line: {
        color: extendFlat({}, scatterLineAttrs.color, {
            description: [
                'Sets the color of the contour level.',
                'Has no if `contours.coloring` is set to *lines*.'
            ].join(' ')
        }),
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash,
        smoothing: extendFlat({}, scatterLineAttrs.smoothing, {
            description: [
                'Sets the amount of smoothing for the contour lines,',
                'where *0* corresponds to no smoothing.'
            ].join(' ')
        })
    }
};


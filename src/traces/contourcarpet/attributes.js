/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var heatmapAttrs = require('../heatmap/attributes');
var contourAttrs = require('../contour/attributes');
var contourContourAttrs = contourAttrs.contours;
var scatterAttrs = require('../scatter/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var scatterLineAttrs = scatterAttrs.line;
var constants = require('./constants');

module.exports = extendFlat({}, {
    carpet: {
        valType: 'string',
        role: 'info',
        editType: 'calc',
        description: [
            'The `carpet` of the carpet axes on which this contour trace lies'
        ].join(' ')
    },
    z: heatmapAttrs.z,
    a: heatmapAttrs.x,
    a0: heatmapAttrs.x0,
    da: heatmapAttrs.dx,
    b: heatmapAttrs.y,
    b0: heatmapAttrs.y0,
    db: heatmapAttrs.dy,
    text: heatmapAttrs.text,
    transpose: heatmapAttrs.transpose,
    atype: heatmapAttrs.xtype,
    btype: heatmapAttrs.ytype,

    mode: {
        valType: 'flaglist',
        flags: ['lines', 'fill'],
        extras: ['none'],
        role: 'info',
        editType: 'calc',
        description: ['The mode.'].join(' ')
    },

    connectgaps: heatmapAttrs.connectgaps,

    fillcolor: {
        valType: 'color',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the fill color.',
            'Defaults to a half-transparent variant of the line color,',
            'marker color, or marker line color, whichever is available.'
        ].join(' ')
    },

    autocontour: contourAttrs.autocontour,
    ncontours: contourAttrs.ncontours,

    contours: {
        type: {
            valType: 'enumerated',
            values: ['levels', 'constraint'],
            dflt: 'levels',
            role: 'info',
            editType: 'calc',
            description: [
                'If `levels`, the data is represented as a contour plot with multiple',
                'levels displayed. If `constraint`, the data is represented as constraints',
                'with the invalid region shaded as specified by the `operation` and',
                '`value` parameters.'
            ].join(' ')
        },
        start: contourContourAttrs.start,
        end: contourContourAttrs.end,
        size: contourContourAttrs.size,
        coloring: {
            // from contourAttrs.contours.coloring but no 'heatmap' option
            valType: 'enumerated',
            values: ['fill', 'lines', 'none'],
            dflt: 'fill',
            role: 'style',
            editType: 'calc',
            description: [
                'Determines the coloring method showing the contour values.',
                'If *fill*, coloring is done evenly between each contour level',
                'If *lines*, coloring is done on the contour lines.',
                'If *none*, no coloring is applied on this trace.'
            ].join(' ')
        },
        showlines: contourContourAttrs.showlines,
        showlabels: contourContourAttrs.showlabels,
        labelfont: contourContourAttrs.labelfont,
        labelformat: contourContourAttrs.labelformat,
        operation: {
            valType: 'enumerated',
            values: [].concat(constants.INEQUALITY_OPS).concat(constants.INTERVAL_OPS).concat(constants.SET_OPS),
            role: 'info',
            dflt: '=',
            editType: 'calc',
            description: [
                'Sets the filter operation.',

                '*=* keeps items equal to `value`',

                '*<* keeps items less than `value`',
                '*<=* keeps items less than or equal to `value`',

                '*>* keeps items greater than `value`',
                '*>=* keeps items greater than or equal to `value`',

                '*[]* keeps items inside `value[0]` to value[1]` including both bounds`',
                '*()* keeps items inside `value[0]` to value[1]` excluding both bounds`',
                '*[)* keeps items inside `value[0]` to value[1]` including `value[0]` but excluding `value[1]',
                '*(]* keeps items inside `value[0]` to value[1]` excluding `value[0]` but including `value[1]',

                '*][* keeps items outside `value[0]` to value[1]` and equal to both bounds`',
                '*)(* keeps items outside `value[0]` to value[1]`',
                '*](* keeps items outside `value[0]` to value[1]` and equal to `value[0]`',
                '*)[* keeps items outside `value[0]` to value[1]` and equal to `value[1]`'
            ].join(' ')
        },
        value: {
            valType: 'any',
            dflt: 0,
            role: 'info',
            editType: 'calc',
            description: [
                'Sets the value or values by which to filter by.',

                'Values are expected to be in the same type as the data linked',
                'to *target*.',

                'When `operation` is set to one of the inequality values',
                '(' + constants.INEQUALITY_OPS + ')',
                '*value* is expected to be a number or a string.',

                'When `operation` is set to one of the interval value',
                '(' + constants.INTERVAL_OPS + ')',
                '*value* is expected to be 2-item array where the first item',
                'is the lower bound and the second item is the upper bound.',

                'When `operation`, is set to one of the set value',
                '(' + constants.SET_OPS + ')',
                '*value* is expected to be an array with as many items as',
                'the desired set elements.'
            ].join(' ')
        },
        editType: 'calc'
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
        }),
        editType: 'plot'
    }
},
    colorscaleAttrs,
    { autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale, {dflt: false}) },
    { colorbar: colorbarAttrs }
);

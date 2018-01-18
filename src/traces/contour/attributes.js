/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var heatmapAttrs = require('../heatmap/attributes');
var scatterAttrs = require('../scatter/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var dash = require('../../components/drawing/attributes').dash;
var fontAttrs = require('../../plots/font_attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var filterOps = require('../../constants/filter_ops');
var COMPARISON_OPS2 = filterOps.COMPARISON_OPS2;
var INTERVAL_OPS = filterOps.INTERVAL_OPS;
var SET_OPS = filterOps.SET_OPS;

var scatterLineAttrs = scatterAttrs.line;

module.exports = extendFlat({
    z: heatmapAttrs.z,
    x: heatmapAttrs.x,
    x0: heatmapAttrs.x0,
    dx: heatmapAttrs.dx,
    y: heatmapAttrs.y,
    y0: heatmapAttrs.y0,
    dy: heatmapAttrs.dy,
    text: heatmapAttrs.text,
    transpose: heatmapAttrs.transpose,
    xtype: heatmapAttrs.xtype,
    ytype: heatmapAttrs.ytype,
    zhoverformat: heatmapAttrs.zhoverformat,

    connectgaps: heatmapAttrs.connectgaps,

    autocontour: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
        editType: 'calc',
        impliedEdits: {
            'contours.start': undefined,
            'contours.end': undefined,
            'contours.size': undefined
        },
        description: [
            'Determines whether or not the contour level attributes are',
            'picked by an algorithm.',
            'If *true*, the number of contour levels can be set in `ncontours`.',
            'If *false*, set the contour level attributes in `contours`.'
        ].join(' ')
    },
    ncontours: {
        valType: 'integer',
        dflt: 15,
        min: 1,
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the maximum number of contour levels. The actual number',
            'of contours will be chosen automatically to be less than or',
            'equal to the value of `ncontours`.',
            'Has an effect only if `autocontour` is *true* or if',
            '`contours.size` is missing.'
        ].join(' ')
    },

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
        start: {
            valType: 'number',
            dflt: null,
            role: 'style',
            editType: 'plot',
            impliedEdits: {'^autocontour': false},
            description: [
                'Sets the starting contour level value.',
                'Must be less than `contours.end`'
            ].join(' ')
        },
        end: {
            valType: 'number',
            dflt: null,
            role: 'style',
            editType: 'plot',
            impliedEdits: {'^autocontour': false},
            description: [
                'Sets the end contour level value.',
                'Must be more than `contours.start`'
            ].join(' ')
        },
        size: {
            valType: 'number',
            dflt: null,
            min: 0,
            role: 'style',
            editType: 'plot',
            impliedEdits: {'^autocontour': false},
            description: [
                'Sets the step between each contour level.',
                'Must be positive.'
            ].join(' ')
        },
        coloring: {
            valType: 'enumerated',
            values: ['fill', 'heatmap', 'lines', 'none'],
            dflt: 'fill',
            role: 'style',
            editType: 'calc',
            description: [
                'Determines the coloring method showing the contour values.',
                'If *fill*, coloring is done evenly between each contour level',
                'If *heatmap*, a heatmap gradient coloring is applied',
                'between each contour level.',
                'If *lines*, coloring is done on the contour lines.',
                'If *none*, no coloring is applied on this trace.'
            ].join(' ')
        },
        showlines: {
            valType: 'boolean',
            dflt: true,
            role: 'style',
            editType: 'plot',
            description: [
                'Determines whether or not the contour lines are drawn.',
                'Has an effect only if `contours.coloring` is set to *fill*.'
            ].join(' ')
        },
        showlabels: {
            valType: 'boolean',
            dflt: false,
            role: 'style',
            editType: 'plot',
            description: [
                'Determines whether to label the contour lines with their values.'
            ].join(' ')
        },
        labelfont: fontAttrs({
            editType: 'plot',
            colorEditType: 'style',
            description: [
                'Sets the font used for labeling the contour levels.',
                'The default color comes from the lines, if shown.',
                'The default family and size come from `layout.font`.'
            ].join(' '),
        }),
        labelformat: {
            valType: 'string',
            dflt: '',
            role: 'style',
            editType: 'plot',
            description: [
                'Sets the contour label formatting rule using d3 formatting',
                'mini-language which is very similar to Python, see:',
                'https://github.com/d3/d3-format/blob/master/README.md#locale_format.'
            ].join(' ')
        },
        operation: {
            valType: 'enumerated',
            values: [].concat(COMPARISON_OPS2).concat(INTERVAL_OPS).concat(SET_OPS),
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

                'When `operation` is set to one of the comparison values',
                '(' + COMPARISON_OPS2 + ')',
                '*value* is expected to be a number or a string.',

                'When `operation` is set to one of the interval value',
                '(' + INTERVAL_OPS + ')',
                '*value* is expected to be 2-item array where the first item',
                'is the lower bound and the second item is the upper bound.',

                'When `operation`, is set to one of the set value',
                '(' + SET_OPS + ')',
                '*value* is expected to be an array with as many items as',
                'the desired set elements.'
            ].join(' ')
        },
        editType: 'calc',
        impliedEdits: {'autocontour': false}
    },

    line: {
        color: extendFlat({}, scatterLineAttrs.color, {
            editType: 'style+colorbars',
            description: [
                'Sets the color of the contour level.',
                'Has no effect if `contours.coloring` is set to *lines*.'
            ].join(' ')
        }),
        width: extendFlat({}, scatterLineAttrs.width, {
            editType: 'style+colorbars'
        }),
        dash: dash,
        smoothing: extendFlat({}, scatterLineAttrs.smoothing, {
            description: [
                'Sets the amount of smoothing for the contour lines,',
                'where *0* corresponds to no smoothing.'
            ].join(' ')
        }),
        editType: 'plot'
    }
},
    colorscaleAttrs, {
        autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale, {dflt: false}),
        zmin: extendFlat({}, colorscaleAttrs.zmin, {editType: 'calc'}),
        zmax: extendFlat({}, colorscaleAttrs.zmax, {editType: 'calc'})
    },
    { colorbar: colorbarAttrs }
);

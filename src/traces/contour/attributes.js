/**
* Copyright 2012-2017, Plotly, Inc.
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
var extendFlat = require('../../lib/extend').extendFlat;

var scatterLineAttrs = scatterAttrs.line;

module.exports = extendFlat({}, {
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

    connectgaps: heatmapAttrs.connectgaps,

    autocontour: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
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
        description: [
            'Sets the maximum number of contour levels. The actual number',
            'of contours will be chosen automatically to be less than or',
            'equal to the value of `ncontours`.',
            'Has an effect only if `autocontour` is *true* or if',
            '`contours.size` is missing.'
        ].join(' ')
    },

    contours: {
        start: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: [
                'Sets the starting contour level value.',
                'Must be less than `contours.end`'
            ].join(' ')
        },
        end: {
            valType: 'number',
            dflt: null,
            role: 'style',
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
        dash: dash,
        smoothing: extendFlat({}, scatterLineAttrs.smoothing, {
            description: [
                'Sets the amount of smoothing for the contour lines,',
                'where *0* corresponds to no smoothing.'
            ].join(' ')
        })
    }
},
    colorscaleAttrs, {
        autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale, {dflt: false}),
        zmin: extendFlat({}, colorscaleAttrs.zmin, {editType: 'docalc'}),
        zmax: extendFlat({}, colorscaleAttrs.zmax, {editType: 'docalc'})
    },
    { colorbar: colorbarAttrs }
);

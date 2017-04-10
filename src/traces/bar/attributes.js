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
var errorBarAttrs = require('../../components/errorbars/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var fontAttrs = require('../../plots/font_attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var extendDeep = require('../../lib/extend').extendDeep;

var textFontAttrs = extendDeep({}, fontAttrs);
textFontAttrs.family.arrayOk = true;
textFontAttrs.size.arrayOk = true;
textFontAttrs.color.arrayOk = true;

var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var markerLineWidth = extendFlat({},
    scatterMarkerLineAttrs.width, { dflt: 0 });

var markerLine = extendFlat({}, {
    width: markerLineWidth
}, colorAttributes('marker.line'));

var marker = extendFlat({}, {
    line: markerLine
}, colorAttributes('marker'), {
    showscale: scatterMarkerAttrs.showscale,
    colorbar: colorbarAttrs
});


module.exports = {
    x: scatterAttrs.x,
    x0: scatterAttrs.x0,
    dx: scatterAttrs.dx,
    y: scatterAttrs.y,
    y0: scatterAttrs.y0,
    dy: scatterAttrs.dy,

    text: scatterAttrs.text,
    hovertext: scatterAttrs.hovertext,

    textposition: {
        valType: 'enumerated',
        role: 'info',
        values: ['inside', 'outside', 'auto', 'none'],
        dflt: 'none',
        arrayOk: true,
        description: [
            'Specifies the location of the `text`.',
            '*inside* positions `text` inside, next to the bar end',
            '(rotated and scaled if needed).',
            '*outside* positions `text` outside, next to the bar end',
            '(scaled if needed).',
            '*auto* positions `text` inside or outside',
            'so that `text` size is maximized.'
        ].join(' ')
    },

    textfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text`.'
    }),

    insidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text` lying inside the bar.'
    }),

    outsidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `text` lying outside the bar.'
    }),

    orientation: {
        valType: 'enumerated',
        role: 'info',
        values: ['v', 'h'],
        description: [
            'Sets the orientation of the bars.',
            'With *v* (*h*), the value of the each bar spans',
            'along the vertical (horizontal).'
        ].join(' ')
    },

    base: {
        valType: 'any',
        dflt: null,
        arrayOk: true,
        role: 'info',
        description: [
            'Sets where the bar base is drawn (in position axis units).',
            'In *stack* or *relative* barmode,',
            'traces that set *base* will be excluded',
            'and drawn in *overlay* mode instead.'
        ].join(' ')
    },

    offset: {
        valType: 'number',
        dflt: null,
        arrayOk: true,
        role: 'info',
        description: [
            'Shifts the position where the bar is drawn',
            '(in position axis units).',
            'In *group* barmode,',
            'traces that set *offset* will be excluded',
            'and drawn in *overlay* mode instead.'
        ].join(' ')
    },

    width: {
        valType: 'number',
        dflt: null,
        min: 0,
        arrayOk: true,
        role: 'info',
        description: [
            'Sets the bar width (in position axis units).'
        ].join(' ')
    },

    marker: marker,

    r: scatterAttrs.r,
    t: scatterAttrs.t,

    error_y: errorBarAttrs,
    error_x: errorBarAttrs,

    _deprecated: {
        bardir: {
            valType: 'enumerated',
            role: 'info',
            values: ['v', 'h'],
            description: 'Renamed to `orientation`.'
        }
    }
};

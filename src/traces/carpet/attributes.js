/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var fontAttrs = require('../../plots/font_attributes');
var axisAttrs = require('./axis_attributes');
var colorAttrs = require('../../components/color/attributes');

module.exports = {
    carpet: {
        valType: 'string',
        role: 'info',
        description: [
            'An identifier for this carpet, so that `scattercarpet` and',
            '`scattercontour` traces can specify a carpet plot on which',
            'they lie'
        ].join(' ')
    },
    x: {
        valType: 'data_array',
        description: [
            'A two dimensional array of x coordinates at each carpet point.',
            'If ommitted, the plot is a cheater plot and the xaxis is hidden',
            'by default.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        description: 'A two dimensional array of y coordinates at each carpet point.'
    },
    a: {
        valType: 'data_array',
        description: [
            'An array containing values of the first parameter value'
        ].join(' ')
    },
    a0: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: [
            'Alternate to `a`.',
            'Builds a linear space of a coordinates.',
            'Use with `da`',
            'where `a0` is the starting coordinate and `da` the step.'
        ].join(' ')
    },
    da: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        description: [
            'Sets the a coordinate step.',
            'See `a0` for more info.'
        ].join(' ')
    },
    b: {
        valType: 'data_array',
        description: 'A two dimensional array of y coordinates at each carpet point.'
    },
    b0: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: [
            'Alternate to `b`.',
            'Builds a linear space of a coordinates.',
            'Use with `db`',
            'where `b0` is the starting coordinate and `db` the step.'
        ].join(' ')
    },
    db: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        description: [
            'Sets the b coordinate step.',
            'See `b0` for more info.'
        ].join(' ')
    },
    cheaterslope: {
        valType: 'number',
        role: 'info',
        dflt: 1,
        description: [
            'The shift applied to each successive row of data in creating a cheater plot.',
            'Only used if `x` is been ommitted.'
        ].join(' ')
    },
    aaxis: extendFlat({}, axisAttrs),
    baxis: extendFlat({}, axisAttrs),
    font: {
        family: extendFlat({}, fontAttrs.family, {
            dflt: '"Open Sans", verdana, arial, sans-serif'
        }),
        size: extendFlat({}, fontAttrs.size, {
            dflt: 12
        }),
        color: extendFlat({}, fontAttrs.color, {
            dflt: colorAttrs.defaultLine
        }),
    },
    color: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        role: 'style',
        description: [
            'Sets default for all colors associated with this axis',
            'all at once: line, font, tick, and grid colors.',
            'Grid color is lightened by blending this with the plot background',
            'Individual pieces can override this.'
        ].join(' ')
    },
};

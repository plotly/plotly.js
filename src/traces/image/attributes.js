/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var plotAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat({
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: [
            'A 2-dimensional array in which each element is an array of 3 or 4 numbers representing a color.',
        ].join(' ')
    },
    colormodel: {
        valType: 'enumerated',
        values: ['rgb', 'rgba', 'hsl', 'hsla'],
        dflt: 'rgb',
        role: 'info',
        editType: 'plot',
        description: 'Color model used to map the numerical color components described in `z` into colors.'
    },
    zmin: {
        valType: 'data_array',
        role: 'info',
        editType: 'plot',
        description: [
            'Array defining the lower bound for each color component.',
            'For example, for the `rgba` colormodel, the default value is [0, 0, 0, 0].'
        ].join(' ')
    },
    zmax: {
        valType: 'data_array',
        role: 'info',
        editType: 'plot',
        description: [
            'Array defining the higher bound for each color component.',
            'For example, for the `rgba` colormodel, the default value is [255, 255, 255, 1].'
        ].join(' ')
    },
    x0: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        editType: 'calc',
        description: 'Set the image\'s x position.'
    },
    y0: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        editType: 'calc',
        description: 'Set the image\'s y position.'
    },
    dx: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        editType: 'calc',
        description: 'Set the pixel\'s horizontal size.'
    },
    dy: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        editType: 'calc',
        description: 'Set the pixel\'s vertical size'
    },
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['x', 'y', 'z', 'color', 'name']
    }),
    hovertemplate: hovertemplateAttrs({}, {
        keys: ['z', 'c', 'colormodel']
    })
});

/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var extendFlat = require('../../lib/extend').extendFlat;
var colormodel = require('./constants').colormodel;

var cm = ['rgb', 'rgba', 'hsl', 'hsla'];
var zminDesc = [];
var zmaxDesc = [];
for(var i = 0; i < cm.length; i++) {
    zminDesc.push('For the `' + cm[i] + '` colormodel, it is [' + colormodel[cm[i]].min.join(', ') + '].');
    zmaxDesc.push('For the `' + cm[i] + '` colormodel, it is [' + colormodel[cm[i]].max.join(', ') + '].');
}

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
        values: cm,
        dflt: 'rgb',
        role: 'info',
        editType: 'calc',
        description: 'Color model used to map the numerical color components described in `z` into colors.'
    },
    zmin: {
        valType: 'info_array',
        items: [
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'}
        ],
        role: 'info',
        editType: 'calc',
        description: [
            'Array defining the lower bound for each color component.',
            'Note that the default value will depend on the colormodel.',
            zminDesc.join(' ')
        ].join(' ')
    },
    zmax: {
        valType: 'info_array',
        items: [
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'},
            {valType: 'number', editType: 'calc'}
        ],
        role: 'info',
        editType: 'calc',
        description: [
            'Array defining the higher bound for each color component.',
            'Note that the default value will depend on the colormodel.',
            zmaxDesc.join(' ')
        ].join(' ')
    },
    x0: {
        valType: 'any',
        dflt: 0,
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: 'Set the image\'s x position.'
    },
    y0: {
        valType: 'any',
        dflt: 0,
        role: 'info',
        editType: 'calc+clearAxisTypes',
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
    text: {
        valType: 'data_array',
        editType: 'plot',
        description: 'Sets the text elements associated with each z value.'
    },
    hovertext: {
        valType: 'data_array',
        editType: 'plot',
        description: 'Same as `text`.'
    },
    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['x', 'y', 'z', 'color', 'name', 'text'],
        dflt: 'x+y+z+text+name'
    }),
    hovertemplate: hovertemplateAttrs({}, {
        keys: ['z', 'color', 'colormodel']
    }),

    transforms: undefined
});

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorScaleAttributes = require('./attributes');
var extendDeep = require('../../lib/extend').extendDeep;

module.exports = function makeColorScaleAttributes(context) {
    return {
        color: {
            valType: 'color',
            arrayOk: true,
            role: 'style',
            description: [
                'Sets the ', context, ' color. It accepts either a specific color',
                ' or an array of values that are mapped to the colorscale',
                ' relative to the max and min values of the array or relative to',
                ' `cmin` and `cmax` if set.'
            ].join('')
        },
        colorscale: extendDeep({}, colorScaleAttributes.colorscale, {
            description: [
                'Sets the colorscale and only has an effect',
                ' if `', context, '.color` is set to a numerical array.',
                ' The colorscale must be an array containing',
                ' arrays mapping a normalized value to an',
                ' rgb, rgba, hex, hsl, hsv, or named color string.',
                ' At minimum, a mapping for the lowest (0) and highest (1)',
                ' values are required. For example,',
                ' `[[0, \'rgb(0,0,255)\', [1, \'rgb(255,0,0)\']]`.',
                ' To control the bounds of the colorscale in color space,',
                ' use `', context, '.cmin` and `', context, '.cmax`.'
            ].join('')
        }),
        cauto: extendDeep({}, colorScaleAttributes.zauto, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Determines the whether or not the color domain is computed',
                ' automatically.'
            ].join('')
        }),
        cmax: extendDeep({}, colorScaleAttributes.zmax, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Sets the upper bound of the color domain.',
                ' Value should be associated to the `', context, '.color` array index,',
                ' and if set, `', context, '.cmin` must be set as well.'
            ].join('')
        }),
        cmin: extendDeep({}, colorScaleAttributes.zmin, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Sets the lower bound of the color domain.',
                ' Value should be associated to the `', context, '.color` array index,',
                ' and if set, `', context, '.cmax` must be set as well.'
            ].join('')
        }),
        autocolorscale: extendDeep({}, colorScaleAttributes.autocolorscale, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Determines whether or not the colorscale is picked using',
                ' values inside `', context, '.color`.'
            ].join('')
        }),
        reversescale: extendDeep({}, colorScaleAttributes.reversescale, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Reverses the colorscale.'
            ].join('')
        })
    };
};

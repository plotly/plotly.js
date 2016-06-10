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
                ' or an array of numbers that are mapped to the colorscale',
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
                ' use `', context, '.cmin` and `', context, '.cmax`.',
                ' Alternatively, `colorscale` may be a palette name string',
                ' such as `"Viridis"` or `"Greens"`.'
            ].join('')
        }),
        cauto: extendDeep({}, colorScaleAttributes.zauto, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array',
                ' and `cmin`, `cmax` are set by the user. In this case,',
                ' it controls whether the first/last colors in `colorscale` correspond to',
                ' the lowest/highest values in `color` (`cauto: true`), or the `cmin`/`cmax`',
                ' values (`cauto: false`).',
                ' Defaults to `false` when `cmin`, `cmax` are set by the user.'
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
                ' Determines whether the colorscale is the default palette (`autocolorscale: true`)',
                ' or the palette determined by `', context, '.colorscale`.'
            ].join('')
        }),
        reversescale: extendDeep({}, colorScaleAttributes.reversescale, {
            description: [
                'Has an effect only if `', context, '.color` is set to a numerical array.',
                ' Reverses the color mapping if true (`cmin` or lowest `color` value will',
                ' correspond to the last color and `cmax` or highest `color` value will',
                ' correspond to the first color).'
            ].join('')
        })
    };
};

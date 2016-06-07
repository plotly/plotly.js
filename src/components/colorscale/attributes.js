/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    zauto: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Determines the whether or not the color domain is computed',
            'with respect to the input data.'
        ].join(' ')
    },
    zmin: {
        valType: 'number',
        role: 'info',
        dflt: null,
        description: 'Sets the lower bound of color domain.'
    },
    zmax: {
        valType: 'number',
        role: 'info',
        dflt: null,
        description: 'Sets the upper bound of color domain.'
    },
    colorscale: {
        valType: 'colorscale',
        role: 'style',
        description: [
            'Sets the colorscale.',
            'The colorscale must be an array containing',
            'arrays mapping a normalized value to an',
            'rgb, rgba, hex, hsl, hsv, or named color string.',
            'At minimum, a mapping for the lowest (0) and highest (1)',
            'values are required. For example,',
            '`[[0, \'rgb(0,0,255)\', [1, \'rgb(255,0,0)\']]`.',
            'To control the bounds of the colorscale in z space,',
            'use zmin and zmax'
        ].join(' ')
    },
    autocolorscale: {
        valType: 'boolean',
        role: 'style',
        dflt: true,  // gets overrode in 'heatmap' & 'surface' for backwards comp.
        description: [
            'Determines whether or not the colorscale is picked using the sign of',
            'the input z values.'
        ].join(' ')
    },
    reversescale: {
        valType: 'boolean',
        role: 'style',
        dflt: false,
        description: 'Reverses the colorscale.'
    },
    showscale: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Determines whether or not a colorbar is displayed for this trace.'
        ].join(' ')
    }
};

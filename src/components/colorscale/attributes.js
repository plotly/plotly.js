/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


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
        description: 'Sets the colorscale.'
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
    },

    _deprecated: {
        scl: {
            valType: 'colorscale',
            role: 'style',
            description: 'Renamed to `colorscale`.'
        },
        reversescl: {
            valType: 'boolean',
            role: 'style',
            description: 'Renamed to `reversescale`.'
        }
    }
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var colorscaleAttrs = require('../../components/colorscale/attributes');
var extendFlat = require('../../lib/extend').extendFlat;


function makeContourProjAttr(axLetter) {
    return {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Sets whether or not the dynamic contours are projected',
            'along the', axLetter, 'axis.'
        ].join(' ')
    };
}

function makeContourAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Sets whether or not dynamic contours are shown along the',
                axLetter, 'axis'
            ].join(' ')
        },
        project: {
            x: makeContourProjAttr('x'),
            y: makeContourProjAttr('y'),
            z: makeContourProjAttr('z')
        },
        color: {
            valType: 'color',
            role: 'style',
            dflt: '#000'
        },
        usecolormap: {
            valType: 'boolean',
            role: 'info',
            dflt: false
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 1,
            max: 16,
            dflt: 2
        },
        highlight: {
            valType: 'boolean',
            role: 'info',
            dflt: false
        },
        highlightColor: {
            valType: 'color',
            role: 'style',
            dflt: '#000'
        },
        highlightWidth: {
            valType: 'number',
            role: 'style',
            min: 1,
            max: 16,
            dflt: 2
        }
    };
}

module.exports = {
    z: {
        valType: 'data_array',
        description: 'Sets the z coordinates.'
    },
    x: {
        valType: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        valType: 'data_array',
        description: 'Sets the y coordinates.'
    },
    text: {
        valType: 'data_array',
        description: 'Sets the text elements associated with each z value.'
    },
    surfacecolor: {
        valType: 'data_array',
        description: [
            'Sets the surface color values,',
            'used for setting a color scale independent of `z`.'
        ].join(' ')
    },
    cauto: colorscaleAttrs.zauto,
    cmin: colorscaleAttrs.zmin,
    cmax: colorscaleAttrs.zmax,
    colorscale: colorscaleAttrs.colorscale,
    autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale,
        {dflt: false}),
    reversescale: colorscaleAttrs.reversescale,
    showscale: colorscaleAttrs.showscale,
    contours: {
        x: makeContourAttr('x'),
        y: makeContourAttr('y'),
        z: makeContourAttr('z')
    },
    hidesurface: {
        valType: 'boolean',
        role: 'info',
        dflt: false
    },
    lighting: {
        ambient: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.0,
            dflt: 0.8
        },
        diffuse: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.00,
            dflt: 0.8
        },
        specular: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 2.00,
            dflt: 0.05
        },
        roughness: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1.00,
            dflt: 0.5
        },
        fresnel: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 5.00,
            dflt: 0.2
        }
    },

    opacity: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 1
    },

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    },

    _deprecated: {
        zauto: extendFlat({}, colorscaleAttrs.zauto, {
            description: 'Obsolete. Use `cauto` instead.'
        }),
        zmin: extendFlat({}, colorscaleAttrs.zmin, {
            description: 'Obsolete. Use `cmin` instead.'
        }),
        zmax: extendFlat({}, colorscaleAttrs.zmax, {
            description: 'Obsolete. Use `cmax` instead.'
        })
    }
};

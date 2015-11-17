/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


var colorscaleAttrs = require('../../components/colorscale/attributes');

module.exports = {
    x: {valType: 'data_array'},
    y: {valType: 'data_array'},
    z: {valType: 'data_array'},

    i: {valType: 'data_array'},
    j: {valType: 'data_array'},
    k: {valType: 'data_array'},

    delaunayaxis: {
      valType: 'enumerated',
      role: 'info',
      values: [ 'x', 'y', 'z' ],
      dflt: 'z'
    },

    alphahull: {
      valType: 'number',
      role: 'style',
      dflt: -1
    },

    intensity: {valType: 'data_array'},

    //Color field
    color: {
        valType: 'color',
        role: 'style'
    },
    vertexcolor: {
        valType: 'data_array',  // FIXME: this should be a color array
        role: 'style'
    },
    facecolor: {
        valType: 'data_array',
        role: 'style'
    },

    //Opacity
    opacity: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 1
    },

    //Flat shaded mode
    flatshading: {
        valType: 'boolean',
        role: 'style',
        dflt: false
    },

    contour: {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false
        },
        color: {
            valType: 'color',
            role: 'style',
            dflt: '#000'
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 1,
            max: 16,
            dflt: 2
        }
    },

    colorscale: colorscaleAttrs.colorscale,
    reversescale: colorscaleAttrs.reversescale,
    showscale: colorscaleAttrs.showscale,

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

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

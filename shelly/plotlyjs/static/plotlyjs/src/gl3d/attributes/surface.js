'use strict';

var Plotly = require('../../plotly');

var traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

function makeContourProjAttr(axLetter) {
    return {
        type: 'boolean',
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
            type: 'boolean',
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
            type: 'color',
            dflt: '#000'
        },
        usecolormap: {
            type: 'boolean',
            dflt: false
        },
        width: {
            type: 'number',
            min: 1,
            max: 16,
            dflt: 2
        },
        highlight: {
            type: 'boolean',
            dflt: false
        },
        highlightColor: {
            type: 'color',
            dflt: '#000'
        },
        highlightWidth: {
            type: 'number',
            min: 1,
            max: 16,
            dflt: 2
        }
    };
}

module.exports = {
    overview: [
        'The data the describes the coordinates of the surface is set in `z`.',
        'Data in `z` should be a {2D array}.',

        'Coordinates in `x` and `y` can either be 1D {arrays}',
        'or {2D arrays} (e.g. to graph parametric surfaces).',

        'If not provided in `x` and `y`, the x and y coordinates are assumed',
        'to be linear starting at 0 with a unit step.'
    ].join(' '),


    z: {
        type: 'data_array',
        description: 'Sets the z coordinates.'
    },
    x: {
        type: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        type: 'data_array',
        description: 'Sets the y coordinates.'
    },
    text: {
        type: 'data_array',
        description: 'Sets the text elements associated with each z value.'
    },
    zauto: traceColorbarAttrs.zauto,
    zmin: traceColorbarAttrs.zmin,
    zmax: traceColorbarAttrs.zmax,
    colorscale: traceColorbarAttrs.colorscale,
    autocolorscale: Plotly.Lib.extendFlat(traceColorbarAttrs.autocolorscale, {
        dflt: false}),
    reversescale: traceColorbarAttrs.reversescale,
    showscale: traceColorbarAttrs.showscale,
    contours: {
        x: makeContourAttr('x'),
        y: makeContourAttr('y'),
        z: makeContourAttr('z')
    },
    hidesurface: {
      type: 'boolean',
      dflt: false
    },
    lighting: {
        ambient: {
            type: 'number',
            min: 0.00,
            max: 1.0,
            dflt: 0.8
        },
        diffuse: {
            type: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.8
        },
        specular: {
            type: 'number',
            min: 0.00,
            max: 2.00,
            dflt: 0.05
        },
        roughness: {
            type: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.5
        },
        fresnel: {
            type: 'number',
            min: 0.00,
            max: 5.00,
            dflt: 0.2
        }
    },

    opacity: {
      type: 'number',
      min: 0,
      max: 1,
      dflt: 1
    },

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

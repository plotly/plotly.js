'use strict';

var Plotly = require('../../plotly');

var traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

function makeContourProjAttr(axLetter) {
    return {
        valType: 'boolean',
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
            dflt: '#000'
        },
        usecolormap: {
            valType: 'boolean',
            dflt: false
        },
        width: {
            valType: 'number',
            min: 1,
            max: 16,
            dflt: 2
        },
        highlight: {
            valType: 'boolean',
            dflt: false
        },
        highlightColor: {
            valType: 'color',
            dflt: '#000'
        },
        highlightWidth: {
            valType: 'number',
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
    zauto: traceColorbarAttrs.zauto,
    zmin: traceColorbarAttrs.zmin,
    zmax: traceColorbarAttrs.zmax,
    colorscale: traceColorbarAttrs.colorscale,
    autocolorscale: Plotly.Lib.extendFlat(traceColorbarAttrs.autocolorscale,
        {dflt: false}),
    reversescale: traceColorbarAttrs.reversescale,
    showscale: traceColorbarAttrs.showscale,
    contours: {
        x: makeContourAttr('x'),
        y: makeContourAttr('y'),
        z: makeContourAttr('z')
    },
    hidesurface: {
      valType: 'boolean',
      dflt: false
    },
    lighting: {
        ambient: {
            valType: 'number',
            min: 0.00,
            max: 1.0,
            dflt: 0.8
        },
        diffuse: {
            valType: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.8
        },
        specular: {
            valType: 'number',
            min: 0.00,
            max: 2.00,
            dflt: 0.05
        },
        roughness: {
            valType: 'number',
            min: 0.00,
            max: 1.00,
            dflt: 0.5
        },
        fresnel: {
            valType: 'number',
            min: 0.00,
            max: 5.00,
            dflt: 0.2
        }
    },

    opacity: {
      valType: 'number',
      min: 0,
      max: 1,
      dflt: 1
    },

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

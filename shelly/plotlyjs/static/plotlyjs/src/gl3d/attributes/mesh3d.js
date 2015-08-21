var Plotly = require('../../plotly');

var traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

module.exports = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},

    i: {type: 'data_array'},
    j: {type: 'data_array'},
    k: {type: 'data_array'},

    delaunayaxis: {
      type: 'enumerated',
      values: [ 'x', 'y', 'z' ],
      dflt: 'z'
    },

    alphahull: {
      type: 'number',
      dflt: -1
    },

    intensity: {type: 'data_array'},

    //Color field
    color: { type: 'color' },
    vertexcolor: { type: 'data_array' },  //FIXME: this should be a color array
    facecolor: { type: 'data_array' },

    //Opacity
    opacity: {
      type: 'number',
      min: 0,
      max: 1,
      dflt: 1
    },

    //Flat shaded mode
    flatshading: {
      type: 'boolean',
      dflt: false
    },

    contour: {
        show: {
            type: 'boolean',
            dflt: false
        },
        color: {
            type: 'color',
            dflt: '#000'
        },
        width: {
            type: 'number',
            min: 1,
            max: 16,
            dflt: 2
        }
    },

    colorscale: traceColorbarAttrs.colorscale,
    reversescale: traceColorbarAttrs.reversescale,
    showscale: traceColorbarAttrs.showscale,

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

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

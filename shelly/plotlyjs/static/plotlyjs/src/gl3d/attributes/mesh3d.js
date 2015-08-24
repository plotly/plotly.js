var Plotly = require('../../plotly');

var traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

module.exports = {
    x: {valType: 'data_array'},
    y: {valType: 'data_array'},
    z: {valType: 'data_array'},

    i: {valType: 'data_array'},
    j: {valType: 'data_array'},
    k: {valType: 'data_array'},

    delaunayaxis: {
      valType: 'enumerated',
      values: [ 'x', 'y', 'z' ],
      dflt: 'z'
    },

    alphahull: {
      valType: 'number',
      dflt: -1
    },

    intensity: {valType: 'data_array'},

    //Color field
    color: { valType: 'color' },
    vertexcolor: { valType: 'data_array' },  //FIXME: this should be a color array
    facecolor: { valType: 'data_array' },

    //Opacity
    opacity: {
      valType: 'number',
      min: 0,
      max: 1,
      dflt: 1
    },

    //Flat shaded mode
    flatshading: {
      valType: 'boolean',
      dflt: false
    },

    contour: {
        show: {
            valType: 'boolean',
            dflt: false
        },
        color: {
            valType: 'color',
            dflt: '#000'
        },
        width: {
            valType: 'number',
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

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

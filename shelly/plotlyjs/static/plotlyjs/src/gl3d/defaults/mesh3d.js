'use strict';

var Plotly = require('../../plotly');

var Mesh3D = {};

module.exports = Mesh3D;

Plotly.Plots.register(Mesh3D, 'mesh3d', ['gl3d']);

var  heatmapAttrs = Plotly.Heatmap.attributes;

Mesh3D.attributes = {
    x: {type: 'data_array'},
    y: {type: 'data_array'},
    z: {type: 'data_array'},

    i: {type: 'data_array'},
    j: {type: 'data_array'},
    k: {type: 'data_array'},

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

    colorscale:   heatmapAttrs.colorscale,
    showscale:    heatmapAttrs.showscale,
    reversescale: heatmapAttrs.reversescale,

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

Mesh3D.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
  var self = this;
  function coerce(attr, dflt) {
      return Plotly.Lib.coerce(traceIn, traceOut, self.attributes, attr, dflt);
  }

  //Read in face/vertex properties
  function readComponents(array) {
    var ret = array.map(function(attr) {
      var result = coerce(attr);
      if(result && Array.isArray(result)) {
        return result;
      }
      return null;
    });
    return ret.every(function(x) {
      return x && x.length === ret[0].length;
    }) && ret;
  }

  var coords  = readComponents(['x', 'y', 'z']);
  var indices = readComponents(['i', 'j', 'k']);

  if(!coords || !indices) {
    traceOut.visible = false;
    return;
  }

  //Convert all face indices to ints
  indices.forEach(function(index) {
    for(var i=0; i<index.length; ++i) {
      index[i] |= 0;
    }
  });

  //Coerce remaining properties
  [ 'lighting.ambient',
    'lighting.diffuse',
    'lighting.specular',
    'lighting.roughness',
    'lighting.fresnel',
    'contour.show',
    'contour.color',
    'contour.width',
    'colorscale',
    'reversescale',
    'flatshading'
  ].forEach(function(x) { coerce(x); });

  if('intensity' in traceIn) {
    coerce('intensity');
    coerce('showscale', true);
  } else {
    traceOut.showscale = false;
    if('vertexColor' in traceIn) {
      coerce('vertexColor');
    } else if('faceColor' in traceIn) {
      coerce('faceColor');
    } else {
      coerce('color', defaultColor);
    }
  }

  if(traceOut.reversescale) {
      traceOut.colorscale = traceOut.colorscale.map(function (si) {
          return [1 - si[0], si[1]];
      }).reverse();
  }

  if(traceOut.showscale) {
      Plotly.Colorbar.supplyDefaults(traceIn, traceOut, layout);
  }
};

Mesh3D.colorbar = Plotly.Heatmap.colorbar.bind(Plotly.Heatmap);

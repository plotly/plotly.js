/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Mesh3D = require('./');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, Mesh3D.attributes, attr, dflt);
    }

    // read in face/vertex properties
    function readComponents(array) {
        var ret = array.map(function(attr) {
            var result = coerce(attr);

            if(result && Array.isArray(result)) return result;
            return null;
        });

        return ret.every(function(x) {
            return x && x.length === ret[0].length;
        }) && ret;
    }

    var coords  = readComponents(['x', 'y', 'z']);
    var indices = readComponents(['i', 'j', 'k']);

    if(!coords) {
        traceOut.visible = false;
        return;
    }

    if(indices) {
        // otherwise, convert all face indices to ints
        indices.forEach(function(index) {
            for(var i=0; i<index.length; ++i) {
                index[i] |= 0;
              }
        });
    }

    //Coerce remaining properties
    ['lighting.ambient',
        'lighting.diffuse',
        'lighting.specular',
        'lighting.roughness',
        'lighting.fresnel',
        'contour.show',
        'contour.color',
        'contour.width',
        'colorscale',
        'reversescale',
        'flatshading',
        'alphahull',
        'delaunayaxis',
        'opacity'
    ].forEach(function(x) { coerce(x); });

    if('intensity' in traceIn) {
        coerce('intensity');
        coerce('showscale', true);
    } 
    else {
        traceOut.showscale = false;

        if('vertexColor' in traceIn) coerce('vertexColor');
        else if('faceColor' in traceIn) coerce('faceColor');
        else coerce('color', defaultColor);
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

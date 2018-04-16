/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    // TODO do 2D versions of these work?

    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');

    traceOut._xlength = x.length;
    traceOut._ylength = y.length;
    traceOut._zlength = z.length;

    coerce('u');
    coerce('v');
    coerce('w');

    coerce('cx');
    coerce('cy');
    coerce('cz');

    coerce('text');

    coerce('lighting.ambient');
    coerce('lighting.diffuse');
    coerce('lighting.specular');
    coerce('lighting.roughness');
    coerce('lighting.fresnel');
    coerce('lighting.vertexnormalsepsilon');
    coerce('lighting.facenormalsepsilon');
    coerce('lightposition.x');
    coerce('lightposition.y');
    coerce('lightposition.z');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'});
};

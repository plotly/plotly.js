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

    var value = coerce('value');

    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');

    if(
        !value || !value.length ||
        !x || !x.length || !y || !y.length || !z || !z.length
    ) {
        traceOut.visible = false;
        return;
    }

    var surfaceColor = coerce('surfacecolor');

    coerce('isomin');
    coerce('isomax');
    coerce('smoothnormals');
    coerce('isocaps');

    coerce('xmin');
    coerce('ymin');
    coerce('zmin');

    coerce('xmax');
    coerce('ymax');
    coerce('zmax');

    coerce('lighting.ambient');
    coerce('lighting.diffuse');
    coerce('lighting.specular');
    coerce('lighting.roughness');
    coerce('lighting.fresnel');
    coerce('lightposition.x');
    coerce('lightposition.y');
    coerce('lightposition.z');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'});

    coerce('text');

    // backward compatibility block
    if(!surfaceColor) {
        mapLegacy(traceIn, 'zmin', 'cmin');
        mapLegacy(traceIn, 'zmax', 'cmax');
        mapLegacy(traceIn, 'zauto', 'cauto');
    }

    // disable 1D transforms (for now)
    traceOut._length = null;
};

function mapLegacy(traceIn, oldAttr, newAttr) {
    if(oldAttr in traceIn && !(newAttr in traceIn)) {
        traceIn[newAttr] = traceIn[oldAttr];
    }
}
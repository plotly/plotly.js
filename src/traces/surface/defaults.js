/**
* Copyright 2012-2016, Plotly, Inc.
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
    var i, j;

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var z = coerce('z');
    if(!z) {
        traceOut.visible = false;
        return;
    }

    var xlen = z[0].length;
    var ylen = z.length;

    coerce('x');
    coerce('y');

    if(!Array.isArray(traceOut.x)) {
        // build a linearly scaled x
        traceOut.x = [];
        for(i = 0; i < xlen; ++i) {
            traceOut.x[i] = i;
        }
    }

    coerce('text');
    if(!Array.isArray(traceOut.y)) {
        traceOut.y = [];
        for(i = 0; i < ylen; ++i) {
            traceOut.y[i] = i;
        }
    }

    coerce('lighting.ambient');
    coerce('lighting.diffuse');
    coerce('lighting.specular');
    coerce('lighting.roughness');
    coerce('lighting.fresnel');
    coerce('hidesurface');
    coerce('opacity');

    var surfaceColor = coerce('surfacecolor');

    coerce('colorscale');

    var dims = ['x', 'y', 'z'];
    for(i = 0; i < 3; ++i) {

        var contourDim = 'contours.' + dims[i];
        var show = coerce(contourDim + '.show');
        var highlight = coerce(contourDim + '.highlight');

        if(show || highlight) {
            for(j = 0; j < 3; ++j) {
                coerce(contourDim + '.project.' + dims[j]);
            }
        }

        if(show) {
            coerce(contourDim + '.color');
            coerce(contourDim + '.width');
            coerce(contourDim + '.usecolormap');
        }

        if(highlight) {
            coerce(contourDim + '.highlightColor');
            coerce(contourDim + '.highlightWidth');
        }
    }

    // backward compatibility block
    if(!surfaceColor) {
        mapLegacy(traceIn, 'zmin', 'cmin');
        mapLegacy(traceIn, 'zmax', 'cmax');
        mapLegacy(traceIn, 'zauto', 'cauto');
    }

    colorscaleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'}
    );
};

function mapLegacy(traceIn, oldAttr, newAttr) {
    if(oldAttr in traceIn && !(newAttr in traceIn)) {
        traceIn[newAttr] = traceIn[oldAttr];
    }
}

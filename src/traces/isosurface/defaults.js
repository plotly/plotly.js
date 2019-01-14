/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');
    var value = coerce('value');

    if(
        !x || !x.length ||
        !y || !y.length ||
        !z || !z.length ||
        !value || !value.length
    ) {
        traceOut.visible = false;
        return;
    }

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y', 'z'], layout);

    ['x', 'y', 'z'].forEach(function(dim) {
        var sliceDim = 'slices.' + dim;
        coerce(sliceDim + '.show');
        coerce(sliceDim + '.fill');

        var capDim = 'caps.' + dim;
        coerce(capDim + '.show');
        coerce(capDim + '.fill');
    });

    // Coerce remaining properties
    [
        'text',
        'lighting.ambient',
        'lighting.diffuse',
        'lighting.specular',
        'lighting.roughness',
        'lighting.fresnel',
        'lighting.vertexnormalsepsilon',
        'lighting.facenormalsepsilon',
        'lightposition.x',
        'lightposition.y',
        'lightposition.z',
        'contour.show',
        'contour.color',
        'contour.width',
        'colorscale',
        'reversescale',
        'flatshading',
        'isomin',
        'isomax',
        'surface.show',
        'surface.fill',
        'volume.show',
        'volume.fill'
    ].forEach(function(x) { coerce(x); });

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'c'});
};

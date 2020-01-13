/**
* Copyright 2012-2020, Plotly, Inc.
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

    var lon = coerce('lon') || [];
    var lat = coerce('lat') || [];

    var len = Math.min(lon.length, lat.length);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    coerce('z');
    coerce('radius');
    coerce('below');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'});
};

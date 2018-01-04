/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');

var hasColorbar = require('../colorbar/has_colorbar');
var colorbarDefaults = require('../colorbar/defaults');
var isValidScale = require('./is_valid_scale');
var flipScale = require('./flip_scale');


module.exports = function colorScaleDefaults(traceIn, traceOut, layout, coerce, opts) {
    var prefix = opts.prefix,
        cLetter = opts.cLetter,
        containerStr = prefix.slice(0, prefix.length - 1),
        containerIn = prefix ?
            Lib.nestedProperty(traceIn, containerStr).get() || {} :
            traceIn,
        containerOut = prefix ?
            Lib.nestedProperty(traceOut, containerStr).get() || {} :
            traceOut,
        minIn = containerIn[cLetter + 'min'],
        maxIn = containerIn[cLetter + 'max'],
        sclIn = containerIn.colorscale;

    var validMinMax = isNumeric(minIn) && isNumeric(maxIn) && (minIn < maxIn);
    coerce(prefix + cLetter + 'auto', !validMinMax);
    coerce(prefix + cLetter + 'min');
    coerce(prefix + cLetter + 'max');

    // handles both the trace case (autocolorscale is false by default) and
    // the marker and marker.line case (autocolorscale is true by default)
    var autoColorscaleDftl;
    if(sclIn !== undefined) autoColorscaleDftl = !isValidScale(sclIn);
    coerce(prefix + 'autocolorscale', autoColorscaleDftl);
    var sclOut = coerce(prefix + 'colorscale');

    // reversescale is handled at the containerOut level
    var reverseScale = coerce(prefix + 'reversescale');
    if(reverseScale) containerOut.colorscale = flipScale(sclOut);

    // ... until Scatter.colorbar can handle marker line colorbars
    if(prefix === 'marker.line.') return;

    // handle both the trace case where the dflt is listed in attributes and
    // the marker case where the dflt is determined by hasColorbar
    var showScaleDftl;
    if(prefix) showScaleDftl = hasColorbar(containerIn);
    var showScale = coerce(prefix + 'showscale', showScaleDftl);

    if(showScale) colorbarDefaults(containerIn, containerOut, layout);
};

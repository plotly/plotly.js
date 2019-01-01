/**
* Copyright 2012-2019, Plotly, Inc.
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

var isValidScale = require('./scales').isValid;

function npMaybe(cont, prefix) {
    var containerStr = prefix.slice(0, prefix.length - 1);
    return prefix ?
        Lib.nestedProperty(cont, containerStr).get() || {} :
        cont;
}

module.exports = function colorScaleDefaults(traceIn, traceOut, layout, coerce, opts) {
    var prefix = opts.prefix;
    var cLetter = opts.cLetter;
    var containerIn = npMaybe(traceIn, prefix);
    var containerOut = npMaybe(traceOut, prefix);
    var template = npMaybe(traceOut._template || {}, prefix) || {};

    var minIn = containerIn[cLetter + 'min'];
    var maxIn = containerIn[cLetter + 'max'];
    var validMinMax = isNumeric(minIn) && isNumeric(maxIn) && (minIn < maxIn);
    coerce(prefix + cLetter + 'auto', !validMinMax);
    coerce(prefix + cLetter + 'min');
    coerce(prefix + cLetter + 'max');

    // handles both the trace case (autocolorscale is false by default) and
    // the marker and marker.line case (autocolorscale is true by default)
    var sclIn = containerIn.colorscale;
    var sclTemplate = template.colorscale;
    var autoColorscaleDflt;
    if(sclIn !== undefined) autoColorscaleDflt = !isValidScale(sclIn);
    if(sclTemplate !== undefined) autoColorscaleDflt = !isValidScale(sclTemplate);
    coerce(prefix + 'autocolorscale', autoColorscaleDflt);

    coerce(prefix + 'colorscale');
    coerce(prefix + 'reversescale');

    if(!opts.noScale && prefix !== 'marker.line.') {
        // handles both the trace case where the dflt is listed in attributes and
        // the marker case where the dflt is determined by hasColorbar
        var showScaleDflt;
        if(prefix) showScaleDflt = hasColorbar(containerIn);

        var showScale = coerce(prefix + 'showscale', showScaleDflt);
        if(showScale) colorbarDefaults(containerIn, containerOut, layout);
    }
};

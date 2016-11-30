/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');

var handleXYDefaults = require('../scatter/xy_defaults');
var handleStyleDefaults = require('../bar/style_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');
var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var coerceFont = Lib.coerceFont;

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('base');
    coerce('offset');
    coerce('width');

    coerce('text');

    var textPosition = coerce('textposition');

    var hasBoth = Array.isArray(textPosition) || textPosition === 'auto',
        hasInside = hasBoth || textPosition === 'inside',
        hasOutside = hasBoth || textPosition === 'outside';
    if(hasInside || hasOutside) {
        var textFont = coerceFont(coerce, 'textfont', layout.font);
        if(hasInside) coerceFont(coerce, 'insidetextfont', textFont);
        if(hasOutside) coerceFont(coerce, 'outsidetextfont', textFont);
    }

    handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout);

    // override defaultColor for error bars with defaultLine
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, Color.defaultLine, {axis: 'x', inherit: 'y'});
};

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var handleDomainDefaults = require('../../plots/domain').defaults;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var coerceFont = Lib.coerceFont;
    var len;

    var vals = coerce('values');
    var hasVals = Lib.isArrayOrTypedArray(vals);
    var labels = coerce('labels');
    if(Array.isArray(labels)) {
        len = labels.length;
        if(hasVals) len = Math.min(len, vals.length);
    }
    else if(hasVals) {
        len = vals.length;

        coerce('label0');
        coerce('dlabel');
    }

    if(!len) {
        traceOut.visible = false;
        return;
    }
    traceOut._length = len;

    var lineWidth = coerce('marker.line.width');
    if(lineWidth) coerce('marker.line.color');

    coerce('marker.colors');

    coerce('scalegroup');
    // TODO: hole needs to be coerced to the same value within a scaleegroup

    var textData = coerce('text');
    var textInfo = coerce('textinfo', Array.isArray(textData) ? 'text+percent' : 'percent');
    coerce('hovertext');

    if(textInfo && textInfo !== 'none') {
        var textPosition = coerce('textposition'),
            hasBoth = Array.isArray(textPosition) || textPosition === 'auto',
            hasInside = hasBoth || textPosition === 'inside',
            hasOutside = hasBoth || textPosition === 'outside';

        if(hasInside || hasOutside) {
            var dfltFont = coerceFont(coerce, 'textfont', layout.font);
            if(hasInside) coerceFont(coerce, 'insidetextfont', dfltFont);
            if(hasOutside) coerceFont(coerce, 'outsidetextfont', dfltFont);
        }
    }

    handleDomainDefaults(traceOut, layout, coerce);

    coerce('hole');

    coerce('sort');
    coerce('direction');
    coerce('rotation');

    coerce('pull');
};

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

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var coerceFont = Lib.coerceFont;

    var vals = coerce('values');
    var labels = coerce('labels');
    if(!Array.isArray(labels)) {
        if(!Array.isArray(vals) || !vals.length) {
            // must have at least one of vals or labels
            traceOut.visible = false;
            return;
        }

        coerce('label0');
        coerce('dlabel');
    }

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

    coerce('domain.x');
    coerce('domain.y');

    coerce('hole');

    coerce('sort');
    coerce('direction');
    coerce('rotation');

    coerce('pull');
};

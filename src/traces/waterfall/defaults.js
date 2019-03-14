/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var handleGroupingDefaults = require('../bar/defaults').handleGroupingDefaults;
var handleXYDefaults = require('../scatter/xy_defaults');
var attributes = require('./attributes');
var Color = require('../../components/color');

var INCREASING_COLOR = '#3D9970';
var DECREASING_COLOR = '#FF4136';

function handleDirection(coerce, direction, defaultColor) {
    coerce(direction + '.color', defaultColor);
    coerce(direction + '.line.color', Color.defaultLine);
    coerce(direction + '.line.width');
    coerce(direction + '.opacity');
}

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var coerceFont = Lib.coerceFont;

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('valuetype');

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('base');
    coerce('offset');
    coerce('width');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    var textPosition = coerce('textposition');

    var hasBoth = Array.isArray(textPosition) || textPosition === 'auto';
    var hasInside = hasBoth || textPosition === 'inside';
    var hasOutside = hasBoth || textPosition === 'outside';

    if(hasInside || hasOutside) {
        var textFont = coerceFont(coerce, 'textfont', layout.font);

        // Note that coercing `insidetextfont` is always needed –
        // even if `textposition` is `outside` for each trace – since
        // an outside label can become an inside one, for example because
        // of a bar being stacked on top of it.
        var insideTextFontDefault = Lib.extendFlat({}, textFont);
        var isTraceTextfontColorSet = traceIn.textfont && traceIn.textfont.color;
        var isColorInheritedFromLayoutFont = !isTraceTextfontColorSet;
        if(isColorInheritedFromLayoutFont) {
            delete insideTextFontDefault.color;
        }
        coerceFont(coerce, 'insidetextfont', insideTextFontDefault);

        if(hasOutside) coerceFont(coerce, 'outsidetextfont', textFont);

        coerce('constraintext');
        coerce('selected.textfont.color');
        coerce('unselected.textfont.color');
    }

    handleDirection(coerce, 'increasing', INCREASING_COLOR);
    handleDirection(coerce, 'decreasing', DECREASING_COLOR);
    handleDirection(coerce, 'marker', defaultColor);

    coerce('selected.marker.color');
    coerce('unselected.marker.color');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);

    traceOut._autoMarkerColor = !!(
        traceIn.marker &&
        traceIn.marker.color &&
        Lib.isArrayOrTypedArray(traceIn.marker.color) &&
        traceIn.marker.color.length === 0
    );

    traceOut._autoMarkerLineColor = !!(
        traceIn.marker &&
        traceIn.marker.line &&
        traceIn.marker.line.color &&
        Lib.isArrayOrTypedArray(traceIn.marker.line.color) &&
        traceIn.marker.line.color.length === 0
    );

    coerce('connector.color');
    coerce('connector.width');
    coerce('connector.dash');
    coerce('connector.mode');
}

function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut;

    function coerce(attr) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr);
    }

    for(var i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];

        if(traceOut.type === 'waterfall') {
            traceIn = traceOut._input;
            if(fullLayout.barmode === 'group') {
                handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce);
            }
        }
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    crossTraceDefaults: crossTraceDefaults,
    handleGroupingDefaults: handleGroupingDefaults
};

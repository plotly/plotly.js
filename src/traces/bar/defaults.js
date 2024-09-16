'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Color = require('../../components/color');
var Registry = require('../../registry');

var handleXYDefaults = require('../scatter/xy_defaults');
var handlePeriodDefaults = require('../scatter/period_defaults');
var handleStyleDefaults = require('./style_defaults');
var handleGroupingDefaults = require('../scatter/grouping_defaults');
var attributes = require('./attributes');

var coerceFont = Lib.coerceFont;

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    coerce('zorder');

    coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
    coerce('base');
    coerce('offset');
    coerce('width');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    var textposition = coerce('textposition');
    handleText(traceIn, traceOut, layout, coerce, textposition, {
        moduleHasSelected: true,
        moduleHasUnselected: true,
        moduleHasConstrain: true,
        moduleHasCliponaxis: true,
        moduleHasTextangle: true,
        moduleHasInsideanchor: true
    });

    handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout);
    var lineColor = (traceOut.marker.line || {}).color;

    // override defaultColor for error bars with defaultLine
    var errorBarsSupplyDefaults = Registry.getComponentMethod('errorbars', 'supplyDefaults');
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || Color.defaultLine, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || Color.defaultLine, {axis: 'x', inherit: 'y'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
}

function crossTraceDefaults(fullData, fullLayout) {
    var traceIn, traceOut;

    function coerce(attr, dflt) {
        return Lib.coerce(traceOut._input, traceOut, attributes, attr, dflt);
    }

    for(var i = 0; i < fullData.length; i++) {
        traceOut = fullData[i];

        if(traceOut.type === 'bar') {
            traceIn = traceOut._input;
            // `marker.cornerradius` needs to be coerced here rather than in handleStyleDefaults()
            // because it needs to happen after `layout.barcornerradius` has been coerced
            var r = coerce('marker.cornerradius', fullLayout.barcornerradius);
            if(traceOut.marker) {
                traceOut.marker.cornerradius = validateCornerradius(r);
            }

            handleGroupingDefaults(traceIn, traceOut, fullLayout, coerce, fullLayout.barmode);
        }
    }
}

// Returns a value equivalent to the given cornerradius value, if valid;
// otherwise returns`undefined`.
// Valid cornerradius values must be either:
//   - a numeric value (string or number) >= 0, or
//   - a string consisting of a number >= 0 followed by a % sign
// If the given cornerradius value is a numeric string, it will be converted
// to a number.
function validateCornerradius(r) {
    if(isNumeric(r)) {
        r = +r;
        if(r >= 0) return r;
    } else if(typeof r === 'string') {
        r = r.trim();
        if(r.slice(-1) === '%' && isNumeric(r.slice(0, -1))) {
            r = +r.slice(0, -1);
            if(r >= 0) return r + '%';
        }
    }
    return undefined;
}

function handleText(traceIn, traceOut, layout, coerce, textposition, opts) {
    opts = opts || {};
    var moduleHasSelected = !(opts.moduleHasSelected === false);
    var moduleHasUnselected = !(opts.moduleHasUnselected === false);
    var moduleHasConstrain = !(opts.moduleHasConstrain === false);
    var moduleHasCliponaxis = !(opts.moduleHasCliponaxis === false);
    var moduleHasTextangle = !(opts.moduleHasTextangle === false);
    var moduleHasInsideanchor = !(opts.moduleHasInsideanchor === false);
    var hasPathbar = !!opts.hasPathbar;

    var hasBoth = Array.isArray(textposition) || textposition === 'auto';
    var hasInside = hasBoth || textposition === 'inside';
    var hasOutside = hasBoth || textposition === 'outside';

    if(hasInside || hasOutside) {
        var dfltFont = coerceFont(coerce, 'textfont', layout.font);

        // Note that coercing `insidetextfont` is always needed –
        // even if `textposition` is `outside` for each trace – since
        // an outside label can become an inside one, for example because
        // of a bar being stacked on top of it.
        var insideTextFontDefault = Lib.extendFlat({}, dfltFont);
        var isTraceTextfontColorSet = traceIn.textfont && traceIn.textfont.color;
        var isColorInheritedFromLayoutFont = !isTraceTextfontColorSet;
        if(isColorInheritedFromLayoutFont) {
            delete insideTextFontDefault.color;
        }
        coerceFont(coerce, 'insidetextfont', insideTextFontDefault);

        if(hasPathbar) {
            var pathbarTextFontDefault = Lib.extendFlat({}, dfltFont);
            if(isColorInheritedFromLayoutFont) {
                delete pathbarTextFontDefault.color;
            }
            coerceFont(coerce, 'pathbar.textfont', pathbarTextFontDefault);
        }

        if(hasOutside) coerceFont(coerce, 'outsidetextfont', dfltFont);

        if(moduleHasSelected) coerce('selected.textfont.color');
        if(moduleHasUnselected) coerce('unselected.textfont.color');
        if(moduleHasConstrain) coerce('constraintext');
        if(moduleHasCliponaxis) coerce('cliponaxis');
        if(moduleHasTextangle) coerce('textangle');

        coerce('texttemplate');
    }

    if(hasInside) {
        if(moduleHasInsideanchor) coerce('insidetextanchor');
    }
}

module.exports = {
    supplyDefaults: supplyDefaults,
    crossTraceDefaults: crossTraceDefaults,
    handleText: handleText,
    validateCornerradius: validateCornerradius,
};

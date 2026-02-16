'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var handleXYDefaults = require('../scatter/xy_defaults');
var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var colorscaleDefaults = require('../../components/colorscale/defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    var u = coerce('u');
    var v = coerce('v');

    // If u/v are missing, default to zeros so the trace participates in calc/category logic
    if(!Lib.isArrayOrTypedArray(u) || u.length === 0) {
        traceOut.u = new Array(len);
        for(var i = 0; i < len; i++) traceOut.u[i] = 0;
    }
    if(!Lib.isArrayOrTypedArray(v) || v.length === 0) {
        traceOut.v = new Array(len);
        for(var j = 0; j < len; j++) traceOut.v[j] = 0;
    }

    // Sizing API similar to cone
    var sizemode = coerce('sizemode');
    coerce('sizeref', sizemode === 'raw' ? 1 : 0.5);
    coerce('anchor');

    // Arrow styling
    coerce('arrowsize');
    coerce('arrow_scale'); // back-compat alias
    coerce('arrowwidth');
    coerce('hoverdistance');

    // Line styling - use coerce for proper validation
    coerce('line.color', defaultColor);
    // If arrowwidth is set, use it as line.width default
    var arrowwidth = traceOut.arrowwidth;
    if(arrowwidth !== undefined) {
        coerce('line.width', arrowwidth);
    } else {
        coerce('line.width');
    }
    coerce('line.dash');
    coerce('line.shape');
    coerce('line.smoothing');
    coerce('line.simplify');

    // Text
    coerce('text');
    coerce('textposition');
    Lib.coerceFont(coerce, 'textfont', layout.font);

    // Hover
    coerce('hovertemplate');
    coerce('xhoverformat');
    coerce('yhoverformat');
    coerce('uhoverformat');
    coerce('vhoverformat');

    // Colorscale defaults (adds colorscale, showscale, colorbar, etc.)
    // Ensure traceOut.marker exists before colorscaleDefaults, which captures
    // a reference to it via npMaybe at the start of its execution.
    if(!traceOut.marker) traceOut.marker = {};
    coerce('marker.color');
    var withColorscale = hasColorscale(traceIn, 'marker') || (traceIn.marker || {}).coloraxis;
    traceOut._hasColorscale = !!withColorscale;
    if(withColorscale) {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: 'marker.', cLetter: 'c' });
    }

    // Selection styling
    coerce('selected.line.color');
    coerce('selected.line.width');
    coerce('selected.textfont.color');
    coerce('unselected.line.color');
    coerce('unselected.line.width');
    coerce('unselected.textfont.color');

};

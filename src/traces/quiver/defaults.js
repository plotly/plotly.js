'use strict';

var Lib = require('../../lib');
var attributes = require('./attributes');
var Colorscale = require('../../components/colorscale');
var colorscaleDefaults = Colorscale.handleDefaults;
var hasColorscale = Colorscale.hasColorscale;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    // Selection styling - use coerce to set proper defaults
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    // Coerce x and y data arrays (this ensures proper data structure for category ordering)
    var x = coerce('x');
    var y = coerce('y');
    var u = coerce('u');
    var v = coerce('v');

    // Simple validation - check if we have the required arrays
    if(!x || !Array.isArray(x) || x.length === 0 ||
       !y || !Array.isArray(y) || y.length === 0) {
        traceOut.visible = false;
        return;
    }

    // If u/v are missing, default to zeros so the trace participates in calc/category logic
    var len = Math.min(x.length, y.length);
    if(!Array.isArray(u) || u.length === 0) {
        traceOut.u = new Array(len);
        for(var i = 0; i < len; i++) traceOut.u[i] = 0;
    }
    if(!Array.isArray(v) || v.length === 0) {
        traceOut.v = new Array(len);
        for(var j = 0; j < len; j++) traceOut.v[j] = 0;
    }

    // Set basic properties
    traceOut.type = 'quiver';

    // Sizing API similar to cone
    var sizemode = coerce('sizemode');
    coerce('sizeref', sizemode === 'raw' ? 1 : 0.5);
    coerce('anchor');

    // Set default values using coerce
    coerce('arrowsize', 1);
    // back-compat
    coerce('arrow_scale');
    coerce('hoverdistance', 20);

    // Line styling
    traceOut.line = {
        color: traceIn.line && traceIn.line.color ? traceIn.line.color : defaultColor,
        width: (traceIn.arrowwidth !== undefined) ? traceIn.arrowwidth : (traceIn.line && traceIn.line.width ? traceIn.line.width : 1),
        dash: traceIn.line && traceIn.line.dash ? traceIn.line.dash : 'solid',
        shape: traceIn.line && traceIn.line.shape ? traceIn.line.shape : 'linear',
        smoothing: traceIn.line && traceIn.line.smoothing ? traceIn.line.smoothing : 1,
        simplify: traceIn.line && traceIn.line.simplify !== undefined ? traceIn.line.simplify : true
    };

    // Hover and interaction - let the plots module handle hoverinfo defaults
    // traceOut.hoverinfo will be set by Lib.coerceHoverinfo in plots.js
    traceOut.hovertemplate = traceIn.hovertemplate;

    // Colorscale for magnitude coloring: compute cmin/cmax from |(u,v)|
    var cmin = Infinity;
    var cmax = -Infinity;
    for (var k = 0; k < len; k++) {
        var uu = (traceOut.u && traceOut.u[k]) || (traceIn.u && traceIn.u[k]) || 0;
        var vv = (traceOut.v && traceOut.v[k]) || (traceIn.v && traceIn.v[k]) || 0;
        var nrm = Math.sqrt(uu * uu + vv * vv);
        if (isFinite(nrm)) {
            if (nrm < cmin) cmin = nrm;
            if (nrm > cmax) cmax = nrm;
        }
    }
    if (!isFinite(cmin)) cmin = 0;
    if (!isFinite(cmax)) cmax = 1;
    if (traceIn.cmin === undefined && traceOut.cmin === undefined) traceOut.cmin = cmin;
    if (traceIn.cmax === undefined && traceOut.cmax === undefined) traceOut.cmax = cmax;
    // Flag colorscale and apply defaults (adds colorscale, showscale, colorbar, etc.)
    traceOut._hasColorscale = hasColorscale(traceIn) || true;
    colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: '', cLetter: 'c' });

    // Text
    traceOut.text = traceIn.text;
    traceOut.textposition = traceIn.textposition || 'middle center';
    
    // Use Lib.coerceFont to set textfont properly
    Lib.coerceFont(coerce, 'textfont', layout.font);
    
    coerce('selected.line.color');
    coerce('selected.line.width');
    coerce('selected.textfont.color');
    coerce('unselected.line.color');
    coerce('unselected.line.width');
    coerce('unselected.textfont.color');

    // Set the data length
    traceOut._length = len;
};



'use strict';

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    // Simple validation - just check if we have the required arrays
    if(!traceIn.x || !Array.isArray(traceIn.x) || traceIn.x.length === 0 ||
       !traceIn.y || !Array.isArray(traceIn.y) || traceIn.y.length === 0 ||
       !traceIn.u || !Array.isArray(traceIn.u) || traceIn.u.length === 0 ||
       !traceIn.v || !Array.isArray(traceIn.v) || traceIn.v.length === 0) {
        traceOut.visible = false;
        return;
    }

    // Set basic properties
    traceOut.type = 'scatterquiver';
    traceOut.visible = true;
    
    // Copy the data arrays
    traceOut.x = traceIn.x;
    traceOut.y = traceIn.y;
    traceOut.u = traceIn.u;
    traceOut.v = traceIn.v;

    // Set default values
    traceOut.scale = traceIn.scale !== undefined ? traceIn.scale : 0.1;
    traceOut.arrow_scale = traceIn.arrow_scale !== undefined ? traceIn.arrow_scale : 0.3;
    traceOut.angle = traceIn.angle !== undefined ? traceIn.angle : Math.PI / 9;
    traceOut.scaleratio = traceIn.scaleratio;

    // Line styling
    traceOut.line = {
        color: traceIn.line && traceIn.line.color ? traceIn.line.color : defaultColor,
        width: traceIn.line && traceIn.line.width ? traceIn.line.width : 1,
        dash: traceIn.line && traceIn.line.dash ? traceIn.line.dash : 'solid',
        shape: traceIn.line && traceIn.line.shape ? traceIn.line.shape : 'linear',
        smoothing: traceIn.line && traceIn.line.smoothing ? traceIn.line.smoothing : 1,
        simplify: traceIn.line && traceIn.line.simplify !== undefined ? traceIn.line.simplify : true
    };

    // Hover and interaction - fix the hoverinfo issue
    traceOut.hoverinfo = traceIn.hoverinfo || 'x+y+u+v+name';
    traceOut.hovertemplate = traceIn.hovertemplate;

    // Text
    traceOut.text = traceIn.text;
    traceOut.textposition = traceIn.textposition || 'middle center';
    traceOut.textfont = traceIn.textfont || {};

    // Selection styling
    traceOut.selected = traceIn.selected || {};
    traceOut.unselected = traceIn.unselected || {};

    // Set the data length
    traceOut._length = traceIn.x.length;
};
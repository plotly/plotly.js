'use strict';

var d3 = require('@plotly/d3');
var Lib = require('../../lib');

var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

// Stroke each arrow path according to the trace colorscale, using marker.color
// when it is an array of scalar values, otherwise falling back to the vector
// magnitude |(u, v)|. `paths` may be a multi-path selection or a single path.
function colorscaleStroke(paths, trace) {
    var marker = trace.marker || {};
    var colorFunc = Colorscale.makeColorScaleFuncFromTrace(marker);

    paths.style('stroke', function(cdi) {
        var markerColor = marker.color;
        var value;
        if(Lib.isArrayOrTypedArray(markerColor) && markerColor.length > cdi.i && isFinite(markerColor[cdi.i])) {
            value = markerColor[cdi.i];
        } else {
            var uVal = (trace.u && trace.u[cdi.i]) || 0;
            var vVal = (trace.v && trace.v[cdi.i]) || 0;
            value = Math.sqrt(uVal * uVal + vVal * vVal);
        }
        return colorFunc(value);
    });
}

function style(gd) {
    var s = d3.select(gd).selectAll('g.trace.quiver');
    s.each(function(d) {
        styleArrows(gd, d, d3.select(this));
    });
}

function styleOnSelect(gd, cd, sel) {
    styleArrows(gd, cd, sel);
}

function styleArrows(gd, cd, sel) {
    var trace = cd[0].trace;
    var marker = trace.marker || {};
    var markerLine = marker.line || {};
    var lineColor = Lib.isArrayOrTypedArray(marker.color) ? undefined : marker.color;
    var hasColorscale = trace._hasColorscale;

    if(!sel) return;

    if(trace.selectedpoints) {
        var selectedMarker = (trace.selected || {}).marker || {};
        var unselectedMarker = (trace.unselected || {}).marker || {};
        var selectedMarkerLine = selectedMarker.line || {};
        var unselectedMarkerLine = unselectedMarker.line || {};

        sel.selectAll('path.js-line').each(function(d) {
            var path = d3.select(this);
            var dim = !d.selected;

            var explicitColor = dim ? unselectedMarker.color : selectedMarker.color;
            var lineWidth = dim ?
                (unselectedMarkerLine.width !== undefined ? unselectedMarkerLine.width : markerLine.width) :
                (selectedMarkerLine.width !== undefined ? selectedMarkerLine.width : markerLine.width);

            if(explicitColor) {
                Drawing.lineGroupStyle(path, lineWidth, explicitColor, markerLine.dash);
                path.style('stroke-opacity', 1);
            } else {
                // Fall back to the arrow's own color (scalar marker.color, a
                // marker.color array, or the colorscale). When marker.color is an
                // array, lineColor is undefined and we cannot bake opacity into a
                // color, so we keep each arrow's color and dim unselected arrows
                // via stroke-opacity instead.
                Drawing.lineGroupStyle(path, lineWidth, lineColor, markerLine.dash);
                if(hasColorscale) colorscaleStroke(path, trace);
                path.style('stroke-opacity', dim ? DESELECTDIM : 1);
            }
        });

        Drawing.selectedTextStyle(sel.selectAll('text'), trace);
    } else {
        var paths = sel.selectAll('path.js-line');
        paths.call(Drawing.lineGroupStyle, markerLine.width, lineColor, markerLine.dash);
        if(hasColorscale) colorscaleStroke(paths, trace);
        paths.style('stroke-opacity', 1);
        Drawing.textPointStyle(sel.selectAll('text'), trace, gd);
    }
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect,
    colorscaleStroke: colorscaleStroke
};

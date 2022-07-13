'use strict';

var Colorscale = require('../../components/colorscale');
var makeColorMap = require('./make_color_map');
var endPlus = require('./end_plus');

function calc(gd, trace, opts) {
    var contours = trace.contours;
    var line = trace.line;
    var cs = contours.size || 1;
    var coloring = contours.coloring;
    var colorMap = makeColorMap(trace, {isColorbar: true});

    if(coloring === 'heatmap') {
        var cOpts = Colorscale.extractOpts(trace);
        opts._fillgradient = cOpts.reversescale ?
            Colorscale.flipScale(cOpts.colorscale) :
            cOpts.colorscale;
        opts._zrange = [cOpts.min, cOpts.max];
    } else if(coloring === 'fill') {
        opts._fillcolor = colorMap;
    }

    opts._line = {
        color: coloring === 'lines' ? colorMap : line.color,
        width: contours.showlines !== false ? line.width : 0,
        dash: line.dash
    };

    opts._levels = {
        start: contours.start,
        end: endPlus(contours),
        size: cs
    };
}

module.exports = {
    min: 'zmin',
    max: 'zmax',
    calc: calc
};

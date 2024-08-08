'use strict';

var d3 = require('@plotly/d3');
var resizeText = require('../bar/uniform_text').resizeText;
var styleOne = require('../treemap/style').styleOne;

function style(gd) {
    var s = gd._fullLayout._voronoilayer.selectAll('.trace');
    resizeText(gd, s, 'voronoi');

    s.each(function(cd) {
        var gTrace = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        gTrace.style('opacity', trace.opacity);

        gTrace.selectAll('path.surface').each(function(pt) {
            d3.select(this).call(styleOne, pt, trace, gd, {
                hovered: false
            });
        });
    });
}

module.exports = {
    style: style,
    styleOne: styleOne
};

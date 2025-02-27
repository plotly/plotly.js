'use strict';

var d3 = require('@plotly/d3');

var styleOne = require('./style_one');
var resizeText = require('../bar/uniform_text').resizeText;

module.exports = function style(gd) {
    var s = gd._fullLayout._pielayer.selectAll('.trace');
    resizeText(gd, s, 'pie');

    s.each(function(cd) {
        var cd0 = cd[0];
        var trace = cd0.trace;
        var traceSelection = d3.select(this);

        traceSelection.style({opacity: trace.opacity});

        traceSelection.selectAll('path.surface').each(function(pt) {
            d3.select(this).call(styleOne, pt, trace, gd);
        });
    });
};

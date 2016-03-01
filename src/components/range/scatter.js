'use strict';

var Helpers = require('./helpers');
var svgNS = 'http://www.w3.org/2000/svg';

module.exports = function makeScatterLines(gd, w, h) {

    var traces = gd._fullData,
        minX = gd._fullLayout.xaxis.range[0],
        maxX = gd._fullLayout.xaxis.range[1],
        minY = gd._fullLayout.yaxis.range[0],
        maxY = gd._fullLayout.yaxis.range[1];

    var processor = {
        'linear': function(val) { return val; },
        'log': Math.log,
        'date': function(val) { return new Date(val).getTime(); }
    };

    var processX = processor[gd._fullLayout.xaxis.type],
        processY = processor[gd._fullLayout.yaxis.type];

    var rangePlot = document.createElementNS(svgNS, 'g');


    for(var i = 0; i < traces.length; i++) {

        var trace = traces[i],
            pointPairs = [];

        for(var k = 0; k < trace.x.length; k++) {
            var x = processX(trace.x[k]),
                y = processY(trace.y[k]);

            var posX = w * (x - minX) / (maxX - minX),
                posY = h * (1 - (y - minY) / (maxY - minY));

            pointPairs.push([posX, posY]);
        }


        // create the line
        var line = document.createElementNS(svgNS, 'polyline'),
            linePoints = pointPairs.map(function(p) {
                return p[0] + ',' + p[1];
            }).join(' ');

        Helpers.setAttributes(line, {
            'points': linePoints,
            'fill': 'none',
            'stroke': trace.line ? trace.line.color : 'transparent',
            'opacity': 1
        });

        Helpers.appendChildren(rangePlot, [line]);


        // create the points
        var points = pointPairs.map(function(p) {
            var point = document.createElementNS(svgNS, 'circle');

            Helpers.setAttributes(point, {
                'cx': p[0],
                'cy': p[1],
                'r': 2,
                'fill': trace.marker ? trace.marker.color : 'transparent'
            });

            return point;
        });

        Helpers.appendChildren(rangePlot, points);
    }

    return rangePlot;
};

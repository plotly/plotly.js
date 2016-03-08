'use strict';

var Helpers = require('./helpers');
var Symbols = require('../drawing/symbol_defs');

var svgNS = 'http://www.w3.org/2000/svg';

module.exports = function rangePlot(gd, w, h) {

    var traces = gd._fullData,
        minX = gd._fullLayout.xaxis.range[0],
        maxX = gd._fullLayout.xaxis.range[1],
        minY = gd._fullLayout.yaxis.range[0],
        maxY = gd._fullLayout.yaxis.range[1];

    var dataProcessors = {
        'linear': function(val) { return val; },
        'log': function(val) { return Math.log(val)/Math.log(10); },
        'date': function(val) { return new Date(val).getTime(); },
        'category': function(_, i) { return i; }
    };

    var processX = dataProcessors[gd._fullLayout.xaxis.type || 'category'],
        processY = dataProcessors[gd._fullLayout.yaxis.type || 'category'];


    var rangePlot = document.createElementNS(svgNS, 'g');
    var clip = document.createElementNS(svgNS, 'clipPath');
    var clipPath = document.createElementNS(svgNS, 'path');

    clipPath.setAttribute('d', ['M0,0', w + ',0', w + ',' + h, '0,' + h, 'Z'].join(' '));

    clip.setAttribute('id', 'range-clip-path');
    clip.appendChild(clipPath);

    rangePlot.setAttribute('clip-path', 'url(#range-clip-path)');
    rangePlot.appendChild(clip);


    var allowedTypes = ['scatter', 'scattergl'];

    for(var i = 0; i < traces.length; i++) {

        var trace = traces[i],
            pointPairs = [];

        if(allowedTypes.indexOf(trace.type) < 0) {
            console.log('Trace type ' + trace.type + ' not supported for range slider!');
            continue;
        }

        for(var k = 0; k < trace.x.length; k++) {
            var x = processX(trace.x[k], k),
                y = processY(trace.y[k], k);

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


        // create points if there's markers
        if(trace.marker) {
            var points = pointPairs.map(function(p) {
                var point = document.createElementNS(svgNS, 'g'),
                    symbol = document.createElementNS(svgNS, 'path');

                Helpers.setAttributes(symbol, {
                    'd': Symbols[trace.marker.symbol].f(2),
                    'fill': trace.marker.color,
                    'stroke': trace.marker.line.color,
                    'stroke-width': trace.marker.line.width
                });

                Helpers.setAttributes(point, {
                    'transform': 'translate(' + p[0] + ',' + p[1] + ')'
                });

                point.appendChild(symbol);

                return point;
            });

            Helpers.appendChildren(rangePlot, points);
        }
    }

    return rangePlot;
};

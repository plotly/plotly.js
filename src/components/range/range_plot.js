/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Helpers = require('./helpers');
var Symbols = require('../drawing/symbol_defs');
var Drawing = require('../drawing');

var svgNS = 'http://www.w3.org/2000/svg';

module.exports = function rangePlot(gd, w, h) {

    var traces = gd._fullData,
        minX = gd._fullLayout.xaxis.range[0],
        maxX = gd._fullLayout.xaxis.range[1],
        minY = gd._fullLayout.yaxis.range[0],
        maxY = gd._fullLayout.yaxis.range[1];


    // create elements for plot and its clip
    var clipPath = document.createElementNS(svgNS, 'path');
    clipPath.setAttribute('d', ['M0,0', w + ',0', w + ',' + h, '0,' + h, 'Z'].join(' '));

    var clip = document.createElementNS(svgNS, 'clipPath');
    clip.setAttribute('id', 'range-clip-path');
    clip.appendChild(clipPath);

    var rangePlot = document.createElementNS(svgNS, 'g');
    rangePlot.setAttribute('clip-path', 'url(#range-clip-path)');
    rangePlot.appendChild(clip);


    var dataProcessors = {
        'linear': function(val) { return val; },
        'log': function(val) { return Math.log(val)/Math.log(10); },
        'date': function(val) { return new Date(val).getTime(); },
        'category': function(_, i) { return i; }
    };

    var processX = dataProcessors[gd._fullLayout.xaxis.type || 'category'],
        processY = dataProcessors[gd._fullLayout.yaxis.type || 'category'];


    // for now, only scatter traces are supported
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

        // more trace type range plots can be added here
        Helpers.appendChildren(rangePlot, makeScatter(trace, pointPairs, w, h));
    }


    return rangePlot;
};


function makeScatter(trace, pointPairs, w, h) {

    // create the line
    var line = document.createElementNS(svgNS, 'path');
    if(trace.line) {
        var linePath = Drawing.smoothopen(pointPairs, trace.line.smoothing || 0);

        Helpers.setAttributes(line, {
            'd': linePath,
            'fill': 'none',
            'stroke': trace.line ? trace.line.color : 'transparent',
            'stroke-width': trace.line.width / 2 || 1,
            'opacity': 1
        });
    }


    // create points if there's markers
    var markers = document.createElementNS(svgNS, 'g');
    if(trace.marker) {

        var points = pointPairs.map(function(p, i) {
            var point = document.createElementNS(svgNS, 'g'),
                symbol = document.createElementNS(svgNS, 'path'),
                size;

            if(Array.isArray(trace.marker.size)) {
                size = typeof trace.marker.size[i] === 'number' ?
                    Math.max(trace.marker.size[i] / (trace.marker.sizeref || 1) / 15, 0) :
                    0;
            } else {
                size = Math.max(trace.marker.size / 15, 2);
            }

            Helpers.setAttributes(symbol, {
                'd': Symbols[trace.marker.symbol].f(size),
                'fill': trace.marker.color,
                'stroke': trace.marker.line.color,
                'stroke-width': trace.marker.line.width,
                'opacity': trace.marker.opacity
            });

            Helpers.setAttributes(point, {
                'transform': 'translate(' + p[0] + ',' + p[1] + ')'
            });

            point.appendChild(symbol);

            return point;
        });

        Helpers.appendChildren(markers, points);
    }


    // create fill if set
    var fill = document.createElementNS(svgNS, 'path');
    if(trace.fill !== 'none') {

        switch(trace.fill) {
            case 'tozeroy':
                pointPairs.unshift([pointPairs[0][0], h]);
                pointPairs.push([pointPairs[pointPairs.length - 1][0], h]);
                break;

            case 'tozerox':
                pointPairs.unshift([0, pointPairs[pointPairs.length - 1][1]]);
                break;

            default:
                console.log('Fill type ' + trace.fill + ' not supported for range slider! (yet...)');
                break;
        }

        var fillPath = Drawing.smoothopen(pointPairs, trace.line.smoothing || 0);

        Helpers.setAttributes(fill, {
            'd': fillPath,
            'fill': trace.fillcolor || 'transparent'
        });
    }


    return [line, markers, fill];
}

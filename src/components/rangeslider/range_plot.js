/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Symbols = require('../drawing/symbol_defs');
var Drawing = require('../drawing');

var helpers = require('./helpers');
var svgNS = require('../../constants/xmlns_namespaces').svg;

module.exports = function rangePlot(gd, w, h) {

    var fullLayout = gd._fullLayout,
        traces = gd._fullData,
        xaxis = fullLayout.xaxis,
        yaxis = fullLayout.yaxis,
        minX = xaxis.rangeslider.range[0],
        maxX = xaxis.rangeslider.range[1],
        minY = yaxis.range[0],
        maxY = yaxis.range[1];


    // create elements for plot and its clip
    var clipPath = document.createElementNS(svgNS, 'path');
    clipPath.setAttribute('d', ['M0,0', w + ',0', w + ',' + h, '0,' + h, 'Z'].join(' '));

    var clip = document.createElementNS(svgNS, 'clipPath');
    clip.setAttribute('id', 'range-clip-path');
    clip.appendChild(clipPath);

    var clipDefs = document.createElementNS(svgNS, 'defs');
    clipDefs.appendChild(clip);

    var rangePlot = document.createElementNS(svgNS, 'g');
    d3.select(rangePlot).call(Drawing.setClipUrl, 'range-clip-path');
    rangePlot.appendChild(clipDefs);


    // for now, only scatter traces are supported
    var allowedTypes = ['scatter'];

    for(var i = 0; i < traces.length; i++) {

        var trace = traces[i],
            pointPairs = [];

        if(allowedTypes.indexOf(trace.type) < 0) {
            console.log('Trace type ' + trace.type + ' not supported for range slider!');
            continue;
        }

        var x = makeLinearData(trace, xaxis),
            y = makeLinearData(trace, yaxis);

        for(var k = 0; k < x.length; k++) {

            var posX = w * (x[k] - minX) / (maxX - minX),
                posY = h * (1 - (y[k] - minY) / (maxY - minY));

            if(!isNaN(posX) && !isNaN(posY)) {
                pointPairs.push([posX, posY]);
            }
        }

        // more trace type range plots can be added here
        helpers.appendChildren(rangePlot, makeScatter(trace, pointPairs, w, h));
    }


    return rangePlot;
};

function makeLinearData(trace, axis) {
    var data = axis.makeCalcdata(trace || [], axis._id[0]);

    for(var i = 0; i < data.length; i++) {
        data[i] = axis.c2l(data[i]);
    }

    return data;
}


function makeScatter(trace, pointPairs, w, h) {

    // create the line
    var line, markers, fill;

    if(trace.line) {
        line = document.createElementNS(svgNS, 'path');

        var linePath = Drawing.smoothopen(pointPairs, trace.line.smoothing || 0);

        helpers.setAttributes(line, {
            'd': linePath,
            'fill': 'none',
            'stroke': trace.line ? trace.line.color : 'transparent',
            'stroke-width': trace.line.width / 2 || 1,
            'opacity': 1
        });
    }

    // create points if there's markers
    if(trace.marker) {
        markers = document.createElementNS(svgNS, 'g');

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

            helpers.setAttributes(symbol, {
                'd': Symbols[trace.marker.symbol].f(size),
                'fill': trace.marker.color,
                'stroke': trace.marker.line.color,
                'stroke-width': trace.marker.line.width,
                'opacity': trace.marker.opacity
            });

            helpers.setAttributes(point, {
                'transform': 'translate(' + p[0] + ',' + p[1] + ')'
            });

            point.appendChild(symbol);

            return point;
        });

        helpers.appendChildren(markers, points);
    }


    // create fill if set
    if(trace.fill !== 'none') {
        fill = document.createElementNS(svgNS, 'path');

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

        helpers.setAttributes(fill, {
            'd': fillPath,
            'fill': trace.fillcolor || 'transparent'
        });
    }


    return [line, markers, fill];
}

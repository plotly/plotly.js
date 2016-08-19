/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Color = require('../color');
var Drawing = require('../drawing');

var ARROWPATHS = require('./arrow_paths');

// add arrowhead(s) to a path or line d3 element el3
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)

module.exports = function drawArrowHead(el3, style, ends, mag) {
    if(!isNumeric(mag)) mag = 1;
    var el = el3.node(),
        headStyle = ARROWPATHS[style||0];
    if(!headStyle) return;

    if(typeof ends !== 'string' || !ends) ends = 'end';

    var scale = (Drawing.getPx(el3, 'stroke-width') || 1) * mag,
        stroke = el3.style('stroke') || Color.defaultLine,
        opacity = el3.style('stroke-opacity') || 1,
        doStart = ends.indexOf('start') >= 0,
        doEnd = ends.indexOf('end') >= 0,
        backOff = headStyle.backoff * scale,
        start,
        end,
        startRot,
        endRot;

    if(el.nodeName === 'line') {
        start = {x: +el3.attr('x1'), y: +el3.attr('y1')};
        end = {x: +el3.attr('x2'), y: +el3.attr('y2')};
        startRot = Math.atan2(start.y - end.y, start.x - end.x);
        endRot = startRot + Math.PI;
        if(backOff) {
            var backOffX = backOff * Math.cos(startRot),
                backOffY = backOff * Math.sin(startRot);

            if(doStart) {
                start.x -= backOffX;
                start.y -= backOffY;
                el3.attr({x1: start.x, y1: start.y});
            }
            if(doEnd) {
                end.x += backOffX;
                end.y += backOffY;
                el3.attr({x2: end.x, y2: end.y});
            }
        }
    }
    else if(el.nodeName === 'path') {
        var pathlen = el.getTotalLength(),
            // using dash to hide the backOff region of the path.
            // if we ever allow dash for the arrow we'll have to
            // do better than this hack... maybe just manually
            // combine the two
            dashArray = '';

        if(doStart) {
            var start0 = el.getPointAtLength(0),
                dstart = el.getPointAtLength(0.1);
            startRot = Math.atan2(start0.y - dstart.y, start0.x - dstart.x);
            start = el.getPointAtLength(Math.min(backOff, pathlen));
            if(backOff) dashArray = '0px,' + backOff + 'px,';
        }

        if(doEnd) {
            var end0 = el.getPointAtLength(pathlen),
                dend = el.getPointAtLength(pathlen - 0.1);
            endRot = Math.atan2(end0.y - dend.y, end0.x - dend.x);
            end = el.getPointAtLength(Math.max(0, pathlen - backOff));

            if(backOff) {
                var shortening = dashArray ? 2 * backOff : backOff;
                dashArray += (pathlen - shortening) + 'px,' + pathlen + 'px';
            }
        }
        else if(dashArray) dashArray += pathlen + 'px';

        if(dashArray) el3.style('stroke-dasharray', dashArray);
    }

    var drawhead = function(p, rot) {
        if(style > 5) rot = 0; // don't rotate square or circle
        d3.select(el.parentElement).append('path')
            .attr({
                'class': el3.attr('class'),
                d: headStyle.path,
                transform:
                    'translate(' + p.x + ',' + p.y + ')' +
                    'rotate(' + (rot * 180 / Math.PI) + ')' +
                    'scale(' + scale + ')'
            })
            .style({
                fill: stroke,
                opacity: opacity,
                'stroke-width': 0
            });
    };

    if(doStart) drawhead(start, startRot);
    if(doEnd) drawhead(end, endRot);
};

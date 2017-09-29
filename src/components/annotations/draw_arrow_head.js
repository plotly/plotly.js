/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Color = require('../color');
var Drawing = require('../drawing');

var ARROWPATHS = require('./arrow_paths');

/**
 * Add arrowhead(s) to a path or line element
 *
 * @param {d3.selection} el3: a d3-selected line or path element
 *
 * @param {string} ends: 'start', 'end', or 'start+end' for which ends get arrowheads
 *
 * @param {object} options: style information. Must have all the following:
 * @param {number} options.arrowhead: head style - see ./arrow_paths
 * @param {number} options.arrowsize: relative size of the head vs line width
 * @param {number} options.standoff: distance in px to move the arrow point from its target
 */
module.exports = function drawArrowHead(el3, ends, options) {
    var el = el3.node();
    var headStyle = ARROWPATHS[options.arrowhead || 0];
    var scale = (Drawing.getPx(el3, 'stroke-width') || 1) * options.arrowsize;
    var stroke = el3.style('stroke') || Color.defaultLine;
    var opacity = el3.style('stroke-opacity') || 1;
    var doStart = ends.indexOf('start') >= 0;
    var doEnd = ends.indexOf('end') >= 0;
    var backOff = headStyle.backoff * scale + options.standoff;

    var start, end, startRot, endRot;

    if(el.nodeName === 'line') {
        start = {x: +el3.attr('x1'), y: +el3.attr('y1')};
        end = {x: +el3.attr('x2'), y: +el3.attr('y2')};

        var dx = start.x - end.x;
        var dy = start.y - end.y;

        startRot = Math.atan2(dy, dx);
        endRot = startRot + Math.PI;
        if(backOff) {
            if(backOff * backOff > dx * dx + dy * dy) {
                hideLine();
                return;
            }
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

        if(pathlen < backOff) {
            hideLine();
            return;
        }

        if(doStart) {
            var start0 = el.getPointAtLength(0);
            var dstart = el.getPointAtLength(0.1);

            startRot = Math.atan2(start0.y - dstart.y, start0.x - dstart.x);
            start = el.getPointAtLength(Math.min(backOff, pathlen));

            if(backOff) dashArray = '0px,' + backOff + 'px,';
        }

        if(doEnd) {
            var end0 = el.getPointAtLength(pathlen);
            var dend = el.getPointAtLength(pathlen - 0.1);

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

    function hideLine() { el3.style('stroke-dasharray', '0px,100px'); }

    function drawhead(p, rot) {
        if(!headStyle.path) return;
        if(options.arrowhead > 5) rot = 0; // don't rotate square or circle

        d3.select(el.parentNode).append('path')
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
    }

    if(doStart) drawhead(start, startRot);
    if(doEnd) drawhead(end, endRot);
};

/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Color = require('../../components/color');
var Lib = require('../../lib');
var helpers = require('../sunburst/helpers');
var resizeText = require('../bar/uniform_text').resizeText;

function style(gd) {
    var s = gd._fullLayout._treemaplayer.selectAll('.trace');
    resizeText(gd, s, 'treemap');

    s.each(function(cd) {
        var gTrace = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        gTrace.style('opacity', trace.opacity);

        gTrace.selectAll('path.surface').each(function(pt) {
            d3.select(this).call(styleOne, pt, trace, {
                hovered: false
            });
        });
    });
}

function styleOne(s, pt, trace, opts) {
    var hovered = (opts || {}).hovered;
    var cdi = pt.data.data;
    var ptNumber = cdi.i;
    var lineColor;
    var lineWidth;
    var fillColor = cdi.color;
    var isRoot = helpers.isHierarchyRoot(pt);
    var opacity = 1;

    if(hovered) {
        lineColor = trace._hovered.marker.line.color;
        lineWidth = trace._hovered.marker.line.width;
    } else {
        if(isRoot && fillColor === trace.root.color) {
            opacity = 100;
            lineColor = 'rgba(0,0,0,0)';
            lineWidth = 0;
        } else {
            lineColor = Lib.castOption(trace, ptNumber, 'marker.line.color') || Color.defaultLine;
            lineWidth = Lib.castOption(trace, ptNumber, 'marker.line.width') || 0;

            if(!trace._hasColorscale && !pt.onPathbar) {
                var depthfade = trace.marker.depthfade;
                if(depthfade) {
                    var fadedColor = Color.combine(Color.addOpacity(trace._backgroundColor, 0.75), fillColor);
                    var n;

                    if(depthfade === true) {
                        var maxDepth = helpers.getMaxDepth(trace);
                        if(isFinite(maxDepth)) {
                            if(helpers.isLeaf(pt)) {
                                n = 0;
                            } else {
                                n = (trace._maxVisibleLayers) - (pt.data.depth - trace._entryDepth);
                            }
                        } else {
                            n = pt.data.height + 1;
                        }
                    } else { // i.e. case of depthfade === 'reversed'
                        n = pt.data.depth - trace._entryDepth;
                        if(!trace._atRootLevel) n++;
                    }

                    if(n > 0) {
                        for(var i = 0; i < n; i++) {
                            var ratio = 0.5 * i / n;
                            fillColor = Color.combine(Color.addOpacity(fadedColor, ratio), fillColor);
                        }
                    }
                }
            }
        }
    }

    s.style('stroke-width', lineWidth)
        .call(Color.fill, fillColor)
        .call(Color.stroke, lineColor)
        .style('opacity', opacity);
}

module.exports = {
    style: style,
    styleOne: styleOne
};

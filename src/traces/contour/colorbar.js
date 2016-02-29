/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plots = require('../../plots/plots');
var getColorscale = require('../../components/colorscale/get_scale');
var drawColorbar = require('../../components/colorbar/draw');


module.exports = function colorbar(gd, cd) {
    var trace = cd[0].trace,
        cbId = 'cb' + trace.uid;

    gd._fullLayout._infolayer.selectAll('.' + cbId).remove();

    if(trace.showscale === false) {
        Plots.autoMargin(gd, cbId);
        return;
    }

    var cb = drawColorbar(gd, cbId);
    cd[0].t.cb = cb;

    var contours = trace.contours,
        line = trace.line,
        cs = contours.size||1,
        nc = Math.floor((contours.end + cs/10 - contours.start)/cs)+1,
        scl = getColorscale(trace.colorscale),
        extraLevel = contours.coloring==='lines' ? 0 : 1,
        colormap = d3.scale.linear().interpolate(d3.interpolateRgb),
        colorDomain = scl.map(function(si) {
            return (si[0]*(nc+extraLevel-1)-(extraLevel/2)) * cs +
                contours.start;
        }),
        colorRange = scl.map(function(si) { return si[1]; });

    // colorbar fill and lines
    if(contours.coloring==='heatmap') {
        if(trace.zauto && trace.autocontour===false) {
            trace.zmin = contours.start-cs/2;
            trace.zmax = trace.zmin+nc*cs;
        }
        cb.filllevels({
            start: trace.zmin,
            end: trace.zmax,
            size: (trace.zmax-trace.zmin)/254
        });
        colorDomain = scl.map(function(si) {
            return si[0]*(trace.zmax-trace.zmin) + trace.zmin;
        });

        // do the contours extend beyond the colorscale?
        // if so, extend the colorscale with constants
        var zRange = d3.extent([trace.zmin, trace.zmax, contours.start,
                contours.start + cs*(nc-1)]),
            zmin = zRange[trace.zmin<trace.zmax ? 0 : 1],
            zmax = zRange[trace.zmin<trace.zmax ? 1 : 0];
        if(zmin!==trace.zmin) {
            colorDomain.splice(0, 0, zmin);
            colorRange.splice(0, 0, colorRange[0]);
        }
        if(zmax!==trace.zmax) {
            colorDomain.push(zmax);
            colorRange.push(colorRange[colorRange.length-1]);
        }
    }

    colormap.domain(colorDomain).range(colorRange);

    cb.fillcolor(contours.coloring==='fill' || contours.coloring==='heatmap' ?
            colormap : '')
        .line({
            color: contours.coloring==='lines' ? colormap : line.color,
            width: contours.showlines!==false ? line.width : 0,
            dash: line.dash
        })
        .levels({
            start: contours.start,
            end: contours.end,
            size: cs
        })
        .options(trace.colorbar)();
};

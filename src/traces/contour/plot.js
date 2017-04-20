/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');

var heatmapPlot = require('../heatmap/plot');
var makeCrossings = require('./make_crossings');
var findAllPaths = require('./find_all_paths');
var endPlus = require('./end_plus');


module.exports = function plot(gd, plotinfo, cdcontours) {
    for(var i = 0; i < cdcontours.length; i++) {
        plotOne(gd, plotinfo, cdcontours[i]);
    }
};

function plotOne(gd, plotinfo, cd) {
    var trace = cd[0].trace,
        x = cd[0].x,
        y = cd[0].y,
        contours = trace.contours,
        uid = trace.uid,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        fullLayout = gd._fullLayout,
        id = 'contour' + uid,
        pathinfo = emptyPathinfo(contours, plotinfo, cd[0]);

    if(trace.visible !== true) {
        fullLayout._paper.selectAll('.' + id + ',.hm' + uid).remove();
        fullLayout._infolayer.selectAll('.cb' + uid).remove();
        return;
    }

    // use a heatmap to fill - draw it behind the lines
    if(contours.coloring === 'heatmap') {
        if(trace.zauto && (trace.autocontour === false)) {
            trace._input.zmin = trace.zmin =
                contours.start - contours.size / 2;
            trace._input.zmax = trace.zmax =
                trace.zmin + pathinfo.length * contours.size;
        }

        heatmapPlot(gd, plotinfo, [cd]);
    }
    // in case this used to be a heatmap (or have heatmap fill)
    else {
        fullLayout._paper.selectAll('.hm' + uid).remove();
        fullLayout._infolayer.selectAll('g.rangeslider-container')
            .selectAll('.hm' + uid).remove();
    }

    makeCrossings(pathinfo);
    findAllPaths(pathinfo);

    var leftedge = xa.c2p(x[0], true),
        rightedge = xa.c2p(x[x.length - 1], true),
        bottomedge = ya.c2p(y[0], true),
        topedge = ya.c2p(y[y.length - 1], true),
        perimeter = [
            [leftedge, topedge],
            [rightedge, topedge],
            [rightedge, bottomedge],
            [leftedge, bottomedge]
        ];

    // draw everything
    var plotGroup = makeContourGroup(plotinfo, cd, id);
    makeBackground(plotGroup, perimeter, contours);
    makeFills(plotGroup, pathinfo, perimeter, contours);
    makeLines(plotGroup, pathinfo, contours);
    clipGaps(plotGroup, plotinfo, cd[0], perimeter);
}

function emptyPathinfo(contours, plotinfo, cd0) {
    var cs = contours.size,
        pathinfo = [],
        end = endPlus(contours);

    for(var ci = contours.start; ci < end; ci += cs) {
        pathinfo.push({
            level: ci,
            // all the cells with nontrivial marching index
            crossings: {},
            // starting points on the edges of the lattice for each contour
            starts: [],
            // all unclosed paths (may have less items than starts,
            // if a path is closed by rounding)
            edgepaths: [],
            // all closed paths
            paths: [],
            // store axes so we can convert to px
            xaxis: plotinfo.xaxis,
            yaxis: plotinfo.yaxis,
            // full data arrays to use for interpolation
            x: cd0.x,
            y: cd0.y,
            z: cd0.z,
            smoothing: cd0.trace.line.smoothing
        });

        if(pathinfo.length > 1000) {
            Lib.warn('Too many contours, clipping at 1000', contours);
            break;
        }
    }
    return pathinfo;
}
function makeContourGroup(plotinfo, cd, id) {
    var plotgroup = plotinfo.plot.select('.maplayer')
        .selectAll('g.contour.' + id)
        .data(cd);

    plotgroup.enter().append('g')
        .classed('contour', true)
        .classed(id, true);

    plotgroup.exit().remove();

    return plotgroup;
}

function makeBackground(plotgroup, perimeter, contours) {
    var bggroup = plotgroup.selectAll('g.contourbg').data([0]);
    bggroup.enter().append('g').classed('contourbg', true);

    var bgfill = bggroup.selectAll('path')
        .data(contours.coloring === 'fill' ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();
    bgfill
        .attr('d', 'M' + perimeter.join('L') + 'Z')
        .style('stroke', 'none');
}

function makeFills(plotgroup, pathinfo, perimeter, contours) {
    var fillgroup = plotgroup.selectAll('g.contourfill')
        .data([0]);
    fillgroup.enter().append('g')
        .classed('contourfill', true);

    var fillitems = fillgroup.selectAll('path')
        .data(contours.coloring === 'fill' ? pathinfo : []);
    fillitems.enter().append('path');
    fillitems.exit().remove();
    fillitems.each(function(pi) {
        // join all paths for this level together into a single path
        // first follow clockwise around the perimeter to close any open paths
        // if the whole perimeter is above this level, start with a path
        // enclosing the whole thing. With all that, the parity should mean
        // that we always fill everything above the contour, nothing below
        var fullpath = joinAllPaths(pi, perimeter);

        if(!fullpath) d3.select(this).remove();
        else d3.select(this).attr('d', fullpath).style('stroke', 'none');
    });
}

function joinAllPaths(pi, perimeter) {
    var edgeVal2 = Math.min(pi.z[0][0], pi.z[0][1]),
        fullpath = (pi.edgepaths.length || edgeVal2 <= pi.level) ?
            '' : ('M' + perimeter.join('L') + 'Z'),
        i = 0,
        startsleft = pi.edgepaths.map(function(v, i) { return i; }),
        newloop = true,
        endpt,
        newendpt,
        cnt,
        nexti,
        possiblei,
        addpath;

    function istop(pt) { return Math.abs(pt[1] - perimeter[0][1]) < 0.01; }
    function isbottom(pt) { return Math.abs(pt[1] - perimeter[2][1]) < 0.01; }
    function isleft(pt) { return Math.abs(pt[0] - perimeter[0][0]) < 0.01; }
    function isright(pt) { return Math.abs(pt[0] - perimeter[2][0]) < 0.01; }

    while(startsleft.length) {
        addpath = Drawing.smoothopen(pi.edgepaths[i], pi.smoothing);
        fullpath += newloop ? addpath : addpath.replace(/^M/, 'L');
        startsleft.splice(startsleft.indexOf(i), 1);
        endpt = pi.edgepaths[i][pi.edgepaths[i].length - 1];
        nexti = -1;

        // now loop through sides, moving our endpoint until we find a new start
        for(cnt = 0; cnt < 4; cnt++) { // just to prevent infinite loops
            if(!endpt) {
                Lib.log('Missing end?', i, pi);
                break;
            }

            if(istop(endpt) && !isright(endpt)) newendpt = perimeter[1]; // right top
            else if(isleft(endpt)) newendpt = perimeter[0]; // left top
            else if(isbottom(endpt)) newendpt = perimeter[3]; // right bottom
            else if(isright(endpt)) newendpt = perimeter[2]; // left bottom

            for(possiblei = 0; possiblei < pi.edgepaths.length; possiblei++) {
                var ptNew = pi.edgepaths[possiblei][0];
                // is ptNew on the (horz. or vert.) segment from endpt to newendpt?
                if(Math.abs(endpt[0] - newendpt[0]) < 0.01) {
                    if(Math.abs(endpt[0] - ptNew[0]) < 0.01 &&
                            (ptNew[1] - endpt[1]) * (newendpt[1] - ptNew[1]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                }
                else if(Math.abs(endpt[1] - newendpt[1]) < 0.01) {
                    if(Math.abs(endpt[1] - ptNew[1]) < 0.01 &&
                            (ptNew[0] - endpt[0]) * (newendpt[0] - ptNew[0]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                }
                else {
                    Lib.log('endpt to newendpt is not vert. or horz.',
                        endpt, newendpt, ptNew);
                }
            }

            endpt = newendpt;

            if(nexti >= 0) break;
            fullpath += 'L' + newendpt;
        }

        if(nexti === pi.edgepaths.length) {
            Lib.log('unclosed perimeter path');
            break;
        }

        i = nexti;

        // if we closed back on a loop we already included,
        // close it and start a new loop
        newloop = (startsleft.indexOf(i) === -1);
        if(newloop) {
            i = startsleft[0];
            fullpath += 'Z';
        }
    }

    // finally add the interior paths
    for(i = 0; i < pi.paths.length; i++) {
        fullpath += Drawing.smoothclosed(pi.paths[i], pi.smoothing);
    }

    return fullpath;
}

function makeLines(plotgroup, pathinfo, contours) {
    var smoothing = pathinfo[0].smoothing;

    var linegroup = plotgroup.selectAll('g.contourlevel')
        .data(contours.showlines === false ? [] : pathinfo);
    linegroup.enter().append('g')
        .classed('contourlevel', true);
    linegroup.exit().remove();

    var opencontourlines = linegroup.selectAll('path.openline')
        .data(function(d) { return d.edgepaths; });
    opencontourlines.enter().append('path')
        .classed('openline', true);
    opencontourlines.exit().remove();
    opencontourlines
        .attr('d', function(d) {
            return Drawing.smoothopen(d, smoothing);
        })
        .style('stroke-miterlimit', 1)
        .style('vector-effect', 'non-scaling-stroke');

    var closedcontourlines = linegroup.selectAll('path.closedline')
        .data(function(d) { return d.paths; });
    closedcontourlines.enter().append('path')
        .classed('closedline', true);
    closedcontourlines.exit().remove();
    closedcontourlines
        .attr('d', function(d) {
            return Drawing.smoothclosed(d, smoothing);
        })
        .style('stroke-miterlimit', 1)
        .style('vector-effect', 'non-scaling-stroke');
}

function clipGaps(plotGroup, plotinfo, cd0, perimeter) {
    var clipId = 'clip' + cd0.trace.uid;

    var defs = plotinfo.plot.selectAll('defs')
        .data([0]);
    defs.enter().append('defs');

    var clipPath = defs.selectAll('#' + clipId)
        .data(cd0.trace.connectgaps ? [] : [0]);
    clipPath.enter().append('clipPath').attr('id', clipId);
    clipPath.exit().remove();

    if(cd0.trace.connectgaps === false) {
        var clipPathInfo = {
            // fraction of the way from missing to present point
            // to draw the boundary.
            // if you make this 1 (or 1-epsilon) then a point in
            // a sea of missing data will disappear entirely.
            level: 0.9,
            crossings: {},
            starts: [],
            edgepaths: [],
            paths: [],
            xaxis: plotinfo.xaxis,
            yaxis: plotinfo.yaxis,
            x: cd0.x,
            y: cd0.y,
            // 0 = no data, 1 = data
            z: makeClipMask(cd0),
            smoothing: 0
        };

        makeCrossings([clipPathInfo]);
        findAllPaths([clipPathInfo]);
        var fullpath = joinAllPaths(clipPathInfo, perimeter);

        var path = clipPath.selectAll('path')
            .data([0]);
        path.enter().append('path');
        path.attr('d', fullpath);
    }
    else clipId = null;

    plotGroup.call(Drawing.setClipUrl, clipId);
    plotinfo.plot.selectAll('.hm' + cd0.trace.uid)
        .call(Drawing.setClipUrl, clipId);
}

function makeClipMask(cd0) {
    var empties = cd0.trace._emptypoints,
        z = [],
        m = cd0.z.length,
        n = cd0.z[0].length,
        i,
        row = [],
        emptyPoint;

    for(i = 0; i < n; i++) row.push(1);
    for(i = 0; i < m; i++) z.push(row.slice());
    for(i = 0; i < empties.length; i++) {
        emptyPoint = empties[i];
        z[emptyPoint[0]][emptyPoint[1]] = 0;
    }
    // save this mask to determine whether to show this data in hover
    cd0.zmask = z;
    return z;
}

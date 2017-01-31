/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var map1dArray = require('../carpet/map_1d_array');
var makepath = require('../carpet/makepath');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');

var makeCrossings = require('../contour/make_crossings');
var findAllPaths = require('../contour/find_all_paths');
var axisAlignedLine = require('../carpet/axis_aligned_line');

function makeg(el, type, klass) {
    var join = el.selectAll(type + '.' + klass).data([0]);
    join.enter().append(type).classed(klass, true);
    return join;
}

module.exports = function plot(gd, plotinfo, cdcontours) {
    for(var i = 0; i < cdcontours.length; i++) {
        plotOne(gd, plotinfo, cdcontours[i]);
    }
};

function plotOne(gd, plotinfo, cd) {
    var i, j, k, path;
    var trace = cd[0].trace;
    var carpet = trace._carpet;
    var a = cd[0].a;
    var b = cd[0].b;
    // var aa = carpet.aaxis;
    // var ba = carpet.baxis;
    var contours = trace.contours;
    var uid = trace.uid;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;
    var fullLayout = gd._fullLayout;
    var id = 'contour' + uid;
    var pathinfo = emptyPathinfo(contours, plotinfo, cd[0]);

    if(trace.visible !== true) {
        fullLayout._paper.selectAll('.' + id + ',.hm' + uid).remove();
        fullLayout._infolayer.selectAll('.cb' + uid).remove();
        return;
    }

    fullLayout._paper.selectAll('.hm' + uid).remove();

    makeCrossings(pathinfo);
    findAllPaths(pathinfo);

    function ab2p(ab) {
        var pt = carpet.ab2xy(ab[0], ab[1], true);
        return [xa.c2p(pt[0]), ya.c2p(pt[1])];
    }

    for(i = 0; i < pathinfo.length; i++) {
        var pi = pathinfo[i];
        var pedgepaths = pi.pedgepaths = [];
        var ppaths = pi.ppaths = [];
        for(j = 0; j < pi.edgepaths.length; j++) {
            path = pi.edgepaths[j];
            var pedgepath = [];
            for(k = 0; k < path.length; k++) {
                pedgepath[k] = ab2p(path[k]);
            }
            pedgepaths.push(pedgepath);
        }
        for(j = 0; j < pi.paths.length; j++) {
            path = pi.paths[j];
            var ppath = [];
            for(k = 0; k < path.length; k++) {
                ppath[k] = ab2p(path[k]);
            }
            ppaths.push(ppath);
        }
    }

    // Mark the perimeter in a-b coordinates:
    var leftedge = a[0];
    var rightedge = a[a.length - 1];
    var bottomedge = b[0];
    var topedge = b[b.length - 1];
    var perimeter = [
        [leftedge, topedge],
        [rightedge, topedge],
        [rightedge, bottomedge],
        [leftedge, bottomedge]
    ];

    // draw everything
    var plotGroup = makeContourGroup(plotinfo, cd, id);
    makeBackground(plotGroup, xa, ya, contours, carpet);
    makeFills(plotGroup, pathinfo, perimeter, contours, ab2p, carpet, xa, ya);
    makeLines(plotGroup, pathinfo, contours);
    clipBoundary(plotGroup, carpet);
    // clipGaps(plotGroup, plotinfo, cd[0], perimeter);
}

function clipBoundary(plotGroup, carpet) {
    plotGroup.attr('clip-path', 'url(#' + carpet.clipPathId + ')');
}

function emptyPathinfo(contours, plotinfo, cd0) {
    var cs = contours.size;
    var pathinfo = [];

    var carpet = cd0.trace._carpet;

    for(var ci = contours.start; ci < contours.end + cs / 10; ci += cs) {
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
            xaxis: carpet.aaxis,
            yaxis: carpet.baxis,
            // full data arrays to use for interpolation
            x: cd0.a,
            y: cd0.b,
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

function makeLines(plotgroup, pathinfo, contours) {
    var smoothing = pathinfo[0].smoothing;

    var linegroup = plotgroup.selectAll('g.contourlevel')
        .data(contours.showlines === false ? [] : pathinfo);
    linegroup.enter().append('g')
        .classed('contourlevel', true);
    linegroup.exit().remove();

    var opencontourlines = linegroup.selectAll('path.openline')
        .data(function(d) { return d.pedgepaths; });
    opencontourlines.enter().append('path')
        .classed('openline', true);
    opencontourlines.exit().remove();
    opencontourlines
        .attr('d', function(d) {
            return Drawing.smoothopen(d, smoothing);
        })
        .style('vector-effect', 'non-scaling-stroke');

    var closedcontourlines = linegroup.selectAll('path.closedline')
        .data(function(d) { return d.ppaths; });
    closedcontourlines.enter().append('path')
        .classed('closedline', true);
    closedcontourlines.exit().remove();
    closedcontourlines
        .attr('d', function(d) {
            return Drawing.smoothclosed(d, smoothing);
        })
        .style('vector-effect', 'non-scaling-stroke')
        .style('stroke-miterlimit', 1);
}

function makeBackground(plotgroup, xaxis, yaxis, contours, carpet) {
    var seg, xp, yp, i;
    var bggroup = makeg(plotgroup, 'g', 'contourbg');

    var bgfill = bggroup.selectAll('path')
        .data(contours.coloring === 'fill' ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();

    var segments = carpet._clipsegments;
    var segs = [];

    for(i = 0; i < segments.length; i++) {
        seg = segments[i];
        xp = map1dArray([], seg.x, xaxis.c2p);
        yp = map1dArray([], seg.y, yaxis.c2p);
        segs.push(makepath(xp, yp, seg.bicubic));
    }

    bgfill
        .attr('d', 'M' + segs.join('L') + 'Z')
        .style('stroke', 'none');
}

function makeFills(plotgroup, pathinfo, perimeter, contours, ab2p, carpet, xa, ya) {
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
        var fullpath = joinAllPaths(pi, perimeter, ab2p, carpet, xa, ya);

        if(!fullpath) d3.select(this).remove();
        else d3.select(this).attr('d', fullpath).style('stroke', 'none');
    });
}

function joinAllPaths(pi, perimeter, ab2p, carpet, xa, ya) {
    var fullpath = (pi.edgepaths.length || pi.z[0][0] < pi.level) ?
            '' : ('M' + perimeter.map(ab2p).join('L') + 'Z');
    var i = 0;
    var startsleft = pi.edgepaths.map(function(v, i) { return i; });
    var newloop = true;
    var endpt, newendpt, cnt, nexti, possiblei, addpath;

    var atol = Math.abs(perimeter[0][0] - perimeter[2][0]) * 1e-8;
    var btol = Math.abs(perimeter[0][1] - perimeter[2][1]) * 1e-8;

    function istop(pt) { return Math.abs(pt[1] - perimeter[0][1]) < btol; }
    function isbottom(pt) { return Math.abs(pt[1] - perimeter[2][1]) < btol; }
    function isleft(pt) { return Math.abs(pt[0] - perimeter[0][0]) < atol; }
    function isright(pt) { return Math.abs(pt[0] - perimeter[2][0]) < atol; }

    function pathto(pt0, pt1) {
        var i, j, segments, axis;
        var path = '';

        if((istop(pt0) && !isright(pt0)) || (isbottom(pt0) && !isleft(pt0))) {
            axis = carpet.aaxis;
            segments = axisAlignedLine(carpet, [pt0[0], pt1[0]], 0.5 * (pt0[1] + pt1[1]));
        } else {
            axis = carpet.baxis;
            segments = axisAlignedLine(carpet, 0.5 * (pt0[0] + pt1[0]), [pt0[1], pt1[1]]);
        }

        for (i = 1; i < segments.length; i++) {
            path += axis.smoothing ? 'C' : 'L';
            for (j = 0; j < segments[i].length; j++) {
                var pt = segments[i][j]
                path += [xa.c2p(pt[0]), ya.c2p(pt[1])] + ' ';
            }
        }
        return path;
    }

    endpt = null;
    while(startsleft.length) {
        var startpt = pi.edgepaths[i][0];

        if(endpt) {
            fullpath += pathto(endpt, startpt);
        }

        addpath = Drawing.smoothopen(pi.edgepaths[i].map(ab2p), pi.smoothing);
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

            if(istop(endpt) && !isright(endpt)) {
                newendpt = perimeter[1]; // right top
            } else if(isleft(endpt)) {
                newendpt = perimeter[0]; // left top
            } else if(isbottom(endpt)) {
                newendpt = perimeter[3]; // right bottom
            } else if(isright(endpt)) {
                newendpt = perimeter[2]; // left bottom
            }

            for(possiblei = 0; possiblei < pi.edgepaths.length; possiblei++) {
                var ptNew = pi.edgepaths[possiblei][0];
                // is ptNew on the (horz. or vert.) segment from endpt to newendpt?
                if(Math.abs(endpt[0] - newendpt[0]) < atol) {
                    if(Math.abs(endpt[0] - ptNew[0]) < atol && (ptNew[1] - endpt[1]) * (newendpt[1] - ptNew[1]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                } else if(Math.abs(endpt[1] - newendpt[1]) < btol) {
                    if(Math.abs(endpt[1] - ptNew[1]) < btol && (ptNew[0] - endpt[0]) * (newendpt[0] - ptNew[0]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                } else {
                    Lib.log('endpt to newendpt is not vert. or horz.', endpt, newendpt, ptNew);
                }
            }

            if(nexti >= 0) break;
            fullpath += pathto(endpt, newendpt);
            endpt = newendpt;
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
            fullpath += pathto(endpt, newendpt) + 'Z';
            endpt = null;
        }
    }

    // finally add the interior paths
    for(i = 0; i < pi.paths.length; i++) {
        fullpath += Drawing.smoothclosed(pi.paths[i].map(ab2p), pi.smoothing);
    }

    return fullpath;
}

/* function clipGaps(plotGroup, plotinfo, cd0, perimeter) {
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
}*/

/* function makeClipMask(cd0) {
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
}*/

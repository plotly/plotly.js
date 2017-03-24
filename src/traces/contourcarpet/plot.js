/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var map1dArray = require('../carpet/map_1d_array');
var makepath = require('../carpet/makepath');
var Drawing = require('../../components/drawing');

var makeCrossings = require('../contour/make_crossings');
var findAllPaths = require('../contour/find_all_paths');
var convertToConstraints = require('./convert_to_constraints');
var joinAllPaths = require('./join_all_paths');
var emptyPathinfo = require('./empty_pathinfo');
var mapPathinfo = require('./map_pathinfo');
var lookupCarpet = require('../carpet/lookup_carpetid');

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
    var trace = cd[0].trace;

    var carpet = trace.carpet = lookupCarpet(gd, trace);
    var carpetcd = gd.calcdata[carpet.index][0];

    var a = cd[0].a;
    var b = cd[0].b;
    var contours = trace.contours;
    var uid = trace.uid;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;
    var fullLayout = gd._fullLayout;
    var id = 'contour' + uid;
    var pathinfo = emptyPathinfo(contours, plotinfo, cd[0]);
    var isConstraint = trace.contours.type === 'constraint';

    // Map [a, b] (data) --> [i, j] (pixels)
    function ab2p(ab) {
        var pt = carpet.ab2xy(ab[0], ab[1], true);
        return [xa.c2p(pt[0]), ya.c2p(pt[1])];
    }

    if(trace.visible !== true) {
        fullLayout._infolayer.selectAll('.cb' + uid).remove();
        return;
    }

    // Extract the contour levels:
    makeCrossings(pathinfo);
    findAllPaths(pathinfo);

    // Constraints might need to be draw inverted, which is not something contours
    // handle by default since they're assumed fully opaque so that they can be
    // drawn overlapping. This function flips the paths as necessary so that they're
    // drawn correctly.
    //
    // TODO: Perhaps this should be generalized and *all* paths should be drawn as
    // closed regions so that translucent contour levels would be valid.
    // See: https://github.com/plotly/plotly.js/issues/1356
    if(trace.contours.type === 'constraint') {
        convertToConstraints(pathinfo, trace.contours.operation);
    }

    // Map the paths in a/b coordinates to pixel coordinates:
    mapPathinfo(pathinfo, ab2p);

    // Define the perimeter in a/b coordinates:
    var perimeter = [
        [a[0], b[b.length - 1]],
        [a[a.length - 1], b[b.length - 1]],
        [a[a.length - 1], b[0]],
        [a[0], b[0]]
    ];

    // draw everything
    var plotGroup = makeContourGroup(plotinfo, cd, id);

    // Draw the baseline background fill that fills in the space behind any other
    // contour levels:
    makeBackground(plotGroup, carpetcd.clipsegments, xa, ya, isConstraint, contours.coloring);

    // Draw the specific contour fills. As a simplification, they're assumed to be
    // fully opaque so that it's easy to draw them simply overlapping. The alternative
    // would be to flip adjacent paths and draw closed paths for each level instead.
    makeFills(trace, plotGroup, xa, ya, pathinfo, perimeter, ab2p, carpet, carpetcd, contours.coloring);

    // Draw contour lines:
    makeLines(plotGroup, pathinfo, contours);

    // Clip the boundary of the plot:
    clipBoundary(plotGroup, carpet);

    // Clip the space around null/undefined/missing data points:
    // clipGaps(plotGroup, plotinfo, cd[0], perimeter);
}

function clipBoundary(plotGroup, carpet) {
    plotGroup.attr('clip-path', 'url(#' + carpet.clipPathId + ')');
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

function makeBackground(plotgroup, clipsegments, xaxis, yaxis, isConstraint, coloring) {
    var seg, xp, yp, i;
    var bggroup = makeg(plotgroup, 'g', 'contourbg');

    var bgfill = bggroup.selectAll('path')
        .data((coloring === 'fill' && !isConstraint) ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();

    var segs = [];
    for(i = 0; i < clipsegments.length; i++) {
        seg = clipsegments[i];
        xp = map1dArray([], seg.x, xaxis.c2p);
        yp = map1dArray([], seg.y, yaxis.c2p);
        segs.push(makepath(xp, yp, seg.bicubic));
    }

    bgfill
        .attr('d', 'M' + segs.join('L') + 'Z')
        .style('stroke', 'none');
}

function makeFills(trace, plotgroup, xa, ya, pathinfo, perimeter, ab2p, carpet, carpetcd, coloring) {
    var fillgroup = plotgroup.selectAll('g.contourfill')
        .data([0]);
    fillgroup.enter().append('g')
        .classed('contourfill', true);

    var fillitems = fillgroup.selectAll('path')
        .data(coloring === 'fill' ? pathinfo : []);
    fillitems.enter().append('path');
    fillitems.exit().remove();
    fillitems.each(function(pi) {
        // join all paths for this level together into a single path
        // first follow clockwise around the perimeter to close any open paths
        // if the whole perimeter is above this level, start with a path
        // enclosing the whole thing. With all that, the parity should mean
        // that we always fill everything above the contour, nothing below
        var fullpath = joinAllPaths(trace, pi, perimeter, ab2p, carpet, carpetcd, xa, ya);

        if(!fullpath) {
            d3.select(this).remove();
        } else {
            d3.select(this)
                .attr('d', fullpath)
                .style('stroke', 'none');
        }
    });
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

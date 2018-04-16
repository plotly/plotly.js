/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var svgTextUtils = require('../../lib/svg_text_utils');
var Axes = require('../../plots/cartesian/axes');
var setConvert = require('../../plots/cartesian/set_convert');

var heatmapPlot = require('../heatmap/plot');
var makeCrossings = require('./make_crossings');
var findAllPaths = require('./find_all_paths');
var emptyPathinfo = require('./empty_pathinfo');
var convertToConstraints = require('./convert_to_constraints');
var closeBoundaries = require('./close_boundaries');
var constants = require('./constants');
var costConstants = constants.LABELOPTIMIZER;


exports.plot = function plot(gd, plotinfo, cdcontours) {
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

    var fillPathinfo = pathinfo;
    if(contours.type === 'constraint') {
        fillPathinfo = convertToConstraints(pathinfo, contours._operation);
        closeBoundaries(fillPathinfo, contours._operation, perimeter, trace);
    }

    // draw everything
    var plotGroup = exports.makeContourGroup(plotinfo, cd, id);
    makeBackground(plotGroup, perimeter, contours);
    makeFills(plotGroup, fillPathinfo, perimeter, contours);
    makeLinesAndLabels(plotGroup, pathinfo, gd, cd[0], contours, perimeter);
    clipGaps(plotGroup, plotinfo, fullLayout._clips, cd[0], perimeter);
}

exports.makeContourGroup = function(plotinfo, cd, id) {
    var plotgroup = plotinfo.plot.select('.maplayer')
        .selectAll('g.contour.' + id)
        .data(cd);

    plotgroup.enter().append('g')
        .classed('contour', true)
        .classed(id, true);

    plotgroup.exit().remove();

    return plotgroup;
};

function makeBackground(plotgroup, perimeter, contours) {
    var bggroup = Lib.ensureSingle(plotgroup, 'g', 'contourbg');

    var bgfill = bggroup.selectAll('path')
        .data(contours.coloring === 'fill' ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();
    bgfill
        .attr('d', 'M' + perimeter.join('L') + 'Z')
        .style('stroke', 'none');
}

function makeFills(plotgroup, pathinfo, perimeter, contours) {
    var fillgroup = Lib.ensureSingle(plotgroup, 'g', 'contourfill');

    var fillitems = fillgroup.selectAll('path')
        .data(contours.coloring === 'fill' || (contours.type === 'constraint' && contours._operation !== '=') ? pathinfo : []);
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

function initFullPath(pi, perimeter) {
    var prefixBoundary = pi.prefixBoundary;
    if(prefixBoundary === undefined) {
        var edgeVal2 = Math.min(pi.z[0][0], pi.z[0][1]);
        prefixBoundary = (!pi.edgepaths.length && edgeVal2 > pi.level);
    }

    if(prefixBoundary) {
        // TODO: why does ^^ not work for constraints?
        // pi.prefixBoundary gets set by closeBoundaries
        return 'M' + perimeter.join('L') + 'Z';
    }
    return '';
}

function joinAllPaths(pi, perimeter) {
    var fullpath = initFullPath(pi, perimeter),
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

function makeLinesAndLabels(plotgroup, pathinfo, gd, cd0, contours, perimeter) {
    var lineContainer = Lib.ensureSingle(plotgroup, 'g', 'contourlines');
    var showLines = contours.showlines !== false;
    var showLabels = contours.showlabels;
    var clipLinesForLabels = showLines && showLabels;

    // Even if we're not going to show lines, we need to create them
    // if we're showing labels, because the fill paths include the perimeter
    // so can't be used to position the labels correctly.
    // In this case we'll remove the lines after making the labels.
    var linegroup = exports.createLines(lineContainer, showLines || showLabels, pathinfo);

    var lineClip = exports.createLineClip(lineContainer, clipLinesForLabels,
        gd._fullLayout._clips, cd0.trace.uid);

    var labelGroup = plotgroup.selectAll('g.contourlabels')
        .data(showLabels ? [0] : []);

    labelGroup.exit().remove();

    labelGroup.enter().append('g')
        .classed('contourlabels', true);

    if(showLabels) {
        var labelClipPathData = [perimeter];

        var labelData = [];

        // invalidate the getTextLocation cache in case paths changed
        Lib.clearLocationCache();

        var contourFormat = exports.labelFormatter(contours, cd0.t.cb, gd._fullLayout);

        var dummyText = Drawing.tester.append('text')
            .attr('data-notex', 1)
            .call(Drawing.font, contours.labelfont);

        var xLen = pathinfo[0].xaxis._length;
        var yLen = pathinfo[0].yaxis._length;

        // visible bounds of the contour trace (and the midpoints, to
        // help with cost calculations)
        var bounds = {
            left: Math.max(perimeter[0][0], 0),
            right: Math.min(perimeter[2][0], xLen),
            top: Math.max(perimeter[0][1], 0),
            bottom: Math.min(perimeter[2][1], yLen)
        };
        bounds.middle = (bounds.top + bounds.bottom) / 2;
        bounds.center = (bounds.left + bounds.right) / 2;

        var plotDiagonal = Math.sqrt(xLen * xLen + yLen * yLen);

        // the path length to use to scale the number of labels to draw:
        var normLength = constants.LABELDISTANCE * plotDiagonal /
            Math.max(1, pathinfo.length / constants.LABELINCREASE);

        linegroup.each(function(d) {
            var textOpts = exports.calcTextOpts(d.level, contourFormat, dummyText, gd);

            d3.select(this).selectAll('path').each(function() {
                var path = this;
                var pathBounds = Lib.getVisibleSegment(path, bounds, textOpts.height / 2);
                if(!pathBounds) return;

                if(pathBounds.len < (textOpts.width + textOpts.height) * constants.LABELMIN) return;

                var maxLabels = Math.min(Math.ceil(pathBounds.len / normLength),
                    constants.LABELMAX);

                for(var i = 0; i < maxLabels; i++) {
                    var loc = exports.findBestTextLocation(path, pathBounds, textOpts,
                        labelData, bounds);

                    if(!loc) break;

                    exports.addLabelData(loc, textOpts, labelData, labelClipPathData);
                }
            });
        });

        dummyText.remove();

        exports.drawLabels(labelGroup, labelData, gd, lineClip,
            clipLinesForLabels ? labelClipPathData : null);
    }

    if(showLabels && !showLines) linegroup.remove();
}

exports.createLines = function(lineContainer, makeLines, pathinfo) {
    var smoothing = pathinfo[0].smoothing;

    var linegroup = lineContainer.selectAll('g.contourlevel')
        .data(makeLines ? pathinfo : []);

    linegroup.exit().remove();
    linegroup.enter().append('g')
        .classed('contourlevel', true);

    if(makeLines) {
        // pedgepaths / ppaths are used by contourcarpet, for the paths transformed from a/b to x/y
        // edgepaths / paths are used by contour since it's in x/y from the start
        var opencontourlines = linegroup.selectAll('path.openline')
            .data(function(d) { return d.pedgepaths || d.edgepaths; });

        opencontourlines.exit().remove();
        opencontourlines.enter().append('path')
            .classed('openline', true);

        opencontourlines
            .attr('d', function(d) {
                return Drawing.smoothopen(d, smoothing);
            })
            .style('stroke-miterlimit', 1)
            .style('vector-effect', 'non-scaling-stroke');

        var closedcontourlines = linegroup.selectAll('path.closedline')
            .data(function(d) { return d.ppaths || d.paths; });

        closedcontourlines.exit().remove();
        closedcontourlines.enter().append('path')
            .classed('closedline', true);

        closedcontourlines
            .attr('d', function(d) {
                return Drawing.smoothclosed(d, smoothing);
            })
            .style('stroke-miterlimit', 1)
            .style('vector-effect', 'non-scaling-stroke');
    }

    return linegroup;
};

exports.createLineClip = function(lineContainer, clipLinesForLabels, clips, uid) {
    var clipId = clipLinesForLabels ? ('clipline' + uid) : null;

    var lineClip = clips.selectAll('#' + clipId)
        .data(clipLinesForLabels ? [0] : []);
    lineClip.exit().remove();

    lineClip.enter().append('clipPath')
        .classed('contourlineclip', true)
        .attr('id', clipId);

    Drawing.setClipUrl(lineContainer, clipId);

    return lineClip;
};

exports.labelFormatter = function(contours, colorbar, fullLayout) {
    if(contours.labelformat) {
        return fullLayout._d3locale.numberFormat(contours.labelformat);
    }
    else {
        var formatAxis;
        if(colorbar) {
            formatAxis = colorbar.axis;
        }
        else {
            formatAxis = {
                type: 'linear',
                _id: 'ycontour',
                showexponent: 'all'
            };

            if(contours.type === 'constraint') {
                var value = contours.value;
                if(Array.isArray(value)) {
                    formatAxis.range = [value[0], value[value.length - 1]];
                }
                else formatAxis.range = [value, value];
            }
            else {
                formatAxis.range = [contours.start, contours.end];
                formatAxis.nticks = (contours.end - contours.start) / contours.size;
            }

            if(formatAxis.range[0] === formatAxis.range[1]) {
                formatAxis.range[1] += formatAxis.range[0] || 1;
            }
            if(!formatAxis.nticks) formatAxis.nticks = 1000;

            setConvert(formatAxis, fullLayout);
            Axes.prepTicks(formatAxis);
            formatAxis._tmin = null;
            formatAxis._tmax = null;
        }
        return function(v) {
            return Axes.tickText(formatAxis, v).text;
        };
    }
};

exports.calcTextOpts = function(level, contourFormat, dummyText, gd) {
    var text = contourFormat(level);
    dummyText.text(text)
        .call(svgTextUtils.convertToTspans, gd);
    var bBox = Drawing.bBox(dummyText.node(), true);

    return {
        text: text,
        width: bBox.width,
        height: bBox.height,
        level: level,
        dy: (bBox.top + bBox.bottom) / 2
    };
};

exports.findBestTextLocation = function(path, pathBounds, textOpts, labelData, plotBounds) {
    var textWidth = textOpts.width;

    var p0, dp, pMax, pMin, loc;
    if(pathBounds.isClosed) {
        dp = pathBounds.len / costConstants.INITIALSEARCHPOINTS;
        p0 = pathBounds.min + dp / 2;
        pMax = pathBounds.max;
    }
    else {
        dp = (pathBounds.len - textWidth) / (costConstants.INITIALSEARCHPOINTS + 1);
        p0 = pathBounds.min + dp + textWidth / 2;
        pMax = pathBounds.max - (dp + textWidth) / 2;
    }

    var cost = Infinity;
    for(var j = 0; j < costConstants.ITERATIONS; j++) {
        for(var p = p0; p < pMax; p += dp) {
            var newLocation = Lib.getTextLocation(path, pathBounds.total, p, textWidth);
            var newCost = locationCost(newLocation, textOpts, labelData, plotBounds);
            if(newCost < cost) {
                cost = newCost;
                loc = newLocation;
                pMin = p;
            }
        }
        if(cost > costConstants.MAXCOST * 2) break;

        // subsequent iterations just look half steps away from the
        // best we found in the previous iteration
        if(j) dp /= 2;
        p0 = pMin - dp / 2;
        pMax = p0 + dp * 1.5;
    }
    if(cost <= costConstants.MAXCOST) return loc;
};

/*
 * locationCost: a cost function for label locations
 * composed of three kinds of penalty:
 * - for open paths, being close to the end of the path
 * - the angle away from horizontal
 * - being too close to already placed neighbors
 */
function locationCost(loc, textOpts, labelData, bounds) {
    var halfWidth = textOpts.width / 2;
    var halfHeight = textOpts.height / 2;
    var x = loc.x;
    var y = loc.y;
    var theta = loc.theta;
    var dx = Math.cos(theta) * halfWidth;
    var dy = Math.sin(theta) * halfWidth;

    // cost for being near an edge
    var normX = ((x > bounds.center) ? (bounds.right - x) : (x - bounds.left)) /
        (dx + Math.abs(Math.sin(theta) * halfHeight));
    var normY = ((y > bounds.middle) ? (bounds.bottom - y) : (y - bounds.top)) /
        (Math.abs(dy) + Math.cos(theta) * halfHeight);
    if(normX < 1 || normY < 1) return Infinity;
    var cost = costConstants.EDGECOST * (1 / (normX - 1) + 1 / (normY - 1));

    // cost for not being horizontal
    cost += costConstants.ANGLECOST * theta * theta;

    // cost for being close to other labels
    var x1 = x - dx;
    var y1 = y - dy;
    var x2 = x + dx;
    var y2 = y + dy;
    for(var i = 0; i < labelData.length; i++) {
        var labeli = labelData[i];
        var dxd = Math.cos(labeli.theta) * labeli.width / 2;
        var dyd = Math.sin(labeli.theta) * labeli.width / 2;
        var dist = Lib.segmentDistance(
            x1, y1,
            x2, y2,
            labeli.x - dxd, labeli.y - dyd,
            labeli.x + dxd, labeli.y + dyd
        ) * 2 / (textOpts.height + labeli.height);

        var sameLevel = labeli.level === textOpts.level;
        var distOffset = sameLevel ? costConstants.SAMELEVELDISTANCE : 1;

        if(dist <= distOffset) return Infinity;

        var distFactor = costConstants.NEIGHBORCOST *
            (sameLevel ? costConstants.SAMELEVELFACTOR : 1);

        cost += distFactor / (dist - distOffset);
    }

    return cost;
}

exports.addLabelData = function(loc, textOpts, labelData, labelClipPathData) {
    var halfWidth = textOpts.width / 2;
    var halfHeight = textOpts.height / 2;

    var x = loc.x;
    var y = loc.y;
    var theta = loc.theta;

    var sin = Math.sin(theta);
    var cos = Math.cos(theta);
    var dxw = halfWidth * cos;
    var dxh = halfHeight * sin;
    var dyw = halfWidth * sin;
    var dyh = -halfHeight * cos;
    var bBoxPts = [
        [x - dxw - dxh, y - dyw - dyh],
        [x + dxw - dxh, y + dyw - dyh],
        [x + dxw + dxh, y + dyw + dyh],
        [x - dxw + dxh, y - dyw + dyh],
    ];

    labelData.push({
        text: textOpts.text,
        x: x,
        y: y,
        dy: textOpts.dy,
        theta: theta,
        level: textOpts.level,
        width: textOpts.width,
        height: textOpts.height
    });

    labelClipPathData.push(bBoxPts);
};

exports.drawLabels = function(labelGroup, labelData, gd, lineClip, labelClipPathData) {
    var labels = labelGroup.selectAll('text')
        .data(labelData, function(d) {
            return d.text + ',' + d.x + ',' + d.y + ',' + d.theta;
        });

    labels.exit().remove();

    labels.enter().append('text')
        .attr({
            'data-notex': 1,
            'text-anchor': 'middle'
        })
        .each(function(d) {
            var x = d.x + Math.sin(d.theta) * d.dy;
            var y = d.y - Math.cos(d.theta) * d.dy;
            d3.select(this)
                .text(d.text)
                .attr({
                    x: x,
                    y: y,
                    transform: 'rotate(' + (180 * d.theta / Math.PI) + ' ' + x + ' ' + y + ')'
                })
                .call(svgTextUtils.convertToTspans, gd);
        });

    if(labelClipPathData) {
        var clipPath = '';
        for(var i = 0; i < labelClipPathData.length; i++) {
            clipPath += 'M' + labelClipPathData[i].join('L') + 'Z';
        }

        var lineClipPath = Lib.ensureSingle(lineClip, 'path', '');
        lineClipPath.attr('d', clipPath);
    }
};

function clipGaps(plotGroup, plotinfo, clips, cd0, perimeter) {
    var clipId = 'clip' + cd0.trace.uid;

    var clipPath = clips.selectAll('#' + clipId)
        .data(cd0.trace.connectgaps ? [] : [0]);
    clipPath.enter().append('clipPath')
        .classed('contourclip', true)
        .attr('id', clipId);
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

        var path = Lib.ensureSingle(clipPath, 'path', '');
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

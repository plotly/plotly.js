/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');

var contour = module.exports = {};

Plotly.Plots.register(contour, 'contour',
    ['cartesian', '2dMap', 'contour'], {
    description: [
        'The data from which contour lines are computed is set in `z`.',
        'Data in `z` must be a {2D array} of numbers.',

        'Say that `z` has N rows and M columns, then by default,',
        'these N rows correspond to N y coordinates',
        '(set in `y` or auto-generated) and the M columns',
        'correspond to M x coordinates (set in `x` or auto-generated).',

        'By setting `transpose` to *true*, the above behavior is flipped.'
    ].join(' ')
});

Plotly.Plots.register(contour, 'histogram2dcontour',
    ['cartesian', '2dMap', 'contour', 'histogram'], {
    hrName: 'histogram_2d_contour',
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'and `y` (where `x` and `y` represent marginal distributions,',
        'binning is set in `xbins` and `ybins` in this case)',
        'or `z` (where `z` represent the 2D distribution and binning set,',
        'binning is set by `x` and `y` in this case).',
        'The resulting distribution is visualized as a contour plot.'
    ].join(' ')
});

contour.attributes = require('./attributes');

contour.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, contour.attributes, attr, dflt);
    }

    var contourStart = Plotly.Lib.coerce2(traceIn, traceOut, contour.attributes, 'contours.start'),
        contourEnd = Plotly.Lib.coerce2(traceIn, traceOut, contour.attributes, 'contours.end'),
        autocontour = contourStart && contourEnd ? coerce('autocontour', false) : coerce('autocontour');
    if(autocontour) coerce('ncontours');
    else coerce('contours.size');

    var coloring = coerce('contours.coloring');

    if(coloring==='fill') coerce('contours.showlines');

    if(traceOut.contours.showlines!==false) {
        if(coloring!=='lines') coerce('line.color', '#000');
        coerce('line.width', 0.5);
        coerce('line.dash');
    }

    coerce('line.smoothing');

    Plotly.Heatmap.supplyDefaults(traceIn, traceOut, defaultColor, layout);
};

contour.calc = function(gd, trace) {
    // most is the same as heatmap calc, then adjust it
    // though a few things inside heatmap calc still look for
    // contour maps, because the makeBoundArray calls are too entangled
    var cd = Plotly.Heatmap.calc(gd, trace),
        contours = trace.contours;

    // check if we need to auto-choose contour levels
    if(trace.autocontour!==false) {
        var dummyAx = {
            type: 'linear',
            range: [trace.zmin, trace.zmax]
        };
        Plotly.Axes.autoTicks(dummyAx,
            (trace.zmax - trace.zmin) / (trace.ncontours||15));
        contours.start = Plotly.Axes.tickFirst(dummyAx);
        contours.size = dummyAx.dtick;
        dummyAx.range.reverse();
        contours.end = Plotly.Axes.tickFirst(dummyAx);

        if(contours.start===trace.zmin) contours.start += contours.size;
        if(contours.end===trace.zmax) contours.end -= contours.size;

        // so rounding errors don't cause us to miss the last contour
        contours.end += contours.size/100;

        // copy auto-contour info back to the source data.
        trace._input.contours = contours;
    }

    return cd;
};

contour.plot = function(gd, plotinfo, cdcontours) {
    for(var i = 0; i < cdcontours.length; i++) {
        plotOne(gd, plotinfo, cdcontours[i]);
    }
};

// some constants to help with marching squares algorithm
    // where does the path start for each index?
var BOTTOMSTART = [1,9,13,104,713],
    TOPSTART = [4,6,7,104,713],
    LEFTSTART = [8,12,14,208,1114],
    RIGHTSTART = [2,3,11,208,1114],

    // which way [dx,dy] do we leave a given index?
    // saddles are already disambiguated
    NEWDELTA = [
        null, [-1, 0], [0, -1], [-1, 0],
        [1, 0], null, [0, -1], [-1, 0],
        [0, 1], [0, 1], null, [0, 1],
        [1, 0], [1, 0], [0, -1]
    ],
    // for each saddle, the first index here is used
    // for dx||dy<0, the second for dx||dy>0
    CHOOSESADDLE = {
        104: [4, 1],
        208: [2, 8],
        713: [7, 13],
        1114: [11, 14]
    },
    // after one index has been used for a saddle, which do we
    // substitute to be used up later?
    SADDLEREMAINDER = {1: 4, 2: 8, 4: 1, 7: 13, 8: 2, 11: 14, 13: 7, 14: 11};

function plotOne(gd, plotinfo, cd) {
    Plotly.Lib.markTime('in Contour.plot');
    var trace = cd[0].trace,
        x = cd[0].x,
        y = cd[0].y,
        contours = trace.contours,
        uid = trace.uid,
        xa = plotinfo.x(),
        ya = plotinfo.y(),
        fullLayout = gd._fullLayout,
        id = 'contour' + uid,
        pathinfo = emptyPathinfo(contours, plotinfo, cd[0]);

    if(trace.visible !== true) {
        fullLayout._paper.selectAll('.'+id+',.cb'+uid+',.hm'+uid).remove();
        return;
    }

    // use a heatmap to fill - draw it behind the lines
    if(contours.coloring==='heatmap') {
        if(trace.zauto && trace.autocontour===false) {
            trace._input.zmin = trace.zmin =
                contours.start - contours.size/2;
            trace._input.zmax = trace.zmax =
                trace.zmin + pathinfo.length * contours.size;
        }
        Plotly.Heatmap.plot(gd, plotinfo, [cd]);
    }
    // in case this used to be a heatmap (or have heatmap fill)
    else fullLayout._paper.selectAll('.hm'+uid).remove();

    makeCrossings(pathinfo);
    findAllPaths(pathinfo);

    var leftedge = xa.c2p(x[0], true),
        rightedge = xa.c2p(x[x.length-1], true),
        bottomedge = ya.c2p(y[0], true),
        topedge = ya.c2p(y[y.length-1], true),
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

    Plotly.Lib.markTime('done Contour.plot');
}

function emptyPathinfo(contours, plotinfo, cd0) {
    var cs = contours.size || 1,
        pathinfo = [];
    for(var ci = contours.start; ci < contours.end + cs/10; ci += cs) {
        pathinfo.push({
            level:ci,
            // all the cells with nontrivial marching index
            crossings:{},
            // starting points on the edges of the lattice for each contour
            starts:[],
            // all unclosed paths (may have less items than starts,
            // if a path is closed by rounding)
            edgepaths:[],
            // all closed paths
            paths:[],
            // store axes so we can convert to px
            xaxis: plotinfo.x(),
            yaxis: plotinfo.y(),
            // full data arrays to use for interpolation
            x: cd0.x,
            y: cd0.y,
            z: cd0.z,
            smoothing: cd0.trace.line.smoothing
        });
    }
    return pathinfo;
}

// modified marching squares algorithm,
// so we disambiguate the saddle points from the start
// and we ignore the cases with no crossings
// the index I'm using is based on:
// http://en.wikipedia.org/wiki/Marching_squares
// except that the saddles bifurcate and I represent them
// as the decimal combination of the two appropriate
// non-saddle indices
function getMarchingIndex(val,corners) {
    var mi = (corners[0][0] > val ? 0 : 1) +
             (corners[0][1] > val ? 0 : 2) +
             (corners[1][1] > val ? 0 : 4) +
             (corners[1][0] > val ? 0 : 8);
    if(mi === 5 || mi === 10) {
        var avg = (corners[0][0] + corners[0][1] +
                   corners[1][0] + corners[1][1]) / 4;
        // two peaks with a big valley
        if(val > avg) return (mi === 5) ? 713 : 1114;
        // two valleys with a big ridge
        return (mi === 5) ? 104 : 208;
    }
    return (mi === 15) ? 0 : mi;
}

// Calculate all the marching indices, for ALL levels at once.
// since we want to be exhaustive we'll check for contour crossings
// at every intersection, rather than just following a path
// TODO: shorten the inner loop to only the relevant levels
function makeCrossings(pathinfo) {
    var z = pathinfo[0].z,
        m = z.length,
        n = z[0].length, // we already made sure z isn't ragged in interp2d
        twoWide = m===2 || n===2,
        xi,
        yi,
        startIndices,
        ystartIndices,
        label,
        corners,
        mi,
        pi,
        i;

    for(yi = 0; yi<m-1; yi++) {
        ystartIndices = [];
        if(yi===0) ystartIndices = ystartIndices.concat(BOTTOMSTART);
        if(yi===m-2) ystartIndices = ystartIndices.concat(TOPSTART);

        for(xi = 0; xi<n-1; xi++) {
            startIndices = ystartIndices.slice();
            if(xi===0) startIndices = startIndices.concat(LEFTSTART);
            if(xi===n-2) startIndices = startIndices.concat(RIGHTSTART);

            label = xi+','+yi;
            corners = [[z[yi][xi], z[yi][xi+1]],
                       [z[yi+1][xi], z[yi+1][xi+1]]];
            for(i = 0; i < pathinfo.length; i++) {
                pi = pathinfo[i];
                mi = getMarchingIndex(pi.level,corners);
                if(!mi) continue;

                pi.crossings[label] = mi;
                if(startIndices.indexOf(mi)!==-1) {
                    pi.starts.push([xi, yi]);
                    if(twoWide && startIndices.indexOf(mi,
                            startIndices.indexOf(mi) + 1) !== -1) {
                        // the same square has starts from opposite sides
                        // it's not possible to have starts on opposite edges
                        // of a corner, only a start and an end...
                        // but if the array is only two points wide (either way)
                        // you can have starts on opposite sides.
                        pi.starts.push([xi, yi]);
                    }
                }
            }
        }
    }
}

function makePath(pi, loc, edgeflag) {
    var startLocStr = loc.join(','),
        locStr = startLocStr,
        mi = pi.crossings[locStr],
        marchStep = startStep(mi, edgeflag, loc),
        // start by going backward a half step and finding the crossing point
        pts = [getInterpPx(pi, loc, [-marchStep[0], -marchStep[1]])],
        startStepStr = marchStep.join(','),
        m = pi.z.length,
        n = pi.z[0].length;

    // now follow the path
    for(var cnt=0; cnt<10000; cnt++) { // just to avoid infinite loops
        if(mi>20) {
            mi = CHOOSESADDLE[mi][(marchStep[0]||marchStep[1])<0 ? 0 : 1];
            pi.crossings[locStr] = SADDLEREMAINDER[mi];
        }
        else {
            delete pi.crossings[locStr];
        }

        marchStep = NEWDELTA[mi];
        if(!marchStep) {
            console.log('found bad marching index', mi, loc, pi.level);
            break;
        }

        // find the crossing a half step forward, and then take the full step
        pts.push(getInterpPx(pi, loc, marchStep));
        loc[0] += marchStep[0];
        loc[1] += marchStep[1];

        // don't include the same point multiple times
        if(equalPts(pts[pts.length-1], pts[pts.length-2])) pts.pop();
        locStr = loc.join(',');

        // have we completed a loop, or reached an edge?
        if( (locStr===startLocStr && marchStep.join(',')===startStepStr) ||
            (edgeflag && (
                (marchStep[0] && (loc[0]<0 || loc[0]>n-2)) ||
                (marchStep[1] && (loc[1]<0 || loc[1]>m-2))))) {
            break;
        }
        mi = pi.crossings[locStr];
    }

    if(cnt===10000) {
        console.log('Infinite loop in contour?');
    }
    var closedpath = equalPts(pts[0], pts[pts.length-1]),
        totaldist = 0,
        distThresholdFactor = 0.2 * pi.smoothing,
        alldists = [],
        cropstart = 0,
        distgroup,
        cnt2,
        cnt3,
        newpt,
        ptcnt,
        ptavg,
        thisdist;

    // check for points that are too close together (<1/5 the average dist,
    // less if less smoothed) and just take the center (or avg of center 2)
    // this cuts down on funny behavior when a point is very close to a contour level
    for(cnt=1; cnt<pts.length; cnt++) {
        thisdist = ptDist(pts[cnt], pts[cnt-1]);
        totaldist += thisdist;
        alldists.push(thisdist);
    }

    var distThreshold = totaldist/alldists.length*distThresholdFactor;

    function getpt(i) { return pts[i%pts.length]; }

    for(cnt=pts.length-2; cnt>=cropstart; cnt--) {
        distgroup = alldists[cnt];
        if(distgroup<distThreshold) {
            cnt3 = 0;
            for(cnt2=cnt-1; cnt2>=cropstart; cnt2--) {
                if(distgroup+alldists[cnt2]<distThreshold) {
                    distgroup += alldists[cnt2];
                }
                else break;
            }

            // closed path with close points wrapping around the boundary?
            if(closedpath && cnt===pts.length-2) {
                for(cnt3=0; cnt3<cnt2; cnt3++) {
                    if(distgroup+alldists[cnt3]<distThreshold) {
                        distgroup += alldists[cnt3];
                    }
                    else break;
                }
            }
            ptcnt = cnt-cnt2+cnt3+1;
            ptavg = Math.floor((cnt+cnt2+cnt3+2)/2);

            // either endpoint included: keep the endpoint
            if(!closedpath && cnt===pts.length-2) newpt = pts[pts.length-1];
            else if(!closedpath && cnt2===-1) newpt = pts[0];

            // odd # of points - just take the central one
            else if(ptcnt%2) newpt = getpt(ptavg);

            // even # of pts - average central two
            else  {
                newpt = [(getpt(ptavg)[0] + getpt(ptavg+1)[0]) / 2,
                         (getpt(ptavg)[1] + getpt(ptavg+1)[1]) / 2];
            }

            pts.splice(cnt2+1, cnt-cnt2+1, newpt);
            cnt = cnt2+1;
            if(cnt3) cropstart = cnt3;
            if(closedpath) {
                if(cnt===pts.length-2) pts[cnt3] = pts[pts.length-1];
                else if(cnt===0) pts[pts.length-1] = pts[0];
            }
        }
    }
    pts.splice(0, cropstart);

    // don't return single-point paths (ie all points were the same
    // so they got deleted?)
    if(pts.length<2) return;
    else if(closedpath) {
        pts.pop();
        pi.paths.push(pts);
    }
    else {
        if(!edgeflag) {
            console.log('unclosed interior contour?',
                pi.level,startLocStr,pts.join('L'));
        }

        // edge path - does it start where an existing edge path ends, or vice versa?
        var merged = false;
        pi.edgepaths.forEach(function(edgepath, edgei) {
            if(!merged && equalPts(edgepath[0], pts[pts.length-1])) {
                pts.pop();
                merged = true;

                // now does it ALSO meet the end of another (or the same) path?
                var doublemerged = false;
                pi.edgepaths.forEach(function(edgepath2, edgei2) {
                    if(!doublemerged && equalPts(
                            edgepath2[edgepath2.length-1], pts[0])) {
                        doublemerged = true;
                        pts.splice(0, 1);
                        pi.edgepaths.splice(edgei, 1);
                        if(edgei2===edgei) {
                            // the path is now closed
                            pi.paths.push(pts.concat(edgepath2));
                        }
                        else {
                            pi.edgepaths[edgei2] =
                                pi.edgepaths[edgei2].concat(pts, edgepath2);
                        }
                    }
                });
                if(!doublemerged) {
                    pi.edgepaths[edgei] = pts.concat(edgepath);
                }
            }
        });
        pi.edgepaths.forEach(function(edgepath, edgei) {
            if(!merged && equalPts(edgepath[edgepath.length-1], pts[0])) {
                pts.splice(0, 1);
                pi.edgepaths[edgei] = edgepath.concat(pts);
                merged = true;
            }
        });

        if(!merged) pi.edgepaths.push(pts);
    }
}

function findAllPaths(pathinfo) {
    var cnt,
        startLoc,
        i,
        pi,
        j;

    for(i = 0; i < pathinfo.length; i++) {
        pi = pathinfo[i];

        for(j = 0; j < pi.starts.length; j++) {
            startLoc = pi.starts[j];
            makePath(pi, startLoc, 'edge');
        }

        cnt = 0;
        while(Object.keys(pi.crossings).length && cnt<10000) {
            cnt++;
            startLoc = Object.keys(pi.crossings)[0].split(',').map(Number);
            makePath(pi, startLoc);
        }
        if(cnt===10000) console.log('Infinite loop in contour?');
    }
}

// special function to get the marching step of the
// first point in the path (leading to loc)
function startStep(mi, edgeflag, loc) {
    var dx = 0,
        dy = 0;
    if(mi>20 && edgeflag) {
        // these saddles start at +/- x
        if(mi===208 || mi===1114) {
            // if we're starting at the left side, we must be going right
            dx = loc[0]===0 ? 1 : -1;
        }
        else {
            // if we're starting at the bottom, we must be going up
            dy = loc[1]===0 ? 1 : -1;
        }
    }
    else if(BOTTOMSTART.indexOf(mi)!==-1) dy = 1;
    else if(LEFTSTART.indexOf(mi)!==-1) dx = 1;
    else if(TOPSTART.indexOf(mi)!==-1) dy = -1;
    else dx = -1;
    return [dx, dy];
}

function equalPts(pt1, pt2) {
    return Math.abs(pt1[0] - pt2[0]) < 0.01 &&
           Math.abs(pt1[1] - pt2[1]) < 0.01;
}

function ptDist(pt1, pt2) {
    var dx = pt1[0] - pt2[0],
        dy = pt1[1] - pt2[1];
    return Math.sqrt(dx*dx + dy*dy);
}

function getInterpPx(pi, loc, step) {
    var locx = loc[0] + Math.max(step[0], 0),
        locy = loc[1] + Math.max(step[1], 0),
        zxy = pi.z[locy][locx],
        xa = pi.xaxis,
        ya = pi.yaxis;

    if(step[1]) {
        var dx = (pi.level - zxy) / (pi.z[locy][locx+1] - zxy);
        return [xa.c2p((1-dx) * pi.x[locx] + dx * pi.x[locx+1], true),
                ya.c2p(pi.y[locy], true)];
    }
    else {
        var dy = (pi.level - zxy) / (pi.z[locy+1][locx] - zxy);
        return [xa.c2p(pi.x[locx], true),
                ya.c2p((1-dy) * pi.y[locy] + dy * pi.y[locy+1], true)];
    }
}

function makeContourGroup(plotinfo, cd, id) {
    var plotgroup = plotinfo.plot.select('.maplayer')
        .selectAll('g.contour.'+id)
        .data(cd);
    plotgroup.enter().append('g')
        .classed('contour',true)
        .classed(id,true);
    plotgroup.exit().remove();
    return plotgroup;
}

function makeBackground(plotgroup, perimeter, contours) {
    var bggroup = plotgroup.selectAll('g.contourbg').data([0]);
    bggroup.enter().append('g').classed('contourbg',true);

    var bgfill = bggroup.selectAll('path')
        .data(contours.coloring==='fill' ? [0] : []);
    bgfill.enter().append('path');
    bgfill.exit().remove();
    bgfill
        .attr('d','M'+perimeter.join('L')+'Z')
        .style('stroke','none');
}

function makeFills(plotgroup, pathinfo, perimeter, contours) {
    var fillgroup = plotgroup.selectAll('g.contourfill')
        .data([0]);
    fillgroup.enter().append('g')
        .classed('contourfill',true);

    var fillitems = fillgroup.selectAll('path')
        .data(contours.coloring==='fill' ? pathinfo : []);
    fillitems.enter().append('path');
    fillitems.exit().remove();
    fillitems.each(function(pi){
        // join all paths for this level together into a single path
        // first follow clockwise around the perimeter to close any open paths
        // if the whole perimeter is above this level, start with a path
        // enclosing the whole thing. With all that, the parity should mean
        // that we always fill everything above the contour, nothing below
        var fullpath = joinAllPaths(pi, perimeter);

        if(!fullpath) d3.select(this).remove();
        else d3.select(this).attr('d',fullpath).style('stroke', 'none');
    });
}

function joinAllPaths(pi, perimeter) {
    var fullpath = (pi.edgepaths.length || pi.z[0][0] < pi.level) ?
            '' : ('M'+perimeter.join('L')+'Z'),
        i = 0,
        startsleft = pi.edgepaths.map(function(v,i){ return i; }),
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
        addpath = Plotly.Drawing.smoothopen(pi.edgepaths[i], pi.smoothing);
        fullpath += newloop ? addpath : addpath.replace(/^M/, 'L');
        startsleft.splice(startsleft.indexOf(i), 1);
        endpt = pi.edgepaths[i][pi.edgepaths[i].length-1];
        nexti = -1;

        //now loop through sides, moving our endpoint until we find a new start
        for(cnt=0; cnt<4; cnt++) { // just to prevent infinite loops
            if(!endpt) {
                console.log('missing end?',i,pi);
                break;
            }

            if(istop(endpt) && !isright(endpt)) newendpt = perimeter[1]; // right top
            else if(isleft(endpt)) newendpt = perimeter[0]; // left top
            else if(isbottom(endpt)) newendpt = perimeter[3]; // right bottom
            else if(isright(endpt)) newendpt = perimeter[2]; // left bottom

            for(possiblei=0; possiblei < pi.edgepaths.length; possiblei++) {
                var ptNew = pi.edgepaths[possiblei][0];
                // is ptNew on the (horz. or vert.) segment from endpt to newendpt?
                if(Math.abs(endpt[0]-newendpt[0]) < 0.01) {
                    if(Math.abs(endpt[0]-ptNew[0]) < 0.01 &&
                            (ptNew[1]-endpt[1]) * (newendpt[1]-ptNew[1]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                }
                else if(Math.abs(endpt[1]-newendpt[1]) < 0.01) {
                    if(Math.abs(endpt[1]-ptNew[1]) < 0.01 &&
                            (ptNew[0]-endpt[0]) * (newendpt[0]-ptNew[0]) >= 0) {
                        newendpt = ptNew;
                        nexti = possiblei;
                    }
                }
                else {
                    console.log('endpt to newendpt is not vert. or horz.',
                        endpt, newendpt, ptNew);
                }
            }

            endpt = newendpt;

            if(nexti>=0) break;
            fullpath += 'L'+newendpt;
        }

        if(nexti === pi.edgepaths.length) {
            console.log('unclosed perimeter path');
            break;
        }

        i = nexti;

        // if we closed back on a loop we already included,
        // close it and start a new loop
        newloop = (startsleft.indexOf(i)===-1);
        if(newloop) {
            i = startsleft[0];
            fullpath += 'Z';
        }
    }

    // finally add the interior paths
    for(i = 0; i < pi.paths.length; i++) {
        fullpath += Plotly.Drawing.smoothclosed(pi.paths[i], pi.smoothing);
    }

    return fullpath;
}

function makeLines(plotgroup, pathinfo, contours) {
    var smoothing = pathinfo[0].smoothing;

    var linegroup = plotgroup.selectAll('g.contourlevel')
        .data(contours.showlines===false ? [] : pathinfo);
    linegroup.enter().append('g')
        .classed('contourlevel',true);
    linegroup.exit().remove();

    var opencontourlines = linegroup.selectAll('path.openline')
        .data(function(d){ return d.edgepaths; });
    opencontourlines.enter().append('path')
        .classed('openline',true);
    opencontourlines.exit().remove();
    opencontourlines
        .attr('d', function(d){
            return Plotly.Drawing.smoothopen(d, smoothing);
        })
        .style('stroke-miterlimit',1);

    var closedcontourlines = linegroup.selectAll('path.closedline')
        .data(function(d){ return d.paths; });
    closedcontourlines.enter().append('path')
        .classed('closedline',true);
    closedcontourlines.exit().remove();
    closedcontourlines
        .attr('d', function(d){
            return Plotly.Drawing.smoothclosed(d, smoothing);
        })
        .style('stroke-miterlimit',1);
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
            xaxis: plotinfo.x(),
            yaxis: plotinfo.y(),
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

    plotGroup.call(Plotly.Drawing.setClipUrl, clipId);
    plotinfo.plot.selectAll('.hm' + cd0.trace.uid)
        .call(Plotly.Drawing.setClipUrl, clipId);
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

contour.style = function(gd) {
    d3.select(gd).selectAll('g.contour')
        .style('opacity',function(d){ return d.trace.opacity; })
        .each(function(d) {
            var c = d3.select(this),
                trace = d.trace,
                contours = trace.contours,
                line = trace.line,
                colorLines = contours.coloring==='lines',
                cs = contours.size||1,
                nc = Math.floor((contours.end + cs/10 - contours.start)/cs) + 1,
                scl = Plotly.Colorscale.getScale(trace.colorscale),
                extraLevel = colorLines ? 0 : 1,
                colormap = d3.scale.linear()
                    .domain(scl.map(function(si){
                        return (si[0]*(nc+extraLevel-1)-(extraLevel/2)) * cs +
                            contours.start;
                    }))
                    .interpolate(d3.interpolateRgb)
                    .range(scl.map(function(si){ return si[1]; }));

            c.selectAll('g.contourlevel').each(function(d, i) {
                d3.select(this).selectAll('path')
                    .call(Plotly.Drawing.lineGroupStyle,
                        line.width,
                        colorLines ? colormap(contours.start+i*cs) : line.color,
                        line.dash);
            });
            c.selectAll('g.contourbg path')
                .style('fill', colormap(contours.start - cs/2));
            c.selectAll('g.contourfill path')
                .style('fill',function(d, i){
                    return colormap(contours.start + (i+0.5)*cs);
                });
        });
    Plotly.Heatmap.style(gd);
};

contour.colorbar = function(gd, cd) {
    var trace = cd[0].trace,
        cbId = 'cb'+trace.uid;

    gd._fullLayout._infolayer.selectAll('.'+cbId).remove();
    if(trace.showscale===false){
        Plotly.Plots.autoMargin(gd, cbId);
        return;
    }

    // instantiate the colorbar (will be drawn and styled in contour.style)
    var cb = Plotly.Colorbar(gd, cbId);
    cd[0].t.cb = cb;

    var contours = trace.contours,
        line = trace.line,
        cs = contours.size||1,
        nc = Math.floor((contours.end + cs/10 - contours.start)/cs)+1,
        scl = Plotly.Colorscale.getScale(trace.colorscale),
        extraLevel = contours.coloring==='lines' ? 0 : 1,
        colormap = d3.scale.linear().interpolate(d3.interpolateRgb),
        colorDomain = scl.map(function(si){
                return (si[0]*(nc+extraLevel-1)-(extraLevel/2)) * cs +
                    contours.start;
            }),
        colorRange = scl.map(function(si){ return si[1]; });

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
        colorDomain = scl.map(function(si){
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

contour.hoverPoints = function(pointData, xval, yval, hovermode) {
    return Plotly.Heatmap.hoverPoints(pointData, xval, yval, hovermode, true);
};

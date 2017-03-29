/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var constants = require('./constants');

module.exports = function findAllPaths(pathinfo) {
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
        while(Object.keys(pi.crossings).length && cnt < 10000) {
            cnt++;
            startLoc = Object.keys(pi.crossings)[0].split(',').map(Number);
            makePath(pi, startLoc);
        }
        if(cnt === 10000) Lib.log('Infinite loop in contour?');
    }
};

function equalPts(pt1, pt2) {
    return Math.abs(pt1[0] - pt2[0]) < 0.01 &&
           Math.abs(pt1[1] - pt2[1]) < 0.01;
}

function ptDist(pt1, pt2) {
    var dx = pt1[0] - pt2[0],
        dy = pt1[1] - pt2[1];
    return Math.sqrt(dx * dx + dy * dy);
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
        n = pi.z[0].length,
        cnt;

    // now follow the path
    for(cnt = 0; cnt < 10000; cnt++) { // just to avoid infinite loops
        if(mi > 20) {
            mi = constants.CHOOSESADDLE[mi][(marchStep[0] || marchStep[1]) < 0 ? 0 : 1];
            pi.crossings[locStr] = constants.SADDLEREMAINDER[mi];
        }
        else {
            delete pi.crossings[locStr];
        }

        marchStep = constants.NEWDELTA[mi];
        if(!marchStep) {
            Lib.log('Found bad marching index:', mi, loc, pi.level);
            break;
        }

        // find the crossing a half step forward, and then take the full step
        pts.push(getInterpPx(pi, loc, marchStep));
        loc[0] += marchStep[0];
        loc[1] += marchStep[1];

        // don't include the same point multiple times
        if(equalPts(pts[pts.length - 1], pts[pts.length - 2])) pts.pop();
        locStr = loc.join(',');

        var atEdge = (marchStep[0] && (loc[0] < 0 || loc[0] > n - 2)) ||
                (marchStep[1] && (loc[1] < 0 || loc[1] > m - 2)),
            closedLoop = (locStr === startLocStr) && (marchStep.join(',') === startStepStr);

        // have we completed a loop, or reached an edge?
        if((closedLoop) || (edgeflag && atEdge)) break;

        mi = pi.crossings[locStr];
    }

    if(cnt === 10000) {
        Lib.log('Infinite loop in contour?');
    }
    var closedpath = equalPts(pts[0], pts[pts.length - 1]),
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
    for(cnt = 1; cnt < pts.length; cnt++) {
        thisdist = ptDist(pts[cnt], pts[cnt - 1]);
        totaldist += thisdist;
        alldists.push(thisdist);
    }

    var distThreshold = totaldist / alldists.length * distThresholdFactor;

    function getpt(i) { return pts[i % pts.length]; }

    for(cnt = pts.length - 2; cnt >= cropstart; cnt--) {
        distgroup = alldists[cnt];
        if(distgroup < distThreshold) {
            cnt3 = 0;
            for(cnt2 = cnt - 1; cnt2 >= cropstart; cnt2--) {
                if(distgroup + alldists[cnt2] < distThreshold) {
                    distgroup += alldists[cnt2];
                }
                else break;
            }

            // closed path with close points wrapping around the boundary?
            if(closedpath && cnt === pts.length - 2) {
                for(cnt3 = 0; cnt3 < cnt2; cnt3++) {
                    if(distgroup + alldists[cnt3] < distThreshold) {
                        distgroup += alldists[cnt3];
                    }
                    else break;
                }
            }
            ptcnt = cnt - cnt2 + cnt3 + 1;
            ptavg = Math.floor((cnt + cnt2 + cnt3 + 2) / 2);

            // either endpoint included: keep the endpoint
            if(!closedpath && cnt === pts.length - 2) newpt = pts[pts.length - 1];
            else if(!closedpath && cnt2 === -1) newpt = pts[0];

            // odd # of points - just take the central one
            else if(ptcnt % 2) newpt = getpt(ptavg);

            // even # of pts - average central two
            else {
                newpt = [(getpt(ptavg)[0] + getpt(ptavg + 1)[0]) / 2,
                    (getpt(ptavg)[1] + getpt(ptavg + 1)[1]) / 2];
            }

            pts.splice(cnt2 + 1, cnt - cnt2 + 1, newpt);
            cnt = cnt2 + 1;
            if(cnt3) cropstart = cnt3;
            if(closedpath) {
                if(cnt === pts.length - 2) pts[cnt3] = pts[pts.length - 1];
                else if(cnt === 0) pts[pts.length - 1] = pts[0];
            }
        }
    }
    pts.splice(0, cropstart);

    // don't return single-point paths (ie all points were the same
    // so they got deleted?)
    if(pts.length < 2) return;
    else if(closedpath) {
        pts.pop();
        pi.paths.push(pts);
    }
    else {
        if(!edgeflag) {
            Lib.log('Unclosed interior contour?',
                pi.level, startLocStr, pts.join('L'));
        }

        // edge path - does it start where an existing edge path ends, or vice versa?
        var merged = false;
        pi.edgepaths.forEach(function(edgepath, edgei) {
            if(!merged && equalPts(edgepath[0], pts[pts.length - 1])) {
                pts.pop();
                merged = true;

                // now does it ALSO meet the end of another (or the same) path?
                var doublemerged = false;
                pi.edgepaths.forEach(function(edgepath2, edgei2) {
                    if(!doublemerged && equalPts(
                            edgepath2[edgepath2.length - 1], pts[0])) {
                        doublemerged = true;
                        pts.splice(0, 1);
                        pi.edgepaths.splice(edgei, 1);
                        if(edgei2 === edgei) {
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
            if(!merged && equalPts(edgepath[edgepath.length - 1], pts[0])) {
                pts.splice(0, 1);
                pi.edgepaths[edgei] = edgepath.concat(pts);
                merged = true;
            }
        });

        if(!merged) pi.edgepaths.push(pts);
    }
}

// special function to get the marching step of the
// first point in the path (leading to loc)
function startStep(mi, edgeflag, loc) {
    var dx = 0,
        dy = 0;
    if(mi > 20 && edgeflag) {
        // these saddles start at +/- x
        if(mi === 208 || mi === 1114) {
            // if we're starting at the left side, we must be going right
            dx = loc[0] === 0 ? 1 : -1;
        }
        else {
            // if we're starting at the bottom, we must be going up
            dy = loc[1] === 0 ? 1 : -1;
        }
    }
    else if(constants.BOTTOMSTART.indexOf(mi) !== -1) dy = 1;
    else if(constants.LEFTSTART.indexOf(mi) !== -1) dx = 1;
    else if(constants.TOPSTART.indexOf(mi) !== -1) dy = -1;
    else dx = -1;
    return [dx, dy];
}

function getInterpPx(pi, loc, step) {
    var locx = loc[0] + Math.max(step[0], 0),
        locy = loc[1] + Math.max(step[1], 0),
        zxy = pi.z[locy][locx],
        xa = pi.xaxis,
        ya = pi.yaxis;

    if(step[1]) {
        var dx = (pi.level - zxy) / (pi.z[locy][locx + 1] - zxy);
        return [xa.c2p((1 - dx) * pi.x[locx] + dx * pi.x[locx + 1], true),
            ya.c2p(pi.y[locy], true)];
    }
    else {
        var dy = (pi.level - zxy) / (pi.z[locy + 1][locx] - zxy);
        return [xa.c2p(pi.x[locx], true),
            ya.c2p((1 - dy) * pi.y[locy] + dy * pi.y[locy + 1], true)];
    }
}

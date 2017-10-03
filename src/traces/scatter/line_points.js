/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var BADNUM = require('../../constants/numerical').BADNUM;
var segmentsIntersect = require('../../lib/geometry2d').segmentsIntersect;


module.exports = function linePoints(d, opts) {
    var xa = opts.xaxis,
        ya = opts.yaxis,
        simplify = opts.simplify,
        connectGaps = opts.connectGaps,
        baseTolerance = opts.baseTolerance,
        linear = opts.linear,
        segments = [],
        minTolerance = 0.2, // fraction of tolerance "so close we don't even consider it a new point"
        pts = new Array(d.length),
        pti = 0,
        i,

        // pt variables are pixel coordinates [x,y] of one point
        clusterStartPt, // these four are the outputs of clustering on a line
        clusterEndPt,
        clusterHighPt,
        clusterLowPt,
        thisPt, // "this" is the next point we're considering adding to the cluster

        clusterRefDist,
        clusterHighFirst, // did we encounter the high point first, then a low point, or vice versa?
        clusterUnitVector, // the first two points in the cluster determine its unit vector
                           // so the second is always in the "High" direction
        thisVector, // the pixel delta from clusterStartPt

        // val variables are (signed) pixel distances along the cluster vector
        clusterHighVal,
        clusterLowVal,
        thisVal,

        // deviation variables are (signed) pixel distances normal to the cluster vector
        clusterMinDeviation,
        clusterMaxDeviation,
        thisDeviation;

    if(!simplify) {
        baseTolerance = minTolerance = -1;
    }

    // turn one calcdata point into pixel coordinates
    function getPt(index) {
        var x = xa.c2p(d[index].x),
            y = ya.c2p(d[index].y);
        if(x === BADNUM || y === BADNUM) return false;
        return [x, y];
    }

    // if we're off-screen, increase tolerance over baseTolerance
    function getTolerance(pt) {
        var xFrac = pt[0] / xa._length;
        var yFrac = pt[1] / ya._length;
        return (1 + 10 * Math.max(0, -xFrac, xFrac - 1, -yFrac, yFrac - 1)) * baseTolerance;
    }

    function ptDist(pt1, pt2) {
        var dx = pt1[0] - pt2[0],
            dy = pt1[1] - pt2[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    // last bit of filtering: clip paths that are VERY far off-screen
    // so we don't get near the browser's hard limit (+/- 2^29 px in Chrome and FF)

    // maximum multiple of the screen size to use
    var maxScreensAway = 20;

    // find the intersections between the segment from pt1 to pt2
    // and the large rectangle maxScreensAway around the viewport
    // if one of pt1 and pt2 is inside and the other outside, there
    // will be only one intersection.
    // if both are outside there will be 0 or 2 intersections
    // (or 1 if it's right at a corner - we'll treat that like 0)
    // returns an array of intersection pts
    var xEdge0 = -xa._length * maxScreensAway;
    var xEdge1 = xa._length * (1 + maxScreensAway);
    var yEdge0 = -ya._length * maxScreensAway;
    var yEdge1 = ya._length * (1 + maxScreensAway);
    var edges = [
        [xEdge0, yEdge0, xEdge1, yEdge0],
        [xEdge1, yEdge0, xEdge1, yEdge1],
        [xEdge1, yEdge1, xEdge0, yEdge1],
        [xEdge0, yEdge1, xEdge0, yEdge0]
    ];
    var xEdge, yEdge, lastXEdge, lastYEdge, lastFarPt, edgePt;

    function getEdgeIntersections(pt1, pt2) {
        var out = [];
        var ptCount = 0;
        for(var i = 0; i < 4; i++) {
            var edge = edges[i];
            var ptInt = segmentsIntersect(pt1[0], pt1[1], pt2[0], pt2[1],
                edge[0], edge[1], edge[2], edge[3]);
            if(ptInt && (!ptCount ||
                Math.abs(ptInt.x - out[0][0]) > 1 ||
                Math.abs(ptInt.y - out[0][1]) > 1
            )) {
                ptInt = [ptInt.x, ptInt.y];
                // if we have 2 intersections, make sure the closest one to pt1 comes first
                if(ptCount && ptDist(ptInt, pt1) < ptDist(out[0], pt1)) out.unshift(ptInt);
                else out.push(ptInt);
                ptCount++;
            }
        }
        return out;
    }

    // a segment pt1->pt2 entirely outside the nearby region:
    // find the corner it gets closest to touching
    function getClosestCorner(pt1, pt2) {
        var dx = pt2[0] - pt1[0];
        var m = (pt2[1] - pt1[1]) / dx;
        var b = (pt1[1] * pt2[0] - pt2[1] * pt1[0]) / dx;

        if(b > 0) return [m > 0 ? xEdge0 : xEdge1, yEdge1];
        else return [m > 0 ? xEdge1 : xEdge0, yEdge0];
    }

    function updateEdge(pt) {
        var x = pt[0];
        var y = pt[1];
        var xSame = x === pts[pti - 1][0];
        var ySame = y === pts[pti - 1][1];
        // duplicate point?
        if(xSame && ySame) return;
        if(pti > 1) {
            // backtracking along an edge?
            var xSame2 = x === pts[pti - 2][0];
            var ySame2 = y === pts[pti - 2][1];
            if(xSame && (x === xEdge0 || x === xEdge1) && xSame2) {
                if(ySame2) pti--; // backtracking exactly - drop prev pt and don't add
                else pts[pti - 1] = pt; // not exact: replace the prev pt
            }
            else if(ySame && (y === yEdge0 || y === yEdge1) && ySame2) {
                if(xSame2) pti--;
                else pts[pti - 1] = pt;
            }
            else pts[pti++] = pt;
        }
        else pts[pti++] = pt;
    }

    function updateEdgesForReentry(pt) {
        // if we're outside the nearby region and going back in,
        // we may need to loop around a corner point
        if(pts[pti - 1][0] !== pt[0] && pts[pti - 1][1] !== pt[1]) {
            updateEdge([lastXEdge, lastYEdge]);
        }
        updateEdge(pt);
        lastFarPt = null;
        lastXEdge = lastYEdge = 0;
    }

    function addPt(pt) {
        // Are we more than maxScreensAway off-screen any direction?
        // if so, clip to this box, but in such a way that on-screen
        // drawing is unchanged
        xEdge = (pt[0] < xEdge0) ? xEdge0 : (pt[0] > xEdge1) ? xEdge1 : 0;
        yEdge = (pt[1] < yEdge0) ? yEdge0 : (pt[1] > yEdge1) ? yEdge1 : 0;
        if(xEdge || yEdge) {
            // to get fills right - if first point is far, push it toward the
            // screen in whichever direction(s) are far
            if(!pti) {
                pts[pti++] = [xEdge || pt[0], yEdge || pt[1]];
            }
            else if(lastFarPt) {
                // both this point and the last are outside the nearby region
                // check if we're crossing the nearby region
                var intersections = getEdgeIntersections(lastFarPt, pt);
                if(intersections.length > 1) {
                    updateEdgesForReentry(intersections[0]);
                    pts[pti++] = intersections[1];
                }
            }
            // we're leaving the nearby region - add the point where we left it
            else {
                edgePt = getEdgeIntersections(pts[pti - 1], pt)[0];
                pts[pti++] = edgePt;
            }

            var lastPt = pts[pti - 1];
            if(xEdge && yEdge && (lastPt[0] !== xEdge || lastPt[1] !== yEdge)) {
                // we've gone out beyond a new corner: add the corner too
                // so that the next point will take the right winding
                if(lastFarPt) {
                    if(lastXEdge !== xEdge && lastYEdge !== yEdge) {
                        if(lastXEdge && lastYEdge) {
                            // we've gone around to an opposite corner - we
                            // need to add the correct extra corner
                            // in order to get the right winding
                            updateEdge(getClosestCorner(lastFarPt, pt));
                        }
                        else {
                            // we're coming from a far edge - the extra corner
                            // we need is determined uniquely by the sectors
                            updateEdge([lastXEdge || xEdge, lastYEdge || yEdge]);
                        }
                    }
                    else if(lastXEdge && lastYEdge) {
                        updateEdge([lastXEdge, lastYEdge]);
                    }
                }
                updateEdge([xEdge, yEdge]);
            }
            else if((lastXEdge - xEdge) && (lastYEdge - yEdge)) {
                // we're coming from an edge or far corner to an edge - again the
                // extra corner we need is uniquely determined by the sectors
                updateEdge([xEdge || lastXEdge, yEdge || lastYEdge]);
            }
            lastFarPt = pt;
            lastXEdge = xEdge;
            lastYEdge = yEdge;
        }
        else {
            if(lastFarPt) {
                // this point is in range but the previous wasn't: add its entry pt first
                updateEdgesForReentry(getEdgeIntersections(lastFarPt, pt)[0]);
            }

            pts[pti++] = pt;
        }
    }

    // loop over ALL points in this trace
    for(i = 0; i < d.length; i++) {
        clusterStartPt = getPt(i);
        if(!clusterStartPt) continue;

        pti = 0;
        lastFarPt = null;
        addPt(clusterStartPt);

        // loop over one segment of the trace
        for(i++; i < d.length; i++) {
            clusterHighPt = getPt(i);
            if(!clusterHighPt) {
                if(connectGaps) continue;
                else break;
            }

            // can't decimate if nonlinear line shape
            // TODO: we *could* decimate [hv]{2,3} shapes if we restricted clusters to horz or vert again
            // but spline would be verrry awkward to decimate
            if(!linear) {
                addPt(clusterHighPt);
                continue;
            }

            clusterRefDist = ptDist(clusterHighPt, clusterStartPt);

            if(clusterRefDist < getTolerance(clusterHighPt) * minTolerance) continue;

            clusterUnitVector = [
                (clusterHighPt[0] - clusterStartPt[0]) / clusterRefDist,
                (clusterHighPt[1] - clusterStartPt[1]) / clusterRefDist
            ];

            clusterLowPt = clusterStartPt;
            clusterHighVal = clusterRefDist;
            clusterLowVal = clusterMinDeviation = clusterMaxDeviation = 0;
            clusterHighFirst = false;
            clusterEndPt = clusterHighPt;

            // loop over one cluster of points that collapse onto one line
            for(i++; i < d.length; i++) {
                thisPt = getPt(i);
                if(!thisPt) {
                    if(connectGaps) continue;
                    else break;
                }
                thisVector = [
                    thisPt[0] - clusterStartPt[0],
                    thisPt[1] - clusterStartPt[1]
                ];
                // cross product (or dot with normal to the cluster vector)
                thisDeviation = thisVector[0] * clusterUnitVector[1] - thisVector[1] * clusterUnitVector[0];
                clusterMinDeviation = Math.min(clusterMinDeviation, thisDeviation);
                clusterMaxDeviation = Math.max(clusterMaxDeviation, thisDeviation);

                if(clusterMaxDeviation - clusterMinDeviation > getTolerance(thisPt)) break;

                clusterEndPt = thisPt;
                thisVal = thisVector[0] * clusterUnitVector[0] + thisVector[1] * clusterUnitVector[1];

                if(thisVal > clusterHighVal) {
                    clusterHighVal = thisVal;
                    clusterHighPt = thisPt;
                    clusterHighFirst = false;
                } else if(thisVal < clusterLowVal) {
                    clusterLowVal = thisVal;
                    clusterLowPt = thisPt;
                    clusterHighFirst = true;
                }
            }

            // insert this cluster into pts
            // we've already inserted the start pt, now check if we have high and low pts
            if(clusterHighFirst) {
                addPt(clusterHighPt);
                if(clusterEndPt !== clusterLowPt) addPt(clusterLowPt);
            } else {
                if(clusterLowPt !== clusterStartPt) addPt(clusterLowPt);
                if(clusterEndPt !== clusterHighPt) addPt(clusterHighPt);
            }
            // and finally insert the end pt
            addPt(clusterEndPt);

            // have we reached the end of this segment?
            if(i >= d.length || !thisPt) break;

            // otherwise we have an out-of-cluster point to insert as next clusterStartPt
            addPt(thisPt);
            clusterStartPt = thisPt;
        }

        // to get fills right - repeat what we did at the start
        if(lastFarPt) updateEdge([lastXEdge || lastFarPt[0], lastYEdge || lastFarPt[1]]);

        segments.push(pts.slice(0, pti));
    }

    return segments;
};

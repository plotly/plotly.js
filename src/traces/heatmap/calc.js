/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var Plots = require('../../plots/plots');

var histogram2dCalc = require('../histogram2d/calc');
var colorscaleCalc = require('../../components/colorscale/calc');
var hasColumns = require('./has_columns');
var convertColumnXYZ = require('./convert_column_xyz');
var maxRowLength = require('./max_row_length');


module.exports = function calc(gd, trace) {
    // prepare the raw data
    // run makeCalcdata on x and y even for heatmaps, in case of category mappings
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        isContour = Plots.traceIs(trace, 'contour'),
        isHist = Plots.traceIs(trace, 'histogram'),
        isGL2D = Plots.traceIs(trace, 'gl2d'),
        zsmooth = isContour ? 'best' : trace.zsmooth,
        x,
        x0,
        dx,
        y,
        y0,
        dy,
        z,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(isHist) {
        var binned = histogram2dCalc(gd, trace);
        x = binned.x;
        x0 = binned.x0;
        dx = binned.dx;
        y = binned.y;
        y0 = binned.y0;
        dy = binned.dy;
        z = binned.z;
    }
    else {
        if(hasColumns(trace)) convertColumnXYZ(trace, xa, ya);

        x = trace.x ? xa.makeCalcdata(trace, 'x') : [];
        y = trace.y ? ya.makeCalcdata(trace, 'y') : [];
        x0 = trace.x0 || 0;
        dx = trace.dx || 1;
        y0 = trace.y0 || 0;
        dy = trace.dy || 1;

        z = cleanZ(trace);

        if(isContour || trace.connectgaps) {
            trace._emptypoints = findEmpties(z);
            trace._interpz = interp2d(z, trace._emptypoints, trace._interpz);
        }
    }

    function noZsmooth(msg) {
        zsmooth = trace._input.zsmooth = trace.zsmooth = false;
        Lib.notifier('cannot fast-zsmooth: ' + msg);
    }

    // check whether we really can smooth (ie all boxes are about the same size)
    if(zsmooth === 'fast') {
        if(xa.type === 'log' || ya.type === 'log') {
            noZsmooth('log axis found');
        }
        else if(!isHist) {
            if(x.length) {
                var avgdx = (x[x.length - 1] - x[0]) / (x.length - 1),
                    maxErrX = Math.abs(avgdx / 100);
                for(i = 0; i < x.length - 1; i++) {
                    if(Math.abs(x[i + 1] - x[i] - avgdx) > maxErrX) {
                        noZsmooth('x scale is not linear');
                        break;
                    }
                }
            }
            if(y.length && zsmooth === 'fast') {
                var avgdy = (y[y.length - 1] - y[0]) / (y.length - 1),
                    maxErrY = Math.abs(avgdy / 100);
                for(i = 0; i < y.length - 1; i++) {
                    if(Math.abs(y[i + 1] - y[i] - avgdy) > maxErrY) {
                        noZsmooth('y scale is not linear');
                        break;
                    }
                }
            }
        }
    }

    // create arrays of brick boundaries, to be used by autorange and heatmap.plot
    var xlen = maxRowLength(z),
        xIn = trace.xtype === 'scaled' ? '' : trace.x,
        xArray = makeBoundArray(trace, xIn, x0, dx, xlen, xa),
        yIn = trace.ytype === 'scaled' ? '' : trace.y,
        yArray = makeBoundArray(trace, yIn, y0, dy, z.length, ya);

    // handled in gl2d convert step
    if(!isGL2D) {
        Axes.expand(xa, xArray);
        Axes.expand(ya, yArray);
    }

    var cd0 = {x: xArray, y: yArray, z: z};

    // auto-z and autocolorscale if applicable
    colorscaleCalc(trace, z, '', 'z');

    if(isContour && trace.contours && trace.contours.coloring === 'heatmap') {
        var hmType = trace.type === 'contour' ? 'heatmap' : 'histogram2d';
        cd0.xfill = makeBoundArray(hmType, xIn, x0, dx, xlen, xa);
        cd0.yfill = makeBoundArray(hmType, yIn, y0, dy, z.length, ya);
    }

    return [cd0];
};


function cleanZ(trace) {
    var zOld = trace.z;

    var rowlen, collen, getCollen, old2new, i, j;

    function cleanZvalue(v) {
        if(!isNumeric(v)) return undefined;
        return +v;
    }

    if(trace.transpose) {
        rowlen = 0;
        for(i = 0; i < zOld.length; i++) rowlen = Math.max(rowlen, zOld[i].length);
        if(rowlen === 0) return false;
        getCollen = function(zOld) { return zOld.length; };
        old2new = function(zOld, i, j) { return zOld[j][i]; };
    }
    else {
        rowlen = zOld.length;
        getCollen = function(zOld, i) { return zOld[i].length; };
        old2new = function(zOld, i, j) { return zOld[i][j]; };
    }

    var zNew = new Array(rowlen);

    for(i = 0; i < rowlen; i++) {
        collen = getCollen(zOld, i);
        zNew[i] = new Array(collen);
        for(j = 0; j < collen; j++) zNew[i][j] = cleanZvalue(old2new(zOld, i, j));
    }

    return zNew;
}

function makeBoundArray(trace, arrayIn, v0In, dvIn, numbricks, ax) {
    var arrayOut = [],
        isContour = Plots.traceIs(trace, 'contour'),
        isHist = Plots.traceIs(trace, 'histogram'),
        isGL2D = Plots.traceIs(trace, 'gl2d'),
        v0,
        dv,
        i;

    var isArrayOfTwoItemsOrMore = Array.isArray(arrayIn) && arrayIn.length > 1;

    if(isArrayOfTwoItemsOrMore && !isHist && (ax.type !== 'category')) {
        arrayIn = arrayIn.map(ax.d2c);
        var len = arrayIn.length;

        // given vals are brick centers
        // hopefully length === numbricks, but use this method even if too few are supplied
        // and extend it linearly based on the last two points
        if(len <= numbricks) {
            // contour plots only want the centers
            if(isContour || isGL2D) arrayOut = arrayIn.slice(0, numbricks);
            else if(numbricks === 1) {
                arrayOut = [arrayIn[0] - 0.5, arrayIn[0] + 0.5];
            }
            else {
                arrayOut = [1.5 * arrayIn[0] - 0.5 * arrayIn[1]];

                for(i = 1; i < len; i++) {
                    arrayOut.push((arrayIn[i - 1] + arrayIn[i]) * 0.5);
                }

                arrayOut.push(1.5 * arrayIn[len - 1] - 0.5 * arrayIn[len - 2]);
            }

            if(len < numbricks) {
                var lastPt = arrayOut[arrayOut.length - 1],
                    delta = lastPt - arrayOut[arrayOut.length - 2];

                for(i = len; i < numbricks; i++) {
                    lastPt += delta;
                    arrayOut.push(lastPt);
                }
            }
        }
        else {
            // hopefully length === numbricks+1, but do something regardless:
            // given vals are brick boundaries
            return isContour ?
                arrayIn.slice(0, numbricks) :  // we must be strict for contours
                arrayIn.slice(0, numbricks + 1);
        }
    }
    else {
        dv = dvIn || 1;

        if(isHist || ax.type === 'category') v0 = v0In || 0;
        else if(Array.isArray(arrayIn) && arrayIn.length === 1) v0 = arrayIn[0];
        else if(v0In === undefined) v0 = 0;
        else v0 = ax.d2c(v0In);

        for(i = (isContour || isGL2D) ? 0 : -0.5; i < numbricks; i++) {
            arrayOut.push(v0 + dv * i);
        }
    }

    return arrayOut;
}

var INTERPTHRESHOLD = 1e-2,
    NEIGHBORSHIFTS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function correctionOvershoot(maxFractionalChange) {
    // start with less overshoot, until we know it's converging,
    // then ramp up the overshoot for faster convergence
    return 0.5 - 0.25 * Math.min(1, maxFractionalChange * 0.5);
}

function interp2d(z, emptyPoints, savedInterpZ) {
    // fill in any missing data in 2D array z using an iterative
    // poisson equation solver with zero-derivative BC at edges
    // amazingly, this just amounts to repeatedly averaging all the existing
    // nearest neighbors (at least if we don't take x/y scaling into account)
    var maxFractionalChange = 1,
        i,
        thisPt;

    if(Array.isArray(savedInterpZ)) {
        for(i = 0; i < emptyPoints.length; i++) {
            thisPt = emptyPoints[i];
            z[thisPt[0]][thisPt[1]] = savedInterpZ[thisPt[0]][thisPt[1]];
        }
    }
    else {
        // one pass to fill in a starting value for all the empties
        iterateInterp2d(z, emptyPoints);
    }

    // we're don't need to iterate lone empties - remove them
    for(i = 0; i < emptyPoints.length; i++) {
        if(emptyPoints[i][2] < 4) break;
    }
    // but don't remove these points from the original array,
    // we'll use them for masking, so make a copy.
    emptyPoints = emptyPoints.slice(i);

    for(i = 0; i < 100 && maxFractionalChange > INTERPTHRESHOLD; i++) {
        maxFractionalChange = iterateInterp2d(z, emptyPoints,
            correctionOvershoot(maxFractionalChange));
    }
    if(maxFractionalChange > INTERPTHRESHOLD) {
        Lib.log('interp2d didn\'t converge quickly', maxFractionalChange);
    }

    return z;
}

function findEmpties(z) {
    // return a list of empty points in 2D array z
    // each empty point z[i][j] gives an array [i, j, neighborCount]
    // neighborCount is the count of 4 nearest neighbors that DO exist
    // this is to give us an order of points to evaluate for interpolation.
    // if no neighbors exist, we iteratively look for neighbors that HAVE
    // neighbors, and add a fractional neighborCount
    var empties = [],
        neighborHash = {},
        noNeighborList = [],
        nextRow = z[0],
        row = [],
        blank = [0, 0, 0],
        rowLength = maxRowLength(z),
        prevRow,
        i,
        j,
        thisPt,
        p,
        neighborCount,
        newNeighborHash,
        foundNewNeighbors;

    for(i = 0; i < z.length; i++) {
        prevRow = row;
        row = nextRow;
        nextRow = z[i + 1] || [];
        for(j = 0; j < rowLength; j++) {
            if(row[j] === undefined) {
                neighborCount = (row[j - 1] !== undefined ? 1 : 0) +
                    (row[j + 1] !== undefined ? 1 : 0) +
                    (prevRow[j] !== undefined ? 1 : 0) +
                    (nextRow[j] !== undefined ? 1 : 0);

                if(neighborCount) {
                    // for this purpose, don't count off-the-edge points
                    // as undefined neighbors
                    if(i === 0) neighborCount++;
                    if(j === 0) neighborCount++;
                    if(i === z.length - 1) neighborCount++;
                    if(j === row.length - 1) neighborCount++;

                    // if all neighbors that could exist do, we don't
                    // need this for finding farther neighbors
                    if(neighborCount < 4) {
                        neighborHash[[i, j]] = [i, j, neighborCount];
                    }

                    empties.push([i, j, neighborCount]);
                }
                else noNeighborList.push([i, j]);
            }
        }
    }

    while(noNeighborList.length) {
        newNeighborHash = {};
        foundNewNeighbors = false;

        // look for cells that now have neighbors but didn't before
        for(p = noNeighborList.length - 1; p >= 0; p--) {
            thisPt = noNeighborList[p];
            i = thisPt[0];
            j = thisPt[1];

            neighborCount = ((neighborHash[[i - 1, j]] || blank)[2] +
                (neighborHash[[i + 1, j]] || blank)[2] +
                (neighborHash[[i, j - 1]] || blank)[2] +
                (neighborHash[[i, j + 1]] || blank)[2]) / 20;

            if(neighborCount) {
                newNeighborHash[thisPt] = [i, j, neighborCount];
                noNeighborList.splice(p, 1);
                foundNewNeighbors = true;
            }
        }

        if(!foundNewNeighbors) {
            throw 'findEmpties iterated with no new neighbors';
        }

        // put these new cells into the main neighbor list
        for(thisPt in newNeighborHash) {
            neighborHash[thisPt] = newNeighborHash[thisPt];
            empties.push(newNeighborHash[thisPt]);
        }
    }

    // sort the full list in descending order of neighbor count
    return empties.sort(function(a, b) { return b[2] - a[2]; });
}

function iterateInterp2d(z, emptyPoints, overshoot) {
    var maxFractionalChange = 0,
        thisPt,
        i,
        j,
        p,
        q,
        neighborShift,
        neighborRow,
        neighborVal,
        neighborCount,
        neighborSum,
        initialVal,
        minNeighbor,
        maxNeighbor;

    for(p = 0; p < emptyPoints.length; p++) {
        thisPt = emptyPoints[p];
        i = thisPt[0];
        j = thisPt[1];
        initialVal = z[i][j];
        neighborSum = 0;
        neighborCount = 0;

        for(q = 0; q < 4; q++) {
            neighborShift = NEIGHBORSHIFTS[q];
            neighborRow = z[i + neighborShift[0]];
            if(!neighborRow) continue;
            neighborVal = neighborRow[j + neighborShift[1]];
            if(neighborVal !== undefined) {
                if(neighborSum === 0) {
                    minNeighbor = maxNeighbor = neighborVal;
                }
                else {
                    minNeighbor = Math.min(minNeighbor, neighborVal);
                    maxNeighbor = Math.max(maxNeighbor, neighborVal);
                }
                neighborCount++;
                neighborSum += neighborVal;
            }
        }

        if(neighborCount === 0) {
            throw 'iterateInterp2d order is wrong: no defined neighbors';
        }

        // this is the laplace equation interpolation:
        // each point is just the average of its neighbors
        // note that this ignores differential x/y scaling
        // which I think is the right approach, since we
        // don't know what that scaling means
        z[i][j] = neighborSum / neighborCount;

        if(initialVal === undefined) {
            if(neighborCount < 4) maxFractionalChange = 1;
        }
        else {
            // we can make large empty regions converge faster
            // if we overshoot the change vs the previous value
            z[i][j] = (1 + overshoot) * z[i][j] - overshoot * initialVal;

            if(maxNeighbor > minNeighbor) {
                maxFractionalChange = Math.max(maxFractionalChange,
                    Math.abs(z[i][j] - initialVal) / (maxNeighbor - minNeighbor));
            }
        }
    }

    return maxFractionalChange;
}

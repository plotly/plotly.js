/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var binFunctions = require('../histogram/bin_functions');
var normFunctions = require('../histogram/norm_functions');
var doAvg = require('../histogram/average');
var getBinSpanLabelRound = require('../histogram/bin_label_vals');

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var x = trace.x ? xa.makeCalcdata(trace, 'x') : [];
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var y = trace.y ? ya.makeCalcdata(trace, 'y') : [];
    var xcalendar = trace.xcalendar;
    var ycalendar = trace.ycalendar;
    var xr2c = function(v) { return xa.r2c(v, 0, xcalendar); };
    var yr2c = function(v) { return ya.r2c(v, 0, ycalendar); };
    var xc2r = function(v) { return xa.c2r(v, 0, xcalendar); };
    var yc2r = function(v) { return ya.c2r(v, 0, ycalendar); };

    var i, j, n, m;

    var serieslen = trace._length;
    if(x.length > serieslen) x.splice(serieslen, x.length - serieslen);
    if(y.length > serieslen) y.splice(serieslen, y.length - serieslen);

    // calculate the bins
    doAutoBin(trace, 'x', x, xa, xr2c, xc2r, xcalendar);
    doAutoBin(trace, 'y', y, ya, yr2c, yc2r, ycalendar);

    // make the empty bin array & scale the map
    var z = [];
    var onecol = [];
    var zerocol = [];
    var nonuniformBinsX = typeof trace.xbins.size === 'string';
    var nonuniformBinsY = typeof trace.ybins.size === 'string';
    var xEdges = [];
    var yEdges = [];
    var xbins = nonuniformBinsX ? xEdges : trace.xbins;
    var ybins = nonuniformBinsY ? yEdges : trace.ybins;
    var total = 0;
    var counts = [];
    var inputPoints = [];
    var norm = trace.histnorm;
    var func = trace.histfunc;
    var densitynorm = norm.indexOf('density') !== -1;
    var extremefunc = func === 'max' || func === 'min';
    var sizeinit = extremefunc ? null : 0;
    var binfunc = binFunctions.count;
    var normfunc = normFunctions[norm];
    var doavg = false;
    var xinc = [];
    var yinc = [];

    // set a binning function other than count?
    // for binning functions: check first for 'z',
    // then 'mc' in case we had a colored scatter plot
    // and want to transfer these colors to the 2D histo
    // TODO: axe this, make it the responsibility of the app changing type? or an impliedEdit?
    var rawCounterData = ('z' in trace) ?
        trace.z :
        (('marker' in trace && Array.isArray(trace.marker.color)) ?
            trace.marker.color : '');
    if(rawCounterData && func !== 'count') {
        doavg = func === 'avg';
        binfunc = binFunctions[func];
    }

    // decrease end a little in case of rounding errors
    var binSpec = trace.xbins;
    var binStart = xr2c(binSpec.start);
    var binEnd = xr2c(binSpec.end) +
        (binStart - Axes.tickIncrement(binStart, binSpec.size, false, xcalendar)) / 1e6;

    for(i = binStart; i < binEnd; i = Axes.tickIncrement(i, binSpec.size, false, xcalendar)) {
        onecol.push(sizeinit);
        xEdges.push(i);
        if(doavg) zerocol.push(0);
    }
    xEdges.push(i);

    var nx = onecol.length;
    var x0c = xr2c(trace.xbins.start);
    var dx = (i - x0c) / nx;
    var x0 = xc2r(x0c + dx / 2);

    binSpec = trace.ybins;
    binStart = yr2c(binSpec.start);
    binEnd = yr2c(binSpec.end) +
        (binStart - Axes.tickIncrement(binStart, binSpec.size, false, ycalendar)) / 1e6;

    for(i = binStart; i < binEnd; i = Axes.tickIncrement(i, binSpec.size, false, ycalendar)) {
        z.push(onecol.slice());
        yEdges.push(i);
        var ipCol = new Array(nx);
        for(j = 0; j < nx; j++) ipCol[j] = [];
        inputPoints.push(ipCol);
        if(doavg) counts.push(zerocol.slice());
    }
    yEdges.push(i);

    var ny = z.length;
    var y0c = yr2c(trace.ybins.start);
    var dy = (i - y0c) / ny;
    var y0 = yc2r(y0c + dy / 2);

    if(densitynorm) {
        xinc = makeIncrements(onecol.length, xbins, dx, nonuniformBinsX);
        yinc = makeIncrements(z.length, ybins, dy, nonuniformBinsY);
    }

    // for date axes we need bin bounds to be calcdata. For nonuniform bins
    // we already have this, but uniform with start/end/size they're still strings.
    if(!nonuniformBinsX && xa.type === 'date') xbins = binsToCalc(xr2c, xbins);
    if(!nonuniformBinsY && ya.type === 'date') ybins = binsToCalc(yr2c, ybins);

    // put data into bins
    var uniqueValsPerX = true;
    var uniqueValsPerY = true;
    var xVals = new Array(nx);
    var yVals = new Array(ny);
    var xGapLow = Infinity;
    var xGapHigh = Infinity;
    var yGapLow = Infinity;
    var yGapHigh = Infinity;
    for(i = 0; i < serieslen; i++) {
        var xi = x[i];
        var yi = y[i];
        n = Lib.findBin(xi, xbins);
        m = Lib.findBin(yi, ybins);
        if(n >= 0 && n < nx && m >= 0 && m < ny) {
            total += binfunc(n, i, z[m], rawCounterData, counts[m]);
            inputPoints[m][n].push(i);

            if(uniqueValsPerX) {
                if(xVals[n] === undefined) xVals[n] = xi;
                else if(xVals[n] !== xi) uniqueValsPerX = false;
            }
            if(uniqueValsPerY) {
                if(yVals[n] === undefined) yVals[n] = yi;
                else if(yVals[n] !== yi) uniqueValsPerY = false;
            }

            xGapLow = Math.min(xGapLow, xi - xEdges[n]);
            xGapHigh = Math.min(xGapHigh, xEdges[n + 1] - xi);
            yGapLow = Math.min(yGapLow, yi - yEdges[m]);
            yGapHigh = Math.min(yGapHigh, yEdges[m + 1] - yi);
        }
    }
    // normalize, if needed
    if(doavg) {
        for(m = 0; m < ny; m++) total += doAvg(z[m], counts[m]);
    }
    if(normfunc) {
        for(m = 0; m < ny; m++) normfunc(z[m], total, xinc, yinc[m]);
    }

    return {
        x: x,
        xRanges: getRanges(xEdges, uniqueValsPerX && xVals, xGapLow, xGapHigh, xa, xcalendar),
        x0: x0,
        dx: dx,
        y: y,
        yRanges: getRanges(yEdges, uniqueValsPerY && yVals, yGapLow, yGapHigh, ya, ycalendar),
        y0: y0,
        dy: dy,
        z: z,
        pts: inputPoints
    };
};

function doAutoBin(trace, axLetter, data, ax, r2c, c2r, calendar) {
    var binAttr = axLetter + 'bins';
    var binSpec = trace[binAttr];
    if(!binSpec) binSpec = trace[binAttr] = {};
    var inputBinSpec = trace._input[binAttr] || {};
    var autoBin = trace._autoBin = {};

    // clear out any previously added autobin info
    if(!inputBinSpec.size) delete binSpec.size;
    if(inputBinSpec.start === undefined) delete binSpec.start;
    if(inputBinSpec.end === undefined) delete binSpec.end;

    var autoSize = !binSpec.size;
    var autoStart = binSpec.start === undefined;
    var autoEnd = binSpec.end === undefined;

    if(autoSize || autoStart || autoEnd) {
        var newBinSpec = Axes.autoBin(data, ax, trace['nbins' + axLetter], '2d', calendar, binSpec.size);
        if(trace.type === 'histogram2dcontour') {
            // the "true" 2nd argument reverses the tick direction (which we can't
            // just do with a minus sign because of month bins)
            if(autoStart) {
                newBinSpec.start = c2r(Axes.tickIncrement(
                    r2c(newBinSpec.start), newBinSpec.size, true, calendar));
            }
            if(autoEnd) {
                newBinSpec.end = c2r(Axes.tickIncrement(
                    r2c(newBinSpec.end), newBinSpec.size, false, calendar));
            }
        }
        if(autoSize) binSpec.size = autoBin.size = newBinSpec.size;
        if(autoStart) binSpec.start = autoBin.start = newBinSpec.start;
        if(autoEnd) binSpec.end = autoBin.end = newBinSpec.end;
    }

    // Backward compatibility for one-time autobinning.
    // autobin: true is handled in cleanData, but autobin: false
    // needs to be here where we have determined the values.
    var autoBinAttr = 'autobin' + axLetter;
    if(trace._input[autoBinAttr] === false) {
        trace._input[binAttr] = Lib.extendFlat({}, binSpec);
        delete trace._input[autoBinAttr];
        delete trace[autoBinAttr];
    }
}

function makeIncrements(len, bins, dv, nonuniform) {
    var out = new Array(len);
    var i;
    if(nonuniform) {
        for(i = 0; i < len; i++) out[i] = 1 / (bins[i + 1] - bins[i]);
    } else {
        var inc = 1 / dv;
        for(i = 0; i < len; i++) out[i] = inc;
    }
    return out;
}

function binsToCalc(r2c, bins) {
    return {
        start: r2c(bins.start),
        end: r2c(bins.end),
        size: bins.size
    };
}

function getRanges(edges, uniqueVals, gapLow, gapHigh, ax, calendar) {
    var i;
    var len = edges.length - 1;
    var out = new Array(len);
    if(uniqueVals) {
        for(i = 0; i < len; i++) out[i] = [uniqueVals[i], uniqueVals[i]];
    } else {
        var roundFn = getBinSpanLabelRound(gapLow, gapHigh, edges, ax, calendar);
        for(i = 0; i < len; i++) out[i] = [roundFn(edges[i]), roundFn(edges[i + 1], true)];
    }
    return out;
}

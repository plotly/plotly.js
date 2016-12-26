/**
* Copyright 2012-2016, Plotly, Inc.
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
var cleanBins = require('../histogram/clean_bins');


module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        x = trace.x ? xa.makeCalcdata(trace, 'x') : [],
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        y = trace.y ? ya.makeCalcdata(trace, 'y') : [],
        xcalendar = trace.xcalendar,
        ycalendar = trace.ycalendar,
        xr2c = function(v) { return xa.r2c(v, 0, xcalendar); },
        yr2c = function(v) { return ya.r2c(v, 0, ycalendar); },
        xc2r = function(v) { return xa.c2r(v, 0, xcalendar); },
        yc2r = function(v) { return ya.c2r(v, 0, ycalendar); },
        x0,
        dx,
        y0,
        dy,
        z,
        i;

    cleanBins(trace, xa, 'x');
    cleanBins(trace, ya, 'y');

    var serieslen = Math.min(x.length, y.length);
    if(x.length > serieslen) x.splice(serieslen, x.length - serieslen);
    if(y.length > serieslen) y.splice(serieslen, y.length - serieslen);


    // calculate the bins
    if(trace.autobinx || !('xbins' in trace)) {
        trace.xbins = Axes.autoBin(x, xa, trace.nbinsx, '2d', xcalendar);
        if(trace.type === 'histogram2dcontour') {
            // the "true" last argument reverses the tick direction (which we can't
            // just do with a minus sign because of month bins)
            trace.xbins.start = xc2r(Axes.tickIncrement(
                xr2c(trace.xbins.start), trace.xbins.size, true, xcalendar));
            trace.xbins.end = xc2r(Axes.tickIncrement(
                xr2c(trace.xbins.end), trace.xbins.size, false, xcalendar));
        }

        // copy bin info back to the source data.
        trace._input.xbins = trace.xbins;
    }
    if(trace.autobiny || !('ybins' in trace)) {
        trace.ybins = Axes.autoBin(y, ya, trace.nbinsy, '2d', ycalendar);
        if(trace.type === 'histogram2dcontour') {
            trace.ybins.start = yc2r(Axes.tickIncrement(
                yr2c(trace.ybins.start), trace.ybins.size, true, ycalendar));
            trace.ybins.end = yc2r(Axes.tickIncrement(
                yr2c(trace.ybins.end), trace.ybins.size, false, ycalendar));
        }
        trace._input.ybins = trace.ybins;
    }

    // make the empty bin array & scale the map
    z = [];
    var onecol = [],
        zerocol = [],
        nonuniformBinsX = (typeof(trace.xbins.size) === 'string'),
        nonuniformBinsY = (typeof(trace.ybins.size) === 'string'),
        xbins = nonuniformBinsX ? [] : trace.xbins,
        ybins = nonuniformBinsY ? [] : trace.ybins,
        total = 0,
        n,
        m,
        counts = [],
        norm = trace.histnorm,
        func = trace.histfunc,
        densitynorm = (norm.indexOf('density') !== -1),
        extremefunc = (func === 'max' || func === 'min'),
        sizeinit = (extremefunc ? null : 0),
        binfunc = binFunctions.count,
        normfunc = normFunctions[norm],
        doavg = false,
        xinc = [],
        yinc = [];

    // set a binning function other than count?
    // for binning functions: check first for 'z',
    // then 'mc' in case we had a colored scatter plot
    // and want to transfer these colors to the 2D histo
    // TODO: this is why we need a data picker in the popover...
    var rawCounterData = ('z' in trace) ?
        trace.z :
        (('marker' in trace && Array.isArray(trace.marker.color)) ?
            trace.marker.color : '');
    if(rawCounterData && func !== 'count') {
        doavg = func === 'avg';
        binfunc = binFunctions[func];
    }

    // decrease end a little in case of rounding errors
    var binspec = trace.xbins,
        binStart = xr2c(binspec.start),
        binEnd = xr2c(binspec.end) +
            (binStart - Axes.tickIncrement(binStart, binspec.size, false, xcalendar)) / 1e6;

    for(i = binStart; i < binEnd; i = Axes.tickIncrement(i, binspec.size, false, xcalendar)) {
        onecol.push(sizeinit);
        if(nonuniformBinsX) xbins.push(i);
        if(doavg) zerocol.push(0);
    }
    if(nonuniformBinsX) xbins.push(i);

    var nx = onecol.length;
    x0 = trace.xbins.start;
    var x0c = xr2c(x0);
    dx = (i - x0c) / nx;
    x0 = xc2r(x0c + dx / 2);

    binspec = trace.ybins;
    binStart = yr2c(binspec.start);
    binEnd = yr2c(binspec.end) +
        (binStart - Axes.tickIncrement(binStart, binspec.size, false, ycalendar)) / 1e6;

    for(i = binStart; i < binEnd; i = Axes.tickIncrement(i, binspec.size, false, ycalendar)) {
        z.push(onecol.concat());
        if(nonuniformBinsY) ybins.push(i);
        if(doavg) counts.push(zerocol.concat());
    }
    if(nonuniformBinsY) ybins.push(i);

    var ny = z.length;
    y0 = trace.ybins.start;
    var y0c = yr2c(y0);
    dy = (i - y0c) / ny;
    y0 = yc2r(y0c + dy / 2);

    if(densitynorm) {
        xinc = onecol.map(function(v, i) {
            if(nonuniformBinsX) return 1 / (xbins[i + 1] - xbins[i]);
            return 1 / dx;
        });
        yinc = z.map(function(v, i) {
            if(nonuniformBinsY) return 1 / (ybins[i + 1] - ybins[i]);
            return 1 / dy;
        });
    }

    // for date axes we need bin bounds to be calcdata. For nonuniform bins
    // we already have this, but uniform with start/end/size they're still strings.
    if(!nonuniformBinsX && xa.type === 'date') {
        xbins = {
            start: xr2c(xbins.start),
            end: xr2c(xbins.end),
            size: xbins.size
        };
    }
    if(!nonuniformBinsY && ya.type === 'date') {
        ybins = {
            start: yr2c(ybins.start),
            end: yr2c(ybins.end),
            size: ybins.size
        };
    }


    // put data into bins
    for(i = 0; i < serieslen; i++) {
        n = Lib.findBin(x[i], xbins);
        m = Lib.findBin(y[i], ybins);
        if(n >= 0 && n < nx && m >= 0 && m < ny) {
            total += binfunc(n, i, z[m], rawCounterData, counts[m]);
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
        x0: x0,
        dx: dx,
        y: y,
        y0: y0,
        dy: dy,
        z: z
    };
};

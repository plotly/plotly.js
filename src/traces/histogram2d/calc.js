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


module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis||'x'),
        x = trace.x ? xa.makeCalcdata(trace, 'x') : [],
        ya = Axes.getFromId(gd, trace.yaxis||'y'),
        y = trace.y ? ya.makeCalcdata(trace, 'y') : [],
        x0,
        dx,
        y0,
        dy,
        z,
        i;

    var serieslen = Math.min(x.length, y.length);
    if(x.length>serieslen) x.splice(serieslen, x.length-serieslen);
    if(y.length>serieslen) y.splice(serieslen, y.length-serieslen);

    Lib.markTime('done convert data');

    // calculate the bins
    if(trace.autobinx || !('xbins' in trace)) {
        trace.xbins = Axes.autoBin(x, xa, trace.nbinsx, '2d');
        if(trace.type==='histogram2dcontour') {
            trace.xbins.start -= trace.xbins.size;
            trace.xbins.end += trace.xbins.size;
        }

        // copy bin info back to the source data.
        trace._input.xbins = trace.xbins;
    }
    if(trace.autobiny || !('ybins' in trace)) {
        trace.ybins = Axes.autoBin(y,ya,trace.nbinsy,'2d');
        if(trace.type==='histogram2dcontour') {
            trace.ybins.start -= trace.ybins.size;
            trace.ybins.end += trace.ybins.size;
        }
        trace._input.ybins = trace.ybins;
    }
    Lib.markTime('done autoBin');

    // make the empty bin array & scale the map
    z = [];
    var onecol = [],
        zerocol = [],
        xbins = (typeof(trace.xbins.size)==='string') ? [] : trace.xbins,
        ybins = (typeof(trace.xbins.size)==='string') ? [] : trace.ybins,
        total = 0,
        n,
        m,
        counts=[],
        norm = trace.histnorm,
        func = trace.histfunc,
        densitynorm = (norm.indexOf('density')!==-1),
        extremefunc = (func==='max' || func==='min'),
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
    if(rawCounterData && func!=='count') {
        doavg = func==='avg';
        binfunc = binFunctions[func];
    }

    // decrease end a little in case of rounding errors
    var binspec = trace.xbins,
        binend = binspec.end +
            (binspec.start - Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

    for(i=binspec.start; i<binend;
            i=Axes.tickIncrement(i,binspec.size)) {
        onecol.push(sizeinit);
        if(Array.isArray(xbins)) xbins.push(i);
        if(doavg) zerocol.push(0);
    }
    if(Array.isArray(xbins)) xbins.push(i);

    var nx = onecol.length;
    x0 = trace.xbins.start;
    dx = (i-x0)/nx;
    x0 += dx/2;

    binspec = trace.ybins;
    binend = binspec.end +
        (binspec.start - Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

    for(i=binspec.start; i<binend;
            i=Axes.tickIncrement(i,binspec.size)) {
        z.push(onecol.concat());
        if(Array.isArray(ybins)) ybins.push(i);
        if(doavg) counts.push(zerocol.concat());
    }
    if(Array.isArray(ybins)) ybins.push(i);

    var ny = z.length;
    y0 = trace.ybins.start;
    dy = (i-y0)/ny;
    y0 += dy/2;

    if(densitynorm) {
        xinc = onecol.map(function(v,i) {
            if(Array.isArray(xbins)) return 1/(xbins[i+1]-xbins[i]);
            return 1/dx;
        });
        yinc = z.map(function(v,i) {
            if(Array.isArray(ybins)) return 1/(ybins[i+1]-ybins[i]);
            return 1/dy;
        });
    }


    Lib.markTime('done making bins');
    // put data into bins
    for(i=0; i<serieslen; i++) {
        n = Lib.findBin(x[i],xbins);
        m = Lib.findBin(y[i],ybins);
        if(n>=0 && n<nx && m>=0 && m<ny) {
            total += binfunc(n, i, z[m], rawCounterData, counts[m]);
        }
    }
    // normalize, if needed
    if(doavg) {
        for(m=0; m<ny; m++) total += doAvg(z[m], counts[m]);
    }
    if(normfunc) {
        for(m=0; m<ny; m++) normfunc(z[m], total, xinc, yinc[m]);
    }
    Lib.markTime('done binning');

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

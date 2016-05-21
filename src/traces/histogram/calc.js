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

var binFunctions = require('./bin_functions');
var normFunctions = require('./norm_functions');
var doAvg = require('./average');


module.exports = function calc(gd, trace) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(trace.visible !== true) return;

    // depending on orientation, set position and size axes and data ranges
    // note: this logic for choosing orientation is duplicated in graph_obj->setstyles
    var pos = [],
        size = [],
        i,
        pa = Axes.getFromId(gd,
            trace.orientation === 'h' ? (trace.yaxis || 'y') : (trace.xaxis || 'x')),
        maindata = trace.orientation === 'h' ? 'y' : 'x',
        counterdata = {x: 'y', y: 'x'}[maindata];

    // prepare the raw data
    var pos0 = pa.makeCalcdata(trace, maindata);
    // calculate the bins
    if((trace['autobin' + maindata] !== false) || !(maindata + 'bins' in trace)) {
        trace[maindata + 'bins'] = Axes.autoBin(pos0, pa, trace['nbins' + maindata]);

        // copy bin info back to the source data.
        trace._input[maindata + 'bins'] = trace[maindata + 'bins'];
    }

    var binspec = trace[maindata + 'bins'],
        allbins = typeof binspec.size === 'string',
        bins = allbins ? [] : binspec,
        // make the empty bin array
        i2,
        binend,
        n,
        inc = [],
        counts = [],
        total = 0,
        norm = trace.histnorm,
        func = trace.histfunc,
        densitynorm = norm.indexOf('density') !== -1,
        extremefunc = func === 'max' || func === 'min',
        sizeinit = extremefunc ? null : 0,
        binfunc = binFunctions.count,
        normfunc = normFunctions[norm],
        doavg = false,
        rawCounterData;

    if(Array.isArray(trace[counterdata]) && func !== 'count') {
        rawCounterData = trace[counterdata];
        doavg = func === 'avg';
        binfunc = binFunctions[func];
    }

    // create the bins (and any extra arrays needed)
    // assume more than 5000 bins is an error, so we don't crash the browser
    i = binspec.start;
    // decrease end a little in case of rounding errors
    binend = binspec.end +
        (binspec.start - Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;
    while(i < binend && pos.length < 5000) {
        i2 = Axes.tickIncrement(i, binspec.size);
        pos.push((i + i2) / 2);
        size.push(sizeinit);
        // nonuniform bins (like months) we need to search,
        // rather than straight calculate the bin we're in
        if(allbins) bins.push(i);
        // nonuniform bins also need nonuniform normalization factors
        if(densitynorm) inc.push(1 / (i2 - i));
        if(doavg) counts.push(0);
        i = i2;
    }

    var nMax = size.length;
    // bin the data
    for(i = 0; i < pos0.length; i++) {
        n = Lib.findBin(pos0[i], bins);
        if(n >= 0 && n < nMax) total += binfunc(n, i, size, rawCounterData, counts);
    }

    // average and/or normalize the data, if needed
    if(doavg) total = doAvg(size, counts);
    if(normfunc) normfunc(size, total, inc);

    var serieslen = Math.min(pos.length, size.length),
        cd = [],
        firstNonzero = 0,
        lastNonzero = serieslen - 1;
    // look for empty bins at the ends to remove, so autoscale omits them
    for(i = 0; i < serieslen; i++) {
        if(size[i]) {
            firstNonzero = i;
            break;
        }
    }
    for(i = serieslen - 1; i > firstNonzero; i--) {
        if(size[i]) {
            lastNonzero = i;
            break;
        }
    }

    // create the "calculated data" to plot
    for(i = firstNonzero; i <= lastNonzero; i++) {
        if((isNumeric(pos[i]) && isNumeric(size[i]))) {
            cd.push({p: pos[i], s: size[i], b: 0});
        }
    }

    return cd;
};

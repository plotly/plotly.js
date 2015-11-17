/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var isNumeric = require('fast-isnumeric');

/** 
 * Histogram has its own calc function,
 * but uses Bars.plot to display
 * and Bars.setPositions for stacking and grouping
 */
var histogram = module.exports = {};

/**
 * histogram errorBarsOK is debatable, but it's put in for backward compat.
 * there are use cases for it - sqrt for a simple histogram works right now,
 * constant and % work but they're not so meaningful. I guess it could be cool
 * to allow quadrature combination of errors in summed histograms...
 */
Plotly.Plots.register(Plotly.Bars, 'histogram',
    ['cartesian', 'bar', 'histogram', 'oriented', 'errorBarsOK', 'showLegend'], {
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'for vertically spanning histograms and',
        'in `y` for horizontally spanning histograms.',

        'Binning options are set `xbins` and `ybins` respectively',
        'if no aggregation data is provided.'
    ].join(' ')
});

Plotly.Plots.register(Plotly.Heatmap, 'histogram2d',
    ['cartesian', '2dMap', 'histogram'], {
    hrName: 'histogram_2d',
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'and `y` (where `x` and `y` represent marginal distributions,',
        'binning is set in `xbins` and `ybins` in this case)',
        'or `z` (where `z` represent the 2D distribution and binning set,',
        'binning is set by `x` and `y` in this case).',
        'The resulting distribution is visualized as a heatmap.'
    ].join(' ')
});

histogram.attributes = require('./attributes');

histogram.supplyDefaults = function(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, histogram.attributes, attr, dflt);
    }

    var binDirections = ['x'],
        hasAggregationData,
        x = coerce('x'),
        y = coerce('y');

    if(Plotly.Plots.traceIs(traceOut, '2dMap')) {
        // we could try to accept x0 and dx, etc...
        // but that's a pretty weird use case.
        // for now require both x and y explicitly specified.
        if(!(x && x.length && y && y.length)) {
            traceOut.visible = false;
            return;
        }

        // if marker.color is an array, we can use it in aggregation instead of z
        hasAggregationData = coerce('z') || coerce('marker.color');

        binDirections = ['x','y'];
    } else {
        var orientation = coerce('orientation', (y && !x) ? 'h' : 'v'),
            sample = traceOut[orientation==='v' ? 'x' : 'y'];

        if(!(sample && sample.length)) {
            traceOut.visible = false;
            return;
        }

        if(orientation==='h') binDirections = ['y'];

        hasAggregationData = traceOut[orientation==='h' ? 'x' : 'y'];
    }

    if(hasAggregationData) coerce('histfunc');
    coerce('histnorm');

    binDirections.forEach(function(binDirection){
        // data being binned - note that even though it's a little weird,
        // it's possible to have bins without data, if there's inferred data
        var binstrt = Plotly.Lib.coerce(traceIn, traceOut, histogram.attributes, binDirection + 'bins.start'),
            binend = Plotly.Lib.coerce(traceIn, traceOut, histogram.attributes, binDirection + 'bins.end'),
            autobin = binstrt && binend ? 
                coerce('autobin' + binDirection, false) : 
                coerce('autobin' + binDirection);

        if(autobin) coerce('nbins' + binDirection);
        else coerce(binDirection + 'bins.size');
    });
};

var binFunctions = {
    count: function(n, i, size) {
        size[n]++;
        return 1;
    },

    sum: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            size[n] += v;
            return v;
        }
        return 0;
    },

    avg: function(n, i, size, counterData, counts) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            size[n] += v;
            counts[n]++;
        }
        return 0;
    },

    min: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            if(!isNumeric(size[n])) {
                size[n] = v;
                return v;
            }
            else if(size[n]>v) {
                size[n] = v;
                return v-size[n];
            }
        }
        return 0;
    },

    max: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            if(!isNumeric(size[n])) {
                size[n] = v;
                return v;
            }
            else if(size[n]<v) {
                size[n] = v;
                return v-size[n];
            }
        }
        return 0;
    }
};

function doAvg(size, counts) {
    var nMax = size.length,
        total = 0;
    for(var i=0; i<nMax; i++) {
        if(counts[i]) {
            size[i] /= counts[i];
            total += size[i];
        }
        else size[i] = null;
    }
    return total;
}

var normFunctions = {
    percent: function(size, total) {
        var nMax = size.length,
            norm = 100/total;
        for(var n=0; n<nMax; n++) size[n] *= norm;
    },
    probability: function(size, total) {
        var nMax = size.length;
        for(var n=0; n<nMax; n++) size[n] /= total;
    },
    density: function(size, total, inc, yinc) {
        var nMax = size.length;
        yinc = yinc||1;
        for(var n=0; n<nMax; n++) size[n] *= inc[n]*yinc;
    },
    'probability density': function(size, total, inc, yinc) {
        var nMax = size.length;
        if(yinc) total/=yinc;
        for(var n=0; n<nMax; n++) size[n] *= inc[n]/total;
    }
};

histogram.calc = function(gd, trace) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(trace.visible !== true) return;

    // depending on orientation, set position and size axes and data ranges
    // note: this logic for choosing orientation is duplicated in graph_obj->setstyles
    var pos = [],
        size = [],
        i,
        pa = Plotly.Axes.getFromId(gd,
            trace.orientation==='h' ? (trace.yaxis || 'y') : (trace.xaxis || 'x')),
        maindata = trace.orientation==='h' ? 'y' : 'x',
        counterdata = {x: 'y', y: 'x'}[maindata];

    // prepare the raw data
    var pos0 = pa.makeCalcdata(trace, maindata);
    // calculate the bins
    if((trace['autobin' + maindata]!==false) || !(maindata + 'bins' in trace)) {
        trace[maindata + 'bins'] = Plotly.Axes.autoBin(pos0, pa, trace['nbins' + maindata]);

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
        densitynorm = norm.indexOf('density')!==-1,
        extremefunc = func==='max' || func==='min',
        sizeinit = extremefunc ? null : 0,
        binfunc = binFunctions.count,
        normfunc = normFunctions[norm],
        doavg = false,
        rawCounterData;

    if(Array.isArray(trace[counterdata]) && func!=='count') {
        rawCounterData = trace[counterdata];
        doavg = func==='avg';
        binfunc = binFunctions[func];
    }

    // create the bins (and any extra arrays needed)
    // assume more than 5000 bins is an error, so we don't crash the browser
    i = binspec.start;
    // decrease end a little in case of rounding errors
    binend = binspec.end +
        (binspec.start - Plotly.Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;
    while(i<binend && pos.length<5000) {
        i2 = Plotly.Axes.tickIncrement(i, binspec.size);
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
    for(i=0; i<pos0.length; i++) {
        n = Plotly.Lib.findBin(pos0[i], bins);
        if(n>=0 && n<nMax) total += binfunc(n, i, size, rawCounterData, counts);
    }

    // average and/or normalize the data, if needed
    if(doavg) total = doAvg(size, counts);
    if(normfunc) normfunc(size, total, inc);

    var serieslen = Math.min(pos.length, size.length),
        cd = [],
        firstNonzero = 0,
        lastNonzero = serieslen-1;
    // look for empty bins at the ends to remove, so autoscale omits them
    for(i=0; i<serieslen; i++) {
        if(size[i]) {
            firstNonzero = i;
            break;
        }
    }
    for(i=serieslen-1; i>firstNonzero; i--) {
        if(size[i]) {
            lastNonzero = i;
            break;
        }
    }

    // create the "calculated data" to plot
    for(i=firstNonzero; i<=lastNonzero; i++) {
        if((isNumeric(pos[i]) && isNumeric(size[i]))) {
            cd.push({p: pos[i], s: size[i], b: 0});
        }
    }

    return cd;
};

histogram.calc2d = function(gd, trace) {
    var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
        x = trace.x ? xa.makeCalcdata(trace, 'x') : [],
        ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
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

    Plotly.Lib.markTime('done convert data');

    // calculate the bins
    if(trace.autobinx || !('xbins' in trace)) {
        trace.xbins = Plotly.Axes.autoBin(x, xa, trace.nbinsx, '2d');
        if(trace.type==='histogram2dcontour') {
            trace.xbins.start -= trace.xbins.size;
            trace.xbins.end += trace.xbins.size;
        }

        // copy bin info back to the source data.
        trace._input.xbins = trace.xbins;
    }
    if(trace.autobiny || !('ybins' in trace)) {
        trace.ybins = Plotly.Axes.autoBin(y,ya,trace.nbinsy,'2d');
        if(trace.type==='histogram2dcontour') {
            trace.ybins.start -= trace.ybins.size;
            trace.ybins.end += trace.ybins.size;
        }
        trace._input.ybins = trace.ybins;
    }
    Plotly.Lib.markTime('done autoBin');

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
            (binspec.start - Plotly.Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

    for(i=binspec.start; i<binend;
            i=Plotly.Axes.tickIncrement(i,binspec.size)) {
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
        (binspec.start - Plotly.Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

    for(i=binspec.start; i<binend;
            i=Plotly.Axes.tickIncrement(i,binspec.size)) {
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
        xinc = onecol.map(function(v,i){
            if(Array.isArray(xbins)) return 1/(xbins[i+1]-xbins[i]);
            return 1/dx;
        });
        yinc = z.map(function(v,i){
            if(Array.isArray(ybins)) return 1/(ybins[i+1]-ybins[i]);
            return 1/dy;
        });
    }


    Plotly.Lib.markTime('done making bins');
    // put data into bins
    for(i=0; i<serieslen; i++) {
        n = Plotly.Lib.findBin(x[i],xbins);
        m = Plotly.Lib.findBin(y[i],ybins);
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
    Plotly.Lib.markTime('done binning');

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

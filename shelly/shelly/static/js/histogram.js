(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    var histogram = window.Plotly.Histogram = {};
    // histogram is a weird one... it has its own calc function, but uses Bars.plot to display
    // and Bars.setPositions for stacking and grouping

    var defaultBins = {
        start: {
            type: 'number',
            dflt: 0
        },
        end: {
            type: 'number',
            dflt: 1
        },
        size: {
            type: 'any', // for date axes
            dflt: 1
        }
    };

    histogram.attributes = {
        // Not so excited about either of these inheritance patterns... but I
        // think it's clear what they mean: histogram2d inherits everything from
        // Heatmap.attributes plus marker color from Scatter (not anymore), and histogram
        // inherits everything from Bars
        allFrom: {
            histogram: 'Bars',
            histogram2d: 'Heatmap',
            histogram2dcontour: 'Contour'
        },
        z: {type: 'data_array'},
        marker: {
            color: {type: 'data_array'}
        },
        histfunc: {
            type: 'enumerated',
            values: ['count', 'sum', 'avg', 'min', 'max'],
            dflt: 'count'
        },
        histnorm: {
            type: 'enumerated',
            values: ['', 'percent', 'probability', 'density', 'probability density'],
            dflt: ''
        },
        autobinx: {
            type: 'boolean',
            dflt: true
        },
        nbinsx: {
            type: 'integer',
            min: 0,
            dflt: 0
        },
        xbins: defaultBins,
        autobiny: {
            type: 'boolean',
            dflt: true
        },
        nbinsy: {
            type: 'integer',
            min: 0,
            dflt: 0
        },
        ybins: defaultBins
    };

    histogram.supplyDefaults = function(traceIn, traceOut) {
        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, histogram.attributes, attr, dflt);
        }

        function coerceModule(module, attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, Plotly[module].attributes, attr, dflt);
        }

        var binDirections = ['x'],
            hasAggregationData,
            x = coerceModule('Scatter', 'x'),
            y = coerceModule('Scatter', 'y');
        if(Plotly.Plots.isHist2D(traceOut.type)) {
            // we could try to accept x0 and dx, etc...
            // but that's a pretty weird use case.
            // for now require both x and y explicitly specified.
            if(!(x && y)) {
                traceOut.visible = false;
                return;
            }

            // if marker.color is an array, we can use it in aggregation instead of z
            hasAggregationData = coerce('z') || coerce('marker.color');

            binDirections = ['x','y'];
        }
        else {
            coerceModule('Bars', 'orientation', (y && !x) ? 'h' : 'v');

            if(!traceOut[traceOut.orientation==='v' ? 'x' : 'y']) {
                traceOut.visible = false;
                return;
            }

            if(traceOut.orientation==='h') binDirections = ['y'];

            hasAggregationData = traceOut[traceOut.orientation==='h' ? 'x' : 'y'];
        }

        if(hasAggregationData) coerce('histfunc');
        coerce('histnorm');

        binDirections.forEach(function(binDirection){
            // data being binned - note that even though it's a little weird,
            // it's possible to have bins without data, if there's inferred data
            if(!Plotly.Plots.isHist2D(traceOut.type)) {

            }

            var autobin = coerce('autobin' + binDirection);

            if(autobin) coerce('nbins' + binDirection);
            else {
                coerce(binDirection + 'bins.start');
                coerce(binDirection + 'bins.end');
                coerce(binDirection + 'bins.size');
            }
        });
    };

    histogram.calc = function(gd, trace) {
        // ignore as much processing as possible (and including in autorange) if bar is not visible
        if(trace.visible===false) return;

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
            cnt = [],
            total = 0,
            norm = trace.histnorm || '',
            func = trace.histfunc || '',
            densitynorm = norm.indexOf('density')!==-1,
            extremefunc = func==='max' || func==='min',
            sizeinit = extremefunc ? null : 0,
            binfunc = function(n) {
                size[n]++;
                total++;
            },
            normfunc = null,
            doavg = false;

        // set a binning function other than count?
        if((counterdata in trace) && ['sum', 'avg', 'min', 'max'].indexOf(func)!==-1) {
            var counter0 = pa.makeCalcdata(trace, counterdata);
            if(func==='sum') {
                binfunc = function(n, i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        size[n] += v;
                        total += v;
                    }
                };
            }
            else if(func==='avg') {
                doavg = true;
                binfunc = function(n, i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        size[n] += v;
                        cnt[n]++;
                    }
                };
            }
            else if(func==='min') {
                binfunc = function(n, i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(size[n])) {
                            total += v;
                            size[n] = v;
                        }
                        else if(size[n]>v) {
                            total += v-size[n];
                            size[n] = v;
                        }
                    }
                };
            }
            else if(func==='max') {
                binfunc = function(n, i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(size[n])) {
                            total += v;
                            size[n] = v;
                        }
                        else if(size[n]<v) {
                            total += v-size[n];
                            size[n] = v;
                        }
                    }
                };
            }
        }

        // set a normalization function?
        if(norm.indexOf('probability')!==-1 || norm.indexOf('percent')!==-1) {
            normfunc = densitynorm ?
                function(v, i) { size[i] *= inc[i]/total; } :
                function(v, i) { size[i] /= total; };
        }
        else if(densitynorm) {
            normfunc = function(v, i) { size[i] *= inc[i]; };
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
            if(doavg) cnt.push(0);
            i = i2;
        }
        // bin the data
        for(i=0; i<pos0.length; i++) {
            n = Plotly.Lib.findBin(pos0[i], bins);
            if(n>=0 && n<size.length) binfunc(n, i);
        }
        // normalize the data, if needed
        if(doavg) {
            size.forEach(function(v,i) {
                if(cnt[i]>0) {
                    size[i] = v / cnt[i];
                    total += size[i];
                }
                else size[i] = null;
            });
        }
        if(norm.indexOf('percent')!==-1) total /= 100;
        if(normfunc) size.forEach(normfunc);

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
            if(($.isNumeric(pos[i]) && $.isNumeric(size[i]))) {
                cd.push({p: pos[i], s: size[i], b: 0});
            }
        }

        return cd;
    };

    histogram.calc2d = function(gd, trace) {
        var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
            ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
            x = trace.x ? xa.makeCalcdata(trace, 'x') : [],
            x0,
            dx,
            y = trace.y ? ya.makeCalcdata(trace, 'y') : [],
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
            total = 0,n,m,cnt=[],
            norm = trace.histnorm||'',
            func = trace.histfunc||'',
            densitynorm = (norm.indexOf('density')!==-1),
            extremefunc = (func==='max' || func==='min'),
            sizeinit = (extremefunc ? null : 0),
            binfunc = function(m,n) {
                z[m][n]++;
                total++;
            },
            normfunc = null,
            doavg = false,
            xinc, yinc;

        // set a binning function other than count?
        // for binning functions: check first for 'z',
        // then 'mc' in case we had a colored scatter plot
        // and want to transfer these colors to the 2D histo
        // TODO: this is why we need a data picker in the popover...
        var counterdata = ('z' in trace) ?
            trace.z :
            (('marker' in trace && $.isArray(trace.marker.color)) ?
                trace.marker.color : '');
        if(counterdata && ['sum', 'avg', 'min', 'max'].indexOf(func)!==-1) {
            var counter0 = counterdata.map(Number);
            if(func==='sum') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        z[m][n]+=v;
                        total+=v;
                    }
                };
            }
            else if(func==='avg') {
                doavg = true;
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        z[m][n]+=v;
                        cnt[m][n]++;
                    }
                };
            }
            else if(func==='min') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(z[m][n])) {
                            total += v;
                            z[m][n] = v;
                        }
                        else if(z[m][n]>v) {
                            total += v - z[m][n];
                            z[m][n] = v;
                        }
                    }
                };
            }
            else if(func==='max') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(z[m][n])) {
                            total+=v;
                            z[m][n] = v;
                        }
                        else if(z[m][n]<v) {
                            total+=v-z[m][n];
                            z[m][n] = v;
                        }
                    }
                };
            }
        }

        // set a normalization function?
        if(norm.indexOf('probability')!==-1 || norm.indexOf('percent')!==-1) {
            normfunc = densitynorm ?
                function(m,n) { z[m][n]*=xinc[n]*yinc[m]/total; } :
                function(m,n) { z[m][n]/=total; };
        }
        else if(densitynorm) {
            normfunc = function(m,n) { z[m][n]*=xinc[n]*yinc[m]; };
        }

        // decrease end a little in case of rounding errors
        var binspec = trace.xbins,
            binend = binspec.end +
                (binspec.start - Plotly.Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

        for(i=binspec.start; i<binend;
                i=Plotly.Axes.tickIncrement(i,binspec.size)) {
            onecol.push(sizeinit);
            if($.isArray(xbins)) xbins.push(i);
            if(doavg) zerocol.push(0);
        }
        if($.isArray(xbins)) xbins.push(i);

        var nx = onecol.length;
        x0 = trace.xbins.start;
        dx = (i-x0)/nx;
        x0+=dx/2;

        binspec = trace.ybins;
        binend = binspec.end +
            (binspec.start - Plotly.Axes.tickIncrement(binspec.start, binspec.size)) / 1e6;

        for(i=binspec.start; i<binend;
                i=Plotly.Axes.tickIncrement(i,binspec.size)) {
            z.push(onecol.concat());
            if($.isArray(ybins)) ybins.push(i);
            if(doavg) cnt.push(zerocol.concat());
        }
        if($.isArray(ybins)) ybins.push(i);

        var ny = z.length;
        y0 = trace.ybins.start;
        dy = (i-y0)/ny;
        y0+=dy/2;

        if(densitynorm) {
            xinc = onecol.map(function(v,i){
                if(norm.indexOf('density')===-1) return 1;
                else if($.isArray(xbins)) return 1/(xbins[i+1]-xbins[i]);
                else return 1/dx;
            });
            yinc = z.map(function(v,i){
                if(norm.indexOf('density')===-1) return 1;
                else if($.isArray(ybins)) return 1/(ybins[i+1]-ybins[i]);
                else return 1/dy;
            });
        }


        Plotly.Lib.markTime('done making bins');
        // put data into bins
        for(i=0; i<serieslen; i++) {
            n = Plotly.Lib.findBin(x[i],xbins);
            m = Plotly.Lib.findBin(y[i],ybins);
            if(n>=0 && n<nx && m>=0 && m<ny) binfunc(m,n,i);
        }
        // normalize, if needed
        if(doavg) {
            for(n=0; n<nx; n++) {
                for(m=0; m<ny; m++) {
                    if(cnt[m][n]>0) {
                        z[m][n] /= cnt[m][n];
                        total += z[m][n];
                    }
                    else z[m][n] = null;
                }
            }
        }
        if(norm.indexOf('percent')!==-1) total/=100;
        if(normfunc) {
            for(n=0; n<nx; n++) {
                for(m=0; m<ny; m++) {
                    if($.isNumeric(z[m][n])) normfunc(m,n);
                }
            }
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
}()); // end Histogram object definition

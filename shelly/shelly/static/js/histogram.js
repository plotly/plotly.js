(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    var histogram = window.Plotly.Histogram = {};
    // histogram is a weird one... it has its own calc function, but uses Bars.plot to display
    // and Bars.setPositions for stacking and grouping

    histogram.attributes = {
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
        'xbins.start': {
            type: 'number',
            dflt: 0
        },
        'xbins.end': {
            type: 'number',
            dflt: 1
        },
        'xbins.size': {
            type: 'number',
            dflt: 1
        },
        autobiny: {
            type: 'boolean',
            dflt: true
        },
        nbinsy: {
            type: 'integer',
            min: 0,
            dflt: 0
        },
        'ybins.start': {
            type: 'number',
            dflt: 0
        },
        'ybins.end': {
            type: 'number',
            dflt: 1
        },
        'ybins.size': {
            type: 'number',
            dflt: 1
        },
    };

    histogram.supplyDefaults = function(traceIn, traceOut) {
        function coerce(attr, dflt) {
            Plotly.Lib.coerce(traceIn, traceOut, histogram.attributes, attr, dflt);
        }

        coerce('histfunc');
        coerce('histnorm');

        var binDirections = 'x';
        if(traceOut.type==='histogram2d') binDirections = ['x','y'];
        else if(traceOut.orientation==='h') binDirections = ['y'];

        binDirections.forEach(function(binDirection){
            var autobin = coerce('autobin' + binDirection);

            if(autobin) coerce('nbins' + binDirection);
            else {
                coerce(binDirection + 'bins.start');
                coerce(binDirection + 'bins.end');
                coerce(binDirection + 'bins.size');
            }
        });
    };

    histogram.calc = function(gd,gdc) {
        // ignore as much processing as possible (and including in autorange) if bar is not visible
        if(gdc.visible===false) return;

        // depending on orientation, set position and size axes and data ranges
        // note: this logic for choosing orientation is duplicated in graph_obj->setstyles
        var pos = [],
            size = [],
            i,
            orientation = gdc.orientation || ((gdc.y && !gdc.x) ? 'h' : 'v'),
            pa = Plotly.Axes.getFromId(gd,
                orientation==='h' ? (gdc.yaxis || 'y') : (gdc.xaxis || 'x')),
            maindata = orientation==='h' ? 'y' : 'x',
            counterdata = {x: 'y', y: 'x'}[maindata];

        // prepare the raw data
        var pos0 = pa.makeCalcdata(gdc, maindata);
        // calculate the bins
        if((gdc['autobin' + maindata]!==false) || !(maindata + 'bins' in gdc)) {
            gdc[maindata + 'bins'] = Plotly.Axes.autoBin(pos0, pa, gdc['nbins' + maindata]);
        }
        var binspec = gdc[maindata + 'bins'],
            allbins = typeof binspec.size === 'string',
            bins = allbins ? [] : binspec,
            // make the empty bin array
            i2,
            n,
            inc = [],
            cnt = [],
            total = 0,
            norm = gdc.histnorm || '',
            func = gdc.histfunc || '',
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
        if((counterdata in gdc) && ['sum', 'avg', 'min', 'max'].indexOf(func)!==-1) {
            var counter0 = pa.makeCalcdata(gdc,counterdata);
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
                            total+=v;
                            size[n] = v;
                        }
                        else if(size[n]>v) {
                            total+=v-size[n];
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
                            total+=v;
                            size[n] = v;
                        }
                        else if(size[n]<v) {
                            total+=v-size[n];
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
        i=binspec.start;
        while(i<binspec.end) {
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
        if(cd[0]) cd[0].t = {orientation: orientation};
        return cd;
    };
}()); // end Histogram object definition

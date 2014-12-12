(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false */

    var boxes = window.Plotly.Boxes = {};

    var scatterMarker = Plotly.Scatter.attributes.marker;

    boxes.attributes = {
        x0: {type: 'any'},
        y0: {type: 'any'},
        whiskerwidth: {
            type: 'number',
            min: 0,
            max: 1,
            dflt: 0.5
        },
        boxpoints: {
            type: 'enumerated',
            values: ['all', 'outliers', 'suspectedoutliers', false],
            dflt: 'outliers'
        },
        boxmean: {
            type: 'enumerated',
            values: [true, 'sd', false],
            dflt: false
        },
        jitter: {
            type: 'number',
            min: 0,
            max: 1
        },
        pointpos: {
            type: 'number',
            min: -2,
            max: 2
        },
        orientation: {
            type: 'enumerated',
            values: ['v', 'h']
        },
        marker: {
            outliercolor: {
                type: 'color',
                dflt: 'rgba(0,0,0,0)'
            },
            symbol: $.extend({arrayOk: false}, scatterMarker.symbol),
            opacity: $.extend({arrayOk: false, dflt: 1}, scatterMarker.opacity),
            size: $.extend({arrayOk: false}, scatterMarker.size),
            color: $.extend({arrayOk: false}, scatterMarker.color),
            line: {
                color: $.extend({arrayOk: false}, scatterMarker.line.color),
                width: $.extend({arrayOk: false}, scatterMarker.line.width),
                outliercolor: {
                    type: 'color'
                },
                outlierwidth: {
                    type: 'number',
                    min: 0,
                    dflt: 1
                }
            }
        },
        // Inherited attributes - not used by supplyDefaults, so if there's
        // a better way to do this feel free to change.
        y: {from: 'Scatter'},
        x: {from: 'Scatter'},
        line: {
            color: {from: 'Scatter'},
            width: {from: 'Scatter'}
        },
        fillcolor: {from: 'Scatter'},
    };

    boxes.layoutAttributes = {
        boxmode: {
            type: 'enumerated',
            values: ['group', 'overlay'],
            dflt: 'overlay'
        },
        boxgap: {
            type: 'number',
            min: 0,
            max: 1,
            dflt: 0.3
        },
        boxgroupgap: {
            type: 'number',
            min: 0,
            max: 1,
            dflt: 0.3
        }
    };

    boxes.supplyDefaults = function(traceIn, traceOut, defaultColor) {
        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, boxes.attributes, attr, dflt);
        }

        function coerceScatter(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, Plotly.Scatter.attributes, attr, dflt);
        }

        var y = coerceScatter('y');
        if(!y) {
            traceOut.visible = false;
            return;
        }

        // if you supply an x array, you will get one box per distinct x value
        // if not, we make a single box and position / label it with x0
        // (or name, if no x0 is found)
        var x = coerceScatter('x');
        if(!x) coerce('x0');

        // inherited from Scatter... should we mention this somehow in boxes.attributes?
        coerceScatter('line.color', (traceIn.marker||{}).color || defaultColor);
        coerceScatter('line.width', 2);
        coerceScatter('fillcolor', Plotly.Color.addOpacity(traceOut.line.color, 0.5));

        coerce('whiskerwidth');
        coerce('boxmean');
        var boxpoints = coerce('boxpoints');
        if(boxpoints) {
            coerce('jitter', boxpoints==='all' ? 0.3 : 0);
            coerce('pointpos', boxpoints==='all' ? -1.5 : 0);

            coerce('marker.symbol');
            coerce('marker.opacity');
            coerce('marker.size');
            coerce('marker.color', traceOut.line.color);
            coerce('marker.line.color');
            coerce('marker.line.width');

            if(boxpoints==='suspectedoutliers') {
                coerce('marker.outliercolor');
                coerce('marker.line.outliercolor', traceOut.marker.color);
                coerce('marker.line.outlierwidth');
            }
        }
    };

    boxes.supplyLayoutDefaults = function(layoutIn, layoutOut, fullData) {
        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(layoutIn, layoutOut, boxes.layoutAttributes, attr, dflt);
        }

        var hasBoxes = fullData.some(function(trace) {
            return Plotly.Plots.isBox(trace.type);
        });

        if(!hasBoxes) return;

        coerce('boxmode');
        coerce('boxgap');
        coerce('boxgroupgap');
    };

    boxes.calc = function(gd, trace) {
        // outlier definition based on http://www.physics.csbsju.edu/stats/box2.html
        var xa = Plotly.Axes.getFromId(gd, trace.xaxis||'x'),
            ya = Plotly.Axes.getFromId(gd, trace.yaxis||'y'),
            x,
            y = ya.makeCalcdata(trace, 'y');

        if('x' in trace) x = xa.makeCalcdata(trace, 'x');

        // if no x data, use x0, or name, or text - so if you want one box
        // per trace, set x0 to the x value or category for this trace
        // (or set x to a constant array matching y)
        else {
            var x0;
            if('x0' in trace) x0 = trace.x0;
            else if('name' in trace && (
                        xa.type==='category' ||
                        ($.isNumeric(trace.name) &&
                            ['linear','log'].indexOf(xa.type)!==-1) ||
                        (Plotly.Lib.isDateTime(trace.name) && xa.type==='date')
                    )) {
                x0 = trace.name;
            }
            else x0 = gd.numboxes;
            x0 = xa.d2c(x0);
            x = y.map(function(){ return x0; });
        }
        // find x values
        var dv = Plotly.Lib.distinctVals(x),
            xvals = dv.vals,
            dx = dv.minDiff/2,
            cd = xvals.map(function(v){ return {x:v}; }),
            pts = xvals.map(function(){ return []; }),
            bins = xvals.map(function(v){ return v-dx; }),
            l = xvals.length;
        bins.push(xvals[l-1]+dx);

        // y autorange based on all source points
        // x happens afterward when we know all the x values
        Plotly.Axes.expand(ya, y, {padded: true});

        // bin the points
        y.forEach(function(v,i){
            if(!$.isNumeric(v)) return;
            var n = Plotly.Lib.findBin(x[i],bins);
            if(n>=0 && n<l) pts[n].push(v);
        });

        // interpolate an array given a (possibly non-integer) index n
        // clip the ends to the extreme values in the array
        // special version for box plots: index you get is half a point too high
        // see http://en.wikipedia.org/wiki/Percentile#Nearest_rank but note
        // that this definition indexes from 1 rather than 0, so we subtract 1/2 instead of add
        function interp(arr,n) {
            n-=0.5;
            if(n<0) return arr[0];
            if(n>arr.length-1) return arr[arr.length-1];
            var frac = n%1;
            return frac * arr[Math.ceil(n)] + (1-frac) * arr[Math.floor(n)];
        }

        // sort the bins and calculate the stats
        pts.forEach(function(v,i){
            v.sort(function(a, b){ return a - b; });
            var l = v.length,
                p = cd[i];
            p.y = v; // put all points into calcdata
            p.min = v[0];
            p.max = v[l-1];
            p.mean = Plotly.Lib.mean(v,l);
            p.sd = Plotly.Lib.stdev(v,l,p.mean);
            p.q1 = interp(v,l/4); // first quartile
            p.med = interp(v,l/2); // median
            p.q3 = interp(v,0.75*l); // third quartile
            // lower and upper fences - last point inside
            // 1.5 interquartile ranges from quartiles
            p.lf = Math.min(p.q1, v[
                Math.min(Plotly.Lib.findBin(2.5*p.q1-1.5*p.q3,v,true)+1, l-1)]);
            p.uf = Math.max(p.q3,v[
                Math.max(Plotly.Lib.findBin(2.5*p.q3-1.5*p.q1,v), 0)]);
            // lower and upper outliers - 3 IQR out (don't clip to max/min,
            // this is only for discriminating suspected & far outliers)
            p.lo = 4*p.q1-3*p.q3;
            p.uo = 4*p.q3-3*p.q1;
        });

        // remove empty bins
        cd = cd.filter(function(p){ return p.y && p.y.length; });
        if(!cd.length) return [{t: {emptybox: true}}];

        cd[0].t = {boxnum: gd.numboxes, dx: dx};
        gd.numboxes++;
        return cd;
    };

    boxes.setPositions = function(gd,plotinfo) {
        var fullLayout = gd._fullLayout,
            xa = plotinfo.x(),
            ya = plotinfo.y(),
            boxlist = [],
            minPad = 0,
            maxPad = 0;
        gd.calcdata.forEach(function(cd,i) {
            var t = cd[0].t,
                trace = cd[0].trace;
            if(trace.visible!==false && !t.emptybox && Plotly.Plots.isBox(trace.type) &&
              trace.xaxis===xa._id && trace.yaxis===ya._id) {
                boxlist.push(i);
                if(trace.boxpoints!==false) {
                    minPad = Math.max(minPad, trace.jitter-trace.pointpos-1);
                    maxPad = Math.max(maxPad, trace.jitter+trace.pointpos-1);
                }
            }
        });

        // box plots - update dx based on multiple traces, and then use for x autorange
        var boxx = [];
        boxlist.forEach(function(i){ gd.calcdata[i].forEach(function(v){ boxx.push(v.x); }); });
        if(boxx.length) {
            var boxdv = Plotly.Lib.distinctVals(boxx),
                dx = boxdv.minDiff/2;

            // if there's no duplication of x points, disable 'group' mode by setting numboxes=1
            if(boxx.length===boxdv.vals.length) gd.numboxes = 1;

            // check for forced minimum dtick
            Plotly.Axes.minDtick(xa,boxdv.minDiff,boxdv.vals[0],true);

            // set the width of all boxes
            boxlist.forEach(function(i){ gd.calcdata[i][0].t.dx = dx; });

            // autoscale the x axis - including space for points if they're off the side
            // TODO: this will overdo it if the outermost boxes don't have
            // their points as far out as the other boxes
            var padfactor = (1-fullLayout.boxgap) * (1-fullLayout.boxgroupgap) *
                    dx / gd.numboxes;
            Plotly.Axes.expand(xa, boxdv.vals, {
                vpadminus: dx+minPad*padfactor,
                vpadplus: dx+maxPad*padfactor
            });
        }
    };

    // repeatable pseudorandom generator
    var randSeed = 2000000000;

    function seed() {
        randSeed = 2000000000;
    }

    function rand() {
        var lastVal = randSeed;
        randSeed = (69069*randSeed + 1)%4294967296;
        // don't let consecutive vals be too close together
        // gets away from really trying to be random, in favor of better local uniformity
        if(Math.abs(randSeed - lastVal) < 429496729) return rand();
        return randSeed/4294967296;
    }

    // constants for dynamic jitter (ie less jitter for sparser points)
    var JITTERCOUNT = 5, // points either side of this to include
        JITTERSPREAD = 0.01; // fraction of IQR to count as "dense"

    boxes.plot = function(gd,plotinfo,cdbox) {
        var fullLayout = gd._fullLayout,
            xa = plotinfo.x(),
            ya = plotinfo.y();
        var boxtraces = plotinfo.plot.select('.boxlayer').selectAll('g.trace.boxes')
            .data(cdbox)
          .enter().append('g')
            .attr('class','trace boxes');

        boxtraces.each(function(d){
            var t = d[0].t,
                trace = d[0].trace,
                group = (fullLayout.boxmode==='group' && gd.numboxes>1),
                // box half width
                bdx = t.dx*(1-fullLayout.boxgap)*(1-fullLayout.boxgroupgap)/(group ? gd.numboxes : 1),
                // box center offset
                bx = group ? 2*t.dx*(-0.5+(t.boxnum+0.5)/gd.numboxes)*(1-fullLayout.boxgap) : 0,
                // whisker width
                wdx = bdx*trace.whiskerwidth;
            if(trace.visible===false || t.emptybox) {
                d3.select(this).remove();
                return;
            }

            // save the box size and box position for use by hover
            t.bx = bx;
            t.bdx = bdx;

            // repeatable pseudorandom number generator
            seed();

            // boxes and whiskers
            d3.select(this).selectAll('path.box')
                .data(Plotly.Lib.identity)
                .enter().append('path')
                .attr('class','box')
                .each(function(d){
                    // draw the bars and whiskers
                    var xc = xa.c2p(d.x+bx, true),
                        x0 = xa.c2p(d.x+bx-bdx, true),
                        x1 = xa.c2p(d.x+bx+bdx, true),
                        xw0 = xa.c2p(d.x+bx-wdx, true),
                        xw1 = xa.c2p(d.x+bx+wdx, true),
                        yq1 = ya.c2p(d.q1, true),
                        yq3 = ya.c2p(d.q3, true),
                        // make sure median isn't identical to either of the
                        // quartiles, so we can see it
                        ym = Plotly.Lib.constrain(ya.c2p(d.med, true),
                            Math.min(yq1, yq3)+1, Math.max(yq1, yq3)-1),
                        ylf = ya.c2p(trace.boxpoints===false ? d.min : d.lf, true),
                        yuf = ya.c2p(trace.boxpoints===false ? d.max : d.uf, true);
                    d3.select(this).attr('d',
                        'M'+x0+','+ym+'H'+x1+ // median line
                        'M'+x0+','+yq1+'H'+x1+'V'+yq3+'H'+x0+'Z'+ // box
                        'M'+xc+','+yq1+'V'+ylf+'M'+xc+','+yq3+'V'+yuf+ // whiskers
                        ((trace.whiskerwidth===0) ? '' : // whisker caps
                            'M'+xw0+','+ylf+'H'+xw1+'M'+xw0+','+yuf+'H'+xw1));
                });

            // draw points, if desired
            if(trace.boxpoints) {
                d3.select(this).selectAll('g.points')
                    // since box plot points get an extra level of nesting, each
                    // box needs the trace styling info
                    .data(function(d){
                        d.forEach(function(v){
                            v.t = t;
                            v.trace = trace;
                        });
                        return d;
                    })
                    .enter().append('g')
                    .attr('class','points')
                  .selectAll('path')
                    .data(function(d){
                        var pts = (trace.boxpoints==='all') ? d.y :
                                d.y.filter(function(v){ return (v<d.lf || v>d.uf); }),
                            spreadLimit = (d.q3 - d.q1) * JITTERSPREAD,
                            jitterFactors = [],
                            maxJitterFactor = 0,
                            i,
                            i0, i1,
                            pmin,
                            pmax,
                            jitterFactor,
                            newJitter;

                        // dynamic jitter
                        if(trace.jitter) {
                            for(i=0; i<pts.length; i++) {
                                i0 = Math.max(0, i-JITTERCOUNT);
                                pmin = pts[i0];
                                i1 = Math.min(pts.length-1, i+JITTERCOUNT);
                                pmax = pts[i1];

                                if(trace.boxpoints!=='all') {
                                    if(pts[i]<d.lf) pmax = Math.min(pmax, d.lf);
                                    else pmin = Math.max(pmin, d.uf);
                                }

                                jitterFactor = Math.sqrt(spreadLimit * (i1-i0) / (pmax-pmin)) || 0;
                                jitterFactor = Plotly.Lib.constrain(Math.abs(jitterFactor), 0, 1);

                                jitterFactors.push(jitterFactor);
                                maxJitterFactor = Math.max(jitterFactor, maxJitterFactor);
                            }
                            newJitter = trace.jitter * 2 / maxJitterFactor;
                        }

                        return pts.map(function(v, i){
                            var xOffset = trace.pointpos;
                            if(trace.jitter) {
                                xOffset += newJitter * jitterFactors[i] * (rand()-0.5);
                            }

                            var p = {
                                x: d.x + xOffset*bdx + bx,
                                y: v
                            };

                            // tag suspected outliers
                            if(trace.boxpoints==='suspectedoutliers' && v<d.uo && v>d.lo) {
                                p.so=true;
                            }
                            return p;
                        });
                    })
                    .enter().append('path')
                    .call(Plotly.Drawing.translatePoints,xa,ya);
            }
            // draw mean (and stdev diamond) if desired
            if(trace.boxmean) {
                d3.select(this).selectAll('path.mean')
                    .data(Plotly.Lib.identity)
                    .enter().append('path')
                    .attr('class','mean')
                    .style('fill','none')
                    .each(function(d){
                        var xc = xa.c2p(d.x+bx, true),
                            x0 = xa.c2p(d.x+bx-bdx, true),
                            x1 = xa.c2p(d.x+bx+bdx, true),
                            ym = ya.c2p(d.mean, true),
                            ysl = ya.c2p(d.mean-d.sd, true),
                            ysh = ya.c2p(d.mean+d.sd, true);
                        d3.select(this).attr('d','M'+x0+','+ym+'H'+x1+
                            ((trace.boxmean!=='sd') ? '' :
                            'm0,0L'+xc+','+ysl+'L'+x0+','+ym+'L'+xc+','+ysh+'Z'));
                    });
            }
        });
    };

    boxes.style = function(gp) {
        var s = gp.selectAll('g.trace.boxes');

        s.style('opacity', function(d){ return d[0].trace.opacity; })
            .each(function(d){
                var trace = d[0].trace,
                    lineWidth = trace.line.width;
                d3.select(this).selectAll('path.box')
                    .style('stroke-width',lineWidth+'px')
                    .call(Plotly.Color.stroke, trace.line.color)
                    .call(Plotly.Color.fill, trace.fillcolor);
                d3.select(this).selectAll('path.mean')
                    .style({
                        'stroke-width': lineWidth,
                        'stroke-dasharray': (2*lineWidth)+'px,'+lineWidth+'px'
                    })
                    .call(Plotly.Color.stroke, trace.line.color);
            })
            .selectAll('g.points')
                .each(function(d){
                    var trace = d.trace;

                    d3.select(this).selectAll('path')
                        .call(Plotly.Drawing.pointStyle, trace);
                });
    };

    boxes.hoverPoints = function(pointData, xval, yval, hovermode) {
        // closest mode: handicap box plots a little relative to others
        var cd = pointData.cd,
            trace = cd[0].trace,
            t = cd[0].t,
            xa = pointData.xa,
            ya = pointData.ya,
            dd = (hovermode==='closest') ? Plotly.Fx.MAXDIST/5 : 0,
            dx = function(di){
                var x = di.x + t.bx - xval;
                return Plotly.Fx.inbox(x - t.bdx, x + t.bdx) + dd;
            },
            dy = function(di){
                return Plotly.Fx.inbox(di.min - yval, di.max - yval);
            },
            distfn = Plotly.Fx.getDistanceFunction(hovermode, dx, dy),
            closeData = [];
        Plotly.Fx.getClosest(cd, distfn, pointData);

        // skip the rest (for this trace) if we didn't find a close point
        if(pointData.index===false) return;

        // create the item(s) in closedata for this point

        // the closest data point
        var di = cd[pointData.index],

            lc = trace.line.color,
            mc = (trace.marker||{}).color;
        if(Plotly.Color.opacity(lc) && trace.line.width) pointData.color = lc;
        else if(Plotly.Color.opacity(mc) && trace.boxpoints) pointData.color = mc;
        else pointData.color = trace.fillcolor;

        pointData.x0 = xa.c2p(di.x + t.bx - t.bdx, true);
        pointData.x1 = xa.c2p(di.x + t.bx + t.bdx, true);

        var xText = Plotly.Axes.tickText(xa, xa.c2l(di.x), 'hover').text;
        if(hovermode==='closest') {
            if(xText!==pointData.name) pointData.name += ': ' + xText;
        }
        else {
            pointData.xLabelVal = di.x;
            if(xText===pointData.name) pointData.name = '';
        }

        // box plots: each "point" gets many labels
        var usedVals = {},
            attrs = ['med','min','q1','q3','max'],
            attr,
            y,
            pointData2;
        if(trace.boxmean) attrs.push('mean');
        if(trace.boxpoints) [].push.apply(attrs,['lf', 'uf']);

        for(var i=0; i<attrs.length; i++) {
            attr = attrs[i];

            if(!(attr in di) || (di[attr] in usedVals)) continue;
            usedVals[di[attr]] = true;

            // copy out to a new object for each value to label
            y = ya.c2p(di[attr], true);
            pointData2 = $.extend({}, pointData);
            pointData2.y0 = pointData2.y1 = y;
            pointData2.yLabelVal = di[attr];
            pointData2.attr = attr;

            if(attr==='mean' && ('sd' in di) && trace.boxmean==='sd') {
                pointData2.yerr = di.sd;
            }
            pointData.name = ''; // only keep name on the first item (median)
            closeData.push(pointData2);
        }
        return closeData;
    };

}()); // end Boxes object definition

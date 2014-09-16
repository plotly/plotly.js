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
        marker: {
            outliercolor: {
                type: 'color',
                dflt: 'rgba(0,0,0,0)'
            },
            symbol: $.extend({arrayOk: false}, scatterMarker.symbol),
            opacity: $.extend({arrayOk: false}, scatterMarker.opacity),
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
        // the following were in Plots.setStyles, but I don't think they
        // work or should work...
        // 'marker.outliercolorscale': {
        //     type: 'string'
        // },
        // 'marker.outliercauto': {
        //     type: 'boolean',
        // },
        // 'marker.outliercmax': {
        //     type: 'number'
        // },
        // 'marker.outliercmin': {
        //     type: 'number'
        // },
        // 'marker.line.outliercolorscale': {
        //     type: 'string'
        // },
        // 'marker.line.outliercauto': {
        //     type: 'boolean',
        // },
        // 'marker.line.outliercmax': {
        //     type: 'number'
        // },
        // 'marker.line.outliercmin': {
        //     type: 'number'
        // }
    };

    boxes.supplyDefaults = function(traceIn, traceOut, defaultColor) {
        function coerce(attr, dflt) {
            Plotly.Lib.coerce(traceIn, traceOut, boxes.attributes, attr, dflt);
        }

        function coerceScatter(attr, dflt) {
            Plotly.Lib.coerce(traceIn, traceOut, Plotly.Scatter.attributes, attr, dflt);
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
        coerceScatter('fillcolor', Plotly.Drawing.addOpacity(traceOut.line.color, 0.5));

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

    boxes.calc = function(gd,gdc) {
        // box plots make no sense if you don't have y
        if(!('y' in gdc) || gdc.visible===false) return;

        // outlier definition based on http://www.physics.csbsju.edu/stats/box2.html
        var xa = Plotly.Axes.getFromId(gd,gdc.xaxis||'x'),
            ya = Plotly.Axes.getFromId(gd,gdc.yaxis||'y'),
            x,
            y = ya.makeCalcdata(gdc,'y');

        if('x' in gdc) x = xa.makeCalcdata(gdc,'x');

        // if no x data, use x0, or name, or text - so if you want one box
        // per trace, set x0 to the x value or category for this trace
        // (or set x to a constant array matching y)
        else {
            var x0;
            if('x0' in gdc) x0 = gdc.x0;
            else if('name' in gdc && (
                        xa.type==='category' ||
                        ($.isNumeric(gdc.name) &&
                            ['linear','log'].indexOf(xa.type)!==-1) ||
                        (Plotly.Lib.isDateTime(gdc.name) && xa.type==='date')
                    )) {
                x0 = gdc.name;
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
        var xa = plotinfo.x,
            ya = plotinfo.y,
            boxlist = [],
            minPad = 0,
            maxPad = 0;
        gd.calcdata.forEach(function(cd,i) {
            var t=cd[0].t;
            if(t.visible!==false && !t.emptybox && t.type==='box' &&
              (t.xaxis||'x')===xa._id && (t.yaxis||'y')===ya._id) {
                boxlist.push(i);
                if(t.boxpts!==false) {
                    minPad = Math.max(minPad,t.jitter-t.ptpos-1);
                    maxPad = Math.max(maxPad,t.jitter+t.ptpos-1);
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
            var padfactor = (1-gd.layout.boxgap) * (1-gd.layout.boxgroupgap) *
                    dx / gd.numboxes;
            Plotly.Axes.expand(xa, boxdv.vals, {
                vpadminus: dx+minPad*padfactor,
                vpadplus: dx+maxPad*padfactor
            });
        }
    };

    boxes.plot = function(gd,plotinfo,cdbox) {
        var gl = gd.layout,
            xa = plotinfo.x,
            ya = plotinfo.y;
        var boxtraces = plotinfo.plot.select('.boxlayer').selectAll('g.trace.boxes')
            .data(cdbox)
          .enter().append('g')
            .attr('class','trace boxes');

        boxtraces.each(function(d){
            var t = d[0].t,
                group = (gl.boxmode==='group' && gd.numboxes>1),
                // box half width
                bdx = t.dx*(1-gl.boxgap)*(1-gl.boxgroupgap)/(group ? gd.numboxes : 1),
                // box center offset
                bx = group ? 2*t.dx*(-0.5+(t.boxnum+0.5)/gd.numboxes)*(1-gl.boxgap) : 0,
                // whisker width
                wdx = bdx*t.ww;
            if(t.visible===false || t.emptybox) {
                d3.select(this).remove();
                return;
            }

            // save the box size and box position for use by hover
            t.bx = bx;
            t.bdx = bdx;

            // boxes and whiskers
            d3.select(this).selectAll('path.box')
                .data(Plotly.Lib.identity)
                .enter().append('path')
                .attr('class','box')
                .each(function(d){
                    // draw the bars and whiskers
                    var xc = xa.c2p(d.x+bx,true),
                        x0 = xa.c2p(d.x+bx-bdx,true),
                        x1 = xa.c2p(d.x+bx+bdx,true),
                        xw0 = xa.c2p(d.x+bx-wdx,true),
                        xw1 = xa.c2p(d.x+bx+wdx,true),
                        ym = ya.c2p(d.med,true),
                        yq1 = ya.c2p(d.q1,true),
                        yq3 = ya.c2p(d.q3,true),
                        ylf = ya.c2p(t.boxpts===false ? d.min : d.lf, true),
                        yuf = ya.c2p(t.boxpts===false ? d.max : d.uf, true);
                    d3.select(this).attr('d',
                        'M'+x0+','+ym+'H'+x1+ // median line
                        'M'+x0+','+yq1+'H'+x1+'V'+yq3+'H'+x0+'Z'+ // box
                        'M'+xc+','+yq1+'V'+ylf+'M'+xc+','+yq3+'V'+yuf+ // whiskers
                        ((t.ww===0) ? '' : // whisker caps
                            'M'+xw0+','+ylf+'H'+xw1+'M'+xw0+','+yuf+'H'+xw1));
                });

            // draw points, if desired
            if(t.boxpts!==false) {
                d3.select(this).selectAll('g.points')
                    // since box plot points get an extra level of nesting, each
                    // box needs the trace styling info
                    .data(function(d){ d.forEach(function(v){v.t=t;}); return d; })
                    .enter().append('g')
                    .attr('class','points')
                  .selectAll('path')
                    .data(function(d){
                        var pts = (t.boxpts==='all') ? d.y :
                            d.y.filter(function(v){ return (v<d.lf || v>d.uf); });
                        return pts.map(function(v){
                            var xo = (t.jitter ? t.jitter*(Math.random()-0.5)*2 : 0)+t.ptpos,
                                p = {x:d.x+xo*bdx+bx,y:v,t:t};
                            // tag suspected outliers
                            if(t.boxpts==='suspectedoutliers' && v<d.uo && v>d.lo) {
                                p.so=true;
                            }
                            return p;
                        });
                    })
                    .enter().append('path')
                    .call(Plotly.Drawing.translatePoints,xa,ya);
            }
            // draw mean (and stdev diamond) if desired
            if(t.mean) {
                d3.select(this).selectAll('path.mean')
                    .data(Plotly.Lib.identity)
                    .enter().append('path')
                    .attr('class','mean')
                    .style('fill','none')
                    .each(function(d){
                        var xc = xa.c2p(d.x+bx,true),
                            x0 = xa.c2p(d.x+bx-bdx,true),
                            x1 = xa.c2p(d.x+bx+bdx,true),
                            ym = ya.c2p(d.mean,true),
                            ysl = ya.c2p(d.mean-d.sd,true),
                            ysh = ya.c2p(d.mean+d.sd,true);
                        d3.select(this).attr('d','M'+x0+','+ym+'H'+x1+
                            ((t.mean!=='sd') ? '' :
                            'm0,0L'+xc+','+ysl+'L'+x0+','+ym+'L'+xc+','+ysh+'Z'));
                    });
            }
        });
    };

    boxes.style = function(gp) {
        var s = gp.selectAll('g.trace.boxes');

        s.style('opacity',function(d){ return d[0].t.op; })
            .each(function(d){
                var t = d[0].t;
                d3.select(this).selectAll('path.box')
                    .style('stroke-width',t.lw+'px')
                    .call(Plotly.Drawing.strokeColor,t.lc)
                    .call(Plotly.Drawing.fillColor,t.fc);
                d3.select(this).selectAll('path.mean')
                    .style({
                        'stroke-width': t.lw,
                        'stroke-dasharray': (2*t.lw)+'px,'+(t.lw)+'px'
                    })
                    .call(Plotly.Drawing.strokeColor,t.lc);
            })
            .selectAll('g.points')
                .each(function(d){
                    var t = d.t||d[0].t;
                    d3.select(this).selectAll('path')
                        .call(Plotly.Drawing.pointStyle,t);
                    d3.select(this).selectAll('text')
                        .call(Plotly.Drawing.textPointStyle,t);
                });
    };

}()); // end Boxes object definition

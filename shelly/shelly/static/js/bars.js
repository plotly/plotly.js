(function() {
    'use strict';

    // ---Plotly global modules
    /* global Plotly:false */

    // ---external global dependencies
    /* global d3:false */

    var bars = window.Plotly.Bars = {};

    bars.attributes = {
        orientation: {
            type: 'enumerated',
            values: ['v', 'h']
        }
    };

    bars.supplyDefaults = function(traceIn, traceOut, defaultColor) {
        function coerce(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, bars.attributes, attr, dflt);
        }

        function coerceScatter(attr, dflt) {
            return Plotly.Lib.coerce(traceIn, traceOut, Plotly.Scatter.attributes, attr, dflt);
        }

        if(!Plotly.Scatter.supplyXY(traceIn, traceOut)) return;

        if(traceOut.type==='histogram') {
            coerce('orientation', (traceOut.y && !traceOut.x) ? 'h' : 'v');
            Plotly.Histogram.supplyDefaults(traceIn, traceOut);
        }
        else {
            coerce('orientation', (traceOut.x && !traceOut.y) ? 'h' : 'v');
        }

        coerceScatter('marker.opacity', 1);
        Plotly.Scatter.colorScalableDefaults('marker.', coerceScatter, defaultColor);
        Plotly.Scatter.colorScalableDefaults('marker.line.', coerceScatter, '#444');
        coerceScatter('marker.line.width', 0);

        // override defaultColor for error bars with #444
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, '#444', {axis: 'y'});
        Plotly.ErrorBars.supplyDefaults(traceIn, traceOut, '#444', {axis: 'x', inherit: 'y'});
    };

    bars.calc = function(gd,gdc) {
        // ignore as much processing as possible (including
        // in autorange) if bar is not visible
        if(gdc.visible===false) { return; }

        if(gdc.type==='histogram') { return Plotly.Histogram.calc(gd,gdc); }

        // depending on bar direction, set position and size axes
        // and data ranges
        // note: this logic for choosing orientation is
        // duplicated in graph_obj->setstyles
        var xa = Plotly.Axes.getFromId(gd,gdc.xaxis||'x'),
            ya = Plotly.Axes.getFromId(gd,gdc.yaxis||'y'),
            orientation = gdc.orientation || ((gdc.x && !gdc.y) ? 'h' : 'v'),
            pos, size, i;
        if(orientation==='h') {
            size = xa.makeCalcdata(gdc,'x');
            pos = ya.makeCalcdata(gdc,'y');
        }
        else {
            size = ya.makeCalcdata(gdc,'y');
            pos = xa.makeCalcdata(gdc,'x');
        }

        // create the "calculated data" to plot
        var serieslen = Math.min(pos.length,size.length),
            cd = [];
        for(i=0;i<serieslen;i++) {
            if(($.isNumeric(pos[i]) && $.isNumeric(size[i]))) {
                cd.push({p:pos[i],s:size[i],b:0});
            }
        }
        if(cd[0]) { cd[0].t = {orientation:orientation};}
        return cd;
    };

    // bar chart stacking/grouping positioning and autoscaling calculations
    // for each direction separately calculate the ranges and positions
    // note that this handles histograms too
    // now doing this one subplot at a time
    bars.setPositions = function(gd,plotinfo) {
        var gl = gd.layout,
            xa = plotinfo.x,
            ya = plotinfo.y,
            i, j;

        ['v','h'].forEach(function(dir){
            var bl = [],
                pLetter = {v:'x',h:'y'}[dir],
                sLetter = {v:'y',h:'x'}[dir],
                pa = plotinfo[pLetter],
                sa = plotinfo[sLetter];

            gd.calcdata.forEach(function(cd,i) {
                var t=cd[0].t;
                if(t.visible!==false && Plotly.Plots.isBar(t.type) &&
                        (t.orientation||'v')===dir &&
                        (t.xaxis||'x')===xa._id &&
                        (t.yaxis||'y')===ya._id) {
                    bl.push(i);
                }
            });
            if(!bl.length) { return; }

            // bar position offset and width calculation
            // bl1 is a list of traces (in calcdata) to look at together
            // to find the maximum size bars that won't overlap
            // for stacked or grouped bars, this is all vertical or horizontal
            // bars for overlaid bars, call this individually on each trace.
            function barposition(bl1) {
                // find the min. difference between any points
                // in any traces in bl1
                var pvals=[];
                bl1.forEach(function(i){
                    gd.calcdata[i].forEach(function(v){ pvals.push(v.p); });
                });
                var dv = Plotly.Lib.distinctVals(pvals),
                    pv2 = dv.vals,
                    barDiff = dv.minDiff;

                // check if all the traces have only independent positions
                // if so, let them have full width even if mode is group
                var overlap = false,
                    comparelist = [];
                if(gl.barmode==='group') {
                    bl1.forEach(function(i) {
                        if(overlap) { return; }
                        gd.calcdata[i].forEach(function(v) {
                            if(overlap) { return; }
                            comparelist.forEach(function(cp) {
                                if(Math.abs(v.p-cp)<barDiff) { overlap = true; }
                            });
                        });
                        if(overlap) { return; }
                        gd.calcdata[i].forEach(function(v) {
                            comparelist.push(v.p);
                        });
                    });
                }

                // check forced minimum dtick
                Plotly.Axes.minDtick(pa,barDiff,pv2[0],overlap);

                // position axis autorange - always tight fitting
                Plotly.Axes.expand(pa,pv2,{vpad:barDiff/2});

                // bar widths and position offsets
                barDiff*=(1-gl.bargap);
                if(overlap) { barDiff/=bl.length; }

                var barCenter;
                function setBarCenter(v) { v[pLetter] = v.p + barCenter; }

                for(var i=0; i<bl1.length; i++){
                    var t=gd.calcdata[bl1[i]][0].t;
                    t.barwidth = barDiff*(1-gl.bargroupgap);
                    t.poffset = ((overlap ? (2*i+1-bl1.length)*barDiff : 0 ) -
                        t.barwidth)/2;
                    t.dbar = dv.minDiff;

                    // store the bar center in each calcdata item
                    barCenter = t.poffset + t.barwidth/2;
                    gd.calcdata[bl1[i]].forEach(setBarCenter);
                }
            }
            if(gl.barmode==='overlay') {
                bl.forEach(function(bli){ barposition([bli]); });
            }
            else { barposition(bl); }

            // bar size range and stacking calculation
            if(gl.barmode==='stack'){
                // for stacked bars, we need to evaluate every step in every
                // stack, because negative bars mean the extremes could be
                // anywhere
                // also stores the base (b) of each bar in calcdata
                // so we don't have to redo this later
                var sMax = sa.l2c(sa.c2l(0)),
                    sMin = sMax,
                    sums={},
                    v=0,

                    // make sure if p is different only by rounding,
                    // we still stack
                    sumround = gd.calcdata[bl[0]][0].t.barwidth/100,
                    sv = 0;
                for(i=0; i<bl.length; i++){ // trace index
                    var ti = gd.calcdata[bl[i]];
                    for(j=0; j<ti.length; j++) {
                        sv = Math.round(ti[j].p/sumround);
                        ti[j].b = (sums[sv]||0);
                        v = ti[j].b+ti[j].s;

                        // store the bar top in each calcdata item
                        ti[j][sLetter] = v;
                        sums[sv] = v;
                        if($.isNumeric(sa.c2l(v))) {
                            sMax = Math.max(sMax,v);
                            sMin = Math.min(sMin,v);
                        }
                    }
                }
                Plotly.Axes.expand(sa,[sMin,sMax],{tozero:true,padded:true});
            }
            else {
                // for grouped or overlaid bars, just make sure zero is
                // included, along with the tops of each bar, and store
                // these bar tops in calcdata
                var fs = function(v){ v[sLetter] = v.s; return v.s; };

                for(i=0; i<bl.length; i++){
                    Plotly.Axes.expand(sa,gd.calcdata[bl[i]].map(fs),
                        {tozero:true,padded:true});
                }
            }
        });
    };

    bars.plot = function(gd,plotinfo,cdbar) {
        var xa = plotinfo.x,
            ya = plotinfo.y,
            gl = gd.layout;

        var bartraces = plotinfo.plot.select('.barlayer')
            .selectAll('g.trace.bars')
                .data(cdbar)
          .enter().append('g')
            .attr('class','trace bars');

        bartraces.append('g')
            .attr('class','points')
            .each(function(d){
                var t = d[0].t;
                d3.select(this).selectAll('path')
                    .data(Plotly.Lib.identity)
                  .enter().append('path')
                    .each(function(di){
                        // now display the bar
                        // clipped xf/yf (2nd arg true): non-positive
                        // log values go off-screen by plotwidth
                        // so you see them continue if you drag the plot
                        var x0,x1,y0,y1;
                        if(t.orientation==='h') {
                            y0 = ya.c2p(t.poffset+di.p, true);
                            y1 = ya.c2p(t.poffset+di.p+t.barwidth, true);
                            x0 = xa.c2p(di.b, true);
                            x1 = xa.c2p(di.s+di.b, true);
                        }
                        else {
                            x0 = xa.c2p(t.poffset+di.p, true);
                            x1 = xa.c2p(t.poffset+di.p+t.barwidth, true);
                            y1 = ya.c2p(di.s+di.b, true);
                            y0 = ya.c2p(di.b, true);
                        }

                        if(!$.isNumeric(x0) || !$.isNumeric(x1) ||
                                !$.isNumeric(y0) || !$.isNumeric(y1) ||
                                x0===x1 || y0===y1) {
                            d3.select(this).remove();
                            return;
                        }
                        var lw = (di.mlw+1 || t.mlw+1 ||
                                (di.t ? di.t.mlw : 0)+1)-1,
                            offset = d3.round((lw/2)%1,2);
                        function roundWithLine(v) {
                            // if there are explicit gaps, don't round,
                            // it can make the gaps look crappy
                            return (gl.bargap===0 && gl.bargroupgap===0) ?
                                d3.round(Math.round(v)-offset,2) : v;
                        }
                        function expandToVisible(v,vc) {
                            // if it's not in danger of disappearing entirely,
                            // round more precisely
                            return Math.abs(v-vc)>=2 ? roundWithLine(v) :
                            // but if it's very thin, expand it so it's
                            // necessarily visible, even if it might overlap
                            // its neighbor
                            (v>vc ? Math.ceil(v) : Math.floor(v));
                        }
                        if(!gl._forexport) {
                            // if bars are not fully opaque or they have a line
                            // around them, round to integer pixels, mainly for
                            // safari so we prevent overlaps from its expansive
                            // pixelation. if the bars ARE fully opaque and have
                            // no line, expand to a full pixel to make sure we
                            // can see them
                            var op = Plotly.Drawing.opacity(
                                    di.mc || t.mc || (di.t ? di.t.mc : '')),
                                fixpx = (op<1 || lw>0.01) ?
                                    roundWithLine : expandToVisible;
                            x0 = fixpx(x0,x1);
                            x1 = fixpx(x1,x0);
                            y0 = fixpx(y0,y1);
                            y1 = fixpx(y1,y0);
                        }
                        d3.select(this).attr('d',
                            'M'+x0+','+y0+'V'+y1+'H'+x1+'V'+y0+'Z');
                    });
            });
    };

    bars.style = function(gp,gl) {
        var s = gp.selectAll('g.trace.bars'),
            barcount = s.size();

        // first trace styling
        s.style('opacity',function(d){ return d[0].t.op; })

        // for gapless (either stacked or neighboring grouped) bars use
        // crispEdges to turn off antialiasing so an artificial gap
        // isn't introduced.
        .each(function(d){
            if((gl.barmode==='stack' && barcount>1) ||
                    (gl.bargap===0 && gl.bargroupgap===0 && !d[0].t.mlw)){
                d3.select(this).attr('shape-rendering','crispEdges');
            }
        });

        // then style the individual bars
        s.selectAll('g.points').each(function(d){
            var t = d.t||d[0].t;
            d3.select(this).selectAll('path').each(function(d) {
                // allow all marker and marker line colors to be scaled
                // by given max and min to colorscales
                var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
                    p = d3.select(this);
                p.style('stroke-width',w+'px')
                    .call(Plotly.Drawing.fillColor,
                        Plotly.Drawing.tryColorscale(s,t,'m')(
                            d.mc || t.mc || (d.t ? d.t.mc : '')));
                if(w) {
                    p.call(Plotly.Drawing.strokeColor,
                        Plotly.Drawing.tryColorscale(s,t,'ml')(
                            d.mlc || t.mlc || (d.t ? d.t.mlc : '')));
                }
            });
            // TODO: text markers on bars, either extra text or just bar values
            // d3.select(this).selectAll('text')
            //     .call(Plotly.Drawing.textPointStyle,d.t||d[0].t);
        });
    };

}()); // end Bars object definition

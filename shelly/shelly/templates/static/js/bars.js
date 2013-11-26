(function() {
var bars = window.Plotly.Bars = {};

bars.calc = function(gd,gdc) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(gdc.visible===false) { return; }

    // depending on bar direction, set position and size axes and data ranges
    var xa = Plotly.Axes.getFromId(gd,gdc.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd,gdc.yaxis||'y'),
        pos, size, pa, sa, i;
    if(gdc.bardir=='h') { pa = ya; sa = xa; }
    else { pa = xa; sa = ya; }
    size = Plotly.Axes.convertOne(gdc,'y',sa);
    pos = Plotly.Axes.convertOne(gdc,'x',pa);

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length,size.length),
        cd = [];
    for(i=0;i<serieslen;i++) {
        if(($.isNumeric(pos[i]) && $.isNumeric(size[i]))) {
            cd.push({p:pos[i],s:size[i],b:0});
        }
    }
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
            pa, sa, pdr;
        gd.calcdata.forEach(function(cd,i) {
            var t=cd[0].t;
            if(t.visible!==false && Plotly.Plots.isBar(t.type) &&
              (t.bardir||'v')==dir && (t.xaxis||'x')==xa._id && (t.yaxis||'y')==ya._id) {
                bl.push(i);
            }
        });
        if(!bl.length) { return; }

        if(dir=='v') { sa = ya; pa = xa; }
        else { sa = xa; pa = ya; }

        // bar position offset and width calculation
        // bl1 is a list of traces (in calcdata) to look at together
        // to find the maximum size bars that won't overlap
        // for stacked or grouped bars, this is all vertical or horizontal bars
        // for overlaid bars, call this individually on each trace.
        function barposition(bl1) {
            // find the min. difference between any points in any traces in bl1
            var pvals=[];
            bl1.forEach(function(i){
                gd.calcdata[i].forEach(function(v){ pvals.push(v.p); });
            });
            var dv = Plotly.Lib.distinctVals(pvals),
                pv2 = dv.vals,
                barDiff = dv.minDiff;
            // check forced minimum dtick
            Plotly.Axes.minDtick(pa,barDiff,pv2[0],gl.barmode=='group');

            // position axis autorange - always tight fitting
            Plotly.Axes.expand(pa,pv2,{vpad:barDiff/2});
            // bar widths and position offsets
            barDiff*=(1-gl.bargap);
            if(gl.barmode=='group') { barDiff/=bl.length; }
            for(var i=0; i<bl1.length; i++){
                var t=gd.calcdata[bl1[i]][0].t;
                t.barwidth = barDiff*(1-gl.bargroupgap);
                t.poffset = (((gl.barmode=='group') ? (2*i+1-bl1.length)*barDiff : 0 ) - t.barwidth)/2;
                t.dbar = dv.minDiff;
            }
        }
        if(gl.barmode=='overlay') { bl.forEach(function(bli){ barposition([bli]); }); }
        else { barposition(bl); }

        // bar size range and stacking calculation
        if(gl.barmode=='stack'){
            // for stacked bars, we need to evaluate every step in every stack,
            // because negative bars mean the extremes could be anywhere
            // also stores the base (b) of each bar in calcdata so we don't have to redo this later
            var sMax = sa.l2c(sa.c2l(0)),
                sMin = sMax,
                sums={},
                v=0,
                sumround = gd.calcdata[bl[0]][0].t.barwidth/100, // make sure...
                sv = 0; //... if p is different only by rounding, we still stack
            for(i=0; i<bl.length; i++){ // trace index
                var ti = gd.calcdata[bl[i]];
                for(j=0; j<ti.length; j++) {
                    sv = Math.round(ti[j].p/sumround);
                    ti[j].b=(sums[sv]||0);
                    v=ti[j].b+ti[j].s;
                    sums[sv]=v;
                    if($.isNumeric(sa.c2l(v))) {
                        sMax = Math.max(sMax,v);
                        sMin = Math.min(sMin,v);
                    }
                }
            }
            Plotly.Axes.expand(sa,[sMin,sMax],{tozero:true,padded:true});
        }
        else {
            // for grouped or overlaid bars, just make sure zero is included,
            // along with the tops of each bar
            var fs = function(v){ return v.s; };
            for(i=0; i<bl.length; i++){
                Plotly.Axes.expand(sa,gd.calcdata[bl[i]].map(fs),{tozero:true,padded:true});
            }
        }
    });
};

bars.plot = function(gd,plotinfo,cdbar) {
    var xa = plotinfo.x,
        ya = plotinfo.y;
    // make the container for scatter plots (so error bars can find them along with bars)
    var bartraces = plotinfo.plot.selectAll('g.trace.bars') // <-- select trace group
        .data(cdbar)
      .enter().append('g') // <-- add a trace for each calcdata
        .attr('class','trace bars');

    bartraces.append('g')
        .attr('class','points')
        .each(function(d){
            var t = d[0].t; // <-- get trace-wide formatting object
            d3.select(this).selectAll('rect')
                .data(Plotly.Lib.identity)
              .enter().append('rect')
                .each(function(di){
                    // now display the bar - here's where we switch x and y
                    // for horz bars
                    // Also: clipped xf/yf (2nd arg true): non-positive
                    // log values go off-screen by plotwidth
                    // so you see them continue if you drag the plot
                    var x0,x1,y0,y1;
                    if(t.bardir=='h') {
                        y0 = ya.c2p(t.poffset+di.p);
                        y1 = ya.c2p(t.poffset+di.p+t.barwidth);
                        x0 = xa.c2p(di.b,true);
                        x1 = xa.c2p(di.s+di.b,true);
                    }
                    else {
                        x0 = xa.c2p(t.poffset+di.p);
                        x1 = xa.c2p(t.poffset+di.p+t.barwidth);
                        y1 = ya.c2p(di.s+di.b,true);
                        y0 = ya.c2p(di.b,true);
                    }

                    if(!$.isNumeric(x0)||!$.isNumeric(x1)||!$.isNumeric(y0)||!$.isNumeric(y1)) {
                        d3.select(this).remove();
                        return;
                    }
                    d3.select(this)
                        .attr('transform','translate('+Math.min(x0,x1)+','+Math.min(y0,y1)+')')
                        // TODO: why do I need this extra 0.001? Without it occasionally
                        // there's an empty pixel in the non-antialiased (gapless) case
                        .attr('width',Math.abs(x1-x0)+0.001)
                        .attr('height',Math.abs(y1-y0)+0.001);
                });
        });
};

}()); // end Bars object definition

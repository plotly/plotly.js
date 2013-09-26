(function() {
var bars = window.Plotly.Bars = {};

bars.calc = function(gd,gdc) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(gdc.visible===false) { return; }

    // depending on bar direction, set position and size axes and data ranges
    var pos, size, pa, sa, i;
    if(gdc.bardir=='h') { pa = gd.layout.yaxis; sa = gd.layout.xaxis; }
    else { pa = gd.layout.xaxis; sa = gd.layout.yaxis; }
    if(gdc.type=='bar') {
        size = Plotly.Axes.convertOne(gdc,'y',sa);
        pos = Plotly.Axes.convertOne(gdc,'x',pa);
    }
    else { // histogram
        // prepare the raw data
        // pick out x data for histogramx, y for histogramy
        // counterdata doesn't make much sense here, it's only if the data is missing
        // so gets made up monotonically increasing based on the opposite axis data,
        // but the user will see that...
        // the alternative would be to disable x histogram if there's no x data, etc.
        var pos0 = Plotly.Axes.convertOne(gdc,gdc.type.charAt(9),pa);
        // calculate the bins
        if((gdc.autobinx!==false) || !('xbins' in gdc)) {
            gdc.xbins = Plotly.Axes.autoBin(pos0,pa,gdc.nbinsx);
        }
        var allbins = (typeof(gdc.xbins.size)=='string'),
            bins = allbins ? [] : gdc.xbins,
            // make the empty bin array
            i2, n, inc = [], count=0,
            norm = gdc.histnorm||'';
        pos = [];
        size = [];
        i=gdc.xbins.start;
        while(i<gdc.xbins.end) {
            i2 = Plotly.Axes.tickIncrement(i,gdc.xbins.size);
            pos.push((i+i2)/2);
            size.push(0);
            // nonuniform bins (like months) we need to search,
            // rather than straight calculate the bin we're in
            if(allbins) { bins.push(i); }
            // nonuniform bins also need nonuniform normalization factors
            inc.push(norm.indexOf('density')!=-1 ? 1/(i2-i) : 1);
            i=i2;
        }
        // bin the data
        for(i=0; i<pos0.length; i++) {
            n = Plotly.Lib.findBin(pos0[i],bins);
            if(n>=0 && n<size.length) { size[n]+=inc[n]; count++; }
        }
        // normalize the data, if needed
        if(norm.indexOf('percent')!=-1) { count/=100; }
        if(norm.indexOf('probability')!=-1 || norm.indexOf('percent')!=-1) {
            size.forEach(function(v,i){ size[i]/=count; });
        }
    }

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
bars.setPositions = function(gd) {
    var gl = gd.layout,
        xa = gl.xaxis,
        ya = gl.yaxis,
        i, j;

    ['v','h'].forEach(function(dir){
        var bl = [],
            pa, sa, pdr;
        gd.calcdata.forEach(function(cd,i) {
            var t=cd[0].t;
            if(t.visible!==false && Plotly.Plots.BARTYPES.indexOf(t.type)!=-1 &&
              (t.bardir||'v')==dir) {
                bl.push(i);
            }
        });
        if(!bl.length) { return; }

        if(dir=='v') { sa = ya; pa = xa; pdr = xa._tight; }
        else { sa = xa; pa = ya; pdr = ya._tight; }

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
            // position axis autorange - always tight fitting
            Plotly.Axes.expandBounds(pa,pdr,pv2,pv2.length,barDiff/2);
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
            Plotly.Axes.expandWithZero(sa,[sMin,sMax]);
        }
        else {
            // for grouped or overlaid bars, just make sure zero is included,
            // along with the tops of each bar
            var fs = function(v){ return v.s; };
            for(i=0; i<bl.length; i++){
                Plotly.Axes.expandWithZero(sa,gd.calcdata[bl[i]].map(fs));
            }
        }
    });
};

bars.plot = function(gd,cdbar) {
    var xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;
    var bartraces = gd.plot.selectAll('g.trace.bars') // <-- select trace group
        .data(cdbar) // <-- bind calcdata to traces
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
                    // Also: clipped xf/yf (3rd arg true): non-positive
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

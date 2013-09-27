(function() {
var histogram = window.Plotly.Histogram = {};
// histogram is a weird one... it has its own calc function, but uses Bars.plot to display
// and Bars.setPositions for stacking and grouping

histogram.calc = function(gd,gdc) {
    // ignore as much processing as possible (and including in autorange) if bar is not visible
    if(gdc.visible===false) { return; }

    // depending on bar direction, set position and size axes and data ranges
    var pos, size, pa, sa, i;
    if(gdc.bardir=='h') { pa = gd.layout.yaxis; sa = gd.layout.xaxis; }
    else { pa = gd.layout.xaxis; sa = gd.layout.yaxis; }

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



}()); // end Histogram object definition
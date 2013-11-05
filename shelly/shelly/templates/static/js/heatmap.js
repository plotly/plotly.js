(function() {
var heatmap = window.Plotly.Heatmap = {};

// option to limit number of pixels per color brick, for better speed
// also, Firefox and IE seem to allow nearest-neighbor scaling, so could set to 1?
// zero or other falsy val disables
MAX_PX_PER_BRICK=0;

heatmap.calc = function(gd,gdc) {
    // calcdata ("cd") for heatmaps:
    // curve: index of heatmap in gd.data
    // type: used to distinguish heatmaps from traces in "Data" popover
    if(gdc.visible===false) { return; }

    // prepare the raw data
    // run convertOne even for heatmaps, in case of category mappings
    Plotly.Lib.markTime('start convert x&y');
    var xa = gd.layout.xaxis,
        x = gdc.x ? Plotly.Axes.convertOne(gdc,'x',xa) : [],
        x0, dx,
        ya = gd.layout.yaxis,
        y = gdc.y ? Plotly.Axes.convertOne(gdc,'y',ya) : [],
        y0, dy,
        z = gdc.z,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    Plotly.Lib.markTime('done convert x&y');

    if(gdc.type=='histogram2d') {
        var serieslen = Math.min(x.length,y.length);
        if(x.length>serieslen) { x.splice(serieslen,x.length-serieslen); }
        if(y.length>serieslen) { y.splice(serieslen,y.length-serieslen); }
        Plotly.Lib.markTime('done convert data');
        // calculate the bins
        if(gdc.autobinx || !('xbins' in gdc)) { gdc.xbins = Plotly.Axes.autoBin(x,xa,gdc.nbinsx,'2d'); }
        if(gdc.autobiny || !('ybins' in gdc)) { gdc.ybins = Plotly.Axes.autoBin(y,ya,gdc.nbinsy,'2d'); }
        Plotly.Lib.markTime('done autoBin');
        // make the empty bin array & scale the map
        z = [];
        var onecol = [],
            xbins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.xbins,
            ybins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.ybins,
            norm = gdc.histnorm||'';
        for(i=gdc.xbins.start; i<gdc.xbins.end; i=Plotly.Axes.tickIncrement(i,gdc.xbins.size)) {
            onecol.push(0);
            if($.isArray(xbins)) { xbins.push(i); }
        }
        if($.isArray(xbins)) { xbins.push(i); }

        var nx = onecol.length;
        x0 = gdc.xbins.start;
        dx = (i-x0)/nx;
        x0+=dx/2;
        var xinc = onecol.map(function(v,i){
            if(norm.indexOf('density')==-1) { return 1; }
            else if($.isArray(xbins)) { return 1/(xbins[i+1]-xbins[i]); }
            else { return 1/dx; }
        });

        for(i=gdc.ybins.start; i<gdc.ybins.end; i=Plotly.Axes.tickIncrement(i,gdc.ybins.size)) {
            z.push(onecol.concat());
            if($.isArray(ybins)) { ybins.push(i); }
        }
        if($.isArray(ybins)) { ybins.push(i); }

        var ny = z.length;
        y0 = gdc.ybins.start;
        dy = (i-y0)/ny;
        y0+=dy/2;
        var yinc = z.map(function(v,i){
            if(norm.indexOf('density')==-1) { return 1; }
            else if($.isArray(ybins)) { return 1/(ybins[i+1]-ybins[i]); }
            else { return 1/dy; }
        });

        Plotly.Lib.markTime('done making bins');
        // put data into bins
        var count = 0;
        for(i=0; i<serieslen; i++) {
            var n = Plotly.Lib.findBin(x[i],xbins),
                m = Plotly.Lib.findBin(y[i],ybins);
            if(n>=0 && n<nx && m>=0 && m<ny) { z[m][n]+=xinc[n]*yinc[m]; count++; }
        }
        if(norm.indexOf('percent')!=-1) { count/=100; }
        if(norm.indexOf('probability')!=-1 || norm.indexOf('percent')!=-1) {
            z.forEach(function(row){ row.forEach(function(v,i){
                row[i]/=count;
            }); });
        }
        Plotly.Lib.markTime('done binning');
    }
    else {
        x0 = gdc.x0||0;
        dx = gdc.dx||1;
        y0 = gdc.y0||0;
        dy = gdc.dy||1;
    }

    // check whether we really can smooth (ie all boxes are about the same size)
    if([true,'fast'].indexOf(gdc.zsmooth)!=-1) {
        if(xa.type=='log' || ya.type=='log') {
            gdc.zsmooth = false;
            Plotly.Lib.notifier('cannot fast-zsmooth: log axis found');
        }
        else if(gdc.type!='histogram2d') {
            if(x.length) {
                var avgdx = (x[x.length-1]-x[0])/(x.length-1), maxErrX = Math.abs(avgdx/100);
                for(i=0; i<x.length-1; i++) {
                    if(Math.abs(x[i+1]-x[i]-avgdx)>maxErrX) {
                        gdc.zsmooth = false;
                        Plotly.Lib.notifier('cannot fast-zsmooth: x scale is not linear');
                        break;
                    }
                }
            }
            if(y.length) {
                var avgdy = (y[y.length-1]-y[0])/(y.length-1), maxErrY = Math.abs(avgdy/100);
                for(i=0; i<y.length-1; i++) {
                    if(Math.abs(y[i+1]-y[i]-avgdy)>maxErrY) {
                        gdc.zsmooth = false;
                        Plotly.Lib.notifier('cannot fast-zsmooth: y scale is not linear');
                        break;
                    }
                }
            }
        }
    }

    // auto-z
    if(gdc.zauto!==false || !('zmin' in gdc)) { gdc.zmin = zmin(z); }
    if(gdc.zauto!==false || !('zmax' in gdc)) { gdc.zmax = zmax(z); }
    if(gdc.zmin==gdc.zmax) { gdc.zmin-=0.5; gdc.zmax+=0.5; }

    // create arrays of brick boundaries, to be used by autorange and heatmap.plot
    var x_in = gdc.xtype=='scaled' ? '' : gdc.x,
        xArray = makeBoundArray(gdc.type, x_in, x0, dx, z[0].length, gd.layout.xaxis),
        y_in = gdc.ytype=='scaled' ? '' : gdc.y,
        yArray = makeBoundArray(gdc.type, y_in, y0, dy, z.length, gd.layout.yaxis);
    Plotly.Axes.expand(xa,xArray);
    Plotly.Axes.expand(ya,yArray);

    // this is gd.calcdata for the heatmap (other attributes get added by setStyles)
    return [{x:xArray, y:yArray, z:z}];
};

function makeBoundArray(type,array_in,v0_in,dv_in,numbricks,ax) {
    var array_out = [], v0, dv, i;
    if($.isArray(array_in) && (type!='histogram2d') && (ax.type!='category')) {
        array_in = Plotly.Axes.convertToNums(array_in,ax);
        var len = array_in.length;
        if(len==numbricks) { // given vals are brick centers
            if(numbricks==1) { return [array_in[0]-0.5,array_in[0]+0.5]; }
            else {
                array_out = [1.5*array_in[0]-0.5*array_in[1]];
                for(i=1; i<len; i++) {
                    array_out.push((array_in[i-1]+array_in[i])*0.5);
                }
                array_out.push(1.5*array_in[len-1]-0.5*array_in[len-2]);
            }
        }
        else {  // hopefully length==numbricks+1, but do something regardless:
                // given vals are brick boundaries
            return array_in.slice(0,numbricks+1);
        }
    }
    else {
        dv = dv_in || 1;
        if(v0_in===undefined) { v0 = 0; }
        else if(type=='histogram2d' || ax.type=='category') {
            v0 = v0_in;
        }
        else { v0 = Plotly.Axes.convertToNums(v0_in,ax); }
        for(i=0; i<=numbricks; i++) { array_out.push(v0+dv*(i-0.5)); }
    }
    return array_out;
}

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Params are index of heatmap data object in gd.data, and the heatmap data object itself
// cd "calcdata" - contains styling information
// Example usage:
// plot(gd, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}])
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
heatmap.plot = function(gd,cd) {
    Plotly.Lib.markTime('in Heatmap.plot');
    var t = cd[0].t,
        i = t.curve,
        xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;

    var z=cd[0].z, min=t.zmin, max=t.zmax, scl=getScale(cd), x=cd[0].x, y=cd[0].y;
    var id='hm'+i; // heatmap id
    var cb_id='cb'+i; // colorbar id
    var fastsmooth=[true,'fast'].indexOf(t.zsmooth)!=-1; // fast smoothing - one pixel per brick

    // get z dims
    var m=z.length, n=z[0].length; // num rows, cols
    // TODO: if there are multiple overlapping categorical heatmaps,
    // or if we allow category sorting, then the categories may not be
    // sequential... may need to reorder and/or expand z

    // Get edges of png in pixels (xa.c2p() maps axes coordinates to pixel coordinates)
    // figure out if either axis is reversed (y is usually reversed, in pixel coords)
    // also clip the image to maximum 50% outside the visible plot area
    // bigger image lets you pan more naturally, but slows performance.
    // TODO: use low-resolution images outside the visible plot for panning
    var xrev = false, left, right, temp;
    // these while loops find the first and last brick bounds that are defined (in case of log of a negative)
    i=0; while(left===undefined && i<n) { left=xa.c2p(x[i]); i++; }
    i=n; while(right===undefined && i>0) { right=xa.c2p(x[i]); i--; }
    if(right<left) {
        temp = right;
        right = left;
        left = temp;
        xrev = true;
    }

    var yrev = false, top, bottom;
    i=0; while(top===undefined && i<n) { top=ya.c2p(y[i]); i++; }
    i=m; while(bottom===undefined && i>0) { bottom=ya.c2p(y[i]); i--; }
    if(bottom<top) {
        temp = top;
        top = bottom;
        bottom = temp;
        yrev = true;
    }

    // make an image that goes at most half a screen off either side, to keep time reasonable when you zoom in
    // if zsmooth is true/fast, don't worry about this, because zooming doesn't increase number of pixels
    // if zsmooth is best, don't include anything off screen because it takes too long
    if(!fastsmooth) {
        var extra = t.zsmooth=='best' ? 0 : 0.5;
        left = Math.max(-extra*gd.plotwidth,left);
        right = Math.min((1+extra)*gd.plotwidth,right);
        top = Math.max(-extra*gd.plotheight,top);
        bottom = Math.min((1+extra)*gd.plotheight,bottom);
    }

    var wd=Math.round(right-left);
    var ht=Math.round(bottom-top),htf=ht/(bottom-top);

    // now redraw
    if(wd<=0 || ht<=0) { return; } // image is entirely off-screen, we shouldn't even draw it

    var p = fastsmooth ? new PNGlib(n,m,256) : new PNGlib(wd,ht, 256);

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    var d = scl.map(function(si){ return si[0]*255; }),
        r = scl.map(function(si){ return si[1]; });

    s = d3.scale.linear()
        .domain(d)
        .interpolate(d3.interpolateRgb)
        .range(r);

    // map brick boundaries to image pixels
    var xpx,ypx;
    if(fastsmooth) {
        xpx = xrev ? function(index){ return n-1-index; } : Plotly.Lib.identity;
        ypx = yrev ? function(index){ return m-1-index; } : Plotly.Lib.identity;
    }
    else {
        xpx = function(index){ return Plotly.Lib.constrain(Math.round(xa.c2p(x[index])-left),0,wd); };
        ypx = function(index){ return Plotly.Lib.constrain(Math.round(ya.c2p(y[index])-top),0,ht); };
    }

    // get interpolated bin value. Returns {bin0:closest bin, frac:fractional dist to next, bin1:next bin}
    function findInterp(pixel,pixArray) {
        var maxbin = pixArray.length-2,
            bin = Plotly.Lib.constrain(Plotly.Lib.findBin(pixel,pixArray),0,maxbin),
            pix0 = pixArray[bin],
            pix1 = pixArray[bin+1],
            interp = Plotly.Lib.constrain(bin+(pixel-pix0)/(pix1-pix0)-0.5,0,maxbin),
            bin0 = Math.round(interp),
            frac = Math.abs(interp-bin0);
            if(!interp || interp==maxbin || !frac) { return {bin0:bin0, bin1:bin0, frac:0}; }
            return {bin0:bin0, frac:frac, bin1:Math.round(bin0+frac/(interp-bin0))};
    }

    // create a color in the png color table
    // save p.color and luminosity each time we calculate anew, because these are the slowest parts
    var colors = {};
    colors[256] = p.color(0,0,0,0); // non-numeric shows as transparent TODO: make this an option
    function setColor(v,pixsize) {
        if($.isNumeric(v)) {
            // get z-value, scale for 8-bit color by rounding z to an integer 0-254
            // (one value reserved for transparent (missing/non-numeric data)
            var vr = Plotly.Lib.constrain(Math.round((v-min)*254/(max-min)),0,254);
            c=s(vr);
            pixcount+=pixsize;
            if(!colors[vr]) {
                var c = s(vr);
                colors[vr] = [
                    tinycolor(c).toHsl().l,
                    p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2))
                ];
            }
            lumcount+=pixsize*colors[vr][0];
            return colors[vr][1];
        }
        else { return colors[256]; }
    }

    Plotly.Lib.markTime('done init png');
    // build the pixel map brick-by-brick
    // cruise through z-matrix row-by-row
    // build a brick at each z-matrix value
    var yi=ypx(0),yb=[yi,yi];
    var j,xi,c,pc,v,row;
    var xbi = xrev?0:1, ybi = yrev?0:1;
    var pixcount = 0, lumcount = 0; // for collecting an average luminosity of the heatmap
    if(t.zsmooth=='best') {
        //first make arrays of x and y pixel locations of brick boundaries
        var xPixArray = x.map(function(v){ return Math.round(xa.c2p(v)-left); }),
            yPixArray = y.map(function(v){ return Math.round(ya.c2p(v)-top); });
        // then make arrays of interpolations (bin0=closest, bin1=next, frac=fractional dist.)
        var xinterpArray = [], yinterpArray=[];
        for(i=0; i<wd; i++) { xinterpArray.push(findInterp(i,xPixArray)); }
        for(j=0; j<ht; j++) { yinterpArray.push(findInterp(j,yPixArray)); }
        // now do the interpolations and fill the png
        var xinterp, yinterp, r0, r1, z00, z10, z01, z11;
        for(j=0; j<ht; j++) {
            yinterp = yinterpArray[j];
            r0 = z[yinterp.bin0];
            r1 = z[yinterp.bin1];
            if(!r0 || !r1) { console.log(j,yinterp,z); }
            for(i=0; i<wd; i++) {
                xinterp = xinterpArray[i];
                z00 = r0[xinterp.bin0];
                if(!$.isNumeric(z00)) { pc = setColor(null,1); }
                else {
                    z01 = r0[xinterp.bin1];
                    z10 = r1[xinterp.bin0];
                    z11 = r1[xinterp.bin1];
                    if(!$.isNumeric(z01)) { z01 = z00; }
                    if(!$.isNumeric(z10)) { z10 = z00; }
                    if(!$.isNumeric(z11)) { z11 = z00; }
                    pc = setColor( z00 + xinterp.frac*(z01-z00) +
                        yinterp.frac*((z10-z00) + xinterp.frac*(z00+z11-z01-z10)) );
                }
                p.buffer[p.index(i,j)] = pc;
            }
        }
    }
    else if(fastsmooth) {
        for(j=0; j<m; j++) {
            row = z[j];
            yb = ypx(j);
            for(i=0; i<n; i++) {
                p.buffer[p.index(xpx(i),yb)] = setColor(row[i],1);
            }
        }
    }
    else {
        for(j=0; j<m; j++) {
            row = z[j];
            yb.reverse();
            yb[ybi] = ypx(j+1);
            if(yb[0]==yb[1] || yb[0]===undefined || yb[1]===undefined) { continue; }
            xi=xpx(0);
            xb=[xi,xi];
            for(i=0; i<n; i++) {
                // build one color brick!
                xb.reverse();
                xb[xbi] = xpx(i+1);
                if(xb[0]==xb[1] || xb[0]===undefined || xb[1]===undefined) { continue; }
                v=row[i];
                pc = setColor(v, (xb[1]-xb[0])*(yb[1]-yb[0]));
                for(xi=xb[0]; xi<xb[1]; xi++) {
                    for(yi=yb[0]; yi<yb[1]; yi++) {
                        p.buffer[p.index(xi, yi)] = pc;
                    }
                }
            }
        }
    }
    Plotly.Lib.markTime('done filling png');
    gd.hmpixcount = (gd.hmpixcount||0)+pixcount;
    gd.hmlumcount = (gd.hmlumcount||0)+lumcount;

    // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
    // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc
    var imgstr = "data:image/png;base64,\n" + p.getBase64();
    $(gd).find('.'+id).remove(); // put this right before making the new image, to minimize flicker
    gd.plot.append('svg:image')
        .classed(id,true)
        // .classed('pixelated',true) // we can hope pixelated works...
        .attr("xmlns","http://www.w3.org/2000/svg")
        .attr("xlink:xlink:href", imgstr) // odd d3 quirk, need namespace twice
        .attr("height",ht)
        .attr("width",wd)
        .attr("x",left)
        .attr("y",top)
        .attr('preserveAspectRatio','none');

    Plotly.Lib.markTime('done showing png');

    // show a colorscale
    $(gd).find('.'+cb_id).remove();
    if(t.showscale!==false){ insert_colorbar(gd,cd, cb_id, scl); }
    Plotly.Lib.markTime('done colorbar');
};

// in order to avoid unnecessary redraws, check for heatmaps with colorscales
// and expand right margin to fit
// TODO: let people control where this goes, ala legend
// TODO: also let it collapse again if the scale is removed
heatmap.margin = function(gd){
    var gl = gd.layout;
    if(gd.data && gd.data.length && gl.margin.r<200) {
        for(var curve in gd.data) {
            if(Plotly.Plots.isHeatmap(gd.data[curve].type) && (gd.data[curve].showscale!==false)) {
                gl.margin.r=200;
                return true;
            }
        }
    }
    return false;
};

// Return MAX and MIN of an array of arrays
function zmax(z){
    return Plotly.Lib.aggNums(Math.max,null,z.map(function(row){ return Plotly.Lib.aggNums(Math.max,null,row); }));
}

function zmin(z){
    return Plotly.Lib.aggNums(Math.min,null,z.map(function(row){ return Plotly.Lib.aggNums(Math.min,null,row); }));
}

// insert a colorbar
// TODO: control where this goes, styling
function insert_colorbar(gd,cd, cb_id, scl) {

    if(gd.layout.margin.r<200){ // shouldn't get here anymore... take care of this in newPlot
        console.log('warning: called relayout from insert_colorbar');
        Plotly.relayout(gd,'margin.r',200);
    }

    var min=cd[0].t.zmin,
        max=cd[0].t.zmax,
        // "colorbar domain" - interpolate numbers for colorscale
        d = scl.map(function(v){ return min+v[0]*(max-min); }),
        // "colorbar range" - colors in scl
        r = scl.map(function(v){ return v[1]; });

    //remove last colorbar, if any
    $(gd).find('.'+cb_id).remove();

    // until we harmonize this with our own axis format, do a quick cut between eng and floating formats
    var fmt = d3.format('3e');
    if(Math.max(Math.abs(min),Math.abs(max))<1e4) {
        if(Math.abs(max-min)>5) { fmt = d3.format('.0f'); }
        else if(Math.abs(max-min)>0.01) { fmt = d3.format('.2g'); }
    }

    var gl = gd.layout,
        g = gl._infolayer.append("g")
            .classed(cb_id,true)
            // TODO: colorbar spacing from plot (fixed at 50 right now)
            // should be a variable in gd.data and editable from a popover
            .attr("transform","translate("+(gl.width-gl.margin.r+50)+","+(gl.margin.t)+")")
            .classed("colorbar",true)
            .classed('crisp',true)
            .call(Plotly.Drawing.font,gl.font.family||'Arial',gl.font.size||12,gl.font.color||'#000'),
        cb = colorBar(gl)
            .color(d3.scale.linear().domain(d).range(r))
            .size(gl.height-gl.margin.t-gl.margin.b)
            .lineWidth(30)
            .tickFormat(fmt)
            .precision(2); // <-- gradient granularity TODO: should be a variable in colorbar popover

    g.call(cb);

    // fix styling - TODO: make colorbar styling configurable
    g.selectAll('.axis line, .axis .domain')
        .style('fill','none')
        .style('stroke','none');
}

function getScale(cd) {
    var scl = cd[0].t.scl;
    if(!scl) { return Plotly.defaultColorscale; }
    else if(typeof scl == 'string') {
        try { scl = Plotly.colorscales[scl] || JSON.parse(scl); }
        catch(e) { return Plotly.defaultColorscale; }
    }
    // occasionally scl is double-JSON encoded...
    if(typeof scl == 'string') {
        try { scl = Plotly.colorscales[scl] || JSON.parse(scl); }
        catch(e) { return Plotly.defaultColorscale; }
    }
    return scl;
}

}()); // end Heatmap object definition
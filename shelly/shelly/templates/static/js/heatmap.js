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
    // run makeCalcdata on x and y even for heatmaps, in case of category mappings
    Plotly.Lib.markTime('start convert x&y');
    var xa = Plotly.Axes.getFromId(gd,gdc.xaxis||'x'),
        ya = Plotly.Axes.getFromId(gd,gdc.yaxis||'y'),
        x = gdc.x ? xa.makeCalcdata(gdc,'x') : [],
        x0, dx,
        y = gdc.y ? ya.makeCalcdata(gdc,'y') : [],
        y0, dy,
        z,
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
        var onecol = [], zerocol = [],
            xbins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.xbins,
            ybins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.ybins,
            total = 0,n,m,cnt=[],
            norm = gdc.histnorm||'',
            func = gdc.histfunc||'',
            densitynorm = (norm.indexOf('density')!=-1),
            extremefunc = (func=='max' || func=='min'),
            sizeinit = (extremefunc ? null : 0),
            binfunc = function(m,n) { z[m][n]++; total++; },
            normfunc = null,
            doavg = false,
            xinc, yinc;

        // set a binning function other than count?
        // for binning functions: check first for 'z', then 'mc' in case we had a colored scatter plot
        // and want to transfer these colors to the 2D histo
        // TODO: this is why we need a data picker in the popover...
        var counterdata = ('z' in gdc) ? gdc.z : (('marker' in gdc && $.isArray(gdc.marker.color)) ? gdc.marker.color : '');
        if(counterdata && ['sum','avg','min','max'].indexOf(func)!=-1) {
            var counter0 = counterdata.map(Number);
            if(func=='sum') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        z[m][n]+=v;
                        total+=v;
                    }
                };
            }
            else if(func=='avg') {
                doavg = true;
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        z[m][n]+=v;
                        cnt[m][n]++;
                    }
                };
            }
            else if(func=='min') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(z[m][n])) { total+=v; z[m][n] = v; }
                        else if(z[m][n]>v) { total+=v-z[m][n]; z[m][n] = v; }
                    }
                };
            }
            else if(func=='max') {
                binfunc = function(m,n,i) {
                    var v = counter0[i];
                    if($.isNumeric(v)) {
                        if(!$.isNumeric(z[m][n])) { total+=v; z[m][n] = v; }
                        else if(z[m][n]<v) { total+=v-z[m][n]; z[m][n] = v; }
                    }
                };
            }
        }

        // set a normalization function?
        if(norm.indexOf('probability')!=-1 || norm.indexOf('percent')!=-1) {
            normfunc = densitynorm ?
                function(m,n) { z[m][n]*=xinc[n]*yinc[m]/total; } :
                function(m,n) { z[m][n]/=total; };
        }
        else if(densitynorm) {
            normfunc = function(m,n) { z[m][n]*=xinc[n]*yinc[m]; };
        }


        for(i=gdc.xbins.start; i<gdc.xbins.end; i=Plotly.Axes.tickIncrement(i,gdc.xbins.size)) {
            onecol.push(sizeinit);
            if($.isArray(xbins)) { xbins.push(i); }
            if(doavg) { zerocol.push(0); }
        }
        if($.isArray(xbins)) { xbins.push(i); }

        var nx = onecol.length;
        x0 = gdc.xbins.start;
        dx = (i-x0)/nx;
        x0+=dx/2;

        for(i=gdc.ybins.start; i<gdc.ybins.end; i=Plotly.Axes.tickIncrement(i,gdc.ybins.size)) {
            z.push(onecol.concat());
            if($.isArray(ybins)) { ybins.push(i); }
            if(doavg) { cnt.push(zerocol.concat()); }
        }
        if($.isArray(ybins)) { ybins.push(i); }

        var ny = z.length;
        y0 = gdc.ybins.start;
        dy = (i-y0)/ny;
        y0+=dy/2;

        if(densitynorm) {
            xinc = onecol.map(function(v,i){
                if(norm.indexOf('density')==-1) { return 1; }
                else if($.isArray(xbins)) { return 1/(xbins[i+1]-xbins[i]); }
                else { return 1/dx; }
            });
            yinc = z.map(function(v,i){
                if(norm.indexOf('density')==-1) { return 1; }
                else if($.isArray(ybins)) { return 1/(ybins[i+1]-ybins[i]); }
                else { return 1/dy; }
            });
        }


        Plotly.Lib.markTime('done making bins');
        // put data into bins
        for(i=0; i<serieslen; i++) {
            n = Plotly.Lib.findBin(x[i],xbins);
            m = Plotly.Lib.findBin(y[i],ybins);
            if(n>=0 && n<nx && m>=0 && m<ny) { binfunc(m,n,i); }
        }
        // normalize, if needed
        if(doavg) {
            for(n=0; n<nx; n++) { for(m=0; m<ny; m++) {
                if(cnt[m][n]>0) { z[m][n]/=cnt[m][n]; total+=z[m][n]; }
                else { z[m][n] = null; }
            }}
        }
        if(norm.indexOf('percent')!=-1) { total/=100; }
        if(normfunc) {
            for(n=0; n<nx; n++) { for(m=0; m<ny; m++) {
                if($.isNumeric(z[m][n])) { normfunc(m,n); }
            }}
        }
        Plotly.Lib.markTime('done binning');
    }
    else {
        x0 = gdc.x0||0;
        dx = gdc.dx||1;
        y0 = gdc.y0||0;
        dy = gdc.dy||1;
        z = gdc.z.map(function(row){return row.map(Number); });
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
    if(gdc.zauto!==false || !('zmin' in gdc)) { gdc.zmin = Plotly.Lib.aggNums(Math.min,null,z); }
    if(gdc.zauto!==false || !('zmax' in gdc)) { gdc.zmax = Plotly.Lib.aggNums(Math.max,null,z); }
    if(gdc.zmin==gdc.zmax) { gdc.zmin-=0.5; gdc.zmax+=0.5; }

    // create arrays of brick boundaries, to be used by autorange and heatmap.plot
    var x_in = gdc.xtype=='scaled' ? '' : gdc.x,
        xArray = makeBoundArray(gdc.type, x_in, x0, dx, z[0].length, gd.layout.xaxis),
        y_in = gdc.ytype=='scaled' ? '' : gdc.y,
        yArray = makeBoundArray(gdc.type, y_in, y0, dy, z.length, gd.layout.yaxis);
    Plotly.Axes.expand(xa,xArray);
    Plotly.Axes.expand(ya,yArray);

    var cd = {x:xArray, y:yArray, z:z};
    if(gdc.type=='contour' && gdc.contourcoloring=='heatmap') {
        cd.xfill = makeBoundArray('heatmap', x_in, x0, dx, z[0].length, gd.layout.xaxis);
        cd.yfill = makeBoundArray('heatmap', y_in, y0, dy, z.length, gd.layout.yaxis);
    }

    // for contours: check if we need to auto-choose contour levels
    if(gdc.type=='contour' && (gdc.autocontour!==false || !gdc.contours ||
            !$.isNumeric(gdc.contours.start) || !$.isNumeric(gdc.contours.end) || !$.isNumeric(gdc.contours.size))) {
        var dummyAx = {type:'linear', range:[gdc.zmin,gdc.zmax]};
        Plotly.Axes.autoTicks(dummyAx,(gdc.zmax-gdc.zmin)/15);
        gdc.contours = {start: Plotly.Axes.tickFirst(dummyAx), size: dummyAx.dtick};
        dummyAx.range.reverse();
        gdc.contours.end = Plotly.Axes.tickFirst(dummyAx);
        if(gdc.contours.start==gdc.zmin) { gdc.contours.start+=gdc.contours.size; }
        if(gdc.contours.end==gdc.zmax) { gdc.contours.end-=gdc.contours.size; }
        gdc.contours.end+=gdc.contours.size/10; // so rounding errors don't cause us to miss the last contour
    }

    // this is gd.calcdata for the heatmap (other attributes get added by setStyles)
    return [cd];
};

function makeBoundArray(type,array_in,v0_in,dv_in,numbricks,ax) {
    var array_out = [], v0, dv, i;
    if($.isArray(array_in) && (type!='histogram2d') && (ax.type!='category')) {
        array_in = array_in.map(ax.d2c);
        var len = array_in.length;
        if(len==numbricks) { // given vals are brick centers
            // contour plots only want the centers
            if(type=='contour') { return array_in.slice(0,numbricks); }
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
        else { v0 = ax.d2c(v0_in); }
        if(type=='contour') {
            for(i=0; i<numbricks; i++) { array_out.push(v0+dv*i); }
        }
        else {
            for(i=0; i<=numbricks; i++) { array_out.push(v0+dv*(i-0.5)); }
        }
    }
    return array_out;
}

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Example usage:
// plot(gd, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}])
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
heatmap.plot = function(gd,plotinfo,cd) {
    Plotly.Lib.markTime('in Heatmap.plot');
    var t = cd[0].t,
        i = t.curve,
        xa = plotinfo.x,
        ya = plotinfo.y,
        gl = gd.layout;

    var id='hm'+i; // heatmap id
    var cb_id='cb'+i; // colorbar id

    gl._paper.selectAll('.contour'+i).remove(); // in case this used to be a contour map

    if(t.visible===false) {
        gl._paper.selectAll('.'+id).remove();
        gl._paper.selectAll('.'+cb_id).remove();
        return;
    }

    var z=cd[0].z, min=t.zmin, max=t.zmax, scl=Plotly.Plots.getScale(t.scl), x=cd[0].x, y=cd[0].y;
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
    i=0; while(left===undefined && i<x.length-1) { left=xa.c2p(x[i]); i++; }
    i=x.length-1; while(right===undefined && i>0) { right=xa.c2p(x[i]); i--; }
    if(right<left) {
        temp = right;
        right = left;
        left = temp;
        xrev = true;
    }

    var yrev = false, top, bottom;
    i=0; while(top===undefined && i<y.length-1) { top=ya.c2p(y[i]); i++; }
    i=y.length-1; while(bottom===undefined && i>0) { bottom=ya.c2p(y[i]); i--; }
    if(bottom<top) {
        temp = top;
        top = bottom;
        bottom = temp;
        yrev = true;
    }

    if(t.type=='contour') { // for contours with heatmap fill, we generate the boundaries based on brick centers but then use the brick edges for drawing the bricks
        x = cd[0].xfill;    // TODO: for 'best' smoothing, we really should use the given brick centers as well as brick bounds in calculating values, in case of nonuniform brick sizes
        y = cd[0].yfill;
    }

    // make an image that goes at most half a screen off either side, to keep time reasonable when you zoom in
    // if zsmooth is true/fast, don't worry about this, because zooming doesn't increase number of pixels
    // if zsmooth is best, don't include anything off screen because it takes too long
    if(!fastsmooth) {
        var extra = t.zsmooth=='best' ? 0 : 0.5;
        left = Math.max(-extra*xa._length,left);
        right = Math.min((1+extra)*xa._length,right);
        top = Math.max(-extra*ya._length,top);
        bottom = Math.min((1+extra)*ya._length,bottom);
    }

    var wd=Math.round(right-left);
    var ht=Math.round(bottom-top),htf=ht/(bottom-top);

    // now redraw
    if(wd<=0 || ht<=0) { return; } // image is entirely off-screen, we shouldn't even draw it

    var p = fastsmooth ? new PNGlib(n,m,256) : new PNGlib(wd,ht, 256);

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    var s = d3.scale.linear()
        .domain(scl.map(function(si){ return si[0]*255; }))
        .interpolate(d3.interpolateRgb)
        .range(scl.map(function(si){ return si[1]; }));

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
    gl._paper.selectAll('.'+id).remove(); // put this right before making the new image, to minimize flicker
    plotinfo.plot.append('svg:image')
        .classed(id,true)
        .datum(cd[0])
        // .classed('pixelated',true) // we can hope pixelated works...
        .attr({
            xmlns:"http://www.w3.org/2000/svg",
            "xlink:xlink:href":imgstr, // odd d3 quirk, need namespace twice
            height:ht,
            width:wd,
            x:left,
            y:top,
            preserveAspectRatio:'none'});

    Plotly.Lib.markTime('done showing png');

    // show a colorscale
    gl._infolayer.selectAll('.'+cb_id).remove();
    if(t.showscale!==false){ heatmap.insert_colorbar(gd,cd, cb_id, scl); }
    Plotly.Lib.markTime('done colorbar');
};

heatmap.style = function(s) {
    s.style('opacity',function(d){ return d.t.op; });
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

// insert a colorbar
// TODO: control where this goes, styling
heatmap.insert_colorbar = function(gd,cd, cb_id, scl) {

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
        if(Math.abs(max-min)>20/3) { fmt = d3.format('.0f'); }
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
        cb = colorBar()
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
};

heatmap.colorbar = function(td,id) {
    var opts = {
        // left, right, top, bottom: which side are the labels on (so left and right make vertical bars, etc.)
        orient:'right',
        // positioning is now all as a fraction of the plot size
        // the size in the constant color direction
        thickness:0.07,
        // the total size in the color variation direction
        length:1,
        // x,y position of the bar center (not including labels)
        center:[1.1,0.5],
        // d3 scale, domain is z values, range is colors, for the fills - leave out for no fill
        fillcolor:null,
        // same for contour line colors - leave out for no contour lines
        linecolor:null,
        linewidth:null,
        linedash:'',
        // object of {start,size,end} levels to draw.
        // fillcolors will be evaluated halfway between levels
        levels:{start:0,size:1,end:10}
    };

    function component(){
        var gl = td.layout,
            zrange = d3.extent((opts.fillcolor||opts.linecolor).domain()),
            linelevels = [],
            linecolormap = typeof opts.linecolor=='function' ? opts.linecolor : function(v){ return opts.linecolor; };
        for(var l=opts.levels.start; (l-opts.levels.end-opts.levels.size/100)*opts.levels.size<0; l+=opts.levels.size) {
            if(l>zrange[0] && l<zrange[1]) { linelevels.push(l); }
        }
        var filllevels = linelevels.map(function(v){ return v-opts.levels.size/2; });
        filllevels.push(filllevels[filllevels.length-1]+opts.levels.size);
        if(opts.levels.size<0) { linelevels.reverse(); filllevels.reverse(); }

        // now make a Plotly Axes object to scale with and draw ticks
        // TODO: does not support orientation other than right
        var xrange = [opts.center[0]-opts.thickness/2,opts.center[0]+opts.thickness/2];
        var cbAxis = Plotly.Axes.defaultAxis({
            type: 'linear',
            range: zrange,
            anchor: 'free',
            position: xrange[1],
            domain: [opts.center[1]-opts.length/2,opts.center[1]+opts.length/2],
            _id: 'y'+id
        });
        Plotly.Axes.initAxis(td,cbAxis);
        Plotly.Axes.setConvert(cbAxis);
        cbAxis.setScale();
        var xpx = xrange.map(function(v){ return v*gl._size.w; });

        // now draw the elements
        var container = gl._infolayer.selectAll('g.'+id).data([0]);
        container.enter().append('g').classed(id,true).classed('crisp',true)
            .each(function(){
                d3.select(this).append('g').classed('cbfills',true);
                d3.select(this).append('g').classed('cblines',true);
            });
        container.attr('transform','translate('+gl._size.l+','+gl._size.t+')');

        var fills = container.select('.cbfills').selectAll('rect.cbfill').data(opts.fillcolor ? filllevels : []);
        fills.enter().append('rect').classed('cbfill',true);
        fills.exit().remove();
        fills.each(function(d,i) {
            var z = [(i===0) ? zrange[0] : linelevels[i-1],
                    (i==filllevels.length-1) ? zrange[1] : linelevels[i]].map(cbAxis.c2p);
            d3.select(this).attr({
                x: d3.min(xpx),
                width: d3.max(xpx)-d3.min(xpx),
                y: d3.min(z),
                height: d3.max(z)-d3.min(z)
            })
            .style({
                fill:opts.fillcolor(d),
                stroke:'none'
            });
        });

        var lines = container.select('.cblines').selectAll('path.cbline').data(opts.linecolor ? linelevels : []);
        lines.enter().append('path').classed('cbline',true);
        lines.exit().remove();
        lines.each(function(d,i) {
            d3.select(this)
                .attr('d','M'+xpx[0]+','+(Math.floor(cbAxis.c2p(d))+(opts.linewidth/2)%1)+'H'+xpx[1])
                .call(Plotly.Drawing.lineGroupStyle, opts.linewidth, linecolormap(i), opts.linedash);
        });
        console.log(cbAxis);
        Plotly.Axes.doTicks(td,cbAxis);
    }

    // setter/getters for every item defined in opts
    Object.keys(opts).forEach(function (name) {
        component[name] = function(v) {
            if(!arguments.length) { return opts[name]; }
            opts[name] = v;
            return component;
        };
    });

    return component;
};

}()); // end Heatmap object definition
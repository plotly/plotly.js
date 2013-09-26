(function() {
var heatmap = window.Plotly.Heatmap = {};

// option to limit number of pixels per color brick, for better speed
// also, Firefox and IE seem to allow nearest-neighbor scaling, so could set to 1?
// zero or other falsy val disables
MAX_PX_PER_BRICK=0;

heatmap.defaultScale = [[0,"rgb(8, 29, 88)"],[0.125,"rgb(37, 52, 148)"],[0.25,"rgb(34, 94, 168)"],
    [0.375,"rgb(29, 145, 192)"],[0.5,"rgb(65, 182, 196)"],[0.625,"rgb(127, 205, 187)"],
    [0.75,"rgb(199, 233, 180)"],[0.875,"rgb(237, 248, 217)"],[1,"rgb(255, 255, 217)"]];

heatmap.calc = function(gd,gdc) {
    // calcdata ("cd") for heatmaps:
    // curve: index of heatmap in gd.data
    // type: used to distinguish heatmaps from traces in "Data" popover
    if(gdc.visible===false) { return; }
    // prepare the raw data
    // run convertOne even for heatmaps, in case of category mappings
    Plotly.Lib.markTime('start convert data');
    var xa = gd.layout.xaxis,
        x = gdc.x ? Plotly.Axes.convertOne(gdc,'x',xa) : [];
    Plotly.Lib.markTime('done convert x');
    var ya = gd.layout.yaxis,
        y = gdc.y ? Plotly.Axes.convertOne(gdc,'y',ya) : [];
    Plotly.Lib.markTime('done convert y');
    var i;
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
        gdc.z = [];
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
        gdc.x0 = gdc.xbins.start;
        gdc.dx = (i-gdc.x0)/nx;
        gdc.x0+=gdc.dx/2;
        var xinc = onecol.map(function(v,i){
            if(norm.indexOf('density')==-1) { return 1; }
            else if($.isArray(xbins)) { return 1/(xbins[i+1]-xbins[i]); }
            else { return 1/gdc.dx; }
        });

        for(i=gdc.ybins.start; i<gdc.ybins.end; i=Plotly.Axes.tickIncrement(i,gdc.ybins.size)) {
            gdc.z.push(onecol.concat());
            if($.isArray(ybins)) { ybins.push(i); }
        }
        if($.isArray(ybins)) { ybins.push(i); }

        var ny = gdc.z.length;
        gdc.y0 = gdc.ybins.start;
        gdc.dy = (i-gdc.y0)/ny;
        gdc.y0+=gdc.dy/2;
        var yinc = gdc.z.map(function(v,i){
            if(norm.indexOf('density')==-1) { return 1; }
            else if($.isArray(ybins)) { return 1/(ybins[i+1]-ybins[i]); }
            else { return 1/gdc.dy; }
        });

        Plotly.Lib.markTime('done making bins');
        // put data into bins
        var count = 0;
        for(i=0; i<serieslen; i++) {
            var n = Plotly.Lib.findBin(x[i],xbins),
                m = Plotly.Lib.findBin(y[i],ybins);
            if(n>=0 && n<nx && m>=0 && m<ny) { gdc.z[m][n]+=xinc[n]*yinc[m]; count++; }
        }
        if(norm.indexOf('percent')!=-1) { count/=100; }
        if(norm.indexOf('probability')!=-1 || norm.indexOf('percent')!=-1) {
            gdc.z.forEach(function(col){ col.forEach(function(v,i){
                col[i]/=count;
            }); });
        }
        Plotly.Lib.markTime('done binning');

        // make the rest of the heatmap info
        if(gdc.zauto!==false) {
            gdc.zmin=zmin(gdc.z);
            gdc.zmax=zmax(gdc.z);
        }
        if(!( 'scl' in gdc )){ gdc.scl=heatmap.defaultScale; }
    }
    var coords = get_xy(gd,gdc);
    Plotly.Axes.expandBounds(xa,xa._tight,coords.x);
    Plotly.Axes.expandBounds(ya,ya._tight,coords.y);
    // store x and y arrays for later... heatmap function pulls out the
    // actual data directly from gd.data. TODO: switch to a reference in cd
    return [{t:coords}];
};

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Params are index of heatmap data object in gd.data, and the heatmap data object itself
// gdc ("graph div curve") = data object for a single heatmap
// cd "calcdata" - contains styling information
// Example usage:
// plot(gd, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}])
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
heatmap.plot = function(gd,cd) {
    Plotly.Lib.markTime('in Heatmap.plot');
    var t = cd[0].t,
        i = t.curve,
        gdc = gd.data[i],
        xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;
    // Set any missing keys to defaults
    // note: gdc.x (same for gdc.y) will override gdc.x0,dx if it exists and is the right size
    // should be an n+1 long array, containing all the pixel edges
    setDefaults(gdc);
    var z=gdc.z, min=gdc.zmin, max=gdc.zmax, scl=gdc.scl, x=t.x, y=t.y;
    gdc.hm_id='hm'+i; // heatmap id
    var cb_id='cb'+i; // colorbar id
    var id=gdc.hm_id;

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
    left = Math.max(-0.5*gd.plotwidth,left);
    right = Math.min(1.5*gd.plotwidth,right);

    var yrev = false, top, bottom;
    i=0; while(top===undefined && i<n) { top=ya.c2p(y[i]); i++; }
    i=m; while(bottom===undefined && i>0) { bottom=ya.c2p(y[i]); i--; }
    if(bottom<top) {
        temp = top;
        top = bottom;
        bottom = temp;
        yrev = true;
    }
    top = Math.max(-0.5*gd.plotheight,top);
    bottom = Math.min(1.5*gd.plotheight,bottom);

    // make an image with max plotwidth*plotheight pixels, to keep time reasonable when you zoom in
    var wd=Math.round(right-left);
    var ht=Math.round(bottom-top),htf=ht/(bottom-top);

    // now redraw
    if(wd<=0 || ht<=0) { return; } // image is so far off-screen, we shouldn't even draw it

    var p = new PNGlib(wd,ht, 256);

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    if (typeof(scl)=="string") scl=eval(scl); // <-- convert colorscale string to array
    var d = scl.map(function(si){ return si[0]*255; }),
        r = scl.map(function(si){ return si[1]; });

    s = d3.scale.linear()
        .domain(d)
        .interpolate(d3.interpolateRgb)
        .range(r);

    // map brick boundaries to image pixels
    function xpx(v){ return Math.max(0,Math.min(wd,Math.round(xa.c2p(v)-left))); }
    function ypx(v){ return Math.max(0,Math.min(ht,Math.round(ya.c2p(v)-top))); }
    Plotly.Lib.markTime('done init png');
    // build the pixel map brick-by-brick
    // cruise through z-matrix row-by-row
    // build a brick at each z-matrix value
    var yi=ypx(y[0]),yb=[yi,yi];
    var j,xi,c,pc,v;
    var xbi = xrev?0:1, ybi = yrev?0:1;
    var pixcount = 0, lumcount = 0; // for collecting an average luminosity of the heatmap
    for(j=0; j<m; j++) {
        col = z[j];
        yb.reverse();
        yb[ybi] = ypx(y[j+1]);
        if(yb[0]==yb[1] || yb[0]===undefined || yb[1]===undefined) { continue; }
        xi=xpx(x[0]);
        xb=[xi,xi];
        for(i=0; i<n; i++) {
            // build one color brick!
            v=col[i];
            xb.reverse();
            xb[xbi] = xpx(x[i+1]);
            if(xb[0]==xb[1] || xb[0]===undefined || xb[1]===undefined) { continue; }
            if($.isNumeric(v)) {
                // get z-value, scale for 8-bit color by rounding z to an integer 0-254
                // (one value reserved for transparent (missing/non-numeric data)
                c=s(Math.round((v-min)*255/(max-min)));
                pc = p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2));
                var pix = (xb[1]-xb[0])*(yb[1]-yb[0]);
                pixcount+=pix;
                lumcount+=pix*tinycolor(c).toHsl().l;
            }
            else { pc = p.color(0,0,0,0); } // non-numeric shows as transparent TODO: make this an option
            for(xi=xb[0]; xi<xb[1]; xi++) { // TODO: Make brick spacing editable (ie x=1)
                for(yi=yb[0]; yi<yb[1]; yi++) { // TODO: Make brick spacing editable
                    p.buffer[p.index(xi, yi)] = pc;
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
        .classed('pixelated',true) // we can hope pixelated works...
        .attr("xmlns","http://www.w3.org/2000/svg")
        .attr("xlink:href", imgstr)
        .attr("height",ht)
        .attr("width",wd)
        .attr("x",left)
        .attr("y",top)
        .attr('preserveAspectRatio','none');

    $('svg > image').parent().attr("xmlns:xlink","http://www.w3.org/1999/xlink");
    Plotly.Lib.markTime('done showing png');

    // show a colorscale
    if(gdc.showscale!==false){ insert_colorbar(gd,gdc,cb_id); }
    Plotly.Lib.markTime('done colorbar');
};

// in order to avoid unnecessary redraws, check for heatmaps with colorscales
// and expand right margin to fit
// TODO: let people control where this goes, ala legend
heatmap.margin = function(gd){
    var gl = gd.layout;
    if(gd.data && gd.data.length && gl.margin.r<200) {
        for(var curve in gd.data) {
            if((Plotly.Plots.HEATMAPTYPES.indexOf(gd.data[curve].type)!=-1) && (gd.data[curve].showscale!==false)) {
                gl.margin.r=200;
                return true;
            }
        }
    }
    return false;
};

// get_xy: returns the brick edge coordinates of a heatmap as { x:[x0,x1,...], y:[y0,y1...] }
// we're returning all of them now so we can handle log heatmaps that go negative
function get_xy(gd,gdc){
    // Set any missing keys to defaults
    setDefaults(gdc,true);

    function makeBoundArray(array_in,v0_in,dv_in,numbricks,ax) {
        var array_out = [], v0, dv, i;
        if($.isArray(array_in) && (gdc.type!='histogram2d') && (ax.type!='category')) {
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
            else if(gdc.type=='histogram2d' || ax.type=='category') {
                v0 = v0_in;
            }
            else { v0 = Plotly.Axes.convertToNums(v0_in,ax); }
            for(i=0; i<=numbricks; i++) { array_out.push(v0+dv*(i-0.5)); }
        }
        return array_out;
    }

    return {x:makeBoundArray(gdc.x,gdc.x0,gdc.dx,gdc.z[0].length,gd.layout.xaxis),
            y:makeBoundArray(gdc.y,gdc.y0,gdc.dy,gdc.z.length,gd.layout.yaxis)};
}

// if the heatmap data object is missing any keys, fill them in
// keys expected in gdc:
// z = 2D array of z values
// x0 = middle of first color brick in x (on plotly's x-axis)
// dx = brick size in x (on plotly's x-axis)
// same for y0, dy
// z0 = minimum of colorscale
// z1 = maximum of colorscale
function setDefaults(gdc,noZRange){
    if(!( 'z' in gdc )){ gdc.z=[[0,0],[0,0]]; }
    if(!( 'x0' in gdc )){ gdc.x0=0; }
    if(!( 'y0' in gdc )){ gdc.y0=0; }
    if(!( 'dx' in gdc )){ gdc.dx=1; }
    if(!( 'dy' in gdc )){ gdc.dy=1; }
    if(!( 'zauto' in gdc)){ gdc.zauto=true; }
    if(!noZRange) { // can take a long time... only do once
        if(!('zmin' in gdc) || gdc.zauto!==false){ gdc.zmin=zmin(gdc.z); }
        if(!('zmax' in gdc) || gdc.zauto!==false){ gdc.zmax=zmax(gdc.z); }
        if(gdc.zmin==gdc.zmax) { gdc.zmin-=0.5; gdc.zmax+=0.5; }
    }
    if(!( 'scl' in gdc )){ gdc.scl=heatmap.defaultScale; }
}

// Return MAX and MIN of an array of arrays
function zmax(z){
    return Plotly.Lib.aggNums(Math.max,null,z.map(function(row){ return Plotly.Lib.aggNums(Math.max,null,row); }));
}

function zmin(z){
    return Plotly.Lib.aggNums(Math.min,null,z.map(function(row){ return Plotly.Lib.aggNums(Math.min,null,row); }));
}

// insert a colorbar
// TODO: control where this goes, styling
function insert_colorbar(gd,gdc,cb_id) {

    if(gd.layout.margin.r<200){ // shouldn't get here anymore... take care of this in newPlot
        console.log('warning: called relayout from insert_colorbar');
        Plotly.relayout(gd,'margin.r',200);
    }

    var scl=gdc.scl;
    if (typeof(scl)=="string") scl=eval(scl); // <-- convert colorscale string to array
    var min=gdc.zmin, max=gdc.zmax, // "colorbar domain" - interpolate numbers for colorscale
        d = scl.map(function(v){ return min+v[0]*(max-min); }),
        // "colorbar range" - colors in gdc.colorscale
        r = scl.map(function(v){ return v[1]; });
//     for(var i=0; i<scl.length; i++){ d.push( min+(scl[i][0]*(max-min)) ); }
//     var r=[];
//     for(var i=0; i<scl.length; i++){ r.push( scl[i][1] ); }

    //remove last colorbar, if any
    $(gd).find('.'+cb_id).remove();

    var gl = gd.layout,
        g = gd.infolayer.append("g")
            .classed(cb_id,true)
            // TODO: colorbar spacing from plot (fixed at 50 right now)
            // should be a variable in gd.data and editable from a popover
            .attr("transform","translate("+(gl.width-gl.margin.r+50)+","+(gl.margin.t)+")")
            .classed("colorbar",true),
        cb = colorBar().color(d3.scale.linear()
            .domain(d)
            .range(r))
            .size(gl.height-gl.margin.t-gl.margin.b)
            .lineWidth(30)
            .precision(2); // <-- gradient granularity TODO: should be a variable in colorbar popover

    g.call(cb);
}

}()); // end Heatmap object definition
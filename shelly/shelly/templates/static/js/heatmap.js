// option to limit number of pixels per color brick, for better speed
// also, Firefox and IE seem to allow nearest-neighbor scaling, so could set to 1?
// zero or other falsy val disables
MAX_PX_PER_BRICK=0;

// returns the brick edge coordinates of a heatmap as { x:[x0,x1,...], y:[y0,y1...] }
// we're returning all of them now so we can handle log heatmaps that go negative
function heatmap_xy(gd,gdc){
    // Set any missing keys to defaults
    default_hm(gdc,true);
    var y = gdc.y,
        m = gdc.z.length, // num rows
        ya = gd.layout.yaxis;
    if($.isArray(y) && (y.length==m+1) && (gdc.type!='histogram2d') && (ya.type!='category')) {
        y = convertToAxis(y,ya);
        console.log('yarr',y);
    }
    else {
        y=[];
        var y0 = (typeof(gdc.y0)=='number') ?
            gdc.y0 : convertToAxis(gdc.y0,ya);
        for(var i=0; i<=m; i++) { y.push(y0+gdc.dy*(i-0.5)) }
        console.log('y',y);
    }
    var x = gdc.x,
        n = gdc.z[0].length, // num cols
        xa = gd.layout.xaxis;
    if($.isArray(x) && (x.length!=n+1) && (gdc.type!='histogram2d') && (xa.type!='category')) {
        x = convertToAxis(x,xa);
        console.log('xarr',x);
    }
    else {
        x=[];
        var x0 = (typeof(gdc.x0)=='number') ?
            gdc.x0 : convertToAxis(gdc.x0,xa);
        for(var i=0; i<=n; i++) { x.push(x0+gdc.dx*(i-0.5)) }
        console.log('x',x);
    }
    return {x:x,y:y};
}

// if the heatmap data object is missing any keys, fill them in
// keys expected in gdc:
// z = 2D array of z values
// x0 = middle of first color brick in x (on plotly's x-axis)
// dx = brick size in x (on plotly's x-axis)
// same for y0, dy
// z0 = minimum of colorscale
// z1 = maximum of colorscale
function default_hm(gdc,noZRange){
    if(!( 'z' in gdc )){ gdc.z=[[0,0],[0,0]] }
    if(!( 'x0' in gdc )){ gdc.x0=0 }
    if(!( 'y0' in gdc )){ gdc.y0=0 }
    if(!( 'dx' in gdc )){ gdc.dx=1 }
    if(!( 'dy' in gdc )){ gdc.dy=1 }
    if(!( 'zauto' in gdc)){ gdc.zauto=true }
    if(!noZRange) { // can take a long time... only do once
        if(!( 'zmin' in gdc )||(!(gdc.zauto==false))){ gdc.zmin=zmin(gdc.z) }
        if(!( 'zmax' in gdc )||(!(gdc.zauto==false))){ gdc.zmax=zmax(gdc.z) }
        if(gdc.zmin==gdc.zmax) { gdc.zmin-=0.5; gdc.zmax+=0.5 }
    }
    if(!( 'scl' in gdc )){ gdc.scl=defaultScale }
}

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Params are index of heatmap data object in gd.data, and the heatmap data object itself
// gdc ("graph div curve") = data object for a single heatmap
// cd "calcdata" - contains styling information
// Example usage:
// plot( gettab().id, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}] )
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
function heatmap(cd,rdrw,gd){
    var t = cd[0].t,
        i = t.curve,
        gdc = gd.data[i],
        xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;
    // Set any missing keys to defaults
    // note: gdc.x (same for gdc.y) will override gdc.x0,dx if it exists and is the right size
    // should be an n+1 long array, containing all the pixel edges
    default_hm(gdc);
    var z=gdc.z, min=gdc.zmin, max=gdc.zmax, scl=gdc.scl,
        x0=gdc.x0, dx=gdc.dx, x=t.x,
        y0=gdc.y0, dy=gdc.dy, y=t.y;
    // console.log(min,max);
    // if this is the first time drawing the heatmap and it has never been saved it won't have an id
    // TODO! If 2 heat maps are loaded from different files, they could have the same id
    if( !('hm_id' in gdc) ){ gdc.hm_id=gd.id+'-hm'+i; } // heatmap id
    if( !('cb_id' in gdc) ){ var cb_id=gd.id+'-cb'+i; } // colorbar id
    var id=gdc.hm_id;
    //console.log('heatmap id: '+id);

    // get z dims
    var m=z.length, n=z[0].length; // num rows, cols
    // TODO: if there are multiple overlapping categorical heatmaps,
    // or if we allow category sorting, then the categories may not be
    // sequential... may need to reorder and/or expand z

    // Get edges of png in pixels (xf() maps axes coordinates to pixel coordinates)
    // figure out if either axis is reversed (y is usually reversed, in pixel coords)
    // also clip the image to maximum 50% outside the visible plot area
    // bigger image lets you pan more naturally, but slows performance.
    // TODO: use low-resolution images outside the visible plot for panning
    var xrev = false, left=undefined, right=undefined;
    // these while loops find the first and last brick bounds that are defined (in case of log of a negative)
    i=0; while(left===undefined && i<n) { left=xf({x:x[i]},gd); i++ }
    i=n; while(right===undefined && i>0) { right=xf({x:x[i]},gd); i-- }
    if(right<left) {
        var temp = right;
        right = left;
        left = temp;
        xrev = true;
    }
    left = Math.max(-0.5*gd.plotwidth,left);
    right = Math.min(1.5*gd.plotwidth,right);

    var yrev = false, top=undefined, bottom=undefined;
    i=0; while(top===undefined && i<n) { top=yf({y:y[i]},gd); i++ }
    i=m; while(bottom===undefined && i>0) { bottom=yf({y:y[i]},gd); i-- }
    if(bottom<top) {
        var temp = top;
        top = bottom;
        bottom = temp;
        yrev = true;
    }
    top = Math.max(-0.5*gd.plotheight,top);
    bottom = Math.min(1.5*gd.plotheight,bottom);

    // make an image with max plotwidth*plotheight pixels, to keep time reasonable when you zoom in
    var wd=Math.round(right-left);
    var ht=Math.round(bottom-top),htf=ht/(bottom-top);

//     var dx_px=wd/n;
//     var dy_px=ht/m;
//
//     // option to change the number of pixels per brick
//     if(MAX_PX_PER_BRICK>0) {
//         dx_px=Math.min(MAX_PX_PER_BRICK,dx_px);
//         dy_px=Math.min(MAX_PX_PER_BRICK,dy_px);
//     }
//
//     function closeEnough(oldpx,newpx) {
//         if(oldpx<newpx/2) { return false } // if the existing image has less than half,
//         if(oldpx>newpx*5) { return false } // or more than 5x the pixels of the new one, force redraw
//         return true
//     }
//
//     // the heatmap already exists and hasn't changed size too much, we just need to move it
//     // (heatmap() was called because of a zoom or pan event)
//     if($('#'+id).length && !rdrw && closeEnough(gdc.dx_px,dx_px) && closeEnough(gdc.dy_px,dy_px)){
//         $('#'+id).hide().attr("x",left).attr("y",top).attr("width",wd).attr("height",ht).show();
//         return;
//     }
    // now redraw
    if(wd<=0 || ht<=0) { return } // image is so far off-screen, we shouldn't even draw it

    var p = new PNGlib(wd,ht, 256);

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    if (typeof(scl)=="string") scl=eval(scl); // <-- convert colorscale string to array
    var d = scl.map(function(si){return si[0]*255}),
        r = scl.map(function(si){return si[1]});

    s = d3.scale.linear()
        .domain(d)
        .interpolate(d3.interpolateRgb)
        .range(r);

    // map brick boundaries to image pixels
    function xpx(v){ return Math.max(0,Math.min(wd,Math.round(xf({x:v},gd)-left)))}
    function ypx(v){ return Math.max(0,Math.min(ht,Math.round(yf({y:v},gd)-top)))}
    // build the pixel map brick-by-brick
    // cruise through z-matrix row-by-row
    // build a brick at each z-matrix value
    var yi=ypx(y[0]),yb=[yi,yi];
    var i,j,xi,x0,x1,c,pc,v;
    var xbi = xrev?0:1, ybi = yrev?0:1;
    var pixcount = 0, lumcount = 0; // for collecting an average luminosity of the heatmap
    for(j=0; j<m; j++) {
        col = z[j];
        yb.reverse();
        yb[ybi] = ypx(y[j+1]);
        if(yb[0]==yb[1]||yb[0]===undefined||yb[1]===undefined) { continue }
        xi=xpx(x[0]),xb=[xi,xi];
        for(i=0; i<n; i++) {
            // build one color brick!
            v=col[i];
            xb.reverse();
            xb[xbi] = xpx(x[i+1]);
            if(xb[0]==xb[1]||xb[0]===undefined||xb[1]===undefined) { continue }
            if($.isNumeric(v)) {
                // get z-value, scale for 8-bit color by rounding z to an integer 0-254
                // (one value reserved for transparent (missing/non-numeric data)
                c=s(Math.round((v-min)*255/(max-min)));
                pc = p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2));
                var pix = (xb[1]-xb[0])*(yb[1]-yb[0]);
                pixcount+=pix;
                lumcount+=pix*tinycolor(c).toHsl().l;
            }
            else { pc = p.color(0,0,0,0) } // non-numeric shows as transparent TODO: make this an option
            for(xi=xb[0]; xi<xb[1]; xi++) { // TODO: Make brick spacing editable (ie x=1)
                for(yi=yb[0]; yi<yb[1]; yi++) { // TODO: Make brick spacing editable
                    p.buffer[p.index(xi, yi)] = pc;
                }
            }
        }
    }
    gd.hmpixcount = (gd.hmpixcount||0)+pixcount;
    gd.hmlumcount = (gd.hmlumcount||0)+lumcount;

    // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
    // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc
    var imgstr = "data:image/png;base64,\n" + p.getBase64();
    $('#'+id).remove(); // put this right before making the new image, to minimize flicker
    gd.plot.append('svg:image')
        .attr("id",id)
        .attr('class','pixelated') // we can hope...
        .attr("xmlns","http://www.w3.org/2000/svg")
        .attr("xlink:href", imgstr)
        .attr("height",ht)
        .attr("width",wd)
        .attr("x",left)
        .attr("y",top)
        .attr('preserveAspectRatio','none');

    $('svg > image').parent().attr("xmlns:xlink","http://www.w3.org/1999/xlink");

    // show a colorscale
    if(gdc.showscale!=false){
        insert_colorbar(gd,gdc,cb_id);
    }
}

// Return MAX and MIN of an array of arrays
// moved to aggNums so we handle non-numerics correctly
function zmax(z){
    return aggNums(Math.max,null,z.map(function(row){return aggNums(Math.max,null,row)}));
}

function zmin(z){
    return aggNums(Math.min,null,z.map(function(row){return aggNums(Math.min,null,row)}));
}

// insert a colorbar
function insert_colorbar(gd,gdc,cb_id) {

    if(gd.layout.margin.r<200){ // shouldn't get here anymore... take care of this in newPlot
        console.log('warning: called relayout from insert_colorbar');
        relayout(gettab(),'margin.r',200);
    }

    var scl=gdc.scl;
    if (typeof(scl)=="string") scl=eval(scl); // <-- convert colorscale string to array
    var d=[], min=gdc.zmin, max=gdc.zmax; // "colorbar domain" - interpolate numbers for colorscale
    for(var i=0; i<scl.length; i++){ d.push( min+(scl[i][0]*(max-min)) ); }
    var r=[]; // "colorbar range" - colors in gdc.colorscale
    for(var i=0; i<scl.length; i++){ r.push( scl[i][1] ); }

    //remove last colorbar, if any
    $('#'+cb_id).remove();

    var gl = gd.layout,
        g = gd.paper.append("g")
            .attr("id",cb_id)
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

// in order to avoid unnecessary redraws, check for heatmaps with colorscales
// and expand right margin to fit
function heatmap_margin(gd){
    var gl = gd.layout;
    if(gd.data && gd.data.length && gl.margin.r<200) {
        for(curve in gd.data) {
            if((HEATMAPTYPES.indexOf(gd.data[curve].type)!=-1) && (gd.data[curve].showscale!=false)) {
                gl.margin.r=200;
                return true;
            }
        }
    }
    return false;
}

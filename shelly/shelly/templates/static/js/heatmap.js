// option to limit number of pixels per color brick, for better speed
// also, Firefox and IE seem to allow nearest-neighbor scaling, so could set to 1?
// zero or other falsy val disables
MAX_PX_PER_BRICK=0;

// returns the L, R, T, B coordinates of a heatmap as { x:[L,R], y:[T,B] }
function hm_rect(gdc){
    // Set any missing keys to defaults
    default_hm(gdc,true);
    return {'x':[gdc.x0-gdc.dx/2,gdc.x0+gdc.dx*(gdc.z[0].length-0.5)],
            'y':[gdc.y0-gdc.dy/2,gdc.y0+gdc.dy*(gdc.z.length-0.5)]};
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
    if(!( 'z' in gdc )){ gdc.z=[[1,2],[3,4]] }
    if(!( 'x0' in gdc )){ gdc.x0=0 }
    if(!( 'y0' in gdc )){ gdc.y0=0 }
    if(!( 'dx' in gdc )){ gdc.dx=1 }
    if(!( 'dy' in gdc )){ gdc.dy=1 }
    if(!( 'zauto' in gdc)){ gdc.zauto=true }
    if(!noZRange) { // can take a long time... only do once
        if(!( 'zmin' in gdc )||(!(gdc.zauto==false))){ gdc.zmin=zmin(gdc.z) }
        if(!( 'zmax' in gdc )||(!(gdc.zauto==false))){ gdc.zmax=zmax(gdc.z) }
    }
    if(!( 'scl' in gdc )){ gdc.scl=defaultScale }
//     if(!( 'id' in gdc )){ gdc.id=i }
}

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Params are index of heatmap data object in gd.data, and the heatmap data object itself
// gdc ("graph div curve") = data object for a single heatmap
// cd "calcdata" - contains styling information
// Example usage:
// plot( gettab().id, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}] )
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
function heatmap(cd,rdrw,gd){
    var i = cd[0].t.curve,
        gdc = gd.data[i];
    // Set any missing keys to defaults
    default_hm(gdc);
    var z=gdc.z, x0=gdc.x0, y0=gdc.y0, dx=gdc.dx, dy=gdc.dy, min=gdc.zmin, max=gdc.zmax, scl=gdc.scl;
    // console.log(min,max);
    // if this is the first time drawing the heatmap and it has never been saved it won't have an id
    // TODO! If 2 heat maps are loaded from different files, they could have the same id
    if( !('hm_id' in gdc) ){ gdc.hm_id=gd.id+'-hm'+i; } // heatmap id
    if( !('cb_id' in gdc) ){ var cb_id=gd.id+'-cb'+i; } // colorbar id
    var id=gdc.hm_id;
    //console.log('heatmap id: '+id);

    // get z dims
    var m=z.length; // num rows
    var n=z[0].length; // num cols

    // Get edges of png in pixels (xf() maps axes coordinates to pixel coordinates)
    // figure out if either axis is reversed (y is usually reversed, in pixel coords)
    var xrev = false, yrev = false;
    var left=xf({x:x0-dx/2},gd), right=xf({x:x0+dx*(n-0.5)},gd);
    if(right<left) {
        var temp = right;
        right = left;
        left = temp;
        xrev = true;
    }
    var top=yf({y:y0-dy/2},gd), bottom=yf({y:y0+dy*(m-0.5)},gd);
    if(bottom<top) {
        var temp = top;
        top = bottom;
        bottom = temp;
        yrev = true;
    }

    var wd=Math.round(right-left); //console.log('img width in px'); console.log(wd);
    var ht=Math.round(bottom-top); //console.log('img height in px'); console.log(ht);

    var dx_px=wd/n;
    var dy_px=ht/m;

    // option to change the number of pixels per brick
    if(MAX_PX_PER_BRICK>0) {
        dx_px=Math.min(MAX_PX_PER_BRICK,dx_px);
        dy_px=Math.min(MAX_PX_PER_BRICK,dy_px);
    }

    function closeEnough(oldpx,newpx) {
        if(oldpx<newpx/2) { return false } // if the existing image has less than half,
        if(oldpx>newpx*5) { return false } // or more than 5x the pixels of the new one, force redraw
        return true
    }

    // the heatmap already exists and hasn't changed size too much, we just need to move it
    // (heatmap() was called because of a zoom or pan event)
    if($('#'+id).length && !rdrw && closeEnough(gdc.dx_px,dx_px) && closeEnough(gdc.dy_px,dy_px)){
        $('#'+id).hide().attr("x",left).attr("y",top).attr("width",wd).attr("height",ht).show();
        return;
    }
    // now redraw
    $('#'+id).remove();
    // save the calculated pixel size for later
    gdc.dx_px=dx_px;
    gdc.dy_px=dy_px;

    var p = new PNGlib(Math.round(n*dx_px),Math.round(m*dy_px), 256);

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

    // build the pixel map brick-by-brick
    // cruise through z-matrix row-by-row
    // build a brick at each z-matrix value
    var y=y0=y1=0;
    var i,j,x,x0,x1,c,pc,v;
    for(j=0; j<m; j++) {
        col = z[yrev ? m-1-j : j];
        y0 = y1;
        y1 = Math.round((j+1)*dy_px);
        x=x0=x1=0;
        for(i=0; i<n; i++) {
            // build one color brick!
            v=col[xrev ? n-1-i : i];
            if($.isNumeric(v)) {
                // get z-value, scale for 8-bit color by rounding z to an integer 0-254
                // (one value reserved for transparent (missing/non-numeric data)
                c=s(Math.round((v-min)*255/(max-min)));
                pc = p.color('0x'+c.substr(1,2),'0x'+c.substr(3,2),'0x'+c.substr(5,2));
            }
            else { pc = p.color(0,0,0,0) } // non-numeric shows as transparent TODO: make this an option
            x0 = x1;
            x1 = Math.round((i+1)*dx_px);
            for(x=x0; x<x1; x++) { // TODO: Make brick spacing editable (ie x=1)
                for(y=y0; y<y1; y++) { // TODO: Make brick spacing editable
                    p.buffer[p.index(x, y)] = pc;
                }
            }
        }
    }

    // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
    // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc
    gd.plot.append('svg:image')
        .attr("id",id)
        .attr('class','pixelated') // we can hope...
        .attr("xmlns","http://www.w3.org/2000/svg")
        .attr("xlink:href", "data:image/png;base64,\n" +p.getBase64())
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

// Return MAX of an array of arrays
// moved to aggNums so we handle non-numerics correctly
function zmax(z){
    console.log('zmax');
    return aggNums(Math.max,null,z.map(function(row){return aggNums(Math.max,null,row)}));
//     var m=z[0][0];
//     for(var i=0;i<z.length;i++){
//         rowmax=Math.max.apply( Math, z[i] );
//         if(rowmax>m){ m=rowmax; }
//     }
//     return m;
}

// Return MIN of an array of arrays
function zmin(z){
    console.log('zmin');
    return aggNums(Math.min,null,z.map(function(row){return aggNums(Math.min,null,row)}));
//     var m=z[0][0];
//     for(var i=0;i<z.length;i++){
//         rowmin=Math.min.apply( Math, z[i] );
//         if(rowmin<m){ m=rowmin; }
//     }
//     return m;
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

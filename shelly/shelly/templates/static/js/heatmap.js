// returns the L, R, T, B coordinates of a heatmap as { x:[L,R], y:[T,B] }
function hm_rect(gdc){
    // Set any missing keys to defaults
    gdc=default_hm(gdc);
    var z=gdc.z, x0=gdc.x0, y0=gdc.y0, dx=gdc.dx, dy=gdc.dy, m=z.length, n=z[0].length;

    return {'x':[x0-dx/2,x0+dx*n-dx/2], 'y':[y0-dy/2,y0+dy*m-dy/2]};
}

// if the heatmap data object is missing any keys, fill them in 
// keys expected in gdc:
// z = 2D array of z values
// x0 = middle of first color brick in x (on plotly's x-axis) 
// dx = brick size in x (on plotly's x-axis) 
// same for y0, dy
// z0 = minimum of colorscale
// z1 = maximum of colorscale 
function default_hm(gdc){
    if(!( 'z' in gdc )){ gdc.z=[[1,2],[3,4]]; }
    if(!( 'x0' in gdc )){ gdc.x0=2; }    
    if(!( 'y0' in gdc )){ gdc.y0=2; }   
    if(!( 'dx' in gdc )){ gdc.dx=0.5; }    
    if(!( 'dy' in gdc )){ gdc.dy=0.5; }
    if(!( 'zmin' in gdc )){ gdc.zmin=zmin(gdc.z); }    
    if(!( 'zmax' in gdc )){ gdc.zmax=zmax(gdc.z); }
    if(!( 'scl' in gdc )){ gdc.scl=defaultScale; }         
    if(!( 'id' in gdc )){ gdc.id=i; }   

    return gdc;
}

// Creates a heatmap image from a z matrix and embeds adds it to svg plot
// Params are index of heatmap data object in gd.data, and the heatmap data object itself
// gdc ("graph div curve") = data object for a single heatmap       
// cd "calcdata" - contains styling information
// Example usage: 
// plot( gettab().id, [{'type':'heatmap','z':[[1,2],[3,4]], 'x0':2, 'y0':2, 'dx':0.5, 'dy':0.5}] )
// From http://www.xarg.org/2010/03/generate-client-side-png-files-using-javascript/
function heatmap(i,gdc,cd,rdrw,gd){
    if(rdrw===undefined){ rdrw=false; }
    //var gd=gettab();
    // Set any missing keys to defaults
    gdc=default_hm(gdc);
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
    var bounds={'x':[x0-dx/2,x0+dx*n+dx/2], 'y':[y0-dy/2,y0+dy*m+dy/2]} // return this later this for autorange
    var left=xf({'x':x0,'y':y0},gd), right=xf({'x':x0+dx*n,'y':y0+dy*m},gd);
    var bottom=yf({'x':x0,'y':y0},gd), top=yf({'x':x0+dx*n,'y':y0+dy*m},gd);
    
    var wd=right-left; //console.log('img width in px'); console.log(wd);
    var ht=bottom-top; //console.log('img height in px'); console.log(ht);
        
    var dx_px=Math.floor(wd/n);
    var dy_px=Math.floor(ht/m);
    
    //var dx_px=Math.round(wd/n);
    //var dy_px=Math.round(ht/m);         

    var d={'x':x0-dx/2, 'y':y0+dy/2};
    var x_px=xf(d,gd); // image x-position in pixels
    var y_px=yf(d,gd); // image y-position in pixels
        
    var p = new PNGlib(dx_px*n, dy_px*m, 256);
    var background = p.color(255, 0, 0, 0);        
        
    if($('#'+id).length>0 && rdrw==false){
        // the heatmap already exists, we just need to move it (heatmap() was called because of a zoom or pan event)
        $('#'+id).hide().attr("x",x_px).attr("y",y_px-((m-1)*dy_px)).show().attr("width",p.width).attr("height",p.height).show();         
        return;
    }
    else if(rdrw==true){
        $('#'+id).remove(); 
    }
        
    var p = new PNGlib(dx_px*n, dy_px*m, 256);
    var background = p.color(255, 0, 0, 0);

    // interpolate for color scale
    // https://github.com/mbostock/d3/wiki/Quantitative-Scales
    // http://nelsonslog.wordpress.com/2011/04/11/d3-scales-and-interpolation/

    if (typeof(scl)=="string") scl=eval(scl); // <-- convert colorscale string to array    
    var d=[]; // "domain"
    //for(var i=0; i<scl.length; i++){ d.push( min+(scl[i][0]*(max-min)) ); }
    for(var i=0; i<scl.length; i++){ d.push( min+(scl[i][0]*(255)) ); }    
    var r=[]; // "range"
    for(var i=0; i<scl.length; i++){ r.push( scl[i][1] ); }    
    
    s = d3.scale.linear()
        .domain(d)
        .interpolate(d3.interpolateRgb)
        .range(r);         

    // build the pixel map brick-by-brick
    // cruise through z-matrix row-by-row
    // build a brick at each z-matrix value  
    for(var i=0; i<n; i++) {
        for(var j=0; j<m; j++) {            
            var v=z[j][i], v_8b=Math.round(v/(max-min)*255); // get z-value, scale for 8-bit color by rounding z to an integer 0-255
            bld_brck(p,v_8b,i,j,dx_px,dy_px,s,gd); // build color brick!
        }
    } 
        
    // http://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images        
    // https://groups.google.com/forum/?fromgroups=#!topic/d3-js/aQSWnEDFxIc    
    gd.plot.append('svg:image') 
        .attr("id",id)   
        .attr("xmlns","http://www.w3.org/2000/svg")    
        .attr("xlink:href", "data:image/png;base64,\n" +p.getBase64())
        .attr("height",p.height)
        .attr("width",p.width)
        .attr("x",x_px)
        .attr("y",y_px-((m-1)*dy_px))
        .attr('preserveAspectRatio','none');
    
    $('svg > image').parent().attr("xmlns:xlink","http://www.w3.org/1999/xlink");
        
    // show a colorscale
    if(gdc.showscale!=false){
        insert_colorbar(gd,gdc,cb_id);
    }                     
}

// build one color brick at position i, j
// p: png image object
// v: z value
// dx: width of brick in px
// dy: height of brick in px
// s: d3 color function, returns a hex color string interpolated for z
function bld_brck(p,v,i,j,dx,dy,s,gd){
    var c = s(v).replace('#',''), r = '0x'+c.substr(0,2), g = '0x'+c.substr(2,2), b = '0x'+c.substr(4,2);
                
    /*if(p.color(r,g,b)=="\x00"){
        console.log('zvalue',v);
        console.log('missing brick at',i,j);    
    }*/
    for(var x=0; x<dx; x++) { // TODO: Make brick spacing editable (ie x=1)
        for(var y=0; y<dy; y++) { // TODO: Make brick spacing editable
            p.buffer[p.index((Number(i*dx)+Number(x)), (Number(j*dy)+Number(y)))] = p.color(r,g,b);            
        }
    }
    //p.buffer[p.index(Number(i), Number(j)) ] = p.color(r,g,b); // <--- single px brick experiment
}

// Return MAX of an array of arrays
function zmax(z){
    var m=z[0][0];
    for(var i=0;i<z.length;i++){
        rowmax=Math.max.apply( Math, z[i] );
        if(rowmax>m){ m=rowmax; }
    }
    return m;
}

// Return MIN of an array of arrays
function zmin(z){
    var m=z[0][0];
    for(var i=0;i<z.length;i++){
        rowmin=Math.min.apply( Math, z[i] );
        if(rowmin<m){ m=rowmin; }
    }
    return m;
}

// insert a colorbar
function insert_colorbar(gd,gdc,cb_id) {

    if(gd.layout.margin.r!=200){
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
            .classed("colorbar",true);
        cb = colorBar().color(d3.scale.linear()
            .domain(d)
            .range(r))            
            .size(gl.height-gl.margin.t-gl.margin.b)
            .lineWidth(30)
            .precision(2); // <-- gradient granularity TODO: should be a variable in colorbar popover

    g.call(cb);
}
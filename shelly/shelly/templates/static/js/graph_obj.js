/* Coordinate systems in the plots:
(note: paper and viewbox have y0 at large y because pixels start at upper left,
not lower left)

Data coordinates: xd,yd
    visible range: xd0-xd1, yd0-yd1 (gl.xaxis.range[0-1], gl.yaxis.range[0-1]

Paper coordinates: xp,yp (where axes are drawn, minus gl.margin:.l,.t)
    plot box: xp0-xp1, yp0-yp1 (0 - gd.plotwidth, gd.plotheight - 0)
    transform: xp = mx*xd+bx, yp = my*yd+by
        mx = gl.xaxis.m = gd.plotwidth/(gl.xaxis.range:[1]-[0])
        bx = gl.xaxis.b = -mx*gl.xaxis.range[0]
        my = gl.yaxis.m = gd.plotheight/(gl.yaxis.range:[0]-[1])
        by = gl.yaxis.b = -my*gl.yaxis.range[1]
Viewbox coordinates: xv,yv (where data are drawn)
    plot box: xv0-xv1, yv0-yv1 (gd.viewbox: .x - .x+.w, .y+.h - .y)
        initial viewbox: 0 - gd.plotwidth, gd.plotheight - 0
    transform: xv = xp+b2x, yv = yp+b2y
        panning: subtract dx,dy from viewbox:.x,.y
        zooming: viewbox will not scale x and y differently, at least in Chrome, so for
            zoom we will move the individual points.

Plot takes two params, data and layout. For layout see newplot.
data should be an array of objects, one per trace. allowed keys:

    type: (string) scatter (default)

    x: (float array), or x0:(float) and dx:(float)
        if neither x, x0, or dx exists, defaults is x0:0, dx:1

    y: (float array), or y0:(float) and dy:(float)
        if neither y, y0, or dy exists, defaults to y0:0, dy:1
        you may provide x and/or y arrays, but not neither
    
    All of these can also be date strings, in the format 'YYYY-mm-dd HH:MM:SS'
    This format can handle anything from year 0 to year 9999, but the underlying JS
    can extend this to year -271820 to 275760 
    based on converting to ms since start of 1970 for plotting
    so we could at some point extend beyond 0-9999 limitation...

    marker: (object):
        symbol: (string) circle (default)
        color: (cstring), or (cstring array)
        line: (object):
            color: (cstring), or (cstring array)
            width: (float px), default 0

    line: (object):
        color: (cstring), or (cstring array)
        width: (float px), default 1
    
    color: (cstring), or (cstring array)    
    text: (string array) hover text for each point

    name: <string for legend>
    
    cstring is a string with any valid HTML color
    if any one color is provided, all others not provided will copy it
    if no colors are provided, choose one from a default set based on the trace number

    eventually I'd like to make all of the marker and line properties accept arrays
    to modify properties point-by-point
    
    any array also has a corresponding src attribute, ie xsrc for x
    this is a string:
    	<id>/<colname> for your own data, 
    	<user>/<id>/<colname> for shared data
    
*/  

// new way of zooming with viewbox: warps points while zooming, but it's super fast.
// set fastscale=true to use
var fastscale=true;
// var fastscale=false;

GRAPH_HEIGHT=500*1.2
GRAPH_WIDTH=750*1.2;
TOOLBAR_LEFT='920px';
TOOLBAR_TOP='30px';
// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
function plot(divid, data, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in by dom element, others by id (string)
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
	var defaultColors=['#00e','#a00','#0c0','#000'];

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass non-object (null, '', whatever) for data
    var graphwasempty = ((typeof gd.data==='undefined') && $.isArray(data));
    if(typeof data=='object') {
        if(graphwasempty) gd.data=data;
        else gd.data.push.apply(gd.data,data);
        gd.empty=false;
    }

    // interpolate data if >1000 points
    // jp added 9_8_2012
    if(!graphwasempty){
        var LARGESET=2000;
        for(var i=0;i<data.length;i++){
            if(data[i]['x'].length>LARGESET){
                // for large datasets, assume unsorted
                var xsort=[];
                var ysort=[];
                xy=$.zip(data[i]['x'],data[i]['y']);
                xy=sortobj(xy);
                $.each(xy, function(k, v){xsort.push(k); ysort.push(v);});
                console.log('xsort');
      	        console.log(xsort);
                console.log('ysort');
    	        console.log(ysort);
                // i_f = "interpolation factor" - size of chunk to average
                // Ex: If LARGESET=1000 and  there are 10000 points -> 
                // make new array by averaging over every 10 y values
                i_f=Math.round(xsort.length/LARGESET);
                new_x=[]
                new_y=[]
                for(var j in xsort){
                    if(j%i_f==0 && $.isNumeric(xsort[j])){
                        new_x.push(xsort[j]);
                        y_slice=ysort.slice(j,j+i_f)
                        // Filter out any string values in y_slice
                        for(var k in y_slice){
                            if($.isNumeric(y_slice[k])==false) y_slice.splice(k,1);}
                        avg=eval(y_slice.join('+'))/y_slice.length;
                        new_y.push(avg);
                    }
                }
                // console.log('interpolated arrays');
                // console.log(new_x);
                // console.log(new_y);
                data[i]['x']=new_x;
                data[i]['y']=new_y;           
            }
        } // end jp edit 9_8_2012
    }

    // make the graph container and axes, if they don't already exist
    // note: if they do already exist, the new layout gets ignored (as it should)
    // unless there's no data there yet... then it should destroy and remake the plot
    if((typeof gd.layout==='undefined')||graphwasempty) newPlot(divid, layout);

    var gl=gd.layout, vb=gd.viewbox, gdd=gd.data, gp=gd.plot;
    var xa=gl.xaxis, ya=gl.yaxis, xdr=gl.xaxis.drange, ydr=gl.yaxis.drange;
    var x, xy, y, i, serieslen, dcnt, ncnt, v0, dv, gdc;
    xdr=[null,null];
    ydr=[null,null];


    if(gdd&&(gdd.length>0)){
        // figure out if axes are dates
        // use the first trace only.
        // If the axis has data, see whether more looks like dates or like numbers
        // If it has x0 & dx (etc), go by x0 (if x0 is a date and dx is a number, perhaps guess days?)
        // If it has none of these, it will default to x0=0, dx=1, so choose number
        // -> If not date, figure out if a log axis makes sense, using all axis data
        if(!isBoolean(xa.isdate))
            xa.isdate = ('x' in gdd[0]) ? moreDates(gdd[0].x) : (isDateTime(gdd[0].x0)===true);
        if(!xa.isdate && !isBoolean(xa.islog))
            xa.islog = loggy(gdd,'x');
    
        if(!isBoolean(ya.isdate))
            ya.isdate = ('y' in gdd[0]) ? moreDates(gdd[0].y) : (isDateTime(gdd[0].y0)===true);
        if(!ya.isdate && !isBoolean(ya.islog))
            ya.islog = loggy(gdd,'y');
    }

    // prepare the data and find the autorange
    gd.calcdata=[]
    for(curve in gdd) {
        gdc=gdd[curve];
        if(!('color' in gdc)) gdc.color = defaultColors[curve % defaultColors.length];
        if(!('name' in gdc)) {
            if('ysrc' in gdc) {
                var ns=gdc.ysrc.split('/')
                gdc.name=ns[ns.length-1].replace('\n',' ');
            }
            else gdc.name='trace '+curve;
        }
        
        //default type is scatter
        if(!('type' in gdc) || (gdc.type=='scatter')) {
            // verify that data exists, and make scaled data if necessary
            if(!('y' in gdc) && !('x' in gdc)) continue; // no data!
            
            if('y' in gdc) y=convertToAxis(gdc.y,ya);
            else {
                v0 = ('y0' in gdc) ? convertToAxis(gdc.y0, ya) : 0;
                dv = ('dy' in gdc) ? convertToAxis(gdc.dy, ya) : 1;
                y=[];
                for(i in x) y.push(v0+i*dv);
            }

            if('x' in gdc) x=convertToAxis(gdc.x,xa);
            else {
                v0 = ('x0' in gdc) ? convertToAxis(gdc.x0, xa) : 0;
                dv = ('dx' in gdc) ? convertToAxis(gdc.dx, xa) : 1;
                x=[];
                for(i in y) x.push(v0+i*dv);
            }
            
            serieslen=Math.min(x.length,y.length);
            if(xa.autorange) xdr=[aggNums(Math.min,xdr[0],x,serieslen),aggNums(Math.max,xdr[1],x,serieslen)];
            if(ya.autorange) ydr=[aggNums(Math.min,ydr[0],y,serieslen),aggNums(Math.max,ydr[1],y,serieslen)];
            // create the "calculated data" to plot
            var cd=[];
            for(i=0;i<serieslen;i++) cd.push(($.isNumeric(x[i]) && $.isNumeric(y[i])) ? {x:x[i],y:y[i]} : {x:false,y:false});
            // add the trace-wide properties to the first point
            // TODO: this won't get things inside marker and line objects, once we get to those...
            //   either change the object format, or make this recursive on plain objects
            cd[0].t={};
            for(key in gdc) {
                if(key.indexOf('src')==-1 && ['string','number'].indexOf(typeof gdc[key])!=-1)
                    cd[0].t[key]=gdc[key];
            }
            gd.calcdata.push(cd);
        }
        CD=[gd.calcdata,xdr,ydr];
    }
    if(xa.autorange && $.isNumeric(xdr[0])) {
        xa.range=[1.05*xdr[0]-0.05*xdr[1],1.05*xdr[1]-0.05*xdr[0]];
        doXTicks(gd);
    }
    if(ya.autorange && $.isNumeric(ydr[0])) {
        ya.range=[1.05*ydr[0]-0.05*ydr[1],1.05*ydr[1]-0.05*ydr[0]];
        doYTicks(gd);
    }

    // now plot the data
    // TODO: to start we redraw each time. later we should be able to do way better on redraws...
    gp.selectAll('g.trace').remove();
    
    var traces = gp.selectAll('g.trace')
        .data(gd.calcdata)
        .enter().append('g')
        .attr('class','trace');

    traces.append('polyline') // TODO: break this into multiple polylines on non-numerics
        .call(lineGroupStyle)
        .attr('points',function(d){out=''
            for(var i=0;i<d.length;i++)
                if($.isNumeric(d[i].x)&&$.isNumeric(d[i].y))
                    out+=(xa.b+xa.m*d[i].x+vb.x)+','+(ya.b+ya.m*d[i].y+vb.y)+' ';
            return out;
        });
    
    var pointgroups=traces.append('g')
        .attr('class','points')
        .call(pointGroupStyle);
    pointgroups.selectAll('circle')
        .data(function(d){return d})
        .enter().append('circle')
        .call(pointStyle)
        .each(function(d){
            if($.isNumeric(d.x)&&$.isNumeric(d.y))
                d3.select(this)
                    .attr('cx',xa.b+xa.m*d.x+vb.x)
                    .attr('cy',ya.b+ya.m*d.y+vb.y);
            else d3.select(this).remove();
        });

    // show the legend
    if(gd.calcdata.length>1) legend(gd);
}

function lineGroupStyle(s) {
    s.attr('stroke-width',1)
     .attr('stroke',function(d){return d[0].t.color})
     .style('fill','none');
}

function pointGroupStyle(s) {
    s.attr('stroke-width',0)
     .style('fill',function(d){return d[0].t.color});
}

function pointStyle(s) {
        s.attr('r',3);
}

// ----------------------------------------------------
// Create the plot container and axes
// ----------------------------------------------------
function newPlot(divid, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in already by dom element
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(!layout) layout={};
    // destroy any plot that already exists in this div
    gd.innerHTML='';

    // Get the layout info (this is the defaults)
    gd.layout={title:'',
        xaxis:{range:[-5,5],tick0:0,dtick:2,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'',unit:''},
        yaxis:{range:[-4,4],tick0:0,dtick:1,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'',unit:''},
        width:GRAPH_WIDTH,
        height:GRAPH_HEIGHT,
        margin:{l:50,r:10,t:30,b:40,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff' };
        // TODO: add font size controls, and label positioning
        // TODO: add legend

    // look for elements of gd.layout to replace with the equivalent elements in layout
    gd.layout=updateObject(gd.layout,layout);
    var gl=gd.layout, gd3=d3.select(gd)

    // Make the graph containers
    // First svg (paper) is for the axes
    gd.paper=gd3.append('svg')
        .attr('width',gl.width)
        .attr('height',gl.height)
        .style('background-color',gl.paper_bgcolor);
    gd.plotwidth=gl.width-gl.margin.l-gl.margin.r;
    gd.plotheight=gl.height-gl.margin.t-gl.margin.b;
    gd.plotbg=gd.paper.append('rect')
        .attr('x',gl.margin.l-gl.margin.pad)
        .attr('y',gl.margin.t-gl.margin.pad)
        .attr('width',gd.plotwidth+2*gl.margin.pad)
        .attr('height',gd.plotheight+2*gl.margin.pad)
        .style('fill',gl.plot_bgcolor)
        .attr('stroke','black')
        .attr('stroke-width',1);

    // make the ticks, grids, and titles
    gd.axislayer=gd.paper.append('g').attr('class','axislayer');
    doXTicks(gd);doYTicks(gd);
    gl.xaxis.r0=gl.xaxis.range[0];
    gl.yaxis.r0=gl.yaxis.range[0];

    makeTitles(gd,''); // happens after ticks, so we can scoot titles out of the way if needed
    
    // Second svg (plot) is for the data
    gd.plot=gd.paper.append('svg')
        .attr('x',gl.margin.l)
        .attr('y',gl.margin.t)
        .attr('width',gd.plotwidth)
        .attr('height',gd.plotheight)
        .attr('preserveAspectRatio','none')
        .style('fill','none');
    gd.viewbox={x:0,y:0};

    //make the axis drag objects
    var x1=gl.margin.l;
    var x2=x1+gd.plotwidth;
    var a=$(gd).find('text.ytlabel').get().map(function(e){return e.getBBox().x});
    var x0=Math.min.apply(a,a); // gotta be a better way to do this...
    var y2=gl.margin.t;
    var y1=y2+gd.plotheight;
    var a=$(gd).find('text.xtlabel').get().map(function(e){var bb=e.getBBox(); return bb.y+bb.height});
    var y0=Math.max.apply(a,a); // again, gotta be a better way...

    // drag box goes over the grids and data... we can use just this hover for all data hover effects)
    gd.plotdrag=dragBox(gd, x1, y2, x2-x1, y1-y2,'ns','ew');

    gd.xdrag=dragBox(gd, x1*0.9+x2*0.1, y1,(x2-x1)*0.8, y0-y1,'','ew');
    gd.x0drag=dragBox(gd, x1, y1, (x2-x1)*0.1, y0-y1,'','w');
    gd.x1drag=dragBox(gd, x1*0.1+x2*0.9, y1, (x2-x1)*0.1, y0-y1,'','e');

    gd.ydrag=dragBox(gd, x0, y2*0.9+y1*0.1, x1-x0, (y1-y2)*0.8,'ns','');
    gd.y0drag=dragBox(gd, x0, y1*0.9+y2*0.1, x1-x0, (y1-y2)*0.1,'s','');
    gd.y1drag=dragBox(gd, x0, y2, x1-x0, (y1-y2)*0.1,'n','');

    gd.nwdrag=dragBox(gd, x0, y2+y1-y0, x1-x0, y0-y1,'n','w');
    gd.nedrag=dragBox(gd, x2, y2+y1-y0, x1-x0, y0-y1,'n','e');
    gd.swdrag=dragBox(gd, x0, y1, x1-x0, y0-y1,'s','w');
    gd.sedrag=dragBox(gd, x2, y1, x1-x0, y0-y1,'s','e');

    gd3.selectAll('.drag')
        .style('fill','black')
        .style('opacity',0)
        .attr('stroke-width',0);

    // ------------------------------------------------------------ graphing toolbar
    // This section is super-finicky. Maybe because we somehow didn't get the
    // "btn-group-vertical" class from bootstrap initially, I had to bring it in myself
    // to plotly.css and maybe didn't do it right...
    // For instance, a and button behave differently in weird ways, button nearly gets
    // everything right but spacing between groups is different and I can't fix it,
    // easier to use a throughout and then manually set width.
    // Maybe if we re-download bootstrap this will be fixed?
    var menudiv =
        '<div class="graphbar">'+
            '<div class="btn-group btn-stack">'+
                '<a class="btn" id="graphtogrid" onclick="graphToGrid()" rel="tooltip" title="Show in Grid">'+
                    '<i class="icon-th"></i></a>'+
            '</div>'+
            '<div class="btn-group btn-group-vertical btn-stack">'+
                '<a class="btn" id="pdfexport" onclick="pdfexport(\'pdf\')" rel="tooltip" title="Download as PDF">'+
                    '<img src="/static/img/pdf.png" /></a>'+
                '<a class="btn" id="pngexport" onclick="pdfexport(\'png\')" rel="tooltip" title="Download as PNG">'+
                    '<i class="icon-picture"></i></a>'+
            '</div>'+
            '<div class="btn-group btn-stack">'+
                '<a class="btn" onclick="saveGraph(\'gettab()\')" rel="tooltip" title="Save">'+
                    '<i class="icon-hdd"></i></a>'+
            '</div>'+
            '<div class="btn-group btn-stack">'+
                '<a class="btn" onclick="shareGraph(\'gettab()\')" rel="tooltip" title="Share">'+
                    '<i class="icon-globe"></i></a>'+
            '</div>'+
            '<div class="btn-group btn-stack">'+
                '<a class="btn" onclick="toggleLegend(gettab())" rel="tooltip" title="Legend">'+
                    '<i class="icon-list"></i></a>'+
            '</div>'+
        '</div>'  

    $(gd).prepend(menudiv);
    $(gd).find('.graphbar').css({'position':'absolute','left':TOOLBAR_LEFT,'top':TOOLBAR_TOP});
    $(gd).find('.btn').tooltip({'placement':'left'}).width(14);
}

// ----------------------------------------------------
// Axis dragging functions
// ----------------------------------------------------

function dragBox(gd,x,y,w,h,ns,ew) {
    // some drag events need to be built by hand from mousedown, mousemove, mouseup
    // because dblclick doesn't register otherwise. Probably eventually all
    // drag events will need to be this way, once we layer on enough functions...

    // gd.mouseDown stores ms of first mousedown event in the last dblclickDelay ms on the drag bars
    // and gd.numClicks stores how many mousedowns have been seen within dblclickDelay
    // so we can check for click or doubleclick events
    // gd.dragged stores whether a drag has occurred, so we don't have to
    // resetViewBox unnecessarily (ie if no move bigger than gd.mindrag pixels)
    gd.mouseDown=0;
    gd.numClicks=1;
    gd.dblclickDelay=600;
    gd.mindrag=5; 
    
    var cursor=(ns+ew).toLowerCase()+'-resize';
    if(cursor=='nsew-resize') cursor='move';
    dragger=gd.paper.append('rect').classed('drag',true)
        .classed(ns+ew+'drag',true)
        .attr('x',x)
        .attr('y',y)
        .attr('width',w)
        .attr('height',h)
        .style('cursor',cursor);

    dragger.node().onmousedown = function(e) {
        var eln=this;
        var d=(new Date()).getTime();
        if(d-gd.mouseDown<gd.dblclickDelay)
            gd.numClicks+=1; // in a click train
        else { // new click train
            gd.numClicks=1;
            gd.mouseDown=d;
        }
        // because we cancel event bubbling, input won't receive its blur event.
        // TODO: anything else we need to manually bubble? any more restricted way to cancel bubbling?
        if(gd.input) gd.input.trigger('blur');
        
        if(ew) {
            var gx=gd.layout.xaxis;
            gx.r0=[gx.range[0],gx.range[1]];
            gx.autorange=0;
        }
        if(ns) {
            var gy=gd.layout.yaxis;
            gy.r0=[gy.range[0],gy.range[1]];
            gy.autorange=0;
        }
        gd.dragged = false;
        window.onmousemove = function(e2) {
            // clamp tiny drags to the origin
            gd.dragged=(( (!ns) ? Math.abs(e2.clientX-e.clientX) :
                    (!ew) ? Math.abs(e2.clientY-e.clientY) :
                    Math.abs(e2.clientX-e.clientX,2)+Math.abs(e2.clientY-e.clientY,2)
                ) > gd.mindrag);
            // execute the drag
            if(gd.dragged) plotDrag.call(gd,e2.clientX-e.clientX,e2.clientY-e.clientY,ns,ew);
            else plotDrag.call(gd,0,0,ns,ew);
            pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            var d=(new Date()).getTime();
            if(gd.dragged) // finish the drag
                if(ns=='ns'||ew=='ew') resetViewBox.call(gd);
                else zoomEnd.call(gd);
            else if(d-gd.mouseDown<gd.dblclickDelay) {
                if(gd.numClicks==2) { // double click
                    if(ew=='ew') gd.layout.xaxis.autorange=1;
                    if(ns=='ns') gd.layout.yaxis.autorange=1;
                    if(ns=='ns'||ew=='ew') plot(gd,'','');
                }
                else if(gd.numClicks==1) { // single click
                    if(['n','s','e','w'].indexOf(ns+ew)>=0)// click on ends of ranges
                        autoGrowInput(gd,eln);
                }
            }
        }
        pauseEvent(e);
    }

    return dragger;
}

// common transform for dragging one end of an axis
// d>0 is compressing scale, d<0 is expanding
function dZoom(d) {
    if(d>=0) return 1 - Math.min(d,0.9);
    else return 1 - 1/(1/Math.max(d,-0.3)+3.222);
}

function dragTail(gd) {
    doXTicks(gd);doYTicks(gd); // TODO: plot does all of these things at the end... why do we need to do them here?
    plot(gd,'','');
}

function resetViewBox() {
    this.viewbox={x:0,y:0};
    this.plot.attr('viewBox','0 0 '+this.plotwidth+' '+this.plotheight);
    dragTail(this);
//     makeTitles(this,''); // so it can scoot titles out of the way if needed
}

function zoomEnd() {
    if(fastscale) resetViewBox.call(this);
    else makeTitles(this,''); // so it can scoot titles out of the way if needed
}

function plotDrag(dx,dy,ns,ew) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    if(ew=='ew'||ns=='ns') {
        if(ew) {
            this.viewbox.x=-dx;
            gx.range=[gx.r0[0]-dx/gx.m,gx.r0[1]-dx/gx.m];
            doXTicks(this);        
        }
        if(ns) {
            this.viewbox.y=-dy;
            gy.range=[gy.r0[0]-dy/gy.m,gy.r0[1]-dy/gy.m];
            doYTicks(this);        
        }
        this.plot.attr('viewBox',(ew ? -dx : 0)+' '+(ns ? -dy : 0)+
            ' '+this.plotwidth+' '+this.plotheight);
        return;
    }
    
    if(ew=='w') {
        gx.range[0]=gx.r0[1]+(gx.r0[0]-gx.r0[1])/dZoom(dx/this.plotwidth);
        dx=this.plotwidth*(gx.r0[0]-gx.range[0])/(gx.r0[0]-gx.r0[1]);
    }
    else if(ew=='e') {
        gx.range[1]=gx.r0[0]+(gx.r0[1]-gx.r0[0])/dZoom(-dx/this.plotwidth);
        dx=this.plotwidth*(gx.r0[1]-gx.range[1])/(gx.r0[1]-gx.r0[0]);
    }
    else if(ew=='') dx=0;
    
    if(ns=='n') {
        gy.range[1]=gy.r0[0]+(gy.r0[1]-gy.r0[0])/dZoom(dy/this.plotheight);
        dy=this.plotheight*(gy.r0[1]-gy.range[1])/(gy.r0[1]-gy.r0[0]);
    }
    else if(ns=='s') {
        gy.range[0]=gy.r0[1]+(gy.r0[0]-gy.r0[1])/dZoom(-dy/this.plotheight);
        dy=this.plotheight*(gy.r0[0]-gy.range[0])/(gy.r0[0]-gy.r0[1]);
    }
    else if(ns=='') dy=0;
    
    if(fastscale){
        this.plot.attr('viewBox',
            ((ew=='w')?dx:0)+' '+((ns=='n')?dy:0)+' '+
            (this.plotwidth-dx)+' '+(this.plotheight-dy));
        if(ew) doXTicks(this);
        if(ns) doYTicks(this);
    }
    else dragTail(this);
}

// ----------------------------------------------------
// Titles and text inputs
// ----------------------------------------------------

function makeTitles(gd,title) {
    var gl=gd.layout;
    var titles={
        'xtitle':{x: (gl.width+gl.margin.l-gl.margin.r)/2, y: gl.height-14*0.75,
            w: gl.width/2, h: 14,
            cont: gl.xaxis, fontSize: 14, name: 'X axis',
            transform: '', attr: {}},
        'ytitle':{x: 20, y: (gl.height+gl.margin.t-gl.margin.b)/2,
            w: 14, h: gl.height/2,
            cont: gl.yaxis, fontSize: 14, name: 'Y axis',
            transform: 'rotate(-90,x,y)', attr: {center: 0}},
        'gtitle':{x: gl.width/2, y: gl.margin.t/2,
            w: gl.width/2, h: 16,
            cont: gl, fontSize: 16, name: 'Plot',
            transform: '', attr: {}}};
    for(k in titles){
        if(title==k || title==''){
            var t=titles[k];
            gd.paper.select('.'+k).remove();
            var el=gd.paper.append('text').attr('class',k)
                .attr('x',t.x)
                .attr('y',t.y)
                .attr('font-size',t.fontSize)
                .attr('text-anchor','middle')
                .attr('transform',t.transform.replace('x',t.x).replace('y',t.y))
                .on('click',function(){autoGrowInput(gd,this)});
            if(t.cont.title)
                el.each(function(){styleText(this,t.cont.title+ (!t.cont.unit ? '' : (' ('+t.cont.unit+')')))});
            else
                el.text('Click to enter '+t.name+' title')
                    .style('opacity',1)
                    .on('mouseover',function(){d3.select(this).transition().duration(100).style('opacity',1);})
                    .on('mouseout',function(){d3.select(this).transition().duration(1000).style('opacity',0);})
                  .transition()
                    .delay(2000)
                    .duration(2000)
                    .style('opacity',0);
            var titlebb=el[0][0].getBoundingClientRect(), gdbb=gd.paper.node().getBoundingClientRect();
            if(k=='xtitle'){
                var labels=gd.paper.selectAll('.xtlabel')[0], ticky=0;
                for(var i=0;i<labels.length;i++){
                    var lbb=labels[i].getBoundingClientRect();
                    if(bBoxIntersect(titlebb,lbb))
                        ticky=Math.min(Math.max(ticky,lbb.bottom),gdbb.bottom-titlebb.height);
                }
                if(ticky>titlebb.top)
                    el.attr('transform','translate(0,'+(ticky-titlebb.top)+') '+el.attr('transform'));
            }
            if(k=='ytitle'){
                var labels=gd.paper.selectAll('.ytlabel')[0], tickx=screen.width;
                for(var i=0;i<labels.length;i++){
                    var lbb=labels[i].getBoundingClientRect();
                    if(bBoxIntersect(titlebb,lbb))
                        tickx=Math.max(Math.min(tickx,lbb.left),gdbb.left+titlebb.width);
                }
                if(tickx<titlebb.right)
                    el.attr('transform','translate('+(tickx-titlebb.right)+') '+el.attr('transform'));
            }
        }
    }
}

function toggleLegend(gd) {
    if(gd.legend) {
        gd.paper.selectAll('.legend').remove();
        gd.legend=undefined;
    }
    else legend(gd);
}

function legend(gd) {
    var gl=gd.layout;
    if(!gl.legend) gl.legend={};
    gd.paper.selectAll('.legend').remove();
    if(!gd.calcdata) return;

    var ldata=[]
    for(var i=0;i<gd.calcdata.length;i++) ldata.push([gd.calcdata[i][0]]);
    
    gd.legend=gd.paper.append('svg')
        .attr('class','legend');

    gd.legend.append('rect')
        .attr('class','bg')
        .attr('stroke','black')
        .attr('stroke-width',1)
        .style('fill',gl.paper_bgcolor)
        .attr('x',1)
        .attr('y',1);

    var traces = gd.legend.selectAll('g.traces')
        .data(ldata)
      .enter().append('g')
        .attr('class','trace');

    traces.append('line')
        .call(lineGroupStyle)
        .attr('x1',5)
        .attr('x2',35)
        .attr('y1',0)
        .attr('y2',0);
        
    traces.append('g')
        .attr('class','legendpoints')
        .call(pointGroupStyle)
      .selectAll('circle')
        .data(function(d){return d})
      .enter().append('circle')
        .call(pointStyle)
        .attr('cx',20)
        .attr('cy',0);

    traces.append('text')
        .attr('class',function(d,i){return 'legendtext text-'+i})
        .attr('x',40)
        .attr('y',0)
        .attr('text-anchor','start')
        .attr('font-size',12)
        .each(function(d){styleText(this,d[0].t.name)})
        .on('click',function(){autoGrowInput(gd,this)});

    var legendwidth=0, legendheight=0;
    traces.each(function(){
        var g=d3.select(this), t=g.select('text'), l=g.select('line');
        var tbb=t.node().getBoundingClientRect(),lbb=l.node().getBoundingClientRect();
        t.attr('y',(lbb.top+lbb.bottom-tbb.top-tbb.bottom)/2);
        var gbb=this.getBoundingClientRect();
        legendwidth=Math.max(legendwidth,tbb.width);
        g.attr('transform','translate(0,'+(5+legendheight+gbb.height/2)+')');
        legendheight+=gbb.height+3;
    });
    legendwidth+=45;
    legendheight+=10;

//     if(!gl.legend.x) 
    gl.legend.x=gl.width-gl.margin.r-legendwidth-10;
//     if(!gl.legend.y) 
    gl.legend.y=gl.margin.t+10;
    gd.legend.attr('x',gl.legend.x)
        .attr('y',gl.legend.y)
        .attr('width',legendwidth)
        .attr('height',legendheight);
    gd.legend.selectAll('.bg')
        .attr('width',legendwidth-2)
        .attr('height',legendheight-2);
}

uoStack=[];
// merge objects i and up recursively
function updateObject(i,up) {
    if(!$.isPlainObject(up)) return i;
    var o = uoStack[uoStack.push({})-1]; // seems like JS doesn't fully implement recursion... if I say o={} here then each level destroys the previous.
    for(key in i) o[key]=i[key];
    for(key in up) {
        if($.isPlainObject(up[key]))
            o[key]=updateObject($.isPlainObject(i[key]) ? i[key] : {}, up[key]);
        else o[key]=up[key];
    }
    return uoStack.pop();
}

// auto-grow text input field, for editing graph items
// from http://jsbin.com/ahaxe, heavily edited
// to grow centered, set o.align='center'
// el is the raphael element containing the edited text (eg gd.xtitle)
// cont is the location the value is stored (eg gd.layout.xaxis)
// prop is the property name in that container (eg 'title')
// o is the settings for the input box (can be left blank to use defaults below)
// This is a bit ugly... but it's the only way I could find to pass in the element
// (and layout var) totally by reference...
function autoGrowInput(gd,eln) {
    $(eln).tooltip('destroy'); // TODO: would like to leave this visible longer but then it loses its parent... how to avoid?
    var el3 = d3.select(eln), el = el3.attr('class'), cont, prop, ref=el3;
    var o = {maxWidth: 1000, minWidth: 20}, fontCss={};
    var mode = (el.slice(1,6)=='title') ? 'title' : 
                (el.slice(0,4)=='drag') ? 'drag' :
                (el.slice(0,6)=='legend') ? 'legend' : 
                    'unknown';
    
    if(mode=='unknown') {
        console.log('oops, autoGrowInput doesn\'t recognize this field',el,eln);
        return
    }
    
    // are we editing a title?
    if(mode=='title') {
        cont =  el=='xtitle' ? gd.layout.xaxis :
                el=='ytitle' ? gd.layout.yaxis : 
                el=='gtitle' ? gd.layout : 
                null;
        prop = 'title';
        // if box is initially empty, it's a hover box so we can't grab its properties:
        // so make a dummy element to get the right properties; it will be deleted
        // immediately after grabbing properties.
        if($.trim(cont[prop])=='') {
            el3.remove();
            cont[prop]='.'; // very narrow string, so we can ignore its width
            makeTitles(gd,el);
            cont[prop]='';
            el3=gd.paper.select('.'+el);
            eln=el3.node();
        }
        o.align = el=='ytitle' ? 'left' : 'center';
    }
    // how about an axis endpoint?
    else if(mode=='drag') {
        if(el=='drag ndrag') cont=gd.layout.yaxis, prop=1;
        else if(el=='drag sdrag') cont=gd.layout.yaxis, prop=0;
        else if(el=='drag wdrag') cont=gd.layout.xaxis, prop=0;
        else if(el=='drag edrag') cont=gd.layout.xaxis, prop=1;
        o.align = (el=='drag edrag') ? 'right' : 'left';
        ref=gd.paper.select('.xtitle'); // font properties reference
    }
    // legend text?
    else if(mode=='legend') {
        var tn = Number(el.split('-')[1])
        cont = gd.data[tn], prop='name';
        var cont2 = gd.calcdata[tn][0].t;
        o.align = 'left';
    }

    // not sure how many of these are needed, but they don't seem to hurt...
    fontCss={
        fontSize: ref.attr('font-size'),
        fontFamily: ref.attr('font-family'),
        fontWeight: ref.attr('font-weight'),
        fontStyle: ref.attr('font-style'),
        fontStretch: ref.attr('font-stretch'),
        fontVariant: ref.attr('font-variant'),
        letterSpacing: ref.attr('letter-spacing'),
        wordSpacing: ref.attr('word-spacing')
    }

    o.comfortZone = Number(ref.attr('font-size'))+3;

    var eltrans=el3.attr('transform'),
        inbox=document.createElement('input'),
        pos=$(eln).position(),
        gpos=$(gd.paper.node()).position(),
        bbox=eln.getBoundingClientRect(),
        posx=pos.left + gpos.left + $(gd).scrollLeft(),
        posy=pos.top + gpos.top + $(gd).scrollTop();
        // TODO: explicitly getting positions and adding scrolls seems silly...
        // gotta be a better (and less fragile) way to do this.

    $(gd).append(inbox);
    var input=$(inbox);
    gd.input=input;
    
    input.css(fontCss)
        .css({
            position:'absolute',
            top: (eltrans && eltrans.indexOf('rotate')>=0 ?
                (bbox.height-bbox.width)/2 : 0) + posy - 2,
            left: posx - 2,
            'z-index':6000
        });
    
    if(mode=='drag') {
        var v=cont.range[prop];
        if(cont.islog) input.val(Math.pow(10,cont.range[prop]));
        else if(cont.isdate){
            var d=new Date(cont.range[prop]);
            input.val($.datepicker.formatDate('yy-mm-dd',d)+' '+
                lpad(d.getHours(),2)+':'+
                lpad(d.getMinutes(),2)+ ':'+
                lpad(d.getSeconds(),2)+'.'+
                lpad(d.getMilliseconds(),3));
        }
        else input.val(cont.range[prop]);
    }
    else input.val($.trim(cont[prop]).replace(/[\r\n]/g,'<br>'));

    var minWidth = o.minWidth || input.width(),
        val = input.val(),
        testSubject = $('<tester/>').css({
            position: 'absolute',
            top: -9999,
            left: -9999,
            width: 'auto',
            whiteSpace: 'nowrap'
        })
        .css(fontCss)
        .insertAfter(input)
        .html(escaped(val));

    input.width(Math.max(testSubject.width()*1.2+o.comfortZone,minWidth));

    var ibbox=inbox.getBoundingClientRect();
    if(mode=='drag') {
        // fix positioning, since the drag boxes are not the same size as the input boxes
        if(el=='drag sdrag') input.css('top', (input.position().top + bbox.bottom - ibbox.bottom)+'px');
        if(el=='drag edrag') input.css('left', (input.position().left + bbox.width - ibbox.width)+'px');
    }
    else if(o.align=='right')
        input.css('left',(input.position().left + bbox.width - ibbox.width)+'px');
    else if(o.align=='center')
        input.css('left',(input.position().left + (bbox.width - ibbox.width)/2)+'px');

    var left0=input.position().left+(input.width()/2);
    
    // for titles, take away the existing one as soon as the input box is made
    if(mode!='drag') gd.paper.selectAll('[class="'+el+'"]').remove();
    inbox.select();
    
    input.bind('keyup keydown blur update',function(e) {
        var valold=val;
        val=input.val();
        
        // leave the input or press return: accept the change
        if((e.type=='blur') || (e.type=='keydown' && e.which==13)) {
            
            if(mode=='title') {
                cont[prop]=$.trim(val);
                makeTitles(gd,el);
            }
            else if(mode=='drag') {
                var v= (cont.islog) ? Math.log(Number($.trim(val)))/Math.LN10 :
                    (cont.isdate) ? DateTime2ms($.trim(val)) :
                        Number($.trim(val));
                if($.isNumeric(v)) {
                    cont.range[prop]=v;
                    dragTail(gd);
                }
            }
            else if(mode=='legend') {
                cont[prop]=$.trim(val);
                cont2[prop]=$.trim(val);
                legend(gd);
            }
            input.remove();
            testSubject.remove();
            gd.input=null;
            return;
        }
        // press escape: revert the change
        else if(e.type=='keydown' && e.which==27) {
            if(mode=='title') makeTitles(gd,el);
            else if(mode=='legend') legend(gd);
            input.remove();
            testSubject.remove();
            return;
        }
        // otherwise, if no change to val, stop
        if(val === valold) return;

        // Enter new content into testSubject
        testSubject.html(escaped(val));

        // Calculate new width + whether to change
        var newWidth = Math.max(testSubject.width()+o.comfortZone,minWidth),
            currentWidth = input.width();

        // Animate width and update position
        if((newWidth < currentWidth && newWidth >= minWidth) || (newWidth > minWidth && newWidth < o.maxWidth)) {
            if(o.align!='left') input.css('left', left0-newWidth/(o.align=='center' ? 2 : 1));
            input.width(newWidth);
        }
    });
}

function escaped(val) {
    return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\s/g, '&nbsp;');
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
// TODO: so far it's all autotick=true, but when it's not date and log scales will need things done.
function calcTicks(gd,a) {
    var nt=10; // max number of ticks to display
    var rt=Math.abs(a.range[1]-a.range[0])/nt; // min tick spacing
    if(a.isdate){
        if(a.autotick){
            var base;
            a.tick0=new Date('2000-01-01 00:00:00').getTime();
            if(rt>15778800000){ // years if rt>6mo
                rt/=31557600000;
                var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
                a.dtick='M'+String(12*rtexp*roundUp(rt/rtexp,[2,5,10]));
                a.tickround='y';
            }
            else if(rt>1209600000){ // months if rt>2wk
                rt/=2629800000;
                a.dtick='M'+roundUp(rt,[1,2,3,6]);
                a.tickround='m';
            }
            else if(rt>43200000){ // days if rt>12h
                base=86400000;
                a.tick0=new Date('2000-01-02 00:00:00').getTime(); // get week ticks on sunday
                a.dtick=base*roundUp(rt/base,[1,2,3,7,14]); // 2&3 day ticks are weird, but need something btwn 1,7
                a.tickround='d';
            }
            else if(rt>1800000){ // hours if rt>30m
                base=3600000;
                a.dtick=base*roundUp(rt/base,[1,2,3,6,12]);
                a.tickround='H';
            }
            else if(rt>30000){ // minutes if rt>30sec
                base=60000;
                a.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
                a.tickround='M';
            }
            else if(rt>500){ // seconds if rt>0.5sec
                base=1000;
                a.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
                a.tickround='S';
            }
            else { //milliseconds
                var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
                a.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
                a.tickround=Math.pow(10,3-Math.round(Math.log(a.dtick/2)/Math.LN10));
            }
        }
    }
    else if(a.islog){
        if(a.autotick){
            a.tick0=0;
            if(rt>0.7){ //only show powers of 10 
                a.dtick=Math.ceil(rt);
            }
            else if(rt*nt<1){ // likely no power of 10 visible
                // ticks on a linear scale, labeled fully
                rt=Math.abs(Math.pow(10,a.range[1])-Math.pow(10,a.range[0]))/nt;
                var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
                a.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
                //round tick labels to 2 digits past largest digit of dtick
                a.tickround=Math.pow(10,2-Math.round(Math.log(a.dtick)/Math.LN10));
                a.dtick='L'+String(a.dtick);
            }
            else { // include intermediates between powers of 10, labeled with small digits
                // a.dtick="D2" (show 2 and 5) or "D1" (show all digits)
                // use a.tickround to store the first tick
                var vmin=Math.pow(10,Math.min(a.range[1],a.range[0]));
                var minexp=Math.pow(10,Math.floor(Math.log(vmin)/Math.LN10));
                if(rt>0.3){
                    a.dtick='D2';
                    a.tickround=minexp*roundUp(vmin/minexp,[2,5,10]);
                }
                else {
                    a.dtick='D1';
                    a.tickround=minexp*roundUp(vmin/minexp,[2,3,4,5,6,7,8,9,10]);
                }
            }
        }
    }
    else{
        if(a.autotick){
            // auto ticks always start at 0
            a.tick0=0;
            var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            a.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
        }
        //round tick labels to 2 digits past largest digit of dtick
        a.tickround=Math.pow(10,2-Math.round(Math.log(a.dtick)/Math.LN10));
    }
    
    // set scaling to pixels
    if(a===gd.layout.yaxis) {
        a.m=gd.plotheight/(a.range[0]-a.range[1]);
        a.b=-a.m*a.range[1];
    }
    else {
        a.m=gd.plotwidth/(a.range[1]-a.range[0]);
        a.b=-a.m*a.range[0];    
    }
    
    // find the first tick
    a.tmin=tickFirst(a);
    
    // return the full set of tick vals
    var vals=[];
    for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick))
        vals.push(tickText(gd, a, x));
    return vals;
}

// return the smallest element from (sorted) array a that's bigger than val
// used to find the best tick given the minimum (non-rounded) tick
// particularly useful for date/time where things are not powers of 10
// binary search is probably overkill here...
function roundUp(val,a){
    var low=0, high=a.length-1, mid;
    while(low<high){
        mid=Math.floor((low+high)/2)
        if(a[mid]<=val) low=mid+1;
        else high=mid;
    }
    return a[low];
}

// months and years don't have constant millisecond values
// (but a year is always 12 months so we only need months)
// log-scale ticks are also not consistently spaced, except for pure powers of 10
// numeric ticks always have constant differences, other datetime ticks
// can all be calculated as constant number of milliseconds
function tickIncrement(x,dtick){
    if($.isNumeric(dtick)) // includes all dates smaller than month, and pure 10^n in log
        return x+dtick;
    
    var tType=dtick.charAt(0);
    // Dates: months (or years)
    if(tType=='M'){
        var y=new Date(x);
        // is this browser consistent? setMonth edits a date but returns that date's milliseconds
        return y.setMonth(y.getMonth()+Number(dtick.substr(1)));
    }
    // Log scales: Linear, Digits
    else if(tType=='L')
        return Math.log(Math.pow(10,x)+Number(dtick.substr(1)))/Math.LN10;
    else if(tType=='D') //log10 of 2,5,10, or all digits (logs just have to be close enough to round)
        return Math.floor(x+0.01)+roundUp(mod(x+0.01,1), (dtick=='D2')?
            [0.301,0.699,1]:[0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1]);
    else throw "unrecognized dtick "+String(dtick);
}

// calculate the first tick on an axis
function tickFirst(a){
    if($.isNumeric(a.dtick))
        return Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;

    var tType=a.dtick.charAt(0), dt=Number(a.dtick.substr(1));
    // Dates: months (or years)
    if(tType=='M'){
        var t0=new Date(a.tick0), r0=new Date(a.range[0]);
        var mdif=(r0.getFullYear()-t0.getFullYear())*12+r0.getMonth()-t0.getMonth()
        var t1=t0.setMonth(t0.getMonth()+(Math.floor(mdif/dt)-1)*dt);
        while(t1<a.range[0]) t1=tickIncrement(t1,a.dtick);
        return t1;    
    }
    // Log scales: Linear, Digits
    else if(tType=='L')
        return Math.log(Math.ceil((Math.pow(10,a.range[0])-a.tick0)/dt)*dt+a.tick0)/Math.LN10;
    else if(tType=='D')
        return Math.floor(a.range[0])+roundUp(mod(a.range[0],1), (a.dtick=='D2')?
            [0.301,0.699,1]:[0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1]);
    else throw "unrecognized dtick "+String(a.dtick);
}

// draw the text for one tick.
// px,py are the location on gd.paper
// prefix is there so the x axis ticks can be dropped a line
// a is the axis layout, x is the tick value
// TODO: 1,2,3 superscripts are below all the others
// TODO: move the axis labels away if they overlap the tick labels
function tickText(gd, a, x){
    var fontSize=12; // TODO: add to layout
    var px=0, py=0;
    var suffix=''; // completes the full date info, to be included with only the first tick
    var tt;
    if(a.isdate){
        var d=new Date(x);
        if(a.tickround=='y')
            tt=$.datepicker.formatDate('yy', d);
        else if(a.tickround=='m')
            tt=$.datepicker.formatDate('M yy', d);
        else {
            if(x==a.tmin) suffix='<br>'+$.datepicker.formatDate('yy', d);
            if(a.tickround=='d')
                tt=$.datepicker.formatDate('M d', d);
            else if(a.tickround=='H')
                tt=$.datepicker.formatDate('M d ', d)+lpad(d.getHours(),2)+'h';
            else {
                if(x==a.tmin) suffix='<br>'+$.datepicker.formatDate('M d, yy', d);
                tt=lpad(d.getHours(),2)+':'+lpad(d.getMinutes(),2);
                if(a.tickround!='M'){
                    tt+=':'+lpad(d.getSeconds(),2);
                    if(a.tickround!='S')
                        tt+=String(Math.round(mod(x/1000,1)*a.tickround)/a.tickround).substr(1);
                }
            }
        }
    }
    else if(a.islog){
        if($.isNumeric(a.dtick)||((a.dtick.charAt(0)=='D')&&(mod(x+.01,1)<.1))) {
            tt=(Math.round(x)==0)?'1':(Math.round(x)==1)?'10':'10'+String(Math.round(x)).sup()
            fontSize*=1.25;
        }
        else if(a.dtick.charAt(0)=='D') {
            tt=Math.round(Math.pow(10,mod(x,1)));
            fontSize*=0.75;
        }
        else if(a.dtick.charAt(0)=='L')
            tt=String(Math.round(Math.pow(10,x)*a.tickround)/a.tickround);
        else throw "unrecognized dtick "+String(a.dtick);
    }
    else
        tt=String(Math.round(x*a.tickround)/a.tickround);
    // if 9's are printed on log scale, move the 10's away a bit
    if((a.dtick=='D1') && (String(tt).charAt(0)=='1')){
        if(a===gd.layout.yaxis) px-=fontSize/4;
        else py+=fontSize/3;
    }
    return {dx:px, dy:py, text:tt+suffix, fontSize:fontSize, x:x};
}

function doXTicks(gd) {
    var gl=gd.layout, gm=gl.margin, a=gl.xaxis, y1=gl.height-gm.b+gm.pad;
    var vals=calcTicks(gd,a);

    // ticks
    var xt=gd.axislayer.selectAll('line.xtick').data(vals);
    xt.enter().append('line').attr('class','xtick')
        .attr('stroke','black')
        .attr('stroke-width',1)
        .attr('x1',gm.l)
        .attr('x2',gm.l)
        .attr('y1',y1)
        .attr('y2',y1+a.ticklen)
    xt.attr('transform',function(d){return 'translate('+(a.m*d.x+a.b)+',0)'});
    xt.exit().remove();

    // grid
    var xg=gd.axislayer.selectAll('line.xgrid').data(vals);
    xg.enter().append('line').attr('class','xgrid')
        .attr('stroke','#ddd')
        .attr('stroke-width',1)
        .attr('x1',gm.l)
        .attr('x2',gm.l)
        .attr('y1',gl.height-gm.b)
        .attr('y2',gm.t);
    xg.attr('transform',function(d){return 'translate('+(a.m*d.x+a.b)+',0)'});
    xg.exit().remove();
    
    // tick labels
    gd.axislayer.selectAll('text.xtlabel').remove(); // TODO: problems with reusing labels... shouldn't need this
    var xl=gd.axislayer.selectAll('text.xtlabel').data(vals,function(d){return d});
    xl.enter().append('text').attr('class','xtlabel')
        .attr('x',function(d){return d.dx+gm.l})
        .attr('y',function(d){return d.dy+y1+a.ticklen+d.fontSize})
        .attr('font-size',function(d){return d.fontSize})
        .attr('text-anchor','middle')
        .each(function(d){styleText(this,d.text)});
    xl.attr('transform',function(d){return 'translate('+(a.m*d.x+a.b)+',0)'});
   xl.exit().remove();
}

function doYTicks(gd) {
    var gl=gd.layout, gm=gl.margin, a=gl.yaxis, x1=gm.l-gm.pad;
    var vals=calcTicks(gd,a);
    
    // ticks
    var yt=gd.axislayer.selectAll('line.ytick').data(vals);
    yt.enter().append('line').attr('class','ytick')
        .attr('stroke','black')
        .attr('stroke-width',1)
        .attr('x1',x1)
        .attr('x2',x1-a.ticklen)
        .attr('y1',gm.t)
        .attr('y2',gm.t);
    yt.attr('transform',function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'});
    yt.exit().remove();

    // grid
    var yg=gd.axislayer.selectAll('line.ygrid').data(vals);
    yg.enter().append('line').attr('class','ygrid')
        .attr('stroke','#ddd')
        .attr('stroke-width',1)
        .attr('x1',gm.l)
        .attr('x2',gl.width-gm.r)
        .attr('y1',gm.t)
        .attr('y2',gm.t);
    yg.attr('transform',function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'});
    yg.exit().remove();
    
    // tick labels
    gd.axislayer.selectAll('text.ytlabel').remove(); // TODO: problems with reusing labels... shouldn't need this.
    var yl=gd.axislayer.selectAll('text.ytlabel').data(vals,function(d){return d});
    yl.enter().append('text').attr('class','ytlabel')
        .attr('x',function(d){return d.dx+x1-a.ticklen})
        .attr('y',function(d){return d.dy+gm.t+d.fontSize/2})
        .attr('font-size',function(d){return d.fontSize})
        .attr('text-anchor','end')
        .each(function(d){styleText(this,d.text)});
    yl.attr('transform',function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'});
    yl.exit().remove();
}

// styling for svg text, in ~HTML format
// <br> or \n makes a new line (translated to opening and closing <l> tags)
// others need opening and closing tags:
// <sup> makes superscripts
// <sub> makes subscripts
// <b>, <i> make bold and italic
// <font> with any of style, weight, size, family, and color attributes changes the font
// tries to find < and > that aren't part of a tag and convert to &lt; and &gt;
// but if it fails, displays the unparsed text with a tooltip about the error
function styleText(sn,t) {
    var s=d3.select(sn);
    var t1=t.replace(/((^|>)[^<>]*)>/g,'$1&gt;').replace(/(&gt;[^<>]*)>/g,'$1&gt;')
            .replace(/<([^<>]*($|<))/g,'&lt;$1').replace(/<([^<>]*&lt;)/g,'&lt;$1')
            .replace(/(<br(\s[^<>]*)?\/?>|\n)/g, '</l><l>');
    lines=new DOMParser()
        .parseFromString('<t><l>'+t1+'</l></t>','text/xml')
        .getElementsByTagName('t')[0]
        .childNodes;
//     ST=lines;console.log(ST);
    if(lines[0].nodeName=='parsererror') {
        s.text(t);
        $(s).tooltip({title:"Oops! We didn't get that. You can style text with "+
                "HTML-like tags, but all tags except &lt;br&gt; must be closed, and "+
                "sometimes you have to use &amp;gt; for &gt; and &amp;lt; for &lt;."})
            .tooltip('show');
    }
    else for(var i=0; i<lines.length;i++){
        var l=s.append('tspan').attr('class','nl');
        if(i>0) l.attr('x',s.attr('x')).attr('dy',1.3*s.attr('font-size'));
        styleTextInner(l,lines[i].childNodes);
    }
}

function styleTextInner(s,n) {
    for(var i=0; i<n.length;i++) {
        if(n[i].nodeName=='#text') s.text(n[i].nodeValue);
        else if(n[i].nodeName=='sup')
            styleTextInner(s.append('tspan')
                .attr('baseline-shift','super')
                .attr('font-size','70%'),
              n[i].childNodes);
        else if(n[i].nodeName=='sub')
            styleTextInner(s.append('tspan')
                .attr('baseline-shift','sub')
                .attr('font-size','70%'),
              n[i].childNodes);
        else if(n[i].nodeName=='b')
            styleTextInner(s.append('tspan')
                .attr('font-weight','bold'),
              n[i].childNodes);
        else if(n[i].nodeName=='i')
            styleTextInner(s.append('tspan')
                .attr('font-style','italic'),
              n[i].childNodes);
        else if(n[i].nodeName=='font') {
            var ts=s.append('tspan');
            if(n[i].hasAttribute('style')) ts.attr('font-style',n[i].getAttribute('style'));
            if(n[i].hasAttribute('weight')) ts.attr('font-weight',n[i].getAttribute('weight'));
            if(n[i].hasAttribute('size')) ts.attr('font-size',n[i].getAttribute('size'));
            if(n[i].hasAttribute('family')) ts.attr('font-family',n[i].getAttribute('family'));
            if(n[i].hasAttribute('color')) ts.attr('fill',n[i].getAttribute('color'));
            styleTextInner(ts, n[i].childNodes);
        }
        // TODO: else?
    }
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

function shareGraph(divid){
    //var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    //if(typeof gd.fid !='string') gd.fid='';
    if(signedin()==false) return;
    gd=gettab();
    if(gd.fid===undefined || gd.fid==''){
        saveGraph(divid); // TODO: instead of a timeout, use a callback on finishing saveGraph
        // give graph 1 second to save
        setTimeout(function(){
            // reload div
            var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
            url=window.location.origin+'/'+$('#signin').text().replace(/^\s+|\s+$/g, '')+'/'+gd.fid;
            $('#linktoshare').val(url);
            $('#linkModal').modal('toggle');
            document.getElementById("linktoshare").select();
        }, 1000);  
    }
    else{
        url=window.location.origin+'/'+$('#signin').text().replace(/^\s+|\s+$/g, '')+'/'+gd.fid;
        $('#linktoshare').val(url);
        $('#linkModal').modal('toggle');
        document.getElementById("linktoshare").select();
    }
}

// ------------------------------- graphToGrid

function graphToGrid(){
    var gd=gettab();
    if(gd.fid !== undefined)
        $.post("/pullf/", {'csrfmiddlewaretoken': '{{ csrf_token }}', 'fid': gd.fid, 'ft':'grid'}, fileResp);
    else {
        var data = [];
        for(d in gd.data) data.push(stripSrc(gd.data[d]));
        $.post("/pullf/", {'csrfmiddlewaretoken': '{{ csrf_token }}', 'data': JSON.stringify({'data':data}), 'ft':'grid'}, fileResp);
    }
}

// ----------------------------------------------------
// Utility functions
// ----------------------------------------------------

// aggregate value v and array a (up to len)
// using function f (ie Math.min, etc)
// throwing out non-numeric values
function aggNums(f,v,a,len) {
	var r=($.isNumeric(v)) ? v : false;
	for(i=0; i<len; i++) {
	    if(!$.isNumeric(r)) r=a[i];
	    else if($.isNumeric(a[i])) r=f(r,a[i]);
	}
	return r;
}

// does the array a have mostly dates rather than numbers?
// note: some values can be neither (such as blanks, text)
// 2- or 4-digit integers can be both, so require twice as many
// dates as non-dates, to exclude cases with mostly 2 & 4 digit
// numbers and a few dates
function moreDates(a) {
    var dcnt=0, ncnt=0;
    for(var i in a) {
        if(isDateTime(a[i])) dcnt+=1;
        if($.isNumeric(a[i])) ncnt+=1;
    }
    return (dcnt>ncnt*2); 
}

// does the array look like something that should be plotted on a log axis?
// it should all be >0 or non-numeric
// then it should have a range max/min at least 100
// and at least 1/4 of distinct values <max/10
function loggy(d,ax) {
    var vals=[],v,c;
    var ax2= (ax=='x') ? 'y' : 'x';
    for(curve in d){
        c=d[curve];
        // curve has data: test each numeric point for <=0 and add if unique
        if(ax in c) {
            for(i in c[ax]) {
                v=c[ax][i];
                if($.isNumeric(v)){
                    if(v<=0) return false;
                    else if(vals.indexOf(v)<0) vals.push(v);
                }
            }
        }
        // curve has linear scaling: test endpoints for <=0 and add all points if unique
        else if((ax+'0' in c)&&('d'+ax in c)&&(ax2 in c)) {
            if((c[ax+'0']<=0)||(c[ax+'0']+c['d'+ax]*(c[ax2].length-1)<=0)) return false;
            for(i in d[curve][ax2]) {
                v=c[ax+'0']+c['d'+ax]*i;
                if(vals.indexOf(v)<0) vals.push(v);
            }
        }
    }
    // now look for range and distribution
    var mx=Math.max.apply(Math,vals), mn=Math.min.apply(Math,vals);
    return ((mx/mn>=100)&&(vals.sort()[Math.ceil(vals.length/4)]<mx/10));
}

// if isdate, convert value (or all values) from dates to milliseconds
// if islog, take the log here
function convertToAxis(o,a){
    if(a.isdate||a.islog){
        if($.isArray(o)){
            var r=[];
            for(i in o) r.push(a.isdate ? DateTime2ms(o[i]) : (o[i]>0) ? Math.log(o[i])/Math.LN10 : null);
            return r;
        }
        else return a.isdate ? DateTime2ms(o) : (o>0) ? Math.log(o)/Math.LN10 : null;
    }
    else if($.isArray(o))
        return o.map(function(d){return $.isNumeric(d) ? d : null})
    else
        return $.isNumeric(o) ? o : null;
}

// do two bounding boxes from getBoundingClientRect,
// ie {left,right,top,bottom,width,height}, overlap?
function bBoxIntersect(a,b){
    if(a.left>b.right || b.left>a.right || a.top>b.bottom || b.top>a.bottom) return false;
    return true;
}

// pad a number with zeroes, to given # of digits before the decimal point
function lpad(val,digits){ return String(val+Math.pow(10,digits)).substr(1);}

// create a copy of data, with all dereferenced src elements stripped
// so if there's xsrc present, strip out x
// needs to do this recursively because some src can be inside sub-objects
// also strip "drawing" element, which is a reference to the Raphael objects
function stripSrc(d) {
    var o={};
    for(v in d) {
        if(!(v+'src' in d)) {
            if($.isPlainObject(d[v])) o[v]=stripSrc(d[v]);
            else o[v]=d[v];
        }
    }
    return o;
}

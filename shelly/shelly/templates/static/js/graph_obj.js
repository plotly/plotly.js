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
*/

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
function plot(divid, data, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in by dom element, others by id (string)
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
	var defaultColors=['#00e','#a00','#0c0','#000']

/*  data should be an array of objects, one per trace. allowed keys:

    type: (string) scatter (default)

    x: (float array), or x0:(float) and dx:(float)
        if neither x, x0, or dx exists, defaults is x0:0, dx:1

    y: (float array), or y0:(float) and dy:(float)
        if neither y, y0, or dy exists, defaults to y0:0, dy:1
        you may provide x and/or y arrays, but not neither

    marker: (object):
        symbol: (string) circle (default)
        color: (cstring), or (cstring array)
        line: (object):
            color: (cstring), or (cstring array)
            width: (float px), default 0

    line: (object):
        color: (cstring), or (cstring array)
        width: (float px), default 1
        
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

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass non-object (null, '', whatever) for data
    var graphwasempty = (typeof gd.data==='undefined')
    if(typeof data=='object') {
        if(graphwasempty) gd.data=data;
        else gd.data.push.apply(gd.data,data);
    }

    // make the graph container and axes, if they don't already exist
    // note: if they do already exist, the new layout gets ignored (as it should)
    // unless there's no data there yet... then it should destroy and remake the plot
    if((typeof gd.layout==='undefined')||graphwasempty) newPlot(divid, layout);

    var gl=gd.layout, vb=gd.viewbox, gdd=gd.data, gp=gd.plot;
    var xa=gl.xaxis, ya=gl.yaxis, xdr=gl.xaxis.drange, ydr=gl.yaxis.drange;
    var x, xy, y, i, serieslen;
    xdr=[null,null];
    ydr=[null,null];

    //remove all existing plotted data, make the drawing containers
    for(curve in gdd) {
        if(typeof gdd[curve].drawing!=='undefined')
            for(i in gdd[curve].drawing) gdd[curve].drawing[i].remove();
        gdd[curve].drawing={};
    }

    // plot all the data
    // go through all the data twice, first for finding the range, second for plotting
    for(iter=Math.max(xa.autorange,ya.autorange)?0:1; iter<2; iter++) {
        for(curve in gdd) { 
            if('color' in gdd[curve]) color=gdd[curve].color;
            else color=defaultColors[curve % defaultColors.length];
            
            //default type is scatter
            if(!('type' in gdd[curve]) || (gdd[curve].type=='scatter')) {
                // verify that data exists, and make scaled data if necessary
                if(!('y' in gdd[curve]) && !('x' in gdd[curve])) continue; // no data!
                
                if('y' in gdd[curve]) y=gdd[curve].y;
                else if(!('y0' in gdd[curve]) && !('dy' in gdd[curve])) continue; // no scaling!
                else {
                    y=[];
                    for(i in x) y.push(gdd[curve].y0+i*gdd[curve].dy);
                }
    
                if('x' in gdd[curve]) x=gdd[curve].x;
                else if(!('x0' in gdd[curve]) && !('dx' in gdd[curve])) continue; // no scaling!
                else {
                    x=[];
                    for(i in y) x.push(gdd[curve].x0+i*gdd[curve].dx);
                }
                serieslen=Math.min(x.length,y.length);
                if(iter==0) {
                	xdr=[aggNums(Math.min,xdr[0],x,serieslen),aggNums(Math.max,xdr[1],x,serieslen)];
                	ydr=[aggNums(Math.min,ydr[0],y,serieslen),aggNums(Math.max,ydr[1],y,serieslen)];
                }
                else {
                    // lines
                    gp.setStart();
                    for(i=1; i<serieslen; i++) {
                    	if(i>0 && $.isNumeric(x[i-1]) && $.isNumeric(x[i]) &&
                    		$.isNumeric(y[i-1]) && $.isNumeric(y[i])){
                    			gp.path(Raphael.format('M{0},{1}L{2},{3}',
                        		xa.b+xa.m*x[i-1]+vb.x,ya.b+ya.m*y[i-1]+vb.y,
                        		xa.b+xa.m*x[i]+vb.x,ya.b+ya.m*y[i]+vb.y));
                        }
                    }
                    gdd[curve].drawing['lines']=gp.setFinish();
                    gdd[curve].drawing['lines'].attr({'stroke':color});
                    
                    // points
                    gp.setStart();
                    for(i=0; i<serieslen; i++) {
                    	if($.isNumeric(x[i]) && $.isNumeric(y[i]))
	                    	gp.circle(xa.b+xa.m*x[i]+vb.x,ya.b+ya.m*y[i]+vb.y,3);
                    }
                    gdd[curve].drawing['points']=gp.setFinish();
                    gdd[curve].drawing['points'].attr({'fill':color,'stroke-width':0});
                }
            }
        }
        if((iter==0) && ($.isNumeric(xdr[0]))) {
            if(xa.autorange) xa.range=[1.05*xdr[0]-0.05*xdr[1],1.05*xdr[1]-0.05*xdr[0]];
            if(ya.autorange) ya.range=[1.05*ydr[0]-0.05*ydr[1],1.05*ydr[1]-0.05*ydr[0]];
            doXTicks(gd);doYTicks(gd);doXGrid(gd);doYGrid(gd);
            gd.axdrags.toFront();
        }
    }
    return('*ta-da*')
}

// convenience function to aggregate value v and array a (up to len)
// using function f (ie Math.min, etc)
// throwing out non-numeric values
function aggNums(f,v,a,len) {
	var r=($.isNumeric(v)) ? v : null;
	for(var i=0; i<len; i++) if($.isNumeric(a[i])) r=($.isNumeric(r)) ? f(r,a[i]) : a[i];
	return r;
}

// ----------------------------------------------------
// Create the plot container and axes
// ----------------------------------------------------
function newPlot(divid, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in already by dom element
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;

    // destroy any plot that already exists in this div
    gd.innerHTML='';

    // Get the layout info (this is the defaults)
    gd.layout={title:'Damped Oscillators',
        xaxis:{range:[-5,5],tick0:0,dtick:2,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'Time',unit:'ms'},
        yaxis:{range:[-4,4],tick0:0,dtick:1,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'Response',unit:'mV'},
        width:750,
        height:500,
        margin:{l:50,r:10,t:30,b:40,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff' };
        // TODO: add font size controls, and label positioning
        // TODO: add legend
        // TODO: use hard coded one for defaults, take any new properties from input param

    // look for elements of gd.layout to replace with the equivalent elements in layout
    gd.layout=updateObject(gd.layout,layout);

    // Make the graph containers
    // We use a hack to get two nested Raphael objects (Raphael 2.0.1)
    // First one (paper) is for the axes
    var gl=gd.layout;
    gd.paper=Raphael(divid,gl.width,gl.height);
    gd.paper.gd=gd; // so any element can get gd from this.paper.gd
    gd.plotwidth=gl.width-gl.margin.l-gl.margin.r;
    gd.plotheight=gl.height-gl.margin.t-gl.margin.b;
    gd.ax=gd.paper.rect(gl.margin.l-gl.margin.pad,
        gl.margin.t-gl.margin.pad,
        gd.plotwidth+2*gl.margin.pad,
        gd.plotheight+2*gl.margin.pad);
    gd.paperDOM=gd.firstChild;
    gd.paperDOM.style['background-color']=gl.paper_bgcolor;

    // Second one (plot) is for the data
    gd.plot=Raphael(gd.paperDOM,gd.plotwidth,gd.plotheight);
    gd.plot.gd=gd; // so any element can get gd from this.paper.gd
    gd.plotDOM=gd.paperDOM.childNodes[0];
    gd.plotDOM.style.position='';
    gd.plotDOM.setAttribute('x',gl.margin.l);
    gd.plotDOM.setAttribute('y',gl.margin.t);
    gd.viewbox={x:0,y:0};
    gd.plotbg=gd.plot.rect(-screen.width,-screen.height,
        gd.plotwidth+2*screen.width,gd.plotheight+2*screen.height);
    gd.plotbg.attr({'fill':gl.plot_bgcolor,'stroke':''});
    gd.plotbg.node.style.cursor='move';

    // make the ticks, grids, and titles
    doXTicks(gd);doYTicks(gd);doXGrid(gd);doYGrid(gd);
    gl.xaxis.r0=gl.xaxis.range[0];
    gl.yaxis.r0=gl.yaxis.range[0];

    gd.xtitle=gd.paper.text((gl.width+gl.margin.l-gl.margin.r)/2,gl.height-10,
        axTitle(gl.xaxis)).attr({'font-size':14});
    gd.ytitle=gd.paper.text(20,(gl.height+gl.margin.t-gl.margin.b)/2,
        axTitle(gl.yaxis)).rotate(-90).attr({'font-size':14});
    gd.title=gd.paper.text(gl.width/2,gl.margin.t/2,gl.title).attr({'font-size':16});
    
    //make the axis drag objects
    var x0=gd.ylabels.getBBox().x;
    var x1=gd.ax.attr('x');
    var x2=x1+gd.ax.attr('width');
    var y2=gd.ax.attr('y');
    var y1=y2+gd.ax.attr('height');
    var yb=gd.xlabels.getBBox();
    var y0=yb.y+yb.height;
    
    gd.paper.setStart();
    gd.xdrag=gd.paper.rect(x1*0.9+x2*0.1,y1,(x2-x1)*0.8,y0-y1);
    gd.xdrag.node.style.cursor='ew-resize';
    gd.x0drag=gd.paper.rect(x1,y1,(x2-x1)*0.1,y0-y1);
    gd.x0drag.node.style.cursor='w-resize';
    gd.x1drag=gd.paper.rect(x1*0.1+x2*0.9,y1,(x2-x1)*0.1,y0-y1);
    gd.x1drag.node.style.cursor='e-resize';

    gd.ydrag=gd.paper.rect(x0,y2*0.9+y1*0.1,x1-x0,(y1-y2)*0.8);
    gd.ydrag.node.style.cursor='ns-resize';
    gd.y0drag=gd.paper.rect(x0,y1*0.9+y2*0.1,x1-x0,(y1-y2)*0.1);
    gd.y0drag.node.style.cursor='s-resize';
    gd.y1drag=gd.paper.rect(x0,y2,x1-x0,(y1-y2)*0.1);
    gd.y1drag.node.style.cursor='n-resize';
    
    gd.nwdrag=gd.paper.rect(x0,y2+y1-y0,x1-x0,y0-y1);
    gd.nwdrag.node.style.cursor='nw-resize';
    gd.nedrag=gd.paper.rect(x2,y2+y1-y0,x1-x0,y0-y1);
    gd.nedrag.node.style.cursor='ne-resize';
    gd.swdrag=gd.paper.rect(x0,y1,x1-x0,y0-y1);
    gd.swdrag.node.style.cursor='sw-resize';
    gd.sedrag=gd.paper.rect(x2,y1,x1-x0,y0-y1);
    gd.sedrag.node.style.cursor='se-resize';

    gd.axdrags=gd.paper.setFinish();
    gd.axdrags.attr({'stroke':'','fill':'rgba(0,0,0,0)'});

    // the 'gd's at the end become 'this' in the fcns
    gd.plotbg.drag(plotDrag,plotDragStart,resetViewBox,gd,gd,gd);

    
    gd.nwdrag.drag(nwDrag,plotDragStart,zoomEnd,gd,gd,gd);
    gd.nedrag.drag(neDrag,plotDragStart,zoomEnd,gd,gd,gd);
    gd.swdrag.drag(swDrag,plotDragStart,zoomEnd,gd,gd,gd);
    gd.sedrag.drag(seDrag,plotDragStart,zoomEnd,gd,gd,gd);

    gd.x0drag.drag(x0Drag,xDragStart,zoomEnd,gd,gd,gd);
    gd.x1drag.drag(x1Drag,xDragStart,zoomEnd,gd,gd,gd);
    gd.y0drag.drag(y0Drag,yDragStart,zoomEnd,gd,gd,gd);
    gd.y1drag.drag(y1Drag,yDragStart,zoomEnd,gd,gd,gd);

	// Remove the hover title "Raphael's object" that Raphael makes...
    gd.removeAttribute('title');    

    // some drag events need to be built by hand from mousedown, mousemove, mouseup
    // because dblclick doesn't register otherwise. Probably eventually all
    // drag events will need to be this way, once we layer on enough functions...

    // gd.mouseUp stores ms of last mouseup event on the drag bars
    // so we can check for doubleclick when we see two mouseup events within
    // gd.dblclickdelay ms 
    // gd.dragged stores whether a drag has occurred, so we don't have to
    // resetViewBox unnecessarily (ie if no move bigger than gd.mindrag pixels)
    gd.mouseUp=0;
    gd.dblclickdelay=300;
    gd.mindrag=5; 
    
    gd.xdrag.node.onmousedown = function(e) {
        xDragStart.call(gd,null,null);
        gd.dragged = false;
        window.onmousemove = function(e2) {
            gd.dragged=(Math.abs(e2.clientX-e.clientX)>gd.mindrag);
            if(gd.dragged) xDrag.call(gd,e2.clientX-e.clientX,0);
            else xDrag.call(gd,0,0);
            pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            var d=(new Date()).getTime();
            if(d-gd.mouseUp<gd.dblclickdelay) xAuto.call(gd);
            else if(gd.dragged) resetViewBox.call(gd);
            gd.mouseUp = d;
            window.onmousemove = null; window.onmouseup = null;
        }
        pauseEvent(e);
    }
    
    gd.ydrag.node.onmousedown = function(e) {
        yDragStart.call(gd,null,null);
        gd.dragged = false;
        window.onmousemove = function(e2) {
            gd.dragged=(Math.abs(e2.clientY-e.clientY)>gd.mindrag);
            if(gd.dragged) yDrag.call(gd,0,e2.clientY-e.clientY);
            else yDrag.call(gd,0,0);
            pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            var d=(new Date()).getTime();
            if(d-gd.mouseUp<gd.dblclickdelay) yAuto.call(gd);
            else if(gd.dragged) resetViewBox.call(gd);
            gd.mouseUp = d;
            window.onmousemove = null; window.onmouseup = null;
        }
        pauseEvent(e);
    }
    drawMenu(gd);
}

function drawMenu(gd, menutype){
    // add the graph menu
    var menudiv=document.createElement('div');
    $(gd).prepend(menudiv).css({'position':'relative'});
    right=3500;
    $(menudiv).css({'position':'absolute','top':0,'right':350,'z-index':5000})
    menudiv.id='mdiv-'+gd.id;
    if(menutype != 'grid' || menutype != 'script'){menutype='graph'};
    // capitalize 'script' or 'grid' or 'graph'
    menutypeupper=menutype.charAt(0).toUpperCase()+menutype.substr(1);

    menudiv.innerHTML=
	"<ul class='nav nav-pills' style='width: 50px;'><li class='dropdown' id='menu-" + gd.id + "'>" +
        "<a class='dropdown-toggle' data-toggle='dropdown' href='#menu-" + gd.id + "'>" +
        "<img src='/static/bootstrap/img/png/glyphicons_019_cogwheel.png'/>" +	
	"<b class='caret'></b></a><ul class='dropdown-menu' style='width:0px'>" +
        "<li><a href='#' onclick='save"+menutypeupper+"(\"" + gd.id + "\")'><i class='icon-download-alt'></i> Save "+menutypeupper+"</a></li>" +
        "<li><a href='#' onclick='share"+menutypeupper+"(\"" + gd.id + "\")'><i class='icon-share'></i> Share "+menutypeupper+"</a></li>" +
        //"<li><a href='http://www.stat.colostate.edu/~estep/bike/bikelaws.pdf' onclick='exportGraph()' download='oscilloscope_response'><i class='icon-download'></i> PDF Export</a></li>" +
        "<li><a href='http://ec2-107-21-79-83.compute-1.amazonaws.com/static/img/damped_oscillators.pdf' download='damped_oscillators'><i class='icon-download'></i> PDF Export</a></li>" +
        "<li class='divider'></li>" +
        "<li><a href='#' onclick='addTab(\"" + 'script' + "\")'><i class='icon-python'></i> New Script</a></li>" +
        "<li><a href='#' onclick='addTab(\"" + 'grid' + "\")'><i class='icon-th'></i> New Grid</a></li>" +
        "<li class='divider'></li>" +
        "<li><a href='#' class='cmdlntog' onclick='togCmdLn()' data-state='hide'><i class='icon-scipy'></i> Show NumPy</a></li>" +
        "<li><a href='#' class='filewelltog' onclick='togFileWell()' data-state='hide'><i class='icon-file'></i> Show Files</a></li>" +
        //"<li><a href='/remote'><i class='icon-globe'></i> Remote Sensing</a></li>" +
        //"<li><a href='/examples'><i class='icon-info-sign'></i> Examples</a></li>" +
        "</ul></li></ul>";

    return(menudiv);
}

function updateObject(i,up) {
    if(!$.isPlainObject(up)) return i;
    up.o={}; // seems like JS doesn't fully implement recursion... if I say o={} here then each level destroys the previous.
    for(key in i) {
        if(key in up) {
            if($.isPlainObject(i[key])) up.o[key]=updateObject(i[key],up[key]);
            else up.o[key]=up[key];
        }
        else up.o[key]=i[key];
    }
    return up.o;
}

// to prevent text selection during drag.
// see http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

// autoscale one axis
function xAuto() {
    this.layout.xaxis.autorange=1;
    plot(this,'','');
}

function yAuto() {
    this.layout.yaxis.autorange=1;
    plot(this,'','');
}

// ----------------------------------------------------
// Axis dragging functions
// ----------------------------------------------------

// common transform for dragging one end of an axis
// d>0 is compressing scale, d<0 is expanding
function dZoom(d) {
    if(d>=0) return 1 - Math.min(d,0.9);
    else return 1 - 1/(1/Math.max(d,-0.3)+3.222);
}

function plotDragStart(x,y) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    gx.r0=[gx.range[0],gx.range[1]];
    gy.r0=[gy.range[0],gy.range[1]];
    gx.autorange=0;gy.autorange=0;
}

function xDragStart(x,y) {
    var gx=this.layout.xaxis;
    gx.r0=[gx.range[0],gx.range[1]];
    gx.autorange=0;
}

function yDragStart(x,y) {
    var gy=this.layout.yaxis;
    gy.r0=[gy.range[0],gy.range[1]];
    gy.autorange=0;
}

function dragTail(gd) {
    doXTicks(gd);doYTicks(gd);
    doXGrid(gd);doYGrid(gd);
    gd.axdrags.toFront();
    plot(gd,'','');
}

function resetViewBox() {
    this.viewbox={x:0,y:0};
    this.plot.setViewBox(0,0,this.plotwidth,this.plotheight,false);
    this.plotbg.attr({'x':-screen.width, 'y':-screen.height})
    dragTail(this);
}

function zoomEnd() {
    //nothing to do here any more...
    var vb=this.viewbox;
}

function plotDrag(dx,dy) {
    var gx=this.layout.xaxis;
    var gy=this.layout.yaxis;
    this.viewbox={x:-dx,y:-dy};
    this.plot.setViewBox(-dx,-dy,this.plotwidth,this.plotheight,false);
    gx.range=[gx.r0[0]-dx/gx.m,gx.r0[1]-dx/gx.m];
    gy.range=[gy.r0[0]-dy/gy.m,gy.r0[1]-dy/gy.m];
    doXTicks(this);doYTicks(this);
}

function xDrag(dx,dy) {
    var gx=this.layout.xaxis;
    this.viewbox.x=-dx;
    this.plot.setViewBox(-dx,0,this.plotwidth,this.plotheight,false);
    gx.range=[gx.r0[0]-dx/gx.m,gx.r0[1]-dx/gx.m];
    doXTicks(this);
}

function yDrag(dx,dy) {
    var gy=this.layout.yaxis;
    this.viewbox.y=-dy;
    this.plot.setViewBox(0,-dy,this.plotwidth,this.plotheight,false);
    gy.range=[gy.r0[0]-dy/gy.m,gy.r0[1]-dy/gy.m];
    doYTicks(this);
}

function nwDrag(dx,dy) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    var pw=this.plotwidth, ph=this.plotheight;
    gx.range[0]=gx.r0[1]+(gx.r0[0]-gx.r0[1])/dZoom(dx/pw);
    gy.range[1]=gy.r0[0]+(gy.r0[1]-gy.r0[0])/dZoom(dy/ph);
    dragTail(this);
}

function neDrag(dx,dy) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    var pw=this.plotwidth, ph=this.plotheight;
    gx.range[1]=gx.r0[0]+(gx.r0[1]-gx.r0[0])/dZoom(-dx/pw);
    gy.range[1]=gy.r0[0]+(gy.r0[1]-gy.r0[0])/dZoom(dy/ph);
    dragTail(this);
}

function swDrag(dx,dy) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    var pw=this.plotwidth, ph=this.plotheight;
    gx.range[0]=gx.r0[1]+(gx.r0[0]-gx.r0[1])/dZoom(dx/pw);
    gy.range[0]=gy.r0[1]+(gy.r0[0]-gy.r0[1])/dZoom(-dy/ph);
    dragTail(this);
}

function seDrag(dx,dy) {
    var gx=this.layout.xaxis, gy=this.layout.yaxis;
    var pw=this.plotwidth, ph=this.plotheight;
    gx.range[1]=gx.r0[0]+(gx.r0[1]-gx.r0[0])/dZoom(-dx/pw);
    gy.range[0]=gy.r0[1]+(gy.r0[0]-gy.r0[1])/dZoom(-dy/ph);
    dragTail(this);
}

function x0Drag(dx,dy) {
    var ga=this.layout.xaxis;
    var pw=this.plotwidth;
    ga.range[0]=ga.r0[1]+(ga.r0[0]-ga.r0[1])/dZoom(dx/pw);
    dragTail(this);
}

function x1Drag(dx,dy) {
    var ga=this.layout.xaxis;
    var pw=this.plotwidth;
    ga.range[1]=ga.r0[0]+(ga.r0[1]-ga.r0[0])/dZoom(-dx/pw);
    dragTail(this);
}

function y1Drag(dx,dy) {
    var ga=this.layout.yaxis;
    var ph=this.plotheight;
    ga.range[1]=ga.r0[0]+(ga.r0[1]-ga.r0[0])/dZoom(dy/ph);
    dragTail(this);
}

function y0Drag(dx,dy) {
    var ga=this.layout.yaxis;
    var ph=this.plotheight;
    ga.range[0]=ga.r0[1]+(ga.r0[0]-ga.r0[1])/dZoom(-dy/ph);
    dragTail(this);
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, return how many digits to round tick labels to
function autoTicks(a) {
    if(a.autotick) {
        // auto ticks always start at 0
        a.tick0=0;
        var nt=10; // max number of ticks to display
        var rt=Math.abs(a.range[1]-a.range[0])/nt;
        var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
        var rtmantissa=rt/rtexp;
        
        // round tick spacing up 1-2->2, 2-5->5, 5-10->10
        if(rtmantissa>5) a.dtick=rtexp*10;
        else if(rtmantissa>2) a.dtick=rtexp*5;
        else a.dtick=rtexp*2;
    }
    //round tick labels to 2 digits past largest digit of dtick
    return Math.pow(10,2-Math.round(Math.log(a.dtick)/Math.LN10));
}

function doXTicks(gd) {
    if(typeof gd.xticks != 'undefined') {gd.xticks.remove();gd.xlabels.remove();}
    var gl=gd.layout;
    var gm=gl.margin;
    var a=gl.xaxis;
    var y1=gl.height-gm.b+gm.pad;
    
    var tickround=autoTicks(a);
    a.tickround=tickround;
    
    // ticks
    gd.paper.setStart();
    a.m=gd.plotwidth/(a.range[1]-a.range[0]);
    a.b=-a.m*a.range[0];
    a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
    for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.paper.path(Raphael.format('M{0},{1}v{2}', gm.l+a.m*x+a.b, y1, a.ticklen))}
    gd.xticks=gd.paper.setFinish();
    
    // tick labels
    gd.paper.setStart();
    for(x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.paper.text(gm.l+a.m*x+a.b, y1+a.ticklen,
            Raphael.format('\n{0}', Math.round(x*tickround)/tickround))}
    gd.xlabels=gd.paper.setFinish();
    gd.xlabels.attr({'font-size':12});
}

function doYTicks(gd) {
    if(typeof gd.yticks != 'undefined') {gd.yticks.remove();gd.ylabels.remove();}
    var gl=gd.layout;
    var gm=gl.margin;
    var a=gl.yaxis;
    var x1=gm.l-gm.pad;

    var tickround=autoTicks(a);
    
    // ticks
    gd.paper.setStart();
    a.m=gd.plotheight/(a.range[0]-a.range[1]);
    a.b=-a.m*a.range[1];
    a.tmin=Math.ceil((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
    for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.paper.path(Raphael.format('M{0},{1}h{2}', x1, gm.t+a.m*x+a.b, -a.ticklen))}
    gd.yticks=gd.paper.setFinish();

    // tick labels
    gd.paper.setStart();
    for(x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.paper.text(x1-a.ticklen, gm.t+a.m*x+a.b,
            Raphael.format('{0}',Math.round(x*tickround)/tickround))}
    gd.ylabels=gd.paper.setFinish();
    gd.ylabels.attr({'font-size':12,'text-anchor':'end'});
}

function doXGrid(gd) { // assumes doXticks has been called recently, to set m and b
    if(typeof gd.xgrid != 'undefined') {gd.xgrid.remove();}
    var a=gd.layout.xaxis;
    gd.plot.setStart();
    for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.plot.path(Raphael.format('M{0},{1}v{2}',a.m*x+a.b+gd.viewbox.x,
            gd.viewbox.y-screen.height,gd.plotheight+2*screen.height))}
    gd.xgrid=gd.plot.setFinish();
    gd.xgrid.attr({'stroke':'#ccc'}).toBack().drag(plotDrag,plotDragStart,resetViewBox,gd,gd,gd);
    gd.plotbg.toBack();
}

function doYGrid(gd) { // assumes doYticks has been called recently, to set m and b
    if(typeof gd.ygrid != 'undefined') {gd.ygrid.remove();}
    var a=gd.layout.yaxis;
    gd.plot.setStart();
    for(var x=a.tmin;x<=a.range[1];x+=a.dtick){
        gd.plot.path(Raphael.format('M{0},{1}h{2}',gd.viewbox.x-screen.width,
            a.m*x+a.b+gd.viewbox.y,gd.plotwidth+2*screen.width))}
    gd.ygrid=gd.plot.setFinish();
    gd.ygrid.attr({'stroke':'#ccc'}).toBack().drag(plotDrag,plotDragStart,resetViewBox,gd,gd,gd);
    gd.plotbg.toBack();
}

function axTitle(axis) {
    if((axis.unit=='')||(axis.unit==undefined)) return axis.title;
    else return axis.title+' ('+axis.unit+')';
}

// ----------------------------------------------------
// Script file operations
// ----------------------------------------------------

function saveScript(divid){
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(typeof gd.fileid !='string') gd.fileid='';
    txt=$('#tabs-one-line div.ui-tabs-panel:not(.ui-tabs-hide)').children('textarea').val();
    $.post("/writef/", {'txt':txt}, saveScriptResp);
}

function saveScriptResp(res){
    res=JSON.parse(res);                                                                                                                                        err=res.err;
    if(err!='') alert(err);                                                                                                                                     fn=res['fn'];                                                                                                                                               fid=res['fid'].toString(); 
    $("#privatetree").jstree("create", null, "last", {"data":fn, "attr":{"id":fid, "rel":"script"} });
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

function exportGraph() {
    //alert('filed dwnld');
}

function saveGraph(divid) {
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(typeof gd.fileid !='string') gd.fileid='';

    // jsonify the graph data and layout
    var data = [];
    for(d in gd.data) data.push(stripSrc(gd.data[d]));
    var gj = JSON.stringify({'layout':gd.layout,'data':data});
    
    // for now use the graph title as the filename
    var fn = gd.layout.title;

    $.post("/savegraph/", {'graph':gj, 'fid':gd.fileid, 'fn':fn}, saveGraphResp);
}

function saveGraphResp(res) {
    var resJ=JSON.parse(res);
    if(resJ.err != '') alert(resJ.err);
    if(resJ.fid != '') $("#privatetree").jstree("create", null, "last",
        {"data":resJ.fn, "attr":{"id":resJ.fid, "rel":"graph"} });
}

function shareGraph(divid){
    alert(divid);
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(typeof gd.fileid !='string') gd.fileid='';
    //if(gd.fileid==''){saveGraph(divid); shareGraph(divid);}
    url='http://plot.ly/'+$('#signin').text().replace(/^\s+|\s+$/g, '')+'/'+gd.fileid;
    $('#linktoshare').val(url);
    $('#linkModal').modal('toggle');
    document.getElementById("linktoshare").select();
}

// return JSON for saving the graph in gd to userdata
function graphJSON(gd) {
}

// create a copy of data, with all dereferenced src elements stripped
// so if there's xsrc present, strip out x
// needs to do this recursively because some src can be inside sub-objects
// also strip "drawing" element, which is a reference to the Raphael objects
function stripSrc(d) {
    var o={};
    for(v in d) {
        if((v!='drawing') && !(v+'src' in d)) {
            if($.isPlainObject(d[v])) o[v]=stripSrc(d[v]);
            else o[v]=d[v];
        }
    }
    return o;
}
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
// getting ready to switch to D3
var plotter='D3';
// var plotter='Raphael';

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

    //remove all existing plotted data, make the drawing containers
    for(curve in gdd) {
        if(typeof gdd[curve].drawing!=='undefined')
            for(i in gdd[curve].drawing) gdd[curve].drawing[i].remove();
        gdd[curve].drawing={};
    }

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

    // plot all the data
    // go through all the data twice, first for finding the range, second for plotting
    var calcdata=[]
    for(iter=(xa.autorange||ya.autorange||plotter=='D3')?0:1; iter<(plotter=='D3'?1:2); iter++) {
        for(curve in gdd) {
            gdc=gdd[curve];
            if('color' in gdc) color=gdc.color;
            else color=defaultColors[curve % defaultColors.length];
            
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
                if(iter==0) {
                	xdr=[aggNums(Math.min,xdr[0],x,serieslen),aggNums(Math.max,xdr[1],x,serieslen)];
                	ydr=[aggNums(Math.min,ydr[0],y,serieslen),aggNums(Math.max,ydr[1],y,serieslen)];
                    if(plotter=='D3'){
                    	var cd=[];
                    	for(i=0;i<serieslen;i++) cd.push({x:x[i],y:y[i]});
                    	cd[0].t={color:color}; // TODO: put other trace attributes here, and other point attributes above
                    	calcdata.push(cd);
                    }
                }
                else {
                    // lines
                    if(plotter=='Raphael'){
                        gp.setStart();
                        for(i=1; i<serieslen; i++) {
                            if(i>0 && $.isNumeric(x[i-1]) && $.isNumeric(x[i]) &&
                                $.isNumeric(y[i-1]) && $.isNumeric(y[i])){
                                    gp.path(Raphael.format('M{0},{1}L{2},{3}',
                                    xa.b+xa.m*x[i-1]+vb.x,ya.b+ya.m*y[i-1]+vb.y,
                                    xa.b+xa.m*x[i]+vb.x,ya.b+ya.m*y[i]+vb.y));
                            }
                        }
                        gdc.drawing['lines']=gp.setFinish();
                        gdc.drawing['lines'].attr({'stroke':color});
                        
                        // points
                        gp.setStart();
                        for(i=0; i<serieslen; i++) {
                            if($.isNumeric(x[i]) && $.isNumeric(y[i]))
                                gp.circle(xa.b+xa.m*x[i]+vb.x,ya.b+ya.m*y[i]+vb.y,3);
                        }
                        gdc.drawing['points']=gp.setFinish();
                        gdc.drawing['points'].attr({'fill':color,'stroke-width':0});
                    }
                }
            }
        }
        if((iter==0) && ($.isNumeric(xdr[0]))) {
            if(xa.autorange) xa.range=[1.05*xdr[0]-0.05*xdr[1],1.05*xdr[1]-0.05*xdr[0]];
            if(ya.autorange) ya.range=[1.05*ydr[0]-0.05*ydr[1],1.05*ydr[1]-0.05*ydr[0]];
            doXTicks(gd);doYTicks(gd);doXGrid(gd);doYGrid(gd);
            if(plotter=='Raphael') gd.axdrags.toFront();
        }
    }

    if(plotter=='D3') {
        // TODO: to start we redraw each time. later we should be able to do way better on redraws...
        gp.selectAll('g.trace').remove();
        
        var traces = gp.selectAll('g.trace')
            .data(calcdata)
            .enter().append('g')
            .attr('class','trace');

        traces.append('polyline') // TODO: break this into multiple polylines on non-numerics
            .attr('stroke',function(d){return d[0].t.color})
            .attr('stroke-width',1)
            .style('fill','none')
            .attr('points',function(d){out=''
                for(var i=0;i<d.length;i++)
                    if($.isNumeric(d[i].x)&&$.isNumeric(d[i].y))
                        out+=(xa.b+xa.m*d[i].x+vb.x)+','+(ya.b+ya.m*d[i].y+vb.y)+' ';
                return out;
            });
        
        var pointgroups=traces.append('g')
            .attr('class','points')
            .attr('stroke-width',0)
            .style('fill',function(d){return d[0].t.color});
        pointgroups.selectAll('circle')
            .data(function(d){return d})
            .enter().append('circle')
            .each(function(d){
                var x=xa.b+xa.m*d.x+vb.x, y=ya.b+ya.m*d.y+vb.y;
                if($.isNumeric(x)&&$.isNumeric(y)) // do we need to do anything with non-numeric points?
                    d3.select(this).attr('cx',x).attr('cy',y).attr('r',3);
            });
    }
}

// convenience function to aggregate value v and array a (up to len)
// using function f (ie Math.min, etc)
// throwing out non-numeric values
function aggNums(f,v,a,len) {
	var r=($.isNumeric(v)) ? v : null;
	for(var i=0; i<len; i++) if($.isNumeric(a[i])) r=($.isNumeric(r)) ? f(r,a[i]) : a[i];
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
            for(i in o) r.push(a.isdate ? DateTime2ms(o[i]) : Math.log(o[i])/Math.LN10);
            return r;
        }
        else return a.isdate ? DateTime2ms(o) : Math.log(o)/Math.LN10;
    }
    else return o;
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
    gd.layout={title:'Untitled',
        xaxis:{range:[-5,5],tick0:0,dtick:2,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'x-axis',unit:''},
        yaxis:{range:[-4,4],tick0:0,dtick:1,ticklen:5,
            autorange:1,autotick:1,drange:[null,null],
            title:'y-axis',unit:''},
        width:GRAPH_WIDTH,
        height:GRAPH_HEIGHT,
        margin:{l:50,r:10,t:30,b:40,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff' };
        // TODO: add font size controls, and label positioning
        // TODO: add legend

    // look for elements of gd.layout to replace with the equivalent elements in layout
    gd.layout=updateObject(gd.layout,layout);
    var gl=gd.layout;

    if(plotter=='Raphael') {
        // Make the graph containers
        // We use a hack to get two nested Raphael objects (Raphael 2.0.1)
        // First one (paper) is for the axes
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
    
        makeTitles(gd,''); // happens after ticks, so we can scoot titles out of the way if needed
        
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
        gd.plotbg.drag(function(dx,dy){plotDrag.call(this,dx,dy,'ns','ew')},plotDragStart,resetViewBox,gd,gd,gd);
    
        gd.nwdrag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'n','w')},plotDragStart,zoomEnd,gd,gd,gd);
        gd.nedrag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'n','e')},plotDragStart,zoomEnd,gd,gd,gd);
        gd.swdrag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'s','w')},plotDragStart,zoomEnd,gd,gd,gd);
        gd.sedrag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'s','e')},plotDragStart,zoomEnd,gd,gd,gd);
    
        gd.x0drag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'','w')},xDragStart,zoomEnd,gd,gd,gd);
        gd.x1drag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'','e')},xDragStart,zoomEnd,gd,gd,gd);
        gd.y0drag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'s','')},yDragStart,zoomEnd,gd,gd,gd);
        gd.y1drag.drag(function(dx,dy){plotDrag.call(this,dx,dy,'n','')},yDragStart,zoomEnd,gd,gd,gd);
    
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
                if(gd.dragged) plotDrag.call(gd,e2.clientX-e.clientX,0,'','ew');
                else plotDrag.call(gd,0,0,'','ew');
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
                if(gd.dragged) plotDrag.call(gd,0,e2.clientY-e.clientY,'ns','');
                else plotDrag.call(gd,0,0,'ns','');
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
    }
    else if(plotter=='D3') {
        var gd3=d3.select(gd)

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
        doXTicks(gd);doYTicks(gd);//doXGrid(gd);doYGrid(gd);
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
        var a=$('text.ytlabel').get().map(function(e){return e.getBBox().x});
        var x0=Math.min.apply(a,a); // gotta be a better way to do this...
        var y2=gl.margin.t;
        var y1=y2+gd.plotheight;
        var a=$('text.xtlabel').get().map(function(e){var bb=e.getBBox(); return bb.y+bb.height});
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
    }
    
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
        '</div>'  

    $(gd).prepend(menudiv);
    $(gd).find('.graphbar').css({'position':'absolute','left':TOOLBAR_LEFT,'top':TOOLBAR_TOP});
    $(gd).find('.btn').tooltip({'placement':'left'}).width(14);
}

function dragBox(gd,x,y,w,h,ns,ew) {
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
    
    var cursor=(ns+ew).toLowerCase()+'-resize';
    if(cursor=='nsew-resize') cursor='move';
    dragger=gd.paper.append('rect').attr('class','drag')
        .attr('x',x)
        .attr('y',y)
        .attr('width',w)
        .attr('height',h)
        .style('cursor',cursor);

    dragger.node().onmousedown = function(e) {
        if(ew) xDragStart.call(gd);
        if(ns) yDragStart.call(gd);
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
            var d=(new Date()).getTime();
            if(d-gd.mouseUp<gd.dblclickdelay) { // doubleclick event
                if(ew=='ew') xAuto.call(gd);
                if(ns=='ns') yAuto.call(gd);
            }
            else if(gd.dragged) // finish the drag
                if(ns=='ns'||ew=='ew') resetViewBox.call(gd);
                else zoomEnd.call(gd);
            gd.mouseUp = d;
            window.onmousemove = null; window.onmouseup = null;
        }
        pauseEvent(e);
    }

    return dragger;
}

function makeTitles(gd,title) {
    var gl=gd.layout;
    if(plotter=='Raphael'){
        if(title in {'':0,'xtitle':0}) {
            if(gd.xtitle) gd.xtitle.remove();
            if(gl.xaxis.title=='')
                gd.xtitle=hoverBox(gd, (gl.margin.l-gl.margin.r)/2+gl.width/4, gl.height-10-(14/2), gl.width/2, 14)
            else {
                gd.xtitle=gd.paper.text((gl.width+gl.margin.l-gl.margin.r)/2, gl.height-10, gl.xaxis.title)
                    .attr({'font-size':14});
                var titlebb=gd.xtitle.getBBox(), ticky=0, lbb;
                for(var i=0; i<gd.xlabels.length; i++){
                    lbb=gd.xlabels[i].getBBox();
                    if(Raphael.isBBoxIntersect(titlebb,lbb))
                        ticky=Math.min(Math.max(ticky,lbb.y2),gl.height-titlebb.height);
                }
                if(ticky>titlebb.y) gd.xtitle.transform('t0,'+(ticky-titlebb.y)+'...');
            }
            gd.xtitle.click(function(){autoGrowInput(gd,'xtitle', gl.xaxis, 'title', {});});
        }
        if(title in {'':0,'ytitle':0}) {
            if(gd.ytitle) gd.ytitle.remove();
            if(gl.yaxis.title=='')
                gd.ytitle=hoverBox(gd, 20-14/2, (gl.margin.t-gl.margin.b)/2+gl.height/4, 14, gl.height/2)
            else {
                gd.ytitle=gd.paper.text(20, (gl.height+gl.margin.t-gl.margin.b)/2, gl.yaxis.title)
                    .rotate(-90).attr({'font-size':14});
                var titlebb=gd.ytitle.getBBox(), tickx=gl.width, lbb;
                for(var i=0; i<gd.ylabels.length; i++){
                    lbb=gd.ylabels[i].getBBox();
                    if(Raphael.isBBoxIntersect(titlebb,lbb))
                        tickx=Math.max(Math.min(tickx,lbb.x),titlebb.width);
                }
                if(tickx<titlebb.x2) gd.ytitle.transform('t'+(tickx-titlebb.x2)+',0...');
            }
            gd.ytitle.click(function(){autoGrowInput(gd,'ytitle', gl.yaxis, 'title', {center: 0});});
        }
        if(title in {'':0,'gtitle':0}) {
            if(gd.gtitle) gd.gtitle.remove();
            if(gl.title=='')
                gd.gtitle=hoverBox(gd, gl.width/4, gl.margin.t/2-16/2, gl.width/2, 16)
            else
                gd.gtitle=gd.paper.text(gl.width/2,gl.margin.t/2,gl.title)
                    .attr({'font-size':16})
            gd.gtitle.click(function(){autoGrowInput(gd,'gtitle', gl, 'title', {});});
        }
    }
    else if(plotter=='D3'){
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
                if(!t.cont.title)
                    el.text('Click to enter '+t.name+' title')
                        .style('opacity',0)
                        .on('mouseover',function(){d3.select(this).style('opacity',0.5);})
                        .on('mouseout',function(){d3.select(this).style('opacity',0);});
                else
                    el.text(t.cont.title);
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
}

// do two bounding boxes from getBoundingClientRect,
// ie {left,right,top,bottom,width,height}, overlap?
function bBoxIntersect(a,b){
    if(a.left>b.right) return false;
    if(b.left>a.right) return false;
    if(a.top>b.bottom) return false;
    if(b.top>a.bottom) return false;
    return true;
}

function hoverBox(gd,l,t,w,h) {
    if(plotter=='Raphael'){
        var box=gd.paper.rect(l,t,w,h)
            .attr({'stroke':'','fill':'rgba(0,0,0,0)'})
            .hover(function(){this.attr('stroke','rgba(0,0,0,0.5)');},
                function(){this.attr('stroke','rgba(0,0,0,0)');});
        box.node.style.cursor='text';
    }
    else if(plotter=='D3'){
        // now in makeTitles
//         var box=gd.paper.append('rect')
//             .attr('x',l).attr('y',t).attr('width',w).attr('height',h)
//             .attr('stroke-width',0)
//             .attr('stroke','rgba(0,0,0,0)')
//             .style('cursor','text')
//             .on('mouseover',function(){d3.select(this).attr('stroke','rgba(0,0,0,0.5)');})
//             .on('mouseout',function(){d3.select(this).attr('stroke','rgba(0,0,0,0.5)');});
    }
    return box;
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

// to prevent text selection during drag.
// see http://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag
function pauseEvent(e){
    if(e.stopPropagation) e.stopPropagation();
    if(e.preventDefault) e.preventDefault();
    e.cancelBubble=true;
    e.returnValue=false;
    return false;
}

// auto-grow text input field, for editing graph items
// from http://jsbin.com/ahaxe, heavily edited
// to grow centered, set o.center!=0
// el is the raphael element containing the edited text (eg gd.xtitle)
// cont is the location the value is stored (eg gd.layout.xaxis)
// prop is the property name in that container (eg 'title')
// o is the settings for the input box (can be left blank to use defaults below)
// This is a bit ugly... but it's the only way I could find to pass in the element
// (and layout var) totally by reference...
function autoGrowInput(gd,el,cont,prop,o) {
    if(typeof el != 'string') {
        el = d3.select(el).attr('class');
        cont =  el=='xtitle' ? gd.layout.xaxis :
                el=='ytitle' ? gd.layout.yaxis : gd.layout;
        prop = 'title';
        o = el=='ytitle' ? {center: 0} : {};
    }
    if(plotter=='Raphael'){
        // if box is initially empty, it's a hover box so we can't grab its properties:
        // so make a dummy element to get the right properties; it will be deleted
        // immediately after grabbing properties.
        if($.trim(cont[prop])=='') {
            gd[el].remove();
            cont[prop]='.'; // very narrow string, so we can ignore its width
            makeTitles(gd,el);
            cont[prop]='';
        }
        
        o = $.extend({
            maxWidth: 1000,
            minWidth: 20,
            comfortZone: gd[el].attr('font-size')+3,
            center: 1
        }, o);
    
        var elTstr=gd[el].transform(),
            inbox=document.createElement('input'),
            pos=$(gd[el].node).position(),
            gpos=$(gd.paperDOM).position(),
            bbox=gd[el].getBBox(),
            posx=pos.left + gpos.left + $(gd).scrollLeft(),
            posy=pos.top + gpos.top + $(gd).scrollTop();
            // TODO: explicitly getting positions and adding scrolls seems silly...
            // gotta be a better (and less fragile) way to do this.
    
        $(gd).append(inbox);
        var input=$(inbox);
        
        input.css({
            position:'absolute',
            top: ((elTstr.length>0 && elTstr[elTstr.length-1][0]=='r' && elTstr[elTstr.length-1][1]!=0) ?
                (bbox.height-bbox.width)/2 : 0) + posy - 2,
            left: posx - 2, // shouldn't hard-code these -4's, but can't figure out how to determine them
            'z-index':6000,
            // not sure how many of these are needed, but they don't seem to hurt...
            fontSize: gd[el].attr('font-size'),
            fontFamily: gd[el].attr('font-family'),
            fontWeight: gd[el].attr('font-weight'),
            fontStyle: gd[el].attr('font-style'),
            fontStretch: gd[el].attr('font-stretch'),
            fontVariant: gd[el].attr('font-variant'),
            letterSpacing: gd[el].attr('letter-spacing'),
            wordSpacing: gd[el].attr('word-spacing')
        });
    }
    else if(plotter=='D3'){
        // if box is initially empty, it's a hover box so we can't grab its properties:
        // so make a dummy element to get the right properties; it will be deleted
        // immediately after grabbing properties.
        if($.trim(cont[prop])=='') {
            gd.paper.selectAll('.'+el).remove();
            cont[prop]='.'; // very narrow string, so we can ignore its width
            makeTitles(gd,el);
            cont[prop]='';
        }
        var el3 = gd.paper.selectAll('.'+el),eln=el3.node();
        o = $.extend({
            maxWidth: 1000,
            minWidth: 20,
            comfortZone: Number(el3.attr('font-size'))+3,
            center: 1
        }, o);
    
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
        
        input.css({
            position:'absolute',
            top: (eltrans.indexOf('rotate')>=0 ?
                (bbox.height-bbox.width)/2 : 0) + posy - 2,
            left: posx - 2, // shouldn't hard-code these -4's, but can't figure out how to determine them
            'z-index':6000,
            // not sure how many of these are needed, but they don't seem to hurt...
            fontSize: el3.attr('font-size'),
            fontFamily: el3.attr('font-family'),
            fontWeight: el3.attr('font-weight'),
            fontStyle: el3.attr('font-style'),
            fontStretch: el3.attr('font-stretch'),
            fontVariant: el3.attr('font-variant'),
            letterSpacing: el3.attr('letter-spacing'),
            wordSpacing: el3.attr('word-spacing')
        });
    }

    input.val($.trim(cont[prop]));
    var minWidth = o.minWidth || input.width(),
        val = input.val(),
        testSubject = $('<tester/>').css({
            position: 'absolute',
            top: -9999,
            left: -9999,
            width: 'auto',
            fontSize: input.css('fontSize'),
            fontFamily: input.css('fontFamily'),
            fontWeight: input.css('fontWeight'),
            fontStyle: input.css('fontStyle'),
            fontStretch: input.css('fontStretch'),
            fontVariant: input.css('fontVariant'),
            letterSpacing: input.css('letterSpacing'),
            wordSpacing: input.css('wordSpacing'),
            whiteSpace: 'nowrap'
        });
    testSubject.insertAfter(input);
    testSubject.html(escaped(val));

    input.width(Math.max(testSubject.width()*1.2+o.comfortZone,minWidth));

    var left0=input.position().left+(input.width()/2);
    
    // take away the existing one as soon as the input box is made
    if(plotter=='Raphael')
        gd[el].remove();
    else if(plotter=='D3')
        gd.paper.selectAll('.'+el).remove();
    inbox.select();
    
    input.bind('keyup keydown blur update',function(e) {
        var valold=val;
        val=input.val();
        
        // leave the input or press return: accept the change
        if((e.type=='blur') || (e.type=='keydown' && e.which==13)) {
            cont[prop]=$.trim(val);
            makeTitles(gd,el);
            input.remove();
        }
        // press escape: revert the change
        else if(e.type=='keydown' && e.which==27) {
            makeTitles(gd,el);
            input.remove();
        }
        // otherwise, if no change to val, stop
        if(val === valold) return;

        // Enter new content into testSubject
        testSubject.html(escaped(val));

        // Calculate new width + whether to change
        var newWidth = Math.max(testSubject.width()+o.comfortZone,minWidth),
            currentWidth = input.width();

        // Animate width
        if((newWidth < currentWidth && newWidth >= minWidth) || (newWidth > minWidth && newWidth < o.maxWidth)) {
            if(o.center!=0) input.css('left', left0-newWidth/2);//input.position().left+(currentWidth-newWidth)/2);
            input.width(newWidth);
        }
    });
}

function escaped(val) {
    return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\s/g, '&nbsp;');
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

function plotDragStart(x,y) { // only used by Raphael now
    xDragStart.call(this);
    yDragStart.call(this);
}

function xDragStart(x,y) {
    var gx=this.layout.xaxis;
    gx.r0=[gx.range[0],gx.range[1]];
    gx.autorange=0;
    if(plotter=='Raphael') this.plotDOM.setAttribute('preserveAspectRatio','none');
}

function yDragStart(x,y) {
    var gy=this.layout.yaxis;
    gy.r0=[gy.range[0],gy.range[1]];
    gy.autorange=0;
    if(plotter=='Raphael') this.plotDOM.setAttribute('preserveAspectRatio','none');
}

function dragTail(gd) {
    doXTicks(gd);doYTicks(gd); // TODO: plot does all of these things at the end... why do we need to do them here?
    if(plotter=='Raphael'){
        gd.axdrags.toFront();
        doXGrid(gd);doYGrid(gd);
    }
    plot(gd,'','');
}

function resetViewBox() {
    this.viewbox={x:0,y:0};
    if(plotter=='Raphael'){
        this.plot.setViewBox(0,0,this.plotwidth,this.plotheight,false);
        this.plotbg.attr({'x':-screen.width, 'y':-screen.height})
    }
    else if(plotter=='D3')
        this.plot.attr('viewBox','0 0 '+this.plotwidth+' '+this.plotheight);
    dragTail(this);
    makeTitles(this,''); // so it can scoot titles out of the way if needed
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
        if(plotter=='Raphael')
            this.plot.setViewBox(-dx,-dy,this.plotwidth,this.plotheight,false);
        else if(plotter=='D3')
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
        if(plotter=='Raphael')
            this.plotDOM.setAttribute('viewBox',
                Raphael.format('{0} {1} {2} {3}',
                    (ew=='w')?dx:0,(ns=='n')?dy:0,
                    this.plotwidth-dx,this.plotheight-dy));
        else if(plotter=='D3')
            this.plot.attr('viewBox',
                ((ew=='w')?dx:0)+' '+((ns=='n')?dy:0)+' '+
                (this.plotwidth-dx)+' '+(this.plotheight-dy));
        if(ew) doXTicks(this);
        if(ns) doYTicks(this);
    }
    else dragTail(this);
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, return how many digits to round tick labels to
// for dates, return the formatting of the tick labels, in $.datepicker format
function autoTicks(a) {
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

// pad a number with zeroes, to given # of digits before the decimal point
function lpad(val,digits){ return String(val+Math.pow(10,digits)).substr(1);}

// draw the text for one tick.
// px,py are the location on gd.paper
// prefix is there so the x axis ticks can be dropped a line
// a is the axis layout, x is the tick value
// TODO: 1,2,3 superscripts are below all the others
// TODO: move the axis labels away if they overlap the tick labels
function ticktext(gd, px, py, prefix, a, x){
    var fontSize=12; // TODO: add to layout
    if(plotter=='D3') {px=0;py=0;}
    var suffix=''; // completes the full date info, to be included with only the first tick
    var tt;
    if(a.isdate){
        var d=new Date(x);
        if(a.tickround=='y')
            tt=$.datepicker.formatDate('yy', d);
        else if(a.tickround=='m')
            tt=$.datepicker.formatDate('M yy', d);
        else {
            if(x==a.tmin) suffix='\n'+$.datepicker.formatDate('yy', d);
            if(a.tickround=='d')
                tt=$.datepicker.formatDate('M d', d);
            else if(a.tickround=='H')
                tt=$.datepicker.formatDate('M d ', d)+lpad(d.getHours(),2)+'h';
            else {
                if(x==a.tmin) suffix='\n'+$.datepicker.formatDate('M d, yy', d);
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
            tt=(Math.round(x)==0)?'1':(Math.round(x)==1)?'10':'10'+unicodeSuper(Math.round(x));
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
        if(prefix=='') px-=fontSize/4;
        else py+=fontSize/3;
    }
    if(plotter=='Raphael')
        gd.paper.text(px, py, prefix+tt+suffix).attr({'font-size':fontSize});
    else if(plotter=='D3')
        return {dx:px, dy:py, text:tt+suffix, fontSize:fontSize, x:x};
}

function unicodeSuper(num){
    var code={'-':'\u207b', '0':'\u2070', '1':'\u00b9', '2':'\u00b2',
            '3':'\u00b3', '4':'\u2074', '5':'\u2075', '6':'\u2076',
            '7':'\u2077', '8':'\u2078', '9':'\u2079'};
    var nstr=String(num),ustr='';
    for(i=0;i<nstr.length;i++) ustr+=code[nstr.charAt(i)];
    return ustr;
}

function unicodeSub(num){
    var code={'-':'\u208b', '0':'\u2080', '1':'\u2081', '2':'\u2082',
            '3':'\u2083', '4':'\u2084', '5':'\u2085', '6':'\u2086',
            '7':'\u2087', '8':'\u2088', '9':'\u2089'};
    var nstr=String(num),ustr='';
    for(i=0;i<nstr.length;i++) ustr+=code[nstr.charAt(i)];
    return ustr;
}

function doXTicks(gd) {
    var gl=gd.layout, gm=gl.margin, a=gl.xaxis, y1=gl.height-gm.b+gm.pad;
    
    autoTicks(a);
    a.m=gd.plotwidth/(a.range[1]-a.range[0]);
    a.b=-a.m*a.range[0];
    a.tmin=tickFirst(a);
    
    if(plotter=='Raphael'){
        if(typeof gd.xticks != 'undefined') {gd.xticks.remove();gd.xlabels.remove();}
        // ticks
        gd.paper.setStart();
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick)){
            gd.paper.path(Raphael.format('M{0},{1}v{2}', gm.l+a.m*x+a.b, y1, a.ticklen))}
        gd.xticks=gd.paper.setFinish();
        
        // tick labels
        gd.paper.setStart();
        for(x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick))
            ticktext(gd, gm.l+a.m*x+a.b, y1+a.ticklen, '\n', a, x);
        gd.xlabels=gd.paper.setFinish();
    }
    else if(plotter=='D3') { 
        // tick vals
        var vals=[],tvals=[];
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick)) {
            vals.push(x);
            tvals.push(ticktext(gd, 0, 0, '\n', a, x));
        }

        // ticks
        var xt=gd.axislayer.selectAll('line.xtick').data(vals);
        xt.enter().append('line').attr('class','xtick')
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('x1',gm.l)
            .attr('x2',gm.l)
            .attr('y1',y1)
            .attr('y2',y1+a.ticklen)
        xt.attr('transform',function(d){return 'translate('+(a.m*d+a.b)+',0)'});
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
        xg.attr('transform',function(d){return 'translate('+(a.m*d+a.b)+',0)'});
        xg.exit().remove();
        
        // tick labels
        var xl=gd.axislayer.selectAll('text.xtlabel').data(tvals,function(d){return d.text});
        xl.enter().append('text').attr('class','xtlabel')
            .attr('x',function(d){return d.dx+gm.l})
            .attr('y',function(d){return d.dy+y1+a.ticklen+d.fontSize})
            .each(function(d){
                var dt=d.text.split('\n'), s=d3.select(this);
                s.text(dt[0]);
                for(var i=1;i<dt.length;i++)
                    s.append('tspan')
                        .attr('x',s.attr('x'))
                        .attr('dy',1.3*d.fontSize)
                        .text(dt[i]);
            })
//             .text(function(d){return d.text})
            .attr('font-size',function(d){return d.fontSize})
            .attr('text-anchor','middle');
        xl.attr('transform',function(d){return 'translate('+(a.m*d.x+a.b)+',0)'});
        xl.exit().remove();
    };
}

function doYTicks(gd) {
    var gl=gd.layout, gm=gl.margin, a=gl.yaxis, x1=gm.l-gm.pad;

    autoTicks(a);
    a.m=gd.plotheight/(a.range[0]-a.range[1]);
    a.b=-a.m*a.range[1];
    a.tmin=tickFirst(a);
    
    if(plotter=='Raphael'){
        if(typeof gd.yticks != 'undefined') {gd.yticks.remove();gd.ylabels.remove();}
        // ticks
        gd.paper.setStart();
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick))
            gd.paper.path(Raphael.format('M{0},{1}h{2}', x1, gm.t+a.m*x+a.b, -a.ticklen));
        gd.yticks=gd.paper.setFinish();
    
        // tick labels
        gd.paper.setStart();
        for(x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick))
            ticktext(gd, x1-a.ticklen, gm.t+a.m*x+a.b, '', a, x);
        gd.ylabels=gd.paper.setFinish();
        gd.ylabels.attr({'text-anchor':'end'});
    }
    else if(plotter=='D3') {
        // tick vals
        var vals=[],tvals=[];
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick)) {
            vals.push(x);
            tvals.push(ticktext(gd, 0, 0, '', a, x));
        }
        
        // ticks
        var yt=gd.axislayer.selectAll('line.ytick').data(vals);
        yt.enter().append('line').attr('class','ytick')
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('x1',x1)
            .attr('x2',x1-a.ticklen)
            .attr('y1',gm.t)
            .attr('y2',gm.t);
        yt.attr('transform',function(d){return 'translate(0,'+(a.m*d+a.b)+')'});
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
        yg.attr('transform',function(d){return 'translate(0,'+(a.m*d+a.b)+')'});
        yg.exit().remove();
        
        // tick labels
        var yl=gd.axislayer.selectAll('text.ytlabel').data(tvals,function(d){return d.text});
        yl.enter().append('text').attr('class','ytlabel')
            .attr('x',function(d){return d.dx+x1-a.ticklen})
            .attr('y',function(d){return d.dy+gm.t+d.fontSize/2})
            .text(function(d){return d.text})
            .attr('font-size',function(d){return d.fontSize})
            .attr('text-anchor','end');
        yl.attr('transform',function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'});
        yl.exit().remove();

    };
}

 // only used by Raphael now
function doXGrid(gd) { // assumes doXticks has been called recently, to set m and b
    var a=gd.layout.xaxis, o;
    if(plotter=='Raphael'){
        if(typeof gd.xgrid != 'undefined') {gd.xgrid.remove();}
        gd.plot.setStart();
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick)){
            o=gd.plot.path(Raphael.format('M{0},{1}v{2}',a.m*x+a.b+gd.viewbox.x,
                gd.viewbox.y-screen.height,gd.plotheight+2*screen.height));
            if(typeof(a.dtick)=='string' && a.dtick.charAt(0)=='D' && mod(x+0.01,1)>0.1)
                o.attr({'stroke-dasharray':'. '});
        }
        gd.xgrid=gd.plot.setFinish();
        gd.xgrid.attr({'stroke':'#ccc'}).toBack()//.drag(plotDrag,plotDragStart,resetViewBox,gd,gd,gd);
        gd.plotbg.toBack();
    }
    else if(plotter=='D3') { // for D3 we take care of this in ticks
    };
}

 // only used by Raphael now
function doYGrid(gd) { // assumes doYticks has been called recently, to set m and b
    var a=gd.layout.yaxis, o;
    if(plotter=='Raphael'){
        if(typeof gd.ygrid != 'undefined') {gd.ygrid.remove();}
        gd.plot.setStart();
        for(var x=a.tmin;x<=a.range[1];x=tickIncrement(x,a.dtick)){
            o=gd.plot.path(Raphael.format('M{0},{1}h{2}',gd.viewbox.x-screen.width,
                a.m*x+a.b+gd.viewbox.y,gd.plotwidth+2*screen.width));
            if(typeof(a.dtick)=='string' && a.dtick.charAt(0)=='D' && mod(x+0.01,1)>0.1)
                o.attr({'stroke-dasharray':'. '});
        }
        gd.ygrid=gd.plot.setFinish();
        gd.ygrid.attr({'stroke':'#ccc'}).toBack()//.drag(plotDrag,plotDragStart,resetViewBox,gd,gd,gd);
        gd.plotbg.toBack();
    }
    else if(plotter=='D3') { // for D3 we take care of this in ticks
    };
}

function axTitle(axis) {
    if((axis.unit=='')||(axis.unit==undefined)) return axis.title;
    else return axis.title+' ('+axis.unit+')';
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

function shareGraph(divid){
    //var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    //if(typeof gd.fid !='string') gd.fid='';
    gd=gettab();
    if(gd.fid===undefined){
        gd.fid='';
    }
    if(gd.fid==''){
        saveGraph(divid);
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

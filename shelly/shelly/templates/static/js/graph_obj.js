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

    mode: (string) 'lines','markers','lines+markers'
        default 'lines+markers' for <20 points, else 'lines'

    line: {
        dash: (string) default 'solid', also 'dot', 'dash', 'longdash', 'dashdot', 'longdashdot',
            all of the above dashes based on linewidth, can also pass in explicit dasharray
        color: (cstring), or (cstring array)
        width: (float px) default 2
    }

    marker: {
        symbol: (string) default 'circle', or (string array)
            can also be 'square', 'triangle-[up|down|left|right]', 'cross'
        size: (float px) default 6, or (float array)
        color: (cstring), or (cstring array)
        line {
            color: (cstring), or (cstring array)
            width: (float px) default 0, or (float array)
        }
    }

    text: (string array) hover text for each point

    name: <string for legend>

    cstring is a string with any valid HTML color
    marker and linecolor will copy each other if only one is present
    if neither is provided, choose one from a default set based on the trace number
    if markerlinecolor is missing it will copy linecolor ONLY if it's different from marker color, otherwise black.

    eventually I'd like to make all of the marker and line properties accept arrays
    to modify properties point-by-point

    any array also has a corresponding src attribute, ie xsrc for x
    this is a string:
    	<id>/<colname> for your own data,
    	<user>/<id>/<colname> for shared data

*/

GRAPH_HEIGHT = 450;
GRAPH_WIDTH = 700;
TOOLBAR_LEFT = '40px';
TOOLBAR_TOP = '-30px';
PTS_LINESONLY = 20;
DBLCLICKDELAY = 600; // ms between first mousedown and 2nd mouseup to constitute dblclick
MINDRAG = 5; // pixels to move mouse before you stop clamping to starting point

// var defaultColors=['#00e','#a00','#0c0','#000','#888'];

var defaultColors=['#00e', //blue
                   '#a00', //red
                   '#6fa8dc', //lite blue
                   '#ffd966', //goldenrod
                   '#ff00ff', //elektrik purple
                   '#9900ff', //moody purple
                   '#0c0', // brite green
                   '#000']; // black

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
function plot(divid, data, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in by dom element, others by id (string)
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
	// test if this is on the main site or embedded
	gd.mainsite=Boolean($('#plotlyMainMarker').length);

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

    // enable or disable formatting buttons
    $(gd).find('.data-only').attr('disabled', !gd.data || gd.data.length==0);

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
    gd.calcdata=[];
    for(curve in gdd) {
        var gdc=gdd[curve];
        var cd=[];
        //if(!('color' in gdc)) gdc.color = defaultColors[curve % defaultColors.length];
        if(!('name' in gdc)) {
            if('ysrc' in gdc) {
                var ns=gdc.ysrc.split('/')
                gdc.name=ns[ns.length-1].replace(/\n/g,' ');
            }
            else gdc.name='trace '+curve;
        }

        //default type is scatter
        if(!('type' in gdc) || (gdc.type=='scatter')) {
            // verify that data exists, and make scaled data if necessary
            if(!('y' in gdc) && !('x' in gdc)) continue; // no data!

            // ignore as much processing as possible (and including in autorange) if trace is not visible
            if(gdc.visible!=false) {
                if('y' in gdc) y=convertToAxis(gdc.y,ya);
                else {
                    v0 = ('y0' in gdc) ? convertToAxis(gdc.y0, ya) : 0;
                    dv = ('dy' in gdc) ? convertToAxis(gdc.dy, ya) : 1;
                    y=[];
                    for(i in x)
                        y.push(v0+i*dv);
                }

                if('x' in gdc) x=convertToAxis(gdc.x,xa);
                else {
                    v0 = ('x0' in gdc) ? convertToAxis(gdc.x0, xa) : 0;
                    dv = ('dx' in gdc) ? convertToAxis(gdc.dx, xa) : 1;
                    x=[];
                    for(i in y)
                        x.push(v0+i*dv);
                }

                serieslen = Math.min(x.length,y.length);
                if(xa.autorange)
                    xdr = [aggNums(Math.min,xdr[0],x,serieslen),aggNums(Math.max,xdr[1],x,serieslen)];
                if(ya.autorange)
                    ydr = [aggNums(Math.min,ydr[0],y,serieslen),aggNums(Math.max,ydr[1],y,serieslen)];
                // create the "calculated data" to plot
                for(i=0;i<serieslen;i++)
                    cd.push(($.isNumeric(x[i]) && $.isNumeric(y[i])) ? {x:x[i],y:y[i]} : {x:false, y:false});
            }
            // even if trace is not visible, need to figure out whether there are enough points to trigger auto-no-lines
            else if(gdc.mode || ((!gdc.x || gdc.x.length<PTS_LINESONLY) && (!gdc.y || gdc.y.length<PTS_LINESONLY)))
                cd=[{x:false, y:false}];
            else
                for(i=0; i<PTS_LINESONLY+1; i++) cd.push({x:false, y:false});
            // add the trace-wide properties to the first point, per point properties to every point
            // t is the holder for trace-wide properties, start it with the curve num from gd.data
            // in case some curves don't plot
            cd[0].t={curve:curve};
            if(!('line' in gdc)) gdc.line={};
            if(!('marker' in gdc)) gdc.marker={};
            if(!('line' in gdc.marker)) gdc.marker.line={};

            gd.calcdata.push(cd);
        }
    }
//     console.log(gd.calcdata);
    // put the styling info into the calculated traces
    // has to be done separate from applyStyles so we know the mode (ie which objects to draw)
    setStyles(gd);

    // autorange... if axis is currently reversed, preserve this.
    var a0 = 0.05, // 5% extension of plot scale beyond last point
        a1 = 1+a0;
    if(xa.autorange && $.isNumeric(xdr[0])) {
        if(xa.range && xa.range[1]<xa.range[0])
            xa.range=[a1*xdr[1]-a0*xdr[0],a1*xdr[0]-a0*xdr[1]];
        else
            xa.range=[a1*xdr[0]-a0*xdr[1],a1*xdr[1]-a0*xdr[0]];
    }
    if(ya.autorange && $.isNumeric(ydr[0])) {
        if(ya.range && ya.range[1]<ya.range[0])
            ya.range=[a1*ydr[1]-a0*ydr[0],a1*ydr[0]-a0*ydr[1]];
        else
            ya.range=[a1*ydr[0]-a0*ydr[1],a1*ydr[1]-a0*ydr[0]];
//         ya.range=[1.05*ydr[0]-0.05*ydr[1],1.05*ydr[1]-0.05*ydr[0]];
    }

    doTicks(gd);

    if(!$.isNumeric(vb.x) || !$.isNumeric(vb.y)) {
        gd.viewbox={x:0, y:0};
        vb=gd.viewbox;
    }

    if($.isNumeric(xa.m) && $.isNumeric(xa.b) && $.isNumeric(ya.m) && $.isNumeric(ya.b)) {
        var xf=function(d){return d3.round(xa.b+xa.m*d.x+vb.x,2)};
        var yf=function(d){return d3.round(ya.b+ya.m*d.y+vb.y,2)};
        // now plot the data
        // TODO: to start we redraw each time. later we should be able to do way better on redraws...
        gp.selectAll('g.trace').remove();

        var traces = gp.selectAll('g.trace')
            .data(gd.calcdata)
          .enter().append('g')
            .attr('class','trace');

        traces.each(function(d){
            if(d[0].t.mode.indexOf('lines')==-1 || d[0].t.visible==false) return;
            var i=-1,t=d3.select(this);
            while(i<d.length) {
                var pts='';
                for(i++; i<d.length && $.isNumeric(d[i].x) && $.isNumeric(d[i].y); i++)
                    pts+=xf(d[i])+','+yf(d[i])+' ';
                if(pts)
                    t.append('polyline').attr('points',pts);
            }
        });

        traces.append('g')
            .attr('class','points')
            .each(function(d){
                var t=d[0].t;
                if(t.mode.indexOf('markers')==-1 || d[0].t.visible==false) return;
                d3.select(this).selectAll('path')
                    .data(function(d){return d})
                  .enter().append('path')
                    .each(function(d){
                        if($.isNumeric(d.x) && $.isNumeric(d.y))
                            d3.select(this)
                                .attr('transform','translate('+xf(d)+','+yf(d)+')');
                        else d3.select(this).remove();
                    });
            });

        //styling separate from drawing
        applyStyle(gp);
    }
    else
        console.log('error with axis scaling',xa.m,xa.b,ya.m,ya.b);

    // show the legend
    if(gl.showlegend || (gd.calcdata.length>1 && gl.showlegend!=false))
        legend(gd);
}

// set display params per trace to default or provided value
function setStyles(gd) {
    for(var i in gd.calcdata){
        var cd = gd.calcdata[i], c = cd[0].t.curve, gdc = gd.data[c];
        // mergeattr puts single values into cd[0].t, and all others into each individual point
        mergeattr(cd,gdc.visible,'visible',[true]);
        mergeattr(cd,gdc.mode,'mode',[(cd.length>=PTS_LINESONLY) ? 'lines' : 'lines+markers']);
        mergeattr(cd,gdc.line.dash,'ld',['solid']);
        mergeattr(cd,gdc.line.color,'lc',[gdc.marker.color, defaultColors[c % defaultColors.length]]);
        mergeattr(cd,gdc.line.width,'lw',[2]);
        mergeattr(cd,gdc.marker.symbol,'mx',['circle']);
        mergeattr(cd,gdc.marker.size,'ms',[6]);
        mergeattr(cd,gdc.marker.color,'mc',[cd[0].t.lc]);
        mergeattr(cd,gdc.marker.line.color,'mlc',[((cd[0].t.lc!=cd[0].t.mc) ? cd[0].t.lc : '#000')]);
        mergeattr(cd,gdc.marker.line.width,'mlw',[0]);
        mergeattr(cd,gdc.text,'tx',['']);
        mergeattr(cd,gdc.name,'name',['trace '+c]);
    }
}

function applyStyle(gp) {
    gp.selectAll('g.points')
        .call(pointGroupStyle)
        .each(function(d){d3.select(this).selectAll('path')
            .call(pointStyle,d[0].t);})
    gp.selectAll('g.trace polyline')
        .call(lineGroupStyle);
}

// merge object a (which may be an array or a single value) into o...
// search the array defaults in case a is missing (and for a default val
// if some points of o are missing from a)
function mergeattr(o,a,attr,defaults) {
    if($.isArray(a)) {
        var l=Math.max(o.length,a.length);
        for(var i=0; i<l; i++) o[i][attr]=a[i];
        o[0].t[attr]=defaults[defaults.length-1];
    }
    else if(typeof a != 'undefined')
        o[0].t[attr]=a;
    else {
        for(var i=0; i<defaults.length; i++) {
            if(typeof defaults[i] != 'undefined') {
                o[0].t[attr]=defaults[i];
                break
            }
        }
    }
}

// styling functions for plot elements

function lineGroupStyle(s) {
    s.attr('stroke-width',function(d){return d[0].t.lw})
    .attr('stroke',function(d){return d[0].t.lc;})
    .style('fill','none')
    .attr('stroke-dasharray',function(d){
        var da=d[0].t.ld,lw=Math.max(d[0].t.lw,3);
        if(da=='solid') return '';
        if(da=='dot') return lw+','+lw;
        if(da=='dash') return (3*lw)+','+(3*lw);
        if(da=='longdash') return (5*lw)+','+(5*lw);
        if(da=='dashdot') return (3*lw)+','+lw+','+lw+','+lw;
        if(da=='longdashdot') return (5*lw)+','+(2*lw)+','+lw+','+(2*lw);
        return da; // user writes the dasharray themselves
    });
}

function pointGroupStyle(s) {
    s.each(function(d) {
        var w=d[0].t.mlw;
        d3.select(this).attr('stroke-width',w);
        if(w) d3.select(this).attr('stroke',d[0].t.mlc);
    })
    .style('fill',function(d){return d[0].t.mc});
}

function pointStyle(s,t) {
    s.attr('d',function(d){
        var r=((d.ms+1 || t.ms+1 || d.t.ms+1)-1)/2,rt=r*2/Math.sqrt(3),rc=r/3,rd=r*Math.sqrt(2);
        var x=(d.mx || t.mx || d.t.mx);
        if(x=='square')
            return 'M'+r+','+r+'H'+(-r)+'V'+(-r)+'H'+r+'Z';
        if(x=='diamond')
            return 'M'+rd+',0L0,'+rd+'L'+(-rd)+',0L0,'+(-rd)+'Z';
        if(x=='triangle-up')
            return 'M'+(-rt)+','+(r/2)+'H'+rt+'L0,'+(-r)+'Z';
        if(x=='triangle-down')
            return 'M'+(-rt)+','+(-r/2)+'H'+rt+'L0,'+r+'Z';
        if(x=='triangle-right')
            return 'M'+(-r/2)+','+(-rt)+'V'+rt+'L'+r+',0Z';
        if(x=='triangle-left')
            return 'M'+(r/2)+','+(-rt)+'V'+rt+'L'+(-r)+',0Z';
        if(x=='cross')
            return 'M'+r+','+rc+'H'+rc+'V'+r+'H'+(-rc)+'V'+rc+'H'+(-r)+'V'+(-rc)+'H'+(-rc)+'V'+(-r)+'H'+rc+'V'+(-rc)+'H'+r+'Z'
        // circle is default
        return 'M'+r+',0A'+r+','+r+' 0 1,1 0,'+(-r)+'A'+r+','+r+' 0 0,1 '+r+',0Z';

    })
}

// TODO: rework plot and newplot so restyle and relayout don't have to completely redraw
// change style in an existing plot
// astr is the attr name, like 'marker.symbol'
// val is the new value to use
// traces is a trace number or an array of trace numbers to change (blank for all)
function restyle(gd,astr,val,traces) {
    if($.isNumeric(traces)) traces=[traces];
    else if(!$.isArray(traces) || !traces.length) {
        traces=[];
        for(var i=0; i<gd.data.length; i++) traces.push(i);
    }
    var aa=astr.split('.');
    for(i=0; i<traces.length; i++) {
        var cont=gd.data[traces[i]];
        for(var j=0; j<aa.length-1; j++) cont=cont[aa[j]];
        cont[aa[j]]=val;
    }
    // need to replot if mode or visibility changes, because the right objects don't exist
    if(['mode','visible'].indexOf(astr)>=0)
        plot(gd,'','');
    else {
        setStyles(gd);
        applyStyle(gd.plot);
        if($(gd).find('.legend').length)
            legend(gd);
    }
}

// change layout in an existing plot
// astr and val are like restyle, or 2nd arg can be an object {astr1:val1, astr2:val2...}
function relayout(gd,astr,val) {
//     console.log('relayout',gd,astr,val);
    var gl = gd.layout, aobj = {};
    if(typeof astr == 'string')
        aobj[astr] = val;
    else if($.isPlainObject(astr))
        aobj = astr;
    // look for ?axis, split out into all axes
    var keys = Object.keys(aobj),
        axes = ['xaxis','yaxis'];
    for(var i=0; i<keys.length; i++) {
        if(keys[i].indexOf('allaxes')==0) {
            for(var j=0; j<axes.length; j++) {
                if(!aobj[keys[i].replace('allaxes',axes[j])])
                    aobj[keys[i].replace('allaxes',axes[j])] = aobj[keys[i]];
            }
            delete aobj[keys[i]];
        }
    }

    // alter gd.layout
    for(var i in aobj) {
        // check whether to disable autosize or autorange
        if((i=='height' || i=='width') && !aobj.autosize)
            gl.autosize=false;
        var m = i.match(/^(.)axis\.range\[[0|1]\]$/);
        if(m && m.length==2)
            gl[m[1]+'axis'].autorange=false;

        var aa = i.split('.');
        // toggling log without autorange: need to also recalculate ranges
        if(aa[1]=='islog'  && !gl[aa[0]].isdate && !gl[aa[0]].autorange &&
            (gl[aa[0]].islog ? !val : val)) { // logical XOR (ie will islog actually change)
            var r0 = gl[aa[0]].range[0],
                r1 = gl[aa[0]].range[1];
            if(val) {
                if(r0<0 && r1<0) { r0=0.1; r1=100} // if both limits are negative, go for a default
                else if(r0<0) r0 = r1/1000; // if one is negative, set it to 1/1000 the other. TODO: find the smallest positive val?
                else if(r1<0) r1 = r0/1000;
                if(!(aa[0]+'.range[0]' in aobj)) gl[aa[0]].range[0] = Math.log(r0)/Math.LN10;
                if(!(aa[0]+'.range[1]' in aobj)) gl[aa[0]].range[1] = Math.log(r1)/Math.LN10;
            }
            else {
                if(!(aa[0]+'.range[0]' in aobj)) gl[aa[0]].range[0] = Math.pow(10, r0);
                if(!(aa[0]+'.range[1]' in aobj)) gl[aa[0]].range[1] = Math.pow(10, r1);
            }
        }
        nestedProperty(gl,i).set(aobj[i]);
    }

    // calculate autosizing
    if(aobj.autosize) aobj=plotAutoSize(gd,aobj);

    // replot
    var ak = Object.keys(aobj);
    if(ak.length) { // check if there's anything to do
        // can we avoid a full redraw?
        // check for specific changes we can do more simply
        var legendonly = true;
        ak.forEach(function(v){
            if(v.split('.')[0].indexOf('legend')==-1) legendonly = false;
        })
        if(legendonly) {
            gd.paper.selectAll('.legend').remove();
            if(gl.showlegend)
                legend(gd);
            return;
        }

        gd.layout = undefined; // force plot to redo the layout
        plot(gd,'',gl);
    }
}

// convert a string (such as 'xaxis.range[0]')
// representing a property of nested object o
// into set and get methods
function nestedProperty(o,s) {
    var cont = o,
        aa = s.split('.');
    for(var j=0; j<aa.length-1; j++)
        cont = cont[aa[j]];
    var indexed = aa[j].match(/([^\[\]]*)\[([0-9]*)\]/);
    if(indexed) {
        cont = cont[indexed[1]];
        var prop = Number(indexed[2]);
    }
    else
        var prop = aa[j];

    return {set:function(v){cont[prop]=v},
            get:function(){return cont[prop]}};
}

function plotAutoSize(gd,aobj) {
    var plotBB = gd.paper.node().getBoundingClientRect();
    var gdBB = gd.getBoundingClientRect();
    var ftBB = $('#filetab')[0].getBoundingClientRect();
    var newheight = Math.round(gdBB.bottom-plotBB.top);
    var newwidth = Math.round((ftBB.width ? ftBB.left : gdBB.right) - plotBB.left);
    if(Math.abs(gd.layout.width-newwidth)>1 || Math.abs(gd.layout.height-newheight)>1) {
        gd.layout.height = newheight;
        gd.layout.width = newwidth;
    }
    else { // if there's no size change, update layout but don't need to redraw
        delete(aobj.autosize);
        gd.layout.autosize = true;
    }
    return aobj
}

// check whether to resize a tab (if it's a plot) to the container
function plotResize(gd) {
    if(gd.tabtype=='plot' && gd.layout && gd.layout.autosize)
        setTimeout(function(){
            relayout(gd, {autosize:true});
            if(LIT) {
                hidebox();
                litebox();
            }
        }, 500);
}

// ----------------------------------------------------
// Create the plot container and axes
// ----------------------------------------------------
// TODO: check structure (?) to make faster selector queries when there's lots of data in the graph
function newPlot(divid, layout) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in already by dom element
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(!layout) layout={};
    // destroy any plot that already exists in this div
    gd.innerHTML='';
	// test if this is on the main site or embedded
	gd.mainsite=Boolean($('#plotlyMainMarker').length);

    if(gd.mainsite) {
        // ------------------------------------------------------------ graphing toolbar
        var menudiv =
            '<div class="graphbar btn-toolbar">'+
                // save
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="saveGraph();" rel="tooltip" title="Save Changes">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_342_hdd.png"/>&nbsp;Save'+
                    '</a>'+
                '</div>'+
                // show in grid
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="graphToGrid()" rel="tooltip" title="Show graph data">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_155_show_thumbnails.png"/>&nbsp;Data'+
                    '</a>'+
                '</div>'+
                // upload a file
                '<div class="btn-group">'+
                    '<form id="fileupload" action="/writef/" method="POST" enctype="multipart/form-data">'+
                        '<span class="btn fileinput-button toolbar_anchor" rel="tooltip" title="Upload Data to Graph">'+
                            '<img src="/static/img/glyphicons_201_upload.png"></img>&nbsp;Upload'+
                            '<input type="file" name="fileToUpload" id="fileToUpload'+gettab().id+'" onchange="fileSelected();"/>'+
                        '</span>'+
                    '</form>'+
                '</div>'+
                // export png or pdf
                '<div class="btn-group graphbar_drop">'+
                    '<a class="btn dropdown-toggle toolbar_anchor" data-toggle="dropdown">'+
                        '<span class="pull-left">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_200_download.png"></img>'+
                            '&nbsp;PDF&nbsp;'+
                        '</span>'+
                        '<span class="caret pull-left"></span>'+
                    '</a>'+
                    '<ul class="dropdown-menu pull-left">'+
                        '<li><a onclick="pdfexport(\'pdf\')">'+
                            '<img src="/static/img/pdf.png"/>'+
                            '&nbsp;Download PDF</a>'+
                        '</li>'+
                        '<li><a onclick="pdfexport(\'png\')">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_159_picture.png"/>'+
                            '&nbsp;Download PNG</a>'+
                        '</li>'+
                    '</ul>'+
                '</div>'+
                // help
                '<div class="btn-group graphbar_drop">'+
                    '<a class="btn dropdown-toggle toolbar_anchor" data-toggle="dropdown">'+
                        '<span class="pull-left">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_195_circle_info.png"></img>'+
                            '&nbsp;Help&nbsp;'+
                        '</span>'+
                        '<span class="caret pull-left"></span>'+
                    '</a>'+
                    '<ul class="dropdown-menu pull-left">'+
                        '<li><a href="/gallery" target="_blank">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_154_show_big_thumbnails.png"/>'+
                            '&nbsp;Graph Gallery</a>'+
                        '</li>'+                     
                        '<li><a onclick="litebox()">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_064_lightbulb.png"/>'+
                            '&nbsp;Graph Tips</a>'+
                        '</li>'+
                        '<li><a href="/33">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_220_play_button.png"/>'+
                            '&nbsp;Graph Demo</a>'+
                        '</li>'+                        
                        '<li><a href="/faq" target="_blank">'+
                            '<img src="/static/bootstrap/img/png/glyphicons_194_circle_question_mark.png"/>'+
                            '&nbsp;FAQ</a>'+
                        '</li>'+                        
                    '</ul>'+
                '</div>'+                                
                // style traces
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="styleBox(gettab(),this)" rel="tooltip" title="Format Traces">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_151_edit.png"/>&nbsp;Traces'+
                    '</a>'+
                '</div>'+
                // style layout
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="layoutBox(gettab(),this)" rel="tooltip" title="Edit Layout">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_099_vector_path_all.png"/>&nbsp;Layout'+
                    '</a>'+
                '</div>'+
                // style axes
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="axesBox(gettab(),this)" rel="tooltip" title="Style Axes">'+
                        '<img src="/static/img/axes.png"/>&nbsp;Axes'+
                    '</a>'+
                '</div>'+
                // legend
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="legendBox(gettab(),this)" rel="tooltip" title="Setup Legend">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_156_show_thumbnails_with_lines.png"/>&nbsp;Legend'+
                    '</a>'+
                '</div>'+
                // dashboard
                '<div class="btn-group">'+
                    '<a class="btn toolbar_anchor" onclick="showurls()" rel="tooltip" title="Graph Dashboard">'+
                        '<img src="/static/bootstrap/img/png/glyphicons_331_dashboard.png"/>&nbsp;Dash'+
                    '</a>'+
                '</div>'+
                // share
                '<div class="btn-group">'+
                    '<a class="btn google_button" onclick="shareGraph(gettab());" rel="tooltip" title="Share graph by URL">'+
                        '<img src="/static/img/lil_share_white.png"/>&nbsp;Share'+
                    '</a>'+
                '</div>'+
	        '</div>';
        $(gd).prepend(menudiv);
        $(gd).find('.btn').tooltip({placement:'bottom', delay:{show:700}});
    }
//     else { // not mainsite, ie embedded - disable autosize
//         gl.autosize=false;
//     }

    // Get the layout info (this is the defaults)
    gd.layout={title:'Click to enter Plot title',
        xaxis:{range:[-1,6],
            tick0:0,dtick:2,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',
            showticklabels:true,
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,drange:[null,null],
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter X axis title',unit:''},
        yaxis:{range:[-1,4],
            tick0:0,dtick:1,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',
            showticklabels:true,
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,drange:[null,null],
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter Y axis title',unit:''},
        legend:{bgcolor:'#fff',bordercolor:'#000',borderwidth:1},
        width:GRAPH_WIDTH,
        height:GRAPH_HEIGHT,
        autosize:'initial', // after initial autosize reverts to true
        margin:{l:70,r:40,t:60,b:60,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff' };
        // TODO: add font size controls, and label positioning
        // TODO: add legend controls

    // look for elements of gd.layout to replace with the equivalent elements in layout
    gd.layout=updateObject(gd.layout,layout);

    var gl=gd.layout, gd3=d3.select(gd)

    // initial autosize
    if(gl.autosize=='initial') {
        gd.paper=gd3.append('svg')
            .attr('width',gl.width)
            .attr('height',gl.height);
        plotAutoSize(gd,{});
        gd.paper.remove();
        gl.autosize=true;
    }

    // adjust margins for outside legends
    var ml = gl.margin.l-(gd.lw<0 ? gd.lw : 0),
        mr = gl.margin.r+(gd.lw>0 ? gd.lw : 0),
        mt = gl.margin.t+(gd.lh>0 ? gd.lh : 0),
        mb = gl.margin.b-(gd.lh<0 ? gd.lh : 0),
        mp = gl.margin.pad;

    // Make the graph containers
    // First svg (paper) is for the axes
    gd.paper=gd3.append('svg')
        .attr('width',gl.width)
        .attr('height',gl.height)
        .style('background-color',gl.paper_bgcolor);
    gd.plotwidth=gl.width-ml-mr;
    gd.plotheight=gl.height-mt-mb;
    gd.plotbg=gd.paper.append('rect')
        .attr('x',ml-mp)
        .attr('y',mt-mp)
        .attr('width',gd.plotwidth+2*mp)
        .attr('height',gd.plotheight+2*mp)
        .style('fill',gl.plot_bgcolor)
        .attr('stroke','black')
        .attr('stroke-width',1);

    // make the ticks, grids, and titles
    gd.axislayer=gd.paper.append('g').attr('class','axislayer');
    doTicks(gd);
    gl.xaxis.r0=gl.xaxis.range[0];
    gl.yaxis.r0=gl.yaxis.range[0];

    makeTitles(gd,''); // happens after ticks, so we can scoot titles out of the way if needed

    // Second svg (plot) is for the data
    gd.plot=gd.paper.append('svg')
        .attr('x',ml)
        .attr('y',mt)
        .attr('width',gd.plotwidth)
        .attr('height',gd.plotheight)
        .attr('preserveAspectRatio','none')
        .style('fill','none');
    gd.viewbox={x:0,y:0};

    //make the axis drag objects
    var x1 = ml,
        x2 = x1+gd.plotwidth,
        a = $(gd).find('text.ytick').get().map(function(e){return e.getBBox().x}),
        x0 = a.length ? Math.min.apply(a,a) : x1-10,
        y2 = mt,
        y1 = y2+gd.plotheight,
        a = $(gd).find('text.xtick').get().map(function(e){var bb=e.getBBox(); return bb.y+bb.height}),
        y0 = a.length ? Math.max.apply(a,a) : y1+10;

    // drag box goes over the grids and data... we can use just this hover for all data hover effects)
    dragBox(gd, x1, y2, x2-x1, y1-y2,'ns','ew');

    dragBox(gd, x1*0.9+x2*0.1, y1,(x2-x1)*0.8, y0-y1,'','ew');
    dragBox(gd, x1, y1, (x2-x1)*0.1, y0-y1,'','w');
    dragBox(gd, x1*0.1+x2*0.9, y1, (x2-x1)*0.1, y0-y1,'','e');

    dragBox(gd, x0, y2*0.9+y1*0.1, x1-x0, (y1-y2)*0.8,'ns','');
    dragBox(gd, x0, y1*0.9+y2*0.1, x1-x0, (y1-y2)*0.1,'s','');
    dragBox(gd, x0, y2, x1-x0, (y1-y2)*0.1,'n','');

    dragBox(gd, x0, y2+y1-y0, x1-x0, y0-y1,'n','w');
    dragBox(gd, x2, y2+y1-y0, x1-x0, y0-y1,'n','e');
    dragBox(gd, x0, y1, x1-x0, y0-y1,'s','w');
    dragBox(gd, x2, y1, x1-x0, y0-y1,'s','e');

    gd3.selectAll('.drag')
        .style('fill','black')
        .style('opacity',0)
        .attr('stroke-width',0);
}

// ----------------------------------------------------
// Axis dragging functions
// ----------------------------------------------------

function dragBox(gd,x,y,w,h,ns,ew) {
    // mouseDown stores ms of first mousedown event in the last DBLCLICKDELAY ms on the drag bars
    // and numClicks stores how many mousedowns have been seen within DBLCLICKDELAY
    // so we can check for click or doubleclick events
    // dragged stores whether a drag has occurred, so we don't have to
    // resetViewBox unnecessarily (ie if no move bigger than MINDRAG pixels)
    var mouseDown=0,
        numClicks=1,
        gx = gd.layout.xaxis,
        gy = gd.layout.yaxis,
        cursor = (ns+ew=='nsew') ? 'move' : (ns+ew).toLowerCase()+'-resize',
        dragger = gd.paper.append('rect').classed('drag',true)
            .classed(ns+ew+'drag',true)
            .attr('x',x)
            .attr('y',y)
            .attr('width',w)
            .attr('height',h)
            .style('cursor',cursor)
          .node();

    dragger.onmousedown = function(e) {
        if(dragClear(gd)) return true; // deal with other UI elements, and allow them to cancel dragging

        var d=(new Date()).getTime();
        if(d-mouseDown<DBLCLICKDELAY)
            numClicks+=1; // in a click train
        else { // new click train
            numClicks=1;
            mouseDown=d;
        }


        if(e.altKey || e.ctrlKey || e.metaKey)
            console.log('alt, ctrl, meta (cmd) click functionality not defined');
        else if(ns+ew=='nsew' && !e.shiftKey) // in the main plot area, unmodified drag makes a zoombox
            zoomBox(e);
        else
            dragRange(e);
        pauseEvent(e);
    }

    function zoomBox(e){
        var gbb = $('.nsewdrag')[0].getBoundingClientRect(),
            x0 = e.clientX,
            y0 = e.clientY;
        $('<div class="zoombox" style="left: '+x0+'px; top: '+y0+'px;"></div>').appendTo('body');
        window.onmousemove = function(e2) {
            var x1 = Math.max(gbb.left,Math.min(gbb.right,e2.clientX)),
                y1 = Math.max(gbb.top,Math.min(gbb.bottom,e2.clientY));
            $('.zoombox').css({
                left: Math.min(x0,x1)+'px',
                top: Math.min(y0,y1)+'px',
                width: Math.abs(x0-x1)+'px',
                height: Math.abs(y0-y1)+'px'
            });
            $('.zoombox').addClass(tinycolor(gd.layout.plot_bgcolor).toHsl().l>0.3 ? 'dark' : 'light');
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null;
            window.onmouseup = null;
            var zbb = $('.zoombox')[0].getBoundingClientRect();
            if(Math.min(zbb.height,zbb.width)<MINDRAG*2) {
                if((new Date()).getTime()-mouseDown<DBLCLICKDELAY && numClicks==2) { // double click
                    gx.autorange=true;
                    gy.autorange=true;
                    plot(gd,'','');
                }
                return finishZB();
            }
            $('<div class="modal-backdrop fade" id="zoomboxbackdrop"></div>'+
                '<div class="open" id="zoomboxmenu"><ul class="dropdown-menu">'+
                    '<li><a id="zoomboxin">Zoom In</a></li>'+
                    '<li><a id="zoomboxout">Zoom Out</a></li>'+
                '</ul></div>').appendTo('body');
            var mbb = $('#zoomboxmenu ul')[0].getBoundingClientRect();
            $('#zoomboxmenu ul').css({
                left:Math.min(e2.clientX,gbb.right-mbb.width)+'px',
                top:Math.min(e2.clientY,gbb.bottom-mbb.height)+'px',
                'z-index':20001
            });
            $('#zoomboxbackdrop')[0].onclick = finishZB;
            $('#zoomboxin')[0].onclick = function(){
                gx.range=[gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.left-gbb.left)/gbb.width,
                          gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.right-gbb.left)/gbb.width];
                gy.range=[gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.bottom)/gbb.height,
                          gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.top)/gbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            }
            $('#zoomboxout')[0].onclick = function(){
                gx.range=[(gx.range[0]*(zbb.right-gbb.left)+gx.range[1]*(gbb.left-zbb.left))/zbb.width,
                          (gx.range[0]*(zbb.right-gbb.right)+gx.range[1]*(gbb.right-zbb.left))/zbb.width];
                gy.range=[(gy.range[0]*(gbb.bottom-zbb.top)+gy.range[1]*(zbb.bottom-gbb.bottom))/zbb.height,
                          (gy.range[0]*(gbb.top-zbb.top)+gy.range[1]*(zbb.bottom-gbb.top))/zbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            }
        }

        function finishZB(){
            $('.zoombox,#zoomboxbackdrop,#zoomboxmenu').remove();
        }
    }

    function dragRange(e){
        if(ew) {
            gx.r0=[gx.range[0],gx.range[1]];
            gx.autorange=false;
        }
        if(ns) {
            gy.r0=[gy.range[0],gy.range[1]];
            gy.autorange=false;
        }
        gd.dragged = false;
        window.onmousemove = function(e2) {
            // clamp tiny drags to the origin
            gd.dragged=(( (!ns) ? Math.abs(e2.clientX-e.clientX) :
                    (!ew) ? Math.abs(e2.clientY-e.clientY) :
                    Math.abs(e2.clientX-e.clientX)+Math.abs(e2.clientY-e.clientY)
                ) > MINDRAG);
            // execute the drag
            if(gd.dragged)
                plotDrag(e2.clientX-e.clientX,e2.clientY-e.clientY,ns,ew);
            else plotDrag(0,0,ns,ew);
            pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null;
            window.onmouseup = null;
            if(gd.dragged) // finish the drag
                resetViewBox();
            else if((new Date()).getTime()-mouseDown<DBLCLICKDELAY) {
                if(numClicks==2) { // double click
                    if(ew=='ew')
                        gx.autorange=true;
                    if(ns=='ns')
                        gy.autorange=true;
                    if(ns=='ns'||ew=='ew')
                        plot(gd,'','');
                }
                else if(numClicks==1) { // single click
                    if(['n','s','e','w'].indexOf(ns+ew)>=0)// click on ends of ranges
                        autoGrowInput(gd,dragger);
                }
            }
        }
    }

    function plotDrag(dx,dy,ns,ew) {
        var pw = gd.plotwidth,
            ph = gd.plotheight;
        if(ew=='ew'||ns=='ns') {
            if(ew) {
                gd.viewbox.x=-dx;
                gx.range=[gx.r0[0]-dx/gx.m,gx.r0[1]-dx/gx.m];
                doTicks(gd,'x');
            }
            if(ns) {
                gd.viewbox.y=-dy;
                gy.range=[gy.r0[0]-dy/gy.m,gy.r0[1]-dy/gy.m];
                doTicks(gd,'y');
            }
            gd.plot.attr('viewBox',(ew ? -dx : 0)+' '+(ns ? -dy : 0)+' '+pw+' '+ph);
            return;
        }

        if(ew=='w') {
            gx.range[0]=gx.r0[1]+(gx.r0[0]-gx.r0[1])/dZoom(dx/pw);
            dx=pw*(gx.r0[0]-gx.range[0])/(gx.r0[0]-gx.r0[1]);
        }
        else if(ew=='e') {
            gx.range[1]=gx.r0[0]+(gx.r0[1]-gx.r0[0])/dZoom(-dx/pw);
            dx=pw*(gx.r0[1]-gx.range[1])/(gx.r0[1]-gx.r0[0]);
        }
        else if(!ew)
            dx=0;

        if(ns=='n') {
            gy.range[1]=gy.r0[0]+(gy.r0[1]-gy.r0[0])/dZoom(dy/ph);
            dy=ph*(gy.r0[1]-gy.range[1])/(gy.r0[1]-gy.r0[0]);
        }
        else if(ns=='s') {
            gy.range[0]=gy.r0[1]+(gy.r0[0]-gy.r0[1])/dZoom(-dy/ph);
            dy=ph*(gy.r0[0]-gy.range[0])/(gy.r0[0]-gy.r0[1]);
        }
        else if(!ns)
            dy=0;

        gd.plot.attr('viewBox', ((ew=='w')?dx:0)+' '+((ns=='n')?dy:0)+' '+(pw-dx)+' '+(ph-dy));
        if(ew) doTicks(gd,'x');
        if(ns) doTicks(gd,'y');
    }

    // common transform for dragging one end of an axis
    // d>0 is compressing scale, d<0 is expanding
    function dZoom(d) {
        if(d>=0)
            return 1 - Math.min(d,0.9);
        else
            return 1 - 1/(1/Math.max(d,-0.3)+3.222);
    }

    function resetViewBox() {
        gd.viewbox={x:0,y:0};
        gd.plot.attr('viewBox','0 0 '+gd.plotwidth+' '+gd.plotheight);
        dragTail(gd);
    }
}

function dragTail(gd) {
    doTicks(gd); // TODO: plot does this again at the end... why do we need to do them here?
    plot(gd,'','');
}

// ----------------------------------------------------
// Titles and text inputs
// ----------------------------------------------------

function makeTitles(gd,title) {
    var gl=gd.layout;
    var titles={
        'xtitle':{x: (gl.width+gl.margin.l-gl.margin.r-(gd.lw ? gd.lw : 0))/2,
            y: gl.height+(gd.lh<0 ? gd.lh : 0) - 14*0.75,
            w: gd.plotwidth/2, h: 14,
            cont: gl.xaxis, fontSize: 14, name: 'X axis',
            transform: '', attr: {}},
        'ytitle':{x: 20-(gd.lw<0 ? gd.lw : 0),
            y: (gl.height+gl.margin.t-gl.margin.b+(gd.lh ? gd.lh : 0))/2,
            w: 14, h: gd.plotheight/2,
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
            if(gd.mainsite)
                el.on('click',function(){autoGrowInput(gd,this)});

            var txt=t.cont.title;
            if(txt.match(/^Click to enter (Plot|X axis|Y axis) title$/))
                if(gd.mainsite) el.style('fill','#999'); // cues in gray
                else txt=''; // don't show cues in embedded plots

            if(txt)
                el.each(function(){styleText(this,txt+ (!t.cont.unit ? '' : (' ('+t.cont.unit+')')))});
            else if(gd.mainsite)
                el.text('Click to enter '+t.name+' title')
                    .style('opacity',1)
                    .on('mouseover',function(){d3.select(this).transition().duration(100).style('opacity',1);})
                    .on('mouseout',function(){d3.select(this).transition().duration(1000).style('opacity',0);})
                  .transition()
                    .duration(2000)
                    .style('opacity',0);
            else el.remove();

            // move labels out of the way, if possible, when tick labels interfere
            var titlebb=el[0][0].getBoundingClientRect(), gdbb=gd.paper.node().getBoundingClientRect();
            if(k=='xtitle'){
                var labels=gd.paper.selectAll('text.xtick')[0], ticky=0;
                for(var i=0;i<labels.length;i++){
                    var lbb=labels[i].getBoundingClientRect();
                    if(bBoxIntersect(titlebb,lbb))
                        ticky=Math.min(Math.max(ticky,lbb.bottom),gdbb.bottom-titlebb.height);
                }
                if(ticky>titlebb.top)
                    el.attr('transform','translate(0,'+(ticky-titlebb.top)+') '+el.attr('transform'));
            }
            if(k=='ytitle'){
                var labels=gd.paper.selectAll('text.ytick')[0], tickx=screen.width;
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

function legend(gd) {
    var gl=gd.layout,gm=gl.margin;
    gl.showlegend = true;
    if(!gl.legend) gl.legend={};
    var gll = gl.legend;
    gd.paper.selectAll('.legend').remove();
    if(!gd.calcdata) return;

    var ldata=[]
    for(var i=0;i<gd.calcdata.length;i++) {
        if(gd.calcdata[i][0].t.visible!=false)
            ldata.push([gd.calcdata[i][0]]);
    }

    gd.legend=gd.paper.append('svg')
        .attr('class','legend');

    var bordercolor = gl.legend.bordercolor ? gl.legend.bordercolor : '#000',
        borderwidth = gl.legend.borderwidth ? gl.legend.borderwidth : 1,
        bgcolor = gl.legend.bgcolor ? gl.legend.bgcolor : (gl.paper_bgcolor ? gl.paper_bgcolor : '#fff');
    gd.legend.append('rect')
        .attr('class','bg')
        .attr('stroke',bordercolor)
        .attr('stroke-width',borderwidth)
        .style('fill',bgcolor)
        .attr('x',1)
        .attr('y',1);

    var traces = gd.legend.selectAll('g.traces')
        .data(ldata);
    traces.enter().append('g').attr('class','trace');

    traces.each(legendLines);
    traces.each(legendPoints);
    var tracetext=traces.call(legendText).selectAll('text');
    if(gd.mainsite)
        tracetext.on('click',function(){autoGrowInput(gd,this)});

    // add the legend elements, keeping track of the legend size (in px) as we go
    var legendwidth=0, legendheight=0;
    traces.each(function(d){
        var g=d3.select(this), t=g.select('text'), l=g.select('.legendpoints');
        if(d[0].t.showinlegend===false) {
            g.remove();
            return;
        }
        var tbb = t.node().getBoundingClientRect();
        if(!l.node()) l=g.select('polyline');
        var lbb = (!l.node()) ? tbb : l.node().getBoundingClientRect();
        t.attr('y',(lbb.top+lbb.bottom-tbb.top-tbb.bottom)/2);
        var gbb = this.getBoundingClientRect();
        legendwidth = Math.max(legendwidth,tbb.width);
        g.attr('transform','translate('+(borderwidth/2)+','+(5+borderwidth/2+legendheight+gbb.height/2)+')');
        legendheight += gbb.height+3;
    });
    legendwidth += 45+borderwidth;
    legendheight += 10+borderwidth;

    // now position the legend. for both x,y the positions are recorded as fractions
    // of the plot area (left, bottom = 0,0). Outside the plot area is allowed but
    // position will be clipped to the plot area. Special values +/-100 auto-increase
    // the margin to put the legend entirely outside the plot area on the high/low side.
    // Otherwise, values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction
    var pw = gl.width-gm.l-gm.r,
        ph = gl.height-gm.t-gm.b;
    // defaults... the check for >10 and !=100 is to remove old style positioning in px
    if(!$.isNumeric(gll.x) || (gll.x>10 && gll.x!=100)) gll.x=0.98;
    if(!$.isNumeric(gll.y) || (gll.y>10 && gll.y!=100)) gll.y=0.98;

    var lx = gm.l+pw*gll.x,
        ly = gm.t+ph*(1-gll.y),
        pad = 3; // px of padding if legend is outside plot

    // don't let legend be outside plot in both x and y... that would just make big blank
    // boxes. Put the legend centered in y if we somehow get there.
    if(Math.abs(gll.x)==100 && Math.abs(gll.y)==100) gll.y=0.5;

    if(gll.x==-100) {
        lx=pad;
        if(gd.lw!=-legendwidth-2*pad) { // if we haven't already, redraw with extra margin
            gd.lw=-legendwidth-2*pad; // make gd.lw to tell newplot how much extra margin to give
            relayout(gd,'margin.l',gm.l); // doesn't change setting, just forces redraw
            return;
        }
    }
    else if(gll.x==100) {
        lx=gl.width-legendwidth-pad;
        if(gd.lw!=legendwidth+2*pad) {
            gd.lw=legendwidth+2*pad;
            relayout(gd,'margin.r',gm.r);
            return;
        }
    }
    else {
        if(gd.lw) {
            delete gd.lw;
            relayout(gd,'margin.r',gm.r);
            return;
        }
        if(gll.x>2/3) lx -= legendwidth;
        else if(gll.x>1/3) lx -= legendwidth/2;
    }

    if(gll.y==-100) {
        ly=gl.height-legendheight-pad;
        if(gd.lh!=-legendheight-2*pad) {
            gd.lh=-legendheight-2*pad;
            relayout(gd,'margin.b',gm.b);
            return;
        }
    }
    else if(gll.y==100) {
        ly=pad+16; // Graph title goes above legend regardless. TODO: get real title size
        if(gd.lh!=legendheight+2*pad) {
            gd.lh=legendheight+2*pad;
            relayout(gd,'margin.t',gm.t);
            return;
        }
    }
    else {
        if(gd.lh) {
            delete gd.lh;
            relayout(gd,'margin.t',gm.t);
            return;
        }
        if(gll.y<1/3) ly -= legendheight;
        else if(gll.y<2/3) ly -= legendheight/2;
    }

    // push the legend back onto the page if it extends off, making sure if nothing else
    // that the top left of the legend is visible
    if(lx+legendwidth>gl.width) lx=gl.width-legendwidth;
    if(lx<0) lx=0;
    if(ly+legendheight>gl.height) ly=gl.height-legendheight;
    if(ly<0) ly=0;

    gd.legend.attr('x',lx)
        .attr('y',ly)
        .attr('width',legendwidth)
        .attr('height',legendheight);
    gd.legend.selectAll('.bg')
        .attr('width',legendwidth-2)
        .attr('height',legendheight-2);
    // user dragging the legend
    // aligns left/right/center on resize or new text if drag pos
    // is in left 1/3, middle 1/3, right 1/3
    // choose left/center/right align via:
    //  xl=(left-ml)/plotwidth, xc=(center-ml/plotwidth), xr=(right-ml)/plotwidth
    //  if(xl<2/3-xc) gll.x=xl;
    //  else if(xr>4/3-xc) gll.x=xr;
    //  else gll.x=xc;
    gd.legend.node().onmousedown = function(e) {
        if(dragClear(gd)) return true; // deal with other UI elements, and allow them to cancel dragging

        var eln=this, el3=d3.select(this);
        var x0=Number(el3.attr('x')), y0=Number(el3.attr('y'));
        var xf=undefined, yf=undefined;
        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY;
            if(Math.abs(dx)<MINDRAG) dx=0;
            if(Math.abs(dy)<MINDRAG) dy=0;
            el3.attr('x',x0+dx)
                .attr('y',y0+dy);
            var pbb = gd.paper.node().getBoundingClientRect();
            // drag to within a couple px of edge to take the legend outside the plot
            if(e2.clientX>pbb.right-3*MINDRAG || (gd.lw>0 && dx>-MINDRAG))
                xf=100;
            else if(e2.clientX<pbb.left+3*MINDRAG || (gd.lw<0 && dx<MINDRAG))
                xf=-100;
            else {
                var xl=(x0+dx-gm.l+(gd.lw<0 ? gd.lw : 0))/(gl.width-gm.l-gm.r-(gd.lw ? Math.abs(gd.lw) : 0)),
                    xr=xl+legendwidth/(gl.width-gm.l-gm.r),
                    xc=(xl+xr)/2;
                if(xl<(2/3)-xc) xf=xl;
                else if(xr>4/3-xc) xf=xr;
                else xf=xc;
            }
            if(e2.clientY>pbb.bottom-3*MINDRAG || (gd.lh<0 && dy>-MINDRAG))
                yf=-100;
            else if(e2.clientY<pbb.top+3*MINDRAG || (gd.lh>0 && dy<MINDRAG))
                yf=100;
            else {
                var yt=(y0+dy-gm.t-(gd.lh>0 ? gd.lh : 0))/(gl.height-gm.t-gm.b-(gd.lh ? Math.abs(gd.lh) : 0)),
                    yb=yt+legendheight/(gl.height-gm.t-gm.b),
                    yc=(yt+yb)/2;
                if(yt<(2/3)-yc) yf=1-yt;
                else if(yb>4/3-yc) yf=1-yb;
                else yf=1-yc;
            }
            // now set the mouse cursor so user can see how the legend will be aligned
            var csr='';
            if(Math.abs(xf)==100) csr='col-resize';
            else if(Math.abs(yf)==100) csr='row-resize';
            else if(xf<1/3) {
                if(yf<1/3) csr='sw-resize';
                else if(yf<2/3) csr='w-resize';
                else csr='nw-resize';
            }
            else if(xf<2/3) {
                if(yf<1/3) csr='s-resize';
                else if(yf<2/3) csr='move';
                else csr='n-resize';
            }
            else {
                if(yf<1/3) csr='se-resize';
                else if(yf<2/3) csr='e-resize';
                else csr='ne-resize';
            }
            $(eln).css('cursor',csr);
            pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            $(eln).css('cursor','');
            if(xf===undefined || yf===undefined) return;
            relayout(gd,{'legend.x':xf,'legend.y':yf});
        }
    }
}

// since our drag events cancel event bubbling, need to explicitly deal with other elements
function dragClear(gd) {
    // explicitly disable dragging when a popover is present
    if($('.popover').length) return true;
    // because we cancel event bubbling, input won't receive its blur event.
    // TODO: anything else we need to manually bubble? any more restricted way to cancel bubbling?
    if(gd.input) gd.input.trigger('blur');
    return false;
}

// Make a new popover in div gd at overall pos ({x,y} or {left,top,width,height}
// as from getBoundingClientRect, or a DOM element, will call getBoundingClientRect on it)
// uses cls for styling the popover and calls contentfn(($)popover, contentarg) to fill it
function newPopover(gd,pos,cls,contentfn,contentarg) {
    if($('.popover.'+cls).length) // if this popover is already showing, quit so it will hide
        return;
    hidebox(); // hide the litebox.
    // if pos is a DOM element, get its position
    if(typeof pos.getBoundingClientRect=='function') {
        $(pos).tooltip('hide'); // first check for a tooltip on this element to hide
                                // this doesn't work perfectly... if it's in its show delay, it will still show.
        pos=pos.getBoundingClientRect();
    }
    if(!('x' in pos)) pos.x=pos.left+(pos.width/2);
    if(!('y' in pos)) pos.y=pos.top+pos.height;

    // make the container
    // using Bootstrap popovers for styling, but not their actions...
    // initially put it at 0,0, then fix once we know its size
    // the <br /> feels like a total hack... still don't get why this doesn't work with <div>
    var popover=$(
        '<div class="popover bottom editbox '+cls+'" style="top:0px;left:0px;display:block;">'+
            '<div class="arrow"></div>'+
            '<div class="popover-inner">'+
                '<div class="popover-title"><div></div><br /></div>'+
                '<div class="popover-content"><div></div><br /></div>'+
            '</div>'+
        '</div>').appendTo('body');
    popover[0].gd=gd;

    // fill the popover
    contentfn(popover,contentarg);
    // store the draw function for use after changing values
    popover[0].redraw = function(){contentfn(popover)};

    // fix positioning
    var pbb=popover[0].getBoundingClientRect(); // popover, at initial position
    var wbb=$('#tabs-one-line').get(0).getBoundingClientRect(); // whole window
    var newtop=pos.y-pbb.top;
    var maxtop=wbb.top+wbb.height-pbb.height;
    var newleft=pos.x-pbb.left-(pbb.width/2);
    var maxleft=wbb.left+wbb.width-pbb.width;
    popover.css({top:Math.min(newtop, maxtop)+'px', left:Math.min(newleft, maxleft)+'px'});
    // if box is not where it wanted to be, take off the arrow because it's not pointing to anything
    if(newleft>=maxleft || newtop>=maxtop) popover.find('.arrow').remove();

    // add interactions
    window.onmouseup = function(e) {
        // see http://stackoverflow.com/questions/1403615/use-jquery-to-hide-a-div-when-the-user-clicks-outside-of-it
        // need to separately check for colorpicker clicks, as spectrum doesn't make them children of the popover
        // and need to separately kill the colorpickers and tooltips for the same reason
        if(popover.has(e.target).length===0 && $(e.target).parents('.sp-container').length===0) {
            window.onmouseup = null;
            popover.find('.pickcolor').spectrum('destroy');
            popover.find('input').tooltip('destroy');
            popover.remove();
        }
    }
}

// make a styling popover starting with trace tracenum
// use tracenum=-1 for all traces, defaults to first trace
function styleBox(gd,pos,tracenum) {
    if(tracenum==undefined) tracenum=0;
    if(!gd.data){
        console.log('no data to style',gd);
        return; // TODO: disable item unless data is present
    }
    newPopover(gd,pos,'stylebox',styleBoxTraces,tracenum)
}

function styleBoxTraces(popover,tracenum){
    // same ldata as legend plus first item, 'all traces'
    // also makes short name for traces from ysrc
    var tDefault = {name:'',lc:'#000',ld:'solid',lw:1,mc:'#000',mlc:'#000',mlw:0,
                visible:true, mode:'lines+markers',ms:6,mx:'circle',tx:''};
    var ldata = (popover[0].gd.calcdata.length<2) ? [] :
        tModify(tDefault,{name:'All Traces', mode:'none', visible:null});
    for(var i=0; i<popover[0].gd.calcdata.length; i++) {
        var o = stripSrc(popover[0].gd.calcdata[i][0]);
        var tn = popover[0].gd.data[i].ysrc;
        o.t.name = (tn ? tn : 'Trace '+i)
            .replace(/[\s\n\r]+/gm,' ')
            .replace(/^([A-z0-9\-_]+[\/:])?[0-9]+[\/:]/,'');
        ldata.push([o]);
    }
//     console.log(ldata);
    // look for attributes that are equal for all traces, set the 'all traces' val if found
    if(ldata.length>2) {
        var attrs=Object.keys(tDefault);
        for(a in tDefault) {
            var v_equal=true;
            for(i=2; i<ldata.length; i++)
                if(ldata[i][0].t[a]!=ldata[1][0].t[a]) v_equal=false;
            if(v_equal)
                ldata[0][0].t[a]=ldata[1][0].t[a];
        }
    }

    // make the trace selector dropdown (after removing any previous)
    styleBoxDrop(popover.find('.popover-title>div').html(''),'trace',selectTrace,'',ldata);

    // select the desired trace (and build the attribute selectors)
    // choose all (or the only trace) if tracenum is invalid
    if(tracenum>=ldata.length-1 || tracenum<-1) tracenum=-1;
    selectTrace.call(popover.find('.select-trace li').get(0),ldata[tracenum+1],tracenum+1);
}

function selectTrace(d,i){
    var popover=$(this).parents('.popover'),
        menu=$(this).parents('.btn-group');
    menu.find('.selected-val').html(menu.find('li')[i].innerHTML);

    // save the selection value for later use
    popover[0].selectedTrace=i-1;

    // remove previous attribute selectors (spectra get destroyed separately because
    // they're not children of popover)
    if($('.sp-container').length)
        popover.find('.pickcolor').spectrum('destroy');
    var attrs = popover.find('.popover-content').html('<div class="col1"></div><div class="col2"></div><br />'),
        a1 = attrs.find('.col1'),
        a2 = attrs.find('.col2');

    // make each of the attribute selection dropdowns
    pickOption(a1,'visible','Visible?',selectPick,d[0].t.visible,
        [{name:'Show',val:true},{name:'Hide',val:false}]);
    a1.append('<div class="newline"></div>');
    styleBoxDrop(a1,'mode',selectAttr,'Mode',d,
        tModify(d[0].t,[
            {mode:'lines',name:''},
            {mode:'markers',name:''},
            {mode:'lines+markers',name:''}]));
    a1.append('<div class="newline"></div>');
    styleBoxDrop(a1,'ld',selectAttr,'Line',d,
        tModify(d[0].t,[
            {mode:'lines',name:'',ld:'solid'},
            {mode:'lines',name:'',ld:'dot'},
            {mode:'lines',name:'',ld:'dash'},
            {mode:'lines',name:'',ld:'longdash'},
            {mode:'lines',name:'',ld:'dashdot'},
            {mode:'lines',name:'',ld:'longdashdot'}]));
    popover.find('.select-ld svg')
        .attr('width','70')
      .find('polyline')
        .attr('points','5,0 65,0');
    pickColor(a1,'lc',selectColor,'... Color','Line Color',d[0].t.lc);
    styleBoxDrop(a1,'lw',selectAttr,'... Width',d,
        tModify(d[0].t,[
            {mode:'lines',lw:0.5,name:'0.5'},
            {mode:'lines',lw:1,name:'1'},
            {mode:'lines',lw:2,name:'2'},
            {mode:'lines',lw:3,name:'3'},
            {mode:'lines',lw:4,name:'4'},
            {mode:'lines',lw:6,name:'6'}]));
    styleBoxDrop(a2,'mx',selectAttr,'Marker',d,
        tModify(d[0].t,[
            {mode:'markers',name:'',mx:'circle'},
            {mode:'markers',name:'',mx:'square'},
            {mode:'markers',name:'',mx:'cross'},
            {mode:'markers',name:'',mx:'triangle-up'},
            {mode:'markers',name:'',mx:'triangle-down'},
            {mode:'markers',name:'',mx:'triangle-left'},
            {mode:'markers',name:'',mx:'triangle-right'}]));
    pickColor(a2,'mc',selectColor,'... Color','Marker Color',d[0].t.mc);
    styleBoxDrop(a2,'ms',selectAttr,'... Size',d,
        tModify(d[0].t,[
            {mode:'markers',ms:2,name:'2'},
            {mode:'markers',ms:3,name:'3'},
            {mode:'markers',ms:4,name:'4'},
            {mode:'markers',ms:6,name:'6'},
            {mode:'markers',ms:8,name:'8'},
            {mode:'markers',ms:12,name:'12'},
            {mode:'markers',ms:16,name:'16'}]));
    styleBoxDrop(a2,'mlw',selectAttr,'... Line width',d,
        tModify(d[0].t,[
            {mode:'markers',mlw:0,name:'0'},
            {mode:'markers',mlw:0.5,name:'0.5'},
            {mode:'markers',mlw:1,name:'1'},
            {mode:'markers',mlw:2,name:'2'},
            {mode:'markers',mlw:3,name:'3'}]));
    pickColor(a2,'mlc',selectColor,'... Line color','Marker Line Color',d[0].t.mlc);
}

// routine for making modified-default attribute lists
function tModify(tDefault,o){
    if($.isPlainObject(o)) o=[o];
    var out=[];
    for(i in o) {
        var outi={}
        for(el in tDefault) outi[el] = (el in o[i]) ? o[i][el] : tDefault[el];
        out.push([{t:outi}]);
    }
    return out;
}

// pick from a button group
function pickOption(s,cls,title,clickfn,val,opts){
    var pick = '<div class="pickoption '+cls+'">'+
            ((title) ? ('<div class="pull-left editboxtitle">'+title+'</div>') : '')+
            '<div class="btn-group pull-left">';
    for(var i=0; i<opts.length; i++) {
        pick += '<button class="btn editboxbutton '+opts[i].name+(val==opts[i].val ? ' disabled' : '')+'">'+
            opts[i].name+'</button>';
    }
    pick += '</div></div>';
    s.append(pick);
    opts.forEach(function(o){
        $(s).find('.'+o.name).click({attr:cls,val:o.val},clickfn);
    });
}

// html for a bootstrap dropdown with class cls
function dropdown(cls,title){
    return '<div class="editboxselector '+cls+'">'+
        ((title) ? ('<div class="pull-left editboxtitle">'+title+'</div>') : '')+
        '<div class="btn-group pull-left">'+
            '<a class="btn btn-mini dropdown-toggle" data-toggle="dropdown" href="#">'+
                '<span class="pull-left selected-val"></span>'+
                '<span class="caret pull-left editboxcaret"></span>'+
            '</a>'+
            '<ul class="dropdown-menu"></ul>'+
        '</div>'+
    '</div>';
}

// make a dropdown select for setting a style attribute
// s: container
// cls: class for this attribute
// d0: the selected element
// d: the modified styles
// TODO: user input option
function styleBoxDrop(s,cls,clickfn,title,d0,d){
    var noset=false;
    if(!d) {
        d=d0;
        noset=true;
    }

    var dn = $(dropdown('select-'+cls,title)).appendTo(s).get(0),
        dd=d3.select(dn);
    dn.attr=cls;
    var opts=dd.select('ul').selectAll('li')
        .data(d)
      .enter().append('li')
        .on('click',clickfn);

    var tw=40, th=20;

    opts.append('svg')
        .attr('width',tw)
        .attr('height',th)
        .style('position','relative')
        .style('top','2px') // why do I have to do this? better way?
        .append('g').attr('transform','translate(0,'+th/2+')')
        .each(legendLines)
        .each(legendPoints);
    opts.append('span')
        .style('font-size','14px')
        .style('position','relative')
        .style('top','-4px') // why do I have to do this? better way?
        .html(function(d){return d[0].t.name+'&nbsp;'});
    // set default value
    if(!noset) {
        for(var i=0; i<d.length && d[i][0].t[cls]!=d0[0].t[cls]; i++);
        i = i % d.length; // TODO: add custom entry and use it in this case
        $(dd.node()).find('.btn-group .selected-val').html($(dd.node()).find('li')[i].innerHTML);
    }
}

// pick a color (using spectrum)
// s: container
// cls: class for this attribute
// title: to show up in the main box
// title3: to show up inside spectrum box
function pickColor(s,cls,clickfn,title,title2,val){
    var dd = $('<div class="editboxselector select-'+cls+'">'+
        ((title) ? ('<div class="pull-left editboxtitle">'+title+'</div>') : '')+
        '<input class="pickcolor" type="text" />'+
        '</div>').appendTo(s);
    dd[0].attr=cls;
    dd.find('input').spectrum({
        color: val,
        showInput: true,
        showInitial: false,
        showAlpha: true,
        localStorageKey: 'spectrum.palette',
        showPalette: true,
        showPaletteOnly: false,
        showSelectionPalette: true,
        clickoutFiresChange: true,
        cancelText: 'Cancel',
        chooseText: title2 ? ('Set '+title2) : 'OK',
        showButtons: true,
        className: 'spectrum-'+cls,
        preferredFormat: 'rgb',
        maxSelectionSize: 16,
        palette: [defaultColors,
            ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
            "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
            ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
            "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
            ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
            "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
            "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
            "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
            "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
            "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
            "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
            "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
            "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
            "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]],
        change: function(color){clickfn(dd[0],color)}
//         selectionPalette: d
    });
}

var traceAttrs = {visible: 'visible', mode: 'mode',
    ld:'line.dash', lc:'line.color', lw:'line.width',
    mx:'marker.symbol', ms:'marker.size', mc:'marker.color',
    mlc:'marker.line.color', mlw:'marker.line.width'};

function selectPick(e) {
    console.log(e);
    var popover = $(this).parents('.popover'),
        selectedTrace = popover[0].selectedTrace,
        astr=traceAttrs[e.data.attr];
    restyle(popover[0].gd, astr, e.data.val, selectedTrace>=0 ? selectedTrace : null);
    styleBoxTraces(popover, selectedTrace);
}

function selectAttr(d,i){
    var menu = $(this).parents('.btn-group'),
        popover = $(this).parents('.popover');
    menu.find('.selected-val').html(menu.find('li')[i].innerHTML);
    var selectedTrace = popover[0].selectedTrace,
        a=$(this).parents('.editboxselector')[0].attr,
        astr=traceAttrs[a];
    restyle(popover[0].gd, astr, d[0].t[a], selectedTrace>=0 ? selectedTrace : null);
    styleBoxTraces(popover, selectedTrace);
}

function selectColor(dropnode,color){
    var popover = $(dropnode).parents('.popover'),
        selectedTrace = popover[0].selectedTrace,
        astr = traceAttrs[dropnode.attr],
        val = color.toRgbString();
    restyle(popover[0].gd, astr, val, selectedTrace>=0 ? selectedTrace : null);
    styleBoxTraces(popover, selectedTrace);
}

function legendLines(d){
    if(d[0].t.mode.indexOf('lines')==-1) return;
    d3.select(this).append('polyline')
        .call(lineGroupStyle)
        .attr('points','5,0 35,0');
}

function legendPoints(d){
    if(d[0].t.mode.indexOf('markers')==-1) return;
    d3.select(this).append('g')
        .attr('class','legendpoints')
        .call(pointGroupStyle)
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .call(pointStyle,{})
        .attr('transform','translate(20,0)');
}

function legendText(s){
    return s.append('text')
        .attr('class',function(d,i){return 'legendtext text-'+i})
        .attr('x',40)
        .attr('y',0)
        .attr('text-anchor','start')
        .attr('font-size',12)
        .each(function(d){styleText(this,d[0].t.name,d[0].t.noretrieve)});
}

// make a layout popover
function layoutBox(gd,pos) {
    newPopover(gd,pos,'layoutbox',layoutBoxContent);
}

function layoutBoxContent(popover){
    var gd = popover[0].gd,
        gl = gd.layout,
        pt = popover.find('.popover-title>div').html('Plot Layout');
        pc = popover.find('.popover-content').html('<div class="col1"></div><div class="col2"></div><br />'),
        a1 = pc.find('.col1'),
        a2 = pc.find('.col2');

    pickOption(a1,'autosize','Autosize',layoutSelectPick,gl.autosize,
        [{name:'On',val:true},{name:'Off',val:false}]);
    a1.append('<div class="newline"></div>');
    layoutBoxInput(a1,'width','Width',gl.width,inputBetween(10,10000));
    layoutBoxInput(a1,'height','Height',gl.height,inputBetween(10,10000));
    a1.append('<div class="newline"></div>');
    // TODO: click on a color from the palette and color changes right away... click again and it doesn't
    pickColor(a1,'paper_bgcolor',layoutSelectColor,'Margin Color','Margin Color',gl.paper_bgcolor);
    pickColor(a1,'plot_bgcolor',layoutSelectColor,'Plot Color','Plot Color',gl.plot_bgcolor);

    layoutBoxInput(a2,'margin.t','Margin Top',gl.margin.t,inputBetween(0,1000));
    layoutBoxInput(a2,'margin.b','... Bottom',gl.margin.t,inputBetween(0,1000));
    layoutBoxInput(a2,'margin.l','... Left',gl.margin.l,inputBetween(0,1000));
    layoutBoxInput(a2,'margin.r','... Right',gl.margin.r,inputBetween(0,1000));
    layoutBoxInput(a2,'margin.pad','Plot Padding',gl.margin.pad,inputBetween(0,1000));
}

// make an axes popover starting with given axis
// use axis='allaxes', 'xaxis or 'yaxis'
function axesBox(gd,pos,axis) {
    if(axis==undefined) axis='xaxis';
    newPopover(gd,pos,'axesbox',axesBoxContent,axis);
}

function axesBoxContent(popover,axis){
    var gd = popover[0].gd,
        gl = gd.layout,
        pt = popover.find('.popover-title>div').html('');
        pc = popover.find('.popover-content').html('<div class="col1"></div><div class="col2"></div><br />');
    if(axis)
        popover[0].axis = axis;
    else
        axis = popover[0].axis;

    var axes = [{name:'All Axes', val:'allaxes'},{name:'X Axis',val:'xaxis'},{name:'Y Axis',val:'yaxis'}];
    popover[0].axes = axes;
    var axdata = {}, axi = 0;
    axes.forEach(function(a,i){if(a.val==axis) {axdata=a; axi=i}});
    layoutBoxDrop(pt,'','',layoutSelectAxis,axdata,axes);
    layoutSelectAxis.call(pt.find('li').get(axi),axdata,axi);
}

function layoutSelectAxis(d,i) {
    var popover = $(this).parents('.popover'),
        menu = $(this).parents('.btn-group'),
        a1 = popover.find('.popover-content .col1').html(''),
        a2 = popover.find('.popover-content .col2').html(''),
        ax = d.val,
        gl = popover[0].gd.layout,
        axes = popover[0].axes,
        isdate = combineAxes(gl,axes,ax,'isdate'),
        islog = combineAxes(gl,axes,ax,'islog');
    popover[0].axis = ax;
    menu.find('.selected-val').html(menu.find('li')[i].innerHTML);
    if(isdate || isdate=='null') // if one or more axes is date type, cannot modify this here
        pickOption(a1,'','Axis Type',null,null,
            [{name:isdate ? 'DateTime' : 'Mixed date/num',val:null}]);
    else // if axes are numeric, can toggle log here
        pickOption(a1,ax+'.islog','Axis Type',layoutSelectPick, islog,
            [{name:'Linear',val:false},{name:'Log',val:true}]);
    a1.append('<div class="newline"></div>');
    pickOption(a1,ax+'.autorange','Autorange',layoutSelectPick,
        combineAxes(gl,axes,ax,'autorange'),
        [{name:'On',val:true},{name:'Off',val:false}]);
    a1.append('<div class="newline"></div>');
    layoutBoxInput(a1,ax+'.range[0]','Start',
        combineAxes(gl,axes,ax,'range[0]'),
        inputAxRange(isdate,islog));
    layoutBoxInput(a1,ax+'.range[1]','End',
        combineAxes(gl,axes,ax,'range[1]'),
        inputAxRange(isdate,islog));
    a1.append('<div class="newline"></div>');
    pickOption(a1,ax+'.ticks','Ticks',layoutSelectPick,
        combineAxes(gl,axes,ax,'ticks'),
        [{name:'Outside',val:'outside'},{name:'Inside',val:'inside'},{name:'None',val:''}]);
    a1.append('<div class="newline"></div>');
    layoutBoxInput(a1,ax+'.ticklen','... Length',
        combineAxes(gl,axes,ax,'ticklen'),
        inputBetween(1,1000));
    layoutBoxInput(a1,ax+'.tickwidth','... Width',
        combineAxes(gl,axes,ax,'tickwidth'),
        inputBetween(0.1,100));
    pickColor(a1,ax+'.tickcolor',layoutSelectColor,'... Color','Tick Color',
        combineAxes(gl,axes,ax,'tickcolor'));
    pickOption(a1,ax+'.showticklabels','... Labels',layoutSelectPick,
        combineAxes(gl,axes,ax,'showticklabels'),
        [{name:'On',val:true},{name:'Off',val:false}]);

    pickOption(a2,ax+'.showgrid','Grid Lines',layoutSelectPick,
        combineAxes(gl,axes,ax,'showgrid'),
        [{name:'On',val:true},{name:'Off',val:false}]);
    a2.append('<div class="newline"></div>');
    layoutBoxInput(a2,ax+'.gridwidth','... Width',
        combineAxes(gl,axes,ax,'gridwidth'),
        inputBetween(0.1,100));
    pickColor(a2,ax+'.gridcolor',layoutSelectColor,'... Color','Grid Color',
        combineAxes(gl,axes,ax,'gridcolor'));
    pickOption(a2,ax+'.zeroline','Zero Line',layoutSelectPick,
        combineAxes(gl,axes,ax,'zeroline'),
        [{name:'On',val:true},{name:'Off',val:false}]);
    a2.append('<div class="newline"></div>');
    layoutBoxInput(a2,ax+'.zerolinewidth','... Width',
        combineAxes(gl,axes,ax,'zerolinewidth'),
        inputBetween(0.1,100));
    pickColor(a2,ax+'.zerolinecolor',layoutSelectColor,'... Color','Zero Line Color',
        combineAxes(gl,axes,ax,'zerolinecolor'));
}

// for axis='allaxes', check if all axes have the same value
// if yes, return it; otherwise return null
// for any single axis, just return the value
function combineAxes(gl,axes,axis,attr) {
//     console.log(gl,axes,axis,attr)
    if(axis==axes[0].val) {
        var val = combineAxes(gl,axes,axes[1].val,attr);
        for(var i=2; i<axes.length; i++) {
            if(combineAxes(gl,axes,axes[i].val,attr)!=val)
                return null;
        }
        return val;
    }
    else
        return nestedProperty(gl,axis+'.'+attr).get();
}

// make a legend popover
function legendBox(gd,pos) {
    newPopover(gd,pos,'legendbox',legendBoxContent);
}

function legendBoxContent(popover) {
    var gd = popover[0].gd,
        gl = gd.layout,
        pt = popover.find('.popover-title>div').html('Legend');
        pc = popover.find('.popover-content>div').html('');
    pickOption(pc,'showlegend','Visible?',layoutSelectPick,gl.showlegend,
        [{name:'Show',val:true},{name:'Hide',val:false}]);
    pc.append('<div class="newline"></div>');
    pickColor(pc,'legend.bgcolor',layoutSelectColor,'Background','Legend Background',gl.legend.bgcolor);
    pickColor(pc,'legend.bordercolor',layoutSelectColor,'Border','Legend Border',gl.legend.bordercolor);
    layoutBoxInput(pc,'legend.borderwidth','Border Width',gl.legend.borderwidth,inputBetween(0.1,100));
}

// text input box for layout numbers
function layoutBoxInput(s,astr,title,val,input){
    var ib = $('<div class="editboxselector select-layout">'+
        ((title) ? ('<div class="pull-left editboxtitle">'+title+'</div>') : '')+
        '<input type="text" /></div>').appendTo(s).find('input');
    if(input) {
        input.astr = astr;
        input.val = input.converttoinput ? input.converttoinput(val) : val;
        ib.val(input.val)
            .blur(input,layoutTakeInput);
    }
    else // no range var means disable this input
        ib.attr('disabled',true);
}

// validator for inputs that need to be in a numeric range
function inputBetween(vmin,vmax){
    return {test: function(v) {return (v>=vmin && v<=vmax)},
            errortext: 'Must be between '+String(vmin)+' and '+String(vmax),
            converttoinput: function(v){return (v==null) ? '' : String(v)},
            convertfrominput: function(v){return Number(v)}};
}

// validator for axis range inputs
function inputAxRange(isdate,islog){
    if(isdate==null || islog==null) // disable setting all axes ranges if different types (flag==null)
        return false;
    else if(isdate)
        return {test: isDateTime,
                errortext: 'Must be a date-time (eg "2012-12-31 19:33:01.234", may be truncated)',
                converttoinput: ms2DateTime,
                convertfrominput: DateTime2ms};
    else if(islog)
        return {test: function(v) {return (v>0);},
                errortext: 'Must be a positive number',
                converttoinput: function(v){return (v==null) ? '' : String(Math.pow(10,v))},
                convertfrominput: function(v){return Math.log(Number(v)>0 ? Number(v) : 1e-10)/Math.LN10}};
    else
        return {test: $.isNumeric,
                errortext: 'Must be a number',
                converttoinput: function(v){return (v==null) ? '' : String(v)}};
}

// apply a new value from an input box
function layoutTakeInput(e) {
    var popover = $(this).parents('.popover'),
        val = this.value,
        input = e.data;
    if(val==input.val) // do nothing if the value is unchanged
        return;
    $(this).css('border',''); // clear potential error border
    if(val=='') // revert if value was cleared
        this.value = input.val;
    else if(input.test(val)) { // take the new val if it passes validation test
        relayout(popover[0].gd,input.astr,input.convertfrominput ? input.convertfrominput(val) : val);
        popover[0].redraw();
    }
    else {
        $(this).css('border','1px solid red');
        $(this).tooltip({placement:'right', title:input.errortext})
            .tooltip('show');
    }
}

// apply a new value from a button set
function layoutSelectPick(e) {
    if($(this).hasClass('disabled'))
        return;
    var popover = $(this).parents('.popover');
    relayout(popover[0].gd, e.data.attr, e.data.val);
    popover[0].redraw();
}

// make a dropdown select for setting a layout attribute
// s: container
// astr: attribute in relayout format
// val: the selected value
// opts: the selectable options
// TODO: user input option
function layoutBoxDrop(s,astr,title,clickfn,val,opts){
    var dn = $(dropdown('select-layout',title)).appendTo(s).get(0),
        dd = d3.select(dn);
    dn.attr = astr;
    var opts=dd.select('ul').selectAll('li')
        .data(opts)
      .enter().append('li')
        .on('click',clickfn)
        .append('span')
            .style('font-size','14px')
            .style('position','relative')
            .style('padding','5px')
            .html(function(d){return d.name+'&nbsp;'});
    // set default value
    for(var i=0; i<opts.length && opts[i].val!=val; i++);
    i = i % opts.length; // TODO: add custom entry and use it in this case
    $(dd.node()).find('.btn-group .selected-val').html($(dd.node()).find('li')[i].innerHTML);
}

function layoutSelectAttr(d,i){
    var menu = $(this).parents('.btn-group'),
        popover = $(this).parents('.popover'),
        astr = $(this).parents('.select-layout')[0].attr;
    menu.find('.selected-val').html(menu.find('li')[i].innerHTML);
    relayout(popover[0].gd,astr,d.val);
    popover[0].redraw();
}

function layoutSelectColor(dropnode,color){
    var popover = $(dropnode).parents('.popover'),
        astr = dropnode.attr,
        val = color.toRgbString();
    relayout(popover[0].gd, astr, val);
    popover[0].redraw();
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
    var el3 = d3.select(eln), el = el3.attr('class'), cont, prop, ref=$(eln);
    var o = {maxWidth: 1000, minWidth: 20}, fontCss={};
    var mode = (el.slice(1,6)=='title') ? 'title' :
                (el.slice(0,4)=='drag') ? 'drag' :
                (el.slice(0,6)=='legend') ? 'legend' :
                    'unknown';

    if(mode=='unknown') {
        console.log('oops, autoGrowInput doesn\'t recognize this field',el,eln);
        return;
    }
    if(!gd.mainsite && mode!='drag') {
        console.log('not on the main site but tried to edit text. ???',el,eln);
        return;
    }

    // are we editing a title?
    if(mode=='title') {
        cont =  {xtitle:gd.layout.xaxis, ytitle:gd.layout.yaxis, gtitle:gd.layout}[el];
        prop = 'title';
        // if box is initially empty, it's cue text so we can't grab its properties:
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
        ref=$(gd).find('.xtitle'); // font properties reference
    }
    // legend text?
    else if(mode=='legend') {
        var tn = Number(el.split('-')[1])
        cont = gd.data[tn], prop='name';
        var cont2 = gd.calcdata[tn][0].t;
        o.align = 'left';
    }

    var fa=['font-size','font-family','font-weight','font-style','font-stretch',
        'font-variant','letter-spacing','word-spacing'];
    var fapx=['font-size','letter-spacing','word-spacing'];
    for(i in fa) {
        var ra=ref.attr(fa[i]);
        if(fapx.indexOf(fa[i])>=0 && Number(ra)>0) ra+='px';
        if(ra) fontCss[fa[i]]=ra;
    }

    o.comfortZone = (Number(String(fontCss['font-size']).split('px')[0]) || 20) + 3;

    var eltrans=el3.attr('transform'),
        inbox=document.createElement('input'),
        bbox=eln.getBoundingClientRect();

    $(gd).append(inbox);
    var input=$(inbox);
    gd.input=input;

    // first put the input box at 0,0, then calculate the correct offset vs orig. element
    input.css(fontCss)
        .css({position:'absolute', top:0, left:0, 'z-index':6000});

    if(mode=='drag') {
        // show enough digits to specify the position to about a pixel, but not more
        var v=cont.range[prop], diff=Math.abs(v-cont.range[1-prop]);
        if(cont.isdate){
            var d=new Date(v); // dates are stored in ms
            var ds=$.datepicker.formatDate('yy-mm-dd',d); // always show the date part
            if(diff<1000*3600*24*30) ds+=' '+lpad(d.getHours(),2);  // <30 days: add hours
            if(diff<1000*3600*24*2) ds+=':'+lpad(d.getMinutes(),2); // <2 days: add minutes
            if(diff<1000*3600*3) ds+=':'+lpad(d.getSeconds(),2);    // <3 hours: add seconds
            if(diff<1000*300) ds+='.'+lpad(d.getMilliseconds(),3);  // <5 minutes: add ms
            input.val(ds);
        }
        else if(cont.islog) {
            var dig=Math.ceil(Math.max(0,-Math.log(diff)/Math.LN10))+3;
            input.val(d3.format('.'+String(dig)+'g')(Math.pow(10,v)));
        }
        else { // linear numeric
            var dig=Math.floor(Math.log(Math.abs(v))/Math.LN10)-Math.floor(Math.log(diff)/Math.LN10)+4;
            input.val(d3.format('.'+String(dig)+'g')(v));
        }
    }
    else input.val($.trim(cont[prop]).replace(/(\r\n?|\n\r?)/g,'<br>'));

    var val = input.val(),
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

    var testWidth=function(){
        return Math.min(Math.max(testSubject.width()+o.comfortZone,o.minWidth),o.maxWidth)
    }
    input.width(testWidth());

    var ibbox=inbox.getBoundingClientRect(),ileft=bbox.left-ibbox.left;
    input.css('top',(bbox.top-ibbox.top+(bbox.height-ibbox.height)/2)+'px');
    if(o.align=='right') ileft+=bbox.width-ibbox.width;
    else if(o.align=='center') ileft+=(bbox.width+o.comfortZone-ibbox.width)/2;
    input.css('left',ileft+'px');

    var leftshift={left:0, center:0.5, right:1}[o.align];
    var left0=input.position().left+input.width()*leftshift;

    // for titles, take away the existing one as soon as the input box is made
    if(mode!='drag') gd.paper.selectAll('[class="'+el+'"]').remove();
    inbox.select();

    var removeInput=function(){
        input.remove();
        testSubject.remove();
        gd.input=null;
    }

    input.bind('keyup keydown blur update',function(e) {
        var valold=val;
        val=input.val();
        if(!gd.input || !gd.layout) return; // occasionally we get two events firing...

        // leave the input or press return: accept the change
        if((e.type=='blur') || (e.type=='keydown' && e.which==13)) {

            if(mode=='title') {
                cont[prop]=$.trim(val);
                makeTitles(gd,el);
            }
            else if(mode=='drag') {
                var v= (cont.islog) ? Math.log(Number($.trim(val)))/Math.LN10 :
                    (cont.isdate) ? DateTime2ms($.trim(val)) : Number($.trim(val));
                if($.isNumeric(v)) {
                    cont.range[prop]=v;
                    dragTail(gd);
                }
            }
            else if(mode=='legend') {
                console.log(gd.layout);
                cont[prop]=$.trim(val);
                cont2[prop]=$.trim(val);
                gd.layout.showlegend=true;
                legend(gd);
            }
            removeInput();
        }
        // press escape: revert the change
        else if(e.type=='keydown' && e.which==27) {
            if(mode=='title') makeTitles(gd,el);
            else if(mode=='legend') legend(gd);
            removeInput();
        }
        else if(val!=valold) {
            // If content has changed, enter in testSubject and update input width & position
            testSubject.html(escaped(val));
            var newWidth = testWidth();
            input.css({width: newWidth, left: left0-newWidth*leftshift});
        }
    });
}

// ----------------------------------------------------
// Ticks and grids
// ----------------------------------------------------

// calculate the ticks: text, values, positioning
// if ticks are set to automatic, determine the right values (tick0,dtick)
// in any case, set tickround to # of digits to round tick labels to,
// or codes to this effect for log and date scales
// TODO: so far it's all autotick=true, but when it's not, date and log scales will need things done.
function calcTicks(gd,a) {
    // calculate max number of (auto) ticks to display based on plot size
    // TODO: take account of actual label size here
    if(a===gd.layout.yaxis)
        var nt = Math.max(3,Math.min(10,gd.plotheight/40));
    else
        var nt = Math.max(3,Math.min(10,gd.plotwidth/80));

    var rt=Math.abs(a.range[1]-a.range[0])/nt; // min tick spacing
    if(a.isdate){
        if(a.autotick){
            var base;
            a.tick0=new Date(2000,0,1).getTime();
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
                a.tick0=new Date(2000,0,2).getTime(); // get week ticks on sunday
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

    // check for reversed axis
    var axrev=(a.range[1]<a.range[0]);

    // return the full set of tick vals
    var vals=[];
    for(var x=a.tmin;(axrev)?(x>=a.range[1]):(x<=a.range[1]);x=tickIncrement(x,a.dtick,axrev))
        vals.push(tickText(gd, a, x));
    return vals;
}

// return the smallest element from (sorted) array a that's bigger than val
// UPDATE: now includes option to reverse, ie find the largest element smaller than val
// used to find the best tick given the minimum (non-rounded) tick
// particularly useful for date/time where things are not powers of 10
// binary search is probably overkill here...
function roundUp(val,a,reverse){
    var low=0, high=a.length-1, mid;
    if(reverse) var dlow=0, dhigh=1,sRound=Math.ceil;
    else var dlow=1, dhigh=0,sRound=Math.floor;
    while(low<high){
        mid=sRound((low+high)/2)
        if(a[mid]<=val) low=mid+dlow;
        else high=mid-dhigh;
    }
    return a[low];
}

// months and years don't have constant millisecond values
// (but a year is always 12 months so we only need months)
// log-scale ticks are also not consistently spaced, except for pure powers of 10
// numeric ticks always have constant differences, other datetime ticks
// can all be calculated as constant number of milliseconds
function tickIncrement(x,dtick,axrev){
    if($.isNumeric(dtick)) // includes all dates smaller than month, and pure 10^n in log
        return x+(axrev?-dtick:dtick);

    var tType=dtick.charAt(0);
    var dtnum=Number(dtick.substr(1)),dtSigned=(axrev?-dtnum:dtnum);
    // Dates: months (or years)
    if(tType=='M'){
        var y=new Date(x);
        // is this browser consistent? setMonth edits a date but returns that date's milliseconds
        return y.setMonth(y.getMonth()+dtSigned);
    }
    // Log scales: Linear, Digits
    else if(tType=='L')
        return Math.log(Math.pow(10,x)+dtSigned)/Math.LN10;
    else if(tType=='D') {//log10 of 2,5,10, or all digits (logs just have to be close enough to round)
        var tickset=(dtick=='D2')?
            [-0.301,0,0.301,0.699,1]:[-0.046,0,0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1];
        var x2=x+(axrev ? -0.01 : 0.01);
        var frac=roundUp(mod(x2,1), tickset, axrev);
//         if(axrev) frac=tickset[tickset.indexOf(frac)-2];
//         if(frac<0) {x-=1; frac+=1;}
        return Math.floor(x2)+Math.log(d3.round(Math.pow(10,frac),1))/Math.LN10;
    }
    else throw "unrecognized dtick "+String(dtick);
}

// calculate the first tick on an axis
function tickFirst(a){
    var axrev=(a.range[1]<a.range[0]), sRound=(axrev ? Math.floor : Math.ceil);
    if($.isNumeric(a.dtick))
        return sRound((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;

    var tType=a.dtick.charAt(0), dt=Number(a.dtick.substr(1));
    // Dates: months (or years)
    if(tType=='M'){
        var t0=new Date(a.tick0), r0=new Date(a.range[0]);
        var mdif=(r0.getFullYear()-t0.getFullYear())*12+r0.getMonth()-t0.getMonth();
        var t1=t0.setMonth(t0.getMonth()+(Math.round(mdif/dt)+(axrev?1:-1))*dt);
        while(axrev ? t1>a.range[0] : t1<a.range[0]) t1=tickIncrement(t1,a.dtick,axrev);
        return t1;
    }
    // Log scales: Linear, Digits
    else if(tType=='L')
        return Math.log(sRound((Math.pow(10,a.range[0])-a.tick0)/dt)*dt+a.tick0)/Math.LN10;
    else if(tType=='D') {
//         return Math.floor(a.range[0])+roundUp(mod(a.range[0],1), (a.dtick=='D2')?
//             [0.301,0.699,1]:[0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1]);
        var tickset=(a.dtick=='D2')?
            [-0.301,0,0.301,0.699,1]:[-0.046,0,0.301,0.477,0.602,0.699,0.778,0.845,0.903,0.954,1];
        var frac=roundUp(mod(a.range[0],1), tickset, axrev);
        return Math.floor(a.range[0])+Math.log(d3.round(Math.pow(10,frac),1))/Math.LN10;
    }
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

// ticks, grids, and tick labels for axis ax ('x' or 'y', or blank to do both)
function doTicks(gd,ax) {
    if(!ax) {
        doTicks(gd,'x');
        doTicks(gd,'y');
        return;
    }
    var gl=gd.layout,
        gm=gl.margin,
        a={x:gl.xaxis, y:gl.yaxis}[ax],
        vals=calcTicks(gd,a),
        datafn = function(d){return d.text},
        tcls = ax+'tick',
        gcls = ax+'grid',
        zcls = ax+'zl',
        ml = gm.l-(gd.lw<0 ? gd.lw : 0),
        mr = gm.r+(gd.lw>0 ? gd.lw : 0),
        mt = gm.t+(gd.lh>0 ? gd.lh : 0),
        mb = gm.b-(gd.lh<0 ? gd.lh : 0);
    // positioning arguments for x vs y axes
    if(ax=='x') {
        var y1 = gl.height-mb+gm.pad,
            t = {x1:ml,
                x2:ml,
                y1:y1,
                y2:y1+(a.ticks=='inside' ? -1 : 1)*a.ticklen},
            g = {x1:ml, x2:ml, y1:gl.height-mb, y2:mt},
            transfn = function(d){return 'translate('+(a.m*d.x+a.b)+',0)'},
            tl = {x:function(d){return d.dx+ml},
                y:function(d){return d.dy+y1+(a.ticks=='outside' ? a.ticklen : 1)+d.fontSize},
                anchor:'middle'};
    }
    else if(ax=='y') {
        var x1 = ml-gm.pad,
            t = {x1:x1,
                x2:x1+(a.ticks=='inside' ? 1 : -1)*a.ticklen,
                y1:mt,
                y2:mt},
            g = {x1:ml, x2:gl.width-mr, y1:mt, y2:mt},
            transfn = function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'},
            tl = {x:function(d){return d.dx+x1-(a.ticks=='outside' ? a.ticklen : 2)},
                y:function(d){return d.dy+mt+d.fontSize/2},
                anchor:'end'};
    }
    else {
        console.log('unrecognized doTicks axis',ax);
        return;
    }

    // ticks
    var ticks=gd.axislayer.selectAll('line.'+tcls).data(vals,datafn);
    if(a.ticks) {
        ticks.enter().append('line').classed(tcls,1).classed('ticks',1)
            .attr('stroke', a.tickcolor ? a.tickcolor : '#000')
            .attr('stroke-width', a.tickwidth ? a.tickwidth : 1)
            .attr('x1',t.x1)
            .attr('x2',t.x2)
            .attr('y1',t.y1)
            .attr('y2',t.y2);
        ticks.attr('transform',transfn);
        ticks.exit().remove();
    }
    else
        ticks.remove();

    // tick labels
    gd.axislayer.selectAll('text.'+tcls).remove(); // TODO: problems with reusing labels... shouldn't need this.
    var yl=gd.axislayer.selectAll('text.'+tcls).data(vals,datafn);
    if(a.showticklabels) {
        yl.enter().append('text').classed(tcls,1)
            .attr('x',tl.x)
            .attr('y',tl.y)
            .attr('font-size',function(d){return d.fontSize})
            .attr('text-anchor',tl.anchor)
            .each(function(d){styleText(this,d.text)});
        yl.attr('transform',transfn);
        yl.exit().remove();
    }
    else
        yl.remove();

    // grid
    // TODO: must be a better way to find & remove zero lines? this will fail when we get to manual ticks
    var grid=gd.axislayer.selectAll('line.'+gcls).data(vals,datafn),
        gridcolor = a.gridcolor ? a.gridcolor : '#ddd',
        gridwidth = a.gridwidth ? a.gridwidth : 1;
    if(a.showgrid!=false) {
        grid.enter().append('line').classed(gcls,1)
            .attr('stroke', gridcolor)
            .attr('stroke-width', gridwidth)
            .attr('x1',g.x1)
            .attr('x2',g.x2)
            .attr('y1',g.y1)
            .attr('y2',g.y2)
            .each(function(d) {if(!a.islog && !a.isdate && d.text=='0') d3.select(this).remove();});
        grid.attr('transform',transfn);
        grid.exit().remove();
    }
    else
        grid.remove();

    // zero line
    var zl = gd.axislayer.selectAll('line.'+zcls).data(a.range[0]*a.range[1]<=0 ? [{x:0}] : []),
        zlcolor = a.zerolinecolor ? a.zerolinecolor : '#000'
        zlwidth = a.zerolinewidth ? a.zerolinewidth : gridwidth;
    if(a.zeroline) {
        zl.enter().append('line').classed(zcls,1).classed('zl',1)
            .attr('stroke', zlcolor)
            .attr('stroke-width', zlwidth)
            .attr('x1',g.x1)
            .attr('x2',g.x2)
            .attr('y1',g.y1)
            .attr('y2',g.y2);
        zl.attr('transform',transfn);
        zl.exit().remove();
    }
    else
        zl.remove();

    // now move all ticks and zero lines to the top of axislayer (ie over other grid lines)
    // looks cumbersome in d3, so switch to jquery.
    var al = $(gd.axislayer.node());
    al.find('.zl').appendTo(al);
    al.find('.ticks').appendTo(al);
}

// styling for svg text, in ~HTML format
//   <br> or \n makes a new line (translated to opening and closing <l> tags)
// others need opening and closing tags:
//   <sup>: superscripts
//   <sub>: subscripts
//   <b>: bold
//   <i>: italic
//   <font>: with any of style, weight, size, family, and color attributes changes the font
// tries to find < and > that aren't part of a tag and convert to &lt; and &gt;
// but if it fails, displays the unparsed text with a tooltip about the error
// TODO: will barf on tags crossing newlines... need to close and reopen any such tags if we want to allow this.
function styleText(sn,t) {
    var s=d3.select(sn);
    // whitelist of tags we accept - make sure new tags get added here as well as styleTextInner
    var tags=['sub','sup','b','i','font'];
    var tagRE='\x01(\\/?(br|'+tags.join('|')+')(\\s[^\x01\x02]*)?\\/?)\x02';
    // take the most permissive reading we can of the text:
    // if we don't recognize a tag, treat it as literal text
    var t1=t.replace(/</g,'\x01') // first turn all <, > to non-printing \x01, \x02
            .replace(/>/g,'\x02')
            .replace(new RegExp(tagRE,'gi'),'<$1>') // next turn good tags back to <...>
            .replace(/(<br(\s[^<>]*)?\/?>|\n)/gi, '</l><l>') // translate <br> and \n
            .replace(/\x01/g,'&lt;') // finally turn any remaining \x01, \x02 into &lt;, &gt;
            .replace(/\x02/g,'&gt;');
    // close unclosed tags
    for(i in tags) {
        var om=t1.match(new RegExp('<'+tags[i],'gi')), opens=om?om.length:0;
        var cm=t1.match(new RegExp('<\\/'+tags[i],'gi')), closes=cm?cm.length:0;
        while(closes<opens) { closes++; t1+='</'+tags[i]+'>'}
    }
    // quote unquoted attributes
    var attrRE=/(<[^<>]*=\s*)([^<>\s"']+)(\s|>)/g;
    while(t1.match(attrRE)) t1=t1.replace(attrRE,'$1"$2"$3');
    // parse the text into an xml tree
    lines=new DOMParser()
        .parseFromString('<t><l>'+t1+'</l></t>','text/xml')
        .getElementsByTagName('t')[0]
        .childNodes;
    if(lines[0].nodeName=='parsererror') {
        s.text(t);
        $(s).tooltip({title:"Oops! We didn't get that. You can style text with "+
                "HTML-like tags, but all tags except &lt;br&gt; must be closed, and "+
                "sometimes you have to use &amp;gt; for &gt; and &amp;lt; for &lt;."})
            .tooltip('show');
    }
    // create the styled output
    else for(var i=0; i<lines.length;i++){
        var l=s.append('tspan').attr('class','nl');
        if(i>0) l.attr('x',s.attr('x')).attr('dy',1.3*s.attr('font-size'));
        styleTextInner(l,lines[i].childNodes);
    }
    // if the user did something weird and produced an empty output, give it some size
    // and make it transparent, so they can get it back again
    var bb=sn.getBoundingClientRect();
    if(bb.width==0 || bb.height==0) {
        s.selectAll('tspan').remove();
        styleText(sn,'XXXXX');
        s.attr('opacity',0);
    }
}

function styleTextInner(s,n) {
    for(var i=0; i<n.length;i++) {
        var nn=n[i].nodeName.toLowerCase();
        if(nn=='#text') {
            if(s.text()) s.append('tspan').text(n[i].nodeValue);
            else s.text(n[i].nodeValue);
        }
        else if(nn=='sup')
            styleTextInner(s.append('tspan')
                .attr('baseline-shift','super')
                .attr('font-size','70%'),
              n[i].childNodes);
        else if(nn=='sub')
            styleTextInner(s.append('tspan')
                .attr('baseline-shift','sub')
                .attr('font-size','70%'),
              n[i].childNodes);
        else if(nn=='b')
            styleTextInner(s.append('tspan')
                .attr('font-weight','bold'),
              n[i].childNodes);
        else if(nn=='i')
            styleTextInner(s.append('tspan')
                .attr('font-style','italic'),
              n[i].childNodes);
        else if(nn=='font') {
            var ts=s.append('tspan');
            for(var j=0; j<n[i].attributes.length; j++) {
                var at=n[i].attributes[j],atl=at.name.toLowerCase(),atv=at.nodeValue;
                if(atl=='style') ts.attr('font-style',atv);
                else if(atl=='weight') ts.attr('font-weight',atv);
                else if(atl=='size') ts.attr('font-size',atv);
                else if(atl=='family') ts.attr('font-family',atv);
                else if(atl=='color') ts.attr('fill',atv);
            }
            styleTextInner(ts, n[i].childNodes);
        }
    }
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

function shareGraph(divid){
    $('#worldreadable').hide();
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
    if(typeof gd.fid !='string') gd.fid='';
    if(signedin()==false) return;
    var gd=gettab();
    if(gd.fid===undefined) gd.fid='';
    if(gd.fid==''){
        saveGraph(gd); // TODO: instead of a timeout, use a callback on finishing saveGraph
    }
    var spinner=new Spinner(opts).spin(gd);

    // give graph 2.5 second to save and load iframe
    setTimeout(function(){
        // reload div
        var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
        if(gd.fid.toString().split(':').length==2){
	    var un=gd.fid.split(':')[0]
	    var fid=gd.fid.split(':')[1]
	}
        else{
	    var un=$('#signin').text().replace(/^\s+|\s+$/g, '');
	    var fid=gd.fid
        }
        // set worldreadable flag on file to true
        $.post("/worldreadable/", {'readable':true,'fid':gd.fid}, function(){
            url=window.location.origin+'/~'+un+'/'+fid;
            $('#linktoshare').val(url);
            $('#igraph').attr('src',url+'/500/300/');
            $('#iframetoshare').text($('#igraphcontainer').html().replace(/^\s*/, '').replace(/\s*$/, ''));
            $('#linkModal').modal('toggle');
            document.getElementById("linktoshare").select();
        });
        spinner.stop();
    }, 2500);
}

// ------------------------------- graphToGrid

function graphToGrid(){
    var gd=gettab();
    var csrftoken=$.cookie('csrftoken');
    if(gd.fid !== undefined)
        $.post("/pullf/", {'csrfmiddlewaretoken':csrftoken, 'fid': gd.fid, 'ft':'grid'}, fileResp);
    else {
        var data = [];
        for(d in gd.data) data.push(stripSrc(gd.data[d]));
        $.post("/pullf/", {'csrfmiddlewaretoken':csrftoken, 'data': JSON.stringify({'data':data}), 'ft':'grid'}, fileResp);
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

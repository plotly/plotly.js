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

    type: (string) scatter (default), bar, heatmap

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

defaultColors=['#00e', //blue
               '#a00', //red
               '#6fa8dc', //lite blue
               '#ffd966', //goldenrod
               '#ff00ff', //elektrik purple
               '#9900ff', //moody purple
               '#0c0', // brite green
               '#000']; // black

defaultScale=[[0,"rgb(8, 29, 88)"],[0.125,"rgb(37, 52, 148)"],[0.25,"rgb(34, 94, 168)"],
    [0.375,"rgb(29, 145, 192)"],[0.5,"rgb(65, 182, 196)"],[0.625,"rgb(127, 205, 187)"],
    [0.75,"rgb(199, 233, 180)"],[0.875,"rgb(237, 248, 217)"],[1,"rgb(255, 255, 217)"]];

// how to display each type of graph
// AJ 3/4/13: I'm envisioning a lot of stuff that's hardcoded into plot,
// setStyles etc will go here to make multiple graph types easier to manage
var graphInfo = {
    scatter:{
        framework:newPlot
    },
    bar:{
        framework:newPlot
    },
    heatmap:{
        framework:newPlot
    }
}

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
function plot(divid, data, layout, rdrw) {
    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in by dom element, others by id (string)
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
	// test if this is on the main site or embedded
	gd.mainsite=Boolean($('#plotlyMainMarker').length);

	// rdrw - whether to force the heatmap to redraw, true if calling plot() from restyle
    if(typeof rdrw==='undefined') rdrw=false;

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass non-object (null, '', whatever) for data
    var graphwasempty = ((typeof gd.data==='undefined') && $.isArray(data));
    if(typeof data=='object') {
        if(graphwasempty) gd.data=data;
        else gd.data.push.apply(gd.data,data);
        gd.empty=false;
    }

    var gdd=gd.data;
    var curve, x, xy, y, i, serieslen, dcnt, ncnt, v0, dv, gdc;

    // figure out what framework (ie container, axes) to use,
    //  and whether this is different from what was already there
    // note: if they container already exists and has data,
    //  the new layout gets ignored (as it should)
    //  but if there's no data there yet, it's just a placeholder...
    //  then it should destroy and remake the plot
    if(gdd&&gdd.length>0){
        var framework = graphInfo[gdd[0].type || 'scatter'].framework;
        if(!gd.framework || gd.framework!=framework || (typeof gd.layout==='undefined') || graphwasempty) {
            gd.framework = framework;
            framework(gd,layout);
        }
    }
    else if((typeof gd.layout==='undefined')||graphwasempty) newPlot(divid, layout);

    // enable or disable formatting buttons
    $(gd).find('.data-only').attr('disabled', !gd.data || gd.data.length==0);

    var gl=gd.layout, vb=gd.viewbox, gdd=gd.data, gp=gd.plot;
    var xa=gl.xaxis, ya=gl.yaxis, xdr=gl.xaxis.drange, ydr=gl.yaxis.drange;
    var x, xy, y, i, serieslen, dcnt, ncnt, v0, dv, gdc;
    xdr=[null,null];
    ydr=[null,null];


    if(gdd&&(gdd.length>0)){
        // figure out axis types (linear, log, date, category...)
        // use the first trace only.
        // If the axis has data, see whether more looks like dates or like numbers
        // If it has x0 & dx (etc), go by x0 (if x0 is a date and dx is a number, perhaps guess days?)
        // If it has none of these, it will default to x0=0, dx=1, so choose number
        // -> If not date, figure out if a log axis makes sense, using all axis data

        function setAxType(ax,axletter){
            // backward compatibility
            if(!ax.type) {
                if(ax.isdate)
                    ax.type='date';
                else if(ax.islog)
                    ax.type='log';
                else if(ax.isdate===false && ax.islog===false)
                    ax.type='linear';
            }
            // now remove the obsolete properties
            delete ax.islog;
            delete ax.isdate;
            // guess at axis type with the new property format
            if(['date','log','linear','category'].indexOf(ax.type)!==-1)
                return;
            if( ( axletter in gdd[0]) ? moreDates(gdd[0][axletter]) : (isDateTime(gdd[0][axletter+'0'])===true ) )
                ax.type='date';
            else if( loggy(gdd,axletter) )
                ax.type='log';
            else if( category(gdd,axletter) )
                ax.type='category';
            else
                ax.type='linear';
        }

        setAxType(xa,'x');
        setAxType(ya,'y');
    }

//     console.log('********** X TYPE **********');
//     console.log(xa.type);

    // prepare the data and find the autorange
    // TODO: only remake calcdata for new or changed traces
    gd.calcdata=[];
    computedStackHeight = false;
    computedXdr = false;

    for(curve in gdd) {
        var gdc=gdd[curve],
            curvetype = gdc.type || 'scatter', //default type is scatter
            typeinfo = graphInfo[curvetype],
            cd=[];

        if(typeinfo.framework!=gd.framework) {
            console.log('Oops, tried to put data of type '+(gdc.type || 'scatter')+
                ' on an incompatible graph controlled by '+(gdd[0].type || 'scatter')+
                ' data. Ignoring this dataset.');
            continue;
        }
        //if(!('color' in gdc)) gdc.color = defaultColors[curve % defaultColors.length];
        if(!('name' in gdc)) {
            if('ysrc' in gdc) {
                var ns=gdc.ysrc.split('/')
                gdc.name=ns[ns.length-1].replace(/\n/g,' ');
            }
            else gdc.name='trace '+curve;
        }

        // this function takes an x or y value and converts it to a position on the axis object "ax"
        // data - a string, either 'x' or 'y'
        // ax - an x or y axis object
        // counterdata - an x or y value, either gdc.x or gdc.y
        var convertOne = function(data,ax,counterdata) {
            if(data in gdc) { return convertToAxis(gdc[data],ax) }
            else {
                var v0 = ((data+'0') in gdc) ? convertToAxis(gdc[data+'0'], ax) : 0,
                    dv = (('d'+data) in gdc) ? convertToAxis(gdc['d'+data], ax) : 1;
                return counterdata.map(function(v,i){return v0+i*dv});
            }
        }

        // this function returns the outer x or y limits of the curves processed so far
        var outerBounds = function(xa,xdr,x,serieslen) {
            if(xa.autorange)
                return [aggNums(Math.min,xdr[0],x,serieslen),aggNums(Math.max,xdr[1],x,serieslen)];
            else
                return xdr;
        }

        if(curvetype=='scatter') {
            // verify that data exists, and make scaled data if necessary
            if(!('y' in gdc) && !('x' in gdc)) continue; // no data!

            // ignore as much processing as possible (and including in autorange) if trace is not visible
            if(gdc.visible!=false) {

                y = convertOne('y',ya,gdc.x);
                x = convertOne('x',xa,gdc.y);

                serieslen = Math.min(x.length,y.length);

                xdr = outerBounds(xa,xdr,x,serieslen);
                ydr = outerBounds(ya,ydr,y,serieslen);

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
            cd[0].t={curve:curve,type:curvetype}; // <-- curve is index of the data object in gd.data
            if(!('line' in gdc)) gdc.line={};
            if(!('marker' in gdc)) gdc.marker={};
            if(!('line' in gdc.marker)) gdc.marker.line={};
        }
        else if(curvetype=='bar') {
            // ignore as much processing as possible (and including in autorange) if bar is not visible
            if(gdc.visible!=false) {
//                 console.log('**** bar curve ****');
//                 console.log(gdc);

                y = convertOne('y',ya,gdc.x);
                x = convertOne('x',xa,gdc.y);

//                 console.log('*** x ***'); console.log(x);
//                 console.log('*** y ***'); console.log(y);

                var xMax = aggNums(Math.max, false, x, x.length);
                var xMin = aggNums(Math.min, false, x, x.length);
                var xDiff = xMax-xMin;
                var barWidth = xDiff/(gdc.x.length-1);
                var serieslen = Math.min(x.length,y.length);

                if((gl.barmode == 'stack') && !computedStackHeight){
                    // to autoscale the y-axis for stacked bar charts
                    // we need to "find the highest and lowest stack"
                    // i.e. max( y1+y2+...+yn ), where yi is a data vector for a bar trace
                    // since we go through all the traces, we only do this operation once
                    var yMax = 0, yMin = 0;
                    for(var xi=0; xi<gdc.x.length; xi++){ // x-data index
                        var ySum = 0;
                        for(var ti=0; ti<gdd.length; ti++){ // trace index
                            if(gdd[ti].type=='bar' && ((gdd[ti].visible===undefined) ? true : gdd[ti].visible) ){
                                // add up all the y's at index xi (unless undefined, then add 0)
                                ySum = ySum + ( gdd[ti].y[xi]==undefined ? 0 : Number(gdd[ti].y[xi]) );
                            }
                            yMax = Math.max(yMax,ySum); // moved these inside the loop so we capture true max and min if there are sign reversals within a stack
                            yMin = Math.min(yMin,ySum); // TODO: might want the option to stack all the negatives below zero and all the positives above?
                        }
                        computedStackHeight = true; // ... so that we don't do this again
                    }
                    ydr = [yMin, yMax];
                    xOffset = barWidth*0.5;
                }
                else if(gl.barmode == 'group'){
                    // compute number of visible bar traces
                    var nVis = 0;
                    for(var ti=0; ti<gdd.length; ti++){ // trace index
                        if(gdd[ti].type=='bar' && ((gdd[ti].visible===undefined) ? true : gdd[ti].visible)){
                            nVis+=1;
                        }
                    }
                    // divide barWidth by number of visible bar traces for drawing purposes
                    barWidth /= (nVis||1);
                    var xOffset = nVis*barWidth*0.5;
                    ydr = outerBounds(ya,ydr,y,serieslen);
//                     console.log(ydr);
                    ydr[0] = Math.min(ydr[0],0);    // cuz we want to view the whole bar.
                                                    // if the bar is less than 0, display it
                                                    // but otherwise, default to ymin = 0
                }

                // since we assume that all the bars have the same x-data
                // we only need to compute this once
                if(!computedXdr){
                    xdr = outerBounds(xa,xdr,x,serieslen);
                    xdr[0] = xdr[0] - xOffset;
                    xdr[1] = xdr[1] + xOffset;
                    computedXdr = true;
                }
                // create the "calculated data" to plot
                for(i=0;i<serieslen;i++)
                    cd.push(($.isNumeric(x[i]) && $.isNumeric(y[i])) ? {x:x[i],y:y[i]} : {x:false, y:false});
            }
            else
                cd=[{x:false, y:false}];
            // add the bar-wide properties to the first bar, per bar properties to every bar
            // t is the holder for bar-wide properties, start it with the curve num from gd.data
            // in case some curves don't plot

            cd[0].t={curve:curve,type:curvetype}; // <-- curve is index of the data object in gd.data
//             if(!('barmode' in gl)) gl.barmode='stack';
            if(!('line' in gdc)) gdc.line={};
            if(!('marker' in gdc)) gdc.marker={};
            if(!('line' in gdc.marker)) gdc.marker.line={};

            /*mergeattr(gdc.marker.color,'mc',cd[0].t.lc);
            mergeattr(gdc.marker.line.color,'mlc',((cd[0].t.lc!=cd[0].t.mc) ? cd[0].t.lc : '#000' ));
            mergeattr(gdc.marker.line.width,'mlw',0);*/
        }
        else if( gdc.type=='heatmap' ){
            if(gdc.visible!=false) {
                // heatmap() builds a png heatmap on the coordinate system, see heatmap.js
                // returns the L, R, T, B coordinates for autorange as { x:[L,R], y:[T,B] }
                var bounds = hm_rect(gdc);
                var serieslen=2;
                if(xa.autorange)
                    xdr = [aggNums(Math.min,xdr[0],bounds['x'],serieslen),aggNums(Math.max,xdr[1],bounds['x'],serieslen)];
                if(ya.autorange)
                    ydr = [aggNums(Math.min,ydr[0],bounds['y'],serieslen),aggNums(Math.max,ydr[1],bounds['y'],serieslen)];
            }
            // calcdata ("cd") for heatmaps:
            // curve: index of heatmap in gd.data
            // type: used to distinguish heatmaps from traces in "Data" popover
            var t={ curve:curve, type:'heatmap' }
            cd.push({t:t});
        }
        gd.calcdata.push(cd);
    }

    // console.log(gd.calcdata);
    // put the styling info into the calculated traces
    // has to be done separate from applyStyles so we know the mode (ie which objects to draw)
    setStyles(gd);

    // autorange... if axis is currently reversed, preserve this.
    var a0 = 0.05, // 5% extension of plot scale beyond last point
        a1 = 1+a0;

    // if there's a heatmap in the graph div data, get rid of 5% padding (jp edit 3/27)
    $(gdd).each(function(i,v){ if(v.type=='heatmap'){ a0=0; a1=1; } });

    // if there's a bar chart in the graph div data and
    // all y-values in graph are positive, get rid of bottom 5% padding
    var positiveBarChart = false;
    $(gdd).each(function(i,v){ if(v.type=='bar' && ydr[0]>=0 && ydr[1]>=0){ positiveBarChart = true; } });

    if(xa.autorange && $.isNumeric(xdr[0])) {
        if(xa.range && xa.range[1]<xa.range[0])
            xa.range=[a1*xdr[1]-a0*xdr[0],a1*xdr[0]-a0*xdr[1]];
        else
            xa.range=[a1*xdr[0]-a0*xdr[1],a1*xdr[1]-a0*xdr[0]];
    }
    if(ya.autorange && $.isNumeric(ydr[0])) {
        if( positiveBarChart == false ){
            if(ya.range && ya.range[1]<ya.range[0])
                ya.range=[a1*ydr[1]-a0*ydr[0],a1*ydr[0]-a0*ydr[1]];
            else
                ya.range=[a1*ydr[0]-a0*ydr[1],a1*ydr[1]-a0*ydr[0]];
        }
        else{
            if(ya.range && ya.range[1]<ya.range[0])
                ya.range=[ydr[1],a1*ydr[0]-a0*ydr[1]];
            else
                ya.range=[ydr[0],a1*ydr[1]-a0*ydr[0]];
        }
    }
    doTicks(gd);

    if(!$.isNumeric(vb.x) || !$.isNumeric(vb.y)) {
        gd.viewbox={x:0, y:0};
        vb=gd.viewbox;
    }

    if($.isNumeric(xa.m) && $.isNumeric(xa.b) && $.isNumeric(ya.m) && $.isNumeric(ya.b)) {
        // now plot the data

        // calculate the final bar width and in-group delta based on gaps defined in gl
        barWidth *= (1-gl.bargap);
        var barDelta = barWidth;
        barWidth *= (1-gl.bargroupgap);

        // draw heatmaps, if any (jp edit 3/27), and reorder the other traces with bars first (ie behind)
        var cdback = [], cdfront = [];
        for(var i in gd.calcdata){
            var cd = gd.calcdata[i], c = cd[0].t.curve, gdc = gd.data[c];
            if(gdc.type=='heatmap')
                heatmap(c,gdc,cd,rdrw,gd);
            else if(gdc.type=='bar')
                cdback.push(cd);
            else
                cdfront.push(cd);
        }
        cdback.push.apply(cdback,cdfront);

        // reorder the rest of traces with bars first

        // plot traces
        // (gp is gd.plot, the inner svg object containing the traces)
        gp.selectAll('g.trace').remove(); // <-- remove old traces before we redraw


        var traces = gp.selectAll('g.trace') // <-- select trace group
            .data(cdback) // <-- bind calcdata to traces
          .enter().append('g') // <-- add a trace for each calcdata
            .attr('class','trace');


        // BUILD TRACE LINES
        traces.each(function(d){ // <-- now, iterate through arrays of {x,y} objects
            var t=d[0].t; // <-- get trace-wide formatting object
            if(t.type=='scatter') {
                if(d[0].t.mode.indexOf('lines')==-1 || d[0].t.visible==false) return;
                var i=-1,t=d3.select(this);
                while(i<d.length) {
                    var pts='';
                    for(i++; i<d.length && $.isNumeric(d[i].x) && $.isNumeric(d[i].y); i++)
                        pts+=xf(d[i],gd)+','+yf(d[i],gd)+' ';
                    if(pts)
                        t.append('polyline').attr('points',pts);
                }
            }
        });

        // BUILD TRACE POINTS
        traces.append('g')
            .attr('class','points')
            .each(function(d){
                var t=d[0].t; // <--- grab trace-wide formatting object in first object of calcdata
                if(t.type=='scatter') {
                    if(t.mode.indexOf('markers')==-1 || d[0].t.visible==false) return;
                    d3.select(this).selectAll('path')
                        .data(function(d){return d})
                        .enter().append('path')
                        .each(function(d){
                            if($.isNumeric(d.x) && $.isNumeric(d.y))
                                d3.select(this)
                                    .attr('transform','translate('+xf(d,gd)+','+yf(d,gd)+')');
                            else d3.select(this).remove();
                        });
                }
                else if(t.type=='bar'){
                    d3.select(this).selectAll('rect')
                        .data(function(d){return d})
                        .enter().append('rect')
                        .attr("width", Math.abs( xf({x:barWidth,y:0},gd) - xf({x:0,y:0},gd) ))// * (1-gl.bargap) * (1-gl.bargroupgap) )
                        .attr("stroke", "black")
                        .attr("fill", defaultColors[t.curve])
                        .each(function(di,d_index){
                            if($.isNumeric(di.x) && $.isNumeric(di.y)){
                                var barHeight = Math.abs(yf(di,gd)-yf({x:0,y:0},gd));
                                var y_offset = 0;
                                var x_offset = -barWidth*0.5;
                                if(gl.barmode == 'stack'){
                                    // now compute y_offset:
                                    var ccn = t.curve;
                                    // look through all previous traces, add offsets
                                    for(var i=0; i<ccn; i++){
                                        var cd = gd.calcdata[i], c = cd[0].t.curve, gdc = gd.data[c];
                                        if(gdc.type=='bar' && gd.calcdata[i][0].t.visible==true){
                                            y_offset += Number(gdc.y[d_index]);
                                        }
                                    }
                                }
                                else if(gl.barmode == 'group') {
                                    var prevVis = 0; // compute the number of visible bar traces before this one
                                    for(var i=0; i<t.curve; i++){
                                        if(gd.calcdata[i][0].t.visible==true && gd.calcdata[i][0].t.type==='bar'){
                                            prevVis += 1; // visibility of trace i
                                        }
                                    }
                                    // shift barDeltas away from previous traces to the right
                                    // and half total-widths to the left
                                    x_offset+=barDelta*(prevVis - (nVis-1)*0.5);
                                }
                                var x_coord = xf({x:x_offset+Number(di.x), y:0}, gd);
                                var y_coord = yf({x:0, y:y_offset+Math.max(di.y,0)}, gd);
                                //console.log('offset = ',y_offset,'y_coord=',y_coord)
                                d3.select(this)
                                    .attr('transform','translate('+x_coord+','+y_coord+')')
                                    .attr("height", barHeight);
                                //console.log((di.y), ' ---> ' ,yf(di,gd));
                            }
                            else d3.select(this).remove();
                        });
                }

                var t=d[0].t;
                if(t.type=='heatmap') return;
                if(!t.mode || t.mode.indexOf('markers')==-1 || d[0].t.visible==false) return;
                d3.select(this).selectAll('path')
                    .data(function(d){return d})
                  .enter().append('path')
                    .each(function(d){
                        if($.isNumeric(d.x) && $.isNumeric(d.y))
                            d3.select(this)
                                .attr('transform','translate('+xf(d,gd)+','+yf(d,gd)+')');
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

    // show annotations
    if(gl.annotations) {
        for(var i=0; i<gl.annotations.length; i++)
            annotation(gd,i);
    }

    try{ killspin(); }
    catch(e){ console.log(e); }
    setTimeout(function(){
        if($(gd).find('#graphtips').length==0 && gd.data!==undefined && gd.showtips!=false){
            try{ showAlert('graphtips'); }
            catch(e){ console.log(e); }
        }
        else if($(gd).find('#graphtips').css('display')=='none'){
            $(gd).find('#graphtips').fadeIn(); }
    },1000);
}

// ------------------------------------------------------------ xf()
// returns a plot x coordinate given a global x coordinate
function xf(d,gd){
    var xa=gd.layout.xaxis;
    var vb=gd.viewbox;
    return d3.round(xa.b+xa.m*d.x+vb.x,2)
}

// ------------------------------------------------------------ yf()
// returns a plot x coordinate given a global x coordinate
function yf(d,gd){
    var ya=gd.layout.yaxis;
    var vb=gd.viewbox;
    return d3.round(ya.b+ya.m*d.y+vb.y,2)
}

// ------------------------------------------------------------ gettab()
// return the visible tab.
// if tabtype is given, make sure it's the right type, otherwise make a new tab
// if it's not a plot, also make sure it's empty, otherwise make a new tab
// plots are special: if you bring new data in it will try to add it to the existing plot
function gettab(tabtype,mode){
    //if(tabtype) console.log('gettab',tabtype,mode);
    var td = $('.ui-tabs-panel:visible')[0];
    if(tabtype){
        if(!td || td.tabtype!=tabtype) td=addTab(tabtype);
        else if(!td.empty && (td.tabtype!='plot' || mode=='new')) td=addTab(tabtype);
    }
    return td;
}

// set display params per trace to default or provided value
function setStyles(gd) {
    // merge object a (which may be an array or a single value) into cd...
    // search the array defaults in case a is missing (and for a default val
    // if some points of o are missing from a)
    function mergeattr(a,attr,dflt) {
        if($.isArray(a)) {
            var l = Math.max(cd.length,a.length);
            for(var i=0; i<l; i++) { cd[i][attr]=a[i] }
            cd[0].t[attr] = dflt; // use the default for the trace-wide value
        }
        else { cd[0].t[attr] = (typeof a != 'undefined') ? a : dflt }
    }
//     console.log(gd.calcdata);
    for(var i in gd.calcdata){
        var cd = gd.calcdata[i], c = cd[0].t.curve, gdc = gd.data[c];
        if(cd[0].t.type==='scatter' || cd[0].t.type===undefined){
            // mergeattr puts single values into cd[0].t, and all others into each individual point
            mergeattr(gdc.type,'type','scatter');
            mergeattr(gdc.visible,'visible',true);
            mergeattr(gdc.mode,'mode',(cd.length>=PTS_LINESONLY) ? 'lines' : 'lines+markers');
            mergeattr(gdc.opacity,'op',1);
            mergeattr(gdc.line.dash,'ld','solid');
            mergeattr(gdc.line.color,'lc',gdc.marker.color || defaultColors[c % defaultColors.length]);
            mergeattr(gdc.line.width,'lw',2);
            mergeattr(gdc.marker.symbol,'mx','circle');
            mergeattr(gdc.marker.opacity,'mo',1);
            mergeattr(gdc.marker.size,'ms',6);
            mergeattr(gdc.marker.color,'mc',cd[0].t.lc);
            mergeattr(gdc.marker.line.color,'mlc',((cd[0].t.lc!=cd[0].t.mc) ? cd[0].t.lc : '#000'));
            mergeattr(gdc.marker.line.width,'mlw',0);
            mergeattr(gdc.text,'tx','');
            mergeattr(gdc.name,'name','trace '+c);
        }
        else if(cd[0].t.type==='heatmap'){
            mergeattr(gdc.type,'type','heatmap');
            mergeattr(gdc.visible,'visible',true);
            mergeattr(gdc.x0,'x0',2);
            mergeattr(gdc.dx,'dx',0.5);
            mergeattr(gdc.y0,'y0',2);
            mergeattr(gdc.dy,'dy',0.5);
            mergeattr(gdc.zmin,'zmin',-10);
            mergeattr(gdc.zmax,'zmax',10);
            mergeattr(JSON.stringify(gdc.scl),'scl',defaultScale);
        }
        else if(cd[0].t.type==='bar'){
            mergeattr(gdc.type,'type','bar');
            mergeattr(gdc.visible,'visible',true);
            mergeattr(gdc.opacity,'op',1);
            mergeattr(gdc.marker.opacity,'mo',1);
            mergeattr(gdc.marker.color,'mc',defaultColors[c % defaultColors.length]);
            mergeattr(gdc.marker.line.color,'mlc','#000' );
            mergeattr(gdc.marker.line.width,'mlw',0);
            mergeattr(gdc.text,'tx','');
            mergeattr(gdc.name,'name','trace '+c);
        }
    }
}

function applyStyle(gp) {
    gp.selectAll('g.trace')
        .call(traceStyle);
    gp.selectAll('g.points')
        .each(function(d){d3.select(this).selectAll('path')
            .call(pointStyle,d[0].t);});

    gp.selectAll('g.points')
        .each(function(d){d3.select(this).selectAll('rect')
            .call(pointStyle,d[0].t);});

    gp.selectAll('g.trace polyline')
        .call(lineGroupStyle);
}


// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

function RgbOnly(cstr) {
    var c = tinycolor(cstr).toRgb();
    return 'rgb('+Math.round(c.r)+', '+Math.round(c.g)+', '+Math.round(c.b)+')';
}

function opacityOnly(cstr) { return tinycolor(cstr).alpha }

function strokeColor(s,c) {
    s.attr('stroke',RgbOnly(c))
     .style('stroke-opacity',opacityOnly(c));
}

function fillColor(s,c) {
    s.style('fill',RgbOnly(c))
     .style('fill-opacity',opacityOnly(c));
}

function setPosition(s,x,y) { s.attr('x',x).attr('y',y) }
function setSize(s,w,h) { s.attr('width',w).attr('height',h) }
function setRect(s,x,y,w,h) { s.call(setPosition,x,y).call(setSize,w,h) }

function traceStyle(s) {
    s.style('opacity',function(d){return d[0].t.op});
}

function lineGroupStyle(s) {
    s.attr('stroke-width',function(d){return d[0].t.lw})
    .each(function(d){d3.select(this).call(strokeColor,d[0].t.lc)})
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

// apply the marker to each point
// draws the marker with diameter roughly markersize, centered at 0,0
function pointStyle(s,t) {
    s.attr('d',function(d){
        var r=((d.ms+1 || t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/2;
        if(!(r>=0)) r=3; // in case of "various" etc... set a visible default
        var rt=String(r*2/Math.sqrt(3)),
            rc=String(r/3),
            rd=String(r*Math.sqrt(2)),
            r2=String(r/2);
        r=String(r)
        var x=(d.mx || t.mx || (d.t ? d.t.mx : ''));
        if(x=='square')
            return 'M'+r+','+r+'H-'+r+'V-'+r+'H'+r+'Z';
        if(x=='diamond')
            return 'M'+rd+',0L0,'+rd+'L-'+rd+',0L0,-'+rd+'Z';
        if(x=='triangle-up')
            return 'M-'+rt+','+r2+'H'+rt+'L0,-'+r+'Z';
        if(x=='triangle-down')
            return 'M-'+rt+',-'+r2+'H'+rt+'L0,'+r+'Z';
        if(x=='triangle-right')
            return 'M-'+r2+',-'+rt+'V'+rt+'L'+r+',0Z';
        if(x=='triangle-left')
            return 'M'+r2+',-'+rt+'V'+rt+'L-'+r+',0Z';
        if(x=='cross')
            return 'M'+r+','+rc+'H'+rc+'V'+r+'H-'+rc+'V'+rc+'H-'+r+'V-'+rc+'H-'+rc+'V-'+r+'H'+rc+'V-'+rc+'H'+r+'Z'
        // circle is default
        return 'M'+r+',0A'+r+','+r+' 0 1,1 0,-'+r+'A'+r+','+r+' 0 0,1 '+r+',0Z';
    })
    .style('opacity',function(d){return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1})
    .each(function(d){
        var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
            p = d3.select(this);
        p.attr('stroke-width',w)
            .call(fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
        if(w)
            p.call(strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : ''))
    });
}

// apply the marker to each bar
// draws the marker with diameter roughly markersize, centered at 0,0
function barStyle(s,t) {
    s.attr('d','M6,6H-6V-6H6Z')
    s.style('opacity',function(d){return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1})
    .each(function(d){
        var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
            p = d3.select(this);
        p.attr('stroke-width',w)
            .call(fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
        if(w)
            p.call(strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : ''))
    });
}

// -----------------------------------------------------
// styling functions for traces in legends.
// same functions for styling traces in the style box
// -----------------------------------------------------

function legendLines(d){
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) return;
    if(!d[0].t.mode || d[0].t.mode.indexOf('lines')==-1) return;
    d3.select(this).append('polyline')
        .call(lineGroupStyle)
        .attr('points','5,0 35,0');
}

function legendPoints(d){
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) return;
    if(!d[0].t.mode || d[0].t.mode.indexOf('markers')==-1) return;
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .call(pointStyle,{})
        .attr('transform','translate(20,0)');
}

function legendBars(d){
    if(d[0].t.type!='bar') return;
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .call(barStyle,{})
        .attr('transform','translate(20,0)');
}

function legendText(s){
    // note: uses d[1] for the original trace number, in case of hidden traces
    return s.append('text')
        .attr('class',function(d){return 'legendtext text-'+d[1]})
        .call(setPosition, 40, 0)
        .attr('text-anchor','start')
        .attr('font-size',12)
        .each(function(d){styleText(this,d[0].t.name,d[0].t.noretrieve)});
}

// -----------------------------------------------------
// restyle and relayout: these two control all redrawing
// for data (restyle) and everything else (relayout)
// -----------------------------------------------------

// astr is the attr name, like 'marker.symbol'
// val is the new value to use
// traces is a trace number or an array of trace numbers to change (blank for all)
function restyle(gd,astr,val,traces) {
    gd.changed = true;

    // mode and gaps for bar charts are graph-wide attributes, but make
    // more sense in the style box than the layout box. here we update gd.layout,
    // force a replot, then return
    if(['barmode','bargap','bargroupgap'].indexOf(astr)!=-1){
        gd.layout[astr] = val;
        plot(gd,'','');
        return;
    }

    if($.isNumeric(traces)) traces=[traces];
    else if(!$.isArray(traces) || !traces.length)
        traces=gd.data.map(function(v,i){return i});

    // set attribute in gd.data
    var aa=astr.split('.');
    for(i=0; i<traces.length; i++) {
        var cont=gd.data[traces[i]];
        for(var j=0; j<aa.length-1; j++) cont=cont[aa[j]];
        cont[aa[j]]=val;
    }
    // need to replot if mode or visibility changes, because the right objects don't exist
    // also need to replot if a heatmap
    var hm_attr=['mincolor','maxcolor','scale','x0','dx','y0','dy','zmin','zmax','scl'];
    if(['mode','visible','type','barmode'].indexOf(astr)>=0||hm_attr.indexOf(astr)>=0)
        plot(gd,'','',true); // <-- last arg is to force redrawing the heatmap
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
    gd.changed = true;
    var gl = gd.layout,
        aobj = {},
        legendonly = true;
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
        if((i=='height' || i=='width') && !aobj.autosize) {
            gl.autosize=false;
        }
        var m = i.match(/^(.)axis\.range\[[0|1]\]$/);
        if(m && m.length==2) {
            gl[m[1]+'axis'].autorange=false;
        }

        var aa = propSplit(i);
        // toggling log without autorange: need to also recalculate ranges
        /*AXISTYPEif(aa[1]=='islog'  && !gl[aa[0]].isdate && !gl[aa[0]].autorange &&
            (gl[aa[0]].islog ? !aobj[i] : aobj[i])) {*/ // logical XOR (ie will islog actually change)
        if(aa[1]=='type' && !gl[aa[0]].type=='date' && !gl[aa[0]].autorange &&
                    (gl[aa[0]].type=='log' ? !aobj[i] : aobj[i])) {
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
        // send annotation mods one-by-one through annotation(), don't set via nestedProperty
        if(aa[0]=='annotations') {
            annotation(gd,aa[1],i.replace(/^annotations\[-?[0-9]*\][.]/,''),aobj[i]);
            delete aobj[i];
        }
        // alter gd.layout
        else {
            if(aa[0].indexOf('legend')==-1) {
                legendonly = false;
            }
            nestedProperty(gl,i).set(aobj[i]);
        }
    }

    // calculate autosizing
    if(aobj.autosize) aobj=plotAutoSize(gd,aobj);

    // redraw
    // first check if there's still anything to do
    var ak = Object.keys(aobj);
    if(ak.length) {
        // if all that's left is legend changes, no need to redraw the whole graph
        if(legendonly) {
            gd.paper.selectAll('.legend').remove();
            if(gl.showlegend) {
                legend(gd);
            }
        }
        else {
            gd.layout = undefined; // force plot to redo the layout
            plot(gd,'',gl);
        }
    }
}

// convert a string (such as 'xaxis.range[0]')
// representing a property of nested object o into set and get methods
function nestedProperty(o,s) {
    var cont = o,
        aa = propSplit(s);
    for(var j=0; j<aa.length-1; j++) {
        cont = cont[aa[j]]
    }
    var prop = aa[j];

    return {set:function(v){cont[prop]=v},
            get:function(){return cont[prop]}};
}

function propSplit(s) {
    var aa = s.split('.');
    for(var j=0; j<aa.length; j++) {
        var indexed = String(aa[j]).match(/([^\[\]]*)\[([0-9]*)\]/);
        if(indexed) {
            aa.splice(j,1,indexed[1],Number(indexed[2]));
        }
    }
    return aa;
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
    if(gd.tabtype=='plot' && gd.layout && gd.layout.autosize) {
        setTimeout(function(){
            relayout(gd, {autosize:true});
            if(LIT) {
                hidebox();
                litebox();
            }
        }, 500);
    }
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
	// test if this is on the main site or embedded
	gd.mainsite=Boolean($('#plotlyMainMarker').length);

    // destroy any plot that already exists in this div
    // first check if we can save the toolbars
    if($(gd).children('.graphbar').length==1 &&
            $(gd).children('.demobar').length==1 &&
            $(gd).children('svg').length==1 &&
            $(gd).children().length>=3) { /* 4th child is graph tips alert div */
        $(gd).children('svg').remove();
    }
    else { // not the right children (probably none, but in case something goes wrong redraw all)
        gd.innerHTML='';

        if(gd.mainsite) { graphbar(gd) }
    }

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
        plot_bgcolor:'#fff',
        barmode:'stack',
        bargap:0.2,
        bargroupgap:0.0 };
        // TODO: add font size controls, and label positioning

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
    gd.paper=gd3.append('svg')
        .call(setSize, gl.width, gl.height);
    gd.paperbg=gd.paper.append('rect')
        .call(setRect, 0, 0, gl.width, gl.height)
        .call(fillColor, gl.paper_bgcolor);
    gd.plotwidth=gl.width-ml-mr;
    gd.plotheight=gl.height-mt-mb;
    gd.plotbg=gd.paper.append('rect')
        .call(setRect, ml-mp, mt-mp, gd.plotwidth+2*mp, gd.plotheight+2*mp)
        .call(fillColor, gl.plot_bgcolor)
        .attr('stroke','black') //TODO: axis colors, thicknesses, mirror on and off
        .attr('stroke-width',1);

    // make the ticks, grids, and titles
    gd.axislayer=gd.paper.append('g').attr('class','axislayer');
    doTicks(gd);
    gl.xaxis.r0=gl.xaxis.range[0];
    gl.yaxis.r0=gl.yaxis.range[0];

    makeTitles(gd,''); // happens after ticks, so we can scoot titles out of the way if needed

    // Second svg (plot) is for the data
    gd.plot=gd.paper.append('svg')
        .call(setRect, ml, mt, gd.plotwidth, gd.plotheight)
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
            .call(setRect, x,y,w,h)
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
        return pauseEvent(e);
    }

    function zoomBox(e){
        var gbb = $(gd).find('.nsewdrag')[0].getBoundingClientRect(),
            x0 = e.clientX,
            y0 = e.clientY,
            zb = $('<div id="zoombox" style="left: '+x0+'px; top: '+y0+'px;"></div>').appendTo('body');
        window.onmousemove = function(e2) {
            var x1 = Math.max(gbb.left,Math.min(gbb.right,e2.clientX)),
                y1 = Math.max(gbb.top,Math.min(gbb.bottom,e2.clientY));
            zb.css({
                left: Math.min(x0,x1)+'px',
                top: Math.min(y0,y1)+'px',
                width: Math.abs(x0-x1)+'px',
                height: Math.abs(y0-y1)+'px'
            })
            .addClass(tinycolor(gd.layout.plot_bgcolor).toHsl().l>0.3 ? 'dark' : 'light');
            return pauseEvent(e);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null;
            window.onmouseup = null;
            var zbb = zb[0].getBoundingClientRect();
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
            $('#zoomboxbackdrop,#zoombox').click(finishZB);
            $('#zoomboxin').click(function(){
                gx.range=[gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.left-gbb.left)/gbb.width,
                          gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.right-gbb.left)/gbb.width];
                gy.range=[gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.bottom)/gbb.height,
                          gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.top)/gbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            })
            $('#zoomboxout').click(function(){
                gx.range=[(gx.range[0]*(zbb.right-gbb.left)+gx.range[1]*(gbb.left-zbb.left))/zbb.width,
                          (gx.range[0]*(zbb.right-gbb.right)+gx.range[1]*(gbb.right-zbb.left))/zbb.width];
                gy.range=[(gy.range[0]*(gbb.bottom-zbb.top)+gy.range[1]*(zbb.bottom-gbb.bottom))/zbb.height,
                          (gy.range[0]*(gbb.top-zbb.top)+gy.range[1]*(zbb.bottom-gbb.top))/zbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            })
            return pauseEvent(e2);
        }

        function finishZB(){
            $('#zoombox,#zoomboxbackdrop,#zoomboxmenu').remove();
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
            return pauseEvent(e2);
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
                        autoGrowInput(dragger);
                }
            }
            return pauseEvent(e2);
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
        else if(!ns) {
            dy=0;
        }

        gd.plot.attr('viewBox', ((ew=='w')?dx:0)+' '+((ns=='n')?dy:0)+' '+(pw-dx)+' '+(ph-dy));
        if(ew) { doTicks(gd,'x') }
        if(ns) { doTicks(gd,'y') }
    }

    // common transform for dragging one end of an axis
    // d>0 is compressing scale, d<0 is expanding
    function dZoom(d) {
        if(d>=0) { return 1 - Math.min(d,0.9) }
        else
            { return 1 - 1/(1/Math.max(d,-0.3)+3.222) }
    }

    function resetViewBox() {
        gd.viewbox={x:0,y:0};
        gd.plot.attr('viewBox','0 0 '+gd.plotwidth+' '+gd.plotheight);
        dragTail(gd);
    }
}

function dragTail(gd) {
    gd.changed = true;
    doTicks(gd); // TODO: plot does this again at the end... why do we need to do them here?
    plot(gd,'','');
}

// ----------------------------------------------------
// Titles and text inputs
// ----------------------------------------------------

function makeTitles(gd,title) {
    var gl=gd.layout;
    var titles={
        'xtitle':{x: (gl.width+gl.margin.l-gl.margin.r-(gd.lw || 0))/2,
            y: gl.height+(gd.lh<0 ? gd.lh : 0) - 14*0.75,
            w: gd.plotwidth/2, h: 14,
            cont: gl.xaxis, fontSize: 14, name: 'X axis',
            transform: '', attr: {}},
        'ytitle':{x: 20-(gd.lw<0 ? gd.lw : 0),
            y: (gl.height+gl.margin.t-gl.margin.b+(gd.lh || 0))/2,
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
                .call(setPosition, t.x, t.y)
                .attr('font-size',t.fontSize)
                .attr('text-anchor','middle')
                .attr('transform',t.transform.replace('x',t.x).replace('y',t.y))
            if(gd.mainsite)
                el.on('click',function(){autoGrowInput(this)});

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
                    if(bBoxIntersect(titlebb,lbb)) {
                        ticky=Math.min(Math.max(ticky,lbb.bottom),gdbb.bottom-titlebb.height);
                    }
                }
                if(ticky>titlebb.top) {
                    el.attr('transform','translate(0,'+(ticky-titlebb.top)+') '+el.attr('transform'));
                }
            }
            if(k=='ytitle'){
                var labels=gd.paper.selectAll('text.ytick')[0], tickx=screen.width;
                for(var i=0;i<labels.length;i++){
                    var lbb=labels[i].getBoundingClientRect();
                    if(bBoxIntersect(titlebb,lbb))
                        tickx=Math.max(Math.min(tickx,lbb.left),gdbb.left+titlebb.width);
                }
                if(tickx<titlebb.right) {
                    el.attr('transform','translate('+(tickx-titlebb.right)+') '+el.attr('transform'));
                }
            }
        }
    }
}

// -----------------------------------------------------
// legend drawing
// -----------------------------------------------------

function legend(gd) {
    var gl=gd.layout,gm=gl.margin;
    gl.showlegend = true;
    if(!gl.legend) { gl.legend={} }
    var gll = gl.legend;
    gd.paper.selectAll('.legend').remove();
    if(!gd.calcdata) { return }

    var ldata=[];
    for(var i=0;i<gd.calcdata.length;i++) {
        if(gd.calcdata[i][0].t.visible!=false) {
            ldata.push([gd.calcdata[i][0],i]); // i is appended as d[1] so we know which element of gd.data it refers to
        }
    }

    gd.legend=gd.paper.append('svg')
        .attr('class','legend');

    var bordercolor = gll.bordercolor || '#000',
        borderwidth = gll.borderwidth || 1,
        bgcolor = gll.bgcolor || gl.paper_bgcolor || '#fff';
    gd.legend.append('rect')
        .attr('class','bg')
        .call(strokeColor,bordercolor)
        .attr('stroke-width',borderwidth)
        .call(fillColor,bgcolor)
        .call(setPosition, borderwidth/2, borderwidth/2);

    var traces = gd.legend.selectAll('g.traces')
        .data(ldata);
    traces.enter().append('g').attr('class','trace');

    traces.append('g')
        .call(traceStyle)
        .each(legendBars)
        .each(legendLines)
        .each(legendPoints);

    var tracetext=traces.call(legendText).selectAll('text');
    if(gd.mainsite) {
        tracetext.on('click',function(){
            if(!gd.dragged) { autoGrowInput(this) }
        });
    }

    // add the legend elements, keeping track of the legend size (in px) as we go
    var legendwidth=0, legendheight=0;
    traces.each(function(d){
        var g=d3.select(this), t=g.select('text'), l=g.select('.legendpoints');
        if(d[0].t.showinlegend===false) {
            g.remove();
            return;
        }
        var tbb = t.node().getBoundingClientRect();
        if(!l.node()) { l=g.select('polyline') }
        var lbb = (!l.node()) ? tbb : l.node().getBoundingClientRect();
        t.attr('y',(lbb.top+lbb.bottom-tbb.top-tbb.bottom)/2);
        var gbb = this.getBoundingClientRect();
        legendwidth = Math.max(legendwidth,tbb.width);
        g.attr('transform','translate('+borderwidth+','+(5+borderwidth+legendheight+gbb.height/2)+')');
        legendheight += gbb.height+3;
    });
    legendwidth += 45+borderwidth*2;
    legendheight += 10+borderwidth*2;

    // now position the legend. for both x,y the positions are recorded as fractions
    // of the plot area (left, bottom = 0,0). Outside the plot area is allowed but
    // position will be clipped to the plot area. Special values +/-100 auto-increase
    // the margin to put the legend entirely outside the plot area on the high/low side.
    // Otherwise, values <1/3 align the low side at that fraction, 1/3-2/3 align the
    // center at that fraction, >2/3 align the right at that fraction
    var pw = gl.width-gm.l-gm.r,
        ph = gl.height-gm.t-gm.b;
    // defaults... the check for >10 and !=100 is to remove old style positioning in px
    if(!$.isNumeric(gll.x) || (gll.x>10 && gll.x!=100)) { gll.x=0.98 }
    if(!$.isNumeric(gll.y) || (gll.y>10 && gll.y!=100)) { gll.y=0.98 }

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
        if(gll.x>2/3) { lx -= legendwidth }
        else if(gll.x>1/3) { lx -= legendwidth/2 }
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
        if(gll.y<1/3) { ly -= legendheight }
        else if(gll.y<2/3) { ly -= legendheight/2 }
    }

    // push the legend back onto the page if it extends off, making sure if nothing else
    // that the top left of the legend is visible
    if(lx+legendwidth>gl.width) { lx=gl.width-legendwidth }
    if(lx<0) { lx=0 }
    if(ly+legendheight>gl.height) { ly=gl.height-legendheight }
    if(ly<0) { ly=0 }

    gd.legend.call(setRect, lx, ly, legendwidth, legendheight);
    gd.legend.selectAll('.bg')
        .call(setSize, legendwidth-borderwidth, legendheight-borderwidth);

    // user dragging the legend
    // aligns left/right/center on resize or new text if drag pos
    // is in left 1/3, middle 1/3, right 1/3
    // choose left/center/right align via:
    //  xl=(left-ml)/plotwidth, xc=(center-ml/plotwidth), xr=(right-ml)/plotwidth
    //  if(xl<2/3-xc) gll.x=xl;
    //  else if(xr>4/3-xc) gll.x=xr;
    //  else gll.x=xc;
    // similar logic for top/middle/bottom
    gd.legend.node().onmousedown = function(e) {
        if(dragClear(gd)) return true; // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            xf=undefined,
            yf=undefined;
        gd.dragged = false;
        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY;
            if(Math.abs(dx)<MINDRAG) { dx=0 }
            if(Math.abs(dy)<MINDRAG) { dy=0 }
            if(dx||dy) { gd.dragged = true }
            el3.call(setPosition, x0+dx, y0+dy);
            var pbb = gd.paper.node().getBoundingClientRect();
            // drag to within a couple px of edge to take the legend outside the plot
            if(e2.clientX>pbb.right-3*MINDRAG || (gd.lw>0 && dx>-MINDRAG)) {
                xf=100;
            }
            else if(e2.clientX<pbb.left+3*MINDRAG || (gd.lw<0 && dx<MINDRAG)) {
                xf=-100;
            }
            else {
                var xl=(x0+dx-gm.l+(gd.lw<0 ? gd.lw : 0))/(gl.width-gm.l-gm.r-(gd.lw ? Math.abs(gd.lw) : 0)),
                    xr=xl+legendwidth/(gl.width-gm.l-gm.r),
                    xc=(xl+xr)/2;
                if(xl<(2/3)-xc) xf=xl;
                else if(xr>4/3-xc) xf=xr;
                else xf=xc;
            }
            if(e2.clientY>pbb.bottom-3*MINDRAG || (gd.lh<0 && dy>-MINDRAG)) {
                yf=-100;
            }
            else if(e2.clientY<pbb.top+3*MINDRAG || (gd.lh>0 && dy<MINDRAG)) {
                yf=100;
            }
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
            else csr = nineCursors(xf,yf);
            $(eln).css('cursor',csr);
            return pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            $(eln).css('cursor','');
            if(gd.dragged && xf!=undefined && yf!=undefined) {
                relayout(gd,{'legend.x':xf,'legend.y':yf});
            }
            return pauseEvent(e2);
        }
        return pauseEvent(e);
    }
}

// -----------------------------------------------------
// make or edit an annotation on the graph
// -----------------------------------------------------

// annotations are stored in gd.layout.annotations, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw,
//  or 'remove' to delete this annotation
function annotation(gd,index,opt,value) {
    var gl = gd.layout,gm = gl.margin;
    if(!gl.annotations)
        gl.annotations = [];
    if(!$.isNumeric(index)) {
        index = gl.annotations.length;
        gl.annotations.push({});
    }
    else if(index==-1) {
        for(var i=0; i<gl.annotations.length; i++) {annotation(gd,i,opt,value)}
        return;
    }
    // remove the existing annotation (and its record, if requested)
    gd.paper.selectAll('.annotation[data-index="'+index+'"]').remove();
    if(opt=='remove') {
        gl.annotations.splice(index,1);
        for(var i=index; i<gl.annotations.length; i++) {
            gd.paper.selectAll('.annotation[data-index="'+(i+1)+'"]')
                .attr('data-index',String(i));
        }
        return;
    }

    // edit the options
    var options = gl.annotations[index];
    var oldref = options.ref,
        xa = gd.layout.xaxis,
        ya = gd.layout.yaxis;
    if(typeof opt == 'string') { options[opt] = value }
    else if(opt) { Object.keys(opt).forEach(function(k){ options[k] = opt[k] }) }

    if(oldref && options.x && options.y) {
        if(options.ref=='plot' && oldref=='paper') {
            options.x = xa.range[0]+(xa.range[1]-xa.range[0])*options.x;
            options.y = ya.range[0]+(ya.range[1]-ya.range[0])*options.y;
        }
        else if(options.ref=='paper' && oldref=='plot') {
            options.x = (options.x-xa.range[0])/(xa.range[1]-xa.range[0]);
            options.y = (options.y-ya.range[0])/(ya.range[1]-ya.range[0]);
        }
    }
    // set default options (default x, y, ax, ay are set later)
    if(!options.bordercolor) { options.bordercolor = '' }
    if(!$.isNumeric(options.borderwidth)) { options.borderwidth = 1 }
    if(!options.bgcolor) { options.bgcolor = 'rgba(0,0,0,0)' }
    if(!options.ref) { options.ref='plot' }
    if(options.showarrow!=false) { options.showarrow=true }
    if(!$.isNumeric(options.borderpad)) { options.borderpad=1 }
    if(!options.arrowwidth) { options.arrowwidth = 0 }
    if(!options.arrowcolor) { options.arrowcolor = '' }
    if(!$.isNumeric(options.arrowhead)) { options.arrowhead=1 }
    if(!$.isNumeric(options.arrowsize)) { options.arrowsize=1 }
    if(!options.text) { options.text=((options.showarrow && (options.text=='')) ? '' : 'new text') }

    // get the paper and plot bounding boxes before adding pieces that go off screen
    // firefox will include things that extend outside the original... can we avoid that?
    var paperbb = gd.paper.node().getBoundingClientRect(),
        plotbb = d3.select(gd).select('.nsewdrag').node().getBoundingClientRect(),
        x = plotbb.left-paperbb.left,
        y = plotbb.top-paperbb.top;

    // create the components
    var ann = gd.paper.append('svg')
        .attr('class','annotation')
        .call(setPosition,0,0)
        .attr('data-index',String(index));
    var abb = ann.node().getBoundingClientRect();

    var borderwidth = options.borderwidth;
    var annbg = ann.append('rect')
        .attr('class','bg')
        .call(strokeColor,options.bordercolor || 'rgba(0,0,0,0)')
        .attr('stroke-width',borderwidth)
        .call(fillColor,options.bgcolor)
        .call(setPosition, borderwidth/2+1, borderwidth/2+1);

    if(!options.align) options.align='center';
    var anntext = ann.append('text')
        .attr('class','annotation')
        .call(setPosition,0,0)
        .attr('text-anchor',{left:'start', center:'middle', right:'end'}[options.align])
        .attr('font-size',12);
    styleText(anntext.node(),options.text);

    if(gd.mainsite) {
        anntext.on('click',function(){
            if(!gd.dragged) {autoGrowInput(this)}
        });
    }

    var atbb = anntext.node().getBoundingClientRect(),
        annwidth = atbb.width,
        annheight = atbb.height;
    if(!options.ax) options.ax=-10;
    if(!options.ay) options.ay=-annheight/2-20;
    // now position the annotation and arrow, based on options[x,y,ref,showarrow,ax,ay]

    // position is either in plot coords (ref='plot') or
    // in fraction of the plot area (ref='paper') as with legends,
    // except that positions outside the plot are just numbers outside [0,1]
    // but we will constrain the annotation center to be on the page,
    // in case it gets dragged too far.

    // if there's no arrow, alignment is as with legend (values <1/3 align the low side
    // at that fraction, 1/3-2/3 align the center at that fraction, >2/3 align the right
    // at that fraction) independent of the alignment of the text

    // if there is an arrow, alignment is to the arrowhead, and ax and ay give the
    // offset (in pixels) between the arrowhead and the center of the annotation

    if(options.ref=='paper') {
        if(!$.isNumeric(options.x)) options.x=0.5;
        if(!$.isNumeric(options.y)) options.y=0.8;
        x += plotbb.width*options.x;
        y += plotbb.height*(1-options.y);
        if(!options.showarrow){
            if(options.x>2/3) x -= annwidth/2;
            else if(options.x<1/3) x += annwidth/2;

            if(options.y<1/3) y -= annheight/2;
            else if(options.y>2/3) y += annheight/2;
        }
    }
    else {
        // hide the annotation if it's pointing outside the visible plot
        if((options.x-xa.range[0])*(options.x-xa.range[1])>0 || (options.y-ya.range[0])*(options.y-ya.range[1])>0) {
            ann.remove();
            return;
        }
        if(!$.isNumeric(options.x)) options.x=(xa.range[0]+xa.range[1])/2;
        if(!$.isNumeric(options.y)) options.y=(ya.range[0]*0.2+ya.range[1]*0.8);
        x += xa.b+options.x*xa.m;
        y += ya.b+options.y*ya.m;
    }

    // if there's an arrow, it gets the position we just calculated, and the text gets offset by ax,ay
    // and make sure the text and arrowhead are on the paper
    if(options.showarrow){
        var ax = constrain(x,1,paperbb.width-1),
            ay = constrain(y,1,paperbb.height-1);
        x += options.ax;
        y += options.ay;
    }
    x = constrain(x,1,paperbb.width-1);
    y = constrain(y,1,paperbb.height-1);

    var borderpad = Number(options.borderpad),
        borderfull = borderwidth+borderpad+1,
        outerwidth = annwidth+2*borderfull,
        outerheight = annheight+2*borderfull;
    ann.call(setRect, x-outerwidth/2, y-outerheight/2, outerwidth, outerheight);
    annbg.call(setSize, annwidth+borderwidth+2*borderpad, annheight+borderwidth+2*borderpad);
    anntext.call(setPosition, paperbb.left-atbb.left+borderfull, paperbb.top-atbb.top+borderfull)
      .selectAll('tspan')
        .attr('x',paperbb.left-atbb.left+borderfull);

    // add the arrow
    // uses options[arrowwidth,arrowcolor,arrowhead] for styling
    var drawArrow = function(dx,dy){
        $(gd).find('g.annotation[data-index="'+index+'"]').remove();
        // find where to start the arrow:
        // at the border of the textbox, if that border is visible,
        // or at the edge of the lines of text, if the border is hidden
        // TODO: commented out for now... tspan bounding box fails in chrome
        // looks like there may be a cross-browser solution, see
        // http://stackoverflow.com/questions/5364980/how-to-get-the-width-of-an-svg-tspan-element
        var ax0 = x+dx,
            ay0 = y+dy,
            showline = true;
//         if(borderwidth && tinycolor(bordercolor).alpha) {
            var boxes = [annbg.node().getBoundingClientRect()],
                pad = 0;
//         }
//         else {
//             var end_el = anntext.selectAll('tspan'),
//                 pad = 3;
//         }
//         console.log(end_el);
        boxes.forEach(function(bb){
            var x1 = bb.left-paperbb.left-pad,
                y1 = bb.top-paperbb.top-pad,
                x2 = bb.right-paperbb.left+pad,
                y2 = bb.bottom-paperbb.top+pad,
                edges = [[x1,y1,x1,y2],[x1,y2,x2,y2],[x2,y2,x2,y1],[x2,y1,x1,y1]];
            if(ax>x1 && ax<x2 && ay>y1 && ay<y2) { // remove the line if it ends inside the box
                showline=false;
                return;
            }
            edges.forEach(function(i){
                var p = line_intersect(ax0,ay0,ax,ay,i[0],i[1],i[2],i[3]);
                if(!p) { return }
                ax0 = p.x;
                ay0 = p.y;
            });
        });
        if(showline) {
            var strokewidth = options.arrowwidth||borderwidth*2;
            var arrowgroup = gd.paper.append('g')
                .attr('class','annotation')
                .attr('data-index',String(index));
            var arrow = arrowgroup.append('path')
                .attr('class','annotation')
                .attr('data-index',String(index))
                .attr('d','M'+ax0+','+ay0+'L'+ax+','+ay)
                .attr('stroke-width',strokewidth)
                .call(strokeColor,options.arrowcolor || options.bordercolor || '#000');
            arrowhead(arrow,options.arrowhead,'end',options.arrowsize)
            var arrowdrag = arrowgroup.append('path')
                .attr('class','annotation anndrag')
                .attr('data-index',String(index))
                .attr('d','M3,3H-3V-3H3ZM0,0L'+(ax0-ax)+','+(ay0-ay))
                .attr('transform','translate('+ax+','+ay+')')
                .attr('stroke-width',strokewidth+6)
                .call(strokeColor,'rgba(0,0,0,0)')
                .call(fillColor,'rgba(0,0,0,0)');
            arrowdrag.node().onmousedown = function(e) {
                if(dragClear(gd)) { return true } // deal with other UI elements, and allow them to cancel dragging

                var eln=this,
                    el3=d3.select(this),
                    annx0=Number(ann.attr('x')),
                    anny0=Number(ann.attr('y')),
                    xf=undefined,
                    yf=undefined;
                gd.dragged = false;
                window.onmousemove = function(e2) {
                    var dx = e2.clientX-e.clientX,
                        dy = e2.clientY-e.clientY;
                    if(Math.abs(dx)<MINDRAG) dx=0;
                    if(Math.abs(dy)<MINDRAG) dy=0;
                    if(dx||dy) {gd.dragged = true}
                    arrowgroup.attr('transform','translate('+dx+','+dy+')');
                    ann.call(setPosition, annx0+dx, anny0+dy);
                    if(options.ref=='paper') {
                        xf=(ax+dx-gm.l+(gd.lw<0 ? gd.lw : 0))/(gl.width-gm.l-gm.r-(gd.lw ? Math.abs(gd.lw) : 0));
                        yf=(ay+dy-gm.t-(gd.lh>0 ? gd.lh : 0))/(gl.height-gm.t-gm.b-(gd.lh ? Math.abs(gd.lh) : 0));
                    }
                    else {
                        xf = options.x+dx/gd.layout.xaxis.m;
                        yf = options.y+dy/gd.layout.yaxis.m;
                    }
                    return pauseEvent(e2);
                }
                window.onmouseup = function(e2) {
                    window.onmousemove = null; window.onmouseup = null;
                    if(gd.dragged && xf!=undefined && yf!=undefined) {
                        gd.changed = true;
                        annotation(gd,index,{x:xf,y:yf});
                    }
                    return pauseEvent(e2);
                }
                return pauseEvent(e);
            }
        }
    }
    if(options.showarrow) {drawArrow(0,0)}

    // user dragging the annotation
    // aligns left/right/center on resize or new text if drag pos
    // is in left 1/3, middle 1/3, right 1/3
    // choose left/center/right align via:
    //  xl=(left-ml)/plotwidth, xc=(center-ml/plotwidth), xr=(right-ml)/plotwidth
    //  if(xl<2/3-xc) gll.x=xl;
    //  else if(xr>4/3-xc) gll.x=xr;
    //  else gll.x=xc;
    ann.node().onmousedown = function(e) {
        if(dragClear(gd)) return true; // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            xf=undefined,
            yf=undefined;
        gd.dragged = false;
        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY;
            if(Math.abs(dx)<MINDRAG) dx=0;
            if(Math.abs(dy)<MINDRAG) dy=0;
            if(dx||dy) {gd.dragged = true}
            el3.call(setPosition, x0+dx, y0+dy);
            var csr='pointer';
            if(options.showarrow) {
                xf = options.ax+dx;
                yf = options.ay+dy;
                drawArrow(dx,dy);
            }
            else if(options.ref=='paper') {
                var xl=(x0+dx-gm.l+(gd.lw<0 ? gd.lw : 0))/(gl.width-gm.l-gm.r-(gd.lw ? Math.abs(gd.lw) : 0)),
                    xr=xl+legendwidth/(gl.width-gm.l-gm.r),
                    xc=(xl+xr)/2;
                if(xl<(2/3)-xc) xf=xl;
                else if(xr>4/3-xc) xf=xr;
                else xf=xc;
                var yt=(y0+dy-gm.t-(gd.lh>0 ? gd.lh : 0))/(gl.height-gm.t-gm.b-(gd.lh ? Math.abs(gd.lh) : 0)),
                    yb=yt+legendheight/(gl.height-gm.t-gm.b),
                    yc=(yt+yb)/2;
                if(yt<(2/3)-yc) yf=1-yt;
                else if(yb>4/3-yc) yf=1-yb;
                else yf=1-yc;
                // now set the mouse cursor so user can see how the annotation will be aligned
                csr = nineCursors(xf,yf);
            }
            else {
                xf = options.x+dx/gd.layout.xaxis.m;
                yf = options.y+dy/gd.layout.yaxis.m;
            }
            $(eln).css('cursor',csr);
            return pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            $(eln).css('cursor','');
            if(gd.dragged && xf!=undefined && yf!=undefined) {
                annotation(gd,index,options.showarrow ? {ax:xf,ay:yf} : {x:xf,y:yf});
            }
            return pauseEvent(e2);
        }
        return pauseEvent(e);
    }
}

// set cursors pointing toward the closest corner/side, to indicate alignment
function nineCursors(x,y){
    if(x<1/3) {
        if(y<1/3) {return 'sw-resize'}
        if(y<2/3) {return 'w-resize'}
        return 'nw-resize';
    }
    if(x<2/3) {
        if(y<1/3) {return 's-resize'}
        if(y<2/3) {return 'move'}
        return 'n-resize';
    }
    if(y<1/3) {return 'se-resize'}
    if(y<2/3) {return 'e-resize'}
    return 'ne-resize';
}

// add arrowhead(s) to a path or line d3 element el3
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)
function arrowhead(el3,style,ends,mag) {
    var el = el3.node();
        s = ['M-1,-2V2L1,0Z',
            'M-2,-2V2L2,0Z',
            'M-2,-2L0,0L-2,2L2,0Z',
            'M-2.2,-2.2L0,0L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
            'M-4.2,-2.1L0,0L-4.2,2.1L-3.8,3L2.2,0L-3.8,-3Z',
            'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',
            'M2,2V-2H-2V2Z'][style-1];
    if(!s) return;
    if(typeof ends != 'string' || !ends) ends = 'end';

    if(el.nodeName=='line') {
        var start = {x:el3.attr('x1'),y:el3.attr('y1')},
            end = {x:el3.attr('x2'),y:el3.attr('y2')},
            dstart = end,
            dend = start;
    }
    else if(el.nodeName=='path') {
        var start = el.getPointAtLength(0),
            dstart = el.getPointAtLength(0.1),
            pathlen = el.getTotalLength(),
            end = el.getPointAtLength(pathlen),
            dend = el.getPointAtLength(pathlen-0.1);
    }

    var drawhead = function(p,q) {
        var rot = Math.atan2(p.y-q.y,p.x-q.x)*180/Math.PI,
            scale = (el3.attr('stroke-width') || 1)*(mag||1),
            stroke = el3.attr('stroke') || '#000',
            opacity = el3.style('stroke-opacity') || 1;
        if(style>5) { rot=0 } // don't rotate square or circle
        d3.select(el.parentElement).append('path')
            .attr('class',el3.attr('class'))
            .attr('data-index',el3.attr('data-index'))
            .style('fill',stroke)
            .style('fill-opacity',opacity)
            .attr('stroke-width',0)
            .attr('d',s)
            .attr('transform','translate('+p.x+','+p.y+')rotate('+rot+')scale('+scale+')');
    }

    if(ends.indexOf('start')>=0) { drawhead(start,dstart) }
    if(ends.indexOf('end')>=0) { drawhead(end,dend) }
}

// allArrowheads: call twice to make an arrowheads dropdown.
// once (with no container) for the data to send to layoutBoxDrop,
// and again (with a container) to add arrowheads to the list
function allArrowheads(container){
    // with no args, output an array of elements for the dropdown list
    if(!container) {
        out=[];
        for(var i=1; i<=7; i++){
            out.push({
                val:i,
                name:'<svg width="40" height="20" data-arrowhead="'+i+'" style="position: relative; top: 2px;">'+
                    '<line stroke="rgb(0,0,0)" style="fill: none;" x1="5" y1="10" x2="25" y2="10" stroke-width="2">'+
                    '</line></svg>'
            });
        }
        return out;
    }
    // if a dom element is passed in, add appropriate arrowheads to every arrowhead selector in the container
    else {
        $(container).find('[data-arrowhead]').each(function(){
            arrowhead(d3.select(this).select('line'),Number($(this).attr('data-arrowhead')));
        });
    }
}

function constrain(v,v0,v1) { return Math.max(v0,Math.min(v1,v)) }

// look for intersection of two line segments (1->2 and 3->4) - returns array [x,y] if they do, null if not
// return the intersection and the fraction of the way from 1->2 (t) and 3->4 (u)
function line_intersect(x1,y1,x2,y2,x3,y3,x4,y4) {
    var a=x2-x1, b=x3-x1, c=x4-x3,
        d=y2-y1, e=y3-y1, f=y4-y3,
        det=a*f-c*d;
    if(det==0) { return null } // parallel lines, so intersection is undefined - ignore the case where they are colinear
    var t=(b*f-c*e)/det,
        u=(b*d-a*e)/det;
    if(u<0 || u>1 || t<0 || t>1) { return null } // segments do not intersect
    return {x:x1+a*t, y:y1+d*t};
}

// since our drag events cancel event bubbling, need to explicitly deal with other elements
function dragClear(gd) {
    // explicitly disable dragging when a popover is present
    if($('.popover').length) return true;
    // because we cancel event bubbling, input won't receive its blur event.
    if(gd.input) gd.input.trigger('blur');
    return false;
}

// -----------------------------------------------------
// Auto-grow text input, for editing graph items
// -----------------------------------------------------

// from http://jsbin.com/ahaxe, heavily edited
// to grow centered, set o.align='center'
// el is the raphael element containing the edited text (eg gd.xtitle)
// cont is the location the value is stored (eg gd.layout.xaxis)
// prop is the property name in that container (eg 'title')
// o is the settings for the input box (can be left blank to use defaults below)
// This is a bit ugly... but it's the only way I could find to pass in the element
// (and layout var) totally by reference...
function autoGrowInput(eln) {
    var gd=$(eln).parents('.ui-tabs-panel')[0];
    $(eln).tooltip('destroy'); // TODO: would like to leave this visible longer but then it loses its parent... how to avoid?
    var el3 = d3.select(eln), el = el3.attr('class'), cont, prop, ref=$(eln);
    var o = {maxWidth: 1000, minWidth: 20}, fontCss={};
    var mode = (el.slice(1,6)=='title') ? 'title' :
                (el.slice(0,4)=='drag') ? 'drag' :
                (el.slice(0,6)=='legend') ? 'legend' :
                (el.slice(0,10)=='annotation') ? 'annotation' :
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
        if(el=='drag ndrag') { cont=gd.layout.yaxis, prop=1 }
        else if(el=='drag sdrag') { cont=gd.layout.yaxis, prop=0 }
        else if(el=='drag wdrag') { cont=gd.layout.xaxis, prop=0 }
        else if(el=='drag edrag') { cont=gd.layout.xaxis, prop=1 }
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
    // annotation
    else if(mode=='annotation') {
        var an = Number(ref.parent().attr('data-index'));
        cont = gd.layout.annotations[an], prop='text';
        o.align = 'center';
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
        bbox=eln.getBoundingClientRect(),
        input = $('<input/>').appendTo(gd); // TODO: replace with textarea so we can multiline it
    gd.input=input;

    // first put the input box at 0,0, then calculate the correct offset vs orig. element
    input.css(fontCss)
        .css({position:'absolute', top:0, left:0, 'z-index':6000});

    if(mode=='drag') {
        // show enough digits to specify the position to about a pixel, but not more
        var v=cont.range[prop], diff=Math.abs(v-cont.range[1-prop]);
        if(cont.type=='date'){
            var d=new Date(v); // dates are stored in ms
            var ds=$.datepicker.formatDate('yy-mm-dd',d); // always show the date part
            if(diff<1000*3600*24*30) ds+=' '+lpad(d.getHours(),2);  // <30 days: add hours
            if(diff<1000*3600*24*2) ds+=':'+lpad(d.getMinutes(),2); // <2 days: add minutes
            if(diff<1000*3600*3) ds+=':'+lpad(d.getSeconds(),2);    // <3 hours: add seconds
            if(diff<1000*300) ds+='.'+lpad(d.getMilliseconds(),3);  // <5 minutes: add ms
            input.val(ds);
        }
        else if(cont.type=='log') {
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

    var ibbox=input[0].getBoundingClientRect(),ileft=bbox.left-ibbox.left;
    input.css('top',(bbox.top-ibbox.top+(bbox.height-ibbox.height)/2)+'px');
    if(o.align=='right') ileft+=bbox.width-ibbox.width;
    else if(o.align=='center') ileft+=(bbox.width+o.comfortZone-ibbox.width)/2;
    input.css('left',ileft+'px');

    var leftshift={left:0, center:0.5, right:1}[o.align];
    var left0=input.position().left+input.width()*leftshift;

    // for titles, take away the existing one as soon as the input box is made
    if(mode=='annotation')
        gd.paper.selectAll('svg.annotation[data-index="'+an+'"]').remove();
    else if(mode!='drag')
        gd.paper.selectAll('[class="'+el+'"]').remove();
    input[0].select();

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
                var v= (cont.type=='log') ? Math.log(Number($.trim(val)))/Math.LN10 :
                    (cont.type=='date') ? DateTime2ms($.trim(val)) : Number($.trim(val));
                if($.isNumeric(v)) {
                    cont.range[prop]=Number(v);
                    dragTail(gd);
                }
            }
            else if(mode=='legend') {
                cont[prop]=$.trim(val);
                cont2[prop]=$.trim(val);
                gd.layout.showlegend=true;
                gd.changed = true;
                legend(gd);
            }
            else if(mode=='annotation') {
                gd.changed = true;
                annotation(gd,an,prop,$.trim(val));
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
    //AXISTYPEif(a.isdate){
    if(a.type=='date'){
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
    //AXISTYPEelse if(a.islog){
    else if(a.type=='log'){
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
function tickText(gd, a, x){
    var fontSize=12; // TODO: add to layout
    var px=0, py=0;
    var suffix=''; // completes the full date info, to be included with only the first tick
    var tt;
    //AXISTYPEif(a.isdate){
    if(a.type=='date'){
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
    //AXISTYPEelse if(a.islog){
    else if(a.type=='log'){
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
    else if(a.type=='category'){
        tt=String(a.categories[Math.round(x)]);
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
            .call(strokeColor, a.tickcolor || '#000')
            .attr('stroke-width', a.tickwidth || 1)
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
            .call(setPosition, tl.x, tl.y)
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
    var grid = gd.axislayer.selectAll('line.'+gcls).data(vals,datafn),
        gridwidth = a.gridwidth || 1;
    if(a.showgrid!=false) {
        grid.enter().append('line').classed(gcls,1)
            .call(strokeColor, a.gridcolor || '#ddd')
            .attr('stroke-width', gridwidth)
            .attr('x1',g.x1)
            .attr('x2',g.x2)
            .attr('y1',g.y1)
            .attr('y2',g.y2)
            .each(function(d) {if(a.zeroline && a.type=='linear' && d.text=='0') d3.select(this).remove();});
            //AXISTYPE.each(function(d) {if(a.zeroline && !a.islog && !a.isdate && d.text=='0') d3.select(this).remove();});
        grid.attr('transform',transfn);
        grid.exit().remove();
    }
    else
        grid.remove();

    // zero line
    var zl = gd.axislayer.selectAll('line.'+zcls).data(a.range[0]*a.range[1]<=0 ? [{x:0}] : []);
    if(a.zeroline) {
        zl.enter().append('line').classed(zcls,1).classed('zl',1)
            .call(strokeColor, a.zerolinecolor || '#000')
            .attr('stroke-width', a.zerolinewidth || gridwidth)
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

// ----------------------------------------------------
// styling for svg text, in ~HTML format
// ----------------------------------------------------

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
    if(t===undefined) return;
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
    else {
        for(var i=0; i<lines.length;i++) {
            var l=s.append('tspan').attr('class','nl');
            if(i>0) l.attr('x',s.attr('x')).attr('dy',1.3*s.attr('font-size'));
            styleTextInner(l,lines[i].childNodes);
        }
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
        else if(nn=='sup') {
            styleTextInner(s.append('tspan').attr('baseline-shift','super').attr('font-size','70%'),
              n[i].childNodes);
        }
        else if(nn=='sub') {
            styleTextInner(s.append('tspan').attr('baseline-shift','sub').attr('font-size','70%'),
              n[i].childNodes);
        }
        else if(nn=='b') {
            styleTextInner(s.append('tspan').attr('font-weight','bold'),
              n[i].childNodes);
        }
        else if(nn=='i') {
            styleTextInner(s.append('tspan').attr('font-style','italic'),
              n[i].childNodes);
        }
        else if(nn=='font') {
            var ts=s.append('tspan');
            for(var j=0; j<n[i].attributes.length; j++) {
                var at=n[i].attributes[j],atl=at.name.toLowerCase(),atv=at.nodeValue;
                if(atl=='style') { ts.attr('font-style',atv) }
                else if(atl=='weight') { ts.attr('font-weight',atv) }
                else if(atl=='size') { ts.attr('font-size',atv) }
                else if(atl=='family') { ts.attr('font-family',atv) }
                else if(atl=='color') { ts.call(fillColor,atv) }
            }
            styleTextInner(ts, n[i].childNodes);
        }
    }
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

// ------------------------------- graphToGrid

function graphToGrid(){
    startspin();
    var gd=gettab();
    var csrftoken=$.cookie('csrftoken');
    if(gd.fid !== undefined && gd.fid !='')
        $.post("/pullf/", {'csrfmiddlewaretoken':csrftoken, 'fid': gd.fid, 'ft':'grid'}, fileResp);
    else {
        var data = [];
        for(d in gd.data) data.push(stripSrc(gd.data[d]));
        console.log('~ DATA ~');
        console.log(data);
        $.post("/pullf/", {'csrfmiddlewaretoken':csrftoken, 'data': JSON.stringify({'data':data}), 'ft':'grid'}, fileResp);
    }
}

// ----------------------------------------------------
// Utility functions
// ----------------------------------------------------

uoStack=[];
// merge objects i and up recursively
function updateObject(i,up) {
    if(!$.isPlainObject(up)) return i;
    var o = uoStack[uoStack.push({})-1]; // seems like JS doesn't fully implement recursion... if I say o={} here then each level destroys the previous.
    for(key in i) o[key]=i[key];
    for(key in up) {
        if($.isPlainObject(up[key]))
            o[key]=updateObject($.isPlainObject(i[key]) ? i[key] : {}, up[key]);
        else o[key]=($.isNumeric(i[key]) && $.isNumeric(up[key])) ? Number(up[key]) : up[key]; // if the initial object had a number and the update can be a number, coerce it
    }
    return uoStack.pop();
}

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
// then it should have a range max/min of at least 100
// and at least 1/4 of distinct values < max/10
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

// are the (x,y)-values in gd.data all text?
function category(d,ax) {
    var vals=[],v,c;
    var ax2= (ax=='x') ? 'y' : 'x';
    for(curve in d){
        c=d[curve];
        // curve has data: test each point for non-numeric text
        if(ax in c) {
            for(i in c[ax]) {
                v=c[ax][i];
                if($.isNumeric(v)){ return false; }
            }
        }
        // curve has linear scaling (ie, y0 and yd in gd.data instead of y)
        // this is clearly not a categorical axis, so return false
        else {
            return false;
        }
    }
    return true;
}

// if isdate, convert value (or all values) from dates to milliseconds
// if islog, take the log here
function convertToAxis(o,a){
//     console.log('*** convert to axis ***');
//     console.log(o,a);
    //AXISTYPEif(a.isdate||a.islog){
    if(a.type=='date'||a.type=='log'){
        if($.isArray(o)){
            var r=[];
            //AXISTYPEfor(i in o) r.push(a.isdate ? DateTime2ms(o[i]) : (o[i]>0) ? Math.log(o[i])/Math.LN10 : null);
            for(i in o) r.push(a.type=='date' ? DateTime2ms(o[i]) : (o[i]>0) ? Math.log(o[i])/Math.LN10 : null);
            return r;
        }
        else return a.type=='date' ? DateTime2ms(o) : (o>0) ? Math.log(o)/Math.LN10 : null;
        //AXISTYPEelse return a.isdate ? DateTime2ms(o) : (o>0) ? Math.log(o)/Math.LN10 : null;
    }
    else if(a.type=='category' && $.isArray(o)){
        // [ 'Apple', 'Orange', 'Banana' ] ---> [ 0, 1, 2 ]
        var r=range(o.length);
        a.categories={};
        r.map(function(c){a.categories[c]=o[c]});
        return r.map(function(d){return $.isNumeric(d) ? d : null});
    }
    else if($.isArray(o)) {
        return o.map(function(d){return $.isNumeric(d) ? d : null});
    }
    else {
        return $.isNumeric(o) ? o : null;
    }
}

// do two bounding boxes from getBoundingClientRect,
// ie {left,right,top,bottom,width,height}, overlap?
function bBoxIntersect(a,b){
    if(a.left>b.right || b.left>a.right || a.top>b.bottom || b.top>a.bottom) { return false }
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

// kill the main spinner
function killspin(){
    if(gettab()!==undefined){
        if(gettab().spinner !== undefined){
            gettab().spinner.stop();
        }
    }
    $('.spinner').remove();
}

// start the main spinner
function startspin(parent){
    if(parent===undefined){ var parent=gettab(); }
    // big spinny
    var opts = {
        lines: 17, // The number of lines to draw
        length: 30, // The length of each line _30
        width: 6, // The line thickness
        radius: 37, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        color: '#000', // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
    };
    var spinner=new Spinner(opts).spin(parent);
    parent.spinner=spinner;
}

function range(i){
    var x=[]; var j=0;
    while(x.push(j++)<i){};
    return x;
}
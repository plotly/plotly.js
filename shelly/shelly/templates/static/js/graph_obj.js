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
VERBOSE = false;

// IMPORTANT - default colors should be in hex for grid.js
// TODO - these colors suck, let's make some better palettes
defaultColors=['#0000ee', //blue
               '#aa0000', //red
               '#6fa8dc', //lite blue
               '#ffd966', //goldenrod
               '#ff00ff', //elektrik purple
               '#9900ff', //moody purple
               '#00cc00', // brite green
               '#000000']; // black

defaultScale=[[0,"rgb(8, 29, 88)"],[0.125,"rgb(37, 52, 148)"],[0.25,"rgb(34, 94, 168)"],
    [0.375,"rgb(29, 145, 192)"],[0.5,"rgb(65, 182, 196)"],[0.625,"rgb(127, 205, 187)"],
    [0.75,"rgb(199, 233, 180)"],[0.875,"rgb(237, 248, 217)"],[1,"rgb(255, 255, 217)"]];

function defaultLayout(){
    return {title:'Click to enter Plot title',
        xaxis:{range:[-1,6],type:'-',mirror:true,linecolor:'#000',linewidth:1,
            tick0:0,dtick:2,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',nticks:0,
            showticklabels:true,tickangle:0,exponentformat:'e',showexponent:'all',
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,drange:[null,null],
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter X axis title',unit:'',
            titlefont:{family:'',size:0,color:''},
            tickfont:{family:'',size:0,color:''}},
        yaxis:{range:[-1,4],type:'-',mirror:true,linecolor:'#000',linewidth:1,
            tick0:0,dtick:1,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',nticks:0,
            showticklabels:true,tickangle:0,exponentformat:'e',showexponent:'all',
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,drange:[null,null],
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter Y axis title',unit:'',
            titlefont:{family:'',size:0,color:''},
            tickfont:{family:'',size:0,color:''}},
        legend:{bgcolor:'#fff',bordercolor:'#000',borderwidth:1,
            font:{family:'',size:0,color:''}},
        width:GRAPH_WIDTH,
        height:GRAPH_HEIGHT,
        autosize:'initial', // after initial autosize reverts to true
        margin:{l:70,r:40,t:60,b:60,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff',
        barmode:'stack',
        bargap:0.2,
        bargroupgap:0.0,
        font:{family:'Arial, sans-serif;',size:12,color:'#000'},
        titlefont:{family:'',size:0,color:''}
    }
}
// TODO: add label positioning


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
    },
    histogramx:{
        framework:newPlot
    },
    histogramy:{
        framework:newPlot
    },
    histogram2d:{
        framework:newPlot
    }
}

var BARTYPES = ['bar','histogramx','histogramy'];
var HEATMAPTYPES = ['heatmap','histogram2d'];
var TIMER=0

function markTime(s){
//     if(!VERBOSE) { return }
    var t2 = new Date().getTime();
    console.log(s,t2-TIMER,'(msec)');
    TIMER=t2;
}

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
function plot(divid, data, layout, rdrw) {
    markTime('in plot')
    plotlylog('+++++++++++++++IN: plot(divid, data, layout, rdrw)+++++++++++++++');
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
    else if((typeof gd.layout==='undefined')||graphwasempty) { newPlot(gd, layout) }

    // enable or disable formatting buttons
    $(gd).find('.data-only').attr('disabled', !gd.data || gd.data.length==0);

    var gl=gd.layout, gdd=gd.data, gp=gd.plot;
    var xa=gl.xaxis, ya=gl.yaxis;
    var x, xy, y, i, serieslen, dcnt, ncnt, v0, dv, gdc;
    var xdr=[null,null];
    var ydr=[null,null];
    var hasbars={h:false,v:false}; // whether we have h and/or v bars (so we can cut margins if an axis starts or ends at 0)

    // do we need to check the axis types?
    // to force axtypes to be called again, set gd.axtypesok to false before calling plot()
    // this should be done if the first trace changes type, bardir, or data
    if(gdd && gdd.length && gd.axtypesok!==true){
        // figure out axis types (linear, log, date, category...)
        // use the first trace only.
        // If the axis has data, see whether more looks like dates or like numbers
        // If it has x0 & dx (etc), go by x0 (if x0 is a date and dx is a number, perhaps guess days?)
        // If it has none of these, it will default to x0=0, dx=1, so choose number
        // -> If not date, figure out if a log axis makes sense, using all axis data

        function setAxType(ax,axletter){
            var d0 = gdd[0];
            if(!d0.type) { d0.type='scatter' }
            // backward compatibility
            if(!ax.type) {
                if(ax.isdate) { ax.type='date' }
                else if(ax.islog) { ax.type='log' }
                else if(ax.isdate===false && ax.islog===false) { ax.type='linear' }
            }
            // now remove the obsolete properties
            delete ax.islog;
            delete ax.isdate;
            // guess at axis type with the new property format
            // first check for histograms, as they can change the axis types
            // whatever else happens, horz bars switch the roles of x and y axes
            if((BARTYPES.indexOf(d0.type)!=-1) && (d0.bardir=='h')){
                axletter={x:'y',y:'x'}[axletter];
            }
            var hist = (['histogramx','histogramy'].indexOf(d0.type)!=-1);
            if(hist) {
                if(axletter=='y') {
                    // always numeric data in the bar size direction
                    if(ax.type!='log') { ax.type='linear' }
                    return;
                }
                else {
                    // bin values may come from the x or y source data depending on type
                    // determine the type for the bar-to-bar direction from the bin source data
                    // so reset axletter, then do the tests below
                    axletter = d0.type.charAt(9);
                }
            }
            // then check the data supplied for that axis
            if( ( axletter in d0) ? moreDates(d0[axletter]) : (isDateTime(d0[axletter+'0'])===true ) ) {
                ax.type='date';
            }
            else if( loggy(gdd,axletter) ) {
                if(ax.type!='linear') { ax.type='log' } // in case the user has already chosen linear
            }
            else if( category(gdd,axletter) ) {
                ax.type='category';
                ax.categories=[]; // empty out the category list, to be filled in by convertToAxis
            }
            else {
                if(ax.type!='log') { ax.type='linear' } // in case the user has already chosen log
            }
        }

        setAxType(xa,'x');
        setAxType(ya,'y');
        gd.axtypesok=true;
    }

    // calcdata to axis mapping (identity except for log axes)
    var toLog = function(v){if(v<=0) { return null } return Math.log(v)/Math.LN10},
        fromLog = function(v){return Math.pow(10,v)},
        num = function(v){return $.isNumeric(v) ? v : null}
    xa.toAxis = (xa.type=='log') ? toLog : num;
    ya.toAxis = (ya.type=='log') ? toLog : num;
    xa.toData = (xa.type=='log') ? fromLog : num;
    ya.toData = (ya.type=='log') ? fromLog : num;

    // prepare the data and find the autorange
    // TODO: only remake calcdata for new or changed traces
    gd.calcdata=[];

    markTime('done setAxType');

    for(curve in gdd) {
        var gdc=gdd[curve],
            curvetype = gdc.type || 'scatter', //default type is scatter
            typeinfo = graphInfo[curvetype],
            cd=[],
            cdtextras={}; // info (if anything) to add to cd[0].t

        if(typeinfo.framework!=gd.framework) {
            plotlylog('Oops, tried to put data of type '+(gdc.type || 'scatter')+
                ' on an incompatible graph controlled by '+(gdd[0].type || 'scatter')+
                ' data. Ignoring this dataset.');
            continue;
        }
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
        // counterdata - the other axis data to compare to, either gdc.x or gdc.y
        var convertOne = function(data,ax,counterdata) {
            if(data in gdc) { return convertToAxis(gdc[data],ax) }
            else {
                var v0 = ((data+'0') in gdc) ? convertToAxis(gdc[data+'0'], ax) : 0,
                    dv = (('d'+data) in gdc) ? gdc['d'+data] : 1;
                return counterdata.map(function(v,i){return v0+i*dv});
            }
        }

        // this function returns the outer x or y limits of the curves processed so far
        var expandBounds = function(ax,dr,data,serieslen,pad) {
            if(ax.autorange) {
                pad = pad || 0; // optional extra space to give these new data points
                serieslen = serieslen || data.length;
                dr[0] = aggNums(Math.min, $.isNumeric(dr[0]) ? dr[0] : null,
                    data.map(function(v){return ax.toAxis(v-pad)}), serieslen);
                dr[1] = aggNums(Math.max, $.isNumeric(dr[1]) ? dr[1] : null,
                    data.map(function(v){return ax.toAxis(v+pad)}), serieslen);
            }
        }

        // std deviation function using aggNums, so it handles non-numerics nicely
        // even need to use aggNums instead of .length, so we toss out non-numerics there
        var stdev = function(data) {
            var len = aggNums(function(a,b){return a+1},0,data),
                mean = aggNums(function(a,b){return a+b},0,data)/len;
            return Math.sqrt(aggNums(function(a,b){return a+Math.pow(b-mean,2)},0,data)/len);
        }

        var autoBin = function(data,ax,nbins,is2d) {
            var datamin = aggNums(Math.min,null,data),
                datamax = aggNums(Math.max,null,data);
            if(ax.type=='category') {
                return {
                    start: datamin-0.5,
                    end: datamax+0.5,
                    size: 1
                }
            }
            else {
                var size0 = nbins ? ((datamax-datamin)/nbins) :
                    2*stdev(data)/Math.pow(data.length,is2d ? 0.25 : 0.4);
//                 console.log(size0,datamin,datamax);
                // piggyback off autotick code to make "nice" bin sizes
                var dummyax = {type:ax.type,range:[datamin,datamax]};
                autoTicks(dummyax,size0);
                var binstart = tickIncrement(tickFirst(dummyax),dummyax.dtick,'reverse');
                // check for too many data points right at the edges of bins (>50% within 1% of bin edges)
                // or all data points integral
                // and offset the bins accordingly
                var edgecount = 0, intcount = 0;
                for(var i=0; i<data.length; i++) {
                    if(data[i]%1==0) { intcount++ }
                    if((1+(data[i]-binstart)*100/dummyax.dtick)%100<2) { edgecount++ }
                }
                if(intcount==data.length && ax.type!='date') {
                    binstart -= 0.5;
                    if(dummyax.dtick<1) { dummyax.dtick=1 }
                }
                else if(edgecount>data.length/2) {
                    var binshift = (tickIncrement(binstart,dummyax.dtick)-binstart)/2;
                    binstart += (binstart+binshift<datamin) ? binshift : -binshift;
                }
                // calculate the endpoint
                var binend = binstart;
                while(binend<datamax) { binend = tickIncrement(binend,dummyax.dtick) }
                return {
                    start: binstart,
                    end: binend,
                    size: dummyax.dtick
                }
            }
        }

        // find the bin for val
        // for linear bins, we can just calculate. For listed bins, run a binary search
        var findBin = function(val,bins) {
            if($.isNumeric(bins.start)) {
                return Math.floor((val-bins.start)/bins.size)
            }
            else {
                var n1=0,
                    n2=bins.length-1;
                while(n1<n2){
                    n=Math.floor((n1+n2/2));
                    if(bins[n]<=val) { n1=n+1 }
                    else { n2=n }
                }
                n = n1;
            }
        }

        if(curvetype=='scatter') {
            // verify that data exists, and make scaled data if necessary
            if(!('y' in gdc) && !('x' in gdc)) { continue } // no data!

            // ignore as much processing as possible (and including in autorange) if trace is not visible
            if(gdc.visible!=false) {

                y = convertOne('y',ya,gdc.x);
                x = convertOne('x',xa,gdc.y);

                serieslen = Math.min(x.length,y.length);

                expandBounds(xa,xdr,x,serieslen);
                expandBounds(ya,ydr,y,serieslen);

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
        }
        else if(BARTYPES.indexOf(curvetype)!=-1) {
            // ignore as much processing as possible (and including in autorange) if bar is not visible
            if(gdc.visible!=false) {
                hasbars[gdc.bardir||'v']=true;
                // depending on bar direction, set position and size axes and data ranges
                if(gdc.bardir=='h') { var pa = ya, sa = xa, pdr = ydr, sdr = xdr }
                else { var pa = xa, sa = ya, pdr = xdr, sdr = ydr }
                if(curvetype=='bar') {
                    size = convertOne('y',sa,gdc.x);
                    pos = convertOne('x',pa,gdc.y);
                }
                else { // histogram
                    // prepare the raw data
                    // pick out x data for histogramx, y for histogramy
                    // counterdata doesn't make much sense here, it's only if the data is missing
                    // so gets made up monotonically increasing based on the opposite axis data,
                    // but the user will see that...
                    // the alternative would be to disable x histogram if there's no x data, etc.
                    pos0 = convertOne(curvetype.charAt(9),pa,gdc[{x:'y',y:'x'}[curvetype.charAt(9)]]);
                    // calculate the bins
                    if((gdc.autobinx!=false) || !('xbins' in gdc)) { gdc.xbins = autoBin(pos0,pa,gdc.nbinsx) }
                    var allbins = (typeof(gdc.xbins.size)=='string'),
                        bins = allbins ? [] : gdc.xbins;
                    // make the empty bin array
                    pos = [];
                    size = [];
                    var i=gdc.xbins.start,i2,n;
                    while(i<gdc.xbins.end) {
                        i2 = tickIncrement(i,gdc.xbins.size);
                        pos.push((i+i2)/2);
                        size.push(0);
                        // nonuniform bins (like months) we need to search,
                        // rather than straight calculate the bin we're in
                        if(allbins) { bins.push(i) }
                        i=i2;
                    }
                    // bin the data
                    for(i=0; i<pos0.length; i++) {
                        n = findBin(pos0[i],bins);
                        if(n>=0 && n<size.length) { size[n]+=1 }
                    }
                }

                var serieslen = Math.min(pos.length,size.length);
                // create the "calculated data" to plot
                // horz bars switch the roles of x and y in cd
                for(i=0;i<serieslen;i++) {
                    if(($.isNumeric(pos[i]) && $.isNumeric(size[i]))) {
                        cd.push({p:pos[i],s:size[i],b:0});
                    }
                }
            }
        }
        else if(HEATMAPTYPES.indexOf(curvetype)!=-1 ){
            // calcdata ("cd") for heatmaps:
            // curve: index of heatmap in gd.data
            // type: used to distinguish heatmaps from traces in "Data" popover
            if(gdc.visible==false) { continue }
            // prepare the raw data
            // run convertOne even for heatmaps, in case of category mappings
            markTime('start convert data');
            x = gdc.x ? convertOne('x',xa,gdc.x) : [];
            markTime('done convert x');
            y = gdc.y ? convertOne('y',ya,gdc.y) : [];
            markTime('done convert y');
            if(gdc.type=='histogram2d') {
                serieslen = Math.min(x.length,y.length);
                if(x.length>serieslen) { x.splice(serieslen,x.length-serieslen) }
                if(y.length>serieslen) { y.splice(serieslen,y.length-serieslen) }
                markTime('done convert data');
                // calculate the bins
                if(gdc.autobinx || !('xbins' in gdc)) { gdc.xbins = autoBin(x,xa,gdc.nbinsx,'2d') }
                if(gdc.autobiny || !('ybins' in gdc)) { gdc.ybins = autoBin(y,ya,gdc.nbinsy,'2d') }
                markTime('done autoBin');
                // make the empty bin array & scale the map
                gdc.z = [];
                var onecol = [],
                    xbins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.xbins,
                    ybins = (typeof(gdc.xbins.size)=='string') ? [] : gdc.ybins;
                for(var i=gdc.xbins.start; i<gdc.xbins.end; i=tickIncrement(i,gdc.xbins.size)) {
                    onecol.push(0);
                    if($.isArray(xbins)) { xbins.push(i) }
                }
                var nx = onecol.length;
                gdc.x0 = gdc.xbins.start;
                gdc.dx = (i-gdc.x0)/nx;
                gdc.x0+=gdc.dx/2;
                for(var i=gdc.ybins.start; i<gdc.ybins.end; i=tickIncrement(i,gdc.ybins.size)) {
                    gdc.z.push(onecol.concat())
                    if($.isArray(ybins)) { ybins.push(i) }
                }
                var ny = gdc.z.length;
                gdc.y0 = gdc.ybins.start;
                gdc.dy = (i-gdc.y0)/ny;
                gdc.y0+=gdc.dy/2;
                markTime('done making bins');
                // put data into bins
                for(i=0; i<serieslen; i++) {
                    var n = findBin(x[i],xbins),
                        m = findBin(y[i],ybins);
                    // TODO: why is y upside down?
                    if(n>=0 && n<nx && m>=0 && m<ny) { gdc.z[m][n]+=1 }
                }
                markTime('done binning');
                // make the rest of the heatmap info
                if(gdc.zauto!==false) {
                    gdc.zmin=zmin(gdc.z);
                    gdc.zmax=zmax(gdc.z);
                }
                if(!( 'scl' in gdc )){ gdc.scl=defaultScale; }
            }
            // heatmap() builds a png heatmap on the coordinate system, see heatmap.js
            // returns the L, R, T, B coordinates for autorange as { x:[L,R], y:[T,B] }
            var coords = heatmap_xy(gd,gdc);
            expandBounds(xa,xdr,coords.x);
            expandBounds(ya,ydr,coords.y);
            cdtextras = coords; // store x and y arrays for later
        }
        if(!('line' in gdc)) gdc.line={};
        if(!('marker' in gdc)) gdc.marker={};
        if(!('line' in gdc.marker)) gdc.marker.line={};
        if(!cd[0]) { cd.push({}) } // make sure there is a first point
        // add the trace-wide properties to the first point, per point properties to every point
        // t is the holder for trace-wide properties
        cd[0].t={
            curve:curve, // store the gd.data curve number that gave this trace
            cdcurve:gd.calcdata.length, // store the calcdata curve number we're in
        }
        for(key in cdtextras) { cd[0].t[key] = cdtextras[key] }
        gd.calcdata.push(cd);
        markTime('done with calcdata for '+curve);
    }

    // put the styling info into the calculated traces
    // has to be done separate from applyStyles so we know the mode (ie which objects to draw)
    // and has to be before stacking so we get bardir, type, visible
    setStyles(gd);

    // bar chart stacking/grouping positioning and autoscaling calculations
    // first find all visible bars in each direction
    var barlist = {h:[],v:[]}
    for(var i=0; i<gd.calcdata.length; i++){ // trace index
        var t=gd.calcdata[i][0].t;
        if(BARTYPES.indexOf(t.type)!=-1 && t.visible!=false) { barlist[t.bardir||'v'].push(i) }
    }
    // then for each direction separately calculate the ranges and positions
    ['v','h'].forEach(function(dir){
        if(!barlist[dir].length) { return }
        var bl = barlist[dir];

        if(dir=='v') { var sa = ya, sdr = ydr, pa = xa, pdr = xdr }
        else { var sa = xa, sdr = xdr, pa = ya, pdr = ydr }

        // bar position offset and width calculation
        function barposition(bl1) {
            // find the min. difference between any points in any traces in bl1
            var pvals=[];
            for(var i=0; i<bl1.length; i++){
                gd.calcdata[bl1[i]].forEach(function(v){pvals.push(v.p)});
            }
            pvals.sort(function(a,b){return a-b});
            var pl = pvals.length-1,
                barDiff = (pvals[pl]-pvals[0])||1,
                minDiff = barDiff/(pl||1)/100,
                pv2=[pvals[0]];
            for(var i=0;i<pl;i++) {
                if(pvals[i+1]>pvals[i]+minDiff) { // make sure values aren't just off by a rounding error
                    barDiff=Math.min(barDiff,pvals[i+1]-pvals[i]);
                    pv2.push(pvals[i+1]);
                }
            }
            barDiff*=(1-gl.bargap);
            // position axis autorange
            expandBounds(pa,pdr,pv2,pv2.length,barDiff*(1-gl.bargroupgap/bl.length)/2);
            // bar widths and position offsets
            if(gl.barmode=='group') { barDiff/=bl.length }
            for(var i=0; i<bl1.length; i++){
                var t=gd.calcdata[bl1[i]][0].t;
                t.barwidth = barDiff*(1-gl.bargroupgap);
                t.poffset = (((gl.barmode=='group') ? (2*i+1-bl1.length)*barDiff : 0 ) - t.barwidth)/2;
            }
        }

        // for overlaid bars, manage each bar trace independently
        if(gl.barmode=='overlay') {
            for(var i=0; i<bl.length; i++) { barposition([bl[i]]) }
        }
        // group or stack, make sure all bar positions are available for all traces
        // by finding the closest two points in any of the traces
        else {
            barposition(bl);
        }

        // bar size range and stacking calculation
        if(gl.barmode=='stack'){
            // for stacked bars, we need to evaluate every step in every stack,
            // because negative bars mean the extremes could be anywhere
            // also stores the base (b) of each bar in calcdata so we don't have to redo this later
            var sMax = sa.toData(sa.toAxis(0)),
                sMin = sMax,
                sums={},
                v=0,
                sumround = gd.calcdata[bl[0]][0].t.barwidth/100, // make sure...
                sv = 0; //... if p is different only by rounding, we still stack
            for(var i=0; i<bl.length; i++){ // trace index
                var ti = gd.calcdata[bl[i]];
                for(var j=0; j<ti.length; j++) {
                    sv = Math.round(ti[j].p/sumround);
                    ti[j].b=(sums[sv]||0);
                    v=ti[j].b+ti[j].s;
                    sums[sv]=v;
                    if($.isNumeric(sa.toAxis(v))) {
                        sMax = Math.max(sMax,v)
                        sMin = Math.min(sMin,v);
                    }
                }
            }
            expandBounds(sa,sdr,[sMin,sMax]);
        }
        else {
            for(var i=0; i<bl.length; i++){
                expandBounds(sa,sdr,gd.calcdata[bl[i]].map(function(v){return v.s}));
            }
            // make sure we include zero so we see the whole bar
            if(xa.type=='linear') { expandBounds(sa,sdr,[0]) }
        }
    });
    markTime('done with setstyles and bar chart ranging');

    // autorange for errorbars
    errorbarsydr(gd,ydr);
    markTime('done errorbarsydr');

    // autorange
    var a0 = 0.05; // 5% extension of plot scale beyond last point

    // if there's a heatmap in the graph div data, get rid of 5% padding
    $(gdd).each(function(i,v){ if(HEATMAPTYPES.indexOf(v.type)!=-1){ a0=0 } });

    // if there are bars in a direction and one end of the axis is 0,
    // remove the 5% padding from that side
    var doAutoRange = function(ax,dr,hasbars) {
        if(ax.autorange && $.isNumeric(dr[0])) {
            // if axis is currently reversed, preserve this.
            var axReverse = (ax.range && ax.range[1]<ax.range[0]);
            if(dr[0]==dr[1]) { // don't let axis have zero size
                dr = [ax.toData(ax.toAxis(dr[0])-1),ax.toData(ax.toAxis(dr[0])+1)]
            }
            ax.range=[
                (hasbars && (dr[0]==0) && (ax.type=='linear')) ? 0 : (a0+1)*dr[0]-a0*dr[1],
                (hasbars && (dr[1]==0) && (ax.type=='linear')) ? 0 : (a0+1)*dr[1]-a0*dr[0]];
            if(axReverse) { ax.range.reverse() }
        }
    }
    doAutoRange(xa,xdr,hasbars.h);
    doAutoRange(ya,ydr,hasbars.v);

    doTicks(gd);

    if(!gd.viewbox || !$.isNumeric(gd.viewbox.x) || !$.isNumeric(gd.viewbox.y)) {
        gd.viewbox={x:0, y:0};
    }
    markTime('done autorange and ticks');

    if($.isNumeric(xa.m) && $.isNumeric(xa.b) && $.isNumeric(ya.m) && $.isNumeric(ya.b)) {
        // Now plot the data. Order is:
        // 1. heatmaps (and 2d histos)
        // 2. bars/histos
        // 3. errorbars for everyone
        // 4. scatter
        var cdbar = [], cdscatter = [];
        for(var i in gd.calcdata){
            var cd = gd.calcdata[i], type=cd[0].t.type;//, c = t.curve, gdc = gd.data[c];
            if(HEATMAPTYPES.indexOf(type)!=-1) {
                heatmap(cd,rdrw,gd);
                markTime('done heatmap '+i);
            }
            else {
                // in case this one was a heatmap previously, remove it and its colorbar
                $('#'+gd.id+'-hm'+i).remove();
                $('#'+gd.id+'-cb'+i).remove();

                if(BARTYPES.indexOf(type)!=-1) { cdbar.push(cd) }
                else { cdscatter.push(cd) }
            }
        }

        // plot traces
        // (gp is gd.plot, the inner svg object containing the traces)
        gp.selectAll('g.trace').remove(); // <-- remove old traces before we redraw

        // BUILD BAR CHARTS
        var bartraces = gp.selectAll('g.trace.bars') // <-- select trace group
            .data(cdbar) // <-- bind calcdata to traces
          .enter().append('g') // <-- add a trace for each calcdata
            .attr('class','trace bars');
        bartraces.append('g')
            .attr('class','points')
            .each(function(d,cdi){
                var bt = d3.select(this),
                    t = d[0].t; // <-- get trace-wide formatting object
                // for gapless cases (either stacked bars or neighboring bars)
                // use crispEdges to turn off antialiasing.
                if(gl.barmode=='stack' || (gl.bargap==0 && gl.bargroupgap==0 && !t.mlw)){
                    bt.attr('shape-rendering','crispEdges');
                }
                bt.selectAll('rect')
                    .data(function(d){return d})
                    .enter().append('rect')
                    .each(function(di){
                        // now display the bar - here's where we switch x and y for horz bars
                        // also, because of stacking, we don't call convertToAxis (only
                        // important for log axes) for size until here
                        // modified convertToAxis function: non-positive log values go off-screen by plotwidth
                        // so you see them continue if you drag the plot
                        if(t.bardir=='h') {
                            var y0 = yf({y:t.poffset+di.p},gd),
                                y1 = yf({y:t.poffset+di.p+t.barwidth},gd),
                                x0 = xf({x:di.b},gd,true),
                                x1 = xf({x:di.s+di.b},gd,true);
                        }
                        else {
                            var x0 = xf({x:t.poffset+di.p},gd),
                                x1 = xf({x:t.poffset+di.p+t.barwidth},gd),
                                y1 = yf({y:di.s+di.b},gd,true),
                                y0 = yf({y:di.b},gd,true);
                        }
                        if(!$.isNumeric(x0)||!$.isNumeric(x1)||!$.isNumeric(y0)||!$.isNumeric(y1)) {
                            d3.select(this).remove();
                            return;
                        }
                        d3.select(this)
                            .attr('transform','translate('+Math.min(x0,x1)+','+Math.min(y0,y1)+')')
                            .attr('width',Math.abs(x1-x0)+0.001)  // TODO: why do I need this extra? Without it occasionally
                            .attr('height',Math.abs(y1-y0)+0.001) // there's an empty pixel in the non-antialiased (gapless) case
                    });
            });
        markTime('done bars');

        // DRAW ERROR BARS for bar and scatter plots
        // these come after (on top of) bars, and before (behind) scatter
        errorbars(gd,cdbar.concat(cdscatter));
        markTime('done errorbars');

        // make the container for scatter plots (so error bars can find them along with bars)
        var scattertraces = gp.selectAll('g.trace.scatter') // <-- select trace group
            .data(cdscatter) // <-- bind calcdata to traces
          .enter().append('g') // <-- add a trace for each calcdata
            .attr('class','trace scatter');


        // BUILD SCATTER LINES AND FILL
        var prevpts='',tozero,tonext,nexttonext;
        scattertraces.each(function(d){ // <-- now, iterate through arrays of {x,y} objects
            var t=d[0].t; // <-- get trace-wide formatting object
            if(t.visible==false) { return }
            var i=-1,tr=d3.select(this),pts2='';
            // make the fill-to-zero polyline now, so it shows behind the line
            // have to break out of d3-style here (data-curve attribute) because fill to next
            // puts the fill associated with one trace grouped with the previous
            tozero = (t.fill.substr(0,6)=='tozero' || (t.fill.substr(0,2)=='to' && !prevpts)) ?
                tr.append('polyline').classed('fill',true).attr('data-curve',t.cdcurve) : null;
            // make the fill-to-next polyline now for the NEXT trace, so it shows behind both lines
            // nexttonext was created last time, but tag it with this time's curve
            if(nexttonext) { tonext = nexttonext.attr('data-curve',t.cdcurve) }
            // now make a new nexttonext for next time
            nexttonext = tr.append('polyline').classed('fill',true).attr('data-curve',0);
            while(i<d.length) {
                var pts='',x0=y0=x1=y1=null;
                for(i++; i<d.length; i++) {
                    var x=xf(d[i],gd),y=yf(d[i],gd);
                    if(!$.isNumeric(x)||!$.isNumeric(y)) { break } // TODO: smart lines going off the edge?
                    pts+=x+','+y+' ';
                    if(x0==null) { x0=x; y0=y }
                    x1=x; y1=y;
                }
                if(pts) {
                    pts2+=pts;
                    if(t.mode.indexOf('lines')!=-1) {
                        tr.append('polyline').classed('line',true).attr('points',pts)
                    }
                }
            }
            if(pts2) { // TODO: need to alter the order in case of fill to next... but how?
                if(tozero) {
                    if(t.fill.charAt(t.fill.length-1)=='y') { y0=y1=yf({y:0},gd,true) }
                    else { x0=x1=xf({x:0},gd,true) }
                    tozero.attr('points',pts+x1+','+y1+' '+x0+','+y0);
                }
                else if(t.fill.substr(0,6)=='tonext') {
                    tonext.attr('points',pts+prevpts);
                }
                prevpts = pts2.split(' ').reverse().join(' ');
            }
        });

        // BUILD SCATTER POINTS
        scattertraces.append('g')
            .attr('class','points')
            .each(function(d,cdi){
                var t=d[0].t; // <--- grab trace-wide formatting object in first object of calcdata
                if(t.mode.indexOf('markers')==-1 || d[0].t.visible==false) { return }
                d3.select(this).selectAll('path')
                    .data(function(d){return d})
                    .enter().append('path')
                    .each(function(d){
                        var x = xf(d,gd), y = yf(d,gd);
                        if($.isNumeric(x) && $.isNumeric(y)) {
                            d3.select(this).attr('transform','translate('+x+','+y+')');
                        }
                        else { d3.select(this).remove() }
                    });
            });
        markTime('done scatter');

        //styling separate from drawing
        applyStyle(gp);
        markTime('done applyStyle');
    }
    else { console.log('error with axis scaling',xa.m,xa.b,ya.m,ya.b) }

    // show the legend and annotations
    if(gl.showlegend || (gd.calcdata.length>1 && gl.showlegend!=false)) { legend(gd) }
    if(gl.annotations) { for(var i in gl.annotations) { annotation(gd,i) } }

    // finish up - spinner and tooltips
    try{ killspin(); }
    catch(e){ plotlylog(e); }
    setTimeout(function(){
        if($(gd).find('#graphtips').length==0 && gd.data!==undefined && gd.showtips!=false){
            try{ showAlert('graphtips'); }
            catch(e){ plotlylog(e); }
        }
        else if($(gd).find('#graphtips').css('display')=='none'){
            $(gd).find('#graphtips').fadeIn(); }
    },1000);
    plotlylog('+++++++++++++++OUT: plot(divid, data, layout, rdrw)+++++++++++++++');
    markTime('done plot');
}


// ------------------------------------------------------------ xf(), yf()
// returns a pixel coordinate on the plot given an axis coordinate
// the axis coordinates are numbers (ie dates, categories have been converted to numbers)
// but nonlinear transformation (ie log) has not been done yet
function xf(d,gd,clip){ return pf(d.x,gd.layout.xaxis,gd.viewbox.x,clip) }

function yf(d,gd,clip){ return pf(d.y,gd.layout.yaxis,gd.viewbox.y,clip) }

function pf(v,ax,vb,clip){
    var va = ax.toAxis(v);
    if($.isNumeric(va)) { return d3.round(ax.b+ax.m*va+vb,2) }
    if(clip && $.isNumeric(v)) { // clip NaN (ie past negative infinity) to one axis length past the negative edge
        var a = ax.range[0],
            b = ax.range[1];
        return d3.round(ax.b+ax.m*0.5*(a+b-3*Math.abs(a-b))+vb,2);
    }
}

// ------------------------------------------------------------ gettab()
// return the visible tab.
// if tabtype is given, make sure it's the right type, otherwise make a new tab
// if it's not a plot, also make sure it's empty, otherwise make a new tab
// plots are special: if you bring new data in it will try to add it to the existing plot
function gettab(tabtype,mode){
    //if(tabtype) plotlylog('gettab',tabtype,mode);
    var td = $('.ui-tabs-panel:visible')[0];
    if(tabtype){
        if(!td || td.tabtype!=tabtype) td=addTab(tabtype);
        else if(!td.empty && (td.tabtype!='plot' || mode=='new')) td=addTab(tabtype);
    }
    else if(!td) { td=addTab() }
    return td;
}

// set display params per trace to default or provided value
function setStyles(gd) {
    plotlylog('+++++++++++++++IN: setStyles(gd)+++++++++++++++');

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

    for(var i in gd.calcdata){
        var cd = gd.calcdata[i], c = cd[0].t.curve, gdc = gd.data[c],
            dc = defaultColors[c % defaultColors.length];
        // all types have attributes type, visible, and opacity
        // mergeattr puts single values into cd[0].t, and all others into each individual point
        mergeattr(gdc.type,'type','scatter');
        mergeattr(gdc.visible,'visible',true);
        mergeattr(gdc.opacity,'op',1);
        var type = cd[0].t.type;
        if( (gdc.error_y && gdc.error_y.visible ) ){
            mergeattr(gdc.error_y.visible,'ye_vis',false);
            mergeattr(gdc.error_y.type,'ye_type','percent');
            mergeattr(gdc.error_y.value,'ye_val',10);
            mergeattr(gdc.error_y.traceref,'ye_tref',0);
            mergeattr(gdc.error_y.color,'ye_clr',cd[0].t.ye_clr|| dc);
            mergeattr(gdc.error_y.thickness,'ye_tkns',1);
            mergeattr(gdc.error_y.width,'ye_w',4);
            mergeattr(gdc.error_y.opacity,'ye_op',1);
        }
        if(type==='scatter'){
            mergeattr(gdc.mode,'mode',(cd.length>=PTS_LINESONLY) ? 'lines' : 'lines+markers');
            mergeattr(gdc.line.dash,'ld','solid');
            mergeattr(gdc.line.color,'lc',gdc.marker.color || dc);
            mergeattr(gdc.line.width,'lw',2);
            mergeattr(gdc.marker.symbol,'mx','circle');
            mergeattr(gdc.marker.opacity,'mo',1);
            mergeattr(gdc.marker.size,'ms',6);
            mergeattr(gdc.marker.color,'mc',cd[0].t.lc);
            mergeattr(gdc.marker.line.color,'mlc',((cd[0].t.lc!=cd[0].t.mc) ? cd[0].t.lc : '#000'));
            mergeattr(gdc.marker.line.width,'mlw',0);
            mergeattr(gdc.fill,'fill','none');
            mergeattr(gdc.fillcolor,'fc',addOpacity(cd[0].t.lc,0.5));
            mergeattr(gdc.text,'tx','');
            mergeattr(gdc.name,'name','trace '+c);
        }
        else if(HEATMAPTYPES.indexOf(type)!=-1){
            if(type==='histogram2d') {
                mergeattr(gdc.autobinx,'autobinx',true);
                mergeattr(gdc.nbinsx,'nbinsx',0);
                mergeattr(gdc.xbins.start,'xbstart',0);
                mergeattr(gdc.xbins.end,'xbend',1);
                mergeattr(gdc.xbins.size,'xbsize',1);
                mergeattr(gdc.autobiny,'autobiny',true);
                mergeattr(gdc.nbinsy,'nbinsy',0);
                mergeattr(gdc.ybins.start,'ybstart',0);
                mergeattr(gdc.ybins.end,'ybend',1);
                mergeattr(gdc.ybins.size,'ybsize',1);
            }
            mergeattr(gdc.type,'type','heatmap');
            mergeattr(gdc.visible,'visible',true);
            mergeattr(gdc.x0,'x0',0);
            mergeattr(gdc.dx,'dx',1);
            mergeattr(gdc.y0,'y0',0);
            mergeattr(gdc.dy,'dy',1);
            mergeattr(gdc.zauto,'zauto',true);
            mergeattr(gdc.zmin,'zmin',-10);
            mergeattr(gdc.zmax,'zmax',10);
            mergeattr(JSON.stringify(gdc.scl),'scl',defaultScale);
        }
        else if(BARTYPES.indexOf(type)!=-1){
            if(type!='bar') {
                mergeattr(gdc.autobinx,'autobinx',true);
                mergeattr(gdc.nbinsx,'nbinsx',0);
                mergeattr(gdc.xbins.start,'xbstart',0);
                mergeattr(gdc.xbins.end,'xbend',1);
                mergeattr(gdc.xbins.size,'xbsize',1);
            }
            mergeattr(gdc.bardir,'bardir','v');
            mergeattr(gdc.opacity,'op',1);
            mergeattr(gdc.marker.opacity,'mo',1);
            mergeattr(gdc.marker.color,'mc',defaultColors[c % defaultColors.length]);
            mergeattr(gdc.marker.line.color,'mlc','#000' );
            mergeattr(gdc.marker.line.width,'mlw',0);
            mergeattr(gdc.text,'tx','');
            mergeattr(gdc.name,'name','trace '+c);
        }
    }
    plotlylog('+++++++++++++++OUT: setStyles(gd)+++++++++++++++');

}

function applyStyle(gp) {
    plotlylog('+++++++++++++++IN: applyStyle(gp)+++++++++++++++');
    plotlylog('gp = ', gp);
    gp.selectAll('g.trace')
        .call(traceStyle);
    gp.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path').call(pointStyle,d[0].t);
            d3.select(this).selectAll('rect').call(pointStyle,d[0].t);
        });

    gp.selectAll('g.trace polyline.line')
        .call(lineGroupStyle);

    gp.selectAll('g.trace polyline.fill')
        .call(fillGroupStyle);

    gp.selectAll('g.errorbars')
        .call(errorbarStyle);

    plotlylog('+++++++++++++++OUT: applyStyle(gp)+++++++++++++++');

}


// -----------------------------------------------------
// styling functions for plot elements
// -----------------------------------------------------

function RgbOnly(cstr) {
    var c = tinycolor(cstr).toRgb();
    return 'rgb('+Math.round(c.r)+', '+Math.round(c.g)+', '+Math.round(c.b)+')';
}

function opacityOnly(cstr) { return tinycolor(cstr).alpha }

function addOpacity(cstr,op) {
    var c = tinycolor(cstr).toRgb();
    return 'rgba('+Math.round(c.r)+', '+Math.round(c.g)+', '+Math.round(c.b)+', '+op+')';
}

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

function fillGroupStyle(s) {
    s.attr('stroke-width',0)
    .each(function(d){
        var shape = d3.select(this),
            // have to break out of d3 standard here, because the fill box may be
            // grouped with the wrong trace (so it appears behind the appropriate lines)
            gd = $(shape.node()).parents('div')[0];
        try { shape.call(fillColor,gd.calcdata[shape.attr('data-curve')][0].t.fc) }
        catch(e) {
            try { shape.call(fillColor,d[0].t.fc) }
            catch(e) { shape.remove() }
        }
    });
}

// apply the marker to each point
// draws the marker with diameter roughly markersize, centered at 0,0
function pointStyle(s,t) {
    // only scatter plots get marker path and opacity - bars, histograms don't
    if(t.type=='scatter') {
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
        .style('opacity',function(d){return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1});
    }
    s.each(function(d){
        var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
            p = d3.select(this);
        p.attr('stroke-width',w)
            .call(fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
        if(w) { p.call(strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : '')) }
    });
}

// apply the marker to each bar
// draws the marker with diameter roughly markersize, centered at 0,0
function barStyle(s,t) {
    s.attr('d','M6,6H-6V-6H6Z')
//     s.style('opacity',function(d){return (d.mo+1 || t.mo+1 || (d.t ? d.t.mo : 0) +1) - 1})
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
    var t = d[0].t;
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) return;
    if(t.fill && t.fill!='none' && $.isNumeric(t.cdcurve)) {
        //console.log(t.cdcurve);
        d3.select(this).append('path')
            .attr('data-curve',t.cdcurve)
            .attr('d','M5,0h30v6h-30z')
            .call(fillGroupStyle);
    }
    if(!t.mode || t.mode.indexOf('lines')==-1) return;
    d3.select(this).append('polyline')
        .call(lineGroupStyle)
        .attr('points','5,0 35,0');

}

function legendPoints(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(t.type)==-1) return;
    if(!t.mode || t.mode.indexOf('markers')==-1) return;
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .call(pointStyle,t)
        .attr('transform','translate(20,0)');
}

function legendBars(d){
    var t = d[0].t;
    if(BARTYPES.indexOf(t.type)==-1) return;
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .call(barStyle,t)
        .attr('transform','translate(20,0)');
}

function legendText(s,gd){
    var gf = gd.layout.font, lf = gd.layout.legend.font;
    // console.log(gd,lf);
    // note: uses d[1] for the original trace number, in case of hidden traces
    return s.append('text')
        .attr('class',function(d){return 'legendtext text-'+d[1]})
        .call(setPosition, 40, 0)
        .attr('text-anchor','start')
        .attr('font-size',lf.size||gf.size||12)
        .attr('font-family',lf.family||gf.family||'Arial')
        .style('fill',lf.color||gf.color||'#000')
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
    plotlylog('+++++++++++++++IN: restyle+++++++++++++++');
    gd.changed = true;
    var gl = gd.layout;

    // mode and gaps for bar charts are graph-wide attributes, but make
    // more sense in the style box than the layout box. here we update gd.layout,
    // force a replot, then return
    if(['barmode','bargap','bargroupgap'].indexOf(astr)!=-1){
        gl[astr] = val;
        plot(gd,'','');
        return;
    }

    if($.isNumeric(traces)) { traces=[traces] }
    else if(!$.isArray(traces) || !traces.length) {
        traces=gd.data.map(function(v,i){return i});
    }

    // set attribute in gd.data
    // also check whether we have heatmaps in the edited traces
    var aa=astr.split('.'),
        hasheatmap=false,
        hasbars=false;
    for(i=0; i<traces.length; i++) {
        var cont=gd.data[traces[i]];
        if(HEATMAPTYPES.indexOf(cont.type)!=-1) { hasheatmap=true }
        if(BARTYPES.indexOf(cont.type)!=-1) { hasbars=true }
        // setting bin or z settings should turn off auto
        if(['zmax','zmin'].indexOf(astr)!=-1) { cont.zauto=false }
        else if(aa[0]=='xbins') { cont.autobinx=false }
        else if(aa[0]=='ybins') { cont.autobiny=false }

        // now dig into the heirarchy
        for(var j=0; j<aa.length-1; j++){
            if(cont[aa[j]]===undefined){
                cont[aa[j]] = {};       // CP edit: build the heiracrchy if it doesn't exist
                                        // e.g. if setting error_y.clr="blue"
                                        // and errorbar isn't defined, then initialize
                                        // errorbar and y
            }
            cont=cont[aa[j]];  // get to the 2nd-to-last level
        }
        cont[aa[j]]=val; // set the value
    }

    // check if we need to call axis type
    if((traces.indexOf(0)!=-1) && (['type','x','y','x0','y0','bardir'].indexOf(astr)!=-1)) {
        gd.axtypesok=false;
    }

    // switching from auto to manual binning or z scaling doesn't actually do anything but
    // change what you see in the styling box
    if((['autobinx','autobiny','zauto'].indexOf(astr)!=-1) && val===false) {
        setStyles(gd);
        return;
    }

    // need to replot if mode or visibility changes, because the right objects don't exist
    // also need to replot if a heatmap
    // also need to replot the error bars for several cases. TODO: if re-plotting error bars, don't re-plot scatter plots
    // TODO: lots of stuff here now... should we switch to looking for things that DON'T need plot?
    var main_attr=['mode','visible','type','bardir','fill'],
        hm_attr=['mincolor','maxcolor','scale','x0','dx','y0','dy','zmin','zmax','zauto','scl'],
        eb_attr=['error_y.visible','error_y.value','error_y.type','error_y.traceref','error_y.array'],
        hist_attr=[ 'autobinx','nbinsx','xbins.start','xbins.end','xbins.size',
                    'autobiny','nbinsy','ybins.start','ybins.end','ybins.size'];
    if(main_attr.concat(eb_attr,hist_attr).indexOf(astr)!=-1) {
        // major enough changes deserve an autoscale (and autobin) so people don't get confused
        if(['bardir','type'].indexOf(astr)!=-1) {
            gl.xaxis.autorange=true;
            gl.xaxis.range=[0,1]; // undo any axis reversal
            gl.yaxis.autorange=true;
            gl.yaxis.range=[0,1];
            if(astr=='type') {
                for(i=0; i<traces.length; i++) {
                    gd.data[traces[i]].autobinx=true;
                    gd.data[traces[i]].autobiny=true;
                }
            }
        }
        // if we need to change margin for a heatmap, force a relayout first so we don't plot twice
        if(heatmap_margin(gd)){
            gd.layout = undefined;
            plot(gd,'',gl,true);
        }
        else { plot(gd,'','',(hasheatmap && (hist_attr.indexOf(astr)!=-1))) } // redraw heatmap if its histogram attributes change
    }
    else if(hm_attr.indexOf(astr)!=-1) {
        plot(gd,'','',true); // <-- last arg is to force redrawing the heatmap. TODO: if multiple heatmaps, only redraw one?
    }
    else if(hasbars && ['marker.line.width','marker.color'].indexOf(astr)!=-1) {
        plot(gd,'',''); // can change the antialiasing width correction on bar charts
    }
    else {
        setStyles(gd);
        applyStyle(gd.plot);
        if($(gd).find('.legend').length)
            legend(gd);
    }
    plotlylog('+++++++++++++++OUT: restyle+++++++++++++++');
}

// change layout in an existing plot
// astr and val are like restyle, or 2nd arg can be an object {astr1:val1, astr2:val2...}
function relayout(gd,astr,val) {
    plotlylog('+++++++++++++++ IN: RELAYOUT +++++++++++++++');

    gd.changed = true;
    var gl = gd.layout,
        aobj = {},
        dolegend = false,
        doticks = false,
        dolayoutstyle = false,
        doplot = false;
    if(typeof astr == 'string')
        aobj[astr] = val;
    else if($.isPlainObject(astr))
        aobj = astr;
    // look for 'allaxes', split out into all axes
    var keys = Object.keys(aobj),
        axes = ['xaxis','yaxis'];
    for(var i=0; i<keys.length; i++) {
        if(keys[i].indexOf('allaxes')==0) {
            for(var j=0; j<axes.length; j++) {
                var newkey = keys[i].replace('allaxes',axes[j]);
                if(!aobj[newkey]) { aobj[newkey] = aobj[keys[i]] }
            }
            delete aobj[keys[i]];
        }
    }

    // alter gd.layout
    for(var i in aobj) {
        // check whether to disable autosize or autorange
        if((i=='height' || i=='width') && !aobj.autosize) { gl.autosize=false }
        var m = i.match(/^(.)axis\.range\[[0|1]\]$/);
        if(m && m.length==2) { gl[m[1]+'axis'].autorange=false }

        // handle axis reversal
        var m = i.match(/^(.)axis\.reverse$/);
        if(m && m.length==2) {
            console.log('here');
            var ax = gl[m[1]+'axis'],
                r0 = ax.range[0],
                r1 = ax.range[1];
            ax.range[0]=r1;
            ax.range[1]=r0;
            doplot=true;
            continue; // don't try to set 'reverse' flag (later in the loop)
        }

        var aa = propSplit(i);
        // toggling log without autorange: need to also recalculate ranges
        // logical XOR (ie will islog actually change)
        if(aa[1]=='type' && !gl[aa[0]].autorange && (gl[aa[0]].type=='log' ? val!='log' : val=='log')) {
            var ax = gl[aa[0]],
                r0 = ax.range[0],
                r1 = ax.range[1];
            if(val=='log') {
                if(r0<0 && r1<0) { ax.autorange=true; continue } // if both limits are negative, autorange
                // if one is negative, set it to one millionth the other. TODO: find the smallest positive val?
                else if(r0<0) r0 = r1/1e6;
                else if(r1<0) r1 = r0/1e6;
                // now set the range values as appropriate
                if(!(aa[0]+'.range[0]' in aobj)) ax.range[0] = Math.log(r0)/Math.LN10;
                if(!(aa[0]+'.range[1]' in aobj)) ax.range[1] = Math.log(r1)/Math.LN10;
            }
            else {
                if(!(aa[0]+'.range[0]' in aobj)) ax.range[0] = Math.pow(10, r0);
                if(!(aa[0]+'.range[1]' in aobj)) ax.range[1] = Math.pow(10, r1);
            }
        }
        // send annotation mods one-by-one through annotation(), don't set via nestedProperty
        if(aa[0]=='annotations') {
            annotation(gd,aa[1],i.replace(/^annotations\[-?[0-9]*\][.]/,''),aobj[i]);
            delete aobj[i];
        }
        // alter gd.layout
        else {
            // check whether we can short-circuit a full redraw
            if(aa[0].indexOf('legend')!=-1) { dolegend = true }
            else if(i.indexOf('title')!=-1) { doticks = true } // TODO: can do global font too if we update all annotations
            else if(aa[0].indexOf('bgcolor')!=-1) { dolayoutstyle = true }
            else if(aa.length>1 && (
                aa[1].indexOf('tick')!=-1 ||
                aa[1].indexOf('exponent')!=-1 ||
                aa[1].indexOf('grid')!=-1 ||
                aa[1].indexOf('zeroline')!=-1)) { doticks = true }
            else if(aa.length>1 && (
                aa[1].indexOf('line')!=-1 ||
                aa[1].indexOf('mirror')!=-1 ||
                (aa[1]=='margin' && aa[2]=='pad'))) { dolayoutstyle = true }
            else if(i=='margin.pad') { doticks = dolayoutstyle = true }
            else { doplot = true }
            nestedProperty(gl,i).set(aobj[i]);
        }
    }

    // calculate autosizing
    if(aobj.autosize) { aobj=plotAutoSize(gd,aobj) }

    // redraw
    // first check if there's still anything to do
    var ak = Object.keys(aobj);
    if(ak.length) {
        if(doplot) {
            gd.layout = undefined; // force plot() to redo the layout
            plot(gd,'',gl); // pass in the modified layout
            return;
        }
        // if we didn't need to redraw the whole thing, just do the needed parts
        if(dolegend) {
            gd.paper.selectAll('.legend').remove();
            if(gl.showlegend) { legend(gd) }
        }
        if(doticks) { doTicks(gd,'redraw'); makeTitles(gd,'gtitle') }
        if(dolayoutstyle) { layoutStyles(gd) }
    }
    plotlylog('+++++++++++++++ OUT: RELAYOUT +++++++++++++++');
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
        if(indexed) { aa.splice(j,1,indexed[1],Number(indexed[2])) }
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
    if(gd===undefined) return;
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

    // Get the layout info - take the default and update it with layout arg
    gd.layout=updateObject(defaultLayout(),layout);

    var gl=gd.layout, gd3=d3.select(gd), xa=gl.xaxis, ya=gl.yaxis;

    // initial autosize
    if(gl.autosize=='initial') {
        gd.paper=gd3.append('svg')
            .attr('width',gl.width)
            .attr('height',gl.height);
        plotAutoSize(gd,{});
        gd.paper.remove();
        gl.autosize=true;
    }

    heatmap_margin(gd); // check for heatmaps w/ colorscales, adjust margin accordingly

    // adjust margins for outside legends
    // gl.margin is the requested margin, gd.margin is after adjustment
    gd.margin = {
        l:gl.margin.l-(gd.lw<0 ? gd.lw : 0),
        r:gl.margin.r+(gd.lw>0 ? gd.lw : 0),
        t:gl.margin.t+(gd.lh>0 ? gd.lh : 0),
        b:gl.margin.b-(gd.lh<0 ? gd.lh : 0),
        p:gl.margin.pad }
    var gm = gd.margin;
    gd.plotwidth=gl.width-gm.l-gm.r;
    gd.plotheight=gl.height-gm.t-gm.b;

    // Make the graph containers
    gd.paper=gd3.append('svg')
        .call(setSize, gl.width, gl.height);
    gd.paperbg=gd.paper.append('rect')
        .call(setRect, 0, 0, gl.width, gl.height)
    gd.plotbg=gd.paper.append('rect')
        .call(setRect, gm.l-gm.p, gm.t-gm.p, gd.plotwidth+2*gm.p, gd.plotheight+2*gm.p)
        .attr('stroke-width',0);
    gd.axlines = {
        x:gd.paper.append('path').style('fill','none'),
        y:gd.paper.append('path').style('fill','none')
    }

    // make the ticks, grids, and titles
    gd.axislayer=gd.paper.append('g').attr('class','axislayer');
    doTicks(gd);
    xa.r0=gl.xaxis.range[0];
    ya.r0=gl.yaxis.range[0];

    layoutStyles(gd);

    // Second svg (plot) is for the data
    gd.plot=gd.paper.append('svg')
        .call(setRect, gm.l, gm.t, gd.plotwidth, gd.plotheight)
        .attr('preserveAspectRatio','none')
        .style('fill','none');
    gd.viewbox={x:0,y:0};

    //make the axis drag objects
    var x1 = gm.l,
        x2 = x1+gd.plotwidth,
        a = $(gd).find('text.ytick').get().map(function(e){return e.getBBox().x}),
        x0 = a.length ? Math.min.apply(a,a) : x1-10,
        y2 = gm.t,
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

// separate styling for plot layout elements, so we don't have to redraw to edit
function layoutStyles(gd) {
    var gl = gd.layout,xa = gl.xaxis, ya = gl.yaxis, gm = gd.margin;
    gd.paperbg.call(fillColor, gl.paper_bgcolor);
    gd.plotbg.call(fillColor, gl.plot_bgcolor);
    var xlw = $.isNumeric(xa.linewidth) ? xa.linewidth : 1,
        ylw = $.isNumeric(ya.linewidth) ? ya.linewidth : 1,
        xp = gm.p+ylw/2,
        yp = gm.p-xlw/2, // shorten y axis lines so they don't overlap x axis lines
        yp2 = xa.mirror ? 0 : xlw; // except at the top when there's no mirror x
    gd.axlines.x
        .attr('d', 'M'+(gm.l-xp)+','+(gm.t+gd.plotheight+gm.p)+'h'+(gd.plotwidth+2*xp) +
            (xa.mirror ? ('m0,-'+(gd.plotheight+2*gm.p)+'h-'+(gd.plotwidth+2*xp)) : ''))
        .attr('stroke-width',xlw)
        .call(strokeColor,xa.linecolor);
    gd.axlines.y
        .attr('d', 'M'+(gm.l-gm.p)+','+(gm.t-yp-yp2)+'v'+(gd.plotheight+2*yp+yp2) +
            (ya.mirror ? ('m'+(gd.plotwidth+2*gm.p)+',0v-'+(gd.plotheight+2*yp+yp2)) : ''))
        .attr('stroke-width',ylw)
        .call(strokeColor,ya.linecolor);
    makeTitles(gd,'');
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

        // in the main plot area, any drag except shift makes a zoombox
        if(ns+ew=='nsew' && !e.shiftKey) { zoomBox(e) }
        // otherwise, do pan (zoom on the ends/corners)
        else { dragRange(e) }
        return pauseEvent(e);
    }

    // scroll zoom, on all draggers except corners
    var scrollViewBox = [0,0,gd.plotwidth,gd.plotheight],
        redrawTimer = null;
    if(ns.length*ew.length!=1) {
        $(dragger).on('mousewheel DOMMouseScroll', function(e) {
            clearTimeout(redrawTimer);
            var zoom = Math.exp(-Math.min(Math.max(e.originalEvent.wheelDelta,-50),50)/200),
                gbb = $(gd).find('.nsewdrag')[0].getBoundingClientRect();
            if(ew) {
                gx.range = [Number(gx.range[0]),Number(gx.range[1])]
                var xfrac = (e.originalEvent.clientX-gbb.left)/gbb.width,
                    x0 = gx.range[0]+(gx.range[1]-gx.range[0])*xfrac,
                    vbx0 = scrollViewBox[0]+scrollViewBox[2]*xfrac;
                gx.range = [x0+(gx.range[0]-x0)*zoom,x0+(gx.range[1]-x0)*zoom];
                scrollViewBox[2] *= zoom;
                scrollViewBox[0] = vbx0-scrollViewBox[2]*xfrac;
                gx.autorange=false;
            }
            if(ns) {
                gy.range = [Number(gy.range[0]),Number(gy.range[1])]
                var yfrac = (gbb.bottom-e.originalEvent.clientY)/gbb.height,
                    y0 = gy.range[0]+(gy.range[1]-gy.range[0])*yfrac;
                    vby0 = scrollViewBox[1]+scrollViewBox[3]*(1-yfrac);
                gy.range = [y0+(gy.range[0]-y0)*zoom,y0+(gy.range[1]-y0)*zoom];
                scrollViewBox[3] *= zoom;
                scrollViewBox[1] = vby0-scrollViewBox[3]*(1-yfrac);
                gy.autorange=false;
            }
            // viewbox redraw at first
            gd.plot.attr('viewBox',scrollViewBox.join(' '));
            if(ew) { doTicks(gd,'x') }
            if(ns) { doTicks(gd,'y') }
            // then replot after a delay to make sure no more scrolling is coming
            redrawTimer = setTimeout(function(){
                scrollViewBox = [0,0,gd.plotwidth,gd.plotheight];
                resetViewBox();
            },300);
        });
    }

    function zoomBox(e){
        var gbb = $(gd).find('.nsewdrag')[0].getBoundingClientRect(),
            x0 = e.clientX,
            y0 = e.clientY,
            zb = $('<div id="zoombox" style="left: '+x0+'px; top: '+y0+'px;"></div>').appendTo('body');
        window.onmousemove = function(e2) {
            var x1 = Math.max(gbb.left,Math.min(gbb.right,e2.clientX)),
                y1 = Math.max(gbb.top,Math.min(gbb.bottom,e2.clientY));
            // Not sure about the addition of window.scrollX/Y... seems to work but doesn't seem robust.
            zb.css({
                left: (Math.min(x0,x1)+window.scrollX)+'px',
                top: (Math.min(y0,y1)+window.scrollY)+'px',
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
                    dragTail(gd);
                }
                return finishZB();
            }
            var zoomIn = function(){
                gx.range=[gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.left-gbb.left)/gbb.width,
                          gx.range[0]+(gx.range[1]-gx.range[0])*(zbb.right-gbb.left)/gbb.width];
                gy.range=[gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.bottom)/gbb.height,
                          gy.range[0]+(gy.range[1]-gy.range[0])*(gbb.bottom-zbb.top)/gbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            }
            var zoomOut = function(){
                gx.range=[(gx.range[0]*(zbb.right-gbb.left)+gx.range[1]*(gbb.left-zbb.left))/zbb.width,
                          (gx.range[0]*(zbb.right-gbb.right)+gx.range[1]*(gbb.right-zbb.left))/zbb.width];
                gy.range=[(gy.range[0]*(gbb.bottom-zbb.top)+gy.range[1]*(zbb.bottom-gbb.bottom))/zbb.height,
                          (gy.range[0]*(gbb.top-zbb.top)+gy.range[1]*(zbb.bottom-gbb.top))/zbb.height];
                finishZB();
                gx.autorange=false;
                gy.autorange=false;
                dragTail(gd);
            }

            // drag box context menu if any modifier key (other than shift) was pressed during either mousedown or mouseup
            if(e.altKey||e.ctrlKey||e.metaKey||e2.altKey||e2.ctrlKey||e2.metaKey) {
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
                $('#zoomboxin').click(zoomIn);
                $('#zoomboxout').click(zoomOut);
            }
            // no modifiers: no context menu
            else {
                zoomIn();
            }
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
    var gl=gd.layout,gm=gd.margin;
    var titles={
        'xtitle':{x: (gl.width+gm.l-gm.r)/2,
            y: gl.height+(gd.lh<0 ? gd.lh : 0) - 14*0.75,
            w: gd.plotwidth/2, h: 14,
            cont: gl.xaxis, name: 'X axis',
            font: gl.xaxis.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.xaxis.titlefont.size || (gl.font.size*1.2) || 14,
            fontColor: gl.xaxis.titlefont.color || gl.font.color || '#000',
            transform: '', attr: {}},
        'ytitle':{x: 20-(gd.lw<0 ? gd.lw : 0),
            y: (gl.height+gm.t-gm.b)/2,
            w: 14, h: gd.plotheight/2,
            cont: gl.yaxis, name: 'Y axis',
            font: gl.yaxis.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.yaxis.titlefont.size || (gl.font.size*1.2) || 14,
            fontColor: gl.yaxis.titlefont.color || gl.font.color || '#000',
            transform: 'rotate(-90,x,y)', attr: {center: 0}},
        'gtitle':{x: gl.width/2, y: gl.margin.t/2,
            w: gl.width/2, h: 16,
            cont: gl, name: 'Plot',
            font: gl.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.titlefont.size || gl.font.size*1.4 || 16,
            fontColor: gl.titlefont.color || gl.font.color || '#000',
            transform: '', attr: {}}};
    for(k in titles){
        if(title==k || title==''){
            var t=titles[k];
            gd.paper.select('.'+k).remove();
            var el=gd.paper.append('text').attr('class',k)
                .call(setPosition, t.x, t.y)
                .attr('font-family',t.font)
                .attr('font-size',t.fontSize)
                .attr('fill',t.fontColor)
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

    var tracetext=traces.call(legendText,gd).selectAll('text');
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
        if(!l.node()) { l=g.select('path') }
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
                dy = e2.clientY-e.clientY,
                gdm=gd.margin;
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
                var xl=(x0+dx-gdm.l)/(gl.width-gdm.l-gdm.r),
                    xr=xl+legendwidth/(gl.width-gdm.l-gdm.r),
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
                var yt=(y0+dy-gdm.t)/(gl.height-gdm.t-gdm.b),
                    yb=yt+legendheight/(gl.height-gdm.t-gdm.b),
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
    var gl = gd.layout,gm = gd.margin;
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
    if(typeof opt == 'string') { nestedProperty(options,opt).set(value) }
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
    if(!options.font) { options.font={family:'',size:0,color:''} }

    // check for change between log and linear
    if(options.ref=='plot') {
        if(options.xatype=='log' && xa.type=='linear') {
            options.x = Math.pow(10,options.x)
        }
        else if(options.xatype=='linear' && xa.type=='log') {
            if(options.x>0) { options.x = Math.log(options.x)/Math.LN10 }
            else { options.x = (xa.range[0]+xa.range[1])/2 } // log of negative - move it onscreen rather than failing
        }
        if(options.yatype=='log' && ya.type=='linear') {
            options.y = Math.pow(10,options.y)
        }
        else if(options.yatype=='linear' && ya.type=='log') {
            if(options.y>0) { options.y = Math.log(options.y)/Math.LN10 }
            else { options.y = (ya.range[0]+ya.range[1])/2 } // log of negative - move it onscreen rather than failing
        }
    }
    options.xatype=xa.type;
    options.yatype=ya.type;

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
        .attr('font-size',options.font.size||gl.font.size||12)
        .attr('font-family',options.font.family||gl.font.family||'Arial')
        .style('fill',options.font.color||gl.font.color||'#000');
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
        if(!$.isNumeric(options.x)) options.x=0.2;
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
        if(!$.isNumeric(options.x)) options.x=(xa.range[0]*0.8+xa.range[1]*0.2);
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
//         plotlylog(end_el);
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
                        xf=(ax+dx-gm.l)/(gl.width-gm.l-gm.r);
                        yf=1-((ay+dy-gm.t)/(gl.height-gm.t-gm.b));
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
                var xl=(x0+dx-gm.l)/(gl.width-gm.l-gm.r),
                    xr=xl+annwidth/(gl.width-gm.l-gm.r),
                    xc=(xl+xr)/2;
                if(xl<(2/3)-xc) xf=xl;
                else if(xr>4/3-xc) xf=xr;
                else xf=xc;
                var yt=(y0+dy-gm.t)/(gl.height-gm.t-gm.b),
                    yb=yt+annheight/(gl.height-gm.t-gm.b),
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
// style: 1-6, first 5 are pointers, 6 is circle, 7 is square, 8 is none
// ends is 'start', 'end' (default), 'start+end'
// mag is magnification vs. default (default 1)
function arrowhead(el3,style,ends,mag) {
    if(!$.isNumeric(mag)) { mag=1 }
    var el = el3.node();
        s = ['M-1,-2V2L1,0Z',
            'M-2,-2V2L2,0Z',
            'M-2,-2L0,0L-2,2L2,0Z',
            'M-2.2,-2.2L0,0L-2.2,2.2L-1.4,3L1.6,0L-1.4,-3Z',
            'M-4.2,-2.1L0,0L-4.2,2.1L-3.8,3L2.2,0L-3.8,-3Z',
            'M2,0A2,2 0 1,1 0,-2A2,2 0 0,1 2,0Z',
            'M2,2V-2H-2V2Z',
            ''][style-1];
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
            scale = (el3.attr('stroke-width') || 1)*(mag),
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
        for(var i=1; i<=8; i++){
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
        plotlylog('oops, autoGrowInput doesn\'t recognize this field',el,eln);
        return;
    }
    if(!gd.mainsite && mode!='drag') {
        plotlylog('not on the main site but tried to edit text. ???',el,eln);
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
        if(!gd.input || !gd.layout) { return } // occasionally we get two events firing...

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
            if(mode=='title') { makeTitles(gd,el) }
            else if(mode=='legend') { legend(gd) }
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
function calcTicks(gd,a) {
    // calculate max number of (auto) ticks to display based on plot size
    // TODO: take account of actual label size here
    // TODO: rotated ticks for categories or dates
    if(a.autotick || !a.dtick){
        var nt = a.nticks ||
                Math.max(3,Math.min(10,(a===gd.layout.yaxis) ? gd.plotheight/40 : gd.plotwidth/80));
        autoTicks(a,Math.abs(a.range[1]-a.range[0])/nt);
    }

    // check for missing tick0
    if(!a.tick0) {
        if(a.type=='date') { a.tick0 = new Date(2000,0,1).getTime() }
        else { a.tick0 = 0 }
    }

    // now figure out rounding of tick values
    autoTickRound(a);

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
    var axrev = (a.range[1]<a.range[0]);

    // return the full set of tick vals
    var vals = [],
        endtick = a.range[1];
    if(a.type=='category') {
        endtick = (axrev) ? Math.max(-0.5,endtick) : Math.min(a.categories.length-0.5,endtick);
    }
    for(var x=a.tmin;(axrev)?(x>=endtick):(x<=endtick);x=tickIncrement(x,a.dtick,axrev)) {
        vals.push(x);
    }
    a.tmax=vals[vals.length-1]; // save the last tick as well as first, so we can eg show the exponent only on the last one
    return vals.map(function(x){return tickText(gd, a, x)});
}

// autoTicks: calculate best guess at pleasant ticks for this axis
// takes in the axis object a, and rough tick spacing rt
// outputs (into a):
//   tick0: starting point for ticks (not necessarily on the graph)
//      usually 0 for numeric (=10^0=1 for log) or jan 1, 2000 for dates
//   dtick: the actual, nice round tick spacing, somewhat larger than rt
//      if the ticks are spaced linearly (linear scale, categories,
//          log with only full powers, date ticks < month), this will just be a number
//      months: M#
//      years: M# where # is 12*number of years
//      log with linear ticks: L# where # is the linear tick spacing
//      log showing powers plus some intermediates: D1 shows all digits, D2 shows 2 and 5
function autoTicks(a,rt){
    if(a.type=='date'){
        var base;
        a.tick0=new Date(2000,0,1).getTime();
        if(rt>15778800000){ // years if rt>6mo
            rt/=31557600000;
            var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            a.dtick='M'+String(12*rtexp*roundUp(rt/rtexp,[2,5,10]));
        }
        else if(rt>1209600000){ // months if rt>2wk
            rt/=2629800000;
            a.dtick='M'+roundUp(rt,[1,2,3,6]);
        }
        else if(rt>43200000){ // days if rt>12h
            base=86400000;
            a.tick0=new Date(2000,0,2).getTime(); // get week ticks on sunday
            a.dtick=base*roundUp(rt/base,[1,2,3,7,14]); // 2&3 day ticks are weird, but need something btwn 1&7
        }
        else if(rt>1800000){ // hours if rt>30m
            base=3600000;
            a.dtick=base*roundUp(rt/base,[1,2,3,6,12]);
        }
        else if(rt>30000){ // minutes if rt>30sec
            base=60000;
            a.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
        }
        else if(rt>500){ // seconds if rt>0.5sec
            base=1000;
            a.dtick=base*roundUp(rt/base,[1,2,5,10,15,30]);
        }
        else { //milliseconds
            var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            a.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
        }
    }
    else if(a.type=='log'){
        a.tick0=0;
        if(rt>0.7){ //only show powers of 10
            a.dtick=Math.ceil(rt);
        }
        else if(Math.abs(a.range[1]-a.range[0])<1){ // span is less then one power of 10
            var nt = 1.5*Math.abs((a.range[1]-a.range[0])/rt);
            // ticks on a linear scale, labeled fully
            rt=Math.abs(Math.pow(10,a.range[1])-Math.pow(10,a.range[0]))/nt;
            var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
            a.dtick='L' + String(rtexp*roundUp(rt/rtexp,[2,5,10]));
        }
        else { // include intermediates between powers of 10, labeled with small digits
            // a.dtick="D2" (show 2 and 5) or "D1" (show all digits)
            // use a.tickround to store the first tick
            // I don't think we're still using this... try to remove it
            var vmin=Math.pow(10,Math.min(a.range[1],a.range[0]));
            var minexp=Math.pow(10,Math.floor(Math.log(vmin)/Math.LN10));
            a.dtick = (rt>0.3) ? 'D2' : 'D1';
        }
    }
    else if(a.type=='category') {
        a.tick0=0;
        a.dtick=1;
    }
    else{
        // auto ticks always start at 0
        a.tick0=0;
        var rtexp=Math.pow(10,Math.floor(Math.log(rt)/Math.LN10));
        a.dtick=rtexp*roundUp(rt/rtexp,[2,5,10]);
    }
}

// after dtick is already known, find tickround = precision to display in tick labels
//   for regular numeric ticks, integer # digits after . to round to
//   for date ticks, the last date part to show (y,m,d,H,M,S) or an integer # digits past seconds
function autoTickRound(a) {
    var dt = a.dtick;
    a.tickexponent = 0;
    if(a.type=='category') {
        a.tickround = null;
    }
    else if($.isNumeric(dt) || dt.charAt(0)=='L') {
        if(a.type=='date') {
            if(dt>=86400000) { a.tickround = 'd' }
            else if(dt>=3600000) { a.tickround = 'H' }
            else if(dt>=60000) { a.tickround = 'M' }
            else if(dt>=1000) { a.tickround = 'S' }
            else { a.tickround = 3-Math.round(Math.log(dt/2)/Math.LN10) }
        }
        else {
            if(!$.isNumeric(dt)) { dt = Number(dt.substr(1)) }
            // 2 digits past largest digit of dtick
            a.tickround = 2-Math.floor(Math.log(dt)/Math.LN10+0.01);
            if(a.type=='log') { var maxend = Math.pow(10,Math.max(a.range[0],a.range[1])) }
            else { var maxend = Math.max(Math.abs(a.range[0]), Math.abs(a.range[1])) }
            var rangeexp = Math.floor(Math.log(maxend)/Math.LN10+0.01);
            if(Math.abs(rangeexp)>3) {
                a.tickexponent = (['SI','B'].indexOf(a.exponentformat)!=-1) ?
                    3*Math.round((rangeexp-1)/3) : rangeexp
            }
        }
    }
    else if(dt.charAt(0)=='M') {
        a.tickround = (dt.length==2) ? 'm' : 'y';
    }
    else { a.tickround = null }
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
    if($.isNumeric(a.dtick)) {
        var tmin = sRound((a.range[0]-a.tick0)/a.dtick)*a.dtick+a.tick0;
        // make sure no ticks outside the category list
        if(a.type=='category') {
            if(tmin<0) { tmin=0 }
            if(tmin>a.categories.length-1) { tmin=a.categories.length-1 }
        }
        return tmin
    }

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
    var gf = gd.layout.font, tf = a.tickfont,
        font = tf.family || gf.family || 'Arial',
        fontSize = tf.size || gf.size || 12,
        fontColor = tf.color || gf.color || '#000',
        px = 0,
        py = 0,
        suffix = '', // completes the full date info, to be included with only the first tick
        tt,
        hideexp = (a.showexponent!='all' && a.exponentformat!='none' &&
            x!={first:a.tmin,last:a.tmax}[a.showexponent]) ? 'hide' : false;
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
                        tt+=numFormat(mod(x/1000,1),a,'none').substr(1);
                }
            }
        }
    }
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
            tt=numFormat(Math.pow(10,x),a,hideexp);
        else throw "unrecognized dtick "+String(a.dtick);
    }
    else if(a.type=='category'){
        var tt0 = a.categories[Math.round(x)];
        if(tt0===undefined) { tt0='' }
        tt=String(tt0);
    }
    else
        tt=numFormat(x,a,hideexp);
    // if 9's are printed on log scale, move the 10's away a bit
    if((a.dtick=='D1') && (String(tt).charAt(0)=='1')){
        if(a===gd.layout.yaxis) px-=fontSize/4;
        else py+=fontSize/3;
    }
    return {dx:px, dy:py, text:tt+suffix, fontSize:fontSize, font:font, fontColor:fontColor, x:x};
}

// format a number (tick value) according to the axis settings
// new, more reliable procedure than d3.round or similar:
// add half the rounding increment, then stringify and truncate
// also automatically switch to sci. notation
SIPREFIXES = ['f','p','n','&mu;','m','','k','M','G','T'];
function numFormat(v,a,fmtoverride) {
    var n = (v<0), // negative?
        r = a.tickround, // max number of digits past decimal point to show
        e = Math.pow(10,-r)/2, // 'epsilon' - rounding increment
        d = a.tickexponent, // if nonzero, use a common exponent 10^d
        fmt = fmtoverride||a.exponentformat||'e';
    // fmt codes:
    // 'e' (1.2e+6, default)
    // 'E' (1.2E+6)
    // 'SI' (1.2M)
    // 'B' (same as SI except 10^9=B not G)
    // 'none' (1200000)
    // 'power' (1.2x10^6)
    // 'hide' (1.2, use 3rd argument=='hide' to eg only show exponent on last tick)
    if(fmt=='none') { d=0 }

    // take the sign out, put it back manually at the end - makes cases easier
    v=Math.abs(v);
    if(v<e) { v = '0' } // 0 is just 0, but may get exponent if it's the last tick
    else {
        v += e;
        // take out a common exponent, if any
        if(d) {
            v*=Math.pow(10,-d);
            r+=d;
        }
        // round the mantissa
        if(r==0) { v=String(Math.floor(v)) }
        else if(r<0) {
            v = String(Math.round(v));
            v = v.substr(0,v.length+r);
            for(var i=r; i<0; i++) { v+='0' }
        }
        else {
            v = String(v)
            v = v.substr(0,v.indexOf('.')+r+1).replace(/\.?0+$/,'');
        }
    }

    // add exponent
    if(d && fmt!='hide') {
        if(fmt=='e' || ((fmt=='SI'||fmt=='B') && (d>12 || d<-15))) {
            v += 'e'+(d>0 ? '+' : '')+d;
        }
        else if(fmt=='E') { v += 'E'+(d>0 ? '+' : '')+d }
        else if(fmt=='power') { v += '&times;10'+String(d).sup() }
        else if(fmt=='B' && d==9) { v += 'B' }
        else if(fmt=='SI' || fmt=='B') { v += SIPREFIXES[d/3+5] }
        else { console.log('unknown exponent format '+fmt) }
    }
    // put sign back in and return
    return (n?'-':'')+v;
}

// ticks, grids, and tick labels for axis ax:
// 'x' or 'y', blank to do both, 'redraw' to force full redraw
function doTicks(gd,ax) {
    if(ax=='redraw') { gd.axislayer.selectAll('text,path,line').remove() }
    if(['x','y'].indexOf(ax)==-1) {
        doTicks(gd,'x');
        doTicks(gd,'y');
        return;
    }
    var gl=gd.layout,
        gm=gd.margin,
        a={x:gl.xaxis, y:gl.yaxis}[ax],
        vals=calcTicks(gd,a),
        datafn = function(d){return d.text},
        tcls = ax+'tick',
        gcls = ax+'grid',
        zcls = ax+'zl',
        pad = gm.p+(a.ticks=='outside' ? 1 : -1) * ($.isNumeric(a.linewidth) ? a.linewidth : 1)/2;
    // positioning arguments for x vs y axes
    if(ax=='x') {
        var y1 = gl.height-gm.b+pad,
            ty = (a.ticks=='inside' ? -1 : 1)*a.ticklen,
            tickpath = 'M'+gm.l+','+y1+'v'+ty+
                (a.mirror=='ticks' ? ('m0,'+(-gd.plotheight-2*(ty+pad))+'v'+ty): ''),
            g = {x1:gm.l, x2:gm.l, y1:gl.height-gm.b, y2:gm.t},
            tl = {x:function(d){return d.dx+gm.l},
                y:function(d){return d.dy+y1+(a.ticks=='outside' ? a.ticklen : a.linewidth+1)+d.fontSize},
                anchor: (!a.tickangle || a.tickangle==180) ? 'middle' :
                    (a.tickangle<0 ? 'end' : 'start')},
            transfn = function(d){return 'translate('+(a.m*d.x+a.b)+',0)'};
    }
    else if(ax=='y') {
        var x1 = gm.l-pad,
            tx = (a.ticks=='inside' ? 1 : -1)*a.ticklen,
            tickpath = 'M'+x1+','+gm.t+'h'+tx+
                (a.mirror=='ticks' ? ('m'+(gd.plotwidth-2*(tx-pad))+',0h'+tx): ''),
            g = {x1:gm.l, x2:gl.width-gm.r, y1:gm.t, y2:gm.t},
            tl = {x:function(d){return d.dx+x1 -
                    (a.ticks=='outside' ? a.ticklen : a.linewidth+1) -
                    (Math.abs(a.tickangle)==90 ? d.fontSize/2 : 0)
                },
                y:function(d){return d.dy+gm.t+d.fontSize/2},
                anchor: (Math.abs(a.tickangle)==90) ? 'middle' : 'end'},
            transfn = function(d){return 'translate(0,'+(a.m*d.x+a.b)+')'};
    }
    else {
        plotlylog('unrecognized doTicks axis',ax);
        return;
    }

    // ticks
    var ticks=gd.axislayer.selectAll('path.'+tcls).data(vals,datafn);
    if(a.ticks) {
        ticks.enter().append('path').classed(tcls,1).classed('ticks',1)
            .call(strokeColor, a.tickcolor || '#000')
            .attr('stroke-width', a.tickwidth || 1)
            .attr('d',tickpath)
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
            .attr('font-family',function(d){return d.font})
            .attr('font-size',function(d){return d.fontSize})
            .attr('fill',function(d){return d.fontColor})
            .attr('text-anchor',tl.anchor)
            .each(function(d){styleText(this,d.text)});
        yl.attr('transform',function(d){
            return transfn(d) + (a.tickangle ?
                (' rotate('+a.tickangle+','+tl.x(d)+','+(tl.y(d)-d.fontSize/2)+')') : '')
        });
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
    if(a.zeroline && a.type=='linear') {
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

    // update the axis title (so it can move out of the way if needed)
    makeTitles(gd,ax+'title');
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

SPECIALCHARS={'mu':'\u03bc','times':'\u00d7'}

function styleText(sn,t) {
    if(t===undefined) return;
    var s=d3.select(sn);
    // whitelist of tags we accept - make sure new tags get added here as well as styleTextInner
    var tags=['sub','sup','b','i','font'];
    var tagRE=new RegExp('\x01(\\/?(br|'+tags.join('|')+')(\\s[^\x01\x02]*)?\\/?)\x02','gi');
    var charsRE=new RegExp('&('+Object.keys(SPECIALCHARS).join('|')+');','g');
    // take the most permissive reading we can of the text:
    // if we don't recognize a tag, treat it as literal text
    var t1=t.replace(/</g,'\x01') // first turn all <, > to non-printing \x01, \x02
        .replace(/>/g,'\x02')
        .replace(tagRE,'<$1>') // next turn good tags back to <...>
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
    // make special characters into their own <c> tags
    t1=t1.replace(charsRE,'<c>$1</c>');
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
    function addtext(v) {
        if(s.text()) { s.append('tspan').text(v) }
        else { s.text(v) }
    }
    for(var i=0; i<n.length;i++) {
        var nn=n[i].nodeName.toLowerCase();
        if(nn=='#text') {
            addtext(n[i].nodeValue);
        }
        else if(nn=='c') {
            addtext(SPECIALCHARS[n[i].childNodes[0].nodeValue]||'?');
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
        plotlylog('~ DATA ~');
        plotlylog(data);
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

// aggregate value v and array a (up to len, if specified)
// using function f (ie Math.min, etc)
// throwing out non-numeric values
// if there's no continuing value v, use null for selector-type functions (max,min)
//   or 0 for summation-type functions
function aggNums(f,v,a,len) {
    if(!len) { len=a.length }
    if(!$.isNumeric(v)) { v=false }
// 	var r=($.isNumeric(v)) ? v : false;
	for(i=0; i<len; i++) {
	    if(!$.isNumeric(v)) { v=a[i] }
	    else if($.isNumeric(a[i])) { v=f(v,a[i]) }
	}
	return v;
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

// convertToAxis: convert raw data to numbers
// dates -> ms since the epoch,
// categories -> integers
// log: we no longer take log here, happens later
function convertToAxis(o,a){
    // find the conversion function
    if(a.type=='date') { var fn = DateTime2ms }
    else if(a.type=='category') {
        // create the category list
        // this will enter the categories in the order it encounters them,
        // ie all the categories from the first data set, then all the ones
        // from the second that aren't in the first etc.
        // TODO: sorting options - I guess we'll have to do this in plot()
        // after finishing calcdata
        if($.isArray(o)) {
            if(!a.categories) { a.categories=[] }
            o.forEach(function(v){ if(a.categories.indexOf(v)==-1) { a.categories.push(v) } });
        }
        else if(!a.categories || !a.categories.length) {
            console.log('Error! Tried to convert single category to axis with no existing categories');
            return null;
        }
        var fn = function(v){ var c = a.categories.indexOf(v); return c==-1 ? undefined : c }
    }
    else { var fn = function(v){return $.isNumeric(v) ? Number(v) : undefined } }

    // do the conversion
    if($.isArray(o)) { return o.map(fn) }
    else { return fn(o) }
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

function plotlylog(str){
    if(VERBOSE){
        console.log(str);
    }
}
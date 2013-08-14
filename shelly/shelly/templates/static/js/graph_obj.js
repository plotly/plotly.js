/* Coordinate systems in the plots:
***** THESE NOTES ARE HORRIBLY OUT OF DATE... *****
(note: paper and viewbox have y0 at large y because pixels start at upper left,
not lower left)

Data coordinates: xd,yd
    visible range: xd0-xd1, yd0-yd1 (gl.xaxis.range[0-1], gl.yaxis.range[0-1]

Paper coordinates: xp,yp (where axes are drawn, minus gl.margin:.l,.t)
    plot box: xp0-xp1, yp0-yp1 (0 - gd.plotwidth, gd.plotheight - 0)
    transform: xp = mx*xd+bx, yp = my*yd+by
        mx = gl.xaxis._m = gd.plotwidth/(gl.xaxis.range:[1]-[0])
        bx = gl.xaxis._b = -mx*gl.xaxis.range[0]
        my = gl.yaxis._m = gd.plotheight/(gl.yaxis.range:[0]-[1])
        by = gl.yaxis._b = -my*gl.yaxis.range[1]
Viewbox coordinates: xv,yv (where data are drawn)
    plot box: xv0-xv1, yv0-yv1
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
TOOLBAR_LEFT = '40px'; // TODO: do these do anything anymore?
TOOLBAR_TOP = '-30px'; // "
PTS_LINESONLY = 20; // traces with < this many points are by default shown with points and lines, > just get lines
DBLCLICKDELAY = 600; // ms between first mousedown and 2nd mouseup to constitute dblclick... we don't seem to have access to the system setting
MINDRAG = 5; // pixels to move mouse before you stop clamping to starting point
VERBOSE = false; // set to true to get a lot more logging and tracing

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

// default layout defined as a function rather than a constant so it makes a new copy each time
function defaultLayout(){
    return {title:'Click to enter Plot title',
        xaxis:{range:[-1,6],type:'-',mirror:true,linecolor:'#000',linewidth:1,
            tick0:0,dtick:2,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',nticks:0,
            showticklabels:true,tickangle:0,exponentformat:'e',showexponent:'all',
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter X axis title',unit:'',
            titlefont:{family:'',size:0,color:''},
            tickfont:{family:'',size:0,color:''}},
        yaxis:{range:[-1,4],type:'-',mirror:true,linecolor:'#000',linewidth:1,
            tick0:0,dtick:1,ticks:'outside',ticklen:5,tickwidth:1,tickcolor:'#000',nticks:0,
            showticklabels:true,tickangle:0,exponentformat:'e',showexponent:'all',
            showgrid:true,gridcolor:'#ddd',gridwidth:1,
            autorange:true,autotick:true,
            zeroline:true,zerolinecolor:'#000',zerolinewidth:1,
            title:'Click to enter Y axis title',unit:'',
            titlefont:{family:'',size:0,color:''},
            tickfont:{family:'',size:0,color:''}},
        legend:{bgcolor:'#fff',bordercolor:'#000',borderwidth:1,
            font:{family:'',size:0,color:''}},
        width:GRAPH_WIDTH,
        height:GRAPH_HEIGHT,
        autosize:'initial', // after initial autosize reverts to true
        margin:{l:80,r:60,t:80,b:80,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff',
        barmode:'stack',
        bargap:0.2,
        bargroupgap:0.0,
        boxmode:'overlay',
        boxgap:0.3,
        boxgroupgap:0.3,
        font:{family:'Arial, sans-serif;',size:12,color:'#000'},
        titlefont:{family:'',size:0,color:''},
        dragmode:'zoom',
        hovermode:'x'
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
    },
    box:{
        framework:newPlot
    }
}

var BARTYPES = ['bar','histogramx','histogramy'];
var HEATMAPTYPES = ['heatmap','histogram2d'];

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
// inputs:
//      divid - the id or DOM element of the graph container div
//      data - array of traces, containing the data and display
//          information for each trace
//      layout - object describing the overall display of the plot,
//          all the stuff that doesn't pertain to any individual trace
function plot(divid, data, layout) {
    markTime('in plot')
    plotlylog('+++++++++++++++IN: plot(divid, data, layout)+++++++++++++++');
    // Get the container div: we will store all variables for this plot as
    // properties of this div (for extension to multiple plots/tabs per page)
    // some callers send this in by dom element, others by id (string)
    var gd=(typeof divid == 'string') ? document.getElementById(divid) : divid;
	// test if this is on the main site or embedded
	gd.mainsite=Boolean($('#plotlyMainMarker').length);

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass non-array (null, '', whatever) for data
    var graphwasempty = ((typeof gd.data==='undefined') && $.isArray(data));
    if($.isArray(data)) {
        if(graphwasempty) { gd.data=data }
        else { gd.data.push.apply(gd.data,data) }
        gd.empty=false; // for routines outside graph_obj that want a clean tab
                        // (rather than appending to an existing one) gd.empty
                        // is used to determine whether to make a new tab
    }

    // Make or remake the framework (ie container and axes) if we need to
    // figure out what framework the data imply,
    //  and whether this is different from what was already there
    // everything on xy axes (which right now is everything period) uses newPlot
    //  but surface plots, pie charts, etc may use other frameworks.
    // note: if they container already exists and has data,
    //  the new layout gets ignored (as it should)
    //  but if there's no data there yet, it's just a placeholder...
    //  then it should destroy and remake the plot
    if(gd.data&&gd.data.length>0){
        var framework = graphInfo[gd.data[0].type || 'scatter'].framework;
        if(!gd.framework || gd.framework!=framework || (typeof gd.layout==='undefined') || graphwasempty) {
            gd.framework = framework;
            framework(gd,layout);
        }
    }
    else if((typeof gd.layout==='undefined')||graphwasempty) { newPlot(gd, layout) }

    // enable or disable formatting buttons
    $(gd).find('.data-only').attr('disabled', !gd.data || gd.data.length==0);

    var gl=gd.layout,
        xa=gl.xaxis,
        ya=gl.yaxis;
    var x, y, i, serieslen;
    // if we have bars or fill-to-zero traces, make sure autorange goes to zero
    gd.firstscatter = true; // because fill-to-next on the first scatter trace goes to zero
    gd.numboxes = 0;

    // prepare the types and conversion functions for the axes
    // also clears the autorange bounds ._tight, ._padded
    Axes.setTypes(gd);

    // prepare the data and find the autorange
    // TODO: only remake calcdata for new or changed traces
    gd.calcdata=[];
    gd.hmpixcount=0; // for calculating avg luminosity of heatmaps
    gd.hmlumcount=0;

    markTime('done Axes.setType');

    for(var curve in gd.data) {
        var gdc=gd.data[curve], // curve is the index, gdc is the data object for one trace
            curvetype = gdc.type || 'scatter', //default type is scatter
            typeinfo = graphInfo[curvetype],
            cd=[],
            cdtextras={}; // info (if anything) to add to cd[0].t

        if(typeinfo.framework!=gd.framework) {
            plotlylog('Oops, tried to put data of type '+(gdc.type || 'scatter')+
                ' on an incompatible graph controlled by '+(gd.data[0].type || 'scatter')+
                ' data. Ignoring this dataset.');
            continue;
        }

        // if no name is given, make a default from the curve number
        if(!('name' in gdc)) {
            if('ysrc' in gdc) {
                var ns=gdc.ysrc.split('/')
                gdc.name=ns[ns.length-1].replace(/\n/g,' ');
            }
            else { gdc.name='trace '+curve }
        }

        if(curvetype=='scatter') { cd = Scatter.calc(gd,gdc) }
        else if(BARTYPES.indexOf(curvetype)!=-1) { cd = Bars.calc(gd,gdc) }
        else if(HEATMAPTYPES.indexOf(curvetype)!=-1 ){ cd = Heatmap.calc(gd,gdc) }
        else if(curvetype=='box') { cd = Boxes.calc(gd,gdc) }

        if(!$.isArray(cd)) { continue }

        if(!('line' in gdc)) gdc.line={};
        if(!('marker' in gdc)) gdc.marker={};
        if(!('line' in gdc.marker)) gdc.marker.line={};
        if(!cd[0]) { cd.push({x:false,y:false}) } // make sure there is a first point
        // add the trace-wide properties to the first point, per point properties to every point
        // t is the holder for trace-wide properties
        if(!cd[0].t) { cd[0].t = {} }
        cd[0].t.curve = curve; // store the gd.data curve number that gave this trace
        cd[0].t.cdcurve = gd.calcdata.length; // store the calcdata curve number we're in

        gd.calcdata.push(cd);
        markTime('done with calcdata for '+curve);
    }

    // put the styling info into the calculated traces
    // has to be done separate from applyStyles so we know the mode (ie which objects to draw)
    // and has to be before stacking so we get bardir, type, visible
    setStyles(gd);

    // position and range calculations for traces that depend on each other
    // ie bars (stacked or grouped) and boxes push each other out of the way
    Bars.setPositions(gd);
    Boxes.setPositions(gd);

    markTime('done with setstyles and bar/box adjustments');

    // autorange for errorbars
    Axes.expandBounds(ya,ya._padded,errorbarsydr(gd));
    markTime('done errorbarsydr');

    // autorange for annotations
    if(gl.annotations) { gl.annotations.forEach(function(ann){
        if(ann.ref!='plot') { return }
        // TODO
    }) }

    Axes.doAutoRange(gd,xa);
    Axes.doAutoRange(gd,ya);

    gd.plot.attr('viewBox','0 0 '+gd.plotwidth+' '+gd.plotheight);
    Axes.doTicks(gd); // draw ticks, titles, and calculate axis scaling (._b, ._m)
    xa._r = xa.range.slice(); // store ranges for later use
    ya._r = ya.range.slice();

    markTime('done autorange and ticks');

    if($.isNumeric(xa._m) && $.isNumeric(xa._b) && $.isNumeric(ya._m) && $.isNumeric(ya._b)) {
        // Now plot the data. Order is:
        // 1. heatmaps (and 2d histos)
        // 2. bars/histos
        // 3. errorbars for everyone
        // 4. scatter
        // 5. box plots

        var cdbar = [], cdscatter = [], cdbox = [];
        for(var i in gd.calcdata){
            var cd = gd.calcdata[i], type=cd[0].t.type;
            if(HEATMAPTYPES.indexOf(type)!=-1) {
                Heatmap.plot(gd,cd);
                markTime('done heatmap '+i);
            }
            else {
                // in case this one was a heatmap previously, remove it and its colorbar
                $(gd).find('.hm'+i).remove();
                $(gd).find('.cb'+i).remove();

                if(BARTYPES.indexOf(type)!=-1) { cdbar.push(cd) }
                else if(type=='box') { cdbox.push(cd) }
                else { cdscatter.push(cd) }
            }
        }

        // remove old traces, then redraw everything
        gd.plot.selectAll('g.trace').remove();
        Bars.plot(gd,cdbar);
        markTime('done bars');

        // DRAW ERROR BARS for bar and scatter plots
        // these come after (on top of) bars, and before (behind) scatter
        errorbars(gd,cdbar.concat(cdscatter));
        markTime('done errorbars');

        Scatter.plot(gd,cdscatter);
        markTime('done scatter');
        Boxes.plot(gd,cdbox);
        markTime('done boxes');

        //styling separate from drawing
        applyStyle(gd);
        markTime('done applyStyle');
    }
    else { console.log('error with axis scaling',xa._m,xa._b,ya._m,ya._b) }

    // show the legend and annotations
    if(gl.showlegend || (gd.calcdata.length>1 && gl.showlegend!=false)) { legend(gd) }
    if(gl.annotations) { for(var i in gl.annotations) { annotation(gd,i) } }

    // finish up - spinner and tooltips
    if(typeof positionBrand == 'function') { positionBrand() } // for embedded
    delMessage('Loading');

    setTimeout(function(){
        if($(gd).find('#graphtips').length==0 && gd.data!==undefined && gd.showtips!=false && gd.mainsite){
            try{
                if( firsttimeuser() ) showAlert('graphtips');
            }
            catch(e){
                console.log(e);
            }
        }
        else if($(gd).find('#graphtips').css('display')=='none'){
            if( firsttimeuser() ) $(gd).find('#graphtips').fadeIn();
        }
    },1000);
    plotlylog('+++++++++++++++OUT: plot(divid, data, layout)+++++++++++++++');
    markTime('done plot');
}

// find the bin for val - note that it can return outside the bin range
// bins is either an object {start,size,end} or an array length #bins+1
// any pos. or neg. integer for linear bins, or -1 or bins.length-1 for explicit
// for linear bins, we can just calculate. For listed bins, run a binary search
// linelow (truthy) says the bin boundary should be attributed to the lower bin
// rather than the default upper bin
function findBin(val,bins,linelow) {
    if($.isNumeric(bins.start)) {
        return linelow ?
            Math.ceil((val-bins.start)/bins.size)-1 :
            Math.floor((val-bins.start)/bins.size);
    }
    else {
        var n1=0, n2=bins.length, c=0;
        while(n1<n2 && c++<100){ // c is just to avoid infinite loops if there's an error
            n=Math.floor((n1+n2)/2);
            if(linelow ? bins[n]<val : bins[n]<=val) { n1=n+1 }
            else { n2=n }
        }
        if(c>90) { console.log('Long binary search...') }
        return n1-1;
    }
}

// find distinct values in an array, lumping together ones that appear to
// just be off by a rounding error
// return the distinct values and the minimum difference between any two
function distinctVals(vals) {
    vals.sort(function(a,b){return a-b});
    var l = vals.length-1,
        minDiff = (vals[l]-vals[0])||1,
        errDiff = minDiff/(l||1)/10000,
        v2=[vals[0]];
    for(var i=0;i<l;i++) {
        if(vals[i+1]>vals[i]+errDiff) { // make sure values aren't just off by a rounding error
            minDiff=Math.min(minDiff,vals[i+1]-vals[i]);
            v2.push(vals[i+1]);
        }
    }
    return {vals:v2,minDiff:minDiff}
}

// set display params per trace to default or provided value
function setStyles(gd, merge_dflt) {
    plotlylog('+++++++++++++++IN: setStyles(gd)+++++++++++++++');

    merge_dflt = merge_dflt || false; // CP Edit - see mergeattr comment

    // merge object a[k] (which may be an array or a single value) into cd...
    // search the array defaults in case a[k] is missing (and for a default val
    // if some points of o are missing from a)
    // CP Edit: if merge_dflt, then apply the default value into a... used for saving themes
    // CP Edit: pass key (k) as argument
    // CP Edit: stringify option - used for heatmap colorscales
    function mergeattr(a,k,attr,dflt,stringify) {
        stringify = stringify || false;
        var val = stringify ? JSON.stringify(a[k]) : a[k];

        if($.isArray(val)) {
            var l = Math.max(cd.length,val.length);
            for(var i=0; i<l; i++) { cd[i][attr]=val[i] }
            cd[0].t[attr] = dflt; // use the default for the trace-wide value
        }
        else {
            cd[0].t[attr] = (typeof val != 'undefined') ? val : dflt;
            if(merge_dflt && typeof val == 'undefined'){
                a[k] = stringify ? JSON.parse(dflt) : dflt;
            }
        }
    }


    for(var i in gd.calcdata){
        var cd = gd.calcdata[i],
            t = cd[0].t,
            c = t.curve,
            gdc = gd.data[c],
            dc = defaultColors[c % defaultColors.length];
        // all types have attributes type, visible, opacity, name, text
        // mergeattr puts single values into cd[0].t, and all others into each individual point
        mergeattr(gdc,'type','type','scatter');
        mergeattr(gdc,'visible','visible',true);
        mergeattr(gdc,'opacity','op',1);
        mergeattr(gdc,'text','tx','');
        mergeattr(gdc,'name','name','trace '+c);
        var type = t.type;
        if( (gdc.error_y && gdc.error_y.visible ) ){
            mergeattr(gdc.error_y,'visible','ye_vis',false);
            mergeattr(gdc.error_y,'type','ye_type','percent');
            mergeattr(gdc.error_y,'value','ye_val',10);
            mergeattr(gdc.error_y,'traceref','ye_tref',0);
            mergeattr(gdc.error_y,'color','ye_clr',t.ye_clr|| dc);
            mergeattr(gdc.error_y,'thickness','ye_tkns',1);
            mergeattr(gdc.error_y,'width','ye_w',4);
            mergeattr(gdc.error_y,'opacity','ye_op',1);
        }
        if(['scatter','box'].indexOf(type)!=-1){
            mergeattr(gdc.line,'color','lc',gdc.marker.color || dc);
            mergeattr(gdc.line,'width','lw',2);
            mergeattr(gdc.marker,'symbol','mx','circle');
            mergeattr(gdc.marker,'opacity','mo',1);
            mergeattr(gdc.marker,'size','ms',6);
            mergeattr(gdc.marker,'color','mc',t.lc);
            mergeattr(gdc.marker.line,'color','mlc',((t.lc!=t.mc) ? t.lc : '#000'));
            mergeattr(gdc.marker.line,'width','mlw',0);
            mergeattr(gdc,'fill','fill','none');
            mergeattr(gdc,'fillcolor','fc',addOpacity(t.lc,0.5));
            if(type==='scatter') {
                var defaultMode = 'lines';
                if(cd.length<PTS_LINESONLY || (typeof gdc.mode != 'undefined')) {
                    defaultMode = 'lines+markers';
                }
                else { // check whether there are orphan points, then show markers regardless of length
                    for(var i=0; i<cd.length; i++) {
                        if($.isNumeric(cd[i].x) && $.isNumeric(cd[i].y) &&
                          (i==0 || !$.isNumeric(cd[i-1].x) || !$.isNumeric(cd[i-1].y)) &&
                          (i==cd.length-1 || !$.isNumeric(cd[i+1].x) || !$.isNumeric(cd[i+1].y))) {
                            defaultMode = 'lines+markers';
                            break;
                        }
                    }
                }
                mergeattr(gdc,'mode','mode',defaultMode);
                mergeattr(gdc.line,'dash','ld','solid');
            }
            else if(type==='box') {
                mergeattr(gdc.marker,'outliercolor','soc','rgba(0,0,0,0)');
                mergeattr(gdc.marker.line,'outliercolor','solc',t.mc);
                mergeattr(gdc.marker.line,'outlierwidth','solw',1);
                mergeattr(gdc,'whiskerwidth','ww',0.5);
                mergeattr(gdc,'boxpoints','boxpts','outliers');
                mergeattr(gdc,'boxmean','mean',false);
                mergeattr(gdc,'jitter','jitter',0);
                mergeattr(gdc,'pointpos','ptpos',0);
            }
        }
        else if(HEATMAPTYPES.indexOf(type)!=-1){
            if(type==='histogram2d') {
                mergeattr(gdc,'histnorm','histnorm','count');
                mergeattr(gdc,'autobinx','autobinx',true);
                mergeattr(gdc,'nbinsx','nbinsx',0);
                mergeattr(gdc.xbins,'start','xbstart',0);
                mergeattr(gdc.xbins,'end','xbend',1);
                mergeattr(gdc.xbins,'size','xbsize',1);
                mergeattr(gdc,'autobiny','autobiny',true);
                mergeattr(gdc,'nbinsy','nbinsy',0);
                mergeattr(gdc.ybins,'start','ybstart',0);
                mergeattr(gdc.ybins,'end','ybend',1);
                mergeattr(gdc.ybins,'size','ybsize',1);
            }
            mergeattr(gdc,'type','type','heatmap');
            mergeattr(gdc,'visible','visible',true);
            mergeattr(gdc,'x0','x0',0);
            mergeattr(gdc,'dx','dx',1);
            mergeattr(gdc,'y0','y0',0);
            mergeattr(gdc,'dy','dy',1);
            mergeattr(gdc,'zauto','zauto',true);
            mergeattr(gdc,'zmin','zmin',-10);
            mergeattr(gdc,'zmax','zmax',10);
            mergeattr(gdc, 'scl', 'scl', defaultScale,true);



        }
        else if(BARTYPES.indexOf(type)!=-1){
            if(type!='bar') {
                mergeattr(gdc,'histnorm','histnorm','count');
                mergeattr(gdc,'autobinx','autobinx',true);
                mergeattr(gdc,'nbinsx','nbinsx',0);
                mergeattr(gdc.xbins,'start','xbstart',0);
                mergeattr(gdc.xbins,'end','xbend',1);
                mergeattr(gdc.xbins,'size','xbsize',1);
            }
            mergeattr(gdc,'bardir','bardir','v');
            mergeattr(gdc,'opacity','op',1);
            mergeattr(gdc.marker,'opacity','mo',1);
            mergeattr(gdc.marker,'color','mc',dc);
            mergeattr(gdc.marker.line,'color','mlc','#000');
            mergeattr(gdc.marker.line,'width','mlw',0);
        }
    }
    plotlylog('+++++++++++++++OUT: setStyles(gd)+++++++++++++++');

}

function applyStyle(gd) {
    var gp = gd.plot;
    plotlylog('+++++++++++++++IN: applyStyle(gd)+++++++++++++++');
    plotlylog('gp = ', gp);
    gp.selectAll('g.trace')
        .call(traceStyle,gd);
    gp.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path,rect').call(pointStyle,d.t||d[0].t);
        });

    gp.selectAll('g.trace polyline.line')
        .call(lineGroupStyle);

    gp.selectAll('g.trace polyline.fill')
        .call(fillGroupStyle);

    gp.selectAll('g.boxes')
        .each(function(d){
            d3.select(this).selectAll('path.box').call(boxPlotStyle,d[0].t);
            d3.select(this).selectAll('path.mean').call(boxMeanStyle,d[0].t);
        });

    gp.selectAll('g.errorbars')
        .call(errorbarStyle);

    plotlylog('+++++++++++++++OUT: applyStyle(gd)+++++++++++++++');

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

function translatePoints(s,xa,ya){
    s.each(function(d){
        var x = xa.c2p(d.x), y = ya.c2p(d.y);
        if($.isNumeric(x) && $.isNumeric(y)) {
            d3.select(this).attr('transform','translate('+x+','+y+')');
        }
        else { d3.select(this).remove() }
    });
}

function traceStyle(s,gd) {
    var barcount = 0,
        gl = gd.layout;
    s.style('opacity',function(d){return d[0].t.op})
    // first see if there would be bars to stack)
    .each(function(d){ if(BARTYPES.indexOf(d[0].t.type)!=-1) { barcount++ } })
    // for gapless (either stacked or neighboring grouped) bars use crispEdges
    // to turn off antialiasing so an artificial gap isn't introduced.
    .each(function(d){
        if(BARTYPES.indexOf(d[0].t.type)!=-1 &&
          ((gl.barmode=='stack' && barcount>1) ||
          (gl.bargap==0 && gl.bargroupgap==0 && !d[0].t.mlw))){
            d3.select(this).attr('shape-rendering','crispEdges');
        }
    });
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
            gd = $(shape.node()).parents('.ui-tabs-panel, #embedded_graph')[0];
        try { shape.call(fillColor,gd.calcdata[shape.attr('data-curve')][0].t.fc) }
        catch(e) {
            try { shape.call(fillColor,d[0].t.fc) }
            catch(e) { shape.remove() }
        }
    });
}

function boxPlotStyle(s,t) {
    s.attr('stroke-width',t.lw)
    .call(strokeColor,t.lc)
    .call(fillColor,t.fc);
}

function boxMeanStyle(s,t) {
    s.attr('stroke-width',t.lw)
    .attr('stroke-dasharray',(2*t.lw)+','+(t.lw))
    .call(strokeColor,t.lc);
}

// apply the marker to each point
// draws the marker with diameter roughly markersize, centered at 0,0
function pointStyle(s,t) {
    // only scatter & box plots get marker path and opacity - bars, histograms don't
    if(['scatter','box'].indexOf(t.type)!=-1) {
        s.attr('d',function(d){
            var r=((d.ms+1 || t.ms+1 || (d.t ? d.t.ms : 0)+1)-1)/2;
            if(!(r>=0)) r=3; // in case of "various" etc... set a visible default
            var rt=String(r*2/Math.sqrt(3)),
                rc=String(r/3),
                rd=String(r*Math.sqrt(2)),
                r2=String(r/2);
            r=String(r);
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
        var a = (d.so) ? 'so' : 'm', // suggested outliers, for box plots
            lw = a+'lw', c = a+'c', lc = a+'lc',
            w = (d[lw]+1 || t[lw]+1 || (d.t ? d.t[lw] : 0)+1) - 1,
            p = d3.select(this);
        p.attr('stroke-width',w)
            .call(fillColor, d[c] || t[c] || (d.t ? d.t[c] : ''));
        if(w) { p.call(strokeColor, d[lc] || t[lc] || (d.t ? d.t[lc] : '')) }
    });
}

// -----------------------------------------------------
// styling functions for traces in legends.
// same functions for styling traces in the style box
// -----------------------------------------------------

function legendLines(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(d[0].t.type)==-1) { return }
    if(t.fill && t.fill!='none' && $.isNumeric(t.cdcurve)) {
        d3.select(this).append('path')
            .attr('data-curve',t.cdcurve)
            .attr('d','M5,0h30v6h-30z')
            .call(fillGroupStyle);
    }
    if(!t.mode || t.mode.indexOf('lines')==-1) { return }
    d3.select(this).append('polyline')
        .call(lineGroupStyle)
        .attr('points','5,0 35,0');

}

function legendPoints(d){
    var t = d[0].t;
    if(['scatter',undefined].indexOf(t.type)==-1) { return }
    if(!t.mode || t.mode.indexOf('markers')==-1) { return }
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
    if(BARTYPES.indexOf(t.type)==-1) { return }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z')
        .each(function(d){
            var w = (d.mlw+1 || t.mlw+1 || (d.t ? d.t.mlw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(fillColor,d.mc || t.mc || (d.t ? d.t.mc : ''));
            if(w) { p.call(strokeColor,d.mlc || t.mlc || (d.t ? d.t.mlc : '')) }
        })
        .attr('transform','translate(20,0)');
}

function legendBoxes(d){
    var t = d[0].t;
    if(t.type!=='box') { return }
    d3.select(this).append('g')
        .attr('class','legendpoints')
      .selectAll('path')
        .data(function(d){return d})
      .enter().append('path')
        .attr('d','M6,6H-6V-6H6Z') // if we want the median bar, prepend M6,0H-6
        .each(function(d){
            var w = (d.lw+1 || t.lw+1 || (d.t ? d.t.lw : 0)+1) - 1,
                p = d3.select(this);
            p.attr('stroke-width',w)
                .call(fillColor,d.fc || t.fc || (d.t ? d.t.fc : ''));
            if(w) { p.call(strokeColor,d.lc || t.lc || (d.t ? d.t.lc : '')) }
        })
        .attr('transform','translate(20,0)');
}

function legendText(s,gd){
    var gf = gd.layout.font, lf = gd.layout.legend.font;
    // note: uses d[1] for the original trace number, in case of hidden traces
    return s.append('text')
        .attr('class',function(d){ return 'legendtext text-'+d[1] })
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
// astr can also be an object {astr1:val1, astr2:val2...} in which case val is
// ignored but must be present if you want trace control.
// val (or val1, val2...) can be an array, to apply different values to each trace
// if the array is too short, it will wrap around (useful for style files that want
// to specify cyclical default values)
function restyle(gd,astr,val,traces) {
    plotlylog('+++++++++++++++IN: restyle+++++++++++++++');

    gd.changed = true;
    var gl = gd.layout,
        aobj = {};
    if(typeof astr == 'string') { aobj[astr] = val }
    else if($.isPlainObject(astr)) { aobj = astr }
    else { console.log('restyle fail',astr,val,traces); return }

    if($.isNumeric(traces)) { traces=[traces] }
    else if(!$.isArray(traces) || !traces.length) {
        traces=gd.data.map(function(v,i){return i});
    }

    // need to replot (not just restyle) if mode or visibility changes, because
    // the right objects don't exist. Also heatmaps, error bars, histos, and
    // boxes all make some changes that need a replot
    // TODO: many of these don't need to redo calcdata, should split that out too
    // (though first check how much of our time is spent there...)
    // and in principle we generally shouldn't need to redo ALL traces... that's
    // harder though.
    var replot_attr=[
        'mode','visible','type','bardir','fill','histnorm',
        'mincolor','maxcolor','scale','x0','dx','y0','dy','zmin','zmax','zauto','scl',
        'error_y.visible','error_y.value','error_y.type','error_y.traceref','error_y.array','error_y.width',
        'autobinx','nbinsx','xbins.start','xbins.end','xbins.size',
        'autobiny','nbinsy','ybins.start','ybins.end','ybins.size',
        'boxpoints','jitter','pointpos','whiskerwidth','boxmean'
    ];
    // these ones show up in restyle because they make more sense in the style
    // box, but they're graph-wide attributes, so set in gd.layout
    // also axis scales and range show up here because we may need to undo them
    var layout_attr = [
        'barmode','bargap','bargroupgap','boxmode','boxgap','boxgroupgap',
        'xaxis.autorange','yaxis.autorange','xaxis.range','yaxis.range'
    ];
    // these ones may alter the axis type (at least if the first trace is involved)
    var axtype_attr = ['type','x','y','x0','y0','bardir'];
    // flags for which kind of update we need to do
    var doplot = false,
        dolayout = false,
        doapplystyle = false;
    // copies of the change (and previous values of anything affected) for the
    // undo / redo queue
    var redoit = {},
        undoit = {};

    // make a new empty vals array for undoit
    function a0(){return traces.map(function(){return undefined})}

    // for attrs that interact (like scales & autoscales), save the
    // old vals before making the change
    // val=undefined will not set a value, just record what the value was.
    // attr can be an array to set several at once (all to the same val)
    function doextra(cont,attr,val,i) {
        if($.isArray(attr)) {
            attr.forEach(function(a){ doextra(cont,a,val,i) });
            return;
        }
        if(attr in aobj) { return } // quit if explicitly setting this elsewhere
        var p = nestedProperty(cont,attr);
        if(!(attr in undoit)) { undoit[attr] = a0() }
        if(undoit[attr][i]===undefined) { undoit[attr][i]=p.get() }
        if(val!==undefined) { p.set(val) }
    }
    var zscl = ['zmin','zmax'],
        xbins = ['xbins.start','xbins.end','xbins.size'],
        ybins = ['xbins.start','xbins.end','xbins.size'];

    // now make the changes to gd.data (and occasionally gd.layout)
    // and figure out what kind of graphics update we need to do
    for(var ai in aobj) {
        var vi = aobj[ai];
        redoit[ai] = vi;

        if(layout_attr.indexOf(ai)!=-1){
            var p = nestedProperty(gl,ai);
            undoit[ai] = [p.get()];
            // since we're allowing val to be an array, allow it here too,
            // even though that's meaningless
            p.set($.isArray(vi) ? vi[0] : vi);
            // ironically, the layout attrs in restyle only require replot,
            // not relayout
            doplot = true;
            continue;
        }

        // set attribute in gd.data
        undoit[ai] = a0();
        for(i=0; i<traces.length; i++) {
            var cont=gd.data[traces[i]],
                p = nestedProperty(cont,ai);

            // setting bin or z settings should turn off auto
            // and setting auto should save bin or z settings
            if(zscl.indexOf(ai)!=-1) { doextra(cont,'zauto',false,i) }
            else if(ai=='zauto') { doextra(cont,zscl,undefined,i) }
            else if(xbins.indexOf(ai)!=-1) { doextra(cont,'autobinx',false,i) }
            else if(ai=='autobinx') { doextra(cont,xbins,undefined,i) }
            else if(ybins.indexOf(ai)!=-1) { doextra(cont,'autobiny',false,i) }
            else if(ai=='autobiny') { doextra(cont,ybins,undefined,i) }

            // save the old value
            undoit[ai][i] = p.get();
            // set the new value - if val is an array, it's one el per trace
            p.set($.isArray(vi) ? vi[i%vi.length] : vi);
        }

        // check if we need to call axis type
        if((traces.indexOf(0)!=-1) && (axtype_attr.indexOf(ai)!=-1)) {
            gd.axtypesok=false;
            doplot = true;
        }

        // switching from auto to manual binning or z scaling doesn't actually
        // do anything but change what you see in the styling box. everything
        // else at least needs to apply styles
        if((['autobinx','autobiny','zauto'].indexOf(ai)==-1) || vi!==false) {
            doapplystyle = true;
        }

        if(replot_attr.indexOf(ai)!=-1) {
            // major enough changes deserve autoscale, autobin, and non-reversed
            // axes so people don't get confused
            if(['bardir','type'].indexOf(ai)!=-1) {
                doextra(gl,['xaxis.autorange','yaxis.autorange'],true,0);
                doextra(gl,['xaxis.range','yaxis.range'],[0,1],0);
                if(astr=='type') {
                    for(i=0; i<traces.length; i++) {
                        doextra(gd.data[traces[i]],['autobinx','autobiny'],true,i);
                    }
                }
            }
            // if we need to change margin for a heatmap, force a relayout first so we don't plot twice
            if(Heatmap.margin(gd)) { dolayout = true }
            else { doplot = true }
        }
    }
    // now all attribute mods are done, as are redo and undo so we can save them
    plotUndoQueue(gd,undoit,redoit,traces);

    // now update the graphics
    // a complete layout redraw takes care of plot and
    if(dolayout) {
        gd.layout = undefined;
        plot(gd,'',gl);
    }
    else if(doplot) { plot(gd) }
    else {
        setStyles(gd);
        if(doapplystyle) {
            applyStyle(gd);
            if(gl.showlegend) { legend(gd) }
        }
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
    if(typeof astr == 'string') { aobj[astr] = val }
    else if($.isPlainObject(astr)) { aobj = astr }
    else { console.log('relayout fail',astr,val); return }

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

    // copies of the change (and previous values of anything affected) for the
    // undo / redo queue
    var redoit = {},
        undoit = {};

    // for attrs that interact (like scales & autoscales), save the
    // old vals before making the change
    // val=undefined will not set a value, just record what the value was.
    // attr can be an array to set several at once (all to the same val)
    function doextra(attr,val) {
        if($.isArray(attr)) {
            attr.forEach(function(a){ doextra(a,val) });
            return;
        }
        if(attr in aobj) { return } // quit if explicitly setting this elsewhere
        var p = nestedProperty(gl,attr);
        if(!(attr in undoit)) { undoit[attr]=p.get() }
        if(val!==undefined) { p.set(val) }
    }

    var hw = ['height','width'];

    // alter gd.layout
    for(var ai in aobj) {
        var p = nestedProperty(gl,ai),
            aa = propSplit(ai),
            vi = aobj[ai];
        redoit[ai] = aobj[ai];
        // axis reverse is special - it is its own inverse op and has no flag.
        undoit[ai] = (aa[1]=='reverse') ? aobj[ai] : p.get();

        // check autosize or autorange vs size and range
        if(hw.indexOf(ai)!=-1) { doextra('autosize', false) }
        else if(ai=='autosize') { doextra(hw, undefined) }
        var m = ai.match(/^(.)axis\.range\[[0|1]\]$/);
        if(m && m.length==2) { doextra(aa[0]+'.autorange', false) }
        m = ai.match(/^(.)axis\.autorange$/);
        if(m && m.length==2) { doextra([aa[0]+'.range[0]',aa[0]+'.range[1]'], undefined) }

        // toggling log without autorange: need to also recalculate ranges
        // logical XOR (ie will islog actually change)
        if(aa[1]=='type' && !gl[aa[0]].autorange && (gl[aa[0]].type=='log' ? vi!='log' : vi=='log')) {
            var ax = gl[aa[0]],
                r0 = ax.range[0],
                r1 = ax.range[1];
            if(vi=='log') {
                // if both limits are negative, autorange
                if(r0<0 && r1<0) { doextra(aa[0]+'.autorange',true); continue }
                // if one is negative, set it to one millionth the other. TODO: find the smallest positive val?
                else if(r0<0) r0 = r1/1e6;
                else if(r1<0) r1 = r0/1e6;
                // now set the range values as appropriate
                doextra(aa[0]+'.range[0]', Math.log(r0)/Math.LN10);
                doextra(aa[0]+'.range[1]', Math.log(r1)/Math.LN10);
            }
            else {
                doextra(aa[0]+'.range[0]', Math.pow(10, r0));
                doextra(aa[0]+'.range[1]', Math.pow(10, r1));
            }
        }

        // handle axis reversal explicitly, as there's no 'reverse' flag
        if(aa[1]=='reverse') {
            gl[aa[0]].range.reverse();
            doplot=true;
        }
        // send annotation mods one-by-one through annotation(), don't set via nestedProperty
        else if(aa[0]=='annotations') {
            // if aa is just an annotation number, and val is either 'add' or
            // an entire annotation obj to add, the undo is 'remove'
            // if val is 'remove' then undo is the whole annotation object
            if(aa.length==2) {
                if(aobj[ai]=='add' || $.isPlainObject(aobj[ai])) { undoit[ai]='remove' }
                else if(aobj[ai]=='remove') { undoit[ai]=gl.annotations[aa[1]] }
                else { console.log('???') }
            }
            annotation(gd,aa[1],aa.slice(2).join('.'),aobj[ai]); // ai.replace(/^annotations\[-?[0-9]*\][.]/,'')
            delete aobj[ai];
        }
        // alter gd.layout
        else {
            // check whether we can short-circuit a full redraw
            if(aa[0].indexOf('legend')!=-1) { dolegend = true }
            else if(ai.indexOf('title')!=-1) { doticks = true }
            else if(aa[0].indexOf('bgcolor')!=-1) { dolayoutstyle = true }
            else if(aa.length>1 && (
                aa[1].indexOf('tick')!=-1 ||
                aa[1].indexOf('exponent')!=-1 ||
                aa[1].indexOf('grid')!=-1 ||
                aa[1].indexOf('zeroline')!=-1)) { doticks = true }
            else if(aa.length>1 && (
                aa[1].indexOf('line')!=-1 ||
                aa[1].indexOf('mirror')!=-1)) { dolayoutstyle = true }
            else if(ai=='margin.pad') { doticks = dolayoutstyle = true }
            // hovermode and dragmode don't need any redrawing, since they just
            // affect reaction to user input
            else if(['hovermode','dragmode'].indexOf(ai)==-1) { doplot = true }
            p.set(vi);
        }
    }
    // now all attribute mods are done, as are redo and undo so we can save them
    plotUndoQueue(gd,undoit,redoit,'relayout');

    // calculate autosizing - if size hasn't changed, will remove h&w so we don't need to redraw
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
        if(dolayoutstyle) { layoutStyles(gd) }
        if(doticks) { Axes.doTicks(gd,'redraw'); makeTitles(gd,'gtitle') }
    }
    plotlylog('+++++++++++++++ OUT: RELAYOUT +++++++++++++++');
}

// convert a string s (such as 'xaxis.range[0]')
// representing a property of nested object o into set and get methods
// also return the string and object so we don't have to keep track of them
function nestedProperty(o,s) {
    var cont = o,
        aa = propSplit(s);
    for(var j=0; j<aa.length-1; j++) {
        // make the heirarchy if it doesn't exist
        if(!(aa[j] in cont)) {
            cont[aa[j]] = (typeof aa[j+1]==='string') ? {} : [];
        }
        cont = cont[aa[j]]
    }
    var prop = aa[j];

    return {set:function(v){
                if(v===undefined || v===null) { delete cont[prop] }
                else { cont[prop]=v }
            },
            get:function(){ return cont[prop] },
            astr:s,
            obj:o};
}

function propSplit(s) {
    var aa = s.split('.');
    for(var j=0; j<aa.length; j++) {
        var indexed = String(aa[j]).match(/([^\[\]]*)\[([0-9]*)\]/);
        if(indexed) { aa.splice(j,1,indexed[1],Number(indexed[2])) }
    }
    return aa;
}

// manage the undo/redo queue
// directs the op to restyle unless traces=='relayout'
// undoit and redoit are attr->val objects to pass to restyle or relayout
// TODO: disable/enable undo and redo buttons appropriately
function plotUndoQueue(gd,undoit,redoit,traces) {
    if(!gd.mainsite) { user=''; userobj = {clientoffset:0} }
    // make sure we have the queue and our position in it
    if(!$.isArray(gd.undoqueue) || !$.isNumeric(gd.undonum)) {
        gd.undoqueue=[];
        gd.undonum=0;
    }
    // if we're already playing an undo or redo, or if this is an auto operation
    // (like pane resize... any others?) then we don't save this to the undo queue
    if(gd.autoplay) {
        gd.autoplay = false;
        return;
    }
    // if we are adding a new item, splice it in so that if there are previously
    // undone actions after our current position, they get chopped off the queue
    // in addition to the actions themselves, save the user who did it, and the
    // timestamp, adjusted to server time
    gd.undoqueue.splice(gd.undonum,gd.undoqueue.length-gd.undonum, {
        undo: undoit,
        redo: redoit,
        traces: traces,
        user: user,
        ts: ms2DateTime(new Date().getTime()-userobj.clientoffset).substr(0,19)
    });
    gd.undonum++;
}

function plotUndo(gd) {
    if(!gd) { gd = gettab() }
    if(!$.isNumeric(gd.undonum) || gd.undonum<=0) { return }
    gd.undonum--;
    var i = gd.undoqueue[gd.undonum];
    plotDo(gd, i.undo, i.traces);
}

function plotRedo(gd) {
    if(!gd) { gd = gettab() }
    if(!$.isNumeric(gd.undonum) || gd.undonum>=gd.undoqueue.length) { return }
    var i = gd.undoqueue[gd.undonum];
    gd.undonum++;
    plotDo(gd, i.redo, i.traces);
}

function plotDo(gd,aobj,traces) {
    gd.autoplay = true;
    ao2 = {}
    for(ai in aobj) { ao2[ai] = aobj[ai] } // copy aobj so we don't modify the one in the queue
    if(traces=='relayout') { relayout(gd, ao2) }
    else { restyle(gd, ao2, null, traces) }
    // do we need to update a popover?
    var po = $('.popover');
    if(po.length) { po[0].redraw(po[0].selectedObj) }
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
        newModeBar(gd);
    }
    return aobj
}

// check whether to resize a tab (if it's a plot) to the container
function plotResize(gd) {
    killPopovers();
    if(gd && gd.tabtype=='plot' && $(gd).css('display')!='none') {
        $(gd).find('.modebar').remove();
        if(gd.redrawTimer) { clearTimeout(gd.redrawTimer) }
        gd.redrawTimer = setTimeout(function(){
            if($(gd).css('display')=='none') { return }
            if(gd.layout && gd.layout.autosize) {
                gd.autoplay = true; // don't include this relayout in the undo queue
                relayout(gd, {autosize:true});
            }
            else { newModeBar(gd) }

            if(LIT) {
                hidebox();
                litebox();
            }
        }, 100);
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
    if(gd.mainsite ? ($(gd).children('.graphbar').length==1 &&
            $(gd).children('.demobar').length==1 &&
            $(gd).children('svg').length==1 &&
            $(gd).children().length>=3) : /* 4th child is graph tips alert div, then modebar... */
        ($(gd).children('svg').length==1)
        ) { $(gd).children('svg').remove() }
    else { // not the right children (probably none, but in case something goes wrong redraw all)
        gd.innerHTML='';
        if(gd.mainsite) graphbar(gd);
    }

    // Get the layout info - take the default and update it with layout arg
    gd.layout=updateObject(defaultLayout(),layout);

    var gl=gd.layout, gd3=d3.select(gd), xa=gl.xaxis, ya=gl.yaxis;
    Axes.setTypes(gd);

    // initial autosize
    if(gl.autosize=='initial') {
        gd.paper=gd3.append('svg')
            .attr('width',gl.width)
            .attr('height',gl.height);
        plotAutoSize(gd,{});
        gd.paper.remove();
        gl.autosize=true;
    }

    // Make the graph containers
    gd.paper = gd3.append('svg')
    gd.paperbg = gd.paper.append('rect')
        .style('fill','none')
    gd.plotbg = gd.paper.append('rect')
        .attr('stroke-width',0);
    gd.axlines = {
        x:gd.paper.append('path').style('fill','none'),
        y:gd.paper.append('path').style('fill','none')
    }
    gd.axislayer = gd.paper.append('g').attr('class','axislayer');
    // Second svg (plot) is for the data
    gd.plot = gd.paper.append('svg')
        .attr('preserveAspectRatio','none')
        .style('fill','none');
    gd.infolayer = gd.paper.append('g').attr('class','infolayer');
    gd.hoverlayer = gd.paper.append('g').attr('class','hoverlayer');

    // position and style the containers, make main title
    layoutStyles(gd);

    // make the ticks, grids, and axis titles
    Axes.doTicks(gd);
    xa._r = xa.range.slice(); // store ranges for later use
    ya._r = ya.range.slice();

    //make the axis drag objects
    var gm = gd.margin,
        x1 = gm.l,
        x2 = x1+gd.plotwidth,
        tickedge = $(gd).find('text.ytick').get().map(function(e){return e.getBBox().x}),
        x0 = tickedge.length ? Math.min.apply(tickedge,tickedge) : x1-10,
        y2 = gm.t,
        y1 = y2+gd.plotheight,
        tickedge = $(gd).find('text.xtick').get().map(function(e){var bb=e.getBBox(); return bb.y+bb.height}),
        y0 = tickedge.length ? Math.max.apply(tickedge,tickedge) : y1+10;

    // main dragger goes over the grids and data, so we use its
    // mousemove events for all data hover effects
    var maindrag = dragBox(gd, x1, y2, x2-x1, y1-y2,'ns','ew');
    $(maindrag)
        .mousemove(function(evt){ plotHover(evt,gd,maindrag) })
        .mouseout(function(){ plotUnhover(gd) });

    // x axis draggers
    dragBox(gd, x1*0.9+x2*0.1, y1,(x2-x1)*0.8, y0-y1,'','ew');
    dragBox(gd, x1, y1, (x2-x1)*0.1, y0-y1,'','w');
    dragBox(gd, x1*0.1+x2*0.9, y1, (x2-x1)*0.1, y0-y1,'','e');
    // y axis draggers
    dragBox(gd, x0, y2*0.9+y1*0.1, x1-x0, (y1-y2)*0.8,'ns','');
    dragBox(gd, x0, y1*0.9+y2*0.1, x1-x0, (y1-y2)*0.1,'s','');
    dragBox(gd, x0, y2, x1-x0, (y1-y2)*0.1,'n','');
    // corner draggers
    dragBox(gd, x0, y2+y1-y0, x1-x0, y0-y1,'n','w');
    dragBox(gd, x2, y2+y1-y0, x1-x0, y0-y1,'n','e');
    dragBox(gd, x0, y1, x1-x0, y0-y1,'s','w');
    dragBox(gd, x2, y1, x1-x0, y0-y1,'s','e');

    newModeBar(gd);
}

// layoutStyles: styling for plot layout elements
// this is separate from newPlot, so we don't have to redraw to edit colors etc.
function layoutStyles(gd) {
    var gl = gd.layout, xa = gl.xaxis, ya = gl.yaxis;

    Heatmap.margin(gd); // check for heatmaps w/ colorscales, adjust margin accordingly

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

    gd.paper
        .call(setSize, gl.width, gl.height);
    gd.paperbg
        .call(setRect, 0, 0, gl.width, gl.height);
    d3.select(gd)
        .style('background', gl.paper_bgcolor);
    gd.plotbg
        .call(setRect, gm.l-gm.p, gm.t-gm.p, gd.plotwidth+2*gm.p, gd.plotheight+2*gm.p)
        .call(fillColor, gl.plot_bgcolor);
    gd.plot
        .call(setRect, gm.l, gm.t, gd.plotwidth, gd.plotheight);

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
    makeTitles(gd,'gtitle');
}

// ----------------------------------------------------
// Titles and text inputs
// ----------------------------------------------------

// makeTitles - (re)draw titles on the axes and plot
// title can be 'xtitle', 'ytitle', 'gtitle',
//  or '' to draw all
function makeTitles(gd,title) {
    var gl=gd.layout,gm=gd.margin;
    var titles={
        'xtitle':{
            x: (gl.width+gm.l-gm.r)/2,
            y: gl.height+(gd.lh<0 ? gd.lh : 0) - 14*2.25,
            w: gd.plotwidth/2, h: 14,
            cont: gl.xaxis,
            name: 'X axis',
            font: gl.xaxis.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.xaxis.titlefont.size || (gl.font.size*1.2) || 14,
            fontColor: gl.xaxis.titlefont.color || gl.font.color || '#000',
            transform: '',
            attr: {}
        },
        'ytitle':{
            x: 40-(gd.lw<0 ? gd.lw : 0),
            y: (gl.height+gm.t-gm.b)/2,
            w: 14, h: gd.plotheight/2,
            cont: gl.yaxis,
            name: 'Y axis',
            font: gl.yaxis.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.yaxis.titlefont.size || (gl.font.size*1.2) || 14,
            fontColor: gl.yaxis.titlefont.color || gl.font.color || '#000',
            transform: 'rotate(-90,x,y)',
            attr: {center: 0}
        },
        'gtitle':{
            x: gl.width/2, y: gl.margin.t/2,
            w: gl.width/2, h: 16,
            cont: gl,
            name: 'Plot',
            font: gl.titlefont.family || gl.font.family || 'Arial',
            fontSize: gl.titlefont.size || gl.font.size*1.4 || 16,
            fontColor: gl.titlefont.color || gl.font.color || '#000',
            transform: '',
            attr: {}
        }
    }

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
            // don't allow editing on embedded graphs
            if(gd.mainsite) { el.on('click',function(){autoGrowInput(this)}) }

            var txt=t.cont.title;
            if(txt.match(/^Click to enter (Plot|X axis|Y axis) title$/)) {
                if(gd.mainsite) { el.style('fill','#999') } // cues in gray
                else { txt='' } // don't show cues in embedded plots
            }

            if(txt) {
                el.each(function(){styleText(this,txt+ (!t.cont.unit ? '' : (' ('+t.cont.unit+')')))});
            }
            else if(gd.mainsite) {
                el.text('Click to enter '+t.name+' title')
                    .style('opacity',1)
                    .on('mouseover',function(){d3.select(this).transition().duration(100).style('opacity',1);})
                    .on('mouseout',function(){d3.select(this).transition().duration(1000).style('opacity',0);})
                  .transition()
                    .duration(2000)
                    .style('opacity',0);
            }
            else { el.remove() }

            // move labels out of the way, if possible, when tick labels interfere
            var titlebb=el[0][0].getBoundingClientRect(), gdbb=gd.paper.node().getBoundingClientRect();
            if(k=='xtitle'){
                var labels=gd.paper.selectAll('text.xtick')[0], ticky=0;
                for(var i=0;i<labels.length;i++){
                    var lbb=labels[i].getBoundingClientRect();
                    if(bBoxIntersect(titlebb,lbb)) {
                        ticky=constrain(ticky,lbb.bottom,gdbb.bottom-titlebb.height);
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
                    if(bBoxIntersect(titlebb,lbb)) {
                        tickx=constrain(tickx,gdbb.left+titlebb.width,lbb.left);
                    }
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
        .call(traceStyle,gd)
        .each(legendBars)
        .each(legendBoxes)
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
    if(gd.mainsite) { gd.legend.node().onmousedown = function(e) {
        if(dragClear(gd)) { return true } // deal with other UI elements, and allow them to cancel dragging

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
            if(e2.clientX>pbb.right-3*MINDRAG || (gd.lw>0 && dx>-MINDRAG)) { xf=100 }
            else if(e2.clientX<pbb.left+3*MINDRAG || (gd.lw<0 && dx<MINDRAG)) { xf=-100 }
            else { xf = dragAlign(x0+dx,legendwidth,gdm.l,gl.width-gdm.r) }

            if(e2.clientY>pbb.bottom-3*MINDRAG || (gd.lh<0 && dy>-MINDRAG)) { yf=-100 }
            else if(e2.clientY<pbb.top+3*MINDRAG || (gd.lh>0 && dy<MINDRAG)) { yf=100 }
            else { yf = 1-dragAlign(y0+dy,legendheight,gdm.t,gl.height-gdm.b) }

            var csr = dragCursors(xf,yf);
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
    } }
}

// -----------------------------------------------------
// make or edit an annotation on the graph
// -----------------------------------------------------

// annotations are stored in gd.layout.annotations, an array of objects
// index can point to one item in this array,
//  or non-numeric to simply add a new one
//  or -1 to modify all existing
// opt can be the full options object, or one key (to be set to value)
//  or undefined to simply redraw
// if opt is blank, val can be 'add' or a full options object to add a new
//  annotation at that point in the array, or 'remove' to delete this annotation
function annotation(gd,index,opt,value) {
    var gl = gd.layout,gm = gd.margin;
    if(!gl.annotations) { gl.annotations = [] }
    if(!$.isNumeric(index)) {
        index = gl.annotations.length;
        gl.annotations.push({});
    }
    else if(index==-1) {
        for(var i=0; i<gl.annotations.length; i++) { annotation(gd,i,opt,value) }
        return;
    }

    if(!opt && value) {
        if(value=='remove') {
            gd.paper.selectAll('.annotation[data-index="'+index+'"]').remove();
            gl.annotations.splice(index,1);
            for(var i=index; i<gl.annotations.length; i++) {
                gd.paper.selectAll('.annotation[data-index="'+(i+1)+'"]')
                    .attr('data-index',String(i));
                annotation(gd,i); // redraw all annotations past the removed, so they bind to the right events
            }
            return;
        }
        else if(value=='add' || $.isPlainObject(value)) {
            gl.annotations.splice(index,0,{});
            if($.isPlainObject(value)) { Object.keys(value).forEach(function(k){ gl.annotations[index][k] = value[k] }) }
            for(var i=gl.annotations.length-1; i>index; i--) {
                gd.paper.selectAll('.annotation[data-index="'+(i-1)+'"]')
                    .attr('data-index',String(i));
                annotation(gd,i);
            }
        }
    }

    // remove the existing annotation if there is one
    gd.paper.selectAll('.annotation[data-index="'+index+'"]').remove();

    // edit the options
    var options = gl.annotations[index];
    var oldref = options.ref,
        xa = gl.xaxis,
        ya = gl.yaxis,
        xr = xa.range[1]-xa.range[0],
        yr = ya.range[1]-ya.range[0];
    if(typeof opt == 'string' && opt) { nestedProperty(options,opt).set(value) }
    else if($.isPlainObject(opt)) { Object.keys(opt).forEach(function(k){ options[k] = opt[k] }) }

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
    if(!options.tag) { options.tag='' }
    if(!options.text) { options.text=((options.showarrow && (options.text=='')) ? '' : 'new text') }
    if(!options.font) { options.font={family:'',size:0,color:''} }

    // get the paper and plot bounding boxes before adding pieces that go off screen
    // firefox will include things that extend outside the original... can we avoid that?
    var paperbb = gd.paper.node().getBoundingClientRect(),
        plotbb = d3.select(gd).select('.nsewdrag').node().getBoundingClientRect(),
        x = plotbb.left-paperbb.left,
        y = plotbb.top-paperbb.top;

    // create the components
    var ann = gd.paper.append('svg')
        .attr('class','annotation')
        .attr('data-cmmt',options.tag)
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
        .attr('data-cmmt',options.tag)
        .call(setPosition,0,0)
        .attr('text-anchor',{left:'start', center:'middle', right:'end'}[options.align])
        .attr('font-size',options.font.size||gl.font.size||12)
        .attr('font-family',options.font.family||gl.font.family||'Arial')
        .style('fill',options.font.color||gl.font.color||'#000');
    styleText(anntext.node(),options.text);

    if(gd.mainsite) {
        anntext.on('click',function(){ if(!gd.dragged) { autoGrowInput(this) } });
    }

    var atbb = anntext.node().getBoundingClientRect(),
        annwidth = atbb.width,
        annheight = atbb.height;
    // save size in the annotation object for use by autoscale
    options._w = annwidth;
    options._h = annheight;

    // check for change between log and linear
    // off-scale transition to log: put the annotation near low end of the log
    // axis, but not quite at it (in case that would put it off screen)
    if(options.ref=='plot') {
        function checklog(v,oldtype,newtype,dflt) {
            if(oldtype=='log' && newtype!='log') { return Math.pow(10,v) }
            else if(oldtype!='log' && newtype=='log') {
                return (v>0) ? Math.log(v)/Math.LN10 : dflt;
            }
            else { return v }
        }
        options.x = checklog(options.x,options._xatype,xa.type,
            (xa.range[0]+xa.range[1]-Math.abs(xr*0.8))/2);
        options.y = checklog(options.y,options._yatype,ya.type,
            (ya.range[0]+ya.range[1]-Math.abs(yr*0.8))/2);
    }
    options._xatype=xa.type;
    options._yatype=ya.type;

    // check for change between paper and plot ref - need to wait for
    // annwidth/annheight to do this properly
    if(oldref && options.x && options.y) {
        var fshift = function(v){ return constrain(Math.floor(v*3-1),-.5,.5) }
        if(options.ref=='plot' && oldref=='paper') {
            if(options.showarrow) { var xshift = yshift = 0 }
            else {
                var xshift = fshift(options.x)*annwidth/xa._m,
                    yshift = fshift(options.y)*annheight/ya._m;
            }
            options.x = xa.range[0] + xr*options.x - xshift;
            options.y = ya.range[0] + yr*options.y + yshift;
        }
        else if(options.ref=='paper' && oldref=='plot') {
            options.x = (options.x-xa.range[0])/xr;
            options.y = (options.y-ya.range[0])/yr;
            if(!options.showarrow) {
                options.x += fshift(options.x)*annwidth/(xr*xa._m);
                options.y -= fshift(options.y)*annheight/(yr*ya._m);
            }
        }
    }
    if(!options.ax) { options.ax=-10 }
    if(!options.ay) { options.ay=-annheight/2-20 }
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
        if(!$.isNumeric(options.x)) { options.x=0.1 }
        if(!$.isNumeric(options.y)) { options.y=0.7 }
        x += plotbb.width*options.x;
        y += plotbb.height*(1-options.y);
        if(!options.showarrow){
            if(options.x>2/3) { x -= annwidth/2 }
            else if(options.x<1/3) { x += annwidth/2 }

            if(options.y<1/3) { y -= annheight/2 }
            else if(options.y>2/3) { y += annheight/2 }
        }
    }
    else {
        // hide the annotation if it's pointing outside the visible plot
        if((options.x-xa.range[0])*(options.x-xa.range[1])>0 ||
            (options.y-ya.range[0])*(options.y-ya.range[1])>0) {
            ann.remove();
            return;
        }
        if(!$.isNumeric(options.x)) { options.x=(xa.range[0]*0.9+xa.range[1]*0.1) }
        if(!$.isNumeric(options.y)) { options.y=(ya.range[0]*0.7+ya.range[1]*0.3) }
        x += xa._b+options.x*xa._m;
        y += ya._b+options.y*ya._m;
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
                if(p) {
                    ax0 = p.x;
                    ay0 = p.y;
                }
            });
        });
        if(showline) {
            var strokewidth = options.arrowwidth||borderwidth*2;
            var arrowgroup = gd.paper.append('g')
                .attr('class','annotation')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index));
            var arrow = arrowgroup.append('path')
                .attr('class','annotation')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index))
                .attr('d','M'+ax0+','+ay0+'L'+ax+','+ay)
                .attr('stroke-width',strokewidth)
                .call(strokeColor,options.arrowcolor || options.bordercolor || '#000');
            arrowhead(arrow,options.arrowhead,'end',options.arrowsize);
            var arrowdrag = arrowgroup.append('path')
                .attr('class','annotation anndrag')
                .attr('data-cmmt',options.tag)
                .attr('data-index',String(index))
                .attr('d','M3,3H-3V-3H3ZM0,0L'+(ax0-ax)+','+(ay0-ay))
                .attr('transform','translate('+ax+','+ay+')')
                .attr('stroke-width',strokewidth+6)
                .call(strokeColor,'rgba(0,0,0,0)')
                .call(fillColor,'rgba(0,0,0,0)');
            if(gd.mainsite) { arrowdrag.node().onmousedown = function(e) {
                if(dragClear(gd)) { return true } // deal with other UI elements, and allow them to cancel dragging

                var eln = this,
                    el3 = d3.select(this),
                    annx0 = Number(ann.attr('x')),
                    anny0 = Number(ann.attr('y')),
                    update = {},
                    ab = 'annotations['+index+'].';
                gd.dragged = false;
                window.onmousemove = function(e2) {
                    var dx = e2.clientX-e.clientX,
                        dy = e2.clientY-e.clientY;
                    if(Math.abs(dx)<MINDRAG) { dx=0 }
                    if(Math.abs(dy)<MINDRAG) { dy=0 }
                    if(dx||dy) {gd.dragged = true}
                    arrowgroup.attr('transform','translate('+dx+','+dy+')');
                    ann.call(setPosition, annx0+dx, anny0+dy);
                    if(options.ref=='paper') {
                        update[ab+'x'] = (ax+dx-gm.l)/(gl.width-gm.l-gm.r);
                        update[ab+'y'] = 1-((ay+dy-gm.t)/(gl.height-gm.t-gm.b));
                    }
                    else {
                        update[ab+'x'] = options.x+dx/gl.xaxis._m;
                        update[ab+'y'] = options.y+dy/gl.yaxis._m;
                    }
                    return pauseEvent(e2);
                }
                window.onmouseup = function(e2) {
                    window.onmousemove = null; window.onmouseup = null;
                    if(gd.dragged) { relayout(gd,update) }
                    return pauseEvent(e2);
                }
                return pauseEvent(e);
            }}
        }
    }
    if(options.showarrow) { drawArrow(0,0) }

    // user dragging the annotation (text, not arrow)
    if(gd.mainsite) { ann.node().onmousedown = function(e) {

        if(dragClear(gd)) return true; // deal with other UI elements, and allow them to cancel dragging

        var eln=this,
            el3=d3.select(this),
            x0=Number(el3.attr('x')),
            y0=Number(el3.attr('y')),
            update = {},
            ab = 'annotations['+index+'].';
        gd.dragged = false;
        window.onmousemove = function(e2) {
            var dx = e2.clientX-e.clientX,
                dy = e2.clientY-e.clientY;
            if(Math.abs(dx)<MINDRAG) { dx=0 }
            if(Math.abs(dy)<MINDRAG) { dy=0 }
            if(dx||dy) { gd.dragged = true }
            el3.call(setPosition, x0+dx, y0+dy);
            var csr='pointer';
            if(options.showarrow) {
                update[ab+'ax'] = options.ax+dx;
                update[ab+'ay'] = options.ay+dy;
                drawArrow(dx,dy);
            }
            else if(options.ref=='paper') {
                update[ab+'x'] = dragAlign(x0+dx+borderfull,annwidth,gm.l,gl.width-gm.r);
                update[ab+'y'] = 1-dragAlign(y0+dy+borderfull,annheight,gm.t,gl.height-gm.b);
                csr = dragCursors(update[ab+'x'],update[ab+'y']);
            }
            else {
                update[ab+'x'] = options.x+dx/gl.xaxis._m;
                update[ab+'y'] = options.y+dy/gl.yaxis._m;
            }
            $(eln).css('cursor',csr);
            return pauseEvent(e2);
        }
        window.onmouseup = function(e2) {
            window.onmousemove = null; window.onmouseup = null;
            $(eln).css('cursor','');
            if(gd.dragged) { relayout(gd,update) }
            return pauseEvent(e2);
        }
        return pauseEvent(e);
    }}
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
            .attr('data-cmmt',el3.attr('data-cmmt'))
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
    // if a dom element is passed in, add appropriate arrowheads to every arrowhead selector in the container
    if(container) {
        $(container).find('[data-arrowhead]').each(function(){
            arrowhead(d3.select(this).select('line'),Number($(this).attr('data-arrowhead')));
        });
        return;
    }
    // with no args, output an array of elements for the dropdown list
    return [1,2,3,4,5,6,7,8].map(function(i){
        return {
            val:i,
            name:'<svg width="40" height="20" data-arrowhead="'+i+'" style="position: relative; top: 2px;">'+
                '<line stroke="rgb(0,0,0)" style="fill: none;" x1="5" y1="10" x2="25" y2="10" stroke-width="2">'+
                '</line></svg>'
        } });
}

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

SPECIALCHARS={'mu':'\u03bc','times':'\u00d7','plusmn':'\u00b1'}

// styleText - make styled svg text in the given node
//      sn - the node to contain the text
//      t - the (pseudo-HTML) styled text as a string
function styleText(sn,t) {
    if(t===undefined) { return }
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
    while(t1.match(attrRE)) { t1=t1.replace(attrRE,'$1"$2"$3') }
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
            if(i>0) { l.attr('x',s.attr('x')).attr('dy',1.3*s.attr('font-size')) }
            sti(l,lines[i].childNodes);
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

    function sti(s,n){
        function addtext(v){ (s.text() ? s.append('tspan') : s).text(v) }

        var sf = {
            sup: function(s){ s.attr('baseline-shift','super').attr('font-size','70%') },
            sub: function(s){ s.attr('baseline-shift','sub').attr('font-size','70%') },
            b: function(s){ s.attr('font-weight','bold') },
            i: function(s){ s.attr('font-style','italic') },
            font: function(s,a){
                for(var j=0; j<a.length; j++) {
                    var at = a[j], atl=at.name.toLowerCase(), atv=at.nodeValue;
                    if(atl=='color') { s.call(fillColor,atv) }
                    else { s.attr('font-'+atl,atv) }
                }
            }
        }

        for(var i=0;i<n.length;i++){
            var nn=n[i].nodeName.toLowerCase(),nc=n[i].childNodes;
            if(nn=='#text') { addtext(n[i].nodeValue) }
            else if(nn=='c') { addtext(SPECIALCHARS[nc[0].nodeValue]||'?') }
            else if(sf[nn]) { sti(s.append('tspan').call(sf[nn],n[i].attributes),nc) }
        }
    }
}

// ----------------------------------------------------
// Graph file operations
// ----------------------------------------------------

// ------------------------------- graphToGrid

function graphToGrid(){
    var gd=gettab();
    if(gd.fid !== undefined && gd.fid !='') { pullf({fid: gd.fid, ft:'grid'}) }
    else {
        var data = gd.data.map(function(gdd){return stripSrc(gdd)});
        plotlylog('~ DATA ~');
        plotlylog(data);
        pullf({data: JSON.stringify({'data':data}), ft:'grid'});
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
    for(key in i) { o[key]=i[key] }
    for(key in up) {
        if($.isPlainObject(up[key])) {
            o[key]=updateObject($.isPlainObject(i[key]) ? i[key] : {}, up[key]);
        }
        // if the initial object had a number and the update can be a number, coerce it
        else if($.isNumeric(i[key]) && $.isNumeric(up[key])) { o[key] = Number(up[key]) }
        else { o[key] = up[key] }
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
	for(i=0; i<len; i++) {
	    if(!$.isNumeric(v)) { v=a[i] }
	    else if($.isNumeric(a[i])) { v=f(v,a[i]) }
	}
	return v;
}

// do two bounding boxes from getBoundingClientRect,
// ie {left,right,top,bottom,width,height}, overlap?
function bBoxIntersect(a,b){
    return (a.left<=b.right && b.left<=a.right && a.top<=b.bottom && b.top<=a.bottom)
}

// create a copy of data, with all dereferenced src elements stripped
// ie if there's xsrc present, strip out x
// needs to do this recursively because some src can be inside sub-objects
// also strips out functions and other private (start with _) elements
// so we can add temporary things to data and layout that don't get saved
function stripSrc(d) {
    var o={};
    for(v in d) {
        if(!(v+'src' in d) && (typeof d[v] != 'function') && (v.charAt(0)!='_')) {
            if($.isPlainObject(d[v])) { o[v]=stripSrc(d[v]) }
            else { o[v]=d[v] }
        }
    }
    return o;
}

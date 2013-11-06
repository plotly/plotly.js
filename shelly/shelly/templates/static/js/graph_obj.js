// Main plotting library - Creates the Plotly object and Plotly.Plots
// also fills any missing components with dummies to avoid errors
(function() {
if(!window.Plotly) { window.Plotly = {}; }
var plots = Plotly.Plots = {};

// fill for possibly missing graph type libraries.
// most of these should
// module is the name of the object, methods are the methods to fill.
function noop(){}
function req(module, methods) {
    if(module in window.Plotly) { return; }
    var moduleFill = {};
    for(var i=0; i<methods.length; i++) { moduleFill[methods[i]] = noop; }
    window.Plotly[module] = moduleFill;
}
req('Annotations',['add','allArrowheads','draw','drawAll']);
req('Axes',['setTypes','convertOne','convertToNums','setConvert','doAutoRange','expand',
    'autoBin','autoTicks','tickIncrement','tickFirst','tickText','doTicks']);
req('Bars',['calc','plot','setPositions']);
req('Boxes',['calc','plot','setPositions','style']);
req('Drawing',['rgb','opacity','addOpacity','strokeColor','fillColor','setPosition','setSize',
    'setRect','translatePoints','traceStyle','lineGroupStyle','fillGroupStyle','pointStyle','styleText']);
req('ErrorBars',['pushRef2GDC','styleBoxDrop','ydr','plot','style']);
req('Fx',['init','hover','unhover','click','modeBar','dragAlign','dragCursors','dragClear','autoGrowInput']);
req('Heatmap',['calc','plot','margin']);
req('Histogram',['calc']);
req('Legend',['lines','points','bars','boxes','draw']);
req('Lib',['dateTime2ms','isDateTime','ms2DateTime','findBin','distinctVals','nestedProperty',
    'pauseEvent','lpad','aggNums','len','mean','stdev','VERBOSE','TIMER','log','markTime','constrain',
    'notifier','identity']);
req('Scatter',['calc','plot']);

// Most of the generic plotting functions get put into Plotly.Plots,
// but some - the ones we want 3rd-party developers to use - go directly
// into Plotly. These are:
//   plot
//   restyle
//   relayout

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

// IMPORTANT - default colors should be in hex for grid.js
plots.defaultColors = ['#1f77b4', // muted blue
                '#ff7f0e', // safety orange
                '#2ca02c', // cooked asparagus green
                '#d62728', // brick red
                '#9467bd', // muted purple
                '#8c564b', // chestnut brown
                '#e377c2', // raspberry yogurt pink
                '#7f7f7f', // middle gray
                '#bcbd22', // curry yellow-green
                '#17becf']; // blue-teal

Plotly.colorscales = {
    'YIGnBu':[[0,"rgb(8, 29, 88)"],[0.125,"rgb(37, 52, 148)"],[0.25,"rgb(34, 94, 168)"],
        [0.375,"rgb(29, 145, 192)"],[0.5,"rgb(65, 182, 196)"],[0.625,"rgb(127, 205, 187)"],
        [0.75,"rgb(199, 233, 180)"],[0.875,"rgb(237, 248, 217)"],[1,"rgb(255, 255, 217)"]],

    'YIOrRd':[[0,"rgb(128, 0, 38)"],[0.125,"rgb(189, 0, 38)"],[0.25,"rgb(227, 26, 28)"],
        [0.375,"rgb(252, 78, 42)"],[0.5,"rgb(253, 141, 60)"],[0.625,"rgb(254, 178, 76)"],
        [0.75,"rgb(254, 217, 118)"],[0.875,"rgb(255, 237, 160)"],[1,"rgb(255, 255, 204)"]],

    'RdBu':[[0,"rgb(33, 102, 172)"],[0.125,"rgb(67, 147, 195)"],[0.25,"rgb(146, 197, 222)"],
        [0.375,"rgb(209, 229, 240)"],[0.5,"rgb(247, 247, 247)"],[0.625,"rgb(253, 219, 199)"],
        [0.75,"rgb(244, 165, 130)"],[0.875,"rgb(214, 96, 77)"],[1,"rgb(178, 24, 43)"]],

    'Greens':[[0,"rgb(0, 68, 27)"],[0.125,"rgb(0, 109, 44)"],[0.25,"rgb(35, 139, 69)"],
        [0.375,"rgb(65, 171, 93)"],[0.5,"rgb(116, 196, 118)"],[0.625,"rgb(161, 217, 155)"],
        [0.75,"rgb(199, 233, 192)"],[0.875,"rgb(229, 245, 224)"],[1,"rgb(247, 252, 245)"]],

    'rainbow':[[0,"rgb(0, 0, 150)"],[0.125,"rgb(0, 25, 255)"],[0.25,"rgb(0, 152, 255)"],
        [0.375,"rgb(44, 255, 202)"],[0.5,"rgb(151, 255, 96)"],[0.625,"rgb(255, 234, 0)"],
        [0.75,"rgb(255, 111, 0)"],[0.875,"rgb(223, 0, 0)"],[1,"rgb(132, 0, 0)"]],

    'portland':[[0,"rgb(12,51,131)"],[0.25,"rgb(10,136,186)"],[0.5,"rgb(242,211,56)"],
                [0.75,"rgb(242,143,56)"],[1,"rgb(217,30,30)"]],

    'picnic':[[0,"rgb(0,0,255)"],[0.1,"rgb(51,153,255)"],[0.2,"rgb(102,204,255)"],
                [0.3,"rgb(153,204,255)"],[0.4,"rgb(204,204,255)"],[0.5,"rgb(255,255,255)"],
                [0.6,"rgb(255,204,255)"],[0.7,"rgb(255,153,255)"],[0.8,"rgb(255,102,204)"],
                [0.9,"rgb(255,102,102)"],[1,"rgb(255,0,0)"]],

    'greys':[[0,"rgb(0,0,0)"],[1,"rgb(255,255,255)"]],

    'bluered':[[0,"rgb(0,0,255)"],[1,"rgb(255,0,0)"]] };

Plotly.defaultColorscale = Plotly.colorscales.YIGnBu;

// add all of these colorscales to css dynamically, so we don't have to keep them in sync manually
// dynamic stylesheet, see http://davidwalsh.name/add-rules-stylesheets
// css syntax from http://www.colorzilla.com/gradient-editor/
(function() {
    var style = document.createElement("style");
    // WebKit hack :(
    style.appendChild(document.createTextNode(""));
    document.head.appendChild(style);
    var styleSheet = style.sheet;

    function addStyleRule(selector,stylestring) {
        if(styleSheet.insertRule) { styleSheet.insertRule(selector+'{'+stylestring+'}',0); }
        else if(lib.styleSheet.addRule) { styleSheet.addRule(selector,stylestring,0); }
        else { console.log('addStyleRule failed'); }
    }

    function pct(v){ return String(Math.round((1-v)*100))+'%';}

    for(var scaleName in Plotly.colorscales) {
        var scale = Plotly.colorscales[scaleName],
            list1 = '', // color1 0%, color2 12%, ...
            list2 = ''; // color-stop(0%,color1), color-stop(12%,color2) ...
        for(var i=scale.length-1; i>=0; i--) {
            list1 += ', '+scale[i][1]+' '+pct(scale[i][0]);
            list2 += ', color-stop('+pct(scale[i][0])+','+scale[i][1]+')';
        }
        var rule =
            // old browsers with no supported gradients - shouldn't matter to us
            // as they won't have svg anyway?
            'background: '+scale[scale.length-1][1]+';' +
            // FF 3.6+
            'background: -moz-linear-gradient(top'+list1+');' +
            // Chrome,Safari4+
            'background: -webkit-gradient(linear, left top, left bottom'+list2+');' +
            // Chrome10+,Safari5.1+
            'background: -webkit-linear-gradient(top'+list1+');' +
            // Opera 11.10+
            'background: -o-linear-gradient(top'+list1+');' +
            // IE10+
            'background: -ms-linear-gradient(top'+list1+');' +
            // W3C
            'background: linear-gradient(to bottom'+list1+');' +
            // IE6-9 (only gets start and end colors)
            "filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='"+
                scale[scale.length-1][1]+"',endColorstr='"+scale[0][1]+"',GradientType=0);";
        addStyleRule('.'+scaleName,rule);
    }
}());

// default layout defined as a function rather than a constant so it makes a new copy each time
function defaultLayout(){
    return {title:'Click to enter Plot title',
        xaxis:Plotly.Axes.defaultAxis({range:[-1,6],title:'Click to enter X axis title'}),
        yaxis:Plotly.Axes.defaultAxis({range:[-1,4],title:'Click to enter Y axis title'}),
        legend:{bgcolor:'#fff',bordercolor:'#000',borderwidth:1,
            font:{family:'',size:0,color:''},
            traceorder:'normal'
        },
        width:700,
        height:450,
        autosize:'initial', // after initial autosize reverts to true
        margin:{l:80,r:80,t:80,b:80,pad:2},
        paper_bgcolor:'#fff',
        plot_bgcolor:'#fff',
        barmode:'stack',
        bargap:0.2,
        bargroupgap:0.0,
        boxmode:'overlay',
        boxgap:0.3,
        boxgroupgap:0.3,
        font:{family:'Arial, sans-serif',size:12,color:'#000'},
        titlefont:{family:'',size:0,color:''},
        dragmode:'zoom',
        hovermode:'x'
    };
}

// how to display each type of graph
// AJ 3/4/13: I'm envisioning a lot of stuff that's hardcoded into plot,
// setStyles etc will go here to make multiple graph types easier to manage
var graphInfo = {
    scatter:{
        framework:makePlotFramework
    },
    bar:{
        framework:makePlotFramework
    },
    heatmap:{
        framework:makePlotFramework
    },
    histogramx:{
        framework:makePlotFramework
    },
    histogramy:{
        framework:makePlotFramework
    },
    histogram2d:{
        framework:makePlotFramework
    },
    box:{
        framework:makePlotFramework
    }
};

var BARTYPES = ['bar','histogramx','histogramy'];
plots.isBar = function(type) { return BARTYPES.indexOf(type)!=-1; };
var HEATMAPTYPES = ['heatmap','histogram2d'];
plots.isHeatmap = function(type) { return HEATMAPTYPES.indexOf(type)!=-1; };

plots.newTab = function(divid, layout) {
    makeToolMenu(divid);
    makePlotFramework(divid, layout);
};

function makeToolMenu(divid) {
    // Get the container div: we will store all variables for this plot as
    // properties of this div (for extension to multiple plots/tabs per page)
    // some callers send this in by dom element, others by id (string)
    var gd = (typeof divid == 'string') ? document.getElementById(divid) : divid;
    // test if this is on the main site or embedded
    gd.mainsite = Boolean($('#plotlyMainMarker').length);
    if(gd.mainsite) {
        makeGraphToolMenu(gd);
    }
}

// Traces are unique by name.. allows traces to be updated/restyled
// TODO: this isn't used?
function updateTraces(old_data, new_data) {
    var updated = {},
        res = [],
        i;
    for (i=0; i<old_data.length; i++){
        old_trace = old_data[i];
        updated[old_trace['name']] = old_trace;
    }
    for (i=0; i<new_data.length; i++){
        new_trace = new_data[i];
        updated[new_trace['name']] = new_trace;
    }
    var tk = Object.keys(updated);
    for (i=0; i<tk.length; i++){
        var name = tk[i];
        res.push(updated[name]);
    }
    return res;
}

// the 'view in plotly' link - note that now plot() calls this if it exists,
// so it can regenerate whenever it replots
// note that now this function is only adding the brand in iframes and 3rd-party
// apps, standalone plots get the sidebar instead.
plots.positionBrand = function(gd){
    $(gd).find('.linktotool').remove();
    var linktotool = $('<div class="linktotool">'+
        '<a><font class="muted">view in </font><font class="info">plotly</font></a>'+
        '</div>').appendTo(gd.paperdiv.node());
    if(gd.shareplot) {
        var path=window.location.pathname.split('/');
        linktotool.find('a')
            .attr('href','/'+path[2]+'/'+path[1])
            .attr('target','_blank');
    }
    else {
        linktotool.find('a').click(function(){
            var hiddenform = $('<div id="hiddenform" style="display:none;">'+
                '<form action="https://plot.ly/external" method="post" target="_blank">'+
                '<input type="text" name="data" /></form></div>').appendTo(gd);
            // somehow we need to double escape characters for this purpose.
            // and need to escape single quote because we'll use it at the end
            hiddenform.find('input').val(plots.graphJson(gd,false,'keepdata')
                .replace(/\\/g,'\\\\').replace(/'/g,"\\'"));
            hiddenform.find('form').submit();
            hiddenform.remove();
        });
    }
};

// ----------------------------------------------------
// Main plot-creation function. Note: will call newPlot
// if necessary to create the framework
// ----------------------------------------------------
// inputs:
//      gd - the id or DOM element of the graph container div
//      data - array of traces, containing the data and display
//          information for each trace
//      layout - object describing the overall display of the plot,
//          all the stuff that doesn't pertain to any individual trace
Plotly.plot = function(gd, data, layout) {
    Plotly.Lib.markTime('in plot');
    // Get the container div: we will store all variables for this plot as
    // properties of this div (for extension to multiple plots/tabs per page)
    // some callers send this in by dom element, others by id (string)
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    // test if this is on the main site or embedded
    gd.mainsite=Boolean($('#plotlyMainMarker').length);

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass non-array (null, '', whatever) for data
    var graphwasempty = ((typeof gd.data==='undefined') && $.isArray(data));
    if($.isArray(data)) {
        if(graphwasempty) { gd.data=data; }
        else { gd.data.push.apply(gd.data,data); }
        gd.empty=false; // for routines outside graph_obj that want a clean tab
                        // (rather than appending to an existing one) gd.empty
                        // is used to determine whether to make a new tab
    }

    if(micropolar.adapter.isPolar(gd.data)){
        gd.data=data;
        gd.layout=layout;
        gd.paper = $(gd).find('.svg-container');
        micropolar.adapter.plotly(gd.paper.get(0), gd.data, gd.layout);
        return null;
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
    if (gd.data && gd.data.length > 0) {
        var framework = graphInfo[gd.data[0].type || 'scatter'].framework,
            subplots = getSubplots(gd.data).join(''),
            oldSubplots = ((gd.layout && gd.layout._plots) ? Object.keys(gd.layout._plots) : []).join('');
        if(!gd.framework || gd.framework!=framework || !gd.layout || graphwasempty || (oldSubplots!=subplots)) {
            gd.framework = framework;
            framework(gd,layout);
        }
    }
    else if((typeof gd.layout==='undefined')||graphwasempty) { makePlotFramework(gd, layout); }

    // enable or disable formatting buttons
    $(gd).find('.data-only').attr('disabled', !gd.data || gd.data.length===0);

    var gl = gd.layout,
        xa = gl.xaxis,
        ya = gl.yaxis;
    var x, y, i, serieslen, cd, type;
    // if we have bars or fill-to-zero traces, make sure autorange goes to zero
    gd.firstscatter = true; // because fill-to-next on the first scatter trace goes to zero
    gd.numboxes = 0;

    // prepare the types and conversion functions for the axes
    // also clears the autorange bounds ._min, ._max
    Plotly.Axes.setTypes(gd);

    // prepare the data and find the autorange
    // TODO: only remake calcdata for new or changed traces
    gd.calcdata=[];
    gd.hmpixcount=0; // for calculating avg luminosity of heatmaps
    gd.hmlumcount=0;

    Plotly.Lib.markTime('done Plotly.Axes.setType');

    for(var curve in gd.data) {
        var gdc = gd.data[curve], // curve is the index, gdc is the data object for one trace
            curvetype = gdc.type || 'scatter', //default type is scatter
            typeinfo = graphInfo[curvetype],
            cdtextras = {}; // info (if anything) to add to cd[0].t
        cd = [];

        if(typeinfo.framework!=gd.framework) {
            console.log('Oops, tried to put data of type '+(gdc.type || 'scatter')+
                ' on an incompatible graph controlled by '+(gd.data[0].type || 'scatter')+
                ' data. Ignoring this dataset.');
            continue;
        }

        // if no name is given, make a default from the curve number
        if(!('name' in gdc)) {
            if('ysrc' in gdc) {
                var ns=gdc.ysrc.split('/');
                gdc.name=ns[ns.length-1].replace(/\n/g,' ');
            }
            else { gdc.name='trace '+curve; }
        }

        if (curvetype=='scatter') { cd = Plotly.Scatter.calc(gd,gdc); }
        else if (plots.isBar(curvetype)) {
            if(curvetype=='bar') { cd = Plotly.Bars.calc(gd,gdc); }
            else { cd = Plotly.Histogram.calc(gd,gdc); }
        }
        else if (plots.isHeatmap(curvetype)){ cd = Plotly.Heatmap.calc(gd,gdc); }
        else if (curvetype=='box') { cd = Plotly.Boxes.calc(gd,gdc); }

        if(!('line' in gdc)) gdc.line = {};
        if(!('marker' in gdc)) gdc.marker = {};
        if(!('line' in gdc.marker)) gdc.marker.line = {};
        if(!('textfont' in gdc)) gdc.textfont = {};
        if(!$.isArray(cd) || !cd[0]) { cd = [{x: false, y: false}]; } // make sure there is a first point

        // add the trace-wide properties to the first point, per point properties to every point
        // t is the holder for trace-wide properties
        if(!cd[0].t) { cd[0].t = {}; }
        cd[0].t.curve = curve; // store the gd.data curve number that gave this trace
        cd[0].t.cdcurve = gd.calcdata.length; // store the calcdata curve number we're in

        gd.calcdata.push(cd);
        Plotly.Lib.markTime('done with calcdata for '+curve);
    }

    // put the styling info into the calculated traces
    // has to be done separate from applyStyles so we know the mode (ie which objects to draw)
    // and has to be before stacking so we get bardir, type, visible
    plots.setStyles(gd);

    // position and range calculations for traces that depend on each other
    // ie bars (stacked or grouped) and boxes push each other out of the way
    Plotly.Bars.setPositions(gd);
    Plotly.Boxes.setPositions(gd);

    Plotly.Lib.markTime('done with setstyles and bar/box adjustments');

    // autorange for errorbars
    if(ya.autorange) {
        Plotly.Axes.expand(ya,Plotly.ErrorBars.ydr(gd),{padded:true});
    }
    Plotly.Lib.markTime('done Plotly.ErrorBars.ydr');

    // autorange for annotations
    Plotly.Annotations.calcAutorange(gd);
    // TODO: autosize extra for big pts, text too

    Plotly.Axes.doAutoRange(xa);
    Plotly.Axes.doAutoRange(ya);

    gd.plot.attr('viewBox','0 0 '+gd.plotwidth+' '+gd.plotheight);
    Plotly.Axes.doTicks(gd,'redraw'); // draw ticks, titles, and calculate axis scaling (._b, ._m)

    Plotly.Lib.markTime('done autorange and ticks');

    if($.isNumeric(xa._m) && $.isNumeric(xa._b) && $.isNumeric(ya._m) && $.isNumeric(ya._b)) {
        // Now plot the data. Order is:
        // 1. heatmaps (and 2d histos)
        // 2. bars/histos
        // 3. errorbars for everyone
        // 4. scatter
        // 5. box plots

        var cdbar = [], cdscatter = [], cdbox = [];
        for(i in gd.calcdata){
            cd = gd.calcdata[i];
            type=cd[0].t.type;
            if(plots.isHeatmap(type)) {
                Plotly.Heatmap.plot(gd,cd);
                Plotly.Lib.markTime('done heatmap '+i);
            }
            else {
                // in case this one was a heatmap previously, remove it and its colorbar
                $(gd).find('.hm'+i).remove();
                $(gd).find('.cb'+i).remove();

                if(plots.isBar(type)) { cdbar.push(cd); }
                else if(type=='box') { cdbox.push(cd); }
                else { cdscatter.push(cd); }
            }
        }

        // remove old traces, then redraw everything
        gd.plot.selectAll('g.trace').remove();
        Plotly.Bars.plot(gd,cdbar);
        Plotly.Lib.markTime('done bars');

        // DRAW ERROR BARS for bar and scatter plots
        // these come after (on top of) bars, and before (behind) scatter
        Plotly.ErrorBars.plot(gd,cdbar.concat(cdscatter));
        Plotly.Lib.markTime('done errorbars');

        Plotly.Scatter.plot(gd,cdscatter);
        Plotly.Lib.markTime('done scatter');
        Plotly.Boxes.plot(gd,cdbox);
        Plotly.Lib.markTime('done boxes');

        //styling separate from drawing
        applyStyle(gd);
        Plotly.Lib.markTime('done applyStyle');
    }
    else { console.log('error with axis scaling',xa._m,xa._b,ya._m,ya._b); }

    // show the legend and annotations
    if(gl.showlegend || (gd.calcdata.length>1 && gl.showlegend!==false)) { Plotly.Legend.draw(gd); }
    else { gd.infolayer.selectAll('.legend').remove(); }
    Plotly.Annotations.drawAll(gd);

    // final cleanup
    console.log(gd.mainsite, gd.standalone);
    if(!gd.mainsite && !gd.standalone) { plots.positionBrand(gd); } // 'view in plotly' link for embedded plots

    setTimeout(function(){
        if($(gd).find('#graphtips').length===0 && gd.data!==undefined && gd.showtips!==false && gd.mainsite){
            try{
                if( firsttimeuser() ) showAlert('graphtips');
            }
            catch(e){ console.log(e); }
        }
        else if($(gd).find('#graphtips').css('display')=='none'){
            if( firsttimeuser() ) $(gd).find('#graphtips').fadeIn();
        }
    },1000);
    Plotly.Lib.markTime('done plot');
};

// setStyles: translate styles from gd.data to gd.calcdata,
// filling in defaults for missing values and breaking out arrays to individual points
plots.setStyles = function(gd, merge_dflt) {
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    merge_dflt = merge_dflt || false; // CP Edit - see mergeattr comment

    var i,j,l,p,prop,val,cd,t,c,gdc,defaultColor;

    // merge object a[k] (which may be an array or a single value) into cd...
    // search the array defaults in case a[k] is missing (and for a default val
    // if some points of o are missing from a)
    // CP Edit: if merge_dflt, then apply the default value into gd.data... used for saving themes
    // CP Edit: pass key (k) as argument
    // AJ Edit: nosplit option - used for colorscales because they're
    //          arrays but shouldn't be treated as per-point objects
    function mergeattr(k,attr,dflt,nosplit) {
        prop = Plotly.Lib.nestedProperty(gdc,k);
        val = prop.get();

        if($.isArray(val) && !nosplit) {
            l = Math.min(cd.length,val.length);
            for(p=0; p<l; p++) { cd[p][attr]=val[p]; }
            // use the default for the trace-wide value, in case individual vals are missing
            cd[0].t[attr] = dflt;
        }
        else {
            cd[0].t[attr] = (typeof val != 'undefined') ? val : dflt;
            if(merge_dflt && typeof val == 'undefined'){
                prop.set(dflt);
            }
        }
    }


    for(i in gd.calcdata){
        cd = gd.calcdata[i]; // trace plus styling
        t = cd[0].t; // trace styling object
        c = t.curve; // trace number
        gdc = gd.data[c];
        defaultColor = plots.defaultColors[c % plots.defaultColors.length];
        // all types have attributes type, visible, opacity, name, text
        // mergeattr puts single values into cd[0].t, and all others into each individual point
        mergeattr('type','type','scatter');
        mergeattr('visible','visible',true);
        mergeattr('opacity','op',1);
        mergeattr('text','tx','');
        mergeattr('name','name','trace '+c);
        mergeattr('error_y.visible','ye_vis',false);
        var type = t.type; // like 'bar'
        if( (gdc.error_y && gdc.error_y.visible ) ){
            mergeattr('error_y.type','ye_type','percent');
            mergeattr('error_y.value','ye_val',10);
            mergeattr('error_y.traceref','ye_tref',0);
            mergeattr('error_y.color','ye_clr',t.ye_clr|| defaultColor);
            mergeattr('error_y.thickness','ye_tkns',1);
            mergeattr('error_y.width','ye_w',4);
            mergeattr('error_y.opacity','ye_op',1);
        }
        if(['scatter','box'].indexOf(type)!=-1){
            mergeattr('line.color','lc',gdc.marker.color || defaultColor);
            mergeattr('line.width','lw',2);
            mergeattr('marker.symbol','mx','circle');
            mergeattr('marker.opacity','mo',1);
            mergeattr('marker.size','ms',6);
            mergeattr('marker.color','mc',t.lc);
            mergeattr('marker.line.color','mlc',((t.lc!=t.mc) ? t.lc : '#000'));
            mergeattr('marker.line.width','mlw',0);
            mergeattr('fill','fill','none');
            mergeattr('fillcolor','fc',Plotly.Drawing.addOpacity(t.lc,0.5));
            if($.isArray(gdc.marker.size)) {
                mergeattr('marker.sizeref','msr',1);
                mergeattr('marker.sizemode','msm','diameter');
            }
            // even if sizeref and sizemode are set, don't use them outside bubble charts
            else { t.msr=1; t.msm = 'diameter'; }
            mergeattr('marker.colorscale','mscl',Plotly.defaultColorscale,true);
            mergeattr('marker.cauto','mcauto',true);
            mergeattr('marker.cmax','mcmax',10);
            mergeattr('marker.cmin','mcmin',-10);
            mergeattr('marker.line.colorscale','mlscl',Plotly.defaultColorscale,true);
            mergeattr('marker.line.cauto','mlcauto',true);
            mergeattr('marker.line.cmax','mlcmax',10);
            mergeattr('marker.line.cmin','mlcmin',-10);
            if(type==='scatter') {
                var defaultMode = 'lines';
                if(cd.length<Plotly.Scatter.PTS_LINESONLY || (typeof gdc.mode != 'undefined')) {
                    defaultMode = 'lines+markers';
                }
                else { // check whether there are orphan points, then show markers regardless of length
                    for(j=0; j<cd.length; j++) {
                        if($.isNumeric(cd[j].x) && $.isNumeric(cd[j].y) &&
                          (j===0 || !$.isNumeric(cd[j-1].x) || !$.isNumeric(cd[j-1].y)) &&
                          (j==cd.length-1 || !$.isNumeric(cd[j+1].x) || !$.isNumeric(cd[j+1].y))) {
                            defaultMode = 'lines+markers';
                            break;
                        }
                    }
                }
                mergeattr('mode','mode',defaultMode);
                mergeattr('line.dash','ld','solid');
                mergeattr('textposition','tp','middle center');
                mergeattr('textfont.size','ts',gd.layout.font.size);
                mergeattr('textfont.color','tc',gd.layout.font.color);
                mergeattr('textfont.family','tf',gd.layout.font.family);
            }
            else if(type==='box') {
                mergeattr('whiskerwidth','ww',0.5);
                mergeattr('boxpoints','boxpts','outliers');
                mergeattr('boxmean','mean',false);
                mergeattr('jitter','jitter',0);
                mergeattr('pointpos','ptpos',0);
                mergeattr('marker.outliercolor','soc','rgba(0,0,0,0)');
                mergeattr('marker.line.outliercolor','solc',t.mc);
                mergeattr('marker.line.outlierwidth','solw',1);
                mergeattr('marker.outliercolorscale','soscl',t.mscl,true);
                mergeattr('marker.outliercauto','socauto',t.mcauto);
                mergeattr('marker.outliercmax','socmax',t.mcmax);
                mergeattr('marker.outliercmin','socmin',t.mcmin);
                mergeattr('marker.line.outliercolorscale','solscl',t.mlscl,true);
                mergeattr('marker.line.outliercauto','solcauto',t.mlcauto);
                mergeattr('marker.line.outliercmax','solcmax',t.mlcmax);
                mergeattr('marker.line.outliercmin','solcmin',t.mlcmin);
            }
        }
        else if(plots.isHeatmap(type)){
            if(type==='histogram2d') {
                mergeattr('histnorm','histnorm','count');
                mergeattr('autobinx','autobinx',true);
                mergeattr('nbinsx','nbinsx',0);
                mergeattr('xbins.start','xbstart',0);
                mergeattr('xbins.end','xbend',1);
                mergeattr('xbins.size','xbsize',1);
                mergeattr('autobiny','autobiny',true);
                mergeattr('nbinsy','nbinsy',0);
                mergeattr('ybins.start','ybstart',0);
                mergeattr('ybins.end','ybend',1);
                mergeattr('ybins.size','ybsize',1);
            }
            else {
                mergeattr('xtype','xtype',gdc.x ? 'array' : 'noarray');
                mergeattr('ytype','ytype',gdc.y ? 'array' : 'noarray');
                mergeattr('x0','x0',0);
                mergeattr('dx','dx',1);
                mergeattr('y0','y0',0);
                mergeattr('dy','dy',1);
            }
            mergeattr('zauto','zauto',true);
            mergeattr('zmin','zmin',-10);
            mergeattr('zmax','zmax',10);
            mergeattr('scl', 'scl', Plotly.defaultColorscale,true);
            mergeattr('showscale','showscale',true);
            mergeattr('zsmooth', 'zsmooth', false);
        }
        else if(plots.isBar(type)){
            if(type!='bar') {
                mergeattr('histnorm','histnorm','count');
                mergeattr('autobinx','autobinx',true);
                mergeattr('nbinsx','nbinsx',0);
                mergeattr('xbins.start','xbstart',0);
                mergeattr('xbins.end','xbend',1);
                mergeattr('xbins.size','xbsize',1);
            }
            mergeattr('bardir','bardir','v');
            mergeattr('marker.opacity','mo',1);
            mergeattr('marker.color','mc',defaultColor);
            mergeattr('marker.line.color','mlc','#000');
            mergeattr('marker.line.width','mlw',0);
        }
    }
};

function applyStyle(gd) {
    var gp = gd.plot;
    gp.selectAll('g.trace')
        .call(Plotly.Drawing.traceStyle,gd);
    gp.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path,rect')
                .call(Plotly.Drawing.pointStyle,d.t||d[0].t);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle,d.t||d[0].t);
        });

    gp.selectAll('g.trace polyline.line')
        .call(Plotly.Drawing.lineGroupStyle);

    gp.selectAll('g.trace polyline.fill')
        .call(Plotly.Drawing.fillGroupStyle);

    gp.selectAll('g.boxes')
        .call(Plotly.Boxes.style);
    gp.selectAll('g.errorbars')
        .call(Plotly.ErrorBars.style);

    if(gd.mainsite && window.ws && window.ws.confirmedReady) {
        alert_repl("applyStyle", plots.graphJson(gd,true));
    }
}

// -----------------------------------------------------
// restyle and relayout: these two control all redrawing
// for data (restyle) and everything else (relayout)
// -----------------------------------------------------

// restyle: change styling of an existing plot
// can be called two ways:
// restyle(gd,astr,val[,traces])
//      gd - graph div (dom element)
//      astr - attribute string (like 'marker.symbol')
//      val - value to give this attribute
//      traces - integer or array of integers for the traces to alter (all if omitted)
// relayout(gd,aobj[,traces])
//      aobj - {astr1:val1, astr2:val2...} allows setting multiple attributes simultaneously
// val (or val1, val2... in the object form) can be an array, to apply different
// values to each trace
// if the array is too short, it will wrap around (useful for style files that want
// to specify cyclical default values)
Plotly.restyle = function(gd,astr,val,traces) {
    // console.log(gd,astr,val,traces);
    if(typeof gd == 'string') { gd = document.getElementById(gd); }

    var gl = gd.layout,
        aobj = {};
    if(typeof astr == 'string') { aobj[astr] = val; }
    else if($.isPlainObject(astr)) {
        aobj = astr;
        if(traces===undefined) { traces = val; } // the 3-arg form
    }
    else { console.log('restyle fail',astr,val,traces); return; }

    if(Object.keys(aobj).length) { gd.changed = true; }

    if($.isNumeric(traces)) { traces=[traces]; }
    else if(!$.isArray(traces) || !traces.length) {
        traces=gd.data.map(function(v,i){ return i; });
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
        'marker.size','text','textfont.size','textposition',
        'xtype','x0','dx','ytype','y0','dy',
        'zmin','zmax','zauto','mincolor','maxcolor','scl','zsmooth','showscale',
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
    function a0(){ return traces.map(function(){ return undefined; }); }

    // for attrs that interact (like scales & autoscales), save the
    // old vals before making the change
    // val=undefined will not set a value, just record what the value was.
    // attr can be an array to set several at once (all to the same val)
    function doextra(cont,attr,val,i) {
        if($.isArray(attr)) {
            attr.forEach(function(a){ doextra(cont,a,val,i); });
            return;
        }
        if(attr in aobj) { return; } // quit if explicitly setting this elsewhere
        var extraparam = Plotly.Lib.nestedProperty(cont,attr);
        if(!(attr in undoit)) { undoit[attr] = a0(); }
        if(undoit[attr][i]===undefined) { undoit[attr][i]=extraparam.get(); }
        if(val!==undefined) { extraparam.set(val); }
    }
    var zscl = ['zmin','zmax'],
        xbins = ['xbins.start','xbins.end','xbins.size'],
        ybins = ['xbins.start','xbins.end','xbins.size'];

    // now make the changes to gd.data (and occasionally gd.layout)
    // and figure out what kind of graphics update we need to do
    for(var ai in aobj) {
        var vi = aobj[ai], cont, param;
        redoit[ai] = vi;

        if(layout_attr.indexOf(ai)!=-1){
            param = Plotly.Lib.nestedProperty(gl,ai);
            undoit[ai] = [param.get()];
            // since we're allowing val to be an array, allow it here too,
            // even though that's meaningless
            param.set($.isArray(vi) ? vi[0] : vi);
            // ironically, the layout attrs in restyle only require replot,
            // not relayout
            doplot = true;
            continue;
        }

        // set attribute in gd.data
        undoit[ai] = a0();
        for(i=0; i<traces.length; i++) {
            cont = gd.data[traces[i]];
            param = Plotly.Lib.nestedProperty(cont,ai);

            // setting bin or z settings should turn off auto
            // and setting auto should save bin or z settings
            if(zscl.indexOf(ai)!=-1) { doextra(cont,'zauto',false,i); }
            else if(ai=='zauto') { doextra(cont,zscl,undefined,i); }
            else if(xbins.indexOf(ai)!=-1) { doextra(cont,'autobinx',false,i); }
            else if(ai=='autobinx') { doextra(cont,xbins,undefined,i); }
            else if(ybins.indexOf(ai)!=-1) { doextra(cont,'autobiny',false,i); }
            else if(ai=='autobiny') { doextra(cont,ybins,undefined,i); }
            // heatmaps:setting x0 or dx, y0 or dy, should turn xtype/ytype to 'scaled' if 'array'
            else if(['x0','dx'].indexOf(ai)!=-1 && cont.x && cont.xtype!='scaled') {
                doextra(cont,'xtype','scaled',i);
            }
            else if(['y0','dy'].indexOf(ai)!=-1 && cont.x && cont.ytype!='scaled') {
                doextra(cont,'ytype','scaled',i);
            }

            // save the old value
            undoit[ai][i] = param.get();
            // set the new value - if val is an array, it's one el per trace
            param.set($.isArray(vi) ? vi[i%vi.length] : vi);
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
            if(Plotly.Heatmap.margin(gd)) { dolayout = true; }
            else { doplot = true; }
        }
    }
    // now all attribute mods are done, as are redo and undo so we can save them
    if(typeof plotUndoQueue == 'function') { plotUndoQueue(gd,undoit,redoit,traces); }

    // now update the graphics
    // a complete layout redraw takes care of plot and
    if(dolayout) {
        gd.layout = undefined;
        Plotly.plot(gd,'',gl);
    }
    else if(doplot) { Plotly.plot(gd); }
    else {
        plots.setStyles(gd);
        if(doapplystyle) {
            applyStyle(gd);
            if(gl.showlegend) { Plotly.Legend.draw(gd); }
        }
    }
    $(gd).trigger('restyle.plotly',[redoit,traces]);
};

// relayout: change layout in an existing plot
// can be called two ways:
// relayout(gd,astr,val)
//      gd - graph div (dom element)
//      astr - attribute string (like 'xaxis.range[0]')
//      val - value to give this attribute
// relayout(gd,aobj)
//      aobj - {astr1:val1, astr2:val2...} allows setting multiple attributes simultaneously
Plotly.relayout = function(gd,astr,val) {
    // console.log(gd,astr,val);
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    var gl = gd.layout,
        aobj = {},
        dolegend = false,
        doticks = false,
        dolayoutstyle = false,
        doplot = false;

    if(typeof astr == 'string') { aobj[astr] = val; }
    else if($.isPlainObject(astr)) { aobj = astr; }
    else { console.log('relayout fail',astr,val); return; }

    if(Object.keys(aobj).length) { gd.changed = true; }

    // look for 'allaxes', split out into all axes
    var keys = Object.keys(aobj),
        axes = ['xaxis','yaxis'];
    for(var i=0; i<keys.length; i++) {
        if(keys[i].indexOf('allaxes')===0) {
            for(var j=0; j<axes.length; j++) {
                var newkey = keys[i].replace('allaxes',axes[j]);
                if(!aobj[newkey]) { aobj[newkey] = aobj[keys[i]]; }
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
            attr.forEach(function(a){ doextra(a,val); });
            return;
        }
        if(attr in aobj) { return; } // quit if explicitly setting this elsewhere
        var p = Plotly.Lib.nestedProperty(gl,attr);
        if(!(attr in undoit)) { undoit[attr]=p.get(); }
        if(val!==undefined) { p.set(val); }
    }

    var hw = ['height','width'];

    // alter gd.layout
    for(var ai in aobj) {
        var p = Plotly.Lib.nestedProperty(gl,ai),
            vi = aobj[ai];
        redoit[ai] = aobj[ai];
        // axis reverse is special - it is its own inverse op and has no flag.
        undoit[ai] = (p.parts[1]=='reverse') ? aobj[ai] : p.get();

        // check autosize or autorange vs size and range
        if(hw.indexOf(ai)!=-1) { doextra('autosize', false); }
        else if(ai=='autosize') { doextra(hw, undefined); }
        var m = ai.match(/^(.)axis\.range\[[0|1]\]$/);
        if(m && m.length==2) { doextra(p.parts[0]+'.autorange', false); }
        m = ai.match(/^(.)axis\.autorange$/);
        if(m && m.length==2) { doextra([p.parts[0]+'.range[0]',p.parts[0]+'.range[1]'], undefined); }

        // toggling log without autorange: need to also recalculate ranges
        // logical XOR (ie will islog actually change)
        if(p.parts[1]=='type' && !gl[p.parts[0]].autorange && (gl[p.parts[0]].type=='log' ? vi!='log' : vi=='log')) {
            var ax = gl[p.parts[0]],
                r0 = ax.range[0],
                r1 = ax.range[1];
            if(vi=='log') {
                // if both limits are negative, autorange
                if(r0<0 && r1<0) { doextra(p.parts[0]+'.autorange',true); continue; }
                // if one is negative, set it to one millionth the other. TODO: find the smallest positive val?
                else if(r0<0) r0 = r1/1e6;
                else if(r1<0) r1 = r0/1e6;
                // now set the range values as appropriate
                doextra(p.parts[0]+'.range[0]', Math.log(r0)/Math.LN10);
                doextra(p.parts[0]+'.range[1]', Math.log(r1)/Math.LN10);
            }
            else {
                doextra(p.parts[0]+'.range[0]', Math.pow(10, r0));
                doextra(p.parts[0]+'.range[1]', Math.pow(10, r1));
            }
        }

        // handle axis reversal explicitly, as there's no 'reverse' flag
        if(p.parts[1]=='reverse') {
            gl[p.parts[0]].range.reverse();
            doplot=true;
        }
        // send annotation mods one-by-one through Annotations.draw(), don't set via nestedProperty
        // that's because add and remove are special
        else if(p.parts[0]=='annotations') {
            var anum = p.parts[1];
            // if p.parts is just an annotation number, and val is either 'add' or
            // an entire annotation obj to add, the undo is 'remove'
            // if val is 'remove' then undo is the whole annotation object
            if(p.parts.length==2) {
                if(aobj[ai]=='add' || $.isPlainObject(aobj[ai])) { undoit[ai]='remove'; }
                else if(aobj[ai]=='remove') {
                    if(anum==-1) {
                        undoit['annotations'] = gl.annotations;
                        delete undoit[ai];
                    }
                    else { undoit[ai]=gl.annotations[p.parts[1]]; }
                }
                else { console.log('???',aobj); }
            }
            if((gl.xaxis.autorange || gl.yaxis.autorange) && anum>=0 &&
                (anum>=gl.annotations.length || gl.annotations[p.parts[1]].ref=='plot') &&
                ai.indexOf('color')==-1 && ai.indexOf('opacity')==-1) {
                    doplot = true;
            }
            Plotly.Annotations.draw(gd,anum,p.parts.slice(2).join('.'),aobj[ai]);
            delete aobj[ai];
        }
        // alter gd.layout
        else {
            // check whether we can short-circuit a full redraw
            if(p.parts[0].indexOf('legend')!=-1) { dolegend = true; }
            else if(ai.indexOf('title')!=-1) { doticks = true; }
            else if(p.parts[0].indexOf('bgcolor')!=-1) { dolayoutstyle = true; }
            else if(p.parts.length>1 && (
                p.parts[1].indexOf('tick')!=-1 ||
                p.parts[1].indexOf('exponent')!=-1 ||
                p.parts[1].indexOf('grid')!=-1 ||
                p.parts[1].indexOf('zeroline')!=-1)) { doticks = true; }
            else if(ai.indexOf('axis.linewidth')!=-1) { doticks = dolayoutstyle = true; }
            else if(p.parts.length>1 && (
                p.parts[1].indexOf('line')!=-1 ||
                p.parts[1].indexOf('mirror')!=-1)) { dolayoutstyle = true; }
            else if(ai=='margin.pad') { doticks = dolayoutstyle = true; }
            // hovermode and dragmode don't need any redrawing, since they just
            // affect reaction to user input
            else if(['hovermode','dragmode'].indexOf(ai)==-1) { doplot = true; }
            p.set(vi);
        }
    }
    // now all attribute mods are done, as are redo and undo so we can save them
    if(typeof plotUndoQueue=='function') { plotUndoQueue(gd,undoit,redoit,'relayout'); }

    // calculate autosizing - if size hasn't changed, will remove h&w so we don't need to redraw
    if(aobj.autosize) { aobj=plotAutoSize(gd,aobj); }

    // redraw
    // first check if there's still anything to do
    var ak = Object.keys(aobj);
    if(doplot) {
        gd.layout = undefined; // force plot() to redo the layout
        Plotly.plot(gd,'',gl); // pass in the modified layout
    }
    else if(ak.length) {
        // if we didn't need to redraw the whole thing, just do the needed parts
        if(dolegend) {
            gd.infolayer.selectAll('.legend').remove();
            if(gl.showlegend) { Plotly.Legend.draw(gd); }
        }
        if(dolayoutstyle) { layoutStyles(gd); }
        if(doticks) { Plotly.Axes.doTicks(gd,'redraw'); plots.titles(gd,'gtitle'); }
    }
    $(gd).trigger('relayout.plotly',redoit);
};

function setFileAndCommentsHeight(gd) {
    if(!gd.mainsite) { return; }

    var $gd = $(gd);

    var fileAndCommentsHeight = $gd.innerHeight() - $gd.children('.tool-menu').innerHeight(),
        $themebar = $gd.children('.themebar'),
        $demobar = $gd.children('.demobar');

    if ($themebar.css('display') == 'block') {
        fileAndCommentsHeight -= $themebar.innerHeight();
    }
    if ($demobar.css('display') == 'block') {
        fileAndCommentsHeight -= $demobar.innerHeight();
    }

    $gd.children('.file-and-comments').css('height', fileAndCommentsHeight);
}

function setGraphContainerScroll(gd) {
    if(!gd.mainsite) { return; }
    var $graphContainer = $(gd).find('.plot-container'),
        isGraphWiderThanContainer = gd.layout.width > parseInt($graphContainer.css('width'),10);

    if(gd && gd.tabtype=='plot' && $(gd).css('display')!='none') {
        if (gd.layout && (gd.layout.autosize || !isGraphWiderThanContainer)) {

            $graphContainer.removeClass('is-fixed-size');
        }
        else if (gd.layout && isGraphWiderThanContainer) {
            $graphContainer.addClass('is-fixed-size');
        }
    }
}

function plotAutoSize(gd, aobj) {
    var newheight, newwidth;
    if(gd.mainsite) {
        setFileAndCommentsHeight(gd);
        var gdBB = gd.graphContainer.node().getBoundingClientRect();
        newheight = Math.round(gdBB.height*0.9);
        newwidth = Math.round(gdBB.width*0.9);
    }
    else {
        newheight = $(gd).height() || gd.layout.height || defaultLayout().height;
        newwidth = $(gd).width() || gd.layout.width || defaultLayout().width;
        // delete aobj.autosize;
    }

    if(Math.abs(gd.layout.width - newwidth) > 1 || Math.abs(gd.layout.height - newheight) > 1) {
        gd.layout.height = newheight;
        gd.layout.width = newwidth;
    }
    // if there's no size change, update layout but only restyle (different
    // element may get margin color)
    else if(gd.layout.autosize != 'initial') { // can't call layoutStyles for initial autosize
        delete(aobj.autosize);
        gd.layout.autosize = true;
        layoutStyles(gd);
    }
    return aobj;
}

// check whether to resize a tab (if it's a plot) to the container
plots.resize = function(gd) {
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    killPopovers();

    setFileAndCommentsHeight(gd);

    if(gd && gd.tabtype=='plot' && $(gd).css('display')!='none') {
        if(gd.redrawTimer) { clearTimeout(gd.redrawTimer); }
        gd.redrawTimer = setTimeout(function(){

            if ($(gd).css('display')=='none') { return; }

            if (gd.layout && gd.layout.autosize) {

                var oldchanged = gd.changed;
                gd.autoplay = true; // don't include this relayout in the undo queue
                Plotly.relayout(gd, {autosize:true});
                gd.changed = oldchanged; // autosizing doesn't count as a change
            }

            if(LIT) {
                hidebox();
                litebox();
            }
        }, 100);
    }

    setGraphContainerScroll(gd);
};

// -------------------------------------------------------
// makePlotFramework: Create the plot container and axes
// -------------------------------------------------------
function makePlotFramework(divid, layout) {

    console.log('makePlotFramework');

    // Get the container div: we will store all variables as properties of this div
    // (for extension to multiple graphs per page)
    // some callers send this in already by dom element

    var gd = (typeof divid == 'string') ? document.getElementById(divid) : divid,
        $gd = $(gd),
        gd3 = d3.select(gd);

    // Test if this is on the main site or embedded
    gd.mainsite = $('#plotlyMainMarker').length > 0;

    // Test if the graph container div exists
    var hasGraphContainer = $gd.find('.plot-container').length > 0;

    // If it's on the mainsite, append the plot-container to file-and-comments container.
    // else, to gd.
    if (gd.mainsite) {
        var $fileAndComments = $gd.children('.file-and-comments');
        if (!hasGraphContainer) {
            $fileAndComments.prepend('<div class="plot-container"></div>');
        }
        $fileAndComments.children('.plot-container').addClass('is-mainsite');
    }
    else if (!hasGraphContainer) {
        $gd.append('<div class="plot-container"></div>');
    }

    // Save the graph container as a property of gd
    gd.graphContainer = gd3.select('.plot-container');

    // Make the svg container if it needs to be made
    var $svgContainer = $gd.find('.plot-container').children('.svg-container');

    if ($svgContainer.length == 1) {
        // Destroy any plot that already exists in this div
        $svgContainer.children('svg').remove();
    }
    else {
        // Make the svg container
        gd.paperdiv = gd.graphContainer.append('div')
            .classed('svg-container',true)
            .style('position','relative');
    }

    // Get the layout info - take the default and update it with any existing layout, then layout arg
    gd.layout=updateObject(gd.layout||defaultLayout(), layout||{});

    var gl = gd.layout;

    // Get subplots and see if we need to make any more axes
    var subplots = getSubplots(gd.data);
    subplots.forEach(function(sp) {
        var axmatch = sp.match(/^(x[0-9]*)(y[0-9]*)$/);
        [axmatch[1],axmatch[2]].forEach(function(axid) {
            var axname = axid.charAt(0)+'axis'+axid.substr(1);
            if(!gl[axname]) {
                gl[axname] = Plotly.Axes.defaultAxis({
                    range:[-1,6],
                    title:'Click to enter '+axmatch[1].toUpperCase()+' axis title'});
            }
        });
    });

    Plotly.Axes.setTypes(gd);

    // initial autosize
    if(gl.autosize=='initial') {
        setFileAndCommentsHeight(gd);
        plotAutoSize(gd,{});
        gl.autosize=true;
    }
    // Make the graph containers
    // the order here controls what's in front of what
    gd.paper = gd.paperdiv.append('svg')
        .attr('xmlns','http://www.w3.org/2000/svg')
        .attr('xmlns:xmlns:xlink','http://www.w3.org/1999/xlink'); // odd d3 quirk - need namespace twice??
    gd.plotbg = gd.paper.append('rect')
        .attr('stroke-width',0);
    gd.gridlayer = gd.paper.append('g').attr('class','gridlayer');
    gd.zerolinelayer = gd.paper.append('g').attr('class','zerolinelayer');
    // Second svg (plot) is for the data
    gd.plot = gd.paper.append('svg')
        .attr('preserveAspectRatio','none')
        .style('fill','none');
    gd.axlines = {
        x:gd.paper.append('path').style('fill','none').classed('crisp',true),
        y:gd.paper.append('path').style('fill','none').classed('crisp',true)
    };
    gd.axislayer = gd.paper.append('g').attr('class','axislayer');
    gd.draglayer = gd.paper.append('g').attr('class','draglayer');
    gd.infolayer = gd.paper.append('g').attr('class','infolayer');
    gd.hoverlayer = gd.paper.append('g').attr('class','hoverlayer');

    // position and style the containers, make main title
    layoutStyles(gd);

    // make the ticks, grids, and axis titles
    Plotly.Axes.doTicks(gd,'redraw');

    // make the axis drag objects and hover effects
    Plotly.Fx.init(gd);
}

// layoutStyles: styling for plot layout elements
function layoutStyles(gd) {
    var gl = gd.layout, xa = gl.xaxis, ya = gl.yaxis;

    Plotly.Heatmap.margin(gd); // check for heatmaps w/ colorscales, adjust margin accordingly

    // adjust margins for outside legends
    // gl.margin is the requested margin, gd.margin is after adjustment
    gd.margin = {
        l:gl.margin.l-(gd.lw<0 ? gd.lw : 0),
        r:gl.margin.r+(gd.lw>0 ? gd.lw : 0),
        t:gl.margin.t+(gd.lh>0 ? gd.lh : 0),
        b:gl.margin.b-(gd.lh<0 ? gd.lh : 0),
        p:gl.margin.pad };

    var gm = gd.margin;
    gd.plotwidth=gl.width-gm.l-gm.r;
    gd.plotheight=gl.height-gm.t-gm.b;
    xa._pixrange = gd.plotwidth;
    ya._pixrange = gd.plotheight;

    gd.paperdiv.style({width:gl.width+'px', height:gl.height+'px'});
    gd.paper.call(Plotly.Drawing.setSize, gl.width, gl.height);

    gd.paperdiv.style('background', gl.paper_bgcolor);

    gd.plotbg
        .call(Plotly.Drawing.setRect, gm.l-gm.p, gm.t-gm.p, gd.plotwidth+2*gm.p, gd.plotheight+2*gm.p)
        .call(Plotly.Drawing.fillColor, gl.plot_bgcolor);
    gd.plot
        .call(Plotly.Drawing.setRect, gm.l, gm.t, gd.plotwidth, gd.plotheight);

    var xlw = $.isNumeric(xa.linewidth) ? xa.linewidth : 1,
        ylw = $.isNumeric(ya.linewidth) ? ya.linewidth : 1,
        xp = gm.p+ylw,
        yp = gm.p, // shorten y axis lines so they don't overlap x axis lines
        yp2 = xa.mirror ? 0 : xlw; // except at the top when there's no mirror x
    gd.axlines.x
        .attr('d', 'M'+(gm.l-xp)+','+(gm.t+gd.plotheight+gm.p+xlw/2)+'h'+(gd.plotwidth+2*xp) +
            (xa.mirror ? ('m0,-'+(gd.plotheight+2*gm.p+xlw)+'h-'+(gd.plotwidth+2*xp)) : ''))
        .attr('stroke-width',xlw)
        .call(Plotly.Drawing.strokeColor,xa.showline ? xa.linecolor : 'rgba(0,0,0,0)');
    gd.axlines.y
        .attr('d', 'M'+(gm.l-gm.p-ylw/2)+','+(gm.t-yp-yp2)+'v'+(gd.plotheight+2*yp+yp2) +
            (ya.mirror ? ('m'+(gd.plotwidth+2*gm.p+ylw)+',0v-'+(gd.plotheight+2*yp+yp2)) : ''))
        .attr('stroke-width',ylw)
        .call(Plotly.Drawing.strokeColor,ya.showline ? ya.linecolor : 'rgba(0,0,0,0)');
    plots.titles(gd,'gtitle');

    Plotly.Fx.modeBar(gd);

    setGraphContainerScroll(gd);

    return gd;
}

// titles - (re)draw titles on the axes and plot
// title can be 'xtitle', 'ytitle', 'gtitle',
//  or empty to draw all
plots.titles = function(gd,title) {
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    if(!title) {
        plots.titles(gd,'xtitle');
        plots.titles(gd,'ytitle');
        plots.titles(gd,'gtitle');
        return;
    }
    var gl=gd.layout,gm=gd.margin,
        x,y,w,cont,name,font,fontSize,fontColor,transform='',attr={};
    if(title=='xtitle'){
        cont = gl.xaxis;
        name = 'X axis';
        font = gl.xaxis.titlefont.family || gl.font.family || 'Arial';
        fontSize = gl.xaxis.titlefont.size || (gl.font.size*1.2) || 14;
        fontColor = gl.xaxis.titlefont.color || gl.font.color || '#000';
        x = (gl.width+gm.l-gm.r)/2;
        y = gl.height+(gd.lh<0 ? gd.lh : 0) - 14*2.25;
        w = gd.plotwidth/2;
        h = 14;
    }
    else if(title=='ytitle'){
        cont = gl.yaxis;
        name = 'Y axis';
        font = gl.yaxis.titlefont.family || gl.font.family || 'Arial';
        fontSize = gl.yaxis.titlefont.size || (gl.font.size*1.2) || 14;
        fontColor = gl.yaxis.titlefont.color || gl.font.color || '#000';
        x = 40-(gd.lw<0 ? gd.lw : 0);
        y = (gl.height+gm.t-gm.b)/2;
        w = 14;
        h = gd.plotheight/2;
        transform = 'rotate(-90,x,y)';
        attr = {center: 0};
    }
    else if(title=='gtitle'){
        cont = gl;
        name = 'Plot';
        font = gl.titlefont.family || gl.font.family || 'Arial';
        fontSize = gl.titlefont.size || gl.font.size*1.4 || 16;
        fontColor = gl.titlefont.color || gl.font.color || '#000';
        x = gl.width/2;
        y = gl.margin.t/2;
        w = gl.width/2;
        h = 16;
    }

    gd.infolayer.select('.'+title).remove();
    var el=gd.infolayer.append('text').attr('class',title)
        .call(Plotly.Drawing.setPosition, x, y)
        .call(Plotly.Drawing.font,font,fontSize,fontColor)
        .attr('text-anchor','middle')
        .attr('transform',transform.replace('x',x).replace('y',y));
    // don't allow editing on embedded graphs
    if(gd.mainsite) { el.on('click',function(){ Plotly.Fx.autoGrowInput(this); }); }

    var txt=cont.title;
    if(txt.match(/^Click to enter (Plot |X axis |Y axis )?title$/)) {
        if(gd.mainsite) { el.style('fill','#999'); } // cues in gray
        else { txt=''; } // don't show cues in embedded plots
    }

    if(txt) {
        Plotly.Drawing.styleText(el.node(), txt + (!cont.unit ? '' : (' ('+cont.unit+')')),'clickable');
    }
    else if(gd.mainsite) {
        el.text('Click to enter '+name+' title')
            .style('opacity',0)
            .on('mouseover',function(){d3.select(this).transition().duration(100).style('opacity',1);})
            .on('mouseout',function(){d3.select(this).transition().duration(1000).style('opacity',0);})
          .transition()
            .duration(2000)
            .style('opacity',0);
    }
    else { el.remove(); }

    // move axis labels out of the way, if possible, when tick labels interfere
    if(title=='gtitle') { return; }
    var titlebb=el.node().getBoundingClientRect(),
        paperbb=gd.paperdiv.node().getBoundingClientRect(),
        lbb, tickedge;
    if(title=='xtitle'){
        tickedge=0;
        labels=gd.axislayer.selectAll('text.xtick').each(function(){
            lbb=this.getBoundingClientRect();
            if(Plotly.Lib.bBoxIntersect(titlebb,lbb)) {
                tickedge=Plotly.Lib.constrain(tickedge,lbb.bottom,paperbb.bottom-titlebb.height);
            }
        });
        if(tickedge>titlebb.top) {
            el.attr('transform','translate(0,'+(tickedge-titlebb.top)+') '+el.attr('transform'));
        }
    }
    else if(title=='ytitle'){
        tickedge=screen.width;
        gd.axislayer.selectAll('text.ytick').each(function(){
            lbb=this.getBoundingClientRect();
            if(Plotly.Lib.bBoxIntersect(titlebb,lbb)) {
                tickedge=Plotly.Lib.constrain(tickedge,paperbb.left+titlebb.width,lbb.left);
            }
        });
        if(tickedge<titlebb.right) {
            el.attr('transform','translate('+(tickedge-titlebb.right)+') '+el.attr('transform'));
        }
    }
};

// ----------------------------------------------------
// Utility functions
// ----------------------------------------------------

// getSubplots - extract all combinations of axes we need to make plots for
// as an array of items like 'xy', 'x2y', 'x2y2'...
// sorted by x (x,x2,x3...) then y

function getSubplots(data) {
    var subplots = [];
    (data||[]).forEach(function(d) {
        var subplot = (d.xaxis||'x')+(d.yaxis||'y');
        if(subplots.indexOf(subplot)==-1) { subplots.push(subplot); }
    });
    if(!subplots.length) { subplots = ['xy']; }
    var spmatch = /^x([0-9]*)y([0-9]*)$/;
    return subplots.filter(function(sp) { return sp.match(spmatch); })
        .sort(function(a,b) {
            var amatch = a.match(spmatch),
                bmatch = b.match(spmatch);
            if(!amatch) { return false; }
            if(!bmatch) { return true; }
            if(amatch[1]==bmatch[1]) { return Number(amatch[2]||0)>Number(bmatch[2]||0); }
            return Number(amatch[1]||0)>Number(bmatch[1]||0);
        });
}

// graphJson - jsonify the graph data and layout
plots.graphJson = function(gd, dataonly, mode){
    if(typeof gd == 'string') { gd = document.getElementById(gd); }
    var obj = { data:(gd.data||[]).map(function(v){ return stripObj(v,mode); }) };
    if(!dataonly) { obj.layout = stripObj(gd.layout,mode); }
    return JSON.stringify(obj);
};

// stripObj - used by graphJson to create a copy of an object, stripped as requested by mode.
// mode:
//      keepref (default): remove data for which there's a src present, ie if there's
//          xsrc present (and xsrc is well-formed, ie has : and some chars before it), strip out x
//      keepdata: remove all src tags, don't remove the data itself
//      keepall: keep data and src
// needs to recurse because some src can be inside sub-objects
// also strips out functions and private (start with _) elements
// so we can add temporary things to data and layout that don't get saved
function stripObj(d,mode) {
    if(typeof d == 'function') { return null; }
    if(!$.isPlainObject(d)) { return d; }

    var o={}, v;
    function s2(v2) { return stripObj(v2,mode); }
    for(v in d) {
        // remove private elements and functions - _ is for private, [ is a mistake ie [object Object]
        if(typeof d[v]=='function' || ['_','['].indexOf(v.charAt(0))!=-1) { continue; }
        // look for src/data matches and remove the appropriate one
        if(mode=='keepdata') {
            // keepdata: remove all ...src tags
            if(v.substr(v.length-3)=='src') { continue; }
        }
        else if(mode!='keepall') {
            // keepref: remove sourced data but only if the source tag is well-formed
            var src = d[v+'src'];
            if(typeof src=='string' && src.indexOf(':')>0) { continue; }
        }
        // OK, we're including this... recurse into objects, copy arrays
        if($.isPlainObject(d[v])) { o[v] = stripObj(d[v],mode); }
        else if($.isArray(d[v])) { o[v] = d[v].map(s2); }
        else { o[v] = d[v]; }
    }
    return o;
}

uoStack=[];
// updateObject: merge objects i and up recursively into a new object (o)
// one difference with $.extend is that we coerce updated values to numbers
// if the original value was a number
function updateObject(i,up) {
    if(!$.isPlainObject(up)) { return i; }
    var o = uoStack[uoStack.push({})-1], // seems like JS doesn't fully implement recursion... if I say o={} here then each level destroys the previous.
        key;
    for(key in i) { o[key]=i[key]; }
    for(key in up) {
        if($.isPlainObject(up[key])) {
            o[key]=updateObject($.isPlainObject(i[key]) ? i[key] : {}, up[key]);
        }
        // if the initial object had a number and the update can be a number, coerce it
        else if($.isNumeric(i[key]) && $.isNumeric(up[key])) { o[key] = Number(up[key]); }
        else { o[key] = up[key]; }
    }
    return uoStack.pop();
}

function alert_repl(func_name, data) {
    if (window.ws && window.ws.confirmedReady) {
        func = (func_name ? JSON.stringify(func_name) : 'None');
        data = JSON.stringify(data);
        send_invisible('hermes(' + func + ',' + data + ')');
    }
}

}()); // end Plots object definition

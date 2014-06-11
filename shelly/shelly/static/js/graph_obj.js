// Main plotting library - Creates the Plotly object and Plotly.Plots
(function() {
    'use strict';
    /* jshint camelcase: false */

    // ---Plotly global modules
    /* global Plotly:false, µ:false, micropolar:false,
        SceneFrame:false, Tabs:false, Examples:false */

    // ---global functions not yet namespaced
    /* global setFileAndCommentsSize:false, killPopovers:false,
        hidebox:false, litebox:false */

    // ---external global dependencies
    /* global Promise:false, d3:false */

    if(!window.Plotly) { window.Plotly = {}; }

    var plots = Plotly.Plots = {};

    // Most of the generic plotting functions get put into Plotly.Plots,
    // but some - the ones we want 3rd-party developers to use - go directly
    // into Plotly. These are:
    //   plot
    //   restyle
    //   relayout

    // IMPORTANT - default colors should be in hex for grid.js
    plots.defaultColors = [
        '#1f77b4', // muted blue
        '#ff7f0e', // safety orange
        '#2ca02c', // cooked asparagus green
        '#d62728', // brick red
        '#9467bd', // muted purple
        '#8c564b', // chestnut brown
        '#e377c2', // raspberry yogurt pink
        '#7f7f7f', // middle gray
        '#bcbd22', // curry yellow-green
        '#17becf' // blue-teal
    ];

    Plotly.colorscales = {
        'Greys':[[0,'rgb(0,0,0)'],[1,'rgb(255,255,255)']],

        'YIGnBu':[[0,'rgb(8, 29, 88)'],[0.125,'rgb(37, 52, 148)'],
            [0.25,'rgb(34, 94, 168)'],[0.375,'rgb(29, 145, 192)'],
            [0.5,'rgb(65, 182, 196)'],[0.625,'rgb(127, 205, 187)'],
            [0.75,'rgb(199, 233, 180)'],[0.875,'rgb(237, 248, 217)'],
            [1,'rgb(255, 255, 217)']],

        'Greens':[[0,'rgb(0, 68, 27)'],[0.125,'rgb(0, 109, 44)'],
            [0.25,'rgb(35, 139, 69)'],[0.375,'rgb(65, 171, 93)'],
            [0.5,'rgb(116, 196, 118)'],[0.625,'rgb(161, 217, 155)'],
            [0.75,'rgb(199, 233, 192)'],[0.875,'rgb(229, 245, 224)'],
            [1,'rgb(247, 252, 245)']],

        'YIOrRd':[[0,'rgb(128, 0, 38)'],[0.125,'rgb(189, 0, 38)'],
            [0.25,'rgb(227, 26, 28)'],[0.375,'rgb(252, 78, 42)'],
            [0.5,'rgb(253, 141, 60)'],[0.625,'rgb(254, 178, 76)'],
            [0.75,'rgb(254, 217, 118)'],[0.875,'rgb(255, 237, 160)'],
            [1,'rgb(255, 255, 204)']],

        'Bluered':[[0,'rgb(0,0,255)'],[1,'rgb(255,0,0)']],

        // modified RdBu based on
        // www.sandia.gov/~kmorel/documents/ColorMaps/ColorMapsExpanded.pdf
        'RdBu':[[0,'rgb(5, 10, 172)'],[0.35,'rgb(106, 137, 247)'],
            [0.5,'rgb(190,190,190)'],[0.6,'rgb(220, 170, 132)'],
            [0.7,'rgb(230, 145, 90)'],[1,'rgb(178, 10, 28)']],

        'Picnic':[[0,'rgb(0,0,255)'],[0.1,'rgb(51,153,255)'],
            [0.2,'rgb(102,204,255)'],[0.3,'rgb(153,204,255)'],
            [0.4,'rgb(204,204,255)'],[0.5,'rgb(255,255,255)'],
            [0.6,'rgb(255,204,255)'],[0.7,'rgb(255,153,255)'],
            [0.8,'rgb(255,102,204)'],[0.9,'rgb(255,102,102)'],
            [1,'rgb(255,0,0)']],

        'Rainbow':[[0,'rgb(150,0,90)'],[0.125,'rgb(0, 0, 200)'],
            [0.25,'rgb(0, 25, 255)'],[0.375,'rgb(0, 152, 255)'],
            [0.5,'rgb(44, 255, 150)'],[0.625,'rgb(151, 255, 0)'],
            [0.75,'rgb(255, 234, 0)'],[0.875,'rgb(255, 111, 0)'],
            [1,'rgb(255, 0, 0)']],

        'Portland':[[0,'rgb(12,51,131)'],[0.25,'rgb(10,136,186)'],
            [0.5,'rgb(242,211,56)'],[0.75,'rgb(242,143,56)'],
            [1,'rgb(217,30,30)']],

        'Jet':[[0,'rgb(0,0,131)'],[0.125,'rgb(0,60,170)'],
            [0.375,'rgb(5,255,255)'],[0.625,'rgb(255,255,0)'],
            [0.875,'rgb(250,0,0)'],[1,'rgb(128,0,0)']],

        'Hot':[[0,'rgb(0,0,0)'],[0.3,'rgb(230,0,0)'],
            [0.6,'rgb(255,210,0)'],[1,'rgb(255,255,255)']],

        'Blackbody':[[0,'rgb(0,0,0)'],[0.2,'rgb(230,0,0)'],
            [0.4,'rgb(230,210,0)'],[0.7,'rgb(255,255,255)'],
            [1,'rgb(160,200,255)']],

        'Earth':[[0,'rgb(0,0,130)'],[0.1,'rgb(0,180,180)'],
            [0.2,'rgb(40,210,40)'],[0.4,'rgb(230,230,50)'],
            [0.6,'rgb(120,70,20)'],[1,'rgb(255,255,255)']],

        'Electric':[[0,'rgb(0,0,0)'],[0.15,'rgb(30,0,100)'],
            [0.4,'rgb(120,0,100)'],[0.6,'rgb(160,90,0)'],
            [0.8,'rgb(230,200,0)'],[1,'rgb(255,250,220)']]
    };

    Plotly.defaultColorscale = Plotly.colorscales.RdBu;

    plots.getScale = function(scl) {
        if(!scl) { return Plotly.defaultColorscale; }
        else if(typeof scl === 'string') {
            try { scl = Plotly.colorscales[scl] || JSON.parse(scl); }
            catch(e) { return Plotly.defaultColorscale; }
        }
        // occasionally scl is double-JSON encoded...
        if(typeof scl === 'string') {
            try { scl = Plotly.colorscales[scl] || JSON.parse(scl); }
            catch(e) { return Plotly.defaultColorscale; }
        }
        return scl;
    };


    // add all of these colorscales to css dynamically,
    // so we don't have to keep them in sync manually
    // dynamic stylesheet, see http://davidwalsh.name/add-rules-stylesheets
    // css syntax from http://www.colorzilla.com/gradient-editor/
    (function() {
        //only on main site - though later we may expand to embeds
        if(!$('#plotlyMainMarker').length) { return; }

        var style = document.createElement('style');
        // WebKit hack :(
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
        var styleSheet = style.sheet;

        function addStyleRule(selector,styleString) {
            if(styleSheet.insertRule) {
                styleSheet.insertRule(selector+'{'+styleString+'}',0);
            }
            else if(styleSheet.addRule) {
                styleSheet.addRule(selector,styleString,0);
            }
            else { console.log('addStyleRule failed'); }
        }

        function pct(v){ return String(Math.round((1-v[0])*100))+'%';}

        for(var scaleName in Plotly.colorscales) {
            var scale = Plotly.colorscales[scaleName],
                list1 = '', // color1 0%, color2 12%, ...
                list2 = ''; // color-stop(0%,color1), color-stop(12%,color2) ...
            for(var i=scale.length-1; i>=0; i--) {
                list1 += ', '+scale[i][1]+' '+pct(scale[i]);
                list2 += ', color-stop('+pct(scale[i])+','+scale[i][1]+')';
            }
            var rule =
                // old browsers with no supported gradients -
                // shouldn't matter to us as they won't have svg anyway?
                'background: '+scale[scale.length-1][1]+';' +
                // FF 3.6+
                'background: -moz-linear-gradient(top'+list1+');' +
                // Chrome,Safari4+
                'background: -webkit-gradient(linear, left top, left bottom' +
                    list2 + ');' +
                // Chrome10+,Safari5.1+
                'background: -webkit-linear-gradient(top'+list1+');' +
                // Opera 11.10+
                'background: -o-linear-gradient(top'+list1+');' +
                // IE10+
                'background: -ms-linear-gradient(top'+list1+');' +
                // W3C
                'background: linear-gradient(to bottom'+list1+');' +
                // IE6-9 (only gets start and end colors)
                'filter: progid:DXImageTransform.Microsoft.gradient(' +
                    'startColorstr="' + scale[scale.length-1][1] +
                    '",endColorstr="'+scale[0][1]+'",GradientType=0);';
            addStyleRule('.'+scaleName,rule);
        }
    }());

    // default layout defined as a function rather than
    // a constant so it makes a new copy each time
    function defaultLayout(){
        return {title: 'Click to enter Plot title',
            xaxis: Plotly.Axes.defaultAxis({range: [-1,6]}),
            yaxis: Plotly.Axes.defaultAxis({range: [-1,4]}),
            legend: {
                bgcolor: '#fff',
                bordercolor: '#444',
                borderwidth: 0,
                font:{family: '', size: 0, color: ''},
                traceorder: 'normal'
            },
            width: 700,
            height: 450,
            autosize: 'initial', // after initial autosize reverts to true
            margin: {l:80,r:80,t:100,b:80,pad:0,autoexpand:true},
            paper_bgcolor: '#fff',
            plot_bgcolor: '#fff',
            barmode: 'group',
            bargap: 0.2,
            bargroupgap: 0.0,
            boxmode: 'overlay',
            boxgap: 0.3,
            boxgroupgap: 0.3,
            font: {
                family:'"Open sans", verdana, arial, sans-serif',
                size:12,
                color:'#444'
            },
            titlefont:{family:'',size:0,color:''},
            dragmode:'zoom',
            hovermode:'x',
            separators:'.,', // decimal then thousands
            hidesources:false,
            smith:false,
        };
    }

    // on initial data load into a plot, tweak the default layout
    // based on the incoming data type
    // but if newlayout has any given key, don't override it
    function tweakLayout(gd,newlayout) {
        newlayout = newlayout||{};
        gd.data.forEach(function(d) {
            var xa = Plotly.Axes.getFromId(gd,d.xaxis||'x'),
                ya = Plotly.Axes.getFromId(gd,d.yaxis||'y');
            if(plots.isHeatmap(d.type)) {
                if(!newlayout[xa._name] || !('ticks' in newlayout[xa._name])) {
                    xa.ticks = 'outside';
                }
                if(!newlayout[ya._name] || !('ticks' in newlayout[ya._name])) {
                    ya.ticks = 'outside';
                }
            }
            else if(plots.isBar(d.type) || d.type==='box') {
                var sa = (plots.isBar(d.type) && d.orientation==='h') ? ya : xa,
                    saNew = newlayout[sa._name];
                if(!saNew || !('showgrid' in saNew)) {
                    sa.showgrid = false;
                }
                if(!saNew || !('zeroline' in saNew)) {
                    sa.zeroline = false;
                }
            }
            if((plots.isBar(d.type) && gd.layout.barmode==='stack') ||
                    (d.type==='scatter' &&
                     ['tonextx','tonexty'].indexOf(d.fill)!==-1)) {
                if(!newlayout.legend || !('traceorder' in newlayout.legend)) {
                    gd.layout.legend.traceorder = 'reversed';
                }
            }
        });
    }

    var BARTYPES = ['bar','histogram'];
    plots.isBar = function(type) {
        return BARTYPES.indexOf(type)!==-1;
    };

    var HEATMAPTYPES = ['heatmap','histogram2d','contour','histogram2dcontour'];
    plots.isHeatmap = function(type) {
        return HEATMAPTYPES.indexOf(type) !== -1;
    };

    var CONTOURTYPES = ['contour','histogram2dcontour'];
    plots.isContour = function(type) {
        return CONTOURTYPES.indexOf(type) !== -1;
    };

    var HIST2DTYPES = ['histogram2d','histogram2dcontour'];
    plots.isHist2D = function(type) {
        return HIST2DTYPES.indexOf(type) !== -1;
    };

    var GL3DTYPES = ['scatter3d', 'surface'];
    plots.isGL3D = function(type) {
        return GL3DTYPES.indexOf(type) !== -1;
    };

    plots.newTab = function(divid, layout) {
        makeToolMenu(divid);
        return makePlotFramework(divid, layout);
    };

    // in some cases the browser doesn't seem to know how big
    // the text is at first, so it needs to draw it,
    // then wait a little, then draw it again
    plots.redrawText = function(gd) {
        // doesn't work presently (and not needed) for polar or 3d
        if(gd.layout._isGL3D || (gd.data && gd.data[0] && gd.data[0].r)) {
            return;
        }

        setTimeout(function(){
            Plotly.Annotations.drawAll(gd);
            Plotly.Legend.draw(gd,gd.layout.showlegend);
            gd.calcdata.forEach(function(d){
                if(d[0]&&d[0].t&&d[0].t.cb) { d[0].t.cb(); }
            });
        },300);
    };

    function makeToolMenu(divid) {
        // Get the container div: we store all variables for this plot as
        // properties of this div
        // some callers send this in by dom element, others by id (string)
        var gd = (typeof divid === 'string') ?
            document.getElementById(divid) : divid;
        // test if this is on the main site or embedded
        gd.mainsite = !!$('#plotlyMainMarker').length;
        if(gd.mainsite) {
            Plotly.ToolPanel.makeMenu(gd);
        }
    }

    // the 'view in plotly' and source links - note that now plot() calls this
    // so it can regenerate whenever it replots
    plots.addLinks = function(gd) {
        var linkContainer = gd.layout._paper
            .selectAll('text.js-plot-link-container')
                .data([0]);
        linkContainer.enter().append('text')
            .classed('js-plot-link-container',true)
            .attr({
                'text-anchor':'end',
                x:gd.layout._paper.attr('width')-7,
                y:gd.layout._paper.attr('height')-9
            })
            .style({
                'font-family':'"Open Sans",Arial,sans-serif',
                'font-size':'12px',
                'fill':'#444'
            })
            .each(function(){
                var links = d3.select(this);
                links.append('tspan').classed('js-link-to-tool',true);
                links.append('tspan').classed('js-link-spacer',true);
                links.append('tspan').classed('js-sourcelinks',true);
            });

        var toolspan = linkContainer.select('.js-link-to-tool'),
            spacespan = linkContainer.select('.js-link-spacer'),
            sourcespan = linkContainer.select('.js-sourcelinks');

        // data source links
        Plotly.Lib.showSources(gd);

        // public url for downloaded files
        if(gd.layout && gd.layout._url) { toolspan.text(gd.layout._url); }
        // 'view in plotly' link for embedded plots
        else if(!gd.mainsite && !gd.standalone &&
                !$('#plotlyUserProfileMarker').length) {
            positionBrand(gd,toolspan);
        }

        // separator if we have both sources and tool link
        spacespan.text((toolspan.text() && sourcespan.text()) ? ' - ' : '');
    };

    // note that now this function is only adding the brand in
    // iframes and 3rd-party apps, standalone plots get the sidebar instead.
    function positionBrand(gd,container){
        container.text('');
        container.append('tspan')
            .style({'font-size':'11px'})
            .text('plotly - ');
        var link = container.append('a')
            .attr({
                'xlink:xlink:href': '#',
                'class': 'link--impt link--embedview',
                'font-weight':'bold'
            })
            .text('data and graph '+String.fromCharCode(187));

        if(gd.shareplot) {
            var path=window.location.pathname.split('/');
            link.attr({
                'xlink:xlink:show': 'new',
                'xlink:xlink:href': '/'+path[1]+'/'+path[2]
            });
        }
        else {
            link.on('click',function(){
                $(gd).trigger('plotly_beforeexport');
                var hiddenform = $(
                    '<div id="hiddenform" style="display:none;">' +
                    '<form action="https://plot.ly/external" ' +
                        'method="post" target="_blank">'+
                    '<input type="text" name="data" /></form></div>'
                ).appendTo(gd);
                // somehow we need to double escape characters for this purpose.
                // and escape single quote because we'll use it at the end
                hiddenform.find('input').val(
                    plots.graphJson(gd,false,'keepdata')
                        .replace(/\\/g,'\\\\').replace(/'/g,'\\\''));
                hiddenform.find('form').submit();
                hiddenform.remove();
                $(gd).trigger('plotly_afterexport');
                return false;
            });
        }
    }

    // ----------------------------------------------------
    // Main plot-creation function. Note: will call makePlotFramework
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

        // Get the container div: we store all variables for this plot as
        // properties of this div
        // some callers send this in by dom element, others by id (string)
        if(typeof gd === 'string') { gd = document.getElementById(gd); }
        // test if this is on the main site or embedded
        gd.mainsite = Boolean($('#plotlyMainMarker').length);

        // layout object --- this also gets checked in makePlotFramework
        if (!layout) layout = {};

        // hook class for plots main container (in case of plotly.js
        // this won't be #embedded-graph or .js-tab-contents)
        d3.select(gd).classed('js-plotly-plot',true);

        // collect promises for any async actions during plotting
        // any part of the plotting code can push to gd._promises, then
        // before we move to the next step, we check that they're all
        // complete, and empty out the promise list again.
        gd._promises = [];

        // if there is already data on the graph, append the new data
        // if you only want to redraw, pass a non-array for data
        var graphwasempty = ((typeof gd.data==='undefined') && $.isArray(data));
        if($.isArray(data)) {
            /*
             * Enforce unique IDs
             */
            var suids = []; // seen uids --- so we can weed out incoming repeats
            var uids = data
                       .filter( function (d) { return 'uid' in d; } )
                       .map( function (d) { return d.uid; });

            if (!graphwasempty) {
                uids = uids.concat(
                        gd.data
                        .filter( function (d) { return 'uid' in d; } )
                        .map( function (d) { return d.uid; })
                );
            }

            // make a few changes to the data right away
            // before it gets used for anything
            data.forEach(function(c,ci) {
                // assign uids to each trace and detect collisions.
                if (!('uid' in c) || suids.indexOf(c.uid) !== -1) {
                    var newUid, i;
                    for(i=0; i<100; i++) {
                        newUid = Plotly.Lib.randstr(uids);
                        if(suids.indexOf(newUid)===-1) { break; }
                    }
                    c.uid = Plotly.Lib.randstr(uids);
                    uids.push(c.uid);
                }
                // keep track of already seen uids, so that if there are
                // doubles we force the trace with a repeat uid to
                // acquire a new one
                suids.push(c.uid);

                // BACKWARD COMPATIBILITY FIXES FOR TRACE STYLING

                // use xbins to bin data in x, and ybins to bin data in y
                if(c.type==='histogramy' && 'xbins' in c && !('ybins' in c)) {
                    c.ybins = c.xbins;
                    delete c.xbins;
                }

                // error_y.opacity is obsolete - merge into color
                if(c.error_y && 'opacity' in c.error_y) {
                    var dc = plots.defaultColors,
                        yeColor = c.error_y.color ||
                        (plots.isBar(c.type) ? '#444' : dc[ci % dc.length]);
                    c.error_y.color = Plotly.Drawing.addOpacity(
                        Plotly.Drawing.rgb(yeColor),
                        Plotly.Drawing.opacity(yeColor) * c.error_y.opacity);
                    delete c.error_y.opacity;
                }

                // convert bardir to orientation, and put the data into
                // the axes it's eventually going to be used with
                if('bardir' in c) {
                    if(c.bardir==='h' && (plots.isBar(c.type) ||
                             c.type.substr(0,9)==='histogram')) {
                        c.orientation = 'h';
                        swapxydata(c);
                    }
                    delete c.bardir;
                }

                // now we have only one 1D histogram type, and whether
                // it uses x or y data depends on c.orientation
                if(c.type==='histogramy') { swapxydata(c); }
                if(c.type==='histogramx' || c.type==='histogramy') {
                    c.type = 'histogram';
                }

                // scl->scale, reversescl->reversescale
                if('scl' in c) {
                    c.colorscale = c.scl;
                    delete c.scl;
                }
                if('reversescl' in c) {
                    c.reversescale = c.reversescl;
                    delete c.reversescl;
                }
            });

            if(graphwasempty) { gd.data=data; }
            else { gd.data.push.apply(gd.data,data); }

            // for routines outside graph_obj that want a clean tab
            // (rather than appending to an existing one) gd.empty
            // is used to determine whether to make a new tab
            gd.empty=false;
        }

        // Polar plots
        // Check if it has a polar type
        if(data && data[0] && data[0].type &&
                data[0].type.indexOf('Polar') !== -1){
            console.log('This polar chart uses a deprecated pre-release API');
            return null;
        }
        if(data && data[0] && data[0].r){

            // build or reuse the container skeleton
            var plotContainer = d3.select(gd).selectAll('.plot-container')
                .data([0]);
            plotContainer.enter()
                .insert('div', ':first-child')
                .classed('plot-container plotly', true);
            var paperDiv = plotContainer.selectAll('.svg-container')
                .data([0]);
            paperDiv.enter().append('div')
                .classed('svg-container',true)
                .style('position','relative');

            // empty it everytime for now
            paperDiv.html('');

            // fulfill gd requirements
            if(data) gd.data = data;
            gd.layout = layout;
            gd.layout._container = plotContainer;
            gd.layout._paperdiv = paperDiv;
            if(gd.layout.autosize === 'initial' && gd.mainsite) {
                plotAutoSize(gd,{});
                gd.layout.autosize = true;
            }
            // resize canvas
            paperDiv.style({
                width: (layout.width || 800) + 'px',
                height: (layout.height || 600) + 'px',
                background: (layout.paper_bgcolor || 'white')
            });

            // instantiate framework
            gd.framework = micropolar.manager.framework();
            //get rid of gd.layout stashed nodes
            layout = µ.util.deepExtend({}, gd.layout);
            delete layout._container;
            delete layout._paperdiv;
            delete layout.autosize;
            delete layout._paper;
            delete layout._forexport;

            // plot
            gd.framework({data: gd.data, layout: layout}, paperDiv.node());

            // set undo point
            gd.framework.setUndoPoint();

            // get the resulting svg for extending it
            var polarPlotSVG = gd.framework.svg();

            // editable title
            var opacity = 1;
            var txt = gd.layout.title;
            if(txt === '' || !txt) opacity = 0;
            var placeholderText = 'Click to enter title';

            var titleLayout = function(){
                this.call(Plotly.util.convertToTspans);
                //TODO: html/mathjax
                //TODO: center title
            };

            var title = polarPlotSVG.select('.title-group text')
                .call(titleLayout);

            if(gd.mainsite && !gd.layout._forexport){
                title.attr({'data-unformatted': txt});
                if(!txt || txt === placeholderText){
                    opacity = 0.2;
                    title.attr({'data-unformatted': placeholderText})
                        .text(placeholderText)
                        .style({opacity: opacity})
                        .on('mouseover.opacity',function(){
                            d3.select(this).transition().duration(100)
                                .style('opacity',1);
                        })
                        .on('mouseout.opacity',function(){
                            d3.select(this).transition().duration(1000)
                                .style('opacity',0);
                        });
                }

                var setContenteditable = function(){
                    this.call(Plotly.util.makeEditable)
                        .on('edit', function(text){
                            gd.framework({layout: {title: text}});
                            this.attr({'data-unformatted': text})
                                .text(text)
                                .call(titleLayout);
                            this.call(setContenteditable);
                        })
                        .on('cancel', function(){
                            var txt = this.attr('data-unformatted');
                            this.text(txt).call(titleLayout);
                        });
                };
                title.call(setContenteditable);

                gd.layout._paperdiv = paperDiv;

                Plotly.ToolPanel.tweakMenu();
            }

            // fulfill more gd requirements
            gd.layout._paper = polarPlotSVG;
            plots.addLinks(gd);

            return Promise.resolve();
        }

        else if(gd.mainsite) Plotly.ToolPanel.tweakMenu();

        // so we don't try to re-call Plotly.plot from inside
        // legend and colorbar, if margins changed
        gd._replotting = true;

        // Make or remake the framework (ie container and axes) if we need to
        // note: if they container already exists and has data,
        //  the new layout gets ignored (as it should)
        //  but if there's no data there yet, it's just a placeholder...
        //  then it should destroy and remake the plot
        if (gd.data && gd.data.length > 0) {

            // DETECT 3D
            // needed to do this before makePlotFramework to set up the modebar
            // needed to put the bulk of the 3d setup after makePlotFramework
            // as it requires framework to be set
            if (gd.data.some(function (d) {
                return plots.isGL3D(d.type);
            })) {
                layout._isGL3D = true;
            }


            var subplots = Plotly.Axes.getSubplots(gd).join(''),
                oldSubplots = ((gd.layout && gd.layout._plots) ?
                    Object.keys(gd.layout._plots) : []).join('');
            if(!gd.framework || gd.framework!==makePlotFramework ||
                    !gd.layout || graphwasempty || (oldSubplots!==subplots)) {
                gd.framework = makePlotFramework;
                makePlotFramework(gd,layout);
            }
        }
        else if((typeof gd.layout==='undefined')||graphwasempty) {
            makePlotFramework(gd, layout);
        }

        // now tweak the layout if we're adding the initial data to the plot
        if(graphwasempty && gd.data && gd.data.length>0) {
            tweakLayout(gd,layout);
        }

        // enable or disable formatting buttons
        $(gd).find('.data-only').attr('disabled',
            !gd.data || gd.data.length===0);

        var gl = gd.layout,
            curvetype;


        ////////////////////////////////  3D   ///////////////////////////////

        if (gl._isGL3D) {
            /*
             * Once Webgl plays well with other things we can remove this.
             * Unset examples, they misbehave with 3d plots
             */
            var $examplesContainer = $(gd).find('.examples-container');
            if ($examplesContainer.css('display') === 'block') {
                Examples.set();
            }


            // tie modebar into all iframes
            var modebar =  $(gd).find('.svg-container .modebar')[0];
            SceneFrame.reconfigureModeBar(gd.layout, modebar);

            /*
             * Reset all SceneFrame positions (for now just
             * set width % as viewport x ratio)
             * In case this is a redraw from a resize
             */
            gd.data
            .filter( function (d) { return plots.isGL3D(d.type); } )
            .forEach( function (d) {

                var sceneTemplate = {
                    _glx: null,
                    _dataQueue: [], // for asyncronously loading data
                    domain: {x:[0,1],y:[0,1]}, // default domain
                    _loading: false
                };
              // This following code inserts test data if no data is present
              // remove after completion
                if (!Array.isArray(d.z)) {
                    $.extend(d, SceneFrame.testData(d.type,
                        120, 120, [40,40,40]));
                }

                /*
                 * Scene numbering proceeds as follows
                 * scene
                 * scene2
                 * scene3
                 *
                 * and d.scene will be undefined or some number or number string
                 */
                var destScene = 'scene';
                if (d.scene && $.isNumeric(d.scene) && d.scene > 1) {
                    destScene += d.scene;
                }

                /*
                 * In the case existing scenes are active in this tab:
                 * If data has a destination scene attempt to match that to the
                 * associated scene.
                 * If a particular data trace also has a glID. It means the
                 * surface or mesh for this data trace has already been drawn
                 * and we can just do an update. (this is handled inside scene.js)
                 */
                var scene = gl[destScene] || {};

                if ('_glx' in scene && scene._glx) {
                    // you can change the camera position before or
                    // after initializing data or accept defaults
                    scene._glx.draw(d, d.type);
                    scene._glx.axisOn();
                }
                else {
                    /*
                     * Inflate scene object and add defaults
                     */
                    Object.keys(sceneTemplate).forEach( function (key) {
                        if (key in scene) return;
                        else scene[key] = sceneTemplate[key];
                    });

                    gl[destScene] = scene;
                    scene.id = gd.id + '-' + destScene;
                    scene._dataQueue.push(d);
                }
            });

            /*
             * If there are scenes that need loading load them.
             * Recalibrate all domains now that there may be new scenes.
             * Once scenes load they will iteratively load any data
             * that might be on their queue.
             *
             * scene arrangements need to be implemented: For now just splice
             * along the horizontal direction. ie.
             * x:[0,1] -> x:[0,0.5], x:[0.5,1] ->
             *     x:[0, 0.333] x:[0.333,0.666] x:[0.666, 1]
             *
             */
            var scenes = Object.keys(gl).filter(function(k){
                return k.match(/^scene[0-9]*$/);
            });

            scenes.map( function (sceneKey, idx) {
                var scene = gl[sceneKey];
                // we are only modifying the x domain position with this
                // simple approach
                scene.domain.x = [idx/scenes.length, (idx+1)/scenes.length];

                // if this scene has already been loaded it will have it's glx
                // context parameter so lets reset the domain of the scene as
                // it may have changed (this operates on the containing iframe)
                if (scene._glx) scene._glx.setPosition(scene.domain);
                return scene;
            })
            .filter( function (scene) {
                /*
                 * We only want to continue to operate on scenes that have
                 * data waiting to be displayed and are themselves not
                 * already undergoing loading.
                 */
                if (scene && scene._dataQueue.length && !scene._loading) {
                    scene._loading = true;
                    return true;
                }
                return false;
            })
            .forEach( function (scene) {
                /*
                 * Creating new scenes
                 */
                var sceneOptions = {
                    container: gd.querySelector('.svg-container'),
                    zIndex: '1000',
                    id: scene.id
                };

                SceneFrame.createScene(sceneOptions, function (glx) {
                    scene._loading = false; // loaded

                    glx.setPosition(scene.domain);

                    while (scene._dataQueue.length) {
                        var d = scene._dataQueue.shift();
                        glx.draw(d, d.type);
                    }
                    /*
                     * Calling glx.axisOn when it is already on will update it
                     * to include any changes to the boundaries of the drawn
                     * objects (autoscaling).
                     */
                    glx.axisOn({textScale: 0.4});

                    scene._glx = glx;
                });
            });
        }

        ///////////////////////////////  end of 3D   ///////////////////////




        /*
         * Plotly.plot shortCircuit for 3d
         */
        if (gl._isGL3D) {

            gl._paperdiv.style({
                width: gl.width+'px',
                height: gl.height+'px',
                background: gl.paper_bgcolor
            });

            gd.calcdata = [];
            return Promise.resolve();
        }

        // prepare the types and conversion functions for the axes
        // also clears the autorange bounds ._min, ._max
        Plotly.Axes.setTypes(gd);

        // prepare the data and find the autorange

        Plotly.Lib.markTime('done Plotly.Axes.setType');

        // generate calcdata, if we need to
        // to force redoing calcdata, just delete it before calling Plotly.plot
        var recalc = !gd.calcdata || gd.calcdata.length!==(gd.data||[]).length;
        if(recalc) {
            gd.calcdata = [];
            gd._modules = [];

            // extra helper variables
            // firstscatter: fill-to-next on the first trace goes to zero
            gd.firstscatter = true;
            // how many box plots do we have (in case they're grouped)
            gd.numboxes = 0;
            // for calculating avg luminosity of heatmaps
            gd.hmpixcount = 0;
            gd.hmlumcount = 0;
            // delete category list, if there is one, so we start over
            // to be filled in later by ax.d2c
            Plotly.Axes.list(gd).forEach(function(ax){ ax._categories = []; });
            for(var curve in gd.data) {
                // curve is the index, gdc is the data object for one trace
                var gdc = gd.data[curve],
                    isPolar = 'r' in gdc,
                    module = '',
                    cd = [];
                curvetype = gdc.type || 'scatter'; //default type is scatter
                // don't let type be blank...
                // may want to go further and enforce known types?
                gdc.type = curvetype;

                if(isPolar) {
                    console.log('Oops, tried to put a polar trace of type ' +
                        gdc.type + ' on an incompatible graph of cartesian ' +
                        gd.data[0].type + ' data. Ignoring this dataset.'
                    );
                    gd.calcdata.push([{x:false, y:false}]);
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

                // figure out which module plots this data
                if(curvetype==='scatter') { module = 'Scatter'; }
                else if(plots.isBar(curvetype)) { module = 'Bars'; }
                else if(plots.isContour(curvetype)) { module = 'Contour'; }
                else if(plots.isHeatmap(curvetype)) { module = 'Heatmap'; }
                else if(curvetype==='box') { module = 'Boxes'; }

                if(module) { cd = Plotly[module].calc(gd,gdc); }
                else { console.log('unrecognized trace type: ' +curvetype); }

                if(!('line' in gdc)) { gdc.line = {}; }
                if(!('marker' in gdc)) { gdc.marker = {}; }
                if(!('line' in gdc.marker)) { gdc.marker.line = {}; }
                if(!('textfont' in gdc)) { gdc.textfont = {}; }

                // make sure there is a first point
                if(!$.isArray(cd) || !cd[0]) { cd = [{x: false, y: false}]; }

                // add the trace-wide properties to the first point,
                // per point properties to every point
                // t is the holder for trace-wide properties
                if(!cd[0].t) { cd[0].t = {}; }
                // store the gd.data curve number that gave this trace
                cd[0].t.curve = curve;
                // store the calcdata curve number we're in - should be the same
                cd[0].t.cdcurve = gd.calcdata.length;
                // store the module for this trace, for use later by plotting
                cd[0].t.module = module;
                // save which modules we're using, for fast plotting / styling
                if(gd._modules.indexOf(module)===-1) {
                    gd._modules.push(module);
                }

                gd.calcdata.push(cd);
                Plotly.Lib.markTime('done with calcdata for '+curve);
            }
        }

        // put the styling info into the calculated traces
        // has to be done separate from applyStyles so we know the mode
        // (ie which objects to draw)
        // and has to be before stacking so we get orientation, type, visible
        plots.setStyles(gd);
        Plotly.Lib.markTime('done setstyles');

        /*
         * start async-friendly code - now we're actually drawing things
         */

        var oldmargins = JSON.stringify(gl._size);

        // draw anything that can affect margins.
        // currently this is legend and colorbars
        function marginPushers() {
            Plotly.Legend.draw(gd, gl.showlegend ||
                (gd.calcdata.length>1 && gl.showlegend!==false));
            gd.calcdata.forEach(function(cd) {
                var t = cd[0].t;
                if(t.visible===false || !plots.isHeatmap(t.type)) {
                    plots.autoMargin(gd,'cb'+t.curve);
                }
                else {
                    Plotly[t.module].colorbar(gd,cd);
                }
            });
            doAutoMargin(gd);
            return previousPromises(gd);
        }

        function marginPushersAgain(){
            // in case the margins changed, draw margin pushers again
            var seq = JSON.stringify(gl._size)===oldmargins ?
                [] : [marginPushers];
            return Plotly.Lib.syncOrAsync(seq.concat(Plotly.Fx.init),gd);
        }

        function positionAndAutorange(){
            if(recalc) {
                // position and range calculations for traces that
                // depend on each other ie bars (stacked or grouped)
                // and boxes (grouped) push each other out of the way
                Plotly.Axes.getSubplots(gd).forEach(function(subplot) {
                    var plotinfo = gd.layout._plots[subplot];
                    gd._modules.forEach(function(module) {
                        if(Plotly[module].setPositions) {
                            Plotly[module].setPositions(gd,plotinfo);
                        }
                    });
                });

                Plotly.Lib.markTime('done with bar/box adjustments');

                // calc and autorange for errorbars
                Plotly.ErrorBars.calc(gd);
                Plotly.Lib.markTime('done Plotly.ErrorBars.calc');

                // autorange for annotations
                Plotly.Annotations.calcAutorange(gd);
                // TODO: autosize extra for text markers

                return Plotly.Lib.syncOrAsync([
                    previousPromises,
                    doAutoRange
                ], gd);
            }
        }

        function doAutoRange(){
            Plotly.Axes.list(gd).forEach(function(ax) {
                Plotly.Axes.doAutoRange(ax);
                if(!$.isNumeric(ax._m) || !$.isNumeric(ax._b)) {
                    Plotly.Lib.notifier(
                        'Something went wrong with axis scaling',
                        'long');
                    gd._replotting = false;
                    throw new Error('axis scaling');
                }
            });
        }

        function drawAxes(){
            // draw ticks, titles, and calculate axis scaling (._b, ._m)
            return Plotly.Axes.doTicks(gd,'redraw');
        }

        function drawData(){
            // Now plot the data

            // in case of traces that were heatmaps or contour maps
            // previously, remove them and their colorbars explicitly
            gd.calcdata.forEach(function(cd) {
                if(plots.isHeatmap(cd[0].t.type)) { return; }
                var i = cd[0].t.cdcurve;
                gl._paper.selectAll('.hm'+i+',.contour'+i+',.cb'+i)
                    .remove();
            });

            Plotly.Axes.getSubplots(gd).forEach(function(subplot) {
                var plotinfo = gd.layout._plots[subplot],
                    cdSubplot = gd.calcdata.filter(function(cd) {
                        var t = cd[0].t;
                        return (t.xaxis||'x') + (t.yaxis||'y')===subplot;
                    }),
                    cdError = [];

                // remove old traces, then redraw everything
                // TODO: use enter/exit appropriately in the plot functions
                // so we don't need this - should sometimes be a big speedup
                plotinfo.plot.selectAll('g.trace').remove();

                gd._modules.forEach(function(module) {
                    // plot all traces of this type on this subplot at once
                    var cdmod = cdSubplot.filter(function(cd){
                        return cd[0].t.module===module;
                    });
                    Plotly[module].plot(gd,plotinfo,cdmod);
                    Plotly.Lib.markTime('done '+module);

                    // collect the traces that may have error bars
                    if(['Scatter','Bars'].indexOf(module)!==-1) {
                        cdError = cdError.concat(cdmod);
                    }
                });
                // finally do all error bars at once
                Plotly.ErrorBars.plot(gd,plotinfo,cdError);
                Plotly.Lib.markTime('done ErrorBars');
            });

            //styling separate from drawing
            applyStyle(gd);
            Plotly.Lib.markTime('done applyStyle');

            // show annotations
            Plotly.Annotations.drawAll(gd);

            // source links
            plots.addLinks(gd);

            return previousPromises(gd);
        }

        function cleanUp(){
            // now we're REALLY TRULY done plotting...
            // so mark it as done and let other procedures call a replot
            gd._replotting = false;
            Plotly.Lib.markTime('done plot');
        }

        var donePlotting = Plotly.Lib.syncOrAsync([
            previousPromises,
            marginPushers,
            layoutStyles,
            marginPushersAgain,
            positionAndAutorange,
            drawAxes,
            drawData
        ], gd, cleanUp);

        // even if everything we did was synchronous, return a promise
        // so that the caller doesn't care which route we took
        return (donePlotting && donePlotting.then) ?
            donePlotting : Promise.resolve() ;
    };

    // for use in Plotly.Lib.syncOrAsync, check if there are any
    // pending promises in this plot and wait for them
    function previousPromises(gd){
        if(gd._promises.length) {
            return Promise.all(gd._promises)
                .then(function(){ gd._promises=[]; });
        }
    }

    // convenience function to force a full redraw, mostly for use by plotly.js
    Plotly.redraw = function(gd) {
        gd.calcdata = undefined;
        Plotly.plot(gd);
    };

    // setStyles: translate styles from gd.data to gd.calcdata,
    // filling in defaults for missing values and breaking out
    // arrays to individual points
    // if mergeDefault, then apply the default value into gd.data...
    // used for saving themes
    plots.setStyles = function(gd, mergeDefault) {
        if(typeof gd === 'string') { gd = document.getElementById(gd); }

        var i,j,l,p,prop,val,cd,t,c,gdc,defaultColor;

        // merge object a[k] (which may be an array or a single value)
        // from gd.data into calcdata
        // search the array defaults in case a[k] is missing
        // (and for a default val if some points of o are missing from a)
        // nosplit option - used for colorscales because they're
        // arrays but shouldn't be treated as per-point objects
        function mergeattr(k,attr,dflt,nosplit) {
            // instead of 4 separate arguments, can pass one object
            if(typeof k==='object') {
                attr = k.cdAttr;
                dflt = k.dflt;
                nosplit = k.nosplit;
                k = k.dataAttr;
            }
            prop = Plotly.Lib.nestedProperty(gdc,k);
            val = prop.get();

            if($.isArray(val) && !nosplit) {
                l = Math.min(cd.length,val.length);
                for(p=0; p<l; p++) { cd[p][attr]=val[p]; }
                // use the default for the trace-wide value,
                // in case individual vals are missing
                cd[0].t[attr] = dflt;
                // record that we have an array here
                // styling system wants to know about it
                cd[0].t[attr+'array'] = true;
            }
            else {
                cd[0].t[attr] = (typeof val !== 'undefined') ? val : dflt;
                if(mergeDefault && typeof val === 'undefined'){
                    prop.set(dflt);
                }
            }
        }

        // merge an array of attributes, coming from a defaults() call
        function mergeattrs(a) {
            a.forEach(function(o) { mergeattr(o); });
        }

        // to reverse a colorscale
        function flipScale(si){ return [1-si[0],si[1]]; }

        for(i in gd.calcdata){
            cd = gd.calcdata[i]; // trace plus styling
            t = cd[0].t; // trace styling object
            c = t.curve; // trace number
            gdc = gd.data[c];
            defaultColor = plots.defaultColors[c % plots.defaultColors.length];
            // record in t which data arrays we have for this trace
            // other arrays, like marker size, are recorded as such in mergeattr
            // this is used to decide which options to display for styling
            t.xarray = $.isArray(gdc.x);
            t.yarray = $.isArray(gdc.y);
            t.zarray = $.isArray(gdc.z);
            // all types have attributes type, visible, opacity, name, text
            // mergeattr puts single values into cd[0].t,
            // and all others into each individual point
            mergeattr('type','type','scatter');
            mergeattr('visible','visible',true);
            mergeattr('showlegend','showlegend',true);
            mergeattr('opacity','op',1);
            mergeattr('text','tx','');
            mergeattr('name','name','trace '+c);
            mergeattr('error_y.visible','ye_vis',gdc.error_y &&
                ('array' in gdc.error_y || 'value' in gdc.error_y));
            mergeattr('error_x.visible','xe_vis',gdc.error_x &&
                ('array' in gdc.error_x || 'value' in gdc.error_x));
            // mergeattr is unnecessary and insufficient for (x|y)axis
            // because '' shouldn't count as existing
            t.xaxis = gdc.xaxis||'x';
            t.yaxis = gdc.yaxis||'y';
            var type = t.type; // like 'bar'

            if(t.ye_vis){
                mergeattr('error_y.type','ye_type',
                    ('array' in gdc.error_y) ? 'data' : 'percent');
                mergeattr('error_y.symmetric','ye_sym',
                    !((t.ye_type==='data' ? 'arrayminus' : 'valueminus') in
                        gdc.error_y));
                mergeattr('error_y.value','ye_val',10);
                mergeattr('error_y.valueminus','ye_valminus',10);
                mergeattr('error_y.traceref','ye_tref',0);
                mergeattr('error_y.tracerefminus','ye_trefminus',0);
                mergeattr('error_y.color','ye_clr',
                    plots.isBar(t.type) ? '#444' : defaultColor);
                mergeattr('error_y.thickness','ye_tkns', 2);
                mergeattr('error_y.width','ye_w', 4);
            }
            if(t.xe_vis){
                mergeattr('error_x.type','xe_type',
                    ('array' in gdc.error_x) ? 'data' : 'percent');
                mergeattr('error_x.symmetric','xe_sym',
                    !((t.xe_type==='data' ? 'arrayminus' : 'valueminus') in
                        gdc.error_x));
                mergeattr('error_x.value','xe_val',10);
                mergeattr('error_x.valueminus','xe_valminus',10);
                mergeattr('error_x.traceref','xe_tref',0);
                mergeattr('error_x.tracerefminus','xe_trefminus',0);
                mergeattr('error_x.copy_ystyle','xe_ystyle',
                    (gdc.error_x.color || gdc.error_x.thickness ||
                        gdc.error_x.width) ? false : true);
                var xsLetter = t.xe_ystyle!==false ? 'y' : 'x';
                mergeattr('error_'+xsLetter+'.color','xe_clr',
                    plots.isBar(t.type) ? '#444' : defaultColor);
                mergeattr('error_'+xsLetter+'.thickness','xe_tkns', 2);
                mergeattr('error_'+xsLetter+'.width','xe_w', 4);
            }

            if(['scatter','box'].indexOf(type)!==-1){
                mergeattr('line.color','lc',gdc.marker.color || defaultColor);
                mergeattr('line.width','lw',2);
                mergeattr('marker.symbol','mx','circle');
                mergeattr('marker.opacity','mo',
                    $.isArray(gdc.marker.size) ? 0.7 : 1);
                mergeattr('marker.size','ms',6);
                mergeattr('marker.color','mc',t.lc);
                mergeattr('marker.line.color','mlc',
                    ((t.lc!==t.mc) ? t.lc :
                        ($.isArray(gdc.marker.size) ? '#fff' :'#444')));
                mergeattr('marker.line.width','mlw',
                    $.isArray(gdc.marker.size) ? 1 : 0);
                mergeattr('fill','fill','none');
                mergeattr('fillcolor','fc',Plotly.Drawing.addOpacity(t.lc,0.5));
                // even if sizeref and sizemode are set,
                // don't use them outside bubble charts
                t.msr=1;
                t.msm = 'diameter';

                if(type==='scatter') {
                    var defaultMode = 'lines';
                    if(cd.length<Plotly.Scatter.PTS_LINESONLY ||
                            (typeof gdc.mode !== 'undefined')) {
                        defaultMode = 'lines+markers';
                    }
                    // check whether there are orphan points,
                    // then show markers by default
                    // regardless of length - but only if <10000 points
                    else if(cd.length<10000) {
                        var cdl = cd.length-1;
                        for(j=0; j<=cdl; j++) {
                            if($.isNumeric(cd[j].x) && $.isNumeric(cd[j].y) &&
                                    (j===0 || !$.isNumeric(cd[j-1].x) ||
                                      !$.isNumeric(cd[j-1].y)) &&
                                    (j===cdl || !$.isNumeric(cd[j+1].x) ||
                                      !$.isNumeric(cd[j+1].y))) {
                                defaultMode = 'lines+markers';
                                break;
                            }
                        }
                    }
                    mergeattr('mode','mode',defaultMode);
                    mergeattr('marker.maxdisplayed','mnum',0);
                    if($.isArray(gdc.marker.size)) {
                        mergeattr('marker.sizeref','msr',1);
                        mergeattr('marker.sizemode','msm','diameter');
                    }
                    mergeattr('marker.colorscale','mscl',
                        Plotly.defaultColorscale,true);
                    mergeattr('marker.cauto','mcauto',true);
                    mergeattr('marker.cmax','mcmax',10);
                    mergeattr('marker.cmin','mcmin',-10);
                    mergeattr('marker.line.colorscale','mlscl',
                        Plotly.defaultColorscale,true);
                    mergeattr('marker.line.cauto','mlcauto',true);
                    mergeattr('marker.line.cmax','mlcmax',10);
                    mergeattr('marker.line.cmin','mlcmin',-10);
                    mergeattr('line.dash','ld','solid');
                    mergeattr('textposition','tp','middle center');
                    mergeattr('textfont.size','ts',gd.layout.font.size);
                    mergeattr('textfont.color','tc',gd.layout.font.color);
                    mergeattr('textfont.family','tf',gd.layout.font.family);
                    mergeattr('connectgaps','connectgaps',false);
                    mergeattr('line.shape','lineshape','linear');
                    mergeattr('line.smoothing','ls',1);
                }
                else if(type==='box') {
                    mergeattr('whiskerwidth','ww',0.5);
                    mergeattr('boxpoints','boxpts','outliers');
                    mergeattr('boxmean','mean',false);
                    mergeattr('jitter','jitter',t.boxpts==='all' ? 0.3 : 0);
                    mergeattr('pointpos','ptpos',t.boxpts==='all' ? -1.5 : 0);
                    mergeattr('marker.outliercolor','soc','rgba(0,0,0,0)');
                    mergeattr('marker.line.outliercolor','solc',t.mc);
                    mergeattr('marker.line.outlierwidth','solw',1);
                    mergeattr('marker.outliercolorscale','soscl',t.mscl,true);
                    mergeattr('marker.outliercauto','socauto',t.mcauto);
                    mergeattr('marker.outliercmax','socmax',t.mcmax);
                    mergeattr('marker.outliercmin','socmin',t.mcmin);
                    mergeattr('marker.line.outliercolorscale','solscl',
                        t.mlscl,true);
                    mergeattr('marker.line.outliercauto','solcauto',t.mlcauto);
                    mergeattr('marker.line.outliercmax','solcmax',t.mlcmax);
                    mergeattr('marker.line.outliercmin','solcmin',t.mlcmin);
                }
            }
            else if(plots.isHeatmap(type)){
                if(plots.isHist2D(type)) {
                    mergeattr('histfunc','histfunc','count');
                    mergeattr('histnorm','histnorm','');
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
                    // in case of aggregation by marker color,
                    // just need to know if this is an array
                    mergeattr('marker.color','mc',t.lc);
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

                mergeattr('colorscale', 'scl', Plotly.defaultColorscale,true);
                // reverse colorscale: handle this here so we don't
                // have to do it in each plot type and colorbar
                mergeattr('reversescale','reversescale',false);
                if(t.reversescale) {
                    t.scl = Plotly.Plots.getScale(t.scl)
                        .map(flipScale)
                        .reverse();
                }
                mergeattr('showscale','showscale',true);
                mergeattr('zsmooth', 'zsmooth', false);

                if(plots.isContour(type)) {
                    mergeattrs(Plotly.Contour.defaults());
                }
                mergeattrs(Plotly.Colorbar.defaults());
            }
            else if(plots.isBar(type)){
                if(type==='histogram') {
                    mergeattr('histfunc','histfunc','count');
                    mergeattr('histnorm','histnorm','');
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
                mergeattr('marker.opacity','mo',1);
                mergeattr('marker.color','mc',defaultColor);
                mergeattr('marker.line.color','mlc','#444');
                mergeattr('marker.line.width','mlw',0);
            }
        }
    };

    function applyStyle(gd) {
        var gl = gd.layout;

        Plotly.Axes.getSubplots(gd).forEach(function(subplot) {
            var gp = gl._plots[subplot].plot;

            gd._modules.concat('ErrorBars').forEach(function(module) {
                Plotly[module].style(gp,gl);
            });
        });
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
    //      traces - integer or array of integers for the traces
    //          to alter (all if omitted)
    // relayout(gd,aobj[,traces])
    //      aobj - {astr1:val1, astr2:val2...} allows setting
    //          multiple attributes simultaneously
    // val (or val1, val2... in the object form) can be an array,
    //  to apply different values to each trace
    // if the array is too short, it will wrap around (useful for
    //  style files that want to specify cyclical default values)
    Plotly.restyle = function(gd,astr,val,traces) {
        if(typeof gd === 'string') { gd = document.getElementById(gd); }

        var i, gl = gd.layout,
            aobj = {};
        if(typeof astr === 'string') { aobj[astr] = val; }
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

        // recalcAttrs attributes need a full regeneration of calcdata
        // as well as a replot, because the right objects may not exist,
        // or autorange may need recalculating
        // in principle we generally shouldn't need to redo ALL traces... that's
        // harder though.
        var recalcAttrs = [
            'mode','visible','type','orientation','fill',
            'histfunc','histnorm','text',
            'xtype','x0','dx','ytype','y0','dy','xaxis','yaxis',
            'line.width','showscale','zauto',
            'autobinx','nbinsx','xbins.start','xbins.end','xbins.size',
            'autobiny','nbinsy','ybins.start','ybins.end','ybins.size',
            'autocontour','ncontours','contours.coloring',
            'swapxy','swapxyaxes','orientationaxes'
        ];
        // autorangeAttrs attributes need a full redo of calcdata
        // only if an axis is autoranged,
        // because .calc() is where the autorange gets determined
        // TODO: could we break this out as well?
        var autorangeAttrs = [
            'marker.size','textfont.size','textposition',
            'error_y.visible','error_y.value','error_y.type',
            'error_y.traceref','error_y.array','error_y.symmetric',
            'error_y.arrayminus','error_y.valueminus','error_y.tracerefminus',
            'error_x.visible','error_x.value','error_x.type',
            'error_x.traceref','error_x.array','error_x.symmetric',
            'error_x.arrayminus','error_x.valueminus','error_x.tracerefminus',
            'boxpoints','jitter','pointpos','whiskerwidth','boxmean'
        ];
        // replotAttrs attributes need a replot (because different
        // objects need to be made) but not a recalc
        var replotAttrs = [
            'connectgaps','zmin','zmax','zauto','mincolor','maxcolor',
            'colorscale','reversescale','zsmooth',
            'contours.start','contours.end','contours.size',
            'contours.showlines',
            'line.smoothing','line.shape',
            'error_y.width','error_x.width','marker.maxdisplayed'
        ];
        // these ones show up in restyle because they make more sense
        // in the style box, but they're graph-wide attributes, so set
        // in gd.layout also axis scales and range show up here because
        // we may need to undo them these all trigger a recalc
        var layoutAttrs = [
            'barmode','bargap','bargroupgap','boxmode','boxgap','boxgroupgap',
            '?axis.autorange','?axis.range','?axis.rangemode'
        ];
        // these ones may alter the axis type
        // (at least if the first trace is involved)
        var axtypeAttrs = [
            'type','x','y','x0','y0','orientation','xaxis','yaxis'
        ];

        // flags for which kind of update we need to do
        var docalc = false,
            docalcAutorange = false,
            doplot = false,
            dolayout = false,
            doapplystyle = false,
            docolorbars = false;
        // copies of the change (and previous values of anything affected)
        // for the undo / redo queue
        var redoit = {},
            undoit = {},
            axlist;

        // make a new empty vals array for undoit
        function a0(){ return traces.map(function(){ return undefined; }); }

        // for autoranging multiple axes
        function addToAxlist(axid) {
            var axName = Plotly.Axes.id2name(axid);
            if(axlist.indexOf(axName)===-1) { axlist.push(axName); }
        }
        function autorangeAttr(axName) { return axName+'.autorange'; }
        function rangeAttr(axName) { return axName+'.range'; }

        // for attrs that interact (like scales & autoscales), save the
        // old vals before making the change
        // val=undefined will not set a value, just record what the value was.
        // attr can be an array to set several at once (all to the same val)
        function doextra(cont,attr,val,i) {
            if($.isArray(attr)) {
                attr.forEach(function(a){ doextra(cont,a,val,i); });
                return;
            }
            // quit if explicitly setting this elsewhere
            if(attr in aobj) { return; }
            var extraparam = Plotly.Lib.nestedProperty(cont,attr);
            if(!(attr in undoit)) {
                undoit[attr] = a0();
            }
            if(undoit[attr][i]===undefined) {
                undoit[attr][i]=extraparam.get();
            }
            if(val!==undefined) {
                extraparam.set(val);
            }
        }
        var zscl = ['zmin','zmax'],
            xbins = ['xbins.start','xbins.end','xbins.size'],
            ybins = ['xbins.start','xbins.end','xbins.size'];

        // now make the changes to gd.data (and occasionally gd.layout)
        // and figure out what kind of graphics update we need to do
        for(var ai in aobj) {
            var vi = aobj[ai], cont, param;
            redoit[ai] = vi;

            if(layoutAttrs.indexOf(ai.replace(/[xy]axis[0-9]*/g,'?axis'))!==-1){
                param = Plotly.Lib.nestedProperty(gl,ai);
                undoit[ai] = [param.get()];
                // since we're allowing val to be an array, allow it here too,
                // even though that's meaningless
                param.set($.isArray(vi) ? vi[0] : vi);
                // ironically, the layout attrs in restyle only require replot,
                // not relayout
                docalc = true;
                continue;
            }

            // set attribute in gd.data
            undoit[ai] = a0();
            for(i=0; i<traces.length; i++) {
                cont = gd.data[traces[i]];
                param = Plotly.Lib.nestedProperty(cont,ai);

                // setting bin or z settings should turn off auto
                // and setting auto should save bin or z settings
                if(zscl.indexOf(ai)!==-1) {
                    doextra(cont,'zauto',false,i);
                }
                else if(ai==='zauto') {
                    doextra(cont,zscl,undefined,i);
                }
                else if(xbins.indexOf(ai)!==-1) {
                    doextra(cont,'autobinx',false,i);
                }
                else if(ai==='autobinx') {
                    doextra(cont,xbins,undefined,i);
                }
                else if(ybins.indexOf(ai)!==-1) {
                    doextra(cont,'autobiny',false,i);
                }
                else if(ai==='autobiny') {
                    doextra(cont,ybins,undefined,i);
                }
                // heatmaps: setting x0 or dx, y0 or dy,
                // should turn xtype/ytype to 'scaled' if 'array'
                else if(['x0','dx'].indexOf(ai)!==-1 &&
                        cont.x && cont.xtype!=='scaled') {
                    doextra(cont,'xtype','scaled',i);
                }
                else if(['y0','dy'].indexOf(ai)!==-1 &&
                        cont.y && cont.ytype!=='scaled') {
                    doextra(cont,'ytype','scaled',i);
                }
                // changing colorbar size modes,
                // make the resulting size not change
                else if(ai==='colorbar.thicknessmode' && param.get()!==vi &&
                        ['fraction','pixels'].indexOf(vi)!==-1) {
                    var thicknorm =
                        ['top','bottom'].indexOf(cont.colorbar.orient)!==-1 ?
                            gl._size.h : gl._size.w;
                    doextra(cont,'colorbar.thickness', cont.colorbar.thickness *
                        (vi==='fraction' ? 1/thicknorm : thicknorm),i);
                }
                else if(ai==='colorbar.lenmode' && param.get()!==vi &&
                        ['fraction','pixels'].indexOf(vi)!==-1) {
                    var lennorm =
                        ['top','bottom'].indexOf(cont.colorbar.orient)!==-1 ?
                            gl._size.w : gl._size.h;
                    doextra(cont,'colorbar.len',cont.colorbar.len *
                        (vi==='fraction' ? 1/lennorm : lennorm),i);
                }

                // save the old value
                undoit[ai][i] = param.get();
                // set the new value - if val is an array, it's one el per trace
                // first check for attributes that get more complex alterations
                var swapAttrs = [
                    'swapxy','swapxyaxes','orientation','orientationaxes'
                ];
                if(swapAttrs.indexOf(ai)!==-1) {
                    // setting an orientation: make sure it's changing
                    // before we swap everything else
                    if(ai==='orientation') {
                        param.set($.isArray(vi) ? vi[i%vi.length] : vi);
                        if(param.get()===undoit[ai][i]) { continue; }
                    }
                    // orientationaxes has no value,
                    // it flips everything and the axes
                    else if(ai==='orientationaxes') {
                        cont.orientation =
                            {v:'h', h:'v'}[cont.orientation||'v'];
                    }
                    swapxydata(cont);
                }
                // all the other ones, just modify that one attribute
                else { param.set($.isArray(vi) ? vi[i%vi.length] : vi); }

            }

            // swap the data attributes of the relevant x and y axes?
            if(['swapxyaxes','orientationaxes'].indexOf(ai)!==-1) {
                axswap(gd,gd.data[traces[0]]);
            }

            // check if we need to call axis type
            if((traces.indexOf(0)!==-1) && (axtypeAttrs.indexOf(ai)!==-1)) {
                Plotly.Axes.clearTypes(gd,traces);
                docalc = true;
            }

            // switching from auto to manual binning or z scaling doesn't
            // actually do anything but change what you see in the styling
            // box. everything else at least needs to apply styles
            if((['autobinx','autobiny','zauto'].indexOf(ai)===-1) ||
                    vi!==false) {
                doapplystyle = true;
            }
            if(['colorbar','line'].indexOf(param.parts[0])!==-1) {
                docolorbars = true;
            }

            if(recalcAttrs.indexOf(ai)!==-1) {
                // major enough changes deserve autoscale, autobin, and
                // non-reversed axes so people don't get confused
                if(['orientation','type'].indexOf(ai)!==-1) {
                    axlist = [];
                    for(i=0; i<traces.length; i++) {
                        var trace = gd.data[traces[i]];
                        addToAxlist(trace.xaxis||'x');
                        addToAxlist(trace.yaxis||'y');

                        if(astr==='type') {
                            doextra(gd.data[traces[i]],
                                ['autobinx','autobiny'],true,i);
                        }
                    }
                    doextra(gl,axlist.map(autorangeAttr),true,0);
                    doextra(gl,axlist.map(rangeAttr),[0,1],0);
                }
                docalc = true;
            }
            else if(replotAttrs.indexOf(ai)!==-1) {
                doplot = true;
            }
            else if(autorangeAttrs.indexOf(ai)!==-1) {
                docalcAutorange = true;
            }
        }
        // now all attribute mods are done, as are redo and undo
        // so we can save them
        if(Plotly.Queue) {
            Plotly.Queue.add(gd,undoit,redoit,traces);
        }

        // do we need to force a recalc?
        var autorangeOn = false;
        Plotly.Axes.list(gd).forEach(function(ax){
            if(ax.autorange) { autorangeOn = true; }
        });
        if(docalc || dolayout || (docalcAutorange && autorangeOn)) {
            gd.calcdata = undefined;
        }

        // now update the graphics
        // a complete layout redraw takes care of plot and
        var seq;
        if(dolayout) {
            seq = [function changeLayout(){
                gd.layout = undefined;
                return Plotly.plot(gd,'',gl);
            }];
        }
        else if(docalc || doplot || docalcAutorange) {
            seq = [Plotly.plot];
        }
        else {
            plots.setStyles(gd);
            seq = [previousPromises];
            if(doapplystyle) {
                seq.push(function doApplyStyle(){
                    applyStyle(gd);
                    if(gl.showlegend) { Plotly.Legend.draw(gd); }
                    return previousPromises(gd);
                });
            }
            if(docolorbars) {
                seq.push(function doColorBars(){
                    gd.calcdata.forEach(function(cd) {
                        if(cd[0].t.cb) { cd[0].t.cb.cdoptions(cd[0].t)(); }
                    });
                    return previousPromises(gd);
                });
            }
        }

        var plotDone = Plotly.Lib.syncOrAsync(seq, gd);

        if(!plotDone || !plotDone.then) { plotDone = Promise.resolve(); }
        return plotDone.then(function(){
            $(gd).trigger('plotly_restyle',[redoit,traces]);
        });
    };

    // swap x and y of the same attribute in container cont
    // specify attr with a ? in place of x/y
    // optionally, use a longer name for each x and y (for axes, like x2<->y3)
    function swapAttrs(cont,attr,xname,yname) {
        var xp = Plotly.Lib.nestedProperty(cont,attr.replace('?',xname||'x')),
            yp = Plotly.Lib.nestedProperty(cont,attr.replace('?',yname||'y')),
            temp = xp.get();
        xp.set(yp.get());
        yp.set(temp);
    }

    // swap all the data and data attributes associated with x and y
    // for the trace gdc
    function swapxydata(gdc) {
        swapAttrs(gdc,'?');
        swapAttrs(gdc,'?0');
        swapAttrs(gdc,'d?');
        swapAttrs(gdc,'?bins');
        swapAttrs(gdc,'nbins?');
        swapAttrs(gdc,'autobin?');
        if($.isArray(gdc.z) && $.isArray(gdc.z[0])) {
            if(gdc.transpose) { delete gdc.transpose; }
            else { gdc.transpose = true; }
        }
        swapAttrs(gdc,'?src');
        swapAttrs(gdc,'error_?');
        if(gdc.error_x && gdc.error_y) {
            var copyYstyle = ('copy_ystyle' in gdc.error_y) ?
                    gdc.error_y.copy_ystyle :
                    ((gdc.error_y.color || gdc.error_y.thickness ||
                        gdc.error_y.width) ? false : true);
            swapAttrs(gdc,'error_?.copy_ystyle');
            if(copyYstyle) {
                swapAttrs(gdc,'error_?.color');
                swapAttrs(gdc,'error_?.thickness');
                swapAttrs(gdc,'error_?.width');
            }
        }
    }

    // swap all the presentation attributes of the axes showing trace gdc
    function axswap(gd,gdc) {
        var gl = gd.layout,
            xid = gdc.xaxis||'x',
            yid = gdc.yaxis||'y',
            xa = Plotly.Axes.getFromId(gd,xid),
            xname = xa._name,
            ya = Plotly.Axes.getFromId(gd,yid),
            yname = ya._name,
            noSwapAttrs = [
                'anchor','domain','overlaying','position','tickangle'
            ],
            axkeylist = Object.keys(gl[xname]).filter(function(n) {
                return n.charAt(0)!=='_' &&
                    (typeof gl[xname][n]!=='function') &&
                    noSwapAttrs.indexOf(n)===-1;
            });
        axkeylist.forEach(function(attr){
            swapAttrs(gl,'?.'+attr,xname,yname);
        });

        // now swap x&y for any annotations anchored to these x & y
        (gl.annotations||[]).forEach(function(ann) {
            if(ann.xref===xid && ann.yref===yid) { swapAttrs(ann,'?'); }
        });

        // check for swapped placeholder titles
        if(xa.title==='Click to enter Y axis title') {
            xa.title = 'Click to enter X axis title';
        }
        if(ya.title==='Click to enter X axis title') {
            ya.title = 'Click to enter Y axis title';
        }
    }

    // relayout: change layout in an existing plot
    // can be called two ways:
    // relayout(gd,astr,val)
    //      gd - graph div (dom element)
    //      astr - attribute string (like 'xaxis.range[0]')
    //      val - value to give this attribute
    // relayout(gd,aobj)
    //      aobj - {astr1:val1, astr2:val2...}
    //          allows setting multiple attributes simultaneously
    Plotly.relayout = function(gd,astr,val) {
        if(gd.framework && gd.framework.isPolar) return;
        if(typeof gd === 'string') { gd = document.getElementById(gd); }
        var gl = gd.layout,
            aobj = {},
            dolegend = false,
            doticks = false,
            dolayoutstyle = false,
            doplot = false,
            docalc = false,
            domodebar = false;

        if(typeof astr === 'string') { aobj[astr] = val; }
        else if($.isPlainObject(astr)) { aobj = astr; }
        else { console.log('relayout fail',astr,val); return; }

        if(Object.keys(aobj).length) { gd.changed = true; }

        var keys = Object.keys(aobj),
            axes = Plotly.Axes.list(gd);
        for(var i=0; i<keys.length; i++) {
            // look for 'allaxes', split out into all axes
            if(keys[i].indexOf('allaxes')===0) {
                for(var j=0; j<axes.length; j++) {
                    var newkey = keys[i].replace('allaxes',axes[j]._name);
                    if(!aobj[newkey]) { aobj[newkey] = aobj[keys[i]]; }
                }
                delete aobj[keys[i]];
            }
            // split annotation.ref into xref and yref
            if(keys[i].match(/^annotations\[[0-9-]\].ref$/)) {
                var xyref = aobj[keys[i]].split('y');
                aobj[keys[i].replace('ref','xref')] = xyref[0];
                aobj[keys[i].replace('ref','yref')] = xyref.length===2 ?
                    ('y'+xyref[1]) : 'paper';
                delete aobj[keys[i]];
            }
        }

        // copies of the change (and previous values of anything affected)
        // for the undo / redo queue
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
            // quit if explicitly setting this elsewhere
            if(attr in aobj) { return; }
            var p = Plotly.Lib.nestedProperty(gl,attr);
            if(!(attr in undoit)) { undoit[attr]=p.get(); }
            if(val!==undefined) { p.set(val); }
        }

        // for editing annotations - is it on autoscaled axes?
        function annAutorange(anni,axletter) {
            var axName = Plotly.Axes.id2name(anni[axletter+'ref']||axletter);
            return gl[axName] && gl[axName].autorange;
        }

        var hw = ['height','width'];

        // alter gd.layout
        for(var ai in aobj) {
            var p = Plotly.Lib.nestedProperty(gl,ai),
                vi = aobj[ai];
            redoit[ai] = aobj[ai];
            // axis reverse is special - it is its own inverse
            // op and has no flag.
            undoit[ai] = (p.parts[1]==='reverse') ? aobj[ai] : p.get();

            // check autosize or autorange vs size and range
            if(hw.indexOf(ai)!==-1) { doextra('autosize', false); }
            else if(ai==='autosize') { doextra(hw, undefined); }
            else if(ai.match(/^[xy]axis[0-9]*\.range(\[[0|1]\])?$/)) {
                doextra(p.parts[0]+'.autorange', false);
            }
            else if(ai.match(/^[xy]axis[0-9]*\.autorange$/)) {
                doextra([p.parts[0]+'.range[0]',p.parts[0]+'.range[1]'],
                    undefined);
            }

            // toggling log without autorange: need to also recalculate ranges
            // logical XOR (ie will islog actually change)
            if(p.parts[1]==='type' && (gl[p.parts[0]].type==='log' ?
                    vi!=='log' : vi==='log')) {
                var ax = gl[p.parts[0]],
                    r0 = ax.range[0],
                    r1 = ax.range[1];
                if(!gl[p.parts[0]].autorange) {
                    if(vi==='log') {
                        // if both limits are negative, autorange
                        if(r0<=0 && r1<=0) {
                            doextra(p.parts[0]+'.autorange',true);
                            continue;
                        }
                        // if one is negative, set it 6 orders below the other.
                        // TODO: find the smallest positive val?
                        else if(r0<=0) { r0 = r1/1e6; }
                        else if(r1<=0) { r1 = r0/1e6; }
                        // now set the range values as appropriate
                        doextra(p.parts[0]+'.range[0]', Math.log(r0)/Math.LN10);
                        doextra(p.parts[0]+'.range[1]', Math.log(r1)/Math.LN10);
                    }
                    else {
                        doextra(p.parts[0]+'.range[0]', Math.pow(10, r0));
                        doextra(p.parts[0]+'.range[1]', Math.pow(10, r1));
                    }
                }
                else if(vi==='log') {
                    // just make sure the range is positive and in the right
                    // order, it'll get recalculated later
                    ax.range = r1>r0 ? [1,2] : [2,1];
                }
            }

            // handle axis reversal explicitly, as there's no 'reverse' flag
            if(p.parts[1]==='reverse') {
                gl[p.parts[0]].range.reverse();
                if(gl[p.parts[0]].autorange) { docalc = true; }
                else { doplot = true; }
            }
            // send annotation mods one-by-one through Annotations.draw(),
            // don't set via nestedProperty
            // that's because add and remove are special
            else if(p.parts[0]==='annotations') {
                var anum = p.parts[1],
                    anns = gl.annotations,
                    anni = (anns && anns[anum])||{};
                // if p.parts is just an annotation number, and val is either
                // 'add' or an entire annotation to add, the undo is 'remove'
                // if val is 'remove' then undo is the whole annotation object
                if(p.parts.length===2) {
                    if(aobj[ai]==='add' || $.isPlainObject(aobj[ai])) {
                        undoit[ai]='remove';
                    }
                    else if(aobj[ai]==='remove') {
                        if(anum===-1) {
                            undoit.annotations = anns;
                            delete undoit[ai];
                        }
                        else { undoit[ai]=anni; }
                    }
                    else { console.log('???',aobj); }
                }
                if((annAutorange(anni,'x') || annAutorange(anni,'y')) &&
                        ai.indexOf('color')===-1 &&
                        ai.indexOf('opacity')===-1 &&
                        ai.indexOf('align')===-1) {
                    docalc = true;
                }
                Plotly.Annotations.draw(gd,anum,
                    p.parts.slice(2).join('.'),aobj[ai]);
                delete aobj[ai];
            }
            // alter gd.layout
            else {
                // check whether we can short-circuit a full redraw
                if(p.parts[0].indexOf('legend')!==-1) { dolegend = true; }
                else if(ai.indexOf('title')!==-1) { doticks = true; }
                else if(p.parts[0].indexOf('bgcolor')!==-1) {
                    dolayoutstyle = true;
                }
                else if(p.parts.length>1 && (
                    p.parts[1].indexOf('tick')!==-1 ||
                    p.parts[1].indexOf('exponent')!==-1 ||
                    p.parts[1].indexOf('grid')!==-1 ||
                    p.parts[1].indexOf('zeroline')!==-1)) { doticks = true; }
                else if(ai.indexOf('.linewidth')!==-1 &&
                        ai.indexOf('axis')!==-1) {
                    doticks = dolayoutstyle = true;
                }
                else if(p.parts.length>1 && p.parts[1].indexOf('line')!==-1) {
                    dolayoutstyle = true;
                }
                else if(p.parts.length>1 && p.parts[1]==='mirror') {
                    doticks = dolayoutstyle = true;
                }
                else if(ai==='margin.pad') { doticks = dolayoutstyle = true; }
                else if(p.parts[0]==='margin' ||
                    p.parts[1]==='autorange' ||
                    p.parts[1]==='rangemode' ||
                    p.parts[1]==='type' ||
                    ai.match(/^(bar|box|font)/)) { docalc = true; }
                // hovermode and dragmode don't need any redrawing,
                // since they just
                // affect reaction to user input. everything else,
                // assume full replot.
                // height, width, autosize get dealt with below
                else if(ai==='hovermode') { domodebar = true; }
                else if(['hovermode','dragmode','height',
                        'width','autosize'].indexOf(ai)===-1) {
                    doplot = true;
                }
                p.set(vi);
                // if we just inserted a new axis (eg from themes),
                // initialize it
                if(ai.match(/^[xy]axis[0-9]*$/)) {
                    Plotly.Axes.initAxis(gd,gd.layout[ai]);
                    Plotly.Axes.setConvert(gd.layout[ai]);
                }
            }
        }
        // now all attribute mods are done, as are
        // redo and undo so we can save them
        if(Plotly.Queue) {
            Plotly.Queue.add(gd,undoit,redoit,'relayout');
        }

        // calculate autosizing - if size hasn't changed,
        // will remove h&w so we don't need to redraw
        if(aobj.autosize) {
            aobj=plotAutoSize(gd,aobj);
        }
        if(aobj.height || aobj.width || aobj.autosize) {
            docalc = true;
        }

        // redraw
        // first check if there's still anything to do
        var ak = Object.keys(aobj),
            seq = [previousPromises];
        if(doplot||docalc) {
            seq.push(function layoutReplot(){
                // force plot() to redo the layout
                gd.layout = undefined;
                // force it to redo calcdata?
                if(docalc) { gd.calcdata = undefined; }
                // replot with the modified layout
                return Plotly.plot(gd,'',gl);
            });
        }
        else if(ak.length) {
            // if we didn't need to redraw entirely, just do the needed parts
            if(dolegend) {
                seq.push(function doLegend(){
                    Plotly.Legend.draw(gd, gl.showlegend);
                    return previousPromises(gd);
                });
            }
            if(dolayoutstyle) {
                seq.push(layoutStyles);
            }
            if(doticks) {
                seq.push(function(){
                    Plotly.Axes.doTicks(gd,'redraw');
                    plots.titles(gd,'gtitle');
                    return previousPromises(gd);
                });
            }
            // this is decoupled enough it doesn't need async regardless
            if(domodebar) { Plotly.Fx.modeBar(gd); }
        }

        var plotDone = Plotly.Lib.syncOrAsync(seq, gd);

        if(!plotDone || !plotDone.then) { plotDone = Promise.resolve(); }
        return plotDone.then(function(){
            $(gd).trigger('plotly_relayout',redoit);
        });
    };

    function setGraphContainerScroll(gd) {
        if(!gd || !gd.mainsite || !gd.layout || gd.tabtype!=='plot' ||
                $(gd).css('display')==='none') {
            return;
        }

        var $graphContainer = $(gd).find('.plot-container'),
            isGraphWiderThanContainer =
                gd.layout.width > parseInt($graphContainer.css('width'),10);

        if (gd.layout.autosize || !isGraphWiderThanContainer) {
            $graphContainer.removeClass('is-fixed-size');
        }
        else if (isGraphWiderThanContainer) {
            $graphContainer.addClass('is-fixed-size');
        }
    }

    function plotAutoSize(gd, aobj) {
        var newheight, newwidth;
        if(gd.mainsite){
            setFileAndCommentsSize(gd);
            var gdBB = gd.layout._container.node().getBoundingClientRect();

            // autosized plot on main site: 5% border on all sides
            newheight = Math.round(gdBB.height*0.9);
            newwidth = Math.round(gdBB.width*0.9);
        }
        else if(gd.shareplot) {
            if(gd.standalone) {
                // full-page shareplot - restrict aspect ratio to between
                // 2:1 and 1:2, but only change height to do this
                newwidth = $(window).width() -
                    parseInt($('#embedded-graph').css('padding-left')||0,10);
                newheight = Plotly.Lib.constrain(
                    $(window).height() - $('#banner').height(),
                    newwidth/2, newwidth*2);
            }
            // else embedded in an iframe - just take the full iframe size
            // if we get to this point, with no aspect ratio restrictions
        }
        else {
            // plotly.js - let the developers do what they want, either
            // provide height and width for the container div,
            // specify size in layout, or take the defaults,
            // but don't enforce any ratio restrictions
            newheight = $(gd).height() || gd.layout.height ||
                defaultLayout().height;
            newwidth = $(gd).width() || gd.layout.width ||
                defaultLayout().width;
        }

        if(Math.abs(gd.layout.width - newwidth) > 1 ||
                Math.abs(gd.layout.height - newheight) > 1) {
            gd.layout.height = newheight;
            gd.layout.width = newwidth;
        }
        // if there's no size change, update layout but
        // delete the autosize attr so we don't redraw
        // but can't call layoutStyles for initial autosize
        else if(gd.layout.autosize !== 'initial') {
            delete(aobj.autosize);
            gd.layout.autosize = true;
        }
        return aobj;
    }

    // check whether to resize a tab (if it's a plot) to the container
    plots.resize = function(gd) {
        if(typeof gd === 'string') { gd = document.getElementById(gd); }

        if(gd.mainsite){
            killPopovers();
            setFileAndCommentsSize(gd);
        }

        if(gd && (gd.tabtype==='plot' || gd.shareplot) &&
                $(gd).css('display')!=='none') {
            if(gd.redrawTimer) { clearTimeout(gd.redrawTimer); }
            gd.redrawTimer = setTimeout(function(){

                if ($(gd).css('display')==='none') { return; }

                if (gd.layout && gd.layout.autosize) {
                    // autosizing doesn't count as a change that needs saving
                    var oldchanged = gd.changed;
                    // nor should it be included in the undo queue
                    gd.autoplay = true;
                    Plotly.relayout(gd, {autosize:true});
                    gd.changed = oldchanged;
                }

                if(window.LIT) {
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
    function makePlotFramework(gd, layout) {
        if(typeof gd === 'string') { gd = document.getElementById(gd); }
        var gd3 = d3.select(gd);

        // test if this is on the main site or embedded
        gd.mainsite = $('#plotlyMainMarker').length > 0;

        gd._promises = [];

        // hook class for plots main container (in case of plotly.js
        // this won't be #embedded-graph or .js-tab-contents)
        gd3.classed('js-plotly-plot',true);

        function addDefaultAxis(container, axname) {
            if(!container[axname]) {
                container[axname] = Plotly.Axes.defaultAxis({
                    range: [-1,6],
                    anchor: {x:'y',y:'x'}[axname.charAt(0)]
                });
            }
        }

        // Get the layout info - take the default or any existing layout,
        // then update with layout arg
        var oldLayout = gd.layout || defaultLayout(),
            newLayout = layout || {};
        // look for axes to include in oldLayout
        // so that default axis settings get included
        var xalist = Object.keys(newLayout)
                .filter(function(k){ return k.match(/^xaxis[0-9]*$/); }),
            yalist = Object.keys(newLayout)
                .filter(function(k){ return k.match(/^yaxis[0-9]*$/); }),
            // temp hack for webgl
            type = (type = gd.data) && (type = type[0]) && (type = type.type),
            gl = gd.layout,
            subplots;

        if(!xalist.length) { xalist = ['xaxis']; }
        if(!yalist.length) { yalist = ['yaxis']; }
        xalist.concat(yalist).forEach(function(axname) {
            addDefaultAxis(oldLayout,axname);
            // if an axis range was explicitly provided with newlayout,
            // turn off autorange
            var ax = newLayout[axname];
            if(ax && ax.range && ax.range.length===2) {
                oldLayout[axname].autorange = false;
            }
        });
        gd.layout = gl = updateObject(oldLayout, newLayout);

        if (!plots.isGL3D(type)) {
            // do a bunch of 2D axis stuff

            // Get subplots and see if we need to make any more axes
            subplots = Plotly.Axes.getSubplots(gd);
            subplots.forEach(function(subplot) {
                var axmatch = subplot.match(/^(x[0-9]*)(y[0-9]*)$/);
                // gl._plots[subplot] = {x: axmatch[1], y: axmatch[2]};
                [axmatch[1],axmatch[2]].forEach(function(axid) {
                    addDefaultAxis(gl,Plotly.Axes.id2name(axid));
                });
            });
            // now get subplots again, in case the new axes require
            // more subplots (yes, that's odd... but possible)
            subplots = Plotly.Axes.getSubplots(gd);

            Plotly.Axes.setTypes(gd);

        } else {
            // This is WEBGL, remove usual axis
            delete gd.layout.xaxis;
            delete gd.layout.yaxis;
        }

        var outerContainer = gl._fileandcomments =
                gd3.selectAll('.file-and-comments');
        // for embeds and cloneGraphOffscreen
        if(!outerContainer.node()) { outerContainer = gd3; }

        // Plot container
        gl._container = outerContainer.selectAll('.plot-container').data([0]);
        gl._container.enter().insert('div', ':first-child')
            .classed('plot-container',true)
            .classed('plotly',true)
            .classed('is-mainsite', gd.mainsite);

        // Make the svg container
        gl._paperdiv = gl._container.selectAll('.svg-container').data([0]);
        gl._paperdiv.enter().append('div')
            .classed('svg-container',true)
            .style('position','relative');

        // Initial autosize
        if(gl.autosize === 'initial') {
            if(gd.mainsite){ setFileAndCommentsSize(gd); }
            plotAutoSize(gd,{});
            gl.autosize=true;
        }
        // Make the graph containers
        // start fresh each time we get here, so we know the order comes out
        // right, rather than enter/exit which can muck up the order
        gl._paperdiv.selectAll('svg').remove();

        // short-circuiting this code here resolves the issue where the _paper
        // svg element following this conditional pushes the page past
        // screen height and leads to overflow and scrollbars in the tool.
        if (plots.isGL3D(type)) {
            // init the mode bar
            Plotly.Fx.modeBar(gd);
            if(!gl._forexport) { Plotly.Fx.init(gd); }

            return;
        }

        gl._paper = gl._paperdiv.append('svg')
            .attr({
                xmlns: 'http://www.w3.org/2000/svg',
                // odd d3 quirk - need namespace twice??
                'xmlns:xmlns:xlink': 'http://www.w3.org/1999/xlink',
                'xml:xml:space': 'preserve'
            });

        // Layers to keep plot types in the right order.
        // from back to front:
        // 1. heatmaps, 2D histos and contour maps
        // 2. bars / 1D histos
        // 3. errorbars for bars and scatter
        // 4. scatter
        // 5. box plots
        function plotLayers(svg) {
            svg.append('g').classed('maplayer', true);
            svg.append('g').classed('barlayer', true);
            svg.append('g').classed('errorlayer', true);
            svg.append('g').classed('scatterlayer', true);
            svg.append('g').classed('boxlayer', true);
        }

        // create all the layers in order, so we know they'll stay in order
        var overlays = [];
        gl._plots = {};
        gl._paper.selectAll('g.subplot').data(subplots)
          .enter().append('g')
            .classed('subplot',true)
            .each(function(subplot){
                var plotinfo = gl._plots[subplot] = {},
                    plotgroup = d3.select(this).classed(subplot,true);
                plotinfo.id = subplot;
                // references to the axis objects controlling this subplot
                plotinfo.x = Plotly.Axes.getFromId(gd,subplot,'x');
                plotinfo.y = Plotly.Axes.getFromId(gd,subplot,'y');
                // references to any subplots overlaid on this one
                plotinfo.overlays = [];

                // is this subplot overlaid on another?
                // ax.overlaying is the id of another axis of the same
                // dimension that this one overlays to be an overlaid subplot,
                // the main plot must exist make sure we're not trying to
                // overlay on an axis that's already overlaying another
                var xa2 = Plotly.Axes.getFromId(gd,plotinfo.x.overlaying) ||
                        plotinfo.x;
                if(xa2 !== plotinfo.x && xa2.overlaying) {
                    xa2 = plotinfo.x;
                    plotinfo.x.overlaying = false;
                }

                var ya2 = Plotly.Axes.getFromId(gd,plotinfo.y.overlaying) ||
                        plotinfo.y;
                if(ya2 !== plotinfo.y && ya2.overlaying) {
                    ya2 = plotinfo.y;
                    plotinfo.y.overlaying = false;
                }

                var mainplot = xa2._id+ya2._id;
                if(mainplot!==subplot && subplots.indexOf(mainplot)!==-1) {
                    plotinfo.mainplot = mainplot;
                    overlays.push(plotinfo);

                    // for now force overlays to overlay completely... so they
                    // can drag together correctly and share backgrounds.
                    // Later perhaps we make separate axis domain and
                    // tick/line domain or something, so they can still share
                    // the (possibly larger) dragger and background but don't
                    // have to both be drawn over that whole domain
                    plotinfo.x.domain = xa2.domain.slice();
                    plotinfo.y.domain = ya2.domain.slice();
                }
                else {
                    // main subplot - make the components of
                    // the plot and containers for overlays
                    plotinfo.bg = plotgroup.append('rect')
                        .style('stroke-width',0);
                    plotinfo.gridlayer = plotgroup.append('g');
                    plotinfo.overgrid = plotgroup.append('g');
                    plotinfo.zerolinelayer = plotgroup.append('g');
                    plotinfo.overzero = plotgroup.append('g');
                    plotinfo.plot = plotgroup.append('svg').call(plotLayers);
                    plotinfo.overplot = plotgroup.append('g');
                    plotinfo.xlines = plotgroup.append('path');
                    plotinfo.ylines = plotgroup.append('path');
                    plotinfo.overlines = plotgroup.append('g');
                    plotinfo.xaxislayer = plotgroup.append('g');
                    plotinfo.yaxislayer = plotgroup.append('g');
                    plotinfo.overaxes = plotgroup.append('g');

                    // make separate drag layers for each subplot,
                    // but append them to paper rather than the plot groups,
                    // so they end up on top of the rest
                }
                plotinfo.draglayer = gl._paper.append('g');
            });

        // now make the components of overlaid subplots
        // overlays don't have backgrounds, and append all
        // their other components to the corresponding
        // extra groups of their main plots.
        overlays.forEach(function(plotinfo) {
            var mainplot = gl._plots[plotinfo.mainplot];
            mainplot.overlays.push(plotinfo);

            plotinfo.gridlayer = mainplot.overgrid.append('g');
            plotinfo.zerolinelayer = mainplot.overzero.append('g');
            plotinfo.plot = mainplot.overplot.append('svg').call(plotLayers);
            plotinfo.xlines = mainplot.overlines.append('path');
            plotinfo.ylines = mainplot.overlines.append('path');
            plotinfo.xaxislayer = mainplot.overaxes.append('g');
            plotinfo.yaxislayer = mainplot.overaxes.append('g');
        });

        // common attributes for all subplots, overlays or not
        subplots.forEach(function(subplot) {
            var plotinfo = gl._plots[subplot];
            plotinfo.plot
                .attr('preserveAspectRatio','none')
                .style('fill','none');
            plotinfo.xlines
                .style('fill','none')
                .classed('crisp',true);
            plotinfo.ylines
                .style('fill','none')
                .classed('crisp',true);
        });

        // single info (legend, annotations) and hover layers for the whole plot
        gl._infolayer = gl._paper.append('g').classed('infolayer',true);
        gl._hoverlayer = gl._paper.append('g').classed('hoverlayer',true);

        // position and style the containers, make main title
        var frameWorkDone = Plotly.Lib.syncOrAsync([
            layoutStyles,
            function goAxes(){ return Plotly.Axes.doTicks(gd,'redraw'); },
            Plotly.Fx.init
        ], gd);
        if(frameWorkDone && frameWorkDone.then) {
            gd._promises.push(frameWorkDone);
        }
        return frameWorkDone;
    }

    // called by legend and colorbar routines to see if we need to
    // expand the margins to show them
    // o is {x,l,r,y,t,b} where x and y are plot fractions,
    // the rest are pixels in each direction
    // or leave o out to delete this entry (like if it's hidden)
    plots.autoMargin = function(gd,id,o) {
        var gl = gd.layout;
        if(!gl._pushmargin) { gl._pushmargin = {}; }
        if(gl.margin.autoexpand!==false) {
            if(!o) {
                delete gl._pushmargin[id];
            }
            else {
                var pad = o.pad||12;

                // if the item is too big, just give it enough automargin to
                // make sure you can still grab it and bring it back
                if(o.l+o.r>gl.width*0.5) { o.l = o.r = 0; }
                if(o.b+o.t>gl.height*0.5) { o.b = o.t = 0; }

                gl._pushmargin[id] = {
                    l: {val:o.x, size: o.l+pad},
                    r: {val:o.x, size: o.r+pad},
                    b: {val:o.y, size: o.b+pad},
                    t: {val:o.y, size: o.t+pad}
                };
            }

            if(!gd._replotting) { doAutoMargin(gd); }
        }
    };

    function doAutoMargin(gd) {
        var gl = gd.layout;
        if(!gl._size) { gl._size = {}; }
        if(!gl._pushmargin) { gl._pushmargin = {}; }
        var gs = gl._size,
            oldmargins = JSON.stringify(gs);

        // adjust margins for outside legends and colorbars
        // gl.margin is the requested margin,
        // gl._size has margins and plotsize after adjustment
        var ml = Math.max(gl.margin.l||0,0),
            mr = Math.max(gl.margin.r||0,0),
            mt = Math.max(gl.margin.t||0,0),
            mb = Math.max(gl.margin.b||0,0),
            pm = gl._pushmargin;
        if(gl.margin.autoexpand!==false) {
            // fill in the requested margins
            pm.base = {
                l:{val:0, size:ml},
                r:{val:1, size:mr},
                t:{val:1, size:mt},
                b:{val:0, size:mb}
            };
            // now cycle through all the combinations of l and r
            // (and t and b) to find the required margins
            Object.keys(pm).forEach(function(k1) {
                var pushleft = pm[k1].l||{},
                    pushbottom = pm[k1].b||{},
                    fl = pushleft.val,
                    pl = pushleft.size,
                    fb = pushbottom.val,
                    pb = pushbottom.size;
                Object.keys(pm).forEach(function(k2) {
                    if($.isNumeric(pl) && pm[k2].r) {
                        var fr = pm[k2].r.val,
                            pr = pm[k2].r.size;
                        if(fr>fl) {
                            var newl = (pl*fr +
                                    (pr-gl.width)*fl) / (fr-fl),
                                newr = (pr*(1-fl) +
                                    (pl-gl.width)*(1-fr)) / (fr-fl);
                            if(newl>=0 && newr>=0 && newl+newr>ml+mr) {
                                ml = newl;
                                mr = newr;
                            }
                        }
                    }
                    if($.isNumeric(pb) && pm[k2].t) {
                        var ft = pm[k2].t.val,
                            pt = pm[k2].t.size;
                        if(ft>fb) {
                            var newb = (pb*ft +
                                    (pt-gl.height)*fb) / (ft-fb),
                                newt = (pt*(1-fb) +
                                    (pb-gl.height)*(1-ft)) / (ft-fb);
                            if(newb>=0 && newt>=0 && newb+newt>mb+mt) {
                                mb = newb;
                                mt = newt;
                            }
                        }
                    }
                });
            });
        }

        gs.l = ml;
        gs.r = mr;
        gs.t = mt;
        gs.b = mb;
        gs.p = gl.margin.pad;
        gs.w = gl.width-ml-mr;
        gs.h = gl.height-mt-mb;

        // if things changed and we're not already redrawing, trigger a redraw
        if(!gd._replotting && oldmargins!=='{}' &&
                oldmargins!==JSON.stringify(gl._size)) {
            return Plotly.plot(gd);
        }
    }

    // layoutStyles: styling for plot layout elements
    function layoutStyles(gd) {
        return Plotly.Lib.syncOrAsync([doAutoMargin, lsInner], gd);
    }

    function lsInner(gd) {
        var gl = gd.layout,
            gs = gl._size;

        // clear axis line positions, to be set in the subplot loop below
        Plotly.Axes.list(gd).forEach(function(ax){ ax._linepositions = {}; });

        gl._paperdiv.style({
            width: gl.width+'px',
            height: gl.height+'px',
            background: gl.paper_bgcolor
        });
        gl._paper.call(Plotly.Drawing.setSize, gl.width, gl.height);

        var freefinished = [];
        gl._paper.selectAll('g.subplot').each(function(subplot) {
            var plotinfo = gl._plots[subplot],
                xa = plotinfo.x,
                ya = plotinfo.y;
            xa.setScale(); // this may already be done... not sure
            ya.setScale();

            if(plotinfo.bg) {
                plotinfo.bg
                    .call(Plotly.Drawing.setRect,
                        xa._offset-gs.p, ya._offset-gs.p,
                        xa._length+2*gs.p, ya._length+2*gs.p)
                    .call(Plotly.Drawing.fillColor, gl.plot_bgcolor);
            }
            plotinfo.plot
                .call(Plotly.Drawing.setRect,
                    xa._offset, ya._offset, xa._length, ya._length);

            var xlw = $.isNumeric(xa.linewidth) ? xa.linewidth : 1,
                ylw = $.isNumeric(ya.linewidth) ? ya.linewidth : 1,

                xp = gs.p+ylw,
                xpathPrefix = 'M'+(-xp)+',',
                xpathSuffix = 'h'+(xa._length+2*xp),
                showfreex = xa.anchor==='free' &&
                    freefinished.indexOf(xa._id)===-1,
                freeposx = gs.h*(1-(xa.position||0))+((xlw/2)%1),
                showbottom =
                    (xa.anchor===ya._id && (xa.mirror||xa.side!=='top')) ||
                    xa.mirror==='all' || xa.mirror==='allticks' ||
                    (xa.mirrors && xa.mirrors[ya._id+'bottom']),
                bottompos = ya._length+gs.p+xlw/2,
                showtop =
                    (xa.anchor===ya._id && (xa.mirror||xa.side==='top')) ||
                    xa.mirror==='all' || xa.mirror==='allticks' ||
                    (xa.mirrors && xa.mirrors[ya._id+'top']),
                toppos = -gs.p-xlw/2,

                // shorten y axis lines so they don't overlap x axis lines
                yp = gs.p,
                // except where there's no x line
                // TODO: this gets more complicated with multiple x and y axes
                ypbottom = showbottom ? 0 : xlw,
                yptop = showtop ? 0 : xlw,
                ypathSuffix = ','+(-yp-yptop)+
                    'v'+(ya._length+2*yp+yptop+ypbottom),
                showfreey = ya.anchor==='free' &&
                    freefinished.indexOf(ya._id)===-1,
                freeposy = gs.w*(ya.position||0)+((ylw/2)%1),
                showleft =
                    (ya.anchor===xa._id && (ya.mirror||ya.side!=='right')) ||
                    ya.mirror==='all' || ya.mirror==='allticks' ||
                    (ya.mirrors && ya.mirrors[xa._id+'left']),
                leftpos = -gs.p-ylw/2,
                showright =
                    (ya.anchor===xa._id && (ya.mirror||ya.side==='right')) ||
                    ya.mirror==='all' || ya.mirror==='allticks' ||
                    (ya.mirrors && ya.mirrors[xa._id+'right']),
                rightpos = xa._length+gs.p+ylw/2;

            // save axis line positions for ticks, draggers, etc to reference
            // each subplot gets an entry:
            //    [left or bottom, right or top, free, main]
            // main is the position at which to draw labels and draggers, if any
            xa._linepositions[subplot] = [
                showbottom ? bottompos : undefined,
                showtop ? toppos : undefined,
                showfreex ? freeposx : undefined
            ];
            if(xa.anchor===ya._id) {
                xa._linepositions[subplot][3] = xa.side==='top' ?
                    toppos : bottompos;
            }
            else if(showfreex) {
                xa._linepositions[subplot][3] = freeposx;
            }

            ya._linepositions[subplot] = [
                showleft ? leftpos : undefined,
                showright ? rightpos : undefined,
                showfreey ? freeposy : undefined
            ];
            if(ya.anchor===xa._id) {
                ya._linepositions[subplot][3] = ya.side==='right' ?
                    rightpos : leftpos;
            }
            else if(showfreey) {
                ya._linepositions[subplot][3] = freeposy;
            }

            // translate all the extra stuff to have the
            // same origin as the plot area or axes
            var origin = 'translate('+xa._offset+','+ya._offset+')',
                originx = origin,
                originy = origin;
            if(showfreex) {
                originx = 'translate('+xa._offset+','+gs.t+')';
            }
            if(showfreey) {
                originy = 'translate('+gs.l+','+ya._offset+')';
            }


            plotinfo.xlines
                .attr('transform', originx)
                .attr('d',(
                    (showbottom ? (xpathPrefix+bottompos+xpathSuffix) : '') +
                    (showtop ? (xpathPrefix+toppos+xpathSuffix) : '') +
                    (showfreex ? (xpathPrefix+freeposx+xpathSuffix) : '')) ||
                    // so it doesn't barf with no lines shown
                    'M0,0')
                .style('stroke-width',xlw+'px')
                .call(Plotly.Drawing.strokeColor, xa.showline ?
                    xa.linecolor : 'rgba(0,0,0,0)');
            plotinfo.ylines
                .attr('transform', originy)
                .attr('d',(
                    (showleft ? ('M'+leftpos+ypathSuffix) : '') +
                    (showright ? ('M'+rightpos+ypathSuffix) : '') +
                    (showfreey ? ('M'+freeposy+ypathSuffix) : '')) ||
                    'M0,0')
                .attr('stroke-width',ylw+'px')
                .call(Plotly.Drawing.strokeColor,ya.showline ?
                    ya.linecolor : 'rgba(0,0,0,0)');

            plotinfo.xaxislayer.attr('transform',originx);
            plotinfo.yaxislayer.attr('transform',originy);
            plotinfo.gridlayer.attr('transform',origin);
            plotinfo.zerolinelayer.attr('transform',origin);
            plotinfo.draglayer.attr('transform',origin);

            // mark free axes as displayed, so we don't draw them again
            if(showfreex) { freefinished.push(xa._id); }
            if(showfreey) { freefinished.push(ya._id); }
        });
        plots.titles(gd,'gtitle');

        Plotly.Fx.modeBar(gd);

        setGraphContainerScroll(gd);

        return gd._promises.length && Promise.all(gd._promises);
    }

    // titles - (re)draw titles on the axes and plot
    // title can be 'xtitle', 'ytitle', 'gtitle',
    //  or empty to draw all
    plots.titles = function(gd,title) {
        var options;
        if(typeof gd === 'string') { gd = document.getElementById(gd); }
        if(!title) {
            Plotly.Axes.list(gd).forEach(function(ax) {
                plots.titles(gd,ax._id+'title');
            });
            plots.titles(gd,'gtitle');
            return;
        }

        var gl=gd.layout,gs=gl._size,
            axletter = title.charAt(0),
            colorbar = title.substr(1,2)==='cb',
            cbnum = colorbar ? Number(title.substr(3).replace('title','')) : 0,
            cont = colorbar ? gd.calcdata[cbnum][0].t.cb.axis :
                (gl[Plotly.Axes.id2name(title.replace('title',''))] || gl),
            prop = cont===gl ? 'title' : cont._name+'.title',
            name = colorbar ? 'colorscale' :
                ((cont._id||axletter).toUpperCase()+' axis'),
            font = cont.titlefont.family || gl.font.family || 'Arial',
            fontSize = cont.titlefont.size || (gl.font.size*1.2) || 14,
            fontColor = cont.titlefont.color || gl.font.color || '#444',
            x,y,transform='',attr={},xa,ya,
            avoid = {
                selection:d3.select(gd).selectAll('g.'+cont._id+'tick'),
                side:cont.side
            },
            // multiples of fontsize to offset label from axis
            offsetBase = colorbar ? 0 : 1.5;
        if(colorbar && cont.titleside) {
            x = gs.l+cont.titlex*gs.w;
            y = gs.t+(1-cont.titley)*gs.h + ((cont.titleside==='top') ?
                    3+fontSize*0.75 : - 3-fontSize*0.25);
            options = {x: x, y: y, 'text-anchor':'start'};
            avoid = {};
        }
        else if(axletter==='x'){
            xa = cont;
            ya = (xa.anchor==='free') ?
                {_offset:gs.l+(1-(xa.position||0))*gs.h, _length:0} :
                Plotly.Axes.getFromId(gd, xa.anchor);
            x = xa._offset+xa._length/2;
            y = ya._offset + ((xa.side==='top') ?
                -10 - fontSize*(offsetBase + (xa.showticklabels ? 1 : 0)) :
                ya._length + 10 +
                    fontSize*(offsetBase + (xa.showticklabels ? 1.5 : 0.5)));
            options = {x: x, y: y, 'text-anchor': 'middle'};
            if(!avoid.side) { avoid.side = 'bottom'; }
        }
        else if(axletter==='y'){
            ya = cont;
            xa = (ya.anchor==='free') ?
                {_offset:gs.t+(ya.position||0)*gs.w, _length:0} :
                Plotly.Axes.getFromId(gd, ya.anchor);
            y = ya._offset+ya._length/2;
            x = xa._offset + ((ya.side==='right') ?
                xa._length + 10 +
                    fontSize*(offsetBase + (ya.showticklabels ? 1 : 0.5)) :
                -10 - fontSize*(offsetBase + (ya.showticklabels ? 0.5 : 0)));
            attr = {center: 0};
            options = {x: x, y: y, 'text-anchor': 'middle'};
            transform = {rotate: '-90', offset: 0};
            if(!avoid.side) { avoid.side = 'left'; }
        }
        else{
            name = 'Plot';
            fontSize = gl.titlefont.size || gl.font.size*1.4 || 16;
            x = gl.width/2;
            y = gl._size.t/2;
            options = {x: x, y: y, 'text-anchor': 'middle'};
            avoid = {};
        }

        var opacity = 1,
            isplaceholder = false,
            txt = cont.title.trim();
        if(cont.unit) { txt += ' ('+cont.unit+')'; }
        if(txt === '') { opacity = 0; }
        if(txt === 'Click to enter '+name+' title') {
            opacity = 0.2;
            isplaceholder = true;
        }

        var group = colorbar ?
            d3.select(gd).selectAll('.'+cont._id.substr(1)+' .cbtitle') :
            gl._infolayer;
        group.select('.'+title).remove();
        var el = group.append('text').attr('class', title).text(txt);

        // if there's existing mathjax, get its transform so we can
        // apply that right away and minimize jitter during rendering
        var oldMathjax = group.select('.'+title+'-math-group'),
            hadMathjax = !oldMathjax.empty(),
            oldMathjaxTransform,
            newPartialMathjaxTransform;
        if(hadMathjax) {
            oldMathjaxTransform = oldMathjax.attr('transform');
        }

        function titleLayout(titleEl){
            Plotly.Lib.syncOrAsync([drawTitle,scootTitle], titleEl);
        }

        function drawTitle(titleEl) {
            if(transform){
                titleEl.attr('transform',
                    'rotate(' + [transform.rotate, options.x, options.y] +
                    ') translate(0, '+transform.offset+')');
            }
            titleEl.style({
                    'font-family': font,
                    'font-size': d3.round(fontSize,2)+'px',
                    fill: Plotly.Drawing.rgb(fontColor),
                    opacity: opacity*Plotly.Drawing.opacity(fontColor)
                })
                .attr(options)
                .call(Plotly.util.convertToTspans, function(newMathjax){
                    if(!newMathjax) { return; }

                    // give the new mathjax group the same transform that
                    // a previous one had temporarily, on the assumption that
                    // probably this is what the new one will get, so we'll
                    // minimize jitter when this is rendered and then scooted.
                    newPartialMathjaxTransform = newMathjax.attr('transform');
                    if(hadMathjax) {
                        newMathjax.attr('transform',oldMathjaxTransform);
                    }
                })
                .attr(options);
            titleEl.selectAll('tspan.line')
                .attr(options);
            return previousPromises(gd);
        }

        function scootTitle(titleElIn) {
            var mathjaxTitle = d3.select(titleElIn.node().parentNode)
                    .select('.'+titleElIn.attr('class')+'-math-group'),
                hasMathjax = !mathjaxTitle.empty(),
                titleEl = hasMathjax ? mathjaxTitle : titleElIn;
            if(hasMathjax) {
                // put back the transform we were given by convertToTspans
                // so we can calculate shift properly
                titleEl.attr('transform',newPartialMathjaxTransform);
            }

            if(avoid && avoid.selection && avoid.side && txt){
                // move toward avoid.side (= left, right, top, bottom) if needed
                // can include pad (pixels, default 2)
                var shift = 0,
                    backside = {
                        left:'right',
                        right:'left',
                        top:'bottom',
                        bottom:'top'
                    }[avoid.side],
                    pad = $.isNumeric(avoid.pad) ? avoid.pad : 2,
                    titlebb = titleEl.node().getBoundingClientRect(),
                    paperbb = gl._paper.node().getBoundingClientRect(),
                    maxshift = colorbar ? paperbb.width:
                        (paperbb[avoid.side]-titlebb[avoid.side]) *
                        ((avoid.side==='left' || avoid.side==='top') ? -1 : 1);
                // Prevent the title going off the paper
                if(maxshift<0) { shift = maxshift; }
                else {
                    // iterate over a set of elements (avoid.selection)
                    // to avoid collisions with
                    avoid.selection.each(function(){
                        var mathjaxGroup = d3.select(this)
                                .select('.text-math-group'),
                            avoidEl = mathjaxGroup.empty() ?
                                d3.select(this).select('text') : mathjaxGroup,
                            avoidbb = avoidEl.node().getBoundingClientRect();
                        if(Plotly.Lib.bBoxIntersect(titlebb,avoidbb,pad)) {
                            shift = Math.max(shift, Math.abs(
                                avoidbb[avoid.side] - titlebb[backside]) + pad);
                        }
                    });
                    shift = Math.min(maxshift, shift);
                }
                if(shift>0 || maxshift<0) {
                    var shiftTemplate = {
                        left: [-shift, 0],
                        right: [shift, 0],
                        top: [0, -shift],
                        bottom: [0, shift]
                    }[avoid.side];
                    titleEl.attr('transform',
                        'translate(' + shiftTemplate + ') ' +
                        (titleEl.attr('transform')||''));
                }
            }
            else if(colorbar && cont.titleside==='bottom') {
                // if multiline title, need to move it up by n-1 lines
                // gotta be a more robust way to do this? Depends on
                // all the lines having the same height
                // which I'm not sure will happen if there's mathjax...
                var nlines = titleEl.selectAll('tspan.line')[0].length;
                if(nlines>1) {
                    titleEl.attr('transform',
                        'translate(0,'+((1-nlines)*1.3*fontSize)+') ' +
                        (titleEl.attr('transform')||''));
                }
            }
        }

        el.attr({'data-unformatted': txt})
            .call(titleLayout);

        function setPlaceholder(){
            opacity = 0;
            isplaceholder = true;
            txt = 'Click to enter '+name+' title';
            gl._infolayer.select('.'+title)
                .attr({'data-unformatted': txt})
                .text('Click to enter '+name+' title')
                .on('mouseover.opacity',function(){
                    d3.select(this).transition()
                        .duration(100).style('opacity',1);
                })
                .on('mouseout.opacity',function(){
                    d3.select(this).transition()
                        .duration(1000).style('opacity',0);
                });
        }

        // don't allow editing (or placeholder) on embedded graphs or exports
        if(gd.mainsite && !gl._forexport){
            if(!txt) { setPlaceholder(); }

            el.call(Plotly.util.makeEditable)
                .on('edit', function(text){
                    this
                        .style({
                            'font-family': font,
                            'font-size': fontSize+'px',
                            fill: Plotly.Drawing.opacity(fontColor),
                            opacity: opacity*Plotly.Drawing.opacity(fontColor)
                        })
                        .call(Plotly.util.convertToTspans)
                        .attr(options)
                        .selectAll('tspan.line')
                            .attr(options);
                    if(colorbar) {
                        Plotly.restyle(gd,'colorbar.title',text,cbnum);
                    }
                    else { Plotly.relayout(gd,prop,text); }
                })
                .on('cancel', function(){
                    this.text(this.attr('data-unformatted'))
                        .call(titleLayout);
                })
                .on('input', function(d){
                    this.text(d || ' ').attr(options)
                        .selectAll('tspan.line')
                            .attr(options);
                });
        }
        else if(!txt || txt === 'Click to enter '+name+' title') {
            el.remove();
        }
        el.classed('js-placeholder',isplaceholder);
    };

    // ----------------------------------------------------
    // Utility functions
    // ----------------------------------------------------

    // graphJson - jsonify the graph data and layout
    // needs to recurse because some src can be inside sub-objects
    // also strips out functions and private (start with _) elements
    // so we can add temporary things to data and layout that don't get saved
    //
    // dataonly = truthy will omit layout and any arrays that aren't data
    //      (note that we have to do this on the server side too)
    // mode:
    //      keepref (default): remove data for which there's a src present,
    //          eg if there's xsrc present (and xsrc is well-formed,
    //          ie has : and some chars before it), strip out x
    //      keepdata: remove all src tags, don't remove the data itself
    //      keepall: keep data and src
    plots.graphJson = function(gd, dataonly, mode){
        if(typeof gd === 'string') { gd = document.getElementById(gd); }

        function stripObj(d) {
            if(typeof d === 'function') {
                return null;
            }

            if($.isPlainObject(d)) {
                var o={}, v;
                for(v in d) {
                    // remove private elements and functions
                    // _ is for private, [ is a mistake ie [object Object]
                    if(typeof d[v]==='function' ||
                            ['_','['].indexOf(v.charAt(0))!==-1) {
                        continue;
                    }

                    // look for src/data matches and remove the appropriate one
                    if(mode==='keepdata') {
                        // keepdata: remove all ...src tags
                        if(v.substr(v.length-3)==='src') {
                            continue;
                        }
                    }
                    else if(mode!=='keepall') {
                        // keepref: remove sourced data but only
                        // if the source tag is well-formed
                        var src = d[v+'src'];
                        if(typeof src==='string' && src.indexOf(':')>0) {
                            continue;
                        }
                    }

                    // OK, we're including this... recurse into it
                    o[v] = stripObj(d[v]);
                }
                return o;
            }

            if($.isArray(d)) {
                return d.map(stripObj);
            }

            // convert native dates to date strings...
            // mostly for external users exporting to plotly
            if(d && d.getTime) {
                return Plotly.Lib.ms2DateTime(d);
            }

            return d;
        }

        var obj = {
            data:(gd.data||[]).map(function(v){
                var d = stripObj(v);
                // fit has some little arrays in it that don't contain data,
                // just fit params and meta
                if(dataonly) { delete d.fit; }
                return d;
            })
        };
        if(!dataonly) { obj.layout = stripObj(gd.layout); }

        if(gd.framework && gd.framework.isPolar) obj = gd.framework.getConfig();

        return JSON.stringify(obj);
    };

    plots.viewJson = function(){
        var gd = Tabs.get();
        var jsonString, data, layout;
        if(gd.framework && gd.framework.isPolar){
            var json= gd.framework.getLiveConfig();
            jsonString = JSON.stringify(json);
            data = json.data;
            layout = json.layout;
        }
        else{
            jsonString = Plotly.Plots.graphJson(gd);
            data = JSON.parse(jsonString).data;
            // Remove stream meta info
            data.forEach(function(di){ delete di.stream; });
            layout = JSON.parse(jsonString).layout;
        }
        var code = 'var data = ' + JSON.stringify(data) + ';\n';
        code += 'var layout = ' + JSON.stringify(layout) + ';\n';
        code += 'Plotly.plot(Tabs.get(), data, layout);';

        var jsonModal = $('#jsonModal');
        var jsonViewer = jsonModal.find('#json-viewer').empty();
        jsonViewer.data('jsontree', '')
            .jsontree(jsonString,{collapsibleOuter:false}).show();
        jsonModal.modal('show');

        var jsonText = jsonModal.find('#json-text')
            .text('').append(code).hide();
        var buttonTexts = ['Switch to Plain Text', 'Switch to JSON Viewer'];
        var viewerToggle = $('.js-plain-text-toggle').text(buttonTexts[0]);

        viewerToggle.off('click').on('click', function(){
            var isPlaintText = $(this).text() === buttonTexts[0];
            jsonViewer.toggle(!isPlaintText);
            jsonText.toggle(isPlaintText);
            jsonText.get(0).select();
            $(this).text(buttonTexts[+isPlaintText]);
            return false;
        });

        jsonModal.find('.close').off('click').on('click', function(){
            jsonModal.modal('hide');
            return false;
        });
    };

    // updateObject: merge objects i and up recursively into a new object (o)
    // one difference with $.extend is that we coerce updated values to numbers
    // if the original value was a number
    var uoStack=[];
    function updateObject(i,up) {
        if(!$.isPlainObject(up)) { return i; }
        // seems like JS doesn't fully implement recursion...
        // if I say o={} here then each level destroys the previous.
        var o = uoStack[uoStack.push({})-1],
            key;
        for(key in i) { o[key]=i[key]; }
        for(key in up) {
            if($.isPlainObject(up[key])) {
                o[key] = updateObject(
                    $.isPlainObject(i[key]) ? i[key] : {}, up[key]);
            }
            // if the initial object had a number and
            // the update can be a number, coerce it
            else if($.isNumeric(i[key]) && $.isNumeric(up[key])) {
                o[key] = +up[key];
            }
            else { o[key] = up[key]; }
        }
        return uoStack.pop();
    }
}()); // end Plots object definition

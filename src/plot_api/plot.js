/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// Vendor
var d3 = require('d3');

// Plotly Components
var Annotations = require('../components/annotations');
var Color = require('../components/color');
var Drawing = require('../components/drawing');
var ErrorBars = require('../components/errorbars');
var Legend = require('../components/legend');
var manageModeBar = require('../components/modebar/manage');
var Shapes = require('../components/shapes');

// Plotly Plots
var Plots = require('../plots/plots');
var Axes = require('../plots/cartesian/axes');
var Fx = require('../plots/cartesian/graph_interact');
var Geo = require('../plots/geo/geo');
var Gl3dLayout = require('../plots/gl3d/layout');
var Micropolar = require('../plots/polar/micropolar');
var Scene = require('../plots/gl3d/scene');
var Scene2D = require('../plots/gl2d/scene2d');

// Plotly Traces
var Pie = require('../traces/pie');

// Plotly Libs
var Events = require('../lib/events');
var Lib = require('../lib');
var Titles = require('../components/titles');
var Util = require('../lib/svg_text_utils');

// Extra help
var defaultConfig = require('./plot_config');
var isNumeric = require('fast-isnumeric');

module.exports = plot;

/**
 * Main plot-creation function
 *
 * Note: will call makePlotFramework if necessary to create the framework
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 * @param {array of objects} data
 *      array of traces, containing the data and display information for each trace
 * @param {object} layout
 *      object describing the overall display of the plot,
 *      all the stuff that doesn't pertain to any individual trace
 * @param {object} config
 *      configuration options (see ./plot_config.js for more info)
 *
 */

function plot(gd, data, layout, config) {
    Lib.markTime('in plot');

    gd = getGraphDiv(gd);

    /*
     * Events.init is idempotent and bails early if gd has already been init'd
     */
    Events.init(gd);

    var okToPlot = Events.triggerHandler(gd, 'plotly_beforeplot', [data, layout, config]);
    if(okToPlot===false) return;

    // if there's no data or layout, and this isn't yet a plotly plot
    // container, log a warning to help plotly.js users debug
    if(!data && !layout && !Lib.isPlotDiv(gd)) {
        console.log('Warning: calling Plotly.plot as if redrawing ' +
            'but this container doesn\'t yet have a plot.', gd);
    }

    // transfer configuration options to gd until we move over to
    // a more OO like model
    setPlotContext(gd, config);

    if(!layout) layout = {};

    // hook class for plots main container (in case of plotly.js
    // this won't be #embedded-graph or .js-tab-contents)
    d3.select(gd).classed('js-plotly-plot', true);

    // off-screen getBoundingClientRect testing space,
    // in #js-plotly-tester (and stored as gd._tester)
    // so we can share cached text across tabs
    Drawing.makeTester(gd);

    // collect promises for any async actions during plotting
    // any part of the plotting code can push to gd._promises, then
    // before we move to the next step, we check that they're all
    // complete, and empty out the promise list again.
    gd._promises = [];

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass a non-array for data
    var graphwasempty = ((gd.data||[]).length===0 && Array.isArray(data));
    if(Array.isArray(data)) {
        cleanData(data, gd.data);

        if(graphwasempty) gd.data=data;
        else gd.data.push.apply(gd.data,data);

        // for routines outside graph_obj that want a clean tab
        // (rather than appending to an existing one) gd.empty
        // is used to determine whether to make a new tab
        gd.empty=false;
    }

    if(!gd.layout || graphwasempty) gd.layout = cleanLayout(layout);

    // if the user is trying to drag the axes, allow new data and layout
    // to come in but don't allow a replot.
    if(gd._dragging) {
        // signal to drag handler that after everything else is done
        // we need to replot, because something has changed
        gd._replotPending = true;
        return;
    } else {
        // we're going ahead with a replot now
        gd._replotPending = false;
    }

    Plots.supplyDefaults(gd);

    // Polar plots
    if(data && data[0] && data[0].r) return plotPolar(gd, data, layout);

    // so we don't try to re-call Plotly.plot from inside
    // legend and colorbar, if margins changed
    gd._replotting = true;
    var hasData = gd._fullData.length>0;

    // Make or remake the framework (ie container and axes) if we need to
    // note: if they container already exists and has data,
    //  the new layout gets ignored (as it should)
    //  but if there's no data there yet, it's just a placeholder...
    //  then it should destroy and remake the plot
    if (hasData) {
        var subplots = Axes.getSubplots(gd).join(''),
            oldSubplots = Object.keys(gd._fullLayout._plots || {}).join('');

        if(gd.framework!==makePlotFramework || graphwasempty || (oldSubplots!==subplots)) {
            gd.framework = makePlotFramework;
            makePlotFramework(gd);
        }
    }
    else if(graphwasempty) makePlotFramework(gd);

    var fullLayout = gd._fullLayout;

    // prepare the data and find the autorange

    // generate calcdata, if we need to
    // to force redoing calcdata, just delete it before calling Plotly.plot
    var recalc = !gd.calcdata || gd.calcdata.length!==(gd.data||[]).length;
    if(recalc) {
        doCalcdata(gd);

        if(gd._context.doubleClick!==false || gd._context.displayModeBar!==false) {
            Axes.saveRangeInitial(gd);
        }
    }

    // in case it has changed, attach fullData traces to calcdata
    for (var i = 0; i < gd.calcdata.length; i++) {
        gd.calcdata[i][0].trace = gd._fullData[i];
    }

    /*
     * start async-friendly code - now we're actually drawing things
     */

    var oldmargins = JSON.stringify(fullLayout._size);

    // draw anything that can affect margins.
    // currently this is legend and colorbars
    function marginPushers() {
        var calcdata = gd.calcdata;
        var i, cd, trace;

        Legend.draw(gd);

        for (i = 0; i < calcdata.length; i++) {
            cd = calcdata[i];
            trace = cd[0].trace;
            if (trace.visible !== true || !trace._module.colorbar) {
                Plots.autoMargin(gd, 'cb'+trace.uid);
            }
            else trace._module.colorbar(gd, cd);
        }

        Plots.doAutoMargin(gd);
        return Plots.previousPromises(gd);
    }

    function marginPushersAgain() {
        // in case the margins changed, draw margin pushers again
        var seq = JSON.stringify(fullLayout._size)===oldmargins ?
            [] : [marginPushers, layoutStyles];
        return Lib.syncOrAsync(seq.concat(Fx.init),gd);
    }

    function positionAndAutorange() {
        if(!recalc) return;

        var subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
            modules = gd._modules;

        // position and range calculations for traces that
        // depend on each other ie bars (stacked or grouped)
        // and boxes (grouped) push each other out of the way

        var subplotInfo, _module;

        for(var i = 0; i < subplots.length; i++) {
            subplotInfo = fullLayout._plots[subplots[i]];

            for(var j = 0; j < modules.length; j++) {
                _module = modules[j];
                if(_module.setPositions) _module.setPositions(gd, subplotInfo);
            }
        }

        Lib.markTime('done with bar/box adjustments');

        // calc and autorange for errorbars
        ErrorBars.calc(gd);
        Lib.markTime('done ErrorBars.calc');

        // TODO: autosize extra for text markers
        return Lib.syncOrAsync([
            Shapes.calcAutorange,
            Annotations.calcAutorange,
            doAutoRange
        ], gd);
    }

    function doAutoRange() {
        var axList = Axes.list(gd, '', true);
        for(var i = 0; i < axList.length; i++) {
            Axes.doAutoRange(axList[i]);
        }
    }

    // CODE-SMELL: For a method this short, we should inline it
    // for clarity sake (and a teensy bit of speed too...)
    function drawAxes() {

        // draw ticks, titles, and calculate axis scaling (._b, ._m)
        return Axes.doTicks(gd, 'redraw');
    }

    function drawData() {
        // Now plot the data
        var calcdata = gd.calcdata,
            subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
            modules = gd._modules;

        var i, j, cd, trace, uid, subplot, subplotInfo,
            cdSubplot, cdError, cdModule, module;

        function getCdSubplot(calcdata, subplot) {
            var cdSubplot = [];
            var i, cd, trace;
            for (i = 0; i < calcdata.length; i++) {
                cd = calcdata[i];
                trace = cd[0].trace;
                if (trace.xaxis+trace.yaxis === subplot) cdSubplot.push(cd);
            }
            return cdSubplot;
        }

        function getCdModule(cdSubplot, module) {
            var cdModule = [];
            var i, cd, trace;
            for (i = 0; i < cdSubplot.length; i++) {
                cd = cdSubplot[i];
                trace = cd[0].trace;
                if (trace._module===module && trace.visible===true) cdModule.push(cd);
            }
            return cdModule;
        }

        // clean up old scenes that no longer have associated data
        // will this be a performance hit?

        // ... until subplot of different type play better together
        if(gd._fullLayout._hasGL3D) plotGl3d(gd);
        if(gd._fullLayout._hasGeo) plotGeo(gd);
        if(gd._fullLayout._hasGL2D) plotGl2d(gd);

        // in case of traces that were heatmaps or contour maps
        // previously, remove them and their colorbars explicitly
        for (i = 0; i < calcdata.length; i++) {
            cd = calcdata[i];
            trace = cd[0].trace;
            if (trace.visible !== true || !trace._module.colorbar) {
                uid = trace.uid;
                fullLayout._paper.selectAll('.hm'+uid+',.contour'+uid+',.cb'+uid+',#clip'+uid)
                    .remove();
            }
        }

        for (i = 0; i < subplots.length; i++) {
            subplot = subplots[i];
            subplotInfo = gd._fullLayout._plots[subplot];
            cdSubplot = getCdSubplot(calcdata, subplot);
            cdError = [];

            // remove old traces, then redraw everything
            // TODO: use enter/exit appropriately in the plot functions
            // so we don't need this - should sometimes be a big speedup
            if(subplotInfo.plot) subplotInfo.plot.selectAll('g.trace').remove();

            for(j = 0; j < modules.length; j++) {
                module = modules[j];
                if(!module.plot) continue;

                // plot all traces of this type on this subplot at once
                cdModule = getCdModule(cdSubplot, module);
                module.plot(gd, subplotInfo, cdModule);
                Lib.markTime('done ' + (cdModule[0] && cdModule[0][0].trace.type));

                // collect the traces that may have error bars
                if(cdModule[0] && cdModule[0][0].trace && Plots.traceIs(cdModule[0][0].trace, 'errorBarsOK')) {
                    cdError = cdError.concat(cdModule);
                }
            }

            // finally do all error bars at once
            if(gd._fullLayout._hasCartesian) {
                ErrorBars.plot(gd, subplotInfo, cdError);
                Lib.markTime('done ErrorBars');
            }
        }

        // now draw stuff not on subplots (ie, pies)
        // TODO: gotta be a better way to handle this
        var cdPie = getCdModule(calcdata, Pie);
        if(cdPie.length) Pie.plot(gd, cdPie);

        // styling separate from drawing
        Plots.style(gd);
        Lib.markTime('done plots.style');

        // show annotations and shapes
        Shapes.drawAll(gd);
        Annotations.drawAll(gd);

        // source links
        Plots.addLinks(gd);

        return Plots.previousPromises(gd);
    }

    function cleanUp() {
        // now we're REALLY TRULY done plotting...
        // so mark it as done and let other procedures call a replot
        gd._replotting = false;
        Lib.markTime('done plot');
        gd.emit('plotly_afterplot');
    }

    var donePlotting = Lib.syncOrAsync([
        Plots.previousPromises,
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
        donePlotting : Promise.resolve(gd);
};



// Get the container div: we store all variables for this plot as
// properties of this div
// some callers send this in by DOM element, others by id (string)
function getGraphDiv(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    }
    else if(gd===null || gd===undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;  // otherwise assume that gd is a DOM element
}


function setPlotContext(gd, config) {
    if(!gd._context) gd._context = Lib.extendFlat({}, defaultConfig);
    var context = gd._context;

    if(config) {
        Object.keys(config).forEach(function(key) {
            if(key in context) {
                if(key === 'setBackground' && config[key] === 'opaque') {
                    context[key] = opaqueSetBackground;
                }
                else context[key] = config[key];
            }
        });

        // map plot3dPixelRatio to plotGlPixelRatio for backward compatibility
        if(config.plot3dPixelRatio && !context.plotGlPixelRatio) {
            context.plotGlPixelRatio = context.plot3dPixelRatio;
        }
    }

    //staticPlot forces a bunch of others:
    if(context.staticPlot) {
        context.editable = false;
        context.autosizable = false;
        context.scrollZoom = false;
        context.doubleClick = false;
        context.showTips = false;
        context.showLink = false;
        context.displayModeBar = false;
    }
}


function cleanData(data, existingData) {
    // make a few changes to the data right away
    // before it gets used for anything

    /*
     * Enforce unique IDs
     */
    var suids = [], // seen uids --- so we can weed out incoming repeats
        uids = data.concat(Array.isArray(existingData) ? existingData : [])
               .filter( function(trace) { return 'uid' in trace; } )
               .map( function(trace) { return trace.uid; });

    for(var tracei = 0; tracei < data.length; tracei++) {
        var trace = data[tracei];
        // assign uids to each trace and detect collisions.
        if (!('uid' in trace) || suids.indexOf(trace.uid) !== -1) {
            var newUid, i;
            for(i=0; i<100; i++) {
                newUid = Lib.randstr(uids);
                if(suids.indexOf(newUid)===-1) break;
            }
            trace.uid = Lib.randstr(uids);
            uids.push(trace.uid);
        }
        // keep track of already seen uids, so that if there are
        // doubles we force the trace with a repeat uid to
        // acquire a new one
        suids.push(trace.uid);

        // BACKWARD COMPATIBILITY FIXES

        // use xbins to bin data in x, and ybins to bin data in y
        if(trace.type==='histogramy' && 'xbins' in trace && !('ybins' in trace)) {
            trace.ybins = trace.xbins;
            delete trace.xbins;
        }

        // error_y.opacity is obsolete - merge into color
        if(trace.error_y && 'opacity' in trace.error_y) {
            var dc = Color.defaults,
                yeColor = trace.error_y.color ||
                (Plots.traceIs(trace, 'bar') ? Color.defaultLine : dc[tracei % dc.length]);
            trace.error_y.color = Color.addOpacity(
                Color.rgb(yeColor),
                Color.opacity(yeColor) * trace.error_y.opacity);
            delete trace.error_y.opacity;
        }

        // convert bardir to orientation, and put the data into
        // the axes it's eventually going to be used with
        if('bardir' in trace) {
            if(trace.bardir==='h' && (Plots.traceIs(trace, 'bar') ||
                     trace.type.substr(0,9)==='histogram')) {
                trace.orientation = 'h';
                swapXYData(trace);
            }
            delete trace.bardir;
        }

        // now we have only one 1D histogram type, and whether
        // it uses x or y data depends on trace.orientation
        if(trace.type==='histogramy') swapXYData(trace);
        if(trace.type==='histogramx' || trace.type==='histogramy') {
            trace.type = 'histogram';
        }

        // scl->scale, reversescl->reversescale
        if('scl' in trace) {
            trace.colorscale = trace.scl;
            delete trace.scl;
        }
        if('reversescl' in trace) {
            trace.reversescale = trace.reversescl;
            delete trace.reversescl;
        }

        // axis ids x1 -> x, y1-> y
        if(trace.xaxis) trace.xaxis = Axes.cleanId(trace.xaxis, 'x');
        if(trace.yaxis) trace.yaxis = Axes.cleanId(trace.yaxis, 'y');

        // scene ids scene1 -> scene
        if (trace.scene) {
            trace.scene = Gl3dLayout.cleanId(trace.scene);
        }

        if(!Plots.traceIs(trace, 'pie')) {
            if(Array.isArray(trace.textposition)) {
                trace.textposition = trace.textposition.map(cleanTextPosition);
            }
            else if(trace.textposition) {
                trace.textposition = cleanTextPosition(trace.textposition);
            }
        }

        // prune empty containers made before the new nestedProperty
        if(emptyContainer(trace, 'line')) delete trace.line;
        if('marker' in trace) {
            if(emptyContainer(trace.marker, 'line')) delete trace.marker.line;
            if(emptyContainer(trace, 'marker')) delete trace.marker;
        }

        // sanitize rgb(fractions) and rgba(fractions) that old tinycolor
        // supported, but new tinycolor does not because they're not valid css
        Lib.markTime('finished rest of cleanData, starting color');
        Color.clean(trace);
        Lib.markTime('finished cleanData color.clean');
    }
}

function plotPolar(gd, data, layout) {
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
    if(layout) gd.layout = layout;
    Micropolar.manager.fillLayout(gd);

    if(gd._fullLayout.autosize === 'initial' && gd._context.autosizable) {
        plotAutoSize(gd,{});
        gd._fullLayout.autosize = layout.autosize = true;
    }
    // resize canvas
    paperDiv.style({
        width: gd._fullLayout.width + 'px',
        height: gd._fullLayout.height + 'px'
    });

    // instantiate framework
    gd.framework = Micropolar.manager.framework(gd);

    // plot
    gd.framework({data: gd.data, layout: gd.layout}, paperDiv.node());

    // set undo point
    gd.framework.setUndoPoint();

    // get the resulting svg for extending it
    var polarPlotSVG = gd.framework.svg();

    // editable title
    var opacity = 1;
    var txt = gd._fullLayout.title;
    if(txt === '' || !txt) opacity = 0;
    var placeholderText = 'Click to enter title';

    var titleLayout = function() {
        this.call(Util.convertToTspans);
        //TODO: html/mathjax
        //TODO: center title
    };

    var title = polarPlotSVG.select('.title-group text')
        .call(titleLayout);

    if(gd._context.editable){
        title.attr({'data-unformatted': txt});
        if(!txt || txt === placeholderText){
            opacity = 0.2;
            title.attr({'data-unformatted': placeholderText})
                .text(placeholderText)
                .style({opacity: opacity})
                .on('mouseover.opacity',function() {
                    d3.select(this).transition().duration(100)
                        .style('opacity',1);
                })
                .on('mouseout.opacity',function() {
                    d3.select(this).transition().duration(1000)
                        .style('opacity',0);
                });
        }

        var setContenteditable = function() {
            this.call(Util.makeEditable)
                .on('edit', function(text){
                    gd.framework({layout: {title: text}});
                    this.attr({'data-unformatted': text})
                        .text(text)
                        .call(titleLayout);
                    this.call(setContenteditable);
                })
                .on('cancel', function() {
                    var txt = this.attr('data-unformatted');
                    this.text(txt).call(titleLayout);
                });
        };
        title.call(setContenteditable);
    }

    gd._context.setBackground(gd, gd._fullLayout.paper_bgcolor);
    Plots.addLinks(gd);

    return Promise.resolve();
}


function makePlotFramework(gd) {
    var gd3 = d3.select(gd),
        fullLayout = gd._fullLayout;

    /*
     * TODO - find a better place for 3D to initialize axes
     */
    if(fullLayout._hasGL3D) Gl3dLayout.initAxes(gd);

    // Plot container
    fullLayout._container = gd3.selectAll('.plot-container').data([0]);
    fullLayout._container.enter().insert('div', ':first-child')
        .classed('plot-container', true)
        .classed('plotly', true);

    // Make the svg container
    fullLayout._paperdiv = fullLayout._container.selectAll('.svg-container').data([0]);
    fullLayout._paperdiv.enter().append('div')
        .classed('svg-container',true)
        .style('position','relative');

    // Initial autosize
    if(fullLayout.autosize === 'initial') {
        plotAutoSize(gd, {});
        fullLayout.autosize = true;
        gd.layout.autosize = true;
    }

    // Make the graph containers
    // start fresh each time we get here, so we know the order comes out
    // right, rather than enter/exit which can muck up the order
    // TODO: sort out all the ordering so we don't have to
    // explicitly delete anything
    fullLayout._glcontainer = fullLayout._paperdiv.selectAll('.gl-container')
        .data([0]);
    fullLayout._glcontainer.enter().append('div')
        .classed('gl-container', true);

    fullLayout._geocontainer = fullLayout._paperdiv.selectAll('.geo-container')
        .data([0]);
    fullLayout._geocontainer.enter().append('div')
        .classed('geo-container', true);

    fullLayout._paperdiv.selectAll('.main-svg').remove();

    fullLayout._paper = fullLayout._paperdiv.insert('svg', ':first-child')
        .classed('main-svg', true);

    fullLayout._toppaper = fullLayout._paperdiv.append('svg')
        .classed('main-svg', true);

    if(!fullLayout._uid) {
        var otherUids = [];
        d3.selectAll('defs').each(function() {
            if(this.id) otherUids.push(this.id.split('-')[1]);
        });
        fullLayout._uid = Lib.randstr(otherUids);
    }

    fullLayout._paperdiv.selectAll('.main-svg')
        .attr({
            xmlns: 'http://www.w3.org/2000/svg',
            // odd d3 quirk - need namespace twice??
            'xmlns:xmlns:xlink': 'http://www.w3.org/1999/xlink'
        });

    fullLayout._defs = fullLayout._paper.append('defs')
        .attr('id', 'defs-' + fullLayout._uid);

    fullLayout._draggers = fullLayout._paper.append('g')
        .classed('draglayer', true);

    var subplots = Axes.getSubplots(gd);
    if(subplots.join('') !== Object.keys(gd._fullLayout._plots || {}).join('')) {
        makeSubplots(gd, subplots);
    }

    if(fullLayout._hasCartesian) makeCartesianPlotFramwork(gd, subplots);

    // single shape and pie layers for the whole plot
    fullLayout._shapelayer = fullLayout._paper.append('g').classed('shapelayer', true);
    fullLayout._pielayer = fullLayout._paper.append('g').classed('pielayer', true);

    // fill in image server scrape-svg
    fullLayout._glimages = fullLayout._paper.append('g').classed('glimages', true);
    fullLayout._geoimages = fullLayout._paper.append('g').classed('geoimages', true);

    // lastly info (legend, annotations) and hover layers go on top
    // these are in a different svg element normally, but get collapsed into a single
    // svg when exporting (after inserting 3D)
    fullLayout._infolayer = fullLayout._toppaper.append('g').classed('infolayer', true);
    fullLayout._hoverlayer = fullLayout._toppaper.append('g').classed('hoverlayer', true);

    gd.emit('plotly_framework');

    // position and style the containers, make main title
    var frameWorkDone = Lib.syncOrAsync([
        layoutStyles,
        function goAxes() { return Axes.doTicks(gd,'redraw'); },
        Fx.init
    ], gd);

    if(frameWorkDone && frameWorkDone.then) {
        gd._promises.push(frameWorkDone);
    }

    return frameWorkDone;
}


function doCalcdata(gd) {
    var axList = Axes.list(gd),
        fullData = gd._fullData,
        fullLayout = gd._fullLayout;

    var i, trace, module, cd;

    var calcdata = gd.calcdata = new Array(fullData.length);

    // extra helper variables
    // firstscatter: fill-to-next on the first trace goes to zero
    gd.firstscatter = true;

    // how many box plots do we have (in case they're grouped)
    gd.numboxes = 0;

    // for calculating avg luminosity of heatmaps
    gd._hmpixcount = 0;
    gd._hmlumcount = 0;

    // for sharing colors across pies (and for legend)
    fullLayout._piecolormap = {};
    fullLayout._piedefaultcolorcount = 0;

    // delete category list, if there is one, so we start over
    // to be filled in later by ax.d2c
    for (i = 0; i < axList.length; i++) {
        axList[i]._categories = [];
    }

    for (i = 0; i < fullData.length; i++) {
        trace = fullData[i];
        module = trace._module;
        cd = [];

        if (module && trace.visible === true) {
            if (module.calc) cd = module.calc(gd, trace);
        }

        // make sure there is a first point
        // this ensures there is a calcdata item for every trace,
        // even if cartesian logic doesn't handle it
        if (!Array.isArray(cd) || !cd[0]) cd = [{x: false, y: false}];

        // add the trace-wide properties to the first point,
        // per point properties to every point
        // t is the holder for trace-wide properties
        if (!cd[0].t) cd[0].t = {};
        cd[0].trace = trace;

        Lib.markTime('done with calcdata for '+i);
        calcdata[i] = cd;
    }
}


function plotGl3d(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        sceneIds = Plots.getSubplotIds(fullLayout, 'gl3d');

    var i, sceneId, fullSceneData, scene, sceneOptions;

    fullLayout._paperdiv.style({
        width: fullLayout.width + 'px',
        height: fullLayout.height + 'px'
    });

    gd._context.setBackground(gd, fullLayout.paper_bgcolor);

    for (i = 0; i < sceneIds.length; i++) {
        sceneId = sceneIds[i];
        fullSceneData = Plots.getSubplotData(fullData, 'gl3d', sceneId);
        scene = fullLayout[sceneId]._scene;  // ref. to corresp. Scene instance

        // If Scene is not instantiated, create one!
        if(scene === undefined) {
            sceneOptions = {
                container: gd.querySelector('.gl-container'),
                id: sceneId,
                staticPlot: gd._context.staticPlot,
                plotGlPixelRatio: gd._context.plotGlPixelRatio
            };
            scene = new Scene(sceneOptions, fullLayout);
            fullLayout[sceneId]._scene = scene;  // set ref to Scene instance
        }

        scene.plot(fullSceneData, fullLayout, gd.layout);  // takes care of business
    }
}


function plotGeo(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        geoIds = Plots.getSubplotIds(fullLayout, 'geo');

    var i, geoId, fullGeoData, geo;

    // if 'plotly-geo-assets.js' is not included,
    // initialize object to keep reference to every loaded topojson
    if(window.PlotlyGeoAssets === undefined) {
        window.PlotlyGeoAssets = { topojson : {} };
    }

    for (i = 0; i < geoIds.length; i++) {
        geoId = geoIds[i];
        fullGeoData = Plots.getSubplotData(fullData, 'geo', geoId);
        geo = fullLayout[geoId]._geo;

        // If geo is not instantiated, create one!
        if(geo === undefined) {
            geo = new Geo(
                {
                    id: geoId,
                    container: fullLayout._geocontainer.node(),
                    topojsonURL: gd._context.topojsonURL
                },
                fullLayout
            );
            fullLayout[geoId]._geo = geo;
        }

        geo.plot(fullGeoData, fullLayout, gd._promises);
    }
}


function plotGl2d(gd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');

    for(var i = 0; i < subplotIds.length; i++) {
        var subplotId = subplotIds[i],
            subplotObj = fullLayout._plots[subplotId],
            fullSubplotData = Plots.getSubplotData(fullData, 'gl2d', subplotId);
        var scene;

        // ref. to corresp. Scene instance
        scene = subplotObj._scene2d;

        // If Scene is not instantiated, create one!
        if(scene === undefined) {
            scene = new Scene2D({
                    container: gd.querySelector('.gl-container'),
                    id: subplotId,
                    staticPlot: gd._context.staticPlot,
                    plotGlPixelRatio: gd._context.plotGlPixelRatio
                },
                fullLayout
            );

            // set ref to Scene instance
            subplotObj._scene2d = scene;
        }

        scene.plot(fullSubplotData, fullLayout, gd.layout);
    }
}


function emptyContainer(outer, innerStr) {
    return (innerStr in outer) &&
        (typeof outer[innerStr] === 'object') &&
        (Object.keys(outer[innerStr]).length === 0);
}


function cleanLayout(layout) {
    // make a few changes to the layout right away
    // before it gets used for anything
    // backward compatibility and cleanup of nonstandard options
    var i, j;

    if(!layout) layout = {};

    // cannot have (x|y)axis1, numbering goes axis, axis2, axis3...
    if(layout.xaxis1) {
        if(!layout.xaxis) layout.xaxis = layout.xaxis1;
        delete layout.xaxis1;
    }
    if(layout.yaxis1) {
        if(!layout.yaxis) layout.yaxis = layout.yaxis1;
        delete layout.yaxis1;
    }

    var axList = Axes.list({_fullLayout: layout});
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];
        if(ax.anchor && ax.anchor !== 'free') {
            ax.anchor = Axes.cleanId(ax.anchor);
        }
        if(ax.overlaying) ax.overlaying = Axes.cleanId(ax.overlaying);

        // old method of axis type - isdate and islog (before category existed)
        if(!ax.type) {
            if(ax.isdate) ax.type='date';
            else if(ax.islog) ax.type='log';
            else if(ax.isdate===false && ax.islog===false) ax.type='linear';
        }
        if(ax.autorange==='withzero' || ax.autorange==='tozero') {
            ax.autorange = true;
            ax.rangemode = 'tozero';
        }
        delete ax.islog;
        delete ax.isdate;
        delete ax.categories; // replaced by _categories

        // prune empty domain arrays made before the new nestedProperty
        if(emptyContainer(ax, 'domain')) delete ax.domain;

        // autotick -> tickmode
        if(ax.autotick !== undefined) {
            if(ax.tickmode === undefined) {
                ax.tickmode = ax.autotick ? 'auto' : 'linear';
            }
            delete ax.autotick;
        }
    }

    if(layout.annotations !== undefined && !Array.isArray(layout.annotations)) {
        console.log('annotations must be an array');
        delete layout.annotations;
    }
    var annotationsLen = (layout.annotations || []).length;
    for(i = 0; i < annotationsLen; i++) {
        var ann = layout.annotations[i];
        if(ann.ref) {
            if(ann.ref==='paper') {
                ann.xref = 'paper';
                ann.yref = 'paper';
            }
            else if(ann.ref==='data') {
                ann.xref = 'x';
                ann.yref = 'y';
            }
            delete ann.ref;
        }
        cleanAxRef(ann, 'xref');
        cleanAxRef(ann, 'yref');
    }

    if(layout.shapes !== undefined && !Array.isArray(layout.shapes)) {
        console.log('shapes must be an array');
        delete layout.shapes;
    }
    var shapesLen = (layout.shapes||[]).length;
    for(i = 0; i < shapesLen; i++) {
        var shape = layout.shapes[i];
        cleanAxRef(shape, 'xref');
        cleanAxRef(shape, 'yref');
    }

    var legend = layout.legend;
    if(legend) {
        // check for old-style legend positioning (x or y is +/- 100)
        if(legend.x > 3) {
            legend.x = 1.02;
            legend.xanchor = 'left';
        }
        else if(legend.x < -2) {
            legend.x = -0.02;
            legend.xanchor = 'right';
        }

        if(legend.y > 3) {
            legend.y = 1.02;
            legend.yanchor = 'bottom';
        }
        else if(legend.y < -2) {
            legend.y = -0.02;
            legend.yanchor = 'top';
        }
    }

    /*
     * Moved from rotate -> orbit for dragmode
     */
    if (layout.dragmode === 'rotate') layout.dragmode = 'orbit';

    // cannot have scene1, numbering goes scene, scene2, scene3...
    if(layout.scene1) {
        if(!layout.scene) layout.scene = layout.scene1;
        delete layout.scene1;
    }

    /*
     * Clean up Scene layouts
     */
    var sceneIds = Plots.getSubplotIds(layout, 'gl3d');
    var scene, cameraposition, rotation,
        radius, center, mat, eye;
    for (i = 0; i < sceneIds.length; i++) {
        scene = layout[sceneIds[i]];

        /*
         * Clean old Camera coords
         */
        cameraposition = scene.cameraposition;
        if (Array.isArray(cameraposition) && cameraposition[0].length === 4) {
            rotation = cameraposition[0];
            center   = cameraposition[1];
            radius   = cameraposition[2];
            mat = m4FromQuat([], rotation);
            eye = [];
            for (j = 0; j < 3; ++j) {
                eye[j] = center[i] + radius * mat[2 + 4 * j];
            }
            scene.camera = {
                eye: {x: eye[0], y: eye[1], z: eye[2]},
                center: {x: center[0], y: center[1], z: center[2]},
                up: {x: mat[1], y: mat[5], z: mat[9]}
            };
            delete scene.cameraposition;
        }
    }

    // sanitize rgb(fractions) and rgba(fractions) that old tinycolor
    // supported, but new tinycolor does not because they're not valid css
    Lib.markTime('finished rest of cleanLayout, starting color');
    Color.clean(layout);
    Lib.markTime('finished cleanLayout color.clean');

    return layout;
}

function plotAutoSize(gd, aobj) {
    var fullLayout = gd._fullLayout,
        context = gd._context,
        computedStyle;

    var newHeight, newWidth;

    gd.emit('plotly_autosize');

    // embedded in an iframe - just take the full iframe size
    // if we get to this point, with no aspect ratio restrictions
    if(gd._context.fillFrame) {
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;

        // somehow we get a few extra px height sometimes...
        // just hide it
        document.body.style.overflow = 'hidden';
    }
    else if(isNumeric(context.frameMargins) && context.frameMargins > 0) {
        var reservedMargins = calculateReservedMargins(gd._boundingBoxMargins),
            reservedWidth = reservedMargins.left + reservedMargins.right,
            reservedHeight = reservedMargins.bottom + reservedMargins.top,
            gdBB = fullLayout._container.node().getBoundingClientRect(),
            factor = 1 - 2*context.frameMargins;

        newWidth = Math.round(factor * (gdBB.width - reservedWidth));
        newHeight = Math.round(factor * (gdBB.height - reservedHeight));
    }
    else {
        // plotly.js - let the developers do what they want, either
        // provide height and width for the container div,
        // specify size in layout, or take the defaults,
        // but don't enforce any ratio restrictions
        computedStyle = window.getComputedStyle(gd);
        newHeight = parseFloat(computedStyle.height) || fullLayout.height;
        newWidth = parseFloat(computedStyle.width) || fullLayout.width;
    }

    if(Math.abs(fullLayout.width - newWidth) > 1 ||
            Math.abs(fullLayout.height - newHeight) > 1) {
        fullLayout.height = gd.layout.height = newHeight;
        fullLayout.width = gd.layout.width = newWidth;
    }
    // if there's no size change, update layout but
    // delete the autosize attr so we don't redraw
    // but can't call layoutStyles for initial autosize
    else if(fullLayout.autosize !== 'initial') {
        delete(aobj.autosize);
        fullLayout.autosize = gd.layout.autosize = true;
    }

    Plots.sanitizeMargins(fullLayout);

    return aobj;
}


function makeSubplots(gd, subplots) {
    var _plots = gd._fullLayout._plots = {};
    var subplot, plotinfo;

    function getAxisFunc(subplot, axLetter) {
        return function() {
            return Axes.getFromId(gd, subplot, axLetter);
        };
    }

    for(var i = 0; i < subplots.length; i++) {
        subplot = subplots[i];
        plotinfo = _plots[subplot] = {};

        plotinfo.id = subplot;

        // references to the axis objects controlling this subplot
        plotinfo.x = getAxisFunc(subplot, 'x');
        plotinfo.y = getAxisFunc(subplot, 'y');

        // TODO investigate why replacing calls to .x and .y
        // for .xaxis and .yaxis makes the `pseudo_html`
        // test image fail
        plotinfo.xaxis = plotinfo.x();
        plotinfo.yaxis = plotinfo.y();
    }
}


function makeCartesianPlotFramwork(gd, subplots) {
    var fullLayout = gd._fullLayout;

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
        svg.append('g').classed('boxlayer', true);
        svg.append('g').classed('scatterlayer', true);
    }

    // create all the layers in order, so we know they'll stay in order
    var overlays = [];

    fullLayout._paper.selectAll('g.subplot').data(subplots)
      .enter().append('g')
        .classed('subplot', true)
        .each(function(subplot) {
            var plotinfo = fullLayout._plots[subplot],
                plotgroup = plotinfo.plotgroup = d3.select(this).classed(subplot, true),
                xa = plotinfo.xaxis,
                ya = plotinfo.yaxis;

            // references to any subplots overlaid on this one
            plotinfo.overlays = [];

            // is this subplot overlaid on another?
            // ax.overlaying is the id of another axis of the same
            // dimension that this one overlays to be an overlaid subplot,
            // the main plot must exist make sure we're not trying to
            // overlay on an axis that's already overlaying another
            var xa2 = Axes.getFromId(gd, xa.overlaying) || xa;
            if(xa2 !== xa && xa2.overlaying) {
                xa2 = xa;
                xa.overlaying = false;
            }

            var ya2 = Axes.getFromId(gd, ya.overlaying) || ya;
            if(ya2 !== ya && ya2.overlaying) {
                ya2 = ya;
                ya.overlaying = false;
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
                xa.domain = xa2.domain.slice();
                ya.domain = ya2.domain.slice();
            }
            else {
                // main subplot - make the components of
                // the plot and containers for overlays
                plotinfo.bg = plotgroup.append('rect')
                    .style('stroke-width', 0);
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
            plotinfo.draglayer = fullLayout._draggers.append('g');
        });

    // now make the components of overlaid subplots
    // overlays don't have backgrounds, and append all
    // their other components to the corresponding
    // extra groups of their main plots.
    overlays.forEach(function(plotinfo) {
        var mainplot = fullLayout._plots[plotinfo.mainplot];
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
        var plotinfo = fullLayout._plots[subplot];

        plotinfo.plot
            .attr('preserveAspectRatio', 'none')
            .style('fill', 'none');
        plotinfo.xlines
            .style('fill', 'none')
            .classed('crisp', true);
        plotinfo.ylines
            .style('fill', 'none')
            .classed('crisp', true);
    });
}


function cleanAxRef(container, attr) {
    var valIn = container[attr],
        axLetter = attr.charAt(0);
    if(valIn && valIn !== 'paper') {
        container[attr] = Axes.cleanId(valIn, axLetter);
    }
}


function layoutStyles(gd) {
    return Lib.syncOrAsync([Plots.doAutoMargin, lsInner], gd);
}

function lsInner(gd) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._size,
        axList = Axes.list(gd),
        i;

    // clear axis line positions, to be set in the subplot loop below
    for(i = 0; i < axList.length; i++) axList[i]._linepositions = {};

    fullLayout._paperdiv
        .style({
            width: fullLayout.width + 'px',
            height: fullLayout.height + 'px'
        })
        .selectAll('.main-svg')
            .call(Drawing.setSize, fullLayout.width, fullLayout.height);

    gd._context.setBackground(gd, fullLayout.paper_bgcolor);

    var freefinished = [];
    fullLayout._paper.selectAll('g.subplot').each(function(subplot) {
        var plotinfo = fullLayout._plots[subplot],
            xa = Axes.getFromId(gd, subplot, 'x'),
            ya = Axes.getFromId(gd, subplot, 'y');
        xa.setScale(); // this may already be done... not sure
        ya.setScale();

        if(plotinfo.bg) {
            plotinfo.bg
                .call(Drawing.setRect,
                    xa._offset-gs.p, ya._offset-gs.p,
                    xa._length+2*gs.p, ya._length+2*gs.p)
                .call(Color.fill, fullLayout.plot_bgcolor);
        }
        plotinfo.plot
            .call(Drawing.setRect,
                xa._offset, ya._offset, xa._length, ya._length);

        var xlw = Drawing.crispRound(gd, xa.linewidth, 1),
            ylw = Drawing.crispRound(gd, ya.linewidth, 1),
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
            toppos += ya._offset - gs.t;
            bottompos += ya._offset - gs.t;
        }
        if(showfreey) {
            originy = 'translate('+gs.l+','+ya._offset+')';
            leftpos += xa._offset - gs.l;
            rightpos += xa._offset - gs.l;
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
            .call(Color.stroke, xa.showline ?
                xa.linecolor : 'rgba(0,0,0,0)');
        plotinfo.ylines
            .attr('transform', originy)
            .attr('d',(
                (showleft ? ('M'+leftpos+ypathSuffix) : '') +
                (showright ? ('M'+rightpos+ypathSuffix) : '') +
                (showfreey ? ('M'+freeposy+ypathSuffix) : '')) ||
                'M0,0')
            .attr('stroke-width',ylw+'px')
            .call(Color.stroke,ya.showline ?
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

    Axes.makeClipPaths(gd);

    Titles.draw(gd, 'gtitle');

    manageModeBar(gd);

    return gd._promises.length && Promise.all(gd._promises);
}

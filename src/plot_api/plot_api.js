/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var m4FromQuat = require('gl-mat4/fromQuat');
var isNumeric = require('fast-isnumeric');

var Plotly = require('../plotly');
var Lib = require('../lib');
var Events = require('../lib/events');
var Queue = require('../lib/queue');

var Plots = require('../plots/plots');
var Fx = require('../plots/cartesian/graph_interact');

var Color = require('../components/color');
var Drawing = require('../components/drawing');
var ErrorBars = require('../components/errorbars');
var Images = require('../components/images');
var Legend = require('../components/legend');
var RangeSlider = require('../components/rangeslider');
var RangeSelector = require('../components/rangeselector');
var Shapes = require('../components/shapes');
var Titles = require('../components/titles');
var manageModeBar = require('../components/modebar/manage');
var xmlnsNamespaces = require('../constants/xmlns_namespaces');


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
Plotly.plot = function(gd, data, layout, config) {
    Lib.markTime('in plot');

    gd = getGraphDiv(gd);

    // Events.init is idempotent and bails early if gd has already been init'd
    Events.init(gd);

    var okToPlot = Events.triggerHandler(gd, 'plotly_beforeplot', [data, layout, config]);
    if(okToPlot === false) return Promise.reject();

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

    var graphWasEmpty = ((gd.data || []).length === 0 && Array.isArray(data));

    // if there is already data on the graph, append the new data
    // if you only want to redraw, pass a non-array for data
    if(Array.isArray(data)) {
        cleanData(data, gd.data);

        if(graphWasEmpty) gd.data = data;
        else gd.data.push.apply(gd.data, data);

        // for routines outside graph_obj that want a clean tab
        // (rather than appending to an existing one) gd.empty
        // is used to determine whether to make a new tab
        gd.empty = false;
    }

    if(!gd.layout || graphWasEmpty) gd.layout = cleanLayout(layout);

    // if the user is trying to drag the axes, allow new data and layout
    // to come in but don't allow a replot.
    if(gd._dragging) {
        // signal to drag handler that after everything else is done
        // we need to replot, because something has changed
        gd._replotPending = true;
        return Promise.reject();
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
    var hasData = gd._fullData.length > 0;

    var subplots = Plotly.Axes.getSubplots(gd).join(''),
        oldSubplots = Object.keys(gd._fullLayout._plots || {}).join(''),
        hasSameSubplots = (oldSubplots === subplots);

    // Make or remake the framework (ie container and axes) if we need to
    // note: if they container already exists and has data,
    //  the new layout gets ignored (as it should)
    //  but if there's no data there yet, it's just a placeholder...
    //  then it should destroy and remake the plot
    if(hasData) {
        if(gd.framework !== makePlotFramework || graphWasEmpty || !hasSameSubplots) {
            gd.framework = makePlotFramework;
            makePlotFramework(gd);
        }
    }
    else if(!hasSameSubplots) {
        gd.framework = makePlotFramework;
        makePlotFramework(gd);
    }
    else if(graphWasEmpty) makePlotFramework(gd);

    // save initial axis range once per graph
    if(graphWasEmpty) Plotly.Axes.saveRangeInitial(gd);

    var fullLayout = gd._fullLayout;

    // prepare the data and find the autorange

    // generate calcdata, if we need to
    // to force redoing calcdata, just delete it before calling Plotly.plot
    var recalc = !gd.calcdata || gd.calcdata.length !== (gd.data || []).length;
    if(recalc) doCalcdata(gd);

    // in case it has changed, attach fullData traces to calcdata
    for(var i = 0; i < gd.calcdata.length; i++) {
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
        RangeSelector.draw(gd);

        for(i = 0; i < calcdata.length; i++) {
            cd = calcdata[i];
            trace = cd[0].trace;
            if(trace.visible !== true || !trace._module.colorbar) {
                Plots.autoMargin(gd, 'cb' + trace.uid);
            }
            else trace._module.colorbar(gd, cd);
        }

        Plots.doAutoMargin(gd);
        return Plots.previousPromises(gd);
    }

    function marginPushersAgain() {
        // in case the margins changed, draw margin pushers again
        var seq = JSON.stringify(fullLayout._size) === oldmargins ?
            [] : [marginPushers, layoutStyles];
        return Lib.syncOrAsync(seq.concat(Fx.init), gd);
    }

    function positionAndAutorange() {
        if(!recalc) return;

        var subplots = Plots.getSubplotIds(fullLayout, 'cartesian'),
            modules = fullLayout._modules;

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
            Plotly.Annotations.calcAutorange,
            doAutoRange
        ], gd);
    }

    function doAutoRange() {
        var axList = Plotly.Axes.list(gd, '', true);
        for(var i = 0; i < axList.length; i++) {
            Plotly.Axes.doAutoRange(axList[i]);
        }
    }

    function drawAxes() {
        // draw ticks, titles, and calculate axis scaling (._b, ._m)
        return Plotly.Axes.doTicks(gd, 'redraw');
    }

    // Now plot the data
    function drawData() {
        var calcdata = gd.calcdata,
            i;

        // in case of traces that were heatmaps or contour maps
        // previously, remove them and their colorbars explicitly
        for(i = 0; i < calcdata.length; i++) {
            var trace = calcdata[i][0].trace,
                isVisible = (trace.visible === true),
                uid = trace.uid;

            if(!isVisible || !Plots.traceIs(trace, '2dMap')) {
                fullLayout._paper.selectAll(
                    '.hm' + uid +
                    ',.contour' + uid +
                    ',#clip' + uid
                ).remove();
            }

            if(!isVisible || !trace._module.colorbar) {
                fullLayout._infolayer.selectAll('.cb' + uid).remove();
            }
        }

        // loop over the base plot modules present on graph
        var basePlotModules = fullLayout._basePlotModules;
        for(i = 0; i < basePlotModules.length; i++) {
            basePlotModules[i].plot(gd);
        }

        // styling separate from drawing
        Plots.style(gd);
        Lib.markTime('done Plots.style');

        // show annotations and shapes
        Shapes.drawAll(gd);
        Plotly.Annotations.drawAll(gd);

        // source links
        Plots.addLinks(gd);

        // Mark the first render as complete
        gd._replotting = false;

        return Plots.previousPromises(gd);
    }

    // An initial paint must be completed before these components can be
    // correctly sized and the whole plot re-margined. gd._replotting must
    // be set to false before these will work properly.
    function finalDraw() {
        Shapes.drawAll(gd);
        Images.draw(gd);
        Plotly.Annotations.drawAll(gd);
        Legend.draw(gd);
        RangeSlider.draw(gd);
        RangeSelector.draw(gd);
    }

    function cleanUp() {
        // now we're REALLY TRULY done plotting...
        // so mark it as done and let other procedures call a replot
        Lib.markTime('done plot');
        gd.emit('plotly_afterplot');
    }

    Lib.syncOrAsync([
        Plots.previousPromises,
        marginPushers,
        marginPushersAgain,
        positionAndAutorange,
        layoutStyles,
        drawAxes,
        drawData,
        finalDraw
    ], gd, cleanUp);

    // even if everything we did was synchronous, return a promise
    // so that the caller doesn't care which route we took
    return Promise.all(gd._promises).then(function() {
        return gd;
    });
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
    else if(gd === null || gd === undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;  // otherwise assume that gd is a DOM element
}

function opaqueSetBackground(gd, bgColor) {
    gd._fullLayout._paperdiv.style('background', 'white');
    Plotly.defaultConfig.setBackground(gd, bgColor);
}

function setPlotContext(gd, config) {
    if(!gd._context) gd._context = Lib.extendFlat({}, Plotly.defaultConfig);
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
        .classed('svg-container', true)
        .style('position', 'relative');

    // empty it everytime for now
    paperDiv.html('');

    // fulfill gd requirements
    if(data) gd.data = data;
    if(layout) gd.layout = layout;
    Plotly.micropolar.manager.fillLayout(gd);

    if(gd._fullLayout.autosize === 'initial' && gd._context.autosizable) {
        plotAutoSize(gd, {});
        gd._fullLayout.autosize = layout.autosize = true;
    }
    // resize canvas
    paperDiv.style({
        width: gd._fullLayout.width + 'px',
        height: gd._fullLayout.height + 'px'
    });

    // instantiate framework
    gd.framework = Plotly.micropolar.manager.framework(gd);

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
        this.call(Plotly.util.convertToTspans);
        //TODO: html/mathjax
        //TODO: center title
    };

    var title = polarPlotSVG.select('.title-group text')
        .call(titleLayout);

    if(gd._context.editable) {
        title.attr({'data-unformatted': txt});
        if(!txt || txt === placeholderText) {
            opacity = 0.2;
            title.attr({'data-unformatted': placeholderText})
                .text(placeholderText)
                .style({opacity: opacity})
                .on('mouseover.opacity', function() {
                    d3.select(this).transition().duration(100)
                        .style('opacity', 1);
                })
                .on('mouseout.opacity', function() {
                    d3.select(this).transition().duration(1000)
                        .style('opacity', 0);
                });
        }

        var setContenteditable = function() {
            this.call(Plotly.util.makeEditable)
                .on('edit', function(text) {
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

    var axList = Plotly.Axes.list({_fullLayout: layout});
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];
        if(ax.anchor && ax.anchor !== 'free') {
            ax.anchor = Plotly.Axes.cleanId(ax.anchor);
        }
        if(ax.overlaying) ax.overlaying = Plotly.Axes.cleanId(ax.overlaying);

        // old method of axis type - isdate and islog (before category existed)
        if(!ax.type) {
            if(ax.isdate) ax.type = 'date';
            else if(ax.islog) ax.type = 'log';
            else if(ax.isdate === false && ax.islog === false) ax.type = 'linear';
        }
        if(ax.autorange === 'withzero' || ax.autorange === 'tozero') {
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
            if(ann.ref === 'paper') {
                ann.xref = 'paper';
                ann.yref = 'paper';
            }
            else if(ann.ref === 'data') {
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
    var shapesLen = (layout.shapes || []).length;
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
    if(layout.dragmode === 'rotate') layout.dragmode = 'orbit';

    // cannot have scene1, numbering goes scene, scene2, scene3...
    if(layout.scene1) {
        if(!layout.scene) layout.scene = layout.scene1;
        delete layout.scene1;
    }

    /*
     * Clean up Scene layouts
     */
    var sceneIds = Plots.getSubplotIds(layout, 'gl3d');
    for(i = 0; i < sceneIds.length; i++) {
        var scene = layout[sceneIds[i]];

        // clean old Camera coords
        var cameraposition = scene.cameraposition;
        if(Array.isArray(cameraposition) && cameraposition[0].length === 4) {
            var rotation = cameraposition[0],
                center = cameraposition[1],
                radius = cameraposition[2],
                mat = m4FromQuat([], rotation),
                eye = [];

            for(j = 0; j < 3; ++j) {
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

function cleanAxRef(container, attr) {
    var valIn = container[attr],
        axLetter = attr.charAt(0);
    if(valIn && valIn !== 'paper') {
        container[attr] = Plotly.Axes.cleanId(valIn, axLetter);
    }
}

// Make a few changes to the data right away
// before it gets used for anything
function cleanData(data, existingData) {

    // Enforce unique IDs
    var suids = [], // seen uids --- so we can weed out incoming repeats
        uids = data.concat(Array.isArray(existingData) ? existingData : [])
               .filter(function(trace) { return 'uid' in trace; })
               .map(function(trace) { return trace.uid; });

    for(var tracei = 0; tracei < data.length; tracei++) {
        var trace = data[tracei];
        var i;

        // assign uids to each trace and detect collisions.
        if(!('uid' in trace) || suids.indexOf(trace.uid) !== -1) {
            var newUid;

            for(i = 0; i < 100; i++) {
                newUid = Lib.randstr(uids);
                if(suids.indexOf(newUid) === -1) break;
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
        if(trace.type === 'histogramy' && 'xbins' in trace && !('ybins' in trace)) {
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
            if(trace.bardir === 'h' && (Plots.traceIs(trace, 'bar') ||
                     trace.type.substr(0, 9) === 'histogram')) {
                trace.orientation = 'h';
                swapXYData(trace);
            }
            delete trace.bardir;
        }

        // now we have only one 1D histogram type, and whether
        // it uses x or y data depends on trace.orientation
        if(trace.type === 'histogramy') swapXYData(trace);
        if(trace.type === 'histogramx' || trace.type === 'histogramy') {
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
        if(trace.xaxis) trace.xaxis = Plotly.Axes.cleanId(trace.xaxis, 'x');
        if(trace.yaxis) trace.yaxis = Plotly.Axes.cleanId(trace.yaxis, 'y');

        // scene ids scene1 -> scene
        if(Plots.traceIs(trace, 'gl3d') && trace.scene) {
            trace.scene = Plots.subplotsRegistry.gl3d.cleanId(trace.scene);
        }

        if(!Plots.traceIs(trace, 'pie')) {
            if(Array.isArray(trace.textposition)) {
                trace.textposition = trace.textposition.map(cleanTextPosition);
            }
            else if(trace.textposition) {
                trace.textposition = cleanTextPosition(trace.textposition);
            }
        }

        // fix typo in colorscale definition
        if(Plots.traceIs(trace, '2dMap')) {
            if(trace.colorscale === 'YIGnBu') trace.colorscale = 'YlGnBu';
            if(trace.colorscale === 'YIOrRd') trace.colorscale = 'YlOrRd';
        }
        if(Plots.traceIs(trace, 'markerColorscale') && trace.marker) {
            var cont = trace.marker;
            if(cont.colorscale === 'YIGnBu') cont.colorscale = 'YlGnBu';
            if(cont.colorscale === 'YIOrRd') cont.colorscale = 'YlOrRd';
        }

        // fix typo in surface 'highlight*' definitions
        if(trace.type === 'surface' && Lib.isPlainObject(trace.contours)) {
            var dims = ['x', 'y', 'z'];

            for(i = 0; i < dims.length; i++) {
                var opts = trace.contours[dims[i]];

                if(!Lib.isPlainObject(opts)) continue;

                if(opts.highlightColor) {
                    opts.highlightcolor = opts.highlightColor;
                    delete opts.highlightColor;
                }

                if(opts.highlightWidth) {
                    opts.highlightwidth = opts.highlightWidth;
                    delete opts.highlightWidth;
                }
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

// textposition - support partial attributes (ie just 'top')
// and incorrect use of middle / center etc.
function cleanTextPosition(textposition) {
    var posY = 'middle',
        posX = 'center';
    if(textposition.indexOf('top') !== -1) posY = 'top';
    else if(textposition.indexOf('bottom') !== -1) posY = 'bottom';

    if(textposition.indexOf('left') !== -1) posX = 'left';
    else if(textposition.indexOf('right') !== -1) posX = 'right';

    return posY + ' ' + posX;
}

function emptyContainer(outer, innerStr) {
    return (innerStr in outer) &&
        (typeof outer[innerStr] === 'object') &&
        (Object.keys(outer[innerStr]).length === 0);
}

// convenience function to force a full redraw, mostly for use by plotly.js
Plotly.redraw = function(gd) {
    gd = getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        console.log('This element is not a Plotly Plot', gd);
        return;
    }

    gd.calcdata = undefined;
    return Plotly.plot(gd).then(function() {
        gd.emit('plotly_redraw');
        return gd;
    });
};

/**
 * Convenience function to make idempotent plot option obvious to users.
 *
 * @param gd
 * @param {Object[]} data
 * @param {Object} layout
 * @param {Object} config
 */
Plotly.newPlot = function(gd, data, layout, config) {
    gd = getGraphDiv(gd);
    Plots.purge(gd);
    return Plotly.plot(gd, data, layout, config);
};

function doCalcdata(gd) {
    var axList = Plotly.Axes.list(gd),
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

    // initialize the category list, if there is one, so we start over
    // to be filled in later by ax.d2c
    for(i = 0; i < axList.length; i++) {
        axList[i]._categories = axList[i]._initialCategories.slice();
    }

    for(i = 0; i < fullData.length; i++) {
        trace = fullData[i];
        module = trace._module;
        cd = [];

        if(module && trace.visible === true) {
            if(module.calc) cd = module.calc(gd, trace);
        }

        // make sure there is a first point
        // this ensures there is a calcdata item for every trace,
        // even if cartesian logic doesn't handle it
        if(!Array.isArray(cd) || !cd[0]) cd = [{x: false, y: false}];

        // add the trace-wide properties to the first point,
        // per point properties to every point
        // t is the holder for trace-wide properties
        if(!cd[0].t) cd[0].t = {};
        cd[0].trace = trace;

        Lib.markTime('done with calcdata for ' + i);
        calcdata[i] = cd;
    }
}

/**
 * Wrap negative indicies to their positive counterparts.
 *
 * @param {Number[]} indices An array of indices
 * @param {Number} maxIndex The maximum index allowable (arr.length - 1)
 */
function positivifyIndices(indices, maxIndex) {
    var parentLength = maxIndex + 1,
        positiveIndices = [],
        i,
        index;

    for(i = 0; i < indices.length; i++) {
        index = indices[i];
        if(index < 0) {
            positiveIndices.push(parentLength + index);
        } else {
            positiveIndices.push(index);
        }
    }
    return positiveIndices;
}

/**
 * Ensures that an index array for manipulating gd.data is valid.
 *
 * Intended for use with addTraces, deleteTraces, and moveTraces.
 *
 * @param gd
 * @param indices
 * @param arrayName
 */
function assertIndexArray(gd, indices, arrayName) {
    var i,
        index;

    for(i = 0; i < indices.length; i++) {
        index = indices[i];

        // validate that indices are indeed integers
        if(index !== parseInt(index, 10)) {
            throw new Error('all values in ' + arrayName + ' must be integers');
        }

        // check that all indices are in bounds for given gd.data array length
        if(index >= gd.data.length || index < -gd.data.length) {
            throw new Error(arrayName + ' must be valid indices for gd.data.');
        }

        // check that indices aren't repeated
        if(indices.indexOf(index, i + 1) > -1 ||
                index >= 0 && indices.indexOf(-gd.data.length + index) > -1 ||
                index < 0 && indices.indexOf(gd.data.length + index) > -1) {
            throw new Error('each index in ' + arrayName + ' must be unique.');
        }
    }
}

/**
 * Private function used by Plotly.moveTraces to check input args
 *
 * @param gd
 * @param currentIndices
 * @param newIndices
 */
function checkMoveTracesArgs(gd, currentIndices, newIndices) {

    // check that gd has attribute 'data' and 'data' is array
    if(!Array.isArray(gd.data)) {
        throw new Error('gd.data must be an array.');
    }

    // validate currentIndices array
    if(typeof currentIndices === 'undefined') {
        throw new Error('currentIndices is a required argument.');
    } else if(!Array.isArray(currentIndices)) {
        currentIndices = [currentIndices];
    }
    assertIndexArray(gd, currentIndices, 'currentIndices');

    // validate newIndices array if it exists
    if(typeof newIndices !== 'undefined' && !Array.isArray(newIndices)) {
        newIndices = [newIndices];
    }
    if(typeof newIndices !== 'undefined') {
        assertIndexArray(gd, newIndices, 'newIndices');
    }

    // check currentIndices and newIndices are the same length if newIdices exists
    if(typeof newIndices !== 'undefined' && currentIndices.length !== newIndices.length) {
        throw new Error('current and new indices must be of equal length.');
    }

}
/**
 * A private function to reduce the type checking clutter in addTraces.
 *
 * @param gd
 * @param traces
 * @param newIndices
 */
function checkAddTracesArgs(gd, traces, newIndices) {
    var i,
        value;

    // check that gd has attribute 'data' and 'data' is array
    if(!Array.isArray(gd.data)) {
        throw new Error('gd.data must be an array.');
    }

    // make sure traces exists
    if(typeof traces === 'undefined') {
        throw new Error('traces must be defined.');
    }

    // make sure traces is an array
    if(!Array.isArray(traces)) {
        traces = [traces];
    }

    // make sure each value in traces is an object
    for(i = 0; i < traces.length; i++) {
        value = traces[i];
        if(typeof value !== 'object' || (Array.isArray(value) || value === null)) {
            throw new Error('all values in traces array must be non-array objects');
        }
    }

    // make sure we have an index for each trace
    if(typeof newIndices !== 'undefined' && !Array.isArray(newIndices)) {
        newIndices = [newIndices];
    }
    if(typeof newIndices !== 'undefined' && newIndices.length !== traces.length) {
        throw new Error(
            'if indices is specified, traces.length must equal indices.length'
        );
    }
}

/**
 * A private function to reduce the type checking clutter in spliceTraces.
 * Get all update Properties from gd.data. Validate inputs and outputs.
 * Used by prependTrace and extendTraces
 *
 * @param gd
 * @param update
 * @param indices
 * @param maxPoints
 */
function assertExtendTracesArgs(gd, update, indices, maxPoints) {

    var maxPointsIsObject = Lib.isPlainObject(maxPoints);

    if(!Array.isArray(gd.data)) {
        throw new Error('gd.data must be an array');
    }
    if(!Lib.isPlainObject(update)) {
        throw new Error('update must be a key:value object');
    }

    if(typeof indices === 'undefined') {
        throw new Error('indices must be an integer or array of integers');
    }

    assertIndexArray(gd, indices, 'indices');

    for(var key in update) {

        /*
         * Verify that the attribute to be updated contains as many trace updates
         * as indices. Failure must result in throw and no-op
         */
        if(!Array.isArray(update[key]) || update[key].length !== indices.length) {
            throw new Error('attribute ' + key + ' must be an array of length equal to indices array length');
        }

        /*
         * if maxPoints is an object it must match keys and array lengths of 'update' 1:1
         */
        if(maxPointsIsObject &&
            (!(key in maxPoints) || !Array.isArray(maxPoints[key]) ||
            maxPoints[key].length !== update[key].length)) {
            throw new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                            'corrispondence with the keys and number of traces in the update object');
        }
    }
}

/**
 * A private function to reduce the type checking clutter in spliceTraces.
 *
 * @param {Object|HTMLDivElement} gd
 * @param {Object} update
 * @param {Number[]} indices
 * @param {Number||Object} maxPoints
 * @return {Object[]}
 */
function getExtendProperties(gd, update, indices, maxPoints) {

    var maxPointsIsObject = Lib.isPlainObject(maxPoints),
        updateProps = [];
    var trace, target, prop, insert, maxp;

    // allow scalar index to represent a single trace position
    if(!Array.isArray(indices)) indices = [indices];

    // negative indices are wrapped around to their positive value. Equivalent to python indexing.
    indices = positivifyIndices(indices, gd.data.length - 1);

    // loop through all update keys and traces and harvest validated data.
    for(var key in update) {

        for(var j = 0; j < indices.length; j++) {

            /*
             * Choose the trace indexed by the indices map argument and get the prop setter-getter
             * instance that references the key and value for this particular trace.
             */
            trace = gd.data[indices[j]];
            prop = Lib.nestedProperty(trace, key);

            /*
             * Target is the existing gd.data.trace.dataArray value like "x" or "marker.size"
             * Target must exist as an Array to allow the extend operation to be performed.
             */
            target = prop.get();
            insert = update[key][j];

            if(!Array.isArray(insert)) {
                throw new Error('attribute: ' + key + ' index: ' + j + ' must be an array');
            }
            if(!Array.isArray(target)) {
                throw new Error('cannot extend missing or non-array attribute: ' + key);
            }

            /*
             * maxPoints may be an object map or a scalar. If object select the key:value, else
             * Use the scalar maxPoints for all key and trace combinations.
             */
            maxp = maxPointsIsObject ? maxPoints[key][j] : maxPoints;

            // could have chosen null here, -1 just tells us to not take a window
            if(!isNumeric(maxp)) maxp = -1;

            /*
             * Wrap the nestedProperty in an object containing required data
             * for lengthening and windowing this particular trace - key combination.
             * Flooring maxp mirrors the behaviour of floats in the Array.slice JSnative function.
             */
            updateProps.push({
                prop: prop,
                target: target,
                insert: insert,
                maxp: Math.floor(maxp)
            });
        }
    }

    // all target and insertion data now validated
    return updateProps;
}

/**
 * A private function to key Extend and Prepend traces DRY
 *
 * @param {Object|HTMLDivElement} gd
 * @param {Object} update
 * @param {Number[]} indices
 * @param {Number||Object} maxPoints
 * @param {Function} lengthenArray
 * @param {Function} spliceArray
 * @return {Object}
 */
function spliceTraces(gd, update, indices, maxPoints, lengthenArray, spliceArray) {

    assertExtendTracesArgs(gd, update, indices, maxPoints);

    var updateProps = getExtendProperties(gd, update, indices, maxPoints),
        remainder = [],
        undoUpdate = {},
        undoPoints = {};
    var target, prop, maxp;

    for(var i = 0; i < updateProps.length; i++) {

        /*
         * prop is the object returned by Lib.nestedProperties
         */
        prop = updateProps[i].prop;
        maxp = updateProps[i].maxp;

        target = lengthenArray(updateProps[i].target, updateProps[i].insert);

        /*
         * If maxp is set within post-extension trace.length, splice to maxp length.
         * Otherwise skip function call as splice op will have no effect anyway.
         */
        if(maxp >= 0 && maxp < target.length) remainder = spliceArray(target, maxp);

        /*
         * to reverse this operation we need the size of the original trace as the reverse
         * operation will need to window out any lengthening operation performed in this pass.
         */
        maxp = updateProps[i].target.length;

        /*
         * Magic happens here! update gd.data.trace[key] with new array data.
         */
        prop.set(target);

        if(!Array.isArray(undoUpdate[prop.astr])) undoUpdate[prop.astr] = [];
        if(!Array.isArray(undoPoints[prop.astr])) undoPoints[prop.astr] = [];

        /*
         * build the inverse update object for the undo operation
         */
        undoUpdate[prop.astr].push(remainder);

        /*
         * build the matching maxPoints undo object containing original trace lengths.
         */
        undoPoints[prop.astr].push(maxp);
    }

    return {update: undoUpdate, maxPoints: undoPoints};
}

/**
 * extend && prepend traces at indices with update arrays, window trace lengths to maxPoints
 *
 * Extend and Prepend have identical APIs. Prepend inserts an array at the head while Extend
 * inserts an array off the tail. Prepend truncates the tail of the array - counting maxPoints
 * from the head, whereas Extend truncates the head of the array, counting backward maxPoints
 * from the tail.
 *
 * If maxPoints is undefined, nonNumeric, negative or greater than extended trace length no
 * truncation / windowing will be performed. If its zero, well the whole trace is truncated.
 *
 * @param {Object|HTMLDivElement} gd The graph div
 * @param {Object} update The key:array map of target attributes to extend
 * @param {Number|Number[]} indices The locations of traces to be extended
 * @param {Number|Object} [maxPoints] Number of points for trace window after lengthening.
 *
 */
Plotly.extendTraces = function extendTraces(gd, update, indices, maxPoints) {
    gd = getGraphDiv(gd);

    var undo = spliceTraces(gd, update, indices, maxPoints,

                           /*
                            * The Lengthen operation extends trace from end with insert
                            */
                            function(target, insert) {
                                return target.concat(insert);
                            },

                            /*
                             * Window the trace keeping maxPoints, counting back from the end
                             */
                            function(target, maxPoints) {
                                return target.splice(0, target.length - maxPoints);
                            });

    var promise = Plotly.redraw(gd);

    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    if(Queue) {
        Queue.add(gd, Plotly.prependTraces, undoArgs, extendTraces, arguments);
    }

    return promise;
};

Plotly.prependTraces = function prependTraces(gd, update, indices, maxPoints) {
    gd = getGraphDiv(gd);

    var undo = spliceTraces(gd, update, indices, maxPoints,

                           /*
                            * The Lengthen operation extends trace by appending insert to start
                            */
                            function(target, insert) {
                                return insert.concat(target);
                            },

                            /*
                             * Window the trace keeping maxPoints, counting forward from the start
                             */
                            function(target, maxPoints) {
                                return target.splice(maxPoints, target.length);
                            });

    var promise = Plotly.redraw(gd);

    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    if(Queue) {
        Queue.add(gd, Plotly.extendTraces, undoArgs, prependTraces, arguments);
    }

    return promise;
};

/**
 * Add data traces to an existing graph div.
 *
 * @param {Object|HTMLDivElement} gd The graph div
 * @param {Object[]} gd.data The array of traces we're adding to
 * @param {Object[]|Object} traces The object or array of objects to add
 * @param {Number[]|Number} [newIndices=[gd.data.length]] Locations to add traces
 *
 */
Plotly.addTraces = function addTraces(gd, traces, newIndices) {
    gd = getGraphDiv(gd);

    var currentIndices = [],
        undoFunc = Plotly.deleteTraces,
        redoFunc = addTraces,
        undoArgs = [gd, currentIndices],
        redoArgs = [gd, traces],  // no newIndices here
        i,
        promise;

    // all validation is done elsewhere to remove clutter here
    checkAddTracesArgs(gd, traces, newIndices);

    // make sure traces is an array
    if(!Array.isArray(traces)) {
        traces = [traces];
    }
    cleanData(traces, gd.data);

    // add the traces to gd.data (no redrawing yet!)
    for(i = 0; i < traces.length; i += 1) {
        gd.data.push(traces[i]);
    }

    // to continue, we need to call moveTraces which requires currentIndices
    for(i = 0; i < traces.length; i++) {
        currentIndices.push(-traces.length + i);
    }

    // if the user didn't define newIndices, they just want the traces appended
    // i.e., we can simply redraw and be done
    if(typeof newIndices === 'undefined') {
        promise = Plotly.redraw(gd);
        if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);
        return promise;
    }

    // make sure indices is property defined
    if(!Array.isArray(newIndices)) {
        newIndices = [newIndices];
    }

    try {

        // this is redundant, but necessary to not catch later possible errors!
        checkMoveTracesArgs(gd, currentIndices, newIndices);
    }
    catch(error) {

        // something went wrong, reset gd to be safe and rethrow error
        gd.data.splice(gd.data.length - traces.length, traces.length);
        throw error;
    }

    // if we're here, the user has defined specific places to place the new traces
    // this requires some extra work that moveTraces will do
    if(Queue) Queue.startSequence(gd);
    if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);
    promise = Plotly.moveTraces(gd, currentIndices, newIndices);
    if(Queue) Queue.stopSequence(gd);
    return promise;
};

/**
 * Delete traces at `indices` from gd.data array.
 *
 * @param {Object|HTMLDivElement} gd The graph div
 * @param {Object[]} gd.data The array of traces we're removing from
 * @param {Number|Number[]} indices The indices
 */
Plotly.deleteTraces = function deleteTraces(gd, indices) {
    gd = getGraphDiv(gd);

    var traces = [],
        undoFunc = Plotly.addTraces,
        redoFunc = deleteTraces,
        undoArgs = [gd, traces, indices],
        redoArgs = [gd, indices],
        i,
        deletedTrace;

    // make sure indices are defined
    if(typeof indices === 'undefined') {
        throw new Error('indices must be an integer or array of integers.');
    } else if(!Array.isArray(indices)) {
        indices = [indices];
    }
    assertIndexArray(gd, indices, 'indices');

    // convert negative indices to positive indices
    indices = positivifyIndices(indices, gd.data.length - 1);

    // we want descending here so that splicing later doesn't affect indexing
    indices.sort(Lib.sorterDes);
    for(i = 0; i < indices.length; i += 1) {
        deletedTrace = gd.data.splice(indices[i], 1)[0];
        traces.push(deletedTrace);
    }

    var promise = Plotly.redraw(gd);

    if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

    return promise;
};

/**
 * Move traces at currentIndices array to locations in newIndices array.
 *
 * If newIndices is omitted, currentIndices will be moved to the end. E.g.,
 * these are equivalent:
 *
 * Plotly.moveTraces(gd, [1, 2, 3], [-3, -2, -1])
 * Plotly.moveTraces(gd, [1, 2, 3])
 *
 * @param {Object|HTMLDivElement} gd The graph div
 * @param {Object[]} gd.data The array of traces we're removing from
 * @param {Number|Number[]} currentIndices The locations of traces to be moved
 * @param {Number|Number[]} [newIndices] The locations to move traces to
 *
 * Example calls:
 *
 *      // move trace i to location x
 *      Plotly.moveTraces(gd, i, x)
 *
 *      // move trace i to end of array
 *      Plotly.moveTraces(gd, i)
 *
 *      // move traces i, j, k to end of array (i != j != k)
 *      Plotly.moveTraces(gd, [i, j, k])
 *
 *      // move traces [i, j, k] to [x, y, z] (i != j != k) (x != y != z)
 *      Plotly.moveTraces(gd, [i, j, k], [x, y, z])
 *
 *      // reorder all traces (assume there are 5--a, b, c, d, e)
 *      Plotly.moveTraces(gd, [b, d, e, a, c])  // same as 'move to end'
 */
Plotly.moveTraces = function moveTraces(gd, currentIndices, newIndices) {
    gd = getGraphDiv(gd);

    var newData = [],
        movingTraceMap = [],
        undoFunc = moveTraces,
        redoFunc = moveTraces,
        undoArgs = [gd, newIndices, currentIndices],
        redoArgs = [gd, currentIndices, newIndices],
        i;

    // to reduce complexity here, check args elsewhere
    // this throws errors where appropriate
    checkMoveTracesArgs(gd, currentIndices, newIndices);

    // make sure currentIndices is an array
    currentIndices = Array.isArray(currentIndices) ? currentIndices : [currentIndices];

    // if undefined, define newIndices to point to the end of gd.data array
    if(typeof newIndices === 'undefined') {
        newIndices = [];
        for(i = 0; i < currentIndices.length; i++) {
            newIndices.push(-currentIndices.length + i);
        }
    }

    // make sure newIndices is an array if it's user-defined
    newIndices = Array.isArray(newIndices) ? newIndices : [newIndices];

    // convert negative indices to positive indices (they're the same length)
    currentIndices = positivifyIndices(currentIndices, gd.data.length - 1);
    newIndices = positivifyIndices(newIndices, gd.data.length - 1);

    // at this point, we've coerced the index arrays into predictable forms

    // get the traces that aren't being moved around
    for(i = 0; i < gd.data.length; i++) {

        // if index isn't in currentIndices, include it in ignored!
        if(currentIndices.indexOf(i) === -1) {
            newData.push(gd.data[i]);
        }
    }

    // get a mapping of indices to moving traces
    for(i = 0; i < currentIndices.length; i++) {
        movingTraceMap.push({newIndex: newIndices[i], trace: gd.data[currentIndices[i]]});
    }

    // reorder this mapping by newIndex, ascending
    movingTraceMap.sort(function(a, b) {
        return a.newIndex - b.newIndex;
    });

    // now, add the moving traces back in, in order!
    for(i = 0; i < movingTraceMap.length; i += 1) {
        newData.splice(movingTraceMap[i].newIndex, 0, movingTraceMap[i].trace);
    }

    gd.data = newData;

    var promise = Plotly.redraw(gd);

    if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

    return promise;
};

// -----------------------------------------------------
// restyle and relayout: these two control all redrawing
// for data (restyle) and everything else (relayout)
// -----------------------------------------------------

// restyle: change styling of an existing plot
// can be called two ways:
//
// restyle(gd, astr, val [,traces])
//      gd - graph div (string id or dom element)
//      astr - attribute string (like 'marker.symbol')
//      val - value to give this attribute
//      traces - integer or array of integers for the traces
//          to alter (all if omitted)
//
// restyle(gd, aobj [,traces])
//      aobj - {astr1:val1, astr2:val2...} allows setting
//          multiple attributes simultaneously
//
// val (or val1, val2... in the object form) can be an array,
// to apply different values to each trace.
// If the array is too short, it will wrap around (useful for
// style files that want to specify cyclical default values).
Plotly.restyle = function restyle(gd, astr, val, traces) {
    gd = getGraphDiv(gd);

    var i, fullLayout = gd._fullLayout,
        aobj = {};

    if(typeof astr === 'string') aobj[astr] = val;
    else if(Lib.isPlainObject(astr)) {
        aobj = astr;
        if(traces === undefined) traces = val; // the 3-arg form
    }
    else {
        console.log('restyle fail', astr, val, traces);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    if(isNumeric(traces)) traces = [traces];
    else if(!Array.isArray(traces) || !traces.length) {
        traces = gd._fullData.map(function(v, i) { return i; });
    }

    // recalcAttrs attributes need a full regeneration of calcdata
    // as well as a replot, because the right objects may not exist,
    // or autorange may need recalculating
    // in principle we generally shouldn't need to redo ALL traces... that's
    // harder though.
    var recalcAttrs = [
        'mode', 'visible', 'type', 'orientation', 'fill',
        'histfunc', 'histnorm', 'text',
        'x', 'y', 'z',
        'a', 'b', 'c',
        'xtype', 'x0', 'dx', 'ytype', 'y0', 'dy', 'xaxis', 'yaxis',
        'line.width',
        'connectgaps', 'transpose', 'zsmooth',
        'showscale', 'marker.showscale',
        'zauto', 'marker.cauto',
        'autocolorscale', 'marker.autocolorscale',
        'colorscale', 'marker.colorscale',
        'reversescale', 'marker.reversescale',
        'autobinx', 'nbinsx', 'xbins', 'xbins.start', 'xbins.end', 'xbins.size',
        'autobiny', 'nbinsy', 'ybins', 'ybins.start', 'ybins.end', 'ybins.size',
        'autocontour', 'ncontours', 'contours', 'contours.coloring',
        'error_y', 'error_y.visible', 'error_y.value', 'error_y.type',
        'error_y.traceref', 'error_y.array', 'error_y.symmetric',
        'error_y.arrayminus', 'error_y.valueminus', 'error_y.tracerefminus',
        'error_x', 'error_x.visible', 'error_x.value', 'error_x.type',
        'error_x.traceref', 'error_x.array', 'error_x.symmetric',
        'error_x.arrayminus', 'error_x.valueminus', 'error_x.tracerefminus',
        'swapxy', 'swapxyaxes', 'orientationaxes',
        'marker.colors', 'values', 'labels', 'label0', 'dlabel', 'sort',
        'textinfo', 'textposition', 'textfont.size', 'textfont.family', 'textfont.color',
        'insidetextfont.size', 'insidetextfont.family', 'insidetextfont.color',
        'outsidetextfont.size', 'outsidetextfont.family', 'outsidetextfont.color',
        'hole', 'scalegroup', 'domain', 'domain.x', 'domain.y',
        'domain.x[0]', 'domain.x[1]', 'domain.y[0]', 'domain.y[1]',
        'tilt', 'tiltaxis', 'depth', 'direction', 'rotation', 'pull'
    ];
    for(i = 0; i < traces.length; i++) {
        if(Plots.traceIs(gd._fullData[traces[i]], 'box')) {
            recalcAttrs.push('name');
            break;
        }
    }

    // autorangeAttrs attributes need a full redo of calcdata
    // only if an axis is autoranged,
    // because .calc() is where the autorange gets determined
    // TODO: could we break this out as well?
    var autorangeAttrs = [
        'marker', 'marker.size', 'textfont',
        'boxpoints', 'jitter', 'pointpos', 'whiskerwidth', 'boxmean'
    ];
    // replotAttrs attributes need a replot (because different
    // objects need to be made) but not a recalc
    var replotAttrs = [
        'zmin', 'zmax', 'zauto',
        'marker.cmin', 'marker.cmax', 'marker.cauto',
        'contours.start', 'contours.end', 'contours.size',
        'contours.showlines',
        'line', 'line.smoothing', 'line.shape',
        'error_y.width', 'error_x.width', 'error_x.copy_ystyle',
        'marker.maxdisplayed'
    ];
    // these ones show up in restyle because they make more sense
    // in the style box, but they're graph-wide attributes, so set
    // in gd.layout also axis scales and range show up here because
    // we may need to undo them. These all trigger a recalc
    // var layoutAttrs = [
    //     'barmode', 'barnorm','bargap', 'bargroupgap',
    //     'boxmode', 'boxgap', 'boxgroupgap',
    //     '?axis.autorange', '?axis.range', '?axis.rangemode'
    // ];

    // these ones may alter the axis type
    // (at least if the first trace is involved)
    var axtypeAttrs = [
        'type', 'x', 'y', 'x0', 'y0', 'orientation', 'xaxis', 'yaxis'
    ];

    // flags for which kind of update we need to do
    var docalc = false,
        docalcAutorange = false,
        doplot = false,
        dolayout = false,
        dostyle = false,
        docolorbars = false;
    // copies of the change (and previous values of anything affected)
    // for the undo / redo queue
    var redoit = {},
        undoit = {},
        axlist,
        flagAxForDelete = {};

    // At the moment, only cartesian, pie and ternary plot types can afford
    // to not go through a full replot
    var doPlotWhiteList = ['cartesian', 'pie', 'ternary'];
    fullLayout._basePlotModules.forEach(function(_module) {
        if(doPlotWhiteList.indexOf(_module.name) === -1) doplot = true;
    });

    // make a new empty vals array for undoit
    function a0() { return traces.map(function() { return undefined; }); }

    // for autoranging multiple axes
    function addToAxlist(axid) {
        var axName = Plotly.Axes.id2name(axid);
        if(axlist.indexOf(axName) === -1) { axlist.push(axName); }
    }
    function autorangeAttr(axName) { return 'LAYOUT' + axName + '.autorange'; }
    function rangeAttr(axName) { return 'LAYOUT' + axName + '.range'; }

    // for attrs that interact (like scales & autoscales), save the
    // old vals before making the change
    // val=undefined will not set a value, just record what the value was.
    // val=null will delete the attribute
    // attr can be an array to set several at once (all to the same val)
    function doextra(attr, val, i) {
        if(Array.isArray(attr)) {
            attr.forEach(function(a) { doextra(a, val, i); });
            return;
        }
        // quit if explicitly setting this elsewhere
        if(attr in aobj) return;

        var extraparam;
        if(attr.substr(0, 6) === 'LAYOUT') {
            extraparam = Lib.nestedProperty(gd.layout, attr.replace('LAYOUT', ''));
        } else {
            extraparam = Lib.nestedProperty(gd.data[traces[i]], attr);
        }

        if(!(attr in undoit)) {
            undoit[attr] = a0();
        }
        if(undoit[attr][i] === undefined) {
            undoit[attr][i] = extraparam.get();
        }
        if(val !== undefined) {
            extraparam.set(val);
        }
    }
    var zscl = ['zmin', 'zmax'],
        xbins = ['xbins.start', 'xbins.end', 'xbins.size'],
        ybins = ['ybins.start', 'ybins.end', 'ybins.size'],
        contourAttrs = ['contours.start', 'contours.end', 'contours.size'];

    // now make the changes to gd.data (and occasionally gd.layout)
    // and figure out what kind of graphics update we need to do
    for(var ai in aobj) {
        var vi = aobj[ai],
            cont,
            contFull,
            param,
            oldVal,
            newVal;
        redoit[ai] = vi;

        if(ai.substr(0, 6) === 'LAYOUT') {
            param = Lib.nestedProperty(gd.layout, ai.replace('LAYOUT', ''));
            undoit[ai] = [param.get()];
            // since we're allowing val to be an array, allow it here too,
            // even though that's meaningless
            param.set(Array.isArray(vi) ? vi[0] : vi);
            // ironically, the layout attrs in restyle only require replot,
            // not relayout
            docalc = true;
            continue;
        }

        // set attribute in gd.data
        undoit[ai] = a0();
        for(i = 0; i < traces.length; i++) {
            cont = gd.data[traces[i]];
            contFull = gd._fullData[traces[i]];
            param = Lib.nestedProperty(cont, ai);
            oldVal = param.get();
            newVal = Array.isArray(vi) ? vi[i % vi.length] : vi;

            // setting bin or z settings should turn off auto
            // and setting auto should save bin or z settings
            if(zscl.indexOf(ai) !== -1) {
                doextra('zauto', false, i);
            }
            else if(ai === 'colorscale') {
                doextra('autocolorscale', false, i);
            }
            else if(ai === 'autocolorscale') {
                doextra('colorscale', undefined, i);
            }
            else if(ai === 'marker.colorscale') {
                doextra('marker.autocolorscale', false, i);
            }
            else if(ai === 'marker.autocolorscale') {
                doextra('marker.colorscale', undefined, i);
            }
            else if(ai === 'zauto') {
                doextra(zscl, undefined, i);
            }
            else if(xbins.indexOf(ai) !== -1) {
                doextra('autobinx', false, i);
            }
            else if(ai === 'autobinx') {
                doextra(xbins, undefined, i);
            }
            else if(ybins.indexOf(ai) !== -1) {
                doextra('autobiny', false, i);
            }
            else if(ai === 'autobiny') {
                doextra(ybins, undefined, i);
            }
            else if(contourAttrs.indexOf(ai) !== -1) {
                doextra('autocontour', false, i);
            }
            else if(ai === 'autocontour') {
                doextra(contourAttrs, undefined, i);
            }
            // heatmaps: setting x0 or dx, y0 or dy,
            // should turn xtype/ytype to 'scaled' if 'array'
            else if(['x0', 'dx'].indexOf(ai) !== -1 &&
                    contFull.x && contFull.xtype !== 'scaled') {
                doextra('xtype', 'scaled', i);
            }
            else if(['y0', 'dy'].indexOf(ai) !== -1 &&
                    contFull.y && contFull.ytype !== 'scaled') {
                doextra('ytype', 'scaled', i);
            }
            // changing colorbar size modes,
            // make the resulting size not change
            // note that colorbar fractional sizing is based on the
            // original plot size, before anything (like a colorbar)
            // increases the margins
            else if(ai === 'colorbar.thicknessmode' && param.get() !== newVal &&
                        ['fraction', 'pixels'].indexOf(newVal) !== -1 &&
                        contFull.colorbar) {
                var thicknorm =
                    ['top', 'bottom'].indexOf(contFull.colorbar.orient) !== -1 ?
                        (fullLayout.height - fullLayout.margin.t - fullLayout.margin.b) :
                        (fullLayout.width - fullLayout.margin.l - fullLayout.margin.r);
                doextra('colorbar.thickness', contFull.colorbar.thickness *
                    (newVal === 'fraction' ? 1 / thicknorm : thicknorm), i);
            }
            else if(ai === 'colorbar.lenmode' && param.get() !== newVal &&
                        ['fraction', 'pixels'].indexOf(newVal) !== -1 &&
                        contFull.colorbar) {
                var lennorm =
                    ['top', 'bottom'].indexOf(contFull.colorbar.orient) !== -1 ?
                        (fullLayout.width - fullLayout.margin.l - fullLayout.margin.r) :
                        (fullLayout.height - fullLayout.margin.t - fullLayout.margin.b);
                doextra('colorbar.len', contFull.colorbar.len *
                    (newVal === 'fraction' ? 1 / lennorm : lennorm), i);
            }
            else if(ai === 'colorbar.tick0' || ai === 'colorbar.dtick') {
                doextra('colorbar.tickmode', 'linear', i);
            }
            else if(ai === 'colorbar.tickmode') {
                doextra(['colorbar.tick0', 'colorbar.dtick'], undefined, i);
            }


            if(ai === 'type' && (newVal === 'pie') !== (oldVal === 'pie')) {
                var labelsTo = 'x',
                    valuesTo = 'y';
                if((newVal === 'bar' || oldVal === 'bar') && cont.orientation === 'h') {
                    labelsTo = 'y';
                    valuesTo = 'x';
                }
                Lib.swapAttrs(cont, ['?', '?src'], 'labels', labelsTo);
                Lib.swapAttrs(cont, ['d?', '?0'], 'label', labelsTo);
                Lib.swapAttrs(cont, ['?', '?src'], 'values', valuesTo);

                if(oldVal === 'pie') {
                    Lib.nestedProperty(cont, 'marker.color')
                        .set(Lib.nestedProperty(cont, 'marker.colors').get());

                    // super kludgy - but if all pies are gone we won't remove them otherwise
                    fullLayout._pielayer.selectAll('g.trace').remove();
                } else if(Plots.traceIs(cont, 'cartesian')) {
                    Lib.nestedProperty(cont, 'marker.colors')
                        .set(Lib.nestedProperty(cont, 'marker.color').get());
                    //look for axes that are no longer in use and delete them
                    flagAxForDelete[cont.xaxis || 'x'] = true;
                    flagAxForDelete[cont.yaxis || 'y'] = true;
                }
            }

            undoit[ai][i] = oldVal;
            // set the new value - if val is an array, it's one el per trace
            // first check for attributes that get more complex alterations
            var swapAttrs = [
                'swapxy', 'swapxyaxes', 'orientation', 'orientationaxes'
            ];
            if(swapAttrs.indexOf(ai) !== -1) {
                // setting an orientation: make sure it's changing
                // before we swap everything else
                if(ai === 'orientation') {
                    param.set(newVal);
                    if(param.get() === undoit[ai][i]) continue;
                }
                // orientationaxes has no value,
                // it flips everything and the axes
                else if(ai === 'orientationaxes') {
                    cont.orientation =
                        {v: 'h', h: 'v'}[contFull.orientation];
                }
                swapXYData(cont);
            }
            // all the other ones, just modify that one attribute
            else param.set(newVal);

        }

        // swap the data attributes of the relevant x and y axes?
        if(['swapxyaxes', 'orientationaxes'].indexOf(ai) !== -1) {
            Plotly.Axes.swap(gd, traces);
        }

        // swap hovermode if set to "compare x/y data"
        if(ai === 'orientationaxes') {
            var hovermode = Lib.nestedProperty(gd.layout, 'hovermode');
            if(hovermode.get() === 'x') {
                hovermode.set('y');
            } else if(hovermode.get() === 'y') {
                hovermode.set('x');
            }
        }

        // check if we need to call axis type
        if((traces.indexOf(0) !== -1) && (axtypeAttrs.indexOf(ai) !== -1)) {
            Plotly.Axes.clearTypes(gd, traces);
            docalc = true;
        }

        // switching from auto to manual binning or z scaling doesn't
        // actually do anything but change what you see in the styling
        // box. everything else at least needs to apply styles
        if((['autobinx', 'autobiny', 'zauto'].indexOf(ai) === -1) ||
                newVal !== false) {
            dostyle = true;
        }
        if(['colorbar', 'line'].indexOf(param.parts[0]) !== -1 ||
            param.parts[0] === 'marker' && param.parts[1] === 'colorbar') {
            docolorbars = true;
        }

        if(recalcAttrs.indexOf(ai) !== -1) {
            // major enough changes deserve autoscale, autobin, and
            // non-reversed axes so people don't get confused
            if(['orientation', 'type'].indexOf(ai) !== -1) {
                axlist = [];
                for(i = 0; i < traces.length; i++) {
                    var trace = gd.data[traces[i]];

                    if(Plots.traceIs(trace, 'cartesian')) {
                        addToAxlist(trace.xaxis || 'x');
                        addToAxlist(trace.yaxis || 'y');

                        if(astr === 'type') {
                            doextra(['autobinx', 'autobiny'], true, i);
                        }
                    }
                }

                doextra(axlist.map(autorangeAttr), true, 0);
                doextra(axlist.map(rangeAttr), [0, 1], 0);
            }
            docalc = true;
        }
        else if(replotAttrs.indexOf(ai) !== -1) doplot = true;
        else if(autorangeAttrs.indexOf(ai) !== -1) docalcAutorange = true;
    }

    // check axes we've flagged for possible deletion
    // flagAxForDelete is a hash so we can make sure we only get each axis once
    var axListForDelete = Object.keys(flagAxForDelete);
    axisLoop:
    for(i = 0; i < axListForDelete.length; i++) {
        var axId = axListForDelete[i],
            axLetter = axId.charAt(0),
            axAttr = axLetter + 'axis';
        for(var j = 0; j < gd.data.length; j++) {
            if(Plots.traceIs(gd.data[j], 'cartesian') &&
                    (gd.data[j][axAttr] || axLetter) === axId) {
                continue axisLoop;
            }
        }

        // no data on this axis - delete it.
        doextra('LAYOUT' + Plotly.Axes.id2name(axId), null, 0);
    }

    // now all attribute mods are done, as are redo and undo
    // so we can save them
    if(Queue) {
        Queue.add(gd, restyle, [gd, undoit, traces], restyle, [gd, redoit, traces]);
    }

    // do we need to force a recalc?
    var autorangeOn = false;
    Plotly.Axes.list(gd).forEach(function(ax) {
        if(ax.autorange) autorangeOn = true;
    });
    if(docalc || dolayout || (docalcAutorange && autorangeOn)) {
        gd.calcdata = undefined;
    }

    // now update the graphics
    // a complete layout redraw takes care of plot and
    var seq;
    if(dolayout) {
        seq = [function changeLayout() {
            var copyLayout = gd.layout;
            gd.layout = undefined;
            return Plotly.plot(gd, '', copyLayout);
        }];
    }
    else if(docalc || doplot || docalcAutorange) {
        seq = [Plotly.plot];
    }
    else {
        Plots.supplyDefaults(gd);
        seq = [Plots.previousPromises];
        if(dostyle) {
            seq.push(function doStyle() {
                // first see if we need to do arraysToCalcdata
                // call it regardless of what change we made, in case
                // supplyDefaults brought in an array that was already
                // in gd.data but not in gd._fullData previously
                var i, cdi, arraysToCalcdata;
                for(i = 0; i < gd.calcdata.length; i++) {
                    cdi = gd.calcdata[i];
                    arraysToCalcdata = (((cdi[0] || {}).trace || {})._module || {}).arraysToCalcdata;
                    if(arraysToCalcdata) arraysToCalcdata(cdi);
                }
                Plots.style(gd);
                Legend.draw(gd);
                return Plots.previousPromises(gd);
            });
        }
        if(docolorbars) {
            seq.push(function doColorBars() {
                gd.calcdata.forEach(function(cd) {
                    if((cd[0].t || {}).cb) {
                        var trace = cd[0].trace,
                            cb = cd[0].t.cb;

                        if(Plots.traceIs(trace, 'contour')) {
                            cb.line({
                                width: trace.contours.showlines !== false ?
                                    trace.line.width : 0,
                                dash: trace.line.dash,
                                color: trace.contours.coloring === 'line' ?
                                    cb._opts.line.color : trace.line.color
                            });
                        }
                        if(Plots.traceIs(trace, 'markerColorscale')) {
                            cb.options(trace.marker.colorbar)();
                        }
                        else cb.options(trace.colorbar)();
                    }
                });
                return Plots.previousPromises(gd);
            });
        }
    }

    var plotDone = Lib.syncOrAsync(seq, gd);

    if(!plotDone || !plotDone.then) plotDone = Promise.resolve();

    return plotDone.then(function() {
        gd.emit('plotly_restyle', Lib.extendDeep([], [redoit, traces]));
        return gd;
    });
};

// swap all the data and data attributes associated with x and y
function swapXYData(trace) {
    var i;
    Lib.swapAttrs(trace, ['?', '?0', 'd?', '?bins', 'nbins?', 'autobin?', '?src', 'error_?']);
    if(Array.isArray(trace.z) && Array.isArray(trace.z[0])) {
        if(trace.transpose) delete trace.transpose;
        else trace.transpose = true;
    }
    if(trace.error_x && trace.error_y) {
        var errorY = trace.error_y,
            copyYstyle = ('copy_ystyle' in errorY) ? errorY.copy_ystyle :
                !(errorY.color || errorY.thickness || errorY.width);
        Lib.swapAttrs(trace, ['error_?.copy_ystyle']);
        if(copyYstyle) {
            Lib.swapAttrs(trace, ['error_?.color', 'error_?.thickness', 'error_?.width']);
        }
    }
    if(trace.hoverinfo) {
        var hoverInfoParts = trace.hoverinfo.split('+');
        for(i = 0; i < hoverInfoParts.length; i++) {
            if(hoverInfoParts[i] === 'x') hoverInfoParts[i] = 'y';
            else if(hoverInfoParts[i] === 'y') hoverInfoParts[i] = 'x';
        }
        trace.hoverinfo = hoverInfoParts.join('+');
    }
}

// relayout: change layout in an existing plot
// can be called two ways:
//
// relayout(gd, astr, val)
//      gd - graph div (string id or dom element)
//      astr - attribute string (like 'xaxis.range[0]')
//      val - value to give this attribute
//
// relayout(gd,aobj)
//      aobj - {astr1:val1, astr2:val2...}
//          allows setting multiple attributes simultaneously
Plotly.relayout = function relayout(gd, astr, val) {
    gd = getGraphDiv(gd);

    if(gd.framework && gd.framework.isPolar) {
        return Promise.resolve(gd);
    }

    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        aobj = {},
        dolegend = false,
        doticks = false,
        dolayoutstyle = false,
        doplot = false,
        docalc = false,
        domodebar = false,
        newkey, axes, keys, xyref, scene, axisAttr, i;

    if(typeof astr === 'string') aobj[astr] = val;
    else if(Lib.isPlainObject(astr)) aobj = astr;
    else {
        console.log('relayout fail', astr, val);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    keys = Object.keys(aobj);
    axes = Plotly.Axes.list(gd);

    for(i = 0; i < keys.length; i++) {
        // look for 'allaxes', split out into all axes
        if(keys[i].indexOf('allaxes') === 0) {
            for(var j = 0; j < axes.length; j++) {
                // in case of 3D the axis are nested within a scene which is held in _id
                scene = axes[j]._id.substr(1);
                axisAttr = (scene.indexOf('scene') !== -1) ? (scene + '.') : '';
                newkey = keys[i].replace('allaxes', axisAttr + axes[j]._name);
                if(!aobj[newkey]) { aobj[newkey] = aobj[keys[i]]; }
            }
            delete aobj[keys[i]];
        }
        // split annotation.ref into xref and yref
        if(keys[i].match(/^annotations\[[0-9-]+\].ref$/)) {
            xyref = aobj[keys[i]].split('y');
            aobj[keys[i].replace('ref', 'xref')] = xyref[0];
            aobj[keys[i].replace('ref', 'yref')] = xyref.length === 2 ?
                ('y' + xyref[1]) : 'paper';
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
    function doextra(attr, val) {
        if(Array.isArray(attr)) {
            attr.forEach(function(a) { doextra(a, val); });
            return;
        }
        // quit if explicitly setting this elsewhere
        if(attr in aobj) return;

        var p = Lib.nestedProperty(layout, attr);
        if(!(attr in undoit)) undoit[attr] = p.get();
        if(val !== undefined) p.set(val);
    }

    // for editing annotations or shapes - is it on autoscaled axes?
    function refAutorange(obj, axletter) {
        var axName = Plotly.Axes.id2name(obj[axletter + 'ref'] || axletter);
        return (fullLayout[axName] || {}).autorange;
    }

    var hw = ['height', 'width'];

    // alter gd.layout
    for(var ai in aobj) {
        var p = Lib.nestedProperty(layout, ai),
            vi = aobj[ai],
            plen = p.parts.length,
            // p.parts may end with an index integer if the property is an array
            pend = typeof p.parts[plen - 1] === 'string' ? (plen - 1) : (plen - 2),
            // last property in chain (leaf node)
            pleaf = p.parts[pend],
            // leaf plus immediate parent
            pleafPlus = p.parts[pend - 1] + '.' + pleaf,
            // trunk nodes (everything except the leaf)
            ptrunk = p.parts.slice(0, pend).join('.'),
            parentIn = Lib.nestedProperty(gd.layout, ptrunk).get(),
            parentFull = Lib.nestedProperty(fullLayout, ptrunk).get();

        redoit[ai] = vi;

        // axis reverse is special - it is its own inverse
        // op and has no flag.
        undoit[ai] = (pleaf === 'reverse') ? vi : p.get();

        // check autosize or autorange vs size and range
        if(hw.indexOf(ai) !== -1) {
            doextra('autosize', false);
        }
        else if(ai === 'autosize') {
            doextra(hw, undefined);
        }
        else if(pleafPlus.match(/^[xyz]axis[0-9]*\.range(\[[0|1]\])?$/)) {
            doextra(ptrunk + '.autorange', false);
        }
        else if(pleafPlus.match(/^[xyz]axis[0-9]*\.autorange$/)) {
            doextra([ptrunk + '.range[0]', ptrunk + '.range[1]'],
                undefined);
        }
        else if(pleafPlus.match(/^aspectratio\.[xyz]$/)) {
            doextra(p.parts[0] + '.aspectmode', 'manual');
        }
        else if(pleafPlus.match(/^aspectmode$/)) {
            doextra([ptrunk + '.x', ptrunk + '.y', ptrunk + '.z'], undefined);
        }
        else if(pleaf === 'tick0' || pleaf === 'dtick') {
            doextra(ptrunk + '.tickmode', 'linear');
        }
        else if(pleaf === 'tickmode') {
            doextra([ptrunk + '.tick0', ptrunk + '.dtick'], undefined);
        }
        else if(/[xy]axis[0-9]*?$/.test(pleaf) && !Object.keys(vi || {}).length) {
            docalc = true;
        }
        else if(/[xy]axis[0-9]*\.categoryorder$/.test(pleafPlus)) {
            docalc = true;
        }
        else if(/[xy]axis[0-9]*\.categoryarray/.test(pleafPlus)) {
            docalc = true;
        }

        if(pleafPlus.indexOf('rangeslider') !== -1) {
            docalc = true;
        }

        // toggling log without autorange: need to also recalculate ranges
        // logical XOR (ie are we toggling log)
        if(pleaf === 'type' && ((parentFull.type === 'log') !== (vi === 'log'))) {
            var ax = parentIn;
            if(!ax || !ax.range) {
                doextra(ptrunk + '.autorange', true);
            }
            else if(!parentFull.autorange) {
                var r0 = ax.range[0],
                    r1 = ax.range[1];
                if(vi === 'log') {
                    // if both limits are negative, autorange
                    if(r0 <= 0 && r1 <= 0) {
                        doextra(ptrunk + '.autorange', true);
                    }
                    // if one is negative, set it 6 orders below the other.
                    if(r0 <= 0) r0 = r1 / 1e6;
                    else if(r1 <= 0) r1 = r0 / 1e6;
                    // now set the range values as appropriate
                    doextra(ptrunk + '.range[0]', Math.log(r0) / Math.LN10);
                    doextra(ptrunk + '.range[1]', Math.log(r1) / Math.LN10);
                }
                else {
                    doextra(ptrunk + '.range[0]', Math.pow(10, r0));
                    doextra(ptrunk + '.range[1]', Math.pow(10, r1));
                }
            }
            else if(vi === 'log') {
                // just make sure the range is positive and in the right
                // order, it'll get recalculated later
                ax.range = (ax.range[1] > ax.range[0]) ? [1, 2] : [2, 1];
            }
        }

        // handle axis reversal explicitly, as there's no 'reverse' flag
        if(pleaf === 'reverse') {
            if(parentIn.range) parentIn.range.reverse();
            else {
                doextra(ptrunk + '.autorange', true);
                parentIn.range = [1, 0];
            }

            if(parentFull.autorange) docalc = true;
            else doplot = true;
        }
        // send annotation and shape mods one-by-one through Annotations.draw(),
        // don't set via nestedProperty
        // that's because add and remove are special
        else if(p.parts[0] === 'annotations' || p.parts[0] === 'shapes') {
            var objNum = p.parts[1],
                objType = p.parts[0],
                objList = layout[objType] || [],
                objModule = Plotly[Lib.titleCase(objType)],
                obji = objList[objNum] || {};
            // if p.parts is just an annotation number, and val is either
            // 'add' or an entire annotation to add, the undo is 'remove'
            // if val is 'remove' then undo is the whole annotation object
            if(p.parts.length === 2) {
                if(aobj[ai] === 'add' || Lib.isPlainObject(aobj[ai])) {
                    undoit[ai] = 'remove';
                }
                else if(aobj[ai] === 'remove') {
                    if(objNum === -1) {
                        undoit[objType] = objList;
                        delete undoit[ai];
                    }
                    else undoit[ai] = obji;
                }
                else console.log('???', aobj);
            }
            if((refAutorange(obji, 'x') || refAutorange(obji, 'y')) &&
                    !Lib.containsAny(ai, ['color', 'opacity', 'align', 'dash'])) {
                docalc = true;
            }
            // TODO: combine all edits to a given annotation / shape into one call
            // as it is we get separate calls for x and y (or ax and ay) on move
            objModule.draw(gd, objNum, p.parts.slice(2).join('.'), aobj[ai]);
            delete aobj[ai];
        } else if(p.parts[0] === 'images') {
            var update = Lib.objectFromPath(astr, vi);
            Lib.extendDeepAll(gd.layout, update);

            Images.supplyLayoutDefaults(gd.layout, gd._fullLayout);
            Images.draw(gd);
        }
        // alter gd.layout
        else {
            // check whether we can short-circuit a full redraw
            // 3d or geo at this point just needs to redraw.
            if(p.parts[0].indexOf('scene') === 0) doplot = true;
            else if(p.parts[0].indexOf('geo') === 0) doplot = true;
            else if(p.parts[0].indexOf('ternary') === 0) doplot = true;
            else if(fullLayout._has('gl2d') &&
                (ai.indexOf('axis') !== -1 || p.parts[0] === 'plot_bgcolor')
            ) doplot = true;
            else if(ai === 'hiddenlabels') docalc = true;
            else if(p.parts[0].indexOf('legend') !== -1) dolegend = true;
            else if(ai.indexOf('title') !== -1) doticks = true;
            else if(p.parts[0].indexOf('bgcolor') !== -1) dolayoutstyle = true;
            else if(p.parts.length > 1 &&
                    Lib.containsAny(p.parts[1], ['tick', 'exponent', 'grid', 'zeroline'])) {
                doticks = true;
            }
            else if(ai.indexOf('.linewidth') !== -1 &&
                    ai.indexOf('axis') !== -1) {
                doticks = dolayoutstyle = true;
            }
            else if(p.parts.length > 1 && p.parts[1].indexOf('line') !== -1) {
                dolayoutstyle = true;
            }
            else if(p.parts.length > 1 && p.parts[1] === 'mirror') {
                doticks = dolayoutstyle = true;
            }
            else if(ai === 'margin.pad') {
                doticks = dolayoutstyle = true;
            }
            else if(p.parts[0] === 'margin' ||
                    p.parts[1] === 'autorange' ||
                    p.parts[1] === 'rangemode' ||
                    p.parts[1] === 'type' ||
                    p.parts[1] === 'domain' ||
                    ai.match(/^(bar|box|font)/)) {
                docalc = true;
            }
            /*
             * hovermode and dragmode don't need any redrawing, since they just
             * affect reaction to user input. everything else, assume full replot.
             * height, width, autosize get dealt with below. Except for the case of
             * of subplots - scenes - which require scene.updateFx to be called.
             */
            else if(['hovermode', 'dragmode'].indexOf(ai) !== -1) domodebar = true;
            else if(['hovermode', 'dragmode', 'height',
                    'width', 'autosize'].indexOf(ai) === -1) {
                doplot = true;
            }

            p.set(vi);
        }
    }
    // now all attribute mods are done, as are
    // redo and undo so we can save them
    if(Queue) {
        Queue.add(gd, relayout, [gd, undoit], relayout, [gd, redoit]);
    }

    // calculate autosizing - if size hasn't changed,
    // will remove h&w so we don't need to redraw
    if(aobj.autosize) aobj = plotAutoSize(gd, aobj);

    if(aobj.height || aobj.width || aobj.autosize) docalc = true;

    // redraw
    // first check if there's still anything to do
    var ak = Object.keys(aobj),
        seq = [Plots.previousPromises];

    if(doplot || docalc) {
        seq.push(function layoutReplot() {
            // force plot() to redo the layout
            gd.layout = undefined;

            // force it to redo calcdata?
            if(docalc) gd.calcdata = undefined;

            // replot with the modified layout
            return Plotly.plot(gd, '', layout);
        });
    }
    else if(ak.length) {
        // if we didn't need to redraw entirely, just do the needed parts
        Plots.supplyDefaults(gd);
        fullLayout = gd._fullLayout;

        if(dolegend) {
            seq.push(function doLegend() {
                Legend.draw(gd);
                return Plots.previousPromises(gd);
            });
        }

        if(dolayoutstyle) seq.push(layoutStyles);

        if(doticks) {
            seq.push(function() {
                Plotly.Axes.doTicks(gd, 'redraw');
                drawMainTitle(gd);
                return Plots.previousPromises(gd);
            });
        }

        // this is decoupled enough it doesn't need async regardless
        if(domodebar) {
            var subplotIds;
            manageModeBar(gd);

            subplotIds = Plots.getSubplotIds(fullLayout, 'gl3d');
            for(i = 0; i < subplotIds.length; i++) {
                scene = fullLayout[subplotIds[i]]._scene;
                scene.updateFx(fullLayout.dragmode, fullLayout.hovermode);
            }

            subplotIds = Plots.getSubplotIds(fullLayout, 'gl2d');
            for(i = 0; i < subplotIds.length; i++) {
                scene = fullLayout._plots[subplotIds[i]]._scene2d;
                scene.updateFx(fullLayout);
            }

            subplotIds = Plots.getSubplotIds(fullLayout, 'geo');
            for(i = 0; i < subplotIds.length; i++) {
                var geo = fullLayout[subplotIds[i]]._geo;
                geo.updateFx(fullLayout.hovermode);
            }
        }
    }

    function setRange(changes) {

        var newMin = changes['xaxis.range'] ? changes['xaxis.range'][0] : changes['xaxis.range[0]'],
            newMax = changes['xaxis.range'] ? changes['xaxis.range'][1] : changes['xaxis.range[1]'];

        var rangeSlider = fullLayout.xaxis && fullLayout.xaxis.rangeslider ?
            fullLayout.xaxis.rangeslider : {};

        if(rangeSlider.visible) {
            if(newMin || newMax) {
                fullLayout.xaxis.rangeslider.setRange(newMin, newMax);
            } else if(changes['xaxis.autorange']) {
                fullLayout.xaxis.rangeslider.setRange();
            }
        }
    }

    var plotDone = Lib.syncOrAsync(seq, gd);

    if(!plotDone || !plotDone.then) plotDone = Promise.resolve(gd);

    return plotDone.then(function() {
        var changes = Lib.extendDeep({}, redoit);

        setRange(changes);
        gd.emit('plotly_relayout', changes);

        return gd;
    });
};

/**
 * Purge a graph container div back to its initial pre-Plotly.plot state
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 */
Plotly.purge = function purge(gd) {
    gd = getGraphDiv(gd);

    var fullLayout = gd._fullLayout || {},
        fullData = gd._fullData || [];

    // remove gl contexts
    Plots.cleanPlot([], {}, fullData, fullLayout);

    // purge properties
    Plots.purge(gd);

    // purge event emitter methods
    Events.purge(gd);

    // remove plot container
    if(fullLayout._container) fullLayout._container.remove();

    delete gd._context;
    delete gd._replotPending;
    delete gd._mouseDownTime;
    delete gd._hmpixcount;
    delete gd._hmlumcount;

    return gd;
};

/**
 * Reduce all reserved margin objects to a single required margin reservation.
 *
 * @param {Object} margins
 * @returns {{left: number, right: number, bottom: number, top: number}}
 */
function calculateReservedMargins(margins) {
    var resultingMargin = {left: 0, right: 0, bottom: 0, top: 0},
        marginName;

    if(margins) {
        for(marginName in margins) {
            if(margins.hasOwnProperty(marginName)) {
                resultingMargin.left += margins[marginName].left || 0;
                resultingMargin.right += margins[marginName].right || 0;
                resultingMargin.bottom += margins[marginName].bottom || 0;
                resultingMargin.top += margins[marginName].top || 0;
            }
        }
    }
    return resultingMargin;
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
            factor = 1 - 2 * context.frameMargins;

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

// -------------------------------------------------------
// makePlotFramework: Create the plot container and axes
// -------------------------------------------------------
function makePlotFramework(gd) {
    var gd3 = d3.select(gd),
        fullLayout = gd._fullLayout;

    // Plot container
    fullLayout._container = gd3.selectAll('.plot-container').data([0]);
    fullLayout._container.enter().insert('div', ':first-child')
        .classed('plot-container', true)
        .classed('plotly', true);

    // Make the svg container
    fullLayout._paperdiv = fullLayout._container.selectAll('.svg-container').data([0]);
    fullLayout._paperdiv.enter().append('div')
        .classed('svg-container', true)
        .style('position', 'relative');

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
        .attr(xmlnsNamespaces.svgAttrs);

    fullLayout._defs = fullLayout._paper.append('defs')
        .attr('id', 'defs-' + fullLayout._uid);

    fullLayout._topdefs = fullLayout._toppaper.append('defs')
        .attr('id', 'topdefs-' + fullLayout._uid);

    fullLayout._draggers = fullLayout._paper.append('g')
        .classed('draglayer', true);

    // lower shape layer
    // (only for shapes to be drawn below the whole plot)
    var layerBelow = fullLayout._paper.append('g')
        .classed('layer-below', true);
    fullLayout._imageLowerLayer = layerBelow.append('g')
        .classed('imagelayer', true);
    fullLayout._shapeLowerLayer = layerBelow.append('g')
        .classed('shapelayer', true);

    var subplots = Plotly.Axes.getSubplots(gd);
    if(subplots.join('') !== Object.keys(gd._fullLayout._plots || {}).join('')) {
        makeSubplots(gd, subplots);
    }

    if(fullLayout._has('cartesian')) makeCartesianPlotFramwork(gd, subplots);

    // single ternary layer for the whole plot
    fullLayout._ternarylayer = fullLayout._paper.append('g').classed('ternarylayer', true);

    // shape layers in subplots
    var layerSubplot = fullLayout._paper.selectAll('.layer-subplot');
    fullLayout._imageSubplotLayer = layerSubplot.selectAll('.imagelayer');
    fullLayout._shapeSubplotLayer = layerSubplot.selectAll('.shapelayer');

    // upper shape layer
    // (only for shapes to be drawn above the whole plot, including subplots)
    var layerAbove = fullLayout._paper.append('g')
        .classed('layer-above', true);
    fullLayout._imageUpperLayer = layerAbove.append('g')
        .classed('imagelayer', true);
    fullLayout._shapeUpperLayer = layerAbove.append('g')
        .classed('shapelayer', true);

    // single pie layer for the whole plot
    fullLayout._pielayer = fullLayout._paper.append('g').classed('pielayer', true);

    // fill in image server scrape-svg
    fullLayout._glimages = fullLayout._paper.append('g').classed('glimages', true);
    fullLayout._geoimages = fullLayout._paper.append('g').classed('geoimages', true);

    // lastly info (legend, annotations) and hover layers go on top
    // these are in a different svg element normally, but get collapsed into a single
    // svg when exporting (after inserting 3D)
    fullLayout._infolayer = fullLayout._toppaper.append('g').classed('infolayer', true);
    fullLayout._zoomlayer = fullLayout._toppaper.append('g').classed('zoomlayer', true);
    fullLayout._hoverlayer = fullLayout._toppaper.append('g').classed('hoverlayer', true);

    gd.emit('plotly_framework');

    // position and style the containers, make main title
    var frameWorkDone = Lib.syncOrAsync([
        layoutStyles,
        function goAxes() { return Plotly.Axes.doTicks(gd, 'redraw'); },
        Fx.init
    ], gd);

    if(frameWorkDone && frameWorkDone.then) {
        gd._promises.push(frameWorkDone);
    }

    return frameWorkDone;
}

// create '_plots' object grouping x/y axes into subplots
// to be better manage subplots
function makeSubplots(gd, subplots) {
    var _plots = gd._fullLayout._plots = {};
    var subplot, plotinfo;

    function getAxisFunc(subplot, axLetter) {
        return function() {
            return Plotly.Axes.getFromId(gd, subplot, axLetter);
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
        svg.append('g').classed('imagelayer', true);
        svg.append('g').classed('maplayer', true);
        svg.append('g').classed('barlayer', true);
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
            var xa2 = Plotly.Axes.getFromId(gd, xa.overlaying) || xa;
            if(xa2 !== xa && xa2.overlaying) {
                xa2 = xa;
                xa.overlaying = false;
            }

            var ya2 = Plotly.Axes.getFromId(gd, ya.overlaying) || ya;
            if(ya2 !== ya && ya2.overlaying) {
                ya2 = ya;
                ya.overlaying = false;
            }

            var mainplot = xa2._id + ya2._id;
            if(mainplot !== subplot && subplots.indexOf(mainplot) !== -1) {
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

                // back layer for shapes and images to
                // be drawn below a subplot
                var backlayer = plotgroup.append('g')
                    .classed('layer-subplot', true);

                plotinfo.shapelayer = backlayer.append('g')
                    .classed('shapelayer', true);
                plotinfo.imagelayer = backlayer.append('g')
                    .classed('imagelayer', true);
                plotinfo.gridlayer = plotgroup.append('g');
                plotinfo.overgrid = plotgroup.append('g');
                plotinfo.zerolinelayer = plotgroup.append('g');
                plotinfo.overzero = plotgroup.append('g');
                plotinfo.plot = plotgroup.append('g').call(plotLayers);
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
    // extra groups of their main Plots.
    overlays.forEach(function(plotinfo) {
        var mainplot = fullLayout._plots[plotinfo.mainplot];
        mainplot.overlays.push(plotinfo);

        plotinfo.gridlayer = mainplot.overgrid.append('g');
        plotinfo.zerolinelayer = mainplot.overzero.append('g');
        plotinfo.plot = mainplot.overplot.append('g').call(plotLayers);
        plotinfo.xlines = mainplot.overlines.append('path');
        plotinfo.ylines = mainplot.overlines.append('path');
        plotinfo.xaxislayer = mainplot.overaxes.append('g');
        plotinfo.yaxislayer = mainplot.overaxes.append('g');
    });

    // common attributes for all subplots, overlays or not
    subplots.forEach(function(subplot) {
        var plotinfo = fullLayout._plots[subplot];

        plotinfo.xlines
            .style('fill', 'none')
            .classed('crisp', true);
        plotinfo.ylines
            .style('fill', 'none')
            .classed('crisp', true);
    });
}

// layoutStyles: styling for plot layout elements
function layoutStyles(gd) {
    return Lib.syncOrAsync([Plots.doAutoMargin, lsInner], gd);
}

function lsInner(gd) {
    var fullLayout = gd._fullLayout,
        gs = fullLayout._size,
        axList = Plotly.Axes.list(gd),
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
            xa = Plotly.Axes.getFromId(gd, subplot, 'x'),
            ya = Plotly.Axes.getFromId(gd, subplot, 'y');
        xa.setScale(); // this may already be done... not sure
        ya.setScale();

        if(plotinfo.bg) {
            plotinfo.bg
                .call(Drawing.setRect,
                    xa._offset - gs.p, ya._offset - gs.p,
                    xa._length + 2 * gs.p, ya._length + 2 * gs.p)
                .call(Color.fill, fullLayout.plot_bgcolor);
        }


        // Clip so that data only shows up on the plot area.
        plotinfo.clipId = 'clip' + fullLayout._uid + subplot + 'plot';

        var plotClip = fullLayout._defs.selectAll('g.clips')
            .selectAll('#' + plotinfo.clipId)
            .data([0]);

        plotClip.enter().append('clipPath')
            .attr({
                'class': 'plotclip',
                'id': plotinfo.clipId
            })
            .append('rect');

        plotClip.selectAll('rect')
            .attr({
                'width': xa._length,
                'height': ya._length
            });


        plotinfo.plot.call(Lib.setTranslate, xa._offset, ya._offset);
        plotinfo.plot.call(Drawing.setClipUrl, plotinfo.clipId);

        var xlw = Drawing.crispRound(gd, xa.linewidth, 1),
            ylw = Drawing.crispRound(gd, ya.linewidth, 1),
            xp = gs.p + ylw,
            xpathPrefix = 'M' + (-xp) + ',',
            xpathSuffix = 'h' + (xa._length + 2 * xp),
            showfreex = xa.anchor === 'free' &&
                freefinished.indexOf(xa._id) === -1,
            freeposx = gs.h * (1 - (xa.position||0)) + ((xlw / 2) % 1),
            showbottom =
                (xa.anchor === ya._id && (xa.mirror || xa.side !== 'top')) ||
                xa.mirror === 'all' || xa.mirror === 'allticks' ||
                (xa.mirrors && xa.mirrors[ya._id + 'bottom']),
            bottompos = ya._length + gs.p + xlw / 2,
            showtop =
                (xa.anchor === ya._id && (xa.mirror || xa.side === 'top')) ||
                xa.mirror === 'all' || xa.mirror === 'allticks' ||
                (xa.mirrors && xa.mirrors[ya._id + 'top']),
            toppos = -gs.p - xlw / 2,

            // shorten y axis lines so they don't overlap x axis lines
            yp = gs.p,
            // except where there's no x line
            // TODO: this gets more complicated with multiple x and y axes
            ypbottom = showbottom ? 0 : xlw,
            yptop = showtop ? 0 : xlw,
            ypathSuffix = ',' + (-yp - yptop) +
                'v' + (ya._length + 2 * yp + yptop + ypbottom),
            showfreey = ya.anchor === 'free' &&
                freefinished.indexOf(ya._id) === -1,
            freeposy = gs.w * (ya.position||0) + ((ylw / 2) % 1),
            showleft =
                (ya.anchor === xa._id && (ya.mirror || ya.side !== 'right')) ||
                ya.mirror === 'all' || ya.mirror === 'allticks' ||
                (ya.mirrors && ya.mirrors[xa._id + 'left']),
            leftpos = -gs.p - ylw / 2,
            showright =
                (ya.anchor === xa._id && (ya.mirror || ya.side === 'right')) ||
                ya.mirror === 'all' || ya.mirror === 'allticks' ||
                (ya.mirrors && ya.mirrors[xa._id + 'right']),
            rightpos = xa._length + gs.p + ylw / 2;

        // save axis line positions for ticks, draggers, etc to reference
        // each subplot gets an entry:
        //    [left or bottom, right or top, free, main]
        // main is the position at which to draw labels and draggers, if any
        xa._linepositions[subplot] = [
            showbottom ? bottompos : undefined,
            showtop ? toppos : undefined,
            showfreex ? freeposx : undefined
        ];
        if(xa.anchor === ya._id) {
            xa._linepositions[subplot][3] = xa.side === 'top' ?
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
        if(ya.anchor === xa._id) {
            ya._linepositions[subplot][3] = ya.side === 'right' ?
                rightpos : leftpos;
        }
        else if(showfreey) {
            ya._linepositions[subplot][3] = freeposy;
        }

        // translate all the extra stuff to have the
        // same origin as the plot area or axes
        var origin = 'translate(' + xa._offset + ',' + ya._offset + ')',
            originx = origin,
            originy = origin;
        if(showfreex) {
            originx = 'translate(' + xa._offset + ',' + gs.t + ')';
            toppos += ya._offset - gs.t;
            bottompos += ya._offset - gs.t;
        }
        if(showfreey) {
            originy = 'translate(' + gs.l + ',' + ya._offset + ')';
            leftpos += xa._offset - gs.l;
            rightpos += xa._offset - gs.l;
        }

        plotinfo.xlines
            .attr('transform', originx)
            .attr('d', (
                (showbottom ? (xpathPrefix + bottompos + xpathSuffix) : '') +
                (showtop ? (xpathPrefix + toppos + xpathSuffix) : '') +
                (showfreex ? (xpathPrefix + freeposx + xpathSuffix) : '')) ||
                // so it doesn't barf with no lines shown
                'M0,0')
            .style('stroke-width', xlw + 'px')
            .call(Color.stroke, xa.showline ?
                xa.linecolor : 'rgba(0,0,0,0)');
        plotinfo.ylines
            .attr('transform', originy)
            .attr('d', (
                (showleft ? ('M' + leftpos + ypathSuffix) : '') +
                (showright ? ('M' + rightpos + ypathSuffix) : '') +
                (showfreey ? ('M' + freeposy + ypathSuffix) : '')) ||
                'M0,0')
            .attr('stroke-width', ylw + 'px')
            .call(Color.stroke, ya.showline ?
                ya.linecolor : 'rgba(0,0,0,0)');

        plotinfo.xaxislayer.attr('transform', originx);
        plotinfo.yaxislayer.attr('transform', originy);
        plotinfo.gridlayer.attr('transform', origin);
        plotinfo.zerolinelayer.attr('transform', origin);
        plotinfo.draglayer.attr('transform', origin);

        // mark free axes as displayed, so we don't draw them again
        if(showfreex) { freefinished.push(xa._id); }
        if(showfreey) { freefinished.push(ya._id); }
    });

    Plotly.Axes.makeClipPaths(gd);

    drawMainTitle(gd);

    manageModeBar(gd);

    return gd._promises.length && Promise.all(gd._promises);
}

function drawMainTitle(gd) {
    var fullLayout = gd._fullLayout;

    Titles.draw(gd, 'gtitle', {
        propContainer: fullLayout,
        propName: 'title',
        dfltName: 'Plot',
        attributes: {
            x: fullLayout.width / 2,
            y: fullLayout._size.t / 2,
            'text-anchor': 'middle'
        }
    });
}

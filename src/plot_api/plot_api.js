/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Plotly = require('../plotly');
var Lib = require('../lib');
var Events = require('../lib/events');
var Queue = require('../lib/queue');

var Registry = require('../registry');
var Plots = require('../plots/plots');
var Fx = require('../plots/cartesian/graph_interact');
var Polar = require('../plots/polar');

var Drawing = require('../components/drawing');
var ErrorBars = require('../components/errorbars');
var xmlnsNamespaces = require('../constants/xmlns_namespaces');
var svgTextUtils = require('../lib/svg_text_utils');

var helpers = require('./helpers');
var subroutines = require('./subroutines');


/**
 * Main plot-creation function
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
    var frames;

    gd = helpers.getGraphDiv(gd);

    // Events.init is idempotent and bails early if gd has already been init'd
    Events.init(gd);

    if(Lib.isPlainObject(data)) {
        var obj = data;
        data = obj.data;
        layout = obj.layout;
        config = obj.config;
        frames = obj.frames;
    }

    var okToPlot = Events.triggerHandler(gd, 'plotly_beforeplot', [data, layout, config]);
    if(okToPlot === false) return Promise.reject();

    // if there's no data or layout, and this isn't yet a plotly plot
    // container, log a warning to help plotly.js users debug
    if(!data && !layout && !Lib.isPlotDiv(gd)) {
        Lib.warn('Calling Plotly.plot as if redrawing ' +
            'but this container doesn\'t yet have a plot.', gd);
    }

    function addFrames() {
        if(frames) {
            return Plotly.addFrames(gd, frames);
        }
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
        helpers.cleanData(data, gd.data);

        if(graphWasEmpty) gd.data = data;
        else gd.data.push.apply(gd.data, data);

        // for routines outside graph_obj that want a clean tab
        // (rather than appending to an existing one) gd.empty
        // is used to determine whether to make a new tab
        gd.empty = false;
    }

    if(!gd.layout || graphWasEmpty) gd.layout = helpers.cleanLayout(layout);

    // if the user is trying to drag the axes, allow new data and layout
    // to come in but don't allow a replot.
    if(gd._dragging && !gd._transitioning) {
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

    // make or remake the framework if we need to
    if(graphWasEmpty) makePlotFramework(gd);

    // polar need a different framework
    if(gd.framework !== makePlotFramework) {
        gd.framework = makePlotFramework;
        makePlotFramework(gd);
    }

    // save initial axis range once per graph
    if(graphWasEmpty) Plotly.Axes.saveRangeInitial(gd);

    var fullLayout = gd._fullLayout;

    // prepare the data and find the autorange

    // generate calcdata, if we need to
    // to force redoing calcdata, just delete it before calling Plotly.plot
    var recalc = !gd.calcdata || gd.calcdata.length !== (gd._fullData || []).length;
    if(recalc) Plots.doCalcdata(gd);

    // in case it has changed, attach fullData traces to calcdata
    for(var i = 0; i < gd.calcdata.length; i++) {
        gd.calcdata[i][0].trace = gd._fullData[i];
    }

    /*
     * start async-friendly code - now we're actually drawing things
     */

    var oldmargins = JSON.stringify(fullLayout._size);

    // draw framework first so that margin-pushing
    // components can position themselves correctly
    function drawFramework() {
        var basePlotModules = fullLayout._basePlotModules;

        for(var i = 0; i < basePlotModules.length; i++) {
            if(basePlotModules[i].drawFramework) {
                basePlotModules[i].drawFramework(gd);
            }
        }

        return Lib.syncOrAsync([
            subroutines.layoutStyles,
            drawAxes,
            Fx.init
        ], gd);
    }

    // draw anything that can affect margins.
    // currently this is legend and colorbars
    function marginPushers() {
        var calcdata = gd.calcdata;
        var i, cd, trace;

        Registry.getComponentMethod('legend', 'draw')(gd);
        Registry.getComponentMethod('rangeselector', 'draw')(gd);
        Registry.getComponentMethod('updatemenus', 'draw')(gd);
        Registry.getComponentMethod('sliders', 'draw')(gd);

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

    // in case the margins changed, draw margin pushers again
    function marginPushersAgain() {
        var seq = JSON.stringify(fullLayout._size) === oldmargins ?
            [] :
            [marginPushers, subroutines.layoutStyles];

        // re-initialize cartesian interaction,
        // which are sometimes cleared during marginPushers
        seq = seq.concat(Fx.init);

        return Lib.syncOrAsync(seq, gd);
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

        // calc and autorange for errorbars
        ErrorBars.calc(gd);

        // TODO: autosize extra for text markers
        return Lib.syncOrAsync([
            Registry.getComponentMethod('shapes', 'calcAutorange'),
            Registry.getComponentMethod('annotations', 'calcAutorange'),
            doAutoRange
        ], gd);
    }

    function doAutoRange() {
        if(gd._transitioning) return;

        var axList = Plotly.Axes.list(gd, '', true);
        for(var i = 0; i < axList.length; i++) {
            Plotly.Axes.doAutoRange(axList[i]);
        }
    }

    // draw ticks, titles, and calculate axis scaling (._b, ._m)
    function drawAxes() {
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

            if(!isVisible || !Registry.traceIs(trace, '2dMap')) {
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

        // keep reference to shape layers in subplots
        var layerSubplot = fullLayout._paper.selectAll('.layer-subplot');
        fullLayout._imageSubplotLayer = layerSubplot.selectAll('.imagelayer');
        fullLayout._shapeSubplotLayer = layerSubplot.selectAll('.shapelayer');

        // styling separate from drawing
        Plots.style(gd);

        // show annotations and shapes
        Registry.getComponentMethod('shapes', 'draw')(gd);
        Registry.getComponentMethod('annotations', 'draw')(gd);

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
        Registry.getComponentMethod('shapes', 'draw')(gd);
        Registry.getComponentMethod('images', 'draw')(gd);
        Registry.getComponentMethod('annotations', 'draw')(gd);
        Registry.getComponentMethod('legend', 'draw')(gd);
        Registry.getComponentMethod('rangeslider', 'draw')(gd);
        Registry.getComponentMethod('rangeselector', 'draw')(gd);
        Registry.getComponentMethod('updatemenus', 'draw')(gd);
        Registry.getComponentMethod('sliders', 'draw')(gd);
    }

    function cleanUp() {
        // now we're REALLY TRULY done plotting...
        // so mark it as done and let other procedures call a replot
        gd.emit('plotly_afterplot');
    }

    Lib.syncOrAsync([
        Plots.previousPromises,
        addFrames,
        drawFramework,
        marginPushers,
        marginPushersAgain,
        positionAndAutorange,
        subroutines.layoutStyles,
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

    // staticPlot forces a bunch of others:
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
    Polar.manager.fillLayout(gd);

    // resize canvas
    paperDiv.style({
        width: gd._fullLayout.width + 'px',
        height: gd._fullLayout.height + 'px'
    });

    // instantiate framework
    gd.framework = Polar.manager.framework(gd);

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
        this.call(svgTextUtils.convertToTspans);
        // TODO: html/mathjax
        // TODO: center title
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
            this.call(svgTextUtils.makeEditable)
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

// convenience function to force a full redraw, mostly for use by plotly.js
Plotly.redraw = function(gd) {
    gd = helpers.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        throw new Error('This element is not a Plotly plot: ' + gd);
    }

    helpers.cleanData(gd.data, gd.data);
    helpers.cleanLayout(gd.layout);

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
    gd = helpers.getGraphDiv(gd);

    // remove gl contexts
    Plots.cleanPlot([], {}, gd._fullData || {}, gd._fullLayout || {});

    Plots.purge(gd);
    return Plotly.plot(gd, data, layout, config);
};

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
    var i, value;

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
    gd = helpers.getGraphDiv(gd);

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
    Queue.add(gd, Plotly.prependTraces, undoArgs, extendTraces, arguments);

    return promise;
};

Plotly.prependTraces = function prependTraces(gd, update, indices, maxPoints) {
    gd = helpers.getGraphDiv(gd);

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
    Queue.add(gd, Plotly.extendTraces, undoArgs, prependTraces, arguments);

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
    gd = helpers.getGraphDiv(gd);

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

    // make sure traces do not repeat existing ones
    traces = traces.map(function(trace) {
        return Lib.extendFlat({}, trace);
    });

    helpers.cleanData(traces, gd.data);

    // add the traces to gd.data (no redrawing yet!)
    for(i = 0; i < traces.length; i++) {
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
        Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);
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
    Queue.startSequence(gd);
    Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);
    promise = Plotly.moveTraces(gd, currentIndices, newIndices);
    Queue.stopSequence(gd);
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
    gd = helpers.getGraphDiv(gd);

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
    Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

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
    gd = helpers.getGraphDiv(gd);

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
    Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

    return promise;
};

/**
 * restyle: update trace attributes of an existing plot
 *
 * Can be called two ways.
 *
 * Signature 1:
 * @param {String | HTMLDivElement} gd
 *  the id or DOM element of the graph container div
 * @param {String} astr
 *  attribute string (like `'marker.symbol'`) to update
 * @param {*} val
 *  value to give this attribute
 * @param {Number[] | Number} [traces]
 *  integer or array of integers for the traces to alter (all if omitted)
 *
 * Signature 2:
 * @param {String | HTMLDivElement} gd
 *  (as in signature 1)
 * @param {Object} aobj
 *  attribute object `{astr1: val1, astr2: val2 ...}`
 *  allows setting multiple attributes simultaneously
 * @param {Number[] | Number} [traces]
 *  (as in signature 1)
 *
 * `val` (or `val1`, `val2` ... in the object form) can be an array,
 * to apply different values to each trace.
 *
 * If the array is too short, it will wrap around (useful for
 * style files that want to specify cyclical default values).
 */
Plotly.restyle = function restyle(gd, astr, val, traces) {
    gd = helpers.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    var aobj = {};
    if(typeof astr === 'string') aobj[astr] = val;
    else if(Lib.isPlainObject(astr)) {
        // the 3-arg form
        aobj = astr;
        if(traces === undefined) traces = val;
    }
    else {
        Lib.warn('Restyle fail.', astr, val, traces);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    var specs = _restyle(gd, aobj, traces),
        flags = specs.flags;

    // clear calcdata if required
    if(flags.clearCalc) gd.calcdata = undefined;

    // fill in redraw sequence
    var seq = [];

    if(flags.fullReplot) {
        seq.push(Plotly.plot);
    }
    else {
        seq.push(Plots.previousPromises);

        Plots.supplyDefaults(gd);

        if(flags.dostyle) seq.push(subroutines.doTraceStyle);
        if(flags.docolorbars) seq.push(subroutines.doColorBars);
    }

    Queue.add(gd,
        restyle, [gd, specs.undoit, specs.traces],
        restyle, [gd, specs.redoit, specs.traces]
    );

    var plotDone = Lib.syncOrAsync(seq, gd);
    if(!plotDone || !plotDone.then) plotDone = Promise.resolve();

    return plotDone.then(function() {
        gd.emit('plotly_restyle', specs.eventData);
        return gd;
    });
};

function _restyle(gd, aobj, _traces) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        data = gd.data,
        i;

    var traces = helpers.coerceTraceIndices(gd, _traces);

    // initialize flags
    var flags = {
        docalc: false,
        docalcAutorange: false,
        doplot: false,
        dostyle: false,
        docolorbars: false,
        autorangeOn: false,
        clearCalc: false,
        fullReplot: false
    };

    // copies of the change (and previous values of anything affected)
    // for the undo / redo queue
    var redoit = {},
        undoit = {},
        axlist,
        flagAxForDelete = {};

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
        'open', 'high', 'low', 'close',
        'base', 'width', 'offset',
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
        'tilt', 'tiltaxis', 'depth', 'direction', 'rotation', 'pull',
        'line.showscale', 'line.cauto', 'line.autocolorscale', 'line.reversescale',
        'marker.line.showscale', 'marker.line.cauto', 'marker.line.autocolorscale', 'marker.line.reversescale',
        'xcalendar', 'ycalendar'
    ];

    for(i = 0; i < traces.length; i++) {
        if(Registry.traceIs(fullData[traces[i]], 'box')) {
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
        'boxpoints', 'jitter', 'pointpos', 'whiskerwidth', 'boxmean',
        'tickwidth'
    ];

    // replotAttrs attributes need a replot (because different
    // objects need to be made) but not a recalc
    var replotAttrs = [
        'zmin', 'zmax', 'zauto',
        'xgap', 'ygap',
        'marker.cmin', 'marker.cmax', 'marker.cauto',
        'line.cmin', 'line.cmax',
        'marker.line.cmin', 'marker.line.cmax',
        'contours.start', 'contours.end', 'contours.size',
        'contours.showlines',
        'line', 'line.smoothing', 'line.shape',
        'error_y.width', 'error_x.width', 'error_x.copy_ystyle',
        'marker.maxdisplayed'
    ];

    // these ones may alter the axis type
    // (at least if the first trace is involved)
    var axtypeAttrs = [
        'type', 'x', 'y', 'x0', 'y0', 'orientation', 'xaxis', 'yaxis'
    ];

    var zscl = ['zmin', 'zmax'],
        xbins = ['xbins.start', 'xbins.end', 'xbins.size'],
        ybins = ['ybins.start', 'ybins.end', 'ybins.size'],
        contourAttrs = ['contours.start', 'contours.end', 'contours.size'];

    // At the moment, only cartesian, pie and ternary plot types can afford
    // to not go through a full replot
    var doPlotWhiteList = ['cartesian', 'pie', 'ternary'];
    fullLayout._basePlotModules.forEach(function(_module) {
        if(doPlotWhiteList.indexOf(_module.name) === -1) flags.docalc = true;
    });

    // make a new empty vals array for undoit
    function a0() { return traces.map(function() { return undefined; }); }

    // for autoranging multiple axes
    function addToAxlist(axid) {
        var axName = Plotly.Axes.id2name(axid);
        if(axlist.indexOf(axName) === -1) axlist.push(axName);
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
            extraparam = Lib.nestedProperty(data[traces[i]], attr);
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
            flags.docalc = true;
            continue;
        }

        // set attribute in gd.data
        undoit[ai] = a0();
        for(i = 0; i < traces.length; i++) {
            cont = data[traces[i]];
            contFull = fullData[traces[i]];
            param = Lib.nestedProperty(cont, ai);
            oldVal = param.get();
            newVal = Array.isArray(vi) ? vi[i % vi.length] : vi;

            if(newVal === undefined) continue;

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
                } else if(Registry.traceIs(cont, 'cartesian')) {
                    Lib.nestedProperty(cont, 'marker.colors')
                        .set(Lib.nestedProperty(cont, 'marker.color').get());
                    // look for axes that are no longer in use and delete them
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
                helpers.swapXYData(cont);
            }
            else if(Plots.dataArrayContainers.indexOf(param.parts[0]) !== -1) {
                helpers.manageArrayContainers(param, newVal, undoit);
                flags.docalc = true;
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
            flags.docalc = true;
        }

        // switching from auto to manual binning or z scaling doesn't
        // actually do anything but change what you see in the styling
        // box. everything else at least needs to apply styles
        if((['autobinx', 'autobiny', 'zauto'].indexOf(ai) === -1) ||
                newVal !== false) {
            flags.dostyle = true;
        }
        if(['colorbar', 'line'].indexOf(param.parts[0]) !== -1 ||
            param.parts[0] === 'marker' && param.parts[1] === 'colorbar') {
            flags.docolorbars = true;
        }

        if(recalcAttrs.indexOf(ai) !== -1) {
            // major enough changes deserve autoscale, autobin, and
            // non-reversed axes so people don't get confused
            if(['orientation', 'type'].indexOf(ai) !== -1) {
                axlist = [];
                for(i = 0; i < traces.length; i++) {
                    var trace = data[traces[i]];

                    if(Registry.traceIs(trace, 'cartesian')) {
                        addToAxlist(trace.xaxis || 'x');
                        addToAxlist(trace.yaxis || 'y');

                        if(ai === 'type') {
                            doextra(['autobinx', 'autobiny'], true, i);
                        }
                    }
                }

                doextra(axlist.map(autorangeAttr), true, 0);
                doextra(axlist.map(rangeAttr), [0, 1], 0);
            }
            flags.docalc = true;
        }
        else if(replotAttrs.indexOf(ai) !== -1) flags.doplot = true;
        else if(autorangeAttrs.indexOf(ai) !== -1) flags.docalcAutorange = true;
    }

    // do we need to force a recalc?
    Plotly.Axes.list(gd).forEach(function(ax) {
        if(ax.autorange) flags.autorangeOn = true;
    });

    // check axes we've flagged for possible deletion
    // flagAxForDelete is a hash so we can make sure we only get each axis once
    var axListForDelete = Object.keys(flagAxForDelete);
    axisLoop:
    for(i = 0; i < axListForDelete.length; i++) {
        var axId = axListForDelete[i],
            axLetter = axId.charAt(0),
            axAttr = axLetter + 'axis';

        for(var j = 0; j < data.length; j++) {
            if(Registry.traceIs(data[j], 'cartesian') &&
                    (data[j][axAttr] || axLetter) === axId) {
                continue axisLoop;
            }
        }

        // no data on this axis - delete it.
        doextra('LAYOUT' + Plotly.Axes.id2name(axId), null, 0);
    }

    // combine a few flags together;
    if(flags.docalc || (flags.docalcAutorange && flags.autorangeOn)) {
        flags.clearCalc = true;
    }
    if(flags.docalc || flags.doplot || flags.docalcAutorange) {
        flags.fullReplot = true;
    }

    return {
        flags: flags,
        undoit: undoit,
        redoit: redoit,
        traces: traces,
        eventData: Lib.extendDeepNoArrays([], [redoit, traces])
    };
}

/**
 * relayout: update layout attributes of an existing plot
 *
 * Can be called two ways:
 *
 * Signature 1:
 * @param {String | HTMLDivElement} gd
 *  the id or dom element of the graph container div
 * @param {String} astr
 *  attribute string (like `'xaxis.range[0]'`) to update
 * @param {*} val
 *  value to give this attribute
 *
 * Signature 2:
 * @param {String | HTMLDivElement} gd
 *  (as in signature 1)
 * @param {Object} aobj
 *  attribute object `{astr1: val1, astr2: val2 ...}`
 *  allows setting multiple attributes simultaneously
 */
Plotly.relayout = function relayout(gd, astr, val) {
    gd = helpers.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    if(gd.framework && gd.framework.isPolar) {
        return Promise.resolve(gd);
    }

    var aobj = {};
    if(typeof astr === 'string') aobj[astr] = val;
    else if(Lib.isPlainObject(astr)) aobj = astr;
    else {
        Lib.warn('Relayout fail.', astr, val);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    var specs = _relayout(gd, aobj),
        flags = specs.flags;

    // clear calcdata if required
    if(flags.docalc) gd.calcdata = undefined;

    // fill in redraw sequence
    var seq = [];

    if(flags.layoutReplot) {
        seq.push(subroutines.layoutReplot);
    }
    else if(Object.keys(aobj).length) {
        seq.push(Plots.previousPromises);
        Plots.supplyDefaults(gd);

        if(flags.dolegend) seq.push(subroutines.doLegend);
        if(flags.dolayoutstyle) seq.push(subroutines.layoutStyles);
        if(flags.doticks) seq.push(subroutines.doTicksRelayout);
        if(flags.domodebar) seq.push(subroutines.doModeBar);
    }

    Queue.add(gd,
        relayout, [gd, specs.undoit],
        relayout, [gd, specs.redoit]
    );

    var plotDone = Lib.syncOrAsync(seq, gd);
    if(!plotDone || !plotDone.then) plotDone = Promise.resolve(gd);

    return plotDone.then(function() {
        gd.emit('plotly_relayout', specs.eventData);
        return gd;
    });
};

function _relayout(gd, aobj) {
    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        keys = Object.keys(aobj),
        axes = Plotly.Axes.list(gd),
        i;

    // look for 'allaxes', split out into all axes
    // in case of 3D the axis are nested within a scene which is held in _id
    for(i = 0; i < keys.length; i++) {
        if(keys[i].indexOf('allaxes') === 0) {
            for(var j = 0; j < axes.length; j++) {
                var scene = axes[j]._id.substr(1),
                    axisAttr = (scene.indexOf('scene') !== -1) ? (scene + '.') : '',
                    newkey = keys[i].replace('allaxes', axisAttr + axes[j]._name);

                if(!aobj[newkey]) aobj[newkey] = aobj[keys[i]];
            }

            delete aobj[keys[i]];
        }
    }

    // initialize flags
    var flags = {
        dolegend: false,
        doticks: false,
        dolayoutstyle: false,
        doplot: false,
        docalc: false,
        domodebar: false,
        layoutReplot: false
    };

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

        if(vi === undefined) continue;

        redoit[ai] = vi;

        // axis reverse is special - it is its own inverse
        // op and has no flag.
        undoit[ai] = (pleaf === 'reverse') ? vi : p.get();

        // Setting width or height to null must reset the graph's width / height
        // back to its initial value as computed during the first pass in Plots.plotAutoSize.
        //
        // To do so, we must manually set them back here using the _initialAutoSize cache.
        if(['width', 'height'].indexOf(ai) !== -1 && vi === null) {
            gd._fullLayout[ai] = gd._initialAutoSize[ai];
        }
        // check autorange vs range
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
            flags.docalc = true;
        }
        else if(/[xy]axis[0-9]*\.categoryorder$/.test(pleafPlus)) {
            flags.docalc = true;
        }
        else if(/[xy]axis[0-9]*\.categoryarray/.test(pleafPlus)) {
            flags.docalc = true;
        }

        if(pleafPlus.indexOf('rangeslider') !== -1) {
            flags.docalc = true;
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

            if(parentFull.autorange) flags.docalc = true;
            else flags.doplot = true;
        }
        // send annotation and shape mods one-by-one through Annotations.draw(),
        // don't set via nestedProperty
        // that's because add and remove are special
        else if(p.parts[0] === 'annotations' || p.parts[0] === 'shapes') {
            var objNum = p.parts[1],
                objType = p.parts[0],
                objList = layout[objType] || [],
                obji = objList[objNum] || {};

            // if p.parts is just an annotation number, and val is either
            // 'add' or an entire annotation to add, the undo is 'remove'
            // if val is 'remove' then undo is the whole annotation object
            if(p.parts.length === 2) {

                // new API, remove annotation / shape with `null`
                if(vi === null) aobj[ai] = 'remove';

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
                else Lib.log('???', aobj);
            }

            if((refAutorange(obji, 'x') || refAutorange(obji, 'y')) &&
                    !Lib.containsAny(ai, ['color', 'opacity', 'align', 'dash'])) {
                flags.docalc = true;
            }

            // TODO: combine all edits to a given annotation / shape into one call
            // as it is we get separate calls for x and y (or ax and ay) on move

            var drawOne = Registry.getComponentMethod(objType, 'drawOne');
            drawOne(gd, objNum, p.parts.slice(2).join('.'), aobj[ai]);
            delete aobj[ai];
        }
        else if(
            Plots.layoutArrayContainers.indexOf(p.parts[0]) !== -1 ||
            (p.parts[0] === 'mapbox' && p.parts[1] === 'layers')
        ) {
            helpers.manageArrayContainers(p, vi, undoit);
            flags.doplot = true;
        }
        // alter gd.layout
        else {
            var pp1 = String(p.parts[1] || '');
            // check whether we can short-circuit a full redraw
            // 3d or geo at this point just needs to redraw.
            if(p.parts[0].indexOf('scene') === 0) flags.doplot = true;
            else if(p.parts[0].indexOf('geo') === 0) flags.doplot = true;
            else if(p.parts[0].indexOf('ternary') === 0) flags.doplot = true;
            else if(ai === 'paper_bgcolor') flags.doplot = true;
            else if(fullLayout._has('gl2d') &&
                (ai.indexOf('axis') !== -1 || p.parts[0] === 'plot_bgcolor')
            ) flags.doplot = true;
            else if(ai === 'hiddenlabels') flags.docalc = true;
            else if(p.parts[0].indexOf('legend') !== -1) flags.dolegend = true;
            else if(ai.indexOf('title') !== -1) flags.doticks = true;
            else if(p.parts[0].indexOf('bgcolor') !== -1) flags.dolayoutstyle = true;
            else if(p.parts.length > 1 &&
                    Lib.containsAny(pp1, ['tick', 'exponent', 'grid', 'zeroline'])) {
                flags.doticks = true;
            }
            else if(ai.indexOf('.linewidth') !== -1 &&
                    ai.indexOf('axis') !== -1) {
                flags.doticks = flags.dolayoutstyle = true;
            }
            else if(p.parts.length > 1 && pp1.indexOf('line') !== -1) {
                flags.dolayoutstyle = true;
            }
            else if(p.parts.length > 1 && pp1 === 'mirror') {
                flags.doticks = flags.dolayoutstyle = true;
            }
            else if(ai === 'margin.pad') {
                flags.doticks = flags.dolayoutstyle = true;
            }
            else if(p.parts[0] === 'margin' ||
                    p.parts[1] === 'autorange' ||
                    p.parts[1] === 'rangemode' ||
                    p.parts[1] === 'type' ||
                    p.parts[1] === 'domain' ||
                    ai.indexOf('calendar') !== -1 ||
                    ai.match(/^(bar|box|font)/)) {
                flags.docalc = true;
            }
            /*
             * hovermode and dragmode don't need any redrawing, since they just
             * affect reaction to user input, everything else, assume full replot.
             * height, width, autosize get dealt with below. Except for the case of
             * of subplots - scenes - which require scene.updateFx to be called.
             */
            else if(['hovermode', 'dragmode'].indexOf(ai) !== -1) flags.domodebar = true;
            else if(['hovermode', 'dragmode', 'height',
                'width', 'autosize'].indexOf(ai) === -1) {
                flags.doplot = true;
            }

            p.set(vi);
        }
    }

    var oldWidth = gd._fullLayout.width,
        oldHeight = gd._fullLayout.height;

    // coerce the updated layout
    Plots.supplyDefaults(gd);

    // calculate autosizing
    if(gd.layout.autosize) Plots.plotAutoSize(gd, gd.layout, gd._fullLayout);

    // avoid unnecessary redraws
    var hasSizechanged = aobj.height || aobj.width ||
        (gd._fullLayout.width !== oldWidth) ||
        (gd._fullLayout.height !== oldHeight);

    if(hasSizechanged) flags.docalc = true;

    if(flags.doplot || flags.docalc) {
        flags.layoutReplot = true;
    }

    // now all attribute mods are done, as are
    // redo and undo so we can save them

    return {
        flags: flags,
        undoit: undoit,
        redoit: redoit,
        eventData: Lib.extendDeep({}, redoit)
    };
}

/**
 * update: update trace and layout attributes of an existing plot
 *
 * @param {String | HTMLDivElement} gd
 *  the id or DOM element of the graph container div
 * @param {Object} traceUpdate
 *  attribute object `{astr1: val1, astr2: val2 ...}`
 *  corresponding to updates in the plot's traces
 * @param {Object} layoutUpdate
 *  attribute object `{astr1: val1, astr2: val2 ...}`
 *  corresponding to updates in the plot's layout
 * @param {Number[] | Number} [traces]
 *  integer or array of integers for the traces to alter (all if omitted)
 *
 */
Plotly.update = function update(gd, traceUpdate, layoutUpdate, traces) {
    gd = helpers.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    if(gd.framework && gd.framework.isPolar) {
        return Promise.resolve(gd);
    }

    if(!Lib.isPlainObject(traceUpdate)) traceUpdate = {};
    if(!Lib.isPlainObject(layoutUpdate)) layoutUpdate = {};

    if(Object.keys(traceUpdate).length) gd.changed = true;
    if(Object.keys(layoutUpdate).length) gd.changed = true;

    var restyleSpecs = _restyle(gd, traceUpdate, traces),
        restyleFlags = restyleSpecs.flags;

    var relayoutSpecs = _relayout(gd, layoutUpdate),
        relayoutFlags = relayoutSpecs.flags;

    // clear calcdata if required
    if(restyleFlags.clearCalc || relayoutFlags.docalc) gd.calcdata = undefined;

    // fill in redraw sequence
    var seq = [];

    if(restyleFlags.fullReplot && relayoutFlags.layoutReplot) {
        var data = gd.data,
            layout = gd.layout;

        // clear existing data/layout on gd
        // so that Plotly.plot doesn't try to extend them
        gd.data = undefined;
        gd.layout = undefined;

        seq.push(function() { return Plotly.plot(gd, data, layout); });
    }
    else if(restyleFlags.fullReplot) {
        seq.push(Plotly.plot);
    }
    else if(relayoutFlags.layoutReplot) {
        seq.push(subroutines.layoutReplot);
    }
    else {
        seq.push(Plots.previousPromises);
        Plots.supplyDefaults(gd);

        if(restyleFlags.dostyle) seq.push(subroutines.doTraceStyle);
        if(restyleFlags.docolorbars) seq.push(subroutines.doColorBars);
        if(relayoutFlags.dolegend) seq.push(subroutines.doLegend);
        if(relayoutFlags.dolayoutstyle) seq.push(subroutines.layoutStyles);
        if(relayoutFlags.doticks) seq.push(subroutines.doTicksRelayout);
        if(relayoutFlags.domodebar) seq.push(subroutines.doModeBar);
    }

    Queue.add(gd,
        update, [gd, restyleSpecs.undoit, relayoutSpecs.undoit, restyleSpecs.traces],
        update, [gd, restyleSpecs.redoit, relayoutSpecs.redoit, restyleSpecs.traces]
    );

    var plotDone = Lib.syncOrAsync(seq, gd);
    if(!plotDone || !plotDone.then) plotDone = Promise.resolve(gd);

    return plotDone.then(function() {
        gd.emit('plotly_update', {
            data: restyleSpecs.eventData,
            layout: relayoutSpecs.eventData
        });

        return gd;
    });
};

/**
 * Animate to a frame, sequence of frame, frame group, or frame definition
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 *
 * @param {string or object or array of strings or array of objects} frameOrGroupNameOrFrameList
 *      a single frame, array of frames, or group to which to animate. The intent is
 *      inferred by the type of the input. Valid inputs are:
 *
 *      - string, e.g. 'groupname': animate all frames of a given `group` in the order
 *            in which they are defined via `Plotly.addFrames`.
 *
 *      - array of strings, e.g. ['frame1', frame2']: a list of frames by name to which
 *            to animate in sequence
 *
 *      - object: {data: ...}: a frame definition to which to animate. The frame is not
 *            and does not need to be added via `Plotly.addFrames`. It may contain any of
 *            the properties of a frame, including `data`, `layout`, and `traces`. The
 *            frame is used as provided and does not use the `baseframe` property.
 *
 *      - array of objects, e.g. [{data: ...}, {data: ...}]: a list of frame objects,
 *            each following the same rules as a single `object`.
 *
 * @param {object} animationOpts
 *      configuration for the animation
 */
Plotly.animate = function(gd, frameOrGroupNameOrFrameList, animationOpts) {
    gd = helpers.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        throw new Error(
            'This element is not a Plotly plot: ' + gd + '. It\'s likely that you\'ve failed ' +
            'to create a plot before animating it. For more details, see ' +
            'https://plot.ly/javascript/animations/'
        );
    }

    var trans = gd._transitionData;

    // This is the queue of frames that will be animated as soon as possible. They
    // are popped immediately upon the *start* of a transition:
    if(!trans._frameQueue) {
        trans._frameQueue = [];
    }

    animationOpts = Plots.supplyAnimationDefaults(animationOpts);
    var transitionOpts = animationOpts.transition;
    var frameOpts = animationOpts.frame;

    // Since frames are popped immediately, an empty queue only means all frames have
    // *started* to transition, not that the animation is complete. To solve that,
    // track a separate counter that increments at the same time as frames are added
    // to the queue, but decrements only when the transition is complete.
    if(trans._frameWaitingCnt === undefined) {
        trans._frameWaitingCnt = 0;
    }

    function getTransitionOpts(i) {
        if(Array.isArray(transitionOpts)) {
            if(i >= transitionOpts.length) {
                return transitionOpts[0];
            } else {
                return transitionOpts[i];
            }
        } else {
            return transitionOpts;
        }
    }

    function getFrameOpts(i) {
        if(Array.isArray(frameOpts)) {
            if(i >= frameOpts.length) {
                return frameOpts[0];
            } else {
                return frameOpts[i];
            }
        } else {
            return frameOpts;
        }
    }

    // Execute a callback after the wrapper function has been called n times.
    // This is used to defer the resolution until a transition has resovled *and*
    // the frame has completed. If it's not done this way, then we get a race
    // condition in which the animation might resolve before a transition is complete
    // or vice versa.
    function callbackOnNthTime(cb, n) {
        var cnt = 0;
        return function() {
            if(cb && ++cnt === n) {
                return cb();
            }
        };
    }

    return new Promise(function(resolve, reject) {
        function discardExistingFrames() {
            if(trans._frameQueue.length === 0) {
                return;
            }

            while(trans._frameQueue.length) {
                var next = trans._frameQueue.pop();
                if(next.onInterrupt) {
                    next.onInterrupt();
                }
            }

            gd.emit('plotly_animationinterrupted', []);
        }

        function queueFrames(frameList) {
            if(frameList.length === 0) return;

            for(var i = 0; i < frameList.length; i++) {
                var computedFrame;

                if(frameList[i].type === 'byname') {
                    // If it's a named frame, compute it:
                    computedFrame = Plots.computeFrame(gd, frameList[i].name);
                } else {
                    // Otherwise we must have been given a simple object, so treat
                    // the input itself as the computed frame.
                    computedFrame = frameList[i].data;
                }

                var frameOpts = getFrameOpts(i);
                var transitionOpts = getTransitionOpts(i);

                // It doesn't make much sense for the transition duration to be greater than
                // the frame duration, so limit it:
                transitionOpts.duration = Math.min(transitionOpts.duration, frameOpts.duration);

                var nextFrame = {
                    frame: computedFrame,
                    name: frameList[i].name,
                    frameOpts: frameOpts,
                    transitionOpts: transitionOpts,
                };
                if(i === frameList.length - 1) {
                    // The last frame in this .animate call stores the promise resolve
                    // and reject callbacks. This is how we ensure that the animation
                    // loop (which may exist as a result of a *different* .animate call)
                    // still resolves or rejecdts this .animate call's promise. once it's
                    // complete.
                    nextFrame.onComplete = callbackOnNthTime(resolve, 2);
                    nextFrame.onInterrupt = reject;
                }

                trans._frameQueue.push(nextFrame);
            }

            // Set it as never having transitioned to a frame. This will cause the animation
            // loop to immediately transition to the next frame (which, for immediate mode,
            // is the first frame in the list since all others would have been discarded
            // below)
            if(animationOpts.mode === 'immediate') {
                trans._lastFrameAt = -Infinity;
            }

            // Only it's not already running, start a RAF loop. This could be avoided in the
            // case that there's only one frame, but it significantly complicated the logic
            // and only sped things up by about 5% or so for a lorenz attractor simulation.
            // It would be a fine thing to implement, but the benefit of that optimization
            // doesn't seem worth the extra complexity.
            if(!trans._animationRaf) {
                beginAnimationLoop();
            }
        }

        function stopAnimationLoop() {
            gd.emit('plotly_animated');

            // Be sure to unset also since it's how we know whether a loop is already running:
            window.cancelAnimationFrame(trans._animationRaf);
            trans._animationRaf = null;
        }

        function nextFrame() {
            if(trans._currentFrame && trans._currentFrame.onComplete) {
                // Execute the callback and unset it to ensure it doesn't
                // accidentally get called twice
                trans._currentFrame.onComplete();
            }

            var newFrame = trans._currentFrame = trans._frameQueue.shift();

            if(newFrame) {
                // Since it's sometimes necessary to do deep digging into frame data,
                // we'll consider it not 100% impossible for nulls or numbers to sneak through,
                // so check when casting the name, just to be absolutely certain:
                var stringName = newFrame.name ? newFrame.name.toString() : null;
                gd._fullLayout._currentFrame = stringName;

                trans._lastFrameAt = Date.now();
                trans._timeToNext = newFrame.frameOpts.duration;

                // This is simply called and it's left to .transition to decide how to manage
                // interrupting current transitions. That means we don't need to worry about
                // how it resolves or what happens after this:
                Plots.transition(gd,
                    newFrame.frame.data,
                    newFrame.frame.layout,
                    helpers.coerceTraceIndices(gd, newFrame.frame.traces),
                    newFrame.frameOpts,
                    newFrame.transitionOpts
                ).then(function() {
                    if(newFrame.onComplete) {
                        newFrame.onComplete();
                    }

                });

                gd.emit('plotly_animatingframe', {
                    name: stringName,
                    frame: newFrame.frame,
                    animation: {
                        frame: newFrame.frameOpts,
                        transition: newFrame.transitionOpts,
                    }
                });
            } else {
                // If there are no more frames, then stop the RAF loop:
                stopAnimationLoop();
            }
        }

        function beginAnimationLoop() {
            gd.emit('plotly_animating');

            // If no timer is running, then set last frame = long ago so that the next
            // frame is immediately transitioned:
            trans._lastFrameAt = -Infinity;
            trans._timeToNext = 0;
            trans._runningTransitions = 0;
            trans._currentFrame = null;

            var doFrame = function() {
                // This *must* be requested before nextFrame since nextFrame may decide
                // to cancel it if there's nothing more to animated:
                trans._animationRaf = window.requestAnimationFrame(doFrame);

                // Check if we're ready for a new frame:
                if(Date.now() - trans._lastFrameAt > trans._timeToNext) {
                    nextFrame();
                }
            };

            doFrame();
        }

        // This is an animate-local counter that helps match up option input list
        // items with the particular frame.
        var configCounter = 0;
        function setTransitionConfig(frame) {
            if(Array.isArray(transitionOpts)) {
                if(configCounter >= transitionOpts.length) {
                    frame.transitionOpts = transitionOpts[configCounter];
                } else {
                    frame.transitionOpts = transitionOpts[0];
                }
            } else {
                frame.transitionOpts = transitionOpts;
            }
            configCounter++;
            return frame;
        }

        // Disambiguate what's sort of frames have been received
        var i, frame;
        var frameList = [];
        var allFrames = frameOrGroupNameOrFrameList === undefined || frameOrGroupNameOrFrameList === null;
        var isFrameArray = Array.isArray(frameOrGroupNameOrFrameList);
        var isSingleFrame = !allFrames && !isFrameArray && Lib.isPlainObject(frameOrGroupNameOrFrameList);

        if(isSingleFrame) {
            // In this case, a simple object has been passed to animate.
            frameList.push({
                type: 'object',
                data: setTransitionConfig(Lib.extendFlat({}, frameOrGroupNameOrFrameList))
            });
        } else if(allFrames || ['string', 'number'].indexOf(typeof frameOrGroupNameOrFrameList) !== -1) {
            // In this case, null or undefined has been passed so that we want to
            // animate *all* currently defined frames
            for(i = 0; i < trans._frames.length; i++) {
                frame = trans._frames[i];

                if(!frame) continue;

                if(allFrames || String(frame.group) === String(frameOrGroupNameOrFrameList)) {
                    frameList.push({
                        type: 'byname',
                        name: String(frame.name),
                        data: setTransitionConfig({name: frame.name})
                    });
                }
            }
        } else if(isFrameArray) {
            for(i = 0; i < frameOrGroupNameOrFrameList.length; i++) {
                var frameOrName = frameOrGroupNameOrFrameList[i];
                if(['number', 'string'].indexOf(typeof frameOrName) !== -1) {
                    frameOrName = String(frameOrName);
                    // In this case, there's an array and this frame is a string name:
                    frameList.push({
                        type: 'byname',
                        name: frameOrName,
                        data: setTransitionConfig({name: frameOrName})
                    });
                } else if(Lib.isPlainObject(frameOrName)) {
                    frameList.push({
                        type: 'object',
                        data: setTransitionConfig(Lib.extendFlat({}, frameOrName))
                    });
                }
            }
        }

        // Verify that all of these frames actually exist; return and reject if not:
        for(i = 0; i < frameList.length; i++) {
            frame = frameList[i];
            if(frame.type === 'byname' && !trans._frameHash[frame.data.name]) {
                Lib.warn('animate failure: frame not found: "' + frame.data.name + '"');
                reject();
                return;
            }
        }

        // If the mode is either next or immediate, then all currently queued frames must
        // be dumped and the corresponding .animate promises rejected.
        if(['next', 'immediate'].indexOf(animationOpts.mode) !== -1) {
            discardExistingFrames();
        }

        if(animationOpts.direction === 'reverse') {
            frameList.reverse();
        }

        var currentFrame = gd._fullLayout._currentFrame;
        if(currentFrame && animationOpts.fromcurrent) {
            var idx = -1;
            for(i = 0; i < frameList.length; i++) {
                frame = frameList[i];
                if(frame.type === 'byname' && frame.name === currentFrame) {
                    idx = i;
                    break;
                }
            }

            if(idx > 0 && idx < frameList.length - 1) {
                var filteredFrameList = [];
                for(i = 0; i < frameList.length; i++) {
                    frame = frameList[i];
                    if(frameList[i].type !== 'byname' || i > idx) {
                        filteredFrameList.push(frame);
                    }
                }
                frameList = filteredFrameList;
            }
        }

        if(frameList.length > 0) {
            queueFrames(frameList);
        } else {
            // This is the case where there were simply no frames. It's a little strange
            // since there's not much to do:
            gd.emit('plotly_animated');
            resolve();
        }
    });
};

/**
 * Register new frames
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 *
 * @param {array of objects} frameList
 *      list of frame definitions, in which each object includes any of:
 *      - name: {string} name of frame to add
 *      - data: {array of objects} trace data
 *      - layout {object} layout definition
 *      - traces {array} trace indices
 *      - baseframe {string} name of frame from which this frame gets defaults
 *
 *  @param {array of integers) indices
 *      an array of integer indices matching the respective frames in `frameList`. If not
 *      provided, an index will be provided in serial order. If already used, the frame
 *      will be overwritten.
 */
Plotly.addFrames = function(gd, frameList, indices) {
    gd = helpers.getGraphDiv(gd);

    var numericNameWarningCount = 0;

    if(frameList === null || frameList === undefined) {
        return Promise.resolve();
    }

    if(!Lib.isPlotDiv(gd)) {
        throw new Error(
            'This element is not a Plotly plot: ' + gd + '. It\'s likely that you\'ve failed ' +
            'to create a plot before adding frames. For more details, see ' +
            'https://plot.ly/javascript/animations/'
        );
    }

    var i, frame, j, idx;
    var _frames = gd._transitionData._frames;
    var _hash = gd._transitionData._frameHash;


    if(!Array.isArray(frameList)) {
        throw new Error('addFrames failure: frameList must be an Array of frame definitions' + frameList);
    }

    // Create a sorted list of insertions since we run into lots of problems if these
    // aren't in ascending order of index:
    //
    // Strictly for sorting. Make sure this is guaranteed to never collide with any
    // already-exisisting indices:
    var bigIndex = _frames.length + frameList.length * 2;

    var insertions = [];
    for(i = frameList.length - 1; i >= 0; i--) {
        if(!Lib.isPlainObject(frameList[i])) continue;

        var name = (_hash[frameList[i].name] || {}).name;
        var newName = frameList[i].name;

        if(name && newName && typeof newName === 'number' && _hash[name]) {
            numericNameWarningCount++;

            Lib.warn('addFrames: overwriting frame "' + _hash[name].name +
                '" with a frame whose name of type "number" also equates to "' +
                name + '". This is valid but may potentially lead to unexpected ' +
                'behavior since all plotly.js frame names are stored internally ' +
                'as strings.');

            if(numericNameWarningCount > 5) {
                Lib.warn('addFrames: This API call has yielded too many warnings. ' +
                    'For the rest of this call, further warnings about numeric frame ' +
                    'names will be suppressed.');
            }
        }

        insertions.push({
            frame: Plots.supplyFrameDefaults(frameList[i]),
            index: (indices && indices[i] !== undefined && indices[i] !== null) ? indices[i] : bigIndex + i
        });
    }

    // Sort this, taking note that undefined insertions end up at the end:
    insertions.sort(function(a, b) {
        if(a.index > b.index) return -1;
        if(a.index < b.index) return 1;
        return 0;
    });

    var ops = [];
    var revops = [];
    var frameCount = _frames.length;

    for(i = insertions.length - 1; i >= 0; i--) {
        frame = insertions[i].frame;

        if(typeof frame.name === 'number') {
            Lib.warn('Warning: addFrames accepts frames with numeric names, but the numbers are' +
                'implicitly cast to strings');

        }

        if(!frame.name) {
            // Repeatedly assign a default name, incrementing the counter each time until
            // we get a name that's not in the hashed lookup table:
            while(_hash[(frame.name = 'frame ' + gd._transitionData._counter++)]);
        }

        if(_hash[frame.name]) {
            // If frame is present, overwrite its definition:
            for(j = 0; j < _frames.length; j++) {
                if((_frames[j] || {}).name === frame.name) break;
            }
            ops.push({type: 'replace', index: j, value: frame});
            revops.unshift({type: 'replace', index: j, value: _frames[j]});
        } else {
            // Otherwise insert it at the end of the list:
            idx = Math.max(0, Math.min(insertions[i].index, frameCount));

            ops.push({type: 'insert', index: idx, value: frame});
            revops.unshift({type: 'delete', index: idx});
            frameCount++;
        }
    }

    var undoFunc = Plots.modifyFrames,
        redoFunc = Plots.modifyFrames,
        undoArgs = [gd, revops],
        redoArgs = [gd, ops];

    if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

    return Plots.modifyFrames(gd, ops);
};

/**
 * Delete frame
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 *
 * @param {array of integers} frameList
 *      list of integer indices of frames to be deleted
 */
Plotly.deleteFrames = function(gd, frameList) {
    gd = helpers.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        throw new Error('This element is not a Plotly plot: ' + gd);
    }

    var i, idx;
    var _frames = gd._transitionData._frames;
    var ops = [];
    var revops = [];

    frameList = frameList.slice(0);
    frameList.sort();

    for(i = frameList.length - 1; i >= 0; i--) {
        idx = frameList[i];
        ops.push({type: 'delete', index: idx});
        revops.unshift({type: 'insert', index: idx, value: _frames[idx]});
    }

    var undoFunc = Plots.modifyFrames,
        redoFunc = Plots.modifyFrames,
        undoArgs = [gd, revops],
        redoArgs = [gd, ops];

    if(Queue) Queue.add(gd, undoFunc, undoArgs, redoFunc, redoArgs);

    return Plots.modifyFrames(gd, ops);
};

/**
 * Purge a graph container div back to its initial pre-Plotly.plot state
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 */
Plotly.purge = function purge(gd) {
    gd = helpers.getGraphDiv(gd);

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

    // single cartesian layer for the whole plot
    fullLayout._cartesianlayer = fullLayout._paper.append('g').classed('cartesianlayer', true);

    // single ternary layer for the whole plot
    fullLayout._ternarylayer = fullLayout._paper.append('g').classed('ternarylayer', true);

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
}

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


var d3 = require('d3');
var isNumeric = require('fast-isnumeric');
var hasHover = require('has-hover');

var Lib = require('../lib');
var Events = require('../lib/events');
var Queue = require('../lib/queue');

var Registry = require('../registry');
var PlotSchema = require('./plot_schema');
var Plots = require('../plots/plots');
var Polar = require('../plots/polar/legacy');

var Axes = require('../plots/cartesian/axes');
var Drawing = require('../components/drawing');
var Color = require('../components/color');
var initInteractions = require('../plots/cartesian/graph_interact').initInteractions;
var xmlnsNamespaces = require('../constants/xmlns_namespaces');
var svgTextUtils = require('../lib/svg_text_utils');

var defaultConfig = require('./plot_config');
var manageArrays = require('./manage_arrays');
var helpers = require('./helpers');
var subroutines = require('./subroutines');
var editTypes = require('./edit_types');

var AX_NAME_PATTERN = require('../plots/cartesian/constants').AX_NAME_PATTERN;

var numericNameWarningCount = 0;
var numericNameWarningCountLimit = 5;

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
 * OR
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 * @param {object} figure
 *      object containing `data`, `layout`, `config`, and `frames` members
 *
 */
exports.plot = function(gd, data, layout, config) {
    var frames;

    gd = Lib.getGraphDiv(gd);

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
            return exports.addFrames(gd, frames);
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
    // in #js-plotly-tester (and stored as Drawing.tester)
    // so we can share cached text across tabs
    Drawing.makeTester();

    // clear stashed base url
    delete Drawing.baseUrl;

    // collect promises for any async actions during plotting
    // any part of the plotting code can push to gd._promises, then
    // before we move to the next step, we check that they're all
    // complete, and empty out the promise list again.
    if(!Array.isArray(gd._promises)) gd._promises = [];

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

    var fullLayout = gd._fullLayout;

    var hasCartesian = fullLayout._has('cartesian');

    // Legacy polar plots
    if(!fullLayout._has('polar') && data && data[0] && data[0].r) {
        Lib.log('Legacy polar charts are deprecated!');
        return plotPolar(gd, data, layout);
    }

    // so we don't try to re-call Plotly.plot from inside
    // legend and colorbar, if margins changed
    fullLayout._replotting = true;

    // make or remake the framework if we need to
    if(graphWasEmpty) makePlotFramework(gd);

    // polar need a different framework
    if(gd.framework !== makePlotFramework) {
        gd.framework = makePlotFramework;
        makePlotFramework(gd);
    }

    // clear gradient defs on each .plot call, because we know we'll loop through all traces
    Drawing.initGradients(gd);

    // save initial show spikes once per graph
    if(graphWasEmpty) Axes.saveShowSpikeInitial(gd);

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

        if(!fullLayout._glcanvas && fullLayout._has('gl')) {
            fullLayout._glcanvas = fullLayout._glcontainer.selectAll('.gl-canvas').data([{
                key: 'contextLayer',
                context: true,
                pick: false
            }, {
                key: 'focusLayer',
                context: false,
                pick: false
            }, {
                key: 'pickLayer',
                context: false,
                pick: true
            }], function(d) { return d.key; });

            fullLayout._glcanvas.enter().append('canvas')
                .attr('class', function(d) {
                    return 'gl-canvas gl-canvas-' + d.key.replace('Layer', '');
                })
                .style({
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'width': '100%',
                    'height': '100%',
                    'overflow': 'visible',
                    'pointer-events': 'none'
                });
        }

        if(fullLayout._glcanvas) {
            fullLayout._glcanvas
                .attr('width', fullLayout.width)
                .attr('height', fullLayout.height);
        }

        return Plots.previousPromises(gd);
    }

    // draw anything that can affect margins.
    function marginPushers() {
        var calcdata = gd.calcdata;
        var i, cd, trace;

        Registry.getComponentMethod('legend', 'draw')(gd);
        Registry.getComponentMethod('rangeselector', 'draw')(gd);
        Registry.getComponentMethod('sliders', 'draw')(gd);
        Registry.getComponentMethod('updatemenus', 'draw')(gd);

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
        if(JSON.stringify(fullLayout._size) === oldmargins) return;

        return Lib.syncOrAsync([
            marginPushers,
            subroutines.layoutStyles
        ], gd);
    }

    function positionAndAutorange() {
        if(!recalc) {
            doAutoRangeAndConstraints();
            return;
        }

        var subplots = fullLayout._subplots.cartesian;
        var modules = fullLayout._modules;
        var setPositionsArray = [];

        // position and range calculations for traces that
        // depend on each other ie bars (stacked or grouped)
        // and boxes (grouped) push each other out of the way

        var subplotInfo, i, j;

        for(j = 0; j < modules.length; j++) {
            Lib.pushUnique(setPositionsArray, modules[j].setPositions);
        }

        if(setPositionsArray.length) {
            for(i = 0; i < subplots.length; i++) {
                subplotInfo = fullLayout._plots[subplots[i]];

                for(j = 0; j < setPositionsArray.length; j++) {
                    setPositionsArray[j](gd, subplotInfo);
                }
            }
        }

        // calc and autorange for errorbars
        Registry.getComponentMethod('errorbars', 'calc')(gd);

        // TODO: autosize extra for text markers and images
        // see https://github.com/plotly/plotly.js/issues/1111
        return Lib.syncOrAsync([
            Registry.getComponentMethod('shapes', 'calcAutorange'),
            Registry.getComponentMethod('annotations', 'calcAutorange'),
            doAutoRangeAndConstraints,
            Registry.getComponentMethod('rangeslider', 'calcAutorange')
        ], gd);
    }

    function doAutoRangeAndConstraints() {
        if(gd._transitioning) return;

        subroutines.doAutoRangeAndConstraints(gd);

        // store initial ranges *after* enforcing constraints, otherwise
        // we will never look like we're at the initial ranges
        if(graphWasEmpty) Axes.saveRangeInitial(gd);
    }

    // draw ticks, titles, and calculate axis scaling (._b, ._m)
    function drawAxes() {
        return Axes.doTicks(gd, graphWasEmpty ? '' : 'redraw');
    }

    var seq = [
        Plots.previousPromises,
        addFrames,
        drawFramework,
        marginPushers,
        marginPushersAgain
    ];
    if(hasCartesian) seq.push(positionAndAutorange);
    seq.push(subroutines.layoutStyles);
    if(hasCartesian) seq.push(drawAxes);
    seq.push(
        subroutines.drawData,
        subroutines.finalDraw,
        initInteractions,
        Plots.addLinks,
        Plots.rehover,
        Plots.previousPromises
    );

    // even if everything we did was synchronous, return a promise
    // so that the caller doesn't care which route we took
    var plotDone = Lib.syncOrAsync(seq, gd);
    if(!plotDone || !plotDone.then) plotDone = Promise.resolve();

    return plotDone.then(function() {
        gd.emit('plotly_afterplot');
        return gd;
    });
};

exports.setPlotConfig = function setPlotConfig(obj) {
    return Lib.extendFlat(defaultConfig, obj);
};

function setBackground(gd, bgColor) {
    try {
        gd._fullLayout._paper.style('background', bgColor);
    } catch(e) {
        Lib.error(e);
    }
}

function opaqueSetBackground(gd, bgColor) {
    var blend = Color.combine(bgColor, 'white');
    setBackground(gd, blend);
}

function setPlotContext(gd, config) {
    if(!gd._context) gd._context = Lib.extendDeep({}, defaultConfig);
    var context = gd._context;

    var i, keys, key;

    if(config) {
        keys = Object.keys(config);
        for(i = 0; i < keys.length; i++) {
            key = keys[i];
            if(key === 'editable' || key === 'edits') continue;
            if(key in context) {
                if(key === 'setBackground' && config[key] === 'opaque') {
                    context[key] = opaqueSetBackground;
                } else {
                    context[key] = config[key];
                }
            }
        }

        // map plot3dPixelRatio to plotGlPixelRatio for backward compatibility
        if(config.plot3dPixelRatio && !context.plotGlPixelRatio) {
            context.plotGlPixelRatio = context.plot3dPixelRatio;
        }

        // now deal with editable and edits - first editable overrides
        // everything, then edits refines
        var editable = config.editable;
        if(editable !== undefined) {
            // we're not going to *use* context.editable, we're only going to
            // use context.edits... but keep it for the record
            context.editable = editable;

            keys = Object.keys(context.edits);
            for(i = 0; i < keys.length; i++) {
                context.edits[keys[i]] = editable;
            }
        }
        if(config.edits) {
            keys = Object.keys(config.edits);
            for(i = 0; i < keys.length; i++) {
                key = keys[i];
                if(key in context.edits) {
                    context.edits[key] = config.edits[key];
                }
            }
        }
    }

    // staticPlot forces a bunch of others:
    if(context.staticPlot) {
        context.editable = false;
        context.edits = {};
        context.autosizable = false;
        context.scrollZoom = false;
        context.doubleClick = false;
        context.showTips = false;
        context.showLink = false;
        context.displayModeBar = false;
    }

    // make sure hover-only devices have mode bar visible
    if(context.displayModeBar === 'hover' && !hasHover) {
        context.displayModeBar = true;
    }

    // default and fallback for setBackground
    if(context.setBackground === 'transparent' || typeof context.setBackground !== 'function') {
        context.setBackground = setBackground;
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

    var titleLayout = function() {
        this.call(svgTextUtils.convertToTspans, gd);
        // TODO: html/mathjax
        // TODO: center title
    };

    var title = polarPlotSVG.select('.title-group text')
        .call(titleLayout);

    if(gd._context.edits.titleText) {
        var placeholderText = Lib._(gd, 'Click to enter Plot title');
        if(!txt || txt === placeholderText) {
            opacity = 0.2;
            // placeholder is not going through convertToTspans
            // so needs explicit data-unformatted
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
            this.call(svgTextUtils.makeEditable, {gd: gd})
                .on('edit', function(text) {
                    gd.framework({layout: {title: text}});
                    this.text(text)
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
exports.redraw = function(gd) {
    gd = Lib.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        throw new Error('This element is not a Plotly plot: ' + gd);
    }

    helpers.cleanData(gd.data, gd.data);
    helpers.cleanLayout(gd.layout);

    gd.calcdata = undefined;
    return exports.plot(gd).then(function() {
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
exports.newPlot = function(gd, data, layout, config) {
    gd = Lib.getGraphDiv(gd);

    // remove gl contexts
    Plots.cleanPlot([], {}, gd._fullData || [], gd._fullLayout || {}, gd.calcdata || []);

    Plots.purge(gd);
    return exports.plot(gd, data, layout, config);
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

            if(!Lib.isArrayOrTypedArray(insert)) {
                throw new Error('attribute: ' + key + ' index: ' + j + ' must be an array');
            }
            if(!Lib.isArrayOrTypedArray(target)) {
                throw new Error('cannot extend missing or non-array attribute: ' + key);
            }
            if(target.constructor !== insert.constructor) {
                throw new Error('cannot extend array with an array of a different type: ' + key);
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
 * @param {Function} updateArray
 * @return {Object}
 */
function spliceTraces(gd, update, indices, maxPoints, updateArray) {
    assertExtendTracesArgs(gd, update, indices, maxPoints);

    var updateProps = getExtendProperties(gd, update, indices, maxPoints);
    var undoUpdate = {};
    var undoPoints = {};

    for(var i = 0; i < updateProps.length; i++) {
        var prop = updateProps[i].prop;
        var maxp = updateProps[i].maxp;

        // return new array and remainder
        var out = updateArray(updateProps[i].target, updateProps[i].insert, maxp);
        prop.set(out[0]);

        // build the inverse update object for the undo operation
        if(!Array.isArray(undoUpdate[prop.astr])) undoUpdate[prop.astr] = [];
        undoUpdate[prop.astr].push(out[1]);

         // build the matching maxPoints undo object containing original trace lengths
        if(!Array.isArray(undoPoints[prop.astr])) undoPoints[prop.astr] = [];
        undoPoints[prop.astr].push(updateProps[i].target.length);
    }

    return {update: undoUpdate, maxPoints: undoPoints};
}

function concatTypedArray(arr0, arr1) {
    var arr2 = new arr0.constructor(arr0.length + arr1.length);
    arr2.set(arr0);
    arr2.set(arr1, arr0.length);
    return arr2;
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
exports.extendTraces = function extendTraces(gd, update, indices, maxPoints) {
    gd = Lib.getGraphDiv(gd);

    function updateArray(target, insert, maxp) {
        var newArray, remainder;

        if(Lib.isTypedArray(target)) {
            if(maxp < 0) {
                var none = new target.constructor(0);
                var both = concatTypedArray(target, insert);

                if(maxp < 0) {
                    newArray = both;
                    remainder = none;
                } else {
                    newArray = none;
                    remainder = both;
                }
            } else {
                newArray = new target.constructor(maxp);
                remainder = new target.constructor(target.length + insert.length - maxp);

                if(maxp === insert.length) {
                    newArray.set(insert);
                    remainder.set(target);
                } else if(maxp < insert.length) {
                    var numberOfItemsFromInsert = insert.length - maxp;

                    newArray.set(insert.subarray(numberOfItemsFromInsert));
                    remainder.set(target);
                    remainder.set(insert.subarray(0, numberOfItemsFromInsert), target.length);
                } else {
                    var numberOfItemsFromTarget = maxp - insert.length;
                    var targetBegin = target.length - numberOfItemsFromTarget;

                    newArray.set(target.subarray(targetBegin));
                    newArray.set(insert, numberOfItemsFromTarget);
                    remainder.set(target.subarray(0, targetBegin));
                }
            }
        } else {
            newArray = target.concat(insert);
            remainder = (maxp >= 0 && maxp < newArray.length) ?
                newArray.splice(0, newArray.length - maxp) :
                [];
        }

        return [newArray, remainder];
    }

    var undo = spliceTraces(gd, update, indices, maxPoints, updateArray);
    var promise = exports.redraw(gd);
    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    Queue.add(gd, exports.prependTraces, undoArgs, extendTraces, arguments);

    return promise;
};

exports.prependTraces = function prependTraces(gd, update, indices, maxPoints) {
    gd = Lib.getGraphDiv(gd);

    function updateArray(target, insert, maxp) {
        var newArray, remainder;

        if(Lib.isTypedArray(target)) {
            if(maxp <= 0) {
                var none = new target.constructor(0);
                var both = concatTypedArray(insert, target);

                if(maxp < 0) {
                    newArray = both;
                    remainder = none;
                } else {
                    newArray = none;
                    remainder = both;
                }
            } else {
                newArray = new target.constructor(maxp);
                remainder = new target.constructor(target.length + insert.length - maxp);

                if(maxp === insert.length) {
                    newArray.set(insert);
                    remainder.set(target);
                } else if(maxp < insert.length) {
                    var numberOfItemsFromInsert = insert.length - maxp;

                    newArray.set(insert.subarray(0, numberOfItemsFromInsert));
                    remainder.set(insert.subarray(numberOfItemsFromInsert));
                    remainder.set(target, numberOfItemsFromInsert);
                } else {
                    var numberOfItemsFromTarget = maxp - insert.length;

                    newArray.set(insert);
                    newArray.set(target.subarray(0, numberOfItemsFromTarget), insert.length);
                    remainder.set(target.subarray(numberOfItemsFromTarget));
                }
            }
        } else {
            newArray = insert.concat(target);
            remainder = (maxp >= 0 && maxp < newArray.length) ?
                newArray.splice(maxp, newArray.length) :
                [];
        }

        return [newArray, remainder];
    }

    var undo = spliceTraces(gd, update, indices, maxPoints, updateArray);
    var promise = exports.redraw(gd);
    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    Queue.add(gd, exports.extendTraces, undoArgs, prependTraces, arguments);

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
exports.addTraces = function addTraces(gd, traces, newIndices) {
    gd = Lib.getGraphDiv(gd);

    var currentIndices = [],
        undoFunc = exports.deleteTraces,
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
        promise = exports.redraw(gd);
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
    promise = exports.moveTraces(gd, currentIndices, newIndices);
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
exports.deleteTraces = function deleteTraces(gd, indices) {
    gd = Lib.getGraphDiv(gd);

    var traces = [],
        undoFunc = exports.addTraces,
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

    var promise = exports.redraw(gd);
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
exports.moveTraces = function moveTraces(gd, currentIndices, newIndices) {
    gd = Lib.getGraphDiv(gd);

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

    var promise = exports.redraw(gd);
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
exports.restyle = function restyle(gd, astr, val, _traces) {
    gd = Lib.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    var aobj = {};
    if(typeof astr === 'string') aobj[astr] = val;
    else if(Lib.isPlainObject(astr)) {
        // the 3-arg form
        aobj = Lib.extendFlat({}, astr);
        if(_traces === undefined) _traces = val;
    }
    else {
        Lib.warn('Restyle fail.', astr, val, _traces);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    var traces = helpers.coerceTraceIndices(gd, _traces);

    var specs = _restyle(gd, aobj, traces);
    var flags = specs.flags;

    // clear calcdata and/or axis types if required so they get regenerated
    if(flags.clearCalc) gd.calcdata = undefined;
    if(flags.clearAxisTypes) helpers.clearAxisTypes(gd, traces, {});

    // fill in redraw sequence
    var seq = [];

    if(flags.fullReplot) {
        seq.push(exports.plot);
    } else {
        seq.push(Plots.previousPromises);

        Plots.supplyDefaults(gd);

        if(flags.style) seq.push(subroutines.doTraceStyle);
        if(flags.colorbars) seq.push(subroutines.doColorBars);
    }

    seq.push(Plots.rehover);

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

// for undo: undefined initial vals must be turned into nulls
// so that we unset rather than ignore them
function undefinedToNull(val) {
    if(val === undefined) return null;
    return val;
}

function _restyle(gd, aobj, traces) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData,
        data = gd.data,
        i;

    // initialize flags
    var flags = editTypes.traceFlags();

    // copies of the change (and previous values of anything affected)
    // for the undo / redo queue
    var redoit = {},
        undoit = {},
        axlist;

    // make a new empty vals array for undoit
    function a0() { return traces.map(function() { return undefined; }); }

    // for autoranging multiple axes
    function addToAxlist(axid) {
        var axName = Axes.id2name(axid);
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
        if(attr in aobj || helpers.hasParent(aobj, attr)) return;

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
            undoit[attr][i] = undefinedToNull(extraparam.get());
        }
        if(val !== undefined) {
            extraparam.set(val);
        }
    }

    // now make the changes to gd.data (and occasionally gd.layout)
    // and figure out what kind of graphics update we need to do
    for(var ai in aobj) {
        if(helpers.hasParent(aobj, ai)) {
            throw new Error('cannot set ' + ai + 'and a parent attribute simultaneously');
        }

        var vi = aobj[ai],
            cont,
            contFull,
            param,
            oldVal,
            newVal,
            valObject;

        redoit[ai] = vi;

        if(ai.substr(0, 6) === 'LAYOUT') {
            param = Lib.nestedProperty(gd.layout, ai.replace('LAYOUT', ''));
            undoit[ai] = [undefinedToNull(param.get())];
            // since we're allowing val to be an array, allow it here too,
            // even though that's meaningless
            param.set(Array.isArray(vi) ? vi[0] : vi);
            // ironically, the layout attrs in restyle only require replot,
            // not relayout
            flags.calc = true;
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

            valObject = PlotSchema.getTraceValObject(contFull, param.parts);

            if(valObject && valObject.impliedEdits && newVal !== null) {
                for(var impliedKey in valObject.impliedEdits) {
                    doextra(Lib.relativeAttr(ai, impliedKey), valObject.impliedEdits[impliedKey], i);
                }
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
                }
            }

            undoit[ai][i] = undefinedToNull(oldVal);
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
                    // obnoxious that we need this level of coupling... but in order to
                    // properly handle setting orientation to `null` we need to mimic
                    // the logic inside Bars.supplyDefaults for default orientation
                    var defaultOrientation = (cont.x && !cont.y) ? 'h' : 'v';
                    if((param.get() || defaultOrientation) === contFull.orientation) {
                        continue;
                    }
                }
                // orientationaxes has no value,
                // it flips everything and the axes
                else if(ai === 'orientationaxes') {
                    cont.orientation =
                        {v: 'h', h: 'v'}[contFull.orientation];
                }
                helpers.swapXYData(cont);
                flags.calc = flags.clearAxisTypes = true;
            }
            else if(Plots.dataArrayContainers.indexOf(param.parts[0]) !== -1) {
                // TODO: use manageArrays.applyContainerArrayChanges here too
                helpers.manageArrayContainers(param, newVal, undoit);
                flags.calc = true;
            }
            else {
                if(valObject) {
                    // must redo calcdata when restyling array values of arrayOk attributes
                    if(valObject.arrayOk && (
                        Lib.isArrayOrTypedArray(newVal) || Lib.isArrayOrTypedArray(oldVal))
                    ) {
                        flags.calc = true;
                    }
                    else editTypes.update(flags, valObject);
                }
                else {
                    /*
                     * if we couldn't find valObject,  assume a full recalc.
                     * This can happen if you're changing type and making
                     * some other edits too, so the modules we're
                     * looking at don't have these attributes in them.
                     */
                    flags.calc = true;
                }

                // all the other ones, just modify that one attribute
                param.set(newVal);
            }
        }

        // swap the data attributes of the relevant x and y axes?
        if(['swapxyaxes', 'orientationaxes'].indexOf(ai) !== -1) {
            Axes.swap(gd, traces);
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
    }

    // do we need to force a recalc?
    var autorangeOn = false;
    var axList = Axes.list(gd);
    for(i = 0; i < axList.length; i++) {
        if(axList[i].autorange) {
            autorangeOn = true;
            break;
        }
    }

    // combine a few flags together;
    if(flags.calc || (flags.calcIfAutorange && autorangeOn)) {
        flags.clearCalc = true;
    }
    if(flags.calc || flags.plot || flags.calcIfAutorange) {
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
exports.relayout = function relayout(gd, astr, val) {
    gd = Lib.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    if(gd.framework && gd.framework.isPolar) {
        return Promise.resolve(gd);
    }

    var aobj = {};
    if(typeof astr === 'string') {
        aobj[astr] = val;
    } else if(Lib.isPlainObject(astr)) {
        aobj = Lib.extendFlat({}, astr);
    } else {
        Lib.warn('Relayout fail.', astr, val);
        return Promise.reject();
    }

    if(Object.keys(aobj).length) gd.changed = true;

    var specs = _relayout(gd, aobj);
    var flags = specs.flags;

    // clear calcdata if required
    if(flags.calc) gd.calcdata = undefined;
    if(flags.margins) helpers.clearAxisAutomargins(gd);

    // fill in redraw sequence

    // even if we don't have anything left in aobj,
    // something may have happened within relayout that we
    // need to wait for
    var seq = [Plots.previousPromises];

    if(flags.layoutReplot) {
        seq.push(subroutines.layoutReplot);
    }
    else if(Object.keys(aobj).length) {
        Plots.supplyDefaults(gd);

        if(flags.legend) seq.push(subroutines.doLegend);
        if(flags.layoutstyle) seq.push(subroutines.layoutStyles);

        if(flags.axrange) {
            // N.B. leave as sequence of subroutines (for now) instead of
            // subroutine of its own so that finalDraw always gets
            // executed after drawData
            seq.push(
                function(gd) {
                    return subroutines.doTicksRelayout(gd, specs.rangesAltered);
                },
                subroutines.drawData,
                subroutines.finalDraw
            );
        }

        if(flags.ticks) seq.push(subroutines.doTicksRelayout);
        if(flags.modebar) seq.push(subroutines.doModeBar);
        if(flags.camera) seq.push(subroutines.doCamera);
    }

    seq.push(Plots.rehover);

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

var AX_RANGE_RE = /^[xyz]axis[0-9]*\.range(\[[0|1]\])?$/;
var AX_AUTORANGE_RE = /^[xyz]axis[0-9]*\.autorange$/;
var AX_DOMAIN_RE = /^[xyz]axis[0-9]*\.domain(\[[0|1]\])?$/;

function _relayout(gd, aobj) {
    var layout = gd.layout,
        fullLayout = gd._fullLayout,
        keys = Object.keys(aobj),
        axes = Axes.list(gd),
        arrayEdits = {},
        arrayStr,
        i,
        j;

    // look for 'allaxes', split out into all axes
    // in case of 3D the axis are nested within a scene which is held in _id
    for(i = 0; i < keys.length; i++) {
        if(keys[i].indexOf('allaxes') === 0) {
            for(j = 0; j < axes.length; j++) {
                var scene = axes[j]._id.substr(1),
                    axisAttr = (scene.indexOf('scene') !== -1) ? (scene + '.') : '',
                    newkey = keys[i].replace('allaxes', axisAttr + axes[j]._name);

                if(!aobj[newkey]) aobj[newkey] = aobj[keys[i]];
            }

            delete aobj[keys[i]];
        }
    }

    // initialize flags
    var flags = editTypes.layoutFlags();

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

        // if we have another value for this attribute (explicitly or
        // via a parent) do not override with this auto-generated extra
        if(attr in aobj || helpers.hasParent(aobj, attr)) return;

        var p = Lib.nestedProperty(layout, attr);
        if(!(attr in undoit)) {
            undoit[attr] = undefinedToNull(p.get());
        }
        if(val !== undefined) p.set(val);
    }

    // for constraint enforcement: keep track of all axes (as {id: name})
    // we're editing the (auto)range of, so we can tell the others constrained
    // to scale with them that it's OK for them to shrink
    var rangesAltered = {};
    var axId;

    function recordAlteredAxis(pleafPlus) {
        var axId = Axes.name2id(pleafPlus.split('.')[0]);
        rangesAltered[axId] = 1;
        return axId;
    }

    // alter gd.layout
    for(var ai in aobj) {
        if(helpers.hasParent(aobj, ai)) {
            throw new Error('cannot set ' + ai + 'and a parent attribute simultaneously');
        }

        var p = Lib.nestedProperty(layout, ai);
        var vi = aobj[ai];
        var plen = p.parts.length;
        // p.parts may end with an index integer if the property is an array
        var pend = plen - 1;
        while(pend > 0 && typeof p.parts[pend] !== 'string') pend--;
        // last property in chain (leaf node)
        var pleaf = p.parts[pend];
        // leaf plus immediate parent
        var pleafPlus = p.parts[pend - 1] + '.' + pleaf;
        // trunk nodes (everything except the leaf)
        var ptrunk = p.parts.slice(0, pend).join('.');
        var parentIn = Lib.nestedProperty(gd.layout, ptrunk).get();
        var parentFull = Lib.nestedProperty(fullLayout, ptrunk).get();
        var vOld = p.get();

        if(vi === undefined) continue;

        redoit[ai] = vi;

        // axis reverse is special - it is its own inverse
        // op and has no flag.
        undoit[ai] = (pleaf === 'reverse') ? vi : undefinedToNull(vOld);

        var valObject = PlotSchema.getLayoutValObject(fullLayout, p.parts);

        if(valObject && valObject.impliedEdits && vi !== null) {
            for(var impliedKey in valObject.impliedEdits) {
                doextra(Lib.relativeAttr(ai, impliedKey), valObject.impliedEdits[impliedKey]);
            }
        }

        // Setting width or height to null must reset the graph's width / height
        // back to its initial value as computed during the first pass in Plots.plotAutoSize.
        //
        // To do so, we must manually set them back here using the _initialAutoSize cache.
        if(['width', 'height'].indexOf(ai) !== -1 && vi === null) {
            fullLayout[ai] = gd._initialAutoSize[ai];
        }
        // check autorange vs range
        else if(pleafPlus.match(AX_RANGE_RE)) {
            recordAlteredAxis(pleafPlus);
            Lib.nestedProperty(fullLayout, ptrunk + '._inputRange').set(null);
        }
        else if(pleafPlus.match(AX_AUTORANGE_RE)) {
            recordAlteredAxis(pleafPlus);
            Lib.nestedProperty(fullLayout, ptrunk + '._inputRange').set(null);
            var axFull = Lib.nestedProperty(fullLayout, ptrunk).get();
            if(axFull._inputDomain) {
                // if we're autoranging and this axis has a constrained domain,
                // reset it so we don't get locked into a shrunken size
                axFull._input.domain = axFull._inputDomain.slice();
            }
        }
        else if(pleafPlus.match(AX_DOMAIN_RE)) {
            Lib.nestedProperty(fullLayout, ptrunk + '._inputDomain').set(null);
        }

        // toggling axis type between log and linear: we need to convert
        // positions for components that are still using linearized values,
        // not data values like newer components.
        // previously we did this for log <-> not-log, but now only do it
        // for log <-> linear
        if(pleaf === 'type') {
            var ax = parentIn,
                toLog = parentFull.type === 'linear' && vi === 'log',
                fromLog = parentFull.type === 'log' && vi === 'linear';

            if(toLog || fromLog) {
                if(!ax || !ax.range) {
                    // 2D never gets here, but 3D does
                    // I don't think this is needed, but left here in case there
                    // are edge cases I'm not thinking of.
                    doextra(ptrunk + '.autorange', true);
                }
                else if(!parentFull.autorange) {
                    // toggling log without autorange: need to also recalculate ranges
                    // because log axes use linearized values for range endpoints
                    var r0 = ax.range[0],
                        r1 = ax.range[1];
                    if(toLog) {
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
                else if(toLog) {
                    // just make sure the range is positive and in the right
                    // order, it'll get recalculated later
                    ax.range = (ax.range[1] > ax.range[0]) ? [1, 2] : [2, 1];
                }

                // clear polar view initial stash for radial range so that
                // value get recomputed in correct units
                if(Array.isArray(fullLayout._subplots.polar) &&
                    fullLayout._subplots.polar.length &&
                    fullLayout[p.parts[0]] &&
                    p.parts[1] === 'radialaxis'
                ) {
                    delete fullLayout[p.parts[0]]._subplot.viewInitial['radialaxis.range'];
                }

                // Annotations and images also need to convert to/from linearized coords
                // Shapes do not need this :)
                Registry.getComponentMethod('annotations', 'convertCoords')(gd, parentFull, vi, doextra);
                Registry.getComponentMethod('images', 'convertCoords')(gd, parentFull, vi, doextra);
            }
            else {
                // any other type changes: the range from the previous type
                // will not make sense, so autorange it.
                doextra(ptrunk + '.autorange', true);
                doextra(ptrunk + '.range', null);
            }
            Lib.nestedProperty(fullLayout, ptrunk + '._inputRange').set(null);
        }
        else if(pleaf.match(AX_NAME_PATTERN)) {
            var fullProp = Lib.nestedProperty(fullLayout, ai).get(),
                newType = (vi || {}).type;

            // This can potentially cause strange behavior if the autotype is not
            // numeric (linear, because we don't auto-log) but the previous type
            // was log. That's a very strange edge case though
            if(!newType || newType === '-') newType = 'linear';
            Registry.getComponentMethod('annotations', 'convertCoords')(gd, fullProp, newType, doextra);
            Registry.getComponentMethod('images', 'convertCoords')(gd, fullProp, newType, doextra);
        }

        // alter gd.layout

        // collect array component edits for execution all together
        // so we can ensure consistent behavior adding/removing items
        // and order-independence for add/remove/edit all together in
        // one relayout call
        var containerArrayMatch = manageArrays.containerArrayMatch(ai);
        if(containerArrayMatch) {
            arrayStr = containerArrayMatch.array;
            i = containerArrayMatch.index;
            var propStr = containerArrayMatch.property;
            var componentArray = Lib.nestedProperty(layout, arrayStr);
            var obji = (componentArray || [])[i] || {};
            var objToAutorange = obji;

            var updateValObject = valObject || {editType: 'calc'};
            var checkForAutorange = updateValObject.editType.indexOf('calcIfAutorange') !== -1;

            if(i === '') {
                // replacing the entire array - too many possibilities, just recalc
                if(checkForAutorange) flags.calc = true;
                else editTypes.update(flags, updateValObject);
                checkForAutorange = false; // clear this, we're already doing a recalc
            }
            else if(propStr === '') {
                // special handling of undoit if we're adding or removing an element
                // ie 'annotations[2]' which can be {...} (add) or null (remove)
                objToAutorange = vi;
                if(manageArrays.isAddVal(vi)) {
                    undoit[ai] = null;
                }
                else if(manageArrays.isRemoveVal(vi)) {
                    undoit[ai] = obji;
                    objToAutorange = obji;
                }
                else Lib.warn('unrecognized full object value', aobj);
            }

            if(checkForAutorange && (refAutorange(gd, objToAutorange, 'x') || refAutorange(gd, objToAutorange, 'y'))) {
                flags.calc = true;
            }
            else {
                editTypes.update(flags, updateValObject);
            }

            // prepare the edits object we'll send to applyContainerArrayChanges
            if(!arrayEdits[arrayStr]) arrayEdits[arrayStr] = {};
            var objEdits = arrayEdits[arrayStr][i];
            if(!objEdits) objEdits = arrayEdits[arrayStr][i] = {};
            objEdits[propStr] = vi;

            delete aobj[ai];
        }
        // handle axis reversal explicitly, as there's no 'reverse' attribute
        else if(pleaf === 'reverse') {
            if(parentIn.range) parentIn.range.reverse();
            else {
                doextra(ptrunk + '.autorange', true);
                parentIn.range = [1, 0];
            }

            if(parentFull.autorange) flags.calc = true;
            else flags.plot = true;
        }
        else {
            if((fullLayout._has('scatter-like') && fullLayout._has('regl')) &&
                (ai === 'dragmode' &&
                (vi === 'lasso' || vi === 'select') &&
                !(vOld === 'lasso' || vOld === 'select'))
            ) {
                flags.plot = true;
            }
            else if(valObject) editTypes.update(flags, valObject);
            else flags.calc = true;

            p.set(vi);
        }
    }

    // now we've collected component edits - execute them all together
    for(arrayStr in arrayEdits) {
        var finished = manageArrays.applyContainerArrayChanges(gd,
            Lib.nestedProperty(layout, arrayStr), arrayEdits[arrayStr], flags);
        if(!finished) flags.plot = true;
    }

    // figure out if we need to recalculate axis constraints
    var constraints = fullLayout._axisConstraintGroups || [];
    for(axId in rangesAltered) {
        for(i = 0; i < constraints.length; i++) {
            var group = constraints[i];
            if(group[axId]) {
                // Always recalc if we're changing constrained ranges.
                // Otherwise it's possible to violate the constraints by
                // specifying arbitrary ranges for all axes in the group.
                // this way some ranges may expand beyond what's specified,
                // as they do at first draw, to satisfy the constraints.
                flags.calc = true;
                for(var groupAxId in group) {
                    if(!rangesAltered[groupAxId]) {
                        Axes.getFromId(gd, groupAxId)._constraintShrinkable = true;
                    }
                }
            }
        }
    }

    // If the autosize changed or height or width was explicitly specified,
    // this triggers a redraw
    // TODO: do we really need special aobj.height/width handling here?
    // couldn't editType do this?
    if(updateAutosize(gd) || aobj.height || aobj.width) flags.plot = true;

    if(flags.plot || flags.calc) {
        flags.layoutReplot = true;
    }

    // now all attribute mods are done, as are
    // redo and undo so we can save them

    return {
        flags: flags,
        rangesAltered: rangesAltered,
        undoit: undoit,
        redoit: redoit,
        eventData: Lib.extendDeep({}, redoit)
    };
}

/*
 * updateAutosize: we made a change, does it change the autosize result?
 * puts the new size into fullLayout
 * returns true if either height or width changed
 */
function updateAutosize(gd) {
    var fullLayout = gd._fullLayout;
    var oldWidth = fullLayout.width;
    var oldHeight = fullLayout.height;

    // calculate autosizing
    if(gd.layout.autosize) Plots.plotAutoSize(gd, gd.layout, fullLayout);

    return (fullLayout.width !== oldWidth) || (fullLayout.height !== oldHeight);
}

// for editing annotations or shapes - is it on autoscaled axes?
function refAutorange(gd, obj, axLetter) {
    if(!Lib.isPlainObject(obj)) return false;
    var axRef = obj[axLetter + 'ref'] || axLetter,
        ax = Axes.getFromId(gd, axRef);

    if(!ax && axRef.charAt(0) === axLetter) {
        // fall back on the primary axis in case we've referenced a
        // nonexistent axis (as we do above if axRef is missing).
        // This assumes the object defaults to data referenced, which
        // is the case for shapes and annotations but not for images.
        // The only thing this is used for is to determine whether to
        // do a full `recalc`, so the only ill effect of this error is
        // to waste some time.
        ax = Axes.getFromId(gd, axLetter);
    }
    return (ax || {}).autorange;
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
exports.update = function update(gd, traceUpdate, layoutUpdate, _traces) {
    gd = Lib.getGraphDiv(gd);
    helpers.clearPromiseQueue(gd);

    if(gd.framework && gd.framework.isPolar) {
        return Promise.resolve(gd);
    }

    if(!Lib.isPlainObject(traceUpdate)) traceUpdate = {};
    if(!Lib.isPlainObject(layoutUpdate)) layoutUpdate = {};

    if(Object.keys(traceUpdate).length) gd.changed = true;
    if(Object.keys(layoutUpdate).length) gd.changed = true;

    var traces = helpers.coerceTraceIndices(gd, _traces);

    var restyleSpecs = _restyle(gd, Lib.extendFlat({}, traceUpdate), traces);
    var restyleFlags = restyleSpecs.flags;

    var relayoutSpecs = _relayout(gd, Lib.extendFlat({}, layoutUpdate));
    var relayoutFlags = relayoutSpecs.flags;

    // clear calcdata and/or axis types if required
    if(restyleFlags.clearCalc || relayoutFlags.calc) gd.calcdata = undefined;
    if(restyleFlags.clearAxisTypes) helpers.clearAxisTypes(gd, traces, layoutUpdate);
    if(relayoutFlags.margins) helpers.clearAxisAutomargins(gd);

    // fill in redraw sequence
    var seq = [];

    if(restyleFlags.fullReplot && relayoutFlags.layoutReplot) {
        var data = gd.data,
            layout = gd.layout;

        // clear existing data/layout on gd
        // so that Plotly.plot doesn't try to extend them
        gd.data = undefined;
        gd.layout = undefined;

        seq.push(function() { return exports.plot(gd, data, layout); });
    }
    else if(restyleFlags.fullReplot) {
        seq.push(exports.plot);
    }
    else if(relayoutFlags.layoutReplot) {
        seq.push(subroutines.layoutReplot);
    }
    else {
        seq.push(Plots.previousPromises);
        Plots.supplyDefaults(gd);

        if(restyleFlags.style) seq.push(subroutines.doTraceStyle);
        if(restyleFlags.colorbars) seq.push(subroutines.doColorBars);
        if(relayoutFlags.legend) seq.push(subroutines.doLegend);
        if(relayoutFlags.layoutstyle) seq.push(subroutines.layoutStyles);
        if(relayoutFlags.axrange) {
            seq.push(
                function(gd) {
                    return subroutines.doTicksRelayout(gd, relayoutSpecs.rangesAltered);
                },
                subroutines.drawData,
                subroutines.finalDraw
            );
        }
        if(relayoutFlags.ticks) seq.push(subroutines.doTicksRelayout);
        if(relayoutFlags.modebar) seq.push(subroutines.doModeBar);
        if(relayoutFlags.camera) seq.push(subroutines.doCamera);
    }

    seq.push(Plots.rehover);

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
 * Plotly.react:
 * A plot/update method that takes the full plot state (same API as plot/newPlot)
 * and diffs to determine the minimal update pathway
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
 * OR
 *
 * @param {string id or DOM element} gd
 *      the id or DOM element of the graph container div
 * @param {object} figure
 *      object containing `data`, `layout`, `config`, and `frames` members
 *
 */
exports.react = function(gd, data, layout, config) {
    var frames, plotDone;

    function addFrames() { return exports.addFrames(gd, frames); }

    gd = Lib.getGraphDiv(gd);

    var oldFullData = gd._fullData;
    var oldFullLayout = gd._fullLayout;

    // you can use this as the initial draw as well as to update
    if(!Lib.isPlotDiv(gd) || !oldFullData || !oldFullLayout) {
        plotDone = exports.newPlot(gd, data, layout, config);
    }
    else {

        if(Lib.isPlainObject(data)) {
            var obj = data;
            data = obj.data;
            layout = obj.layout;
            config = obj.config;
            frames = obj.frames;
        }

        var configChanged = false;
        // assume that if there's a config at all, we're reacting to it too,
        // and completely replace the previous config
        if(config) {
            var oldConfig = Lib.extendDeep({}, gd._context);
            gd._context = undefined;
            setPlotContext(gd, config);
            configChanged = diffConfig(oldConfig, gd._context);
        }

        gd.data = data || [];
        helpers.cleanData(gd.data, []);
        gd.layout = layout || {};
        helpers.cleanLayout(gd.layout);

        // "true" skips updating calcdata and remapping arrays from calcTransforms,
        // which supplyDefaults usually does at the end, but we may need to NOT do
        // if the diff (which we haven't determined yet) says we'll recalc
        Plots.supplyDefaults(gd, {skipUpdateCalc: true});

        var newFullData = gd._fullData;
        var newFullLayout = gd._fullLayout;
        var immutable = newFullLayout.datarevision === undefined;

        var restyleFlags = diffData(gd, oldFullData, newFullData, immutable);
        var relayoutFlags = diffLayout(gd, oldFullLayout, newFullLayout, immutable);

        // TODO: how to translate this part of relayout to Plotly.react?
        // // Setting width or height to null must reset the graph's width / height
        // // back to its initial value as computed during the first pass in Plots.plotAutoSize.
        // //
        // // To do so, we must manually set them back here using the _initialAutoSize cache.
        // if(['width', 'height'].indexOf(ai) !== -1 && vi === null) {
        //     fullLayout[ai] = gd._initialAutoSize[ai];
        // }

        if(updateAutosize(gd)) relayoutFlags.layoutReplot = true;

        // clear calcdata if required
        if(restyleFlags.calc || relayoutFlags.calc) gd.calcdata = undefined;
        // otherwise do the calcdata updates and calcTransform array remaps that we skipped earlier
        else Plots.supplyDefaultsUpdateCalc(gd.calcdata, newFullData);

        if(relayoutFlags.margins) helpers.clearAxisAutomargins(gd);

        // Note: what restyle/relayout use impliedEdits and clearAxisTypes for
        // must be handled by the user when using Plotly.react.

        // fill in redraw sequence
        var seq = [];

        if(frames) {
            gd._transitionData = {};
            Plots.createTransitionData(gd);
            seq.push(addFrames);
        }

        if(restyleFlags.fullReplot || relayoutFlags.layoutReplot || configChanged) {
            gd._fullLayout._skipDefaults = true;
            seq.push(exports.plot);
        }
        else {
            for(var componentType in relayoutFlags.arrays) {
                var indices = relayoutFlags.arrays[componentType];
                if(indices.length) {
                    var drawOne = Registry.getComponentMethod(componentType, 'drawOne');
                    if(drawOne !== Lib.noop) {
                        for(var i = 0; i < indices.length; i++) {
                            drawOne(gd, indices[i]);
                        }
                    }
                    else {
                        var draw = Registry.getComponentMethod(componentType, 'draw');
                        if(draw === Lib.noop) {
                            throw new Error('cannot draw components: ' + componentType);
                        }
                        draw(gd);
                    }
                }
            }

            seq.push(Plots.previousPromises);
            if(restyleFlags.style) seq.push(subroutines.doTraceStyle);
            if(restyleFlags.colorbars) seq.push(subroutines.doColorBars);
            if(relayoutFlags.legend) seq.push(subroutines.doLegend);
            if(relayoutFlags.layoutstyle) seq.push(subroutines.layoutStyles);
            if(relayoutFlags.axrange) {
                seq.push(
                    subroutines.doTicksRelayout,
                    subroutines.drawData,
                    subroutines.finalDraw
                );
            }
            if(relayoutFlags.ticks) seq.push(subroutines.doTicksRelayout);
            if(relayoutFlags.modebar) seq.push(subroutines.doModeBar);
            if(relayoutFlags.camera) seq.push(subroutines.doCamera);
        }

        seq.push(Plots.rehover);

        plotDone = Lib.syncOrAsync(seq, gd);
        if(!plotDone || !plotDone.then) plotDone = Promise.resolve(gd);
    }

    return plotDone.then(function() {
        gd.emit('plotly_react', {
            data: data,
            layout: layout
        });

        return gd;
    });

};

function diffData(gd, oldFullData, newFullData, immutable) {
    if(oldFullData.length !== newFullData.length) {
        return {
            fullReplot: true,
            calc: true
        };
    }

    var flags = editTypes.traceFlags();
    flags.arrays = {};
    var i, trace;

    function getTraceValObject(parts) {
        return PlotSchema.getTraceValObject(trace, parts);
    }

    var diffOpts = {
        getValObject: getTraceValObject,
        flags: flags,
        immutable: immutable,
        gd: gd
    };


    var seenUIDs = {};

    for(i = 0; i < oldFullData.length; i++) {
        trace = newFullData[i]._fullInput;
        if(seenUIDs[trace.uid]) continue;
        seenUIDs[trace.uid] = 1;

        diffOpts.autoranged = trace.xaxis ? (
            Axes.getFromId(gd, trace.xaxis).autorange ||
            Axes.getFromId(gd, trace.yaxis).autorange
        ) : false;
        getDiffFlags(oldFullData[i]._fullInput, trace, [], diffOpts);
    }

    if(flags.calc || flags.plot || flags.calcIfAutorange) {
        flags.fullReplot = true;
    }

    return flags;
}

function diffLayout(gd, oldFullLayout, newFullLayout, immutable) {
    var flags = editTypes.layoutFlags();
    flags.arrays = {};

    function getLayoutValObject(parts) {
        return PlotSchema.getLayoutValObject(newFullLayout, parts);
    }

    var diffOpts = {
        getValObject: getLayoutValObject,
        flags: flags,
        immutable: immutable,
        gd: gd
    };

    getDiffFlags(oldFullLayout, newFullLayout, [], diffOpts);

    if(flags.plot || flags.calc) {
        flags.layoutReplot = true;
    }

    return flags;
}

function getDiffFlags(oldContainer, newContainer, outerparts, opts) {
    var valObject, key;

    var getValObject = opts.getValObject;
    var flags = opts.flags;
    var immutable = opts.immutable;
    var inArray = opts.inArray;
    var arrayIndex = opts.arrayIndex;
    var gd = opts.gd;
    var autoranged = opts.autoranged;

    function changed() {
        var editType = valObject.editType;
        if(editType.indexOf('calcIfAutorange') !== -1 && (autoranged || (autoranged === undefined && (
            refAutorange(gd, newContainer, 'x') || refAutorange(gd, newContainer, 'y')
        )))) {
            flags.calc = true;
            return;
        }
        if(inArray && editType.indexOf('arraydraw') !== -1) {
            Lib.pushUnique(flags.arrays[inArray], arrayIndex);
            return;
        }
        editTypes.update(flags, valObject);
    }

    function valObjectCanBeDataArray(valObject) {
        return valObject.valType === 'data_array' || valObject.arrayOk;
    }

    for(key in oldContainer) {
        // short-circuit based on previous calls or previous keys that already maximized the pathway
        if(flags.calc) return;

        var oldVal = oldContainer[key];
        var newVal = newContainer[key];

        if(key.charAt(0) === '_' || typeof oldVal === 'function' || oldVal === newVal) continue;

        // FIXME: ax.tick0 and dtick get filled in during plotting, and unlike other auto values
        // they don't make it back into the input, so newContainer won't have them.
        // similar for axis ranges for 3D
        // contourcarpet doesn't HAVE zmin/zmax, they're just auto-added. It needs them.
        if(key === 'tick0' || key === 'dtick') {
            var tickMode = newContainer.tickmode;
            if(tickMode === 'auto' || tickMode === 'array' || !tickMode) continue;
        }
        if(key === 'range' && newContainer.autorange) continue;
        if((key === 'zmin' || key === 'zmax') && newContainer.type === 'contourcarpet') continue;

        var parts = outerparts.concat(key);
        valObject = getValObject(parts);

        // in case type changed, we may not even *have* a valObject.
        if(!valObject) continue;

        if(valObject._compareAsJSON && JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

        var valType = valObject.valType;
        var i;

        var canBeDataArray = valObjectCanBeDataArray(valObject);
        var wasArray = Array.isArray(oldVal);
        var nowArray = Array.isArray(newVal);

        // hack for traces that modify the data in supplyDefaults, like
        // converting 1D to 2D arrays, which will always create new objects
        if(wasArray && nowArray) {
            var inputKey = '_input_' + key;
            var oldValIn = oldContainer[inputKey];
            var newValIn = newContainer[inputKey];
            if(Array.isArray(oldValIn) && oldValIn === newValIn) continue;
        }

        if(newVal === undefined) {
            if(canBeDataArray && wasArray) flags.calc = true;
            else changed();
        }
        else if(valObject._isLinkedToArray) {
            var arrayEditIndices = [];
            var extraIndices = false;
            if(!inArray) flags.arrays[key] = arrayEditIndices;

            var minLen = Math.min(oldVal.length, newVal.length);
            var maxLen = Math.max(oldVal.length, newVal.length);
            if(minLen !== maxLen) {
                if(valObject.editType === 'arraydraw') {
                    extraIndices = true;
                }
                else {
                    changed();
                    continue;
                }
            }

            for(i = 0; i < minLen; i++) {
                getDiffFlags(oldVal[i], newVal[i], parts.concat(i),
                    // add array indices, but not if we're already in an array
                    Lib.extendFlat({inArray: key, arrayIndex: i}, opts));
            }

            // put this at the end so that we know our collected array indices are sorted
            // but the check for length changes happens up front so we can short-circuit
            // diffing if appropriate
            if(extraIndices) {
                for(i = minLen; i < maxLen; i++) {
                    arrayEditIndices.push(i);
                }
            }
        }
        else if(!valType && Lib.isPlainObject(oldVal)) {
            getDiffFlags(oldVal, newVal, parts, opts);
        }
        else if(canBeDataArray) {
            if(wasArray && nowArray) {

                // don't try to diff two data arrays. If immutable we know the data changed,
                // if not, assume it didn't and let `layout.datarevision` tell us if it did
                if(immutable) {
                    flags.calc = true;
                }
            }
            else if(wasArray !== nowArray) {
                flags.calc = true;
            }
            else changed();
        }
        else if(wasArray && nowArray) {
            // info array, colorscale, 'any' - these are short, just stringify.
            // I don't *think* that covers up any real differences post-validation, does it?
            // otherwise we need to dive in 1 (info_array) or 2 (colorscale) levels and compare
            // all elements.
            if(oldVal.length !== newVal.length || String(oldVal) !== String(newVal)) {
                changed();
            }
        }
        else {
            changed();
        }
    }

    for(key in newContainer) {
        if(!(key in oldContainer || key.charAt(0) === '_' || typeof newContainer[key] === 'function')) {
            valObject = getValObject(outerparts.concat(key));

            if(valObjectCanBeDataArray(valObject) && Array.isArray(newContainer[key])) {
                flags.calc = true;
                return;
            }
            else changed();
        }
    }
}

/*
 * simple diff for config - for now, just treat all changes as equivalent
 */
function diffConfig(oldConfig, newConfig) {
    var key;

    for(key in oldConfig) {
        var oldVal = oldConfig[key];
        var newVal = newConfig[key];
        if(oldVal !== newVal) {
            if(Lib.isPlainObject(oldVal) && Lib.isPlainObject(newVal)) {
                if(diffConfig(oldVal, newVal)) {
                    return true;
                }
            }
            else if(Array.isArray(oldVal) && Array.isArray(newVal)) {
                if(oldVal.length !== newVal.length) {
                    return true;
                }
                for(var i = 0; i < oldVal.length; i++) {
                    if(oldVal[i] !== newVal[i]) {
                        if(Lib.isPlainObject(oldVal[i]) && Lib.isPlainObject(newVal[i])) {
                            if(diffConfig(oldVal[i], newVal[i])) {
                                return true;
                            }
                        }
                        else {
                            return true;
                        }
                    }
                }
            }
            else {
                return true;
            }
        }
    }
}

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
exports.animate = function(gd, frameOrGroupNameOrFrameList, animationOpts) {
    gd = Lib.getGraphDiv(gd);

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
 *  @param {array of integers} indices
 *      an array of integer indices matching the respective frames in `frameList`. If not
 *      provided, an index will be provided in serial order. If already used, the frame
 *      will be overwritten.
 */
exports.addFrames = function(gd, frameList, indices) {
    gd = Lib.getGraphDiv(gd);

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
    var _frameHash = gd._transitionData._frameHash;


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
    var _frameHashLocal = {};
    for(i = frameList.length - 1; i >= 0; i--) {
        if(!Lib.isPlainObject(frameList[i])) continue;

        // The entire logic for checking for this type of name collision can be removed once we migrate to ES6 and
        // use a Map instead of an Object instance, as Map keys aren't converted to strings.
        var lookupName = frameList[i].name;
        var name = (_frameHash[lookupName] || _frameHashLocal[lookupName] || {}).name;
        var newName = frameList[i].name;
        var collisionPresent = _frameHash[name] || _frameHashLocal[name];

        if(name && newName && typeof newName === 'number' && collisionPresent && numericNameWarningCount < numericNameWarningCountLimit) {
            numericNameWarningCount++;

            Lib.warn('addFrames: overwriting frame "' + (_frameHash[name] || _frameHashLocal[name]).name +
                '" with a frame whose name of type "number" also equates to "' +
                name + '". This is valid but may potentially lead to unexpected ' +
                'behavior since all plotly.js frame names are stored internally ' +
                'as strings.');

            if(numericNameWarningCount === numericNameWarningCountLimit) {
                Lib.warn('addFrames: This API call has yielded too many of these warnings. ' +
                    'For the rest of this call, further warnings about numeric frame ' +
                    'names will be suppressed.');
            }
        }

        _frameHashLocal[lookupName] = {name: lookupName};

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
            while(_frameHash[(frame.name = 'frame ' + gd._transitionData._counter++)]);
        }

        if(_frameHash[frame.name]) {
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
exports.deleteFrames = function(gd, frameList) {
    gd = Lib.getGraphDiv(gd);

    if(!Lib.isPlotDiv(gd)) {
        throw new Error('This element is not a Plotly plot: ' + gd);
    }

    var i, idx;
    var _frames = gd._transitionData._frames;
    var ops = [];
    var revops = [];

    if(!frameList) {
        frameList = [];
        for(i = 0; i < _frames.length; i++) {
            frameList.push(i);
        }
    }

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
exports.purge = function purge(gd) {
    gd = Lib.getGraphDiv(gd);

    var fullLayout = gd._fullLayout || {};
    var fullData = gd._fullData || [];
    var calcdata = gd.calcdata || [];

    // remove gl contexts
    Plots.cleanPlot([], {}, fullData, fullLayout, calcdata);

    // purge properties
    Plots.purge(gd);

    // purge event emitter methods
    Events.purge(gd);

    // remove plot container
    if(fullLayout._container) fullLayout._container.remove();

    // in contrast to Plotly.Plots.purge which does NOT clear _context!
    delete gd._context;

    return gd;
};

// -------------------------------------------------------
// makePlotFramework: Create the plot container and axes
// -------------------------------------------------------
function makePlotFramework(gd) {
    var gd3 = d3.select(gd);
    var fullLayout = gd._fullLayout;

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
    // FIXME: parcoords reuses this object, not the best pattern
    fullLayout._glcontainer = fullLayout._paperdiv.selectAll('.gl-container')
        .data([{}]);

    fullLayout._glcontainer.enter().append('div')
        .classed('gl-container', true);

    // That is initialized in drawFramework if there are `gl` traces
    fullLayout._glcanvas = null;

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

    fullLayout._clips = fullLayout._defs.append('g')
        .classed('clips', true);

    fullLayout._topdefs = fullLayout._toppaper.append('defs')
        .attr('id', 'topdefs-' + fullLayout._uid);

    fullLayout._topclips = fullLayout._topdefs.append('g')
        .classed('clips', true);

    fullLayout._bgLayer = fullLayout._paper.append('g')
        .classed('bglayer', true);

    fullLayout._draggers = fullLayout._paper.append('g')
        .classed('draglayer', true);

    // lower shape/image layer - note that this is behind
    // all subplots data/grids but above the backgrounds
    // except inset subplots, whose backgrounds are drawn
    // inside their own group so that they appear above
    // the data for the main subplot
    // lower shapes and images which are fully referenced to
    // a subplot still get drawn within the subplot's group
    // so they will work correctly on insets
    var layerBelow = fullLayout._paper.append('g')
        .classed('layer-below', true);
    fullLayout._imageLowerLayer = layerBelow.append('g')
        .classed('imagelayer', true);
    fullLayout._shapeLowerLayer = layerBelow.append('g')
        .classed('shapelayer', true);

    // single cartesian layer for the whole plot
    fullLayout._cartesianlayer = fullLayout._paper.append('g').classed('cartesianlayer', true);

    // single polar layer for the whole plot
    fullLayout._polarlayer = fullLayout._paper.append('g').classed('polarlayer', true);

    // single ternary layer for the whole plot
    fullLayout._ternarylayer = fullLayout._paper.append('g').classed('ternarylayer', true);

    // single geo layer for the whole plot
    fullLayout._geolayer = fullLayout._paper.append('g').classed('geolayer', true);

    // single pie layer for the whole plot
    fullLayout._pielayer = fullLayout._paper.append('g').classed('pielayer', true);

    // fill in image server scrape-svg
    fullLayout._glimages = fullLayout._paper.append('g').classed('glimages', true);

    // lastly upper shapes, info (legend, annotations) and hover layers go on top
    // these are in a different svg element normally, but get collapsed into a single
    // svg when exporting (after inserting 3D)
    // upper shapes/images are only those drawn above the whole plot, including subplots
    var layerAbove = fullLayout._toppaper.append('g')
        .classed('layer-above', true);
    fullLayout._imageUpperLayer = layerAbove.append('g')
        .classed('imagelayer', true);
    fullLayout._shapeUpperLayer = layerAbove.append('g')
        .classed('shapelayer', true);

    fullLayout._infolayer = fullLayout._toppaper.append('g').classed('infolayer', true);
    fullLayout._menulayer = fullLayout._toppaper.append('g').classed('menulayer', true);
    fullLayout._zoomlayer = fullLayout._toppaper.append('g').classed('zoomlayer', true);
    fullLayout._hoverlayer = fullLayout._toppaper.append('g').classed('hoverlayer', true);

    gd.emit('plotly_framework');
}

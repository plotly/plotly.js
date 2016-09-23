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
var Registry = require('../registry');
var Lib = require('../lib');
var Color = require('../components/color');
var plots = module.exports = {};
var animationAttrs = require('./animation_attributes');
var frameAttrs = require('./frame_attributes');

// Expose registry methods on Plots for backward-compatibility
Lib.extendFlat(plots, Registry);

plots.attributes = require('./attributes');
plots.attributes.type.values = plots.allTypes;
plots.fontAttrs = require('./font_attributes');
plots.layoutAttributes = require('./layout_attributes');

// TODO make this a plot attribute?
plots.fontWeight = 'normal';

var subplotsRegistry = plots.subplotsRegistry;
var transformsRegistry = plots.transformsRegistry;

var ErrorBars = require('../components/errorbars');

/**
 * Find subplot ids in data.
 * Meant to be used in the defaults step.
 *
 * Use plots.getSubplotIds to grab the current
 * subplot ids later on in Plotly.plot.
 *
 * @param {array} data plotly data array
 *      (intended to be _fullData, but does not have to be).
 * @param {string} type subplot type to look for.
 *
 * @return {array} list of subplot ids (strings).
 *      N.B. these ids possibly un-ordered.
 *
 * TODO incorporate cartesian/gl2d axis finders in this paradigm.
 */
plots.findSubplotIds = function findSubplotIds(data, type) {
    var subplotIds = [];

    if(plots.subplotsRegistry[type] === undefined) return subplotIds;

    var attr = plots.subplotsRegistry[type].attr;

    for(var i = 0; i < data.length; i++) {
        var trace = data[i];

        if(plots.traceIs(trace, type) && subplotIds.indexOf(trace[attr]) === -1) {
            subplotIds.push(trace[attr]);
        }
    }

    return subplotIds;
};

/**
 * Get the ids of the current subplots.
 *
 * @param {object} layout plotly full layout object.
 * @param {string} type subplot type to look for.
 *
 * @return {array} list of ordered subplot ids (strings).
 *
 */
plots.getSubplotIds = function getSubplotIds(layout, type) {
    var _module = plots.subplotsRegistry[type];

    if(_module === undefined) return [];

    // layout must be 'fullLayout' here
    if(type === 'cartesian' && (!layout._has || !layout._has('cartesian'))) return [];
    if(type === 'gl2d' && (!layout._has || !layout._has('gl2d'))) return [];
    if(type === 'cartesian' || type === 'gl2d') {
        return Object.keys(layout._plots || {});
    }

    var idRegex = _module.idRegex,
        layoutKeys = Object.keys(layout),
        subplotIds = [];

    for(var i = 0; i < layoutKeys.length; i++) {
        var layoutKey = layoutKeys[i];

        if(idRegex.test(layoutKey)) subplotIds.push(layoutKey);
    }

    // order the ids
    var idLen = _module.idRoot.length;
    subplotIds.sort(function(a, b) {
        var aNum = +(a.substr(idLen) || 1),
            bNum = +(b.substr(idLen) || 1);
        return aNum - bNum;
    });

    return subplotIds;
};

/**
 * Get the data trace(s) associated with a given subplot.
 *
 * @param {array} data  plotly full data array.
 * @param {object} layout plotly full layout object.
 * @param {string} subplotId subplot ids to look for.
 *
 * @return {array} list of trace objects.
 *
 */
plots.getSubplotData = function getSubplotData(data, type, subplotId) {
    if(plots.subplotsRegistry[type] === undefined) return [];

    var attr = plots.subplotsRegistry[type].attr,
        subplotData = [],
        trace;

    for(var i = 0; i < data.length; i++) {
        trace = data[i];

        if(type === 'gl2d' && plots.traceIs(trace, 'gl2d')) {
            var spmatch = Plotly.Axes.subplotMatch,
                subplotX = 'x' + subplotId.match(spmatch)[1],
                subplotY = 'y' + subplotId.match(spmatch)[2];

            if(trace[attr[0]] === subplotX && trace[attr[1]] === subplotY) {
                subplotData.push(trace);
            }
        }
        else {
            if(trace[attr] === subplotId) subplotData.push(trace);
        }
    }

    return subplotData;
};

// in some cases the browser doesn't seem to know how big
// the text is at first, so it needs to draw it,
// then wait a little, then draw it again
plots.redrawText = function(gd) {

    // do not work if polar is present
    if((gd.data && gd.data[0] && gd.data[0].r)) return;

    return new Promise(function(resolve) {
        setTimeout(function() {
            Registry.getComponentMethod('annotations', 'draw')(gd);
            Registry.getComponentMethod('legend', 'draw')(gd);

            (gd.calcdata || []).forEach(function(d) {
                if(d[0] && d[0].t && d[0].t.cb) d[0].t.cb();
            });

            resolve(plots.previousPromises(gd));
        }, 300);
    });
};

// resize plot about the container size
plots.resize = function(gd) {
    return new Promise(function(resolve, reject) {

        if(!gd || d3.select(gd).style('display') === 'none') {
            reject(new Error('Resize must be passed a plot div element.'));
        }

        if(gd._redrawTimer) clearTimeout(gd._redrawTimer);

        gd._redrawTimer = setTimeout(function() {
            if((gd._fullLayout || {}).autosize) {
                // autosizing doesn't count as a change that needs saving
                var oldchanged = gd.changed;

                // nor should it be included in the undo queue
                gd.autoplay = true;

                Plotly.relayout(gd, { autosize: true });
                gd.changed = oldchanged;
                resolve(gd);
            }
        }, 100);
    });
};


// for use in Lib.syncOrAsync, check if there are any
// pending promises in this plot and wait for them
plots.previousPromises = function(gd) {
    if((gd._promises || []).length) {
        return Promise.all(gd._promises)
            .then(function() { gd._promises = []; });
    }
};

/**
 * Adds the 'Edit chart' link.
 * Note that now Plotly.plot() calls this so it can regenerate whenever it replots
 *
 * Add source links to your graph inside the 'showSources' config argument.
 */
plots.addLinks = function(gd) {
    var fullLayout = gd._fullLayout;

    var linkContainer = fullLayout._paper
        .selectAll('text.js-plot-link-container').data([0]);

    linkContainer.enter().append('text')
        .classed('js-plot-link-container', true)
        .style({
            'font-family': '"Open Sans", Arial, sans-serif',
            'font-size': '12px',
            'fill': Color.defaultLine,
            'pointer-events': 'all'
        })
        .each(function() {
            var links = d3.select(this);
            links.append('tspan').classed('js-link-to-tool', true);
            links.append('tspan').classed('js-link-spacer', true);
            links.append('tspan').classed('js-sourcelinks', true);
        });

    // The text node inside svg
    var text = linkContainer.node(),
        attrs = {
            y: fullLayout._paper.attr('height') - 9
        };

    // If text's width is bigger than the layout
    // Check that text is a child node or document.body
    // because otherwise IE/Edge might throw an exception
    // when calling getComputedTextLength().
    // Apparently offsetParent is null for invisibles.
    if(document.body.contains(text) && text.getComputedTextLength() >= (fullLayout.width - 20)) {
        // Align the text at the left
        attrs['text-anchor'] = 'start';
        attrs.x = 5;
    }
    else {
        // Align the text at the right
        attrs['text-anchor'] = 'end';
        attrs.x = fullLayout._paper.attr('width') - 7;
    }

    linkContainer.attr(attrs);

    var toolspan = linkContainer.select('.js-link-to-tool'),
        spacespan = linkContainer.select('.js-link-spacer'),
        sourcespan = linkContainer.select('.js-sourcelinks');

    if(gd._context.showSources) gd._context.showSources(gd);

    // 'view in plotly' link for embedded plots
    if(gd._context.showLink) positionPlayWithData(gd, toolspan);

    // separator if we have both sources and tool link
    spacespan.text((toolspan.text() && sourcespan.text()) ? ' - ' : '');
};

// note that now this function is only adding the brand in
// iframes and 3rd-party apps
function positionPlayWithData(gd, container) {
    container.text('');
    var link = container.append('a')
        .attr({
            'xlink:xlink:href': '#',
            'class': 'link--impt link--embedview',
            'font-weight': 'bold'
        })
        .text(gd._context.linkText + ' ' + String.fromCharCode(187));

    if(gd._context.sendData) {
        link.on('click', function() {
            plots.sendDataToCloud(gd);
        });
    }
    else {
        var path = window.location.pathname.split('/');
        var query = window.location.search;
        link.attr({
            'xlink:xlink:show': 'new',
            'xlink:xlink:href': '/' + path[2].split('.')[0] + '/' + path[1] + query
        });
    }
}
plots.sendDataToCloud = function(gd) {
    gd.emit('plotly_beforeexport');

    var baseUrl = (window.PLOTLYENV && window.PLOTLYENV.BASE_URL) || 'https://plot.ly';

    var hiddenformDiv = d3.select(gd)
        .append('div')
        .attr('id', 'hiddenform')
        .style('display', 'none');

    var hiddenform = hiddenformDiv
        .append('form')
        .attr({
            action: baseUrl + '/external',
            method: 'post',
            target: '_blank'
        });

    var hiddenformInput = hiddenform
        .append('input')
        .attr({
            type: 'text',
            name: 'data'
        });

    hiddenformInput.node().value = plots.graphJson(gd, false, 'keepdata');
    hiddenform.node().submit();
    hiddenformDiv.remove();

    gd.emit('plotly_afterexport');
    return false;
};

// Fill in default values:
//
// gd.data, gd.layout:
//   are precisely what the user specified,
//   these fields shouldn't be modified nor used directly
//   after the supply defaults step.
//
// gd._fullData, gd._fullLayout:
//   are complete descriptions of how to draw the plot,
//   use these fields in all required computations.
//
// gd._fullLayout._modules
//   is a list of all the trace modules required to draw the plot.
//
// gd._fullLayout._basePlotModules
//   is a list of all the plot modules required to draw the plot.
//
plots.supplyDefaults = function(gd) {
    var oldFullLayout = gd._fullLayout || {},
        newFullLayout = gd._fullLayout = {},
        newLayout = gd.layout || {};

    var oldFullData = gd._fullData || [],
        newFullData = gd._fullData = [],
        newData = gd.data || [];

    var i;

    // first fill in what we can of layout without looking at data
    // because fullData needs a few things from layout
    plots.supplyLayoutGlobalDefaults(newLayout, newFullLayout);

    // keep track of how many traces are inputted
    newFullLayout._dataLength = newData.length;

    // then do the data
    newFullLayout._globalTransforms = (gd._context || {}).globalTransforms;
    plots.supplyDataDefaults(newData, newFullData, newFullLayout);

    // attach helper method to check whether a plot type is present on graph
    newFullLayout._has = plots._hasPlotType.bind(newFullLayout);

    // special cases that introduce interactions between traces
    var _modules = newFullLayout._modules;
    for(i = 0; i < _modules.length; i++) {
        var _module = _modules[i];
        if(_module.cleanData) _module.cleanData(newFullData);
    }

    if(oldFullData.length === newData.length) {
        for(i = 0; i < newFullData.length; i++) {
            relinkPrivateKeys(newFullData[i], oldFullData[i]);
        }
    }

    // finally, fill in the pieces of layout that may need to look at data
    plots.supplyLayoutModuleDefaults(newLayout, newFullLayout, newFullData);

    // TODO remove in v2.0.0
    // add has-plot-type refs to fullLayout for backward compatibility
    newFullLayout._hasCartesian = newFullLayout._has('cartesian');
    newFullLayout._hasGeo = newFullLayout._has('geo');
    newFullLayout._hasGL3D = newFullLayout._has('gl3d');
    newFullLayout._hasGL2D = newFullLayout._has('gl2d');
    newFullLayout._hasTernary = newFullLayout._has('ternary');
    newFullLayout._hasPie = newFullLayout._has('pie');

    // clean subplots and other artifacts from previous plot calls
    plots.cleanPlot(newFullData, newFullLayout, oldFullData, oldFullLayout);

    // relink functions and _ attributes to promote consistency between plots
    relinkPrivateKeys(newFullLayout, oldFullLayout);

    plots.doAutoMargin(gd);

    // can't quite figure out how to get rid of this... each axis needs
    // a reference back to the DOM object for just a few purposes
    var axList = Plotly.Axes.list(gd);
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];
        ax._gd = gd;
        ax.setScale();
    }

    // relink / initialize subplot axis objects
    plots.linkSubplots(newFullData, newFullLayout, oldFullData, oldFullLayout);

    // update object references in calcdata
    if((gd.calcdata || []).length === newFullData.length) {
        for(i = 0; i < newFullData.length; i++) {
            var trace = newFullData[i];
            (gd.calcdata[i][0] || {}).trace = trace;
        }
    }

    // Create all the storage space for frames, but only if doesn't already
    // exist:
    if(!gd._transitionData) {
        plots.createTransitionData(gd);
    }
};

// Create storage for all of the data related to frames and transitions:
plots.createTransitionData = function(gd) {
    // Set up the default keyframe if it doesn't exist:
    if(!gd._transitionData) {
        gd._transitionData = {};
    }

    if(!gd._transitionData._frames) {
        gd._transitionData._frames = [];
    }

    if(!gd._transitionData._frameHash) {
        gd._transitionData._frameHash = {};
    }

    if(!gd._transitionData._counter) {
        gd._transitionData._counter = 0;
    }

    if(!gd._transitionData._interruptCallbacks) {
        gd._transitionData._interruptCallbacks = [];
    }
};

// helper function to be bound to fullLayout to check
// whether a certain plot type is present on plot
plots._hasPlotType = function(category) {
    var basePlotModules = this._basePlotModules || [];

    for(var i = 0; i < basePlotModules.length; i++) {
        var _module = basePlotModules[i];

        if(_module.name === category) return true;
    }

    return false;
};

plots.cleanPlot = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var i, j;

    var basePlotModules = oldFullLayout._basePlotModules || [];
    for(i = 0; i < basePlotModules.length; i++) {
        var _module = basePlotModules[i];

        if(_module.clean) {
            _module.clean(newFullData, newFullLayout, oldFullData, oldFullLayout);
        }
    }

    var hasPaper = !!oldFullLayout._paper;
    var hasInfoLayer = !!oldFullLayout._infolayer;

    oldLoop:
    for(i = 0; i < oldFullData.length; i++) {
        var oldTrace = oldFullData[i],
            oldUid = oldTrace.uid;

        for(j = 0; j < newFullData.length; j++) {
            var newTrace = newFullData[j];

            if(oldUid === newTrace.uid) continue oldLoop;
        }

        // clean old heatmap, contour, and scatter traces
        //
        // Note: This is also how scatter traces (cartesian and scatterternary) get
        // removed since otherwise the scatter module is not called (and so the join
        // doesn't register the removal) if scatter traces disappear entirely.
        if(hasPaper) {
            oldFullLayout._paper.selectAll(
                '.hm' + oldUid +
                ',.contour' + oldUid +
                ',#clip' + oldUid +
                ',.trace' + oldUid
            ).remove();
        }

        // clean old colorbars
        if(hasInfoLayer) {
            oldFullLayout._infolayer.selectAll('.cb' + oldUid).remove();
        }
    }
};

/**
 * Relink private _keys and keys with a function value from one container
 * to the new container.
 * Relink means copying if object is pass-by-value and adding a reference
 * if object is pass-by-ref.
 * This prevents deepCopying massive structures like a webgl context.
 */
function relinkPrivateKeys(toContainer, fromContainer) {
    var isPlainObject = Lib.isPlainObject,
        isArray = Array.isArray;

    var keys = Object.keys(fromContainer);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i],
            fromVal = fromContainer[k],
            toVal = toContainer[k];

        if(k.charAt(0) === '_' || typeof fromVal === 'function') {

            // if it already exists at this point, it's something
            // that we recreate each time around, so ignore it
            if(k in toContainer) continue;

            toContainer[k] = fromVal;
        }
        else if(isArray(fromVal) && isArray(toVal) && isPlainObject(fromVal[0])) {

            // recurse into arrays containers
            for(var j = 0; j < fromVal.length; j++) {
                if(isPlainObject(fromVal[j]) && isPlainObject(toVal[j])) {
                    relinkPrivateKeys(toVal[j], fromVal[j]);
                }
            }
        }
        else if(isPlainObject(fromVal) && isPlainObject(toVal)) {

            // recurse into objects, but only if they still exist
            relinkPrivateKeys(toVal, fromVal);

            if(!Object.keys(toVal).length) delete toContainer[k];
        }
    }
}

plots.linkSubplots = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldSubplots = oldFullLayout._plots || {},
        newSubplots = newFullLayout._plots = {};

    var mockGd = {
        data: newFullData,
        _fullLayout: newFullLayout
    };

    var ids = Plotly.Axes.getSubplots(mockGd);

    for(var i = 0; i < ids.length; i++) {
        var id = ids[i],
            oldSubplot = oldSubplots[id],
            plotinfo;

        if(oldSubplot) {
            plotinfo = newSubplots[id] = oldSubplot;
        }
        else {
            plotinfo = newSubplots[id] = {};
            plotinfo.id = id;
        }

        plotinfo.xaxis = Plotly.Axes.getFromId(mockGd, id, 'x');
        plotinfo.yaxis = Plotly.Axes.getFromId(mockGd, id, 'y');
    }
};

plots.supplyDataDefaults = function(dataIn, dataOut, layout) {
    var modules = layout._modules = [],
        basePlotModules = layout._basePlotModules = [],
        cnt = 0;

    function pushModule(fullTrace) {
        dataOut.push(fullTrace);

        var _module = fullTrace._module;
        if(!_module) return;

        Lib.pushUnique(modules, _module);
        Lib.pushUnique(basePlotModules, fullTrace._module.basePlotModule);

        cnt++;
    }

    for(var i = 0; i < dataIn.length; i++) {
        var trace = dataIn[i],
            fullTrace = plots.supplyTraceDefaults(trace, cnt, layout);

        fullTrace.index = i;
        fullTrace._input = trace;
        fullTrace._expandedIndex = cnt;

        if(fullTrace.transforms && fullTrace.transforms.length) {
            var expandedTraces = applyTransforms(fullTrace, dataOut, layout);

            for(var j = 0; j < expandedTraces.length; j++) {
                var expandedTrace = expandedTraces[j],
                    fullExpandedTrace = plots.supplyTraceDefaults(expandedTrace, cnt, layout);

                // mutate uid here using parent uid and expanded index
                // to promote consistency between update calls
                expandedTrace.uid = fullExpandedTrace.uid = fullTrace.uid + j;

                // add info about parent data trace
                fullExpandedTrace.index = i;
                fullExpandedTrace._input = trace;
                fullExpandedTrace._fullInput = fullTrace;

                // add info about the expanded data
                fullExpandedTrace._expandedIndex = cnt;
                fullExpandedTrace._expandedInput = expandedTrace;

                pushModule(fullExpandedTrace);
            }
        }
        else {
            pushModule(fullTrace);
        }
    }
};

plots.supplyAnimationDefaults = function(opts) {
    opts = opts || {};
    var i;
    var optsOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(opts || {}, optsOut, animationAttrs, attr, dflt);
    }

    coerce('mode');

    if(Array.isArray(opts.frame)) {
        optsOut.frame = [];
        for(i = 0; i < opts.frame.length; i++) {
            optsOut.frame[i] = plots.supplyAnimationFrameDefaults(opts.frame[i] || {});
        }
    } else {
        optsOut.frame = plots.supplyAnimationFrameDefaults(opts.frame || {});
    }

    if(Array.isArray(opts.transition)) {
        optsOut.transition = [];
        for(i = 0; i < opts.transition.length; i++) {
            optsOut.transition[i] = plots.supplyAnimationTransitionDefaults(opts.transition[i] || {});
        }
    } else {
        optsOut.transition = plots.supplyAnimationTransitionDefaults(opts.transition || {});
    }

    return optsOut;
};

plots.supplyAnimationFrameDefaults = function(opts) {
    var optsOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(opts || {}, optsOut, animationAttrs.frame, attr, dflt);
    }

    coerce('duration');
    coerce('redraw');

    return optsOut;
};

plots.supplyAnimationTransitionDefaults = function(opts) {
    var optsOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(opts || {}, optsOut, animationAttrs.transition, attr, dflt);
    }

    coerce('duration');
    coerce('easing');

    return optsOut;
};

plots.supplyFrameDefaults = function(frameIn) {
    var frameOut = {};

    function coerce(attr, dflt) {
        return Lib.coerce(frameIn, frameOut, frameAttrs, attr, dflt);
    }

    coerce('group');
    coerce('name');
    coerce('traces');
    coerce('baseframe');
    coerce('data');
    coerce('layout');

    return frameOut;
};

plots.supplyTraceDefaults = function(traceIn, traceIndex, layout) {
    var traceOut = {},
        defaultColor = Color.defaults[traceIndex % Color.defaults.length];

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, plots.attributes, attr, dflt);
    }

    function coerceSubplotAttr(subplotType, subplotAttr) {
        if(!plots.traceIs(traceOut, subplotType)) return;

        return Lib.coerce(traceIn, traceOut,
            plots.subplotsRegistry[subplotType].attributes, subplotAttr);
    }

    var visible = coerce('visible');

    coerce('type');
    coerce('uid');
    coerce('name', 'trace ' + traceIndex);

    // coerce subplot attributes of all registered subplot types
    var subplotTypes = Object.keys(subplotsRegistry);
    for(var i = 0; i < subplotTypes.length; i++) {
        var subplotType = subplotTypes[i];

        // done below (only when visible is true)
        // TODO unified this pattern
        if(['cartesian', 'gl2d'].indexOf(subplotType) !== -1) continue;

        var attr = subplotsRegistry[subplotType].attr;

        if(attr) coerceSubplotAttr(subplotType, attr);
    }

    if(visible) {
        var _module = plots.getModule(traceOut);
        traceOut._module = _module;

        // gets overwritten in pie, geo and ternary modules
        coerce('hoverinfo', (layout._dataLength === 1) ? 'x+y+z+text' : undefined);

        // TODO add per-base-plot-module trace defaults step

        if(_module) _module.supplyDefaults(traceIn, traceOut, defaultColor, layout);

        if(!plots.traceIs(traceOut, 'noOpacity')) coerce('opacity');

        coerceSubplotAttr('cartesian', 'xaxis');
        coerceSubplotAttr('cartesian', 'yaxis');

        coerceSubplotAttr('gl2d', 'xaxis');
        coerceSubplotAttr('gl2d', 'yaxis');

        if(plots.traceIs(traceOut, 'showLegend')) {
            coerce('showlegend');
            coerce('legendgroup');
        }

        supplyTransformDefaults(traceIn, traceOut, layout);
    }

    return traceOut;
};

function supplyTransformDefaults(traceIn, traceOut, layout) {
    var globalTransforms = layout._globalTransforms || [];

    if(!Array.isArray(traceIn.transforms) && globalTransforms.length === 0) return;

    var containerIn = traceIn.transforms || [],
        transformList = globalTransforms.concat(containerIn),
        containerOut = traceOut.transforms = [];

    for(var i = 0; i < transformList.length; i++) {
        var transformIn = transformList[i],
            type = transformIn.type,
            _module = transformsRegistry[type],
            transformOut;

        if(!_module) Lib.warn('Unrecognized transform type ' + type + '.');

        if(_module && _module.supplyDefaults) {
            transformOut = _module.supplyDefaults(transformIn, traceOut, layout);
            transformOut.type = type;
        }
        else {
            transformOut = Lib.extendFlat({}, transformIn);
        }

        containerOut.push(transformOut);
    }
}

function applyTransforms(fullTrace, fullData, layout) {
    var container = fullTrace.transforms,
        dataOut = [fullTrace];

    var attributeSets = dataOut.map(function(trace) {

        var arraySplitAttributes = [];

        var stack = [];

        /**
         * A closure that gathers attribute paths into its enclosed arraySplitAttributes
         * Attribute paths are collected iff their leaf node is a splittable attribute
         * @callback callback
         * @param {object} attr an attribute
         * @param {String} attrName name string
         * @param {object[]} attrs all the attributes
         * @param {Number} level the recursion level, 0 at the root
         * @closureVariable {String[][]} arraySplitAttributes the set of gathered attributes
         *   Example of filled closure variable (expected to be initialized to []):
         *        [["marker","size"],["marker","line","width"],["marker","line","color"]]
         */
        function callback(attr, attrName, attrs, level) {

            stack = stack.slice(0, level).concat([attrName]);

            var splittableAttr = attr.valType === 'data_array' || attr.arrayOk === true;
            if(splittableAttr) {
                arraySplitAttributes.push(stack.slice());
            }
        }

        Lib.crawl(trace._module.attributes, callback);

        return arraySplitAttributes.map(function(path) {
            return path.join('.');
        });
    });

    for(var i = 0; i < container.length; i++) {
        var transform = container[i],
            type = transform.type,
            _module = transformsRegistry[type];

        if(_module) {
            dataOut = _module.transform(dataOut, {
                transform: transform,
                fullTrace: fullTrace,
                fullData: fullData,
                attributeSets: attributeSets,
                layout: layout,
                transformIndex: i
            });
        }
    }

    return dataOut;
}

plots.supplyLayoutGlobalDefaults = function(layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, plots.layoutAttributes, attr, dflt);
    }

    var globalFont = Lib.coerceFont(coerce, 'font');

    coerce('title');

    Lib.coerceFont(coerce, 'titlefont', {
        family: globalFont.family,
        size: Math.round(globalFont.size * 1.4),
        color: globalFont.color
    });

    var autosize = coerce('autosize',
        (layoutIn.width && layoutIn.height) ? false : 'initial');
    coerce('width');
    coerce('height');

    coerce('margin.l');
    coerce('margin.r');
    coerce('margin.t');
    coerce('margin.b');
    coerce('margin.pad');
    coerce('margin.autoexpand');

    // called in plotAutoSize otherwise
    if(autosize !== 'initial') plots.sanitizeMargins(layoutOut);

    coerce('paper_bgcolor');

    coerce('separators');
    coerce('hidesources');
    coerce('smith');
};

plots.supplyLayoutModuleDefaults = function(layoutIn, layoutOut, fullData) {
    var i, _module;

    // can't be be part of basePlotModules loop
    // in order to handle the orphan axes case
    Plotly.Axes.supplyLayoutDefaults(layoutIn, layoutOut, fullData);

    // base plot module layout defaults
    var basePlotModules = layoutOut._basePlotModules;
    for(i = 0; i < basePlotModules.length; i++) {
        _module = basePlotModules[i];

        // done above already
        if(_module.name === 'cartesian') continue;

        // e.g. gl2d does not have a layout-defaults step
        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        }
    }

    // trace module layout defaults
    var modules = layoutOut._modules;
    for(i = 0; i < modules.length; i++) {
        _module = modules[i];

        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        }
    }

    // should FX be a component?
    Plotly.Fx.supplyLayoutDefaults(layoutIn, layoutOut, fullData);

    var components = Object.keys(Registry.componentsRegistry);
    for(i = 0; i < components.length; i++) {
        _module = Registry.componentsRegistry[components[i]];

        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        }
    }
};

// Remove all plotly attributes from a div so it can be replotted fresh
// TODO: these really need to be encapsulated into a much smaller set...
plots.purge = function(gd) {

    // note: we DO NOT remove _context because it doesn't change when we insert
    // a new plot, and may have been set outside of our scope.

    var fullLayout = gd._fullLayout || {};
    if(fullLayout._glcontainer !== undefined) fullLayout._glcontainer.remove();
    if(fullLayout._geocontainer !== undefined) fullLayout._geocontainer.remove();

    // remove modebar
    if(fullLayout._modeBar) fullLayout._modeBar.destroy();

    if(gd._transitionData && gd._transitionData._animationRaf) {
        window.cancelAnimationFrame(gd._transitionData._animationRaf);
    }

    // data and layout
    delete gd.data;
    delete gd.layout;
    delete gd._fullData;
    delete gd._fullLayout;
    delete gd.calcdata;
    delete gd.framework;
    delete gd.empty;

    delete gd.fid;

    delete gd.undoqueue; // action queue
    delete gd.undonum;
    delete gd.autoplay; // are we doing an action that doesn't go in undo queue?
    delete gd.changed;

    // these get recreated on Plotly.plot anyway, but just to be safe
    // (and to have a record of them...)
    delete gd._tester;
    delete gd._testref;
    delete gd._promises;
    delete gd._redrawTimer;
    delete gd._replotting;
    delete gd.firstscatter;
    delete gd.hmlumcount;
    delete gd.hmpixcount;
    delete gd.numboxes;
    delete gd._hoverTimer;
    delete gd._lastHoverTime;
    delete gd._transitionData;
    delete gd._transitioning;

    // remove all event listeners
    if(gd.removeAllListeners) gd.removeAllListeners();
};

plots.style = function(gd) {
    var _modules = gd._fullLayout._modules;

    for(var i = 0; i < _modules.length; i++) {
        var _module = _modules[i];

        if(_module.style) _module.style(gd);
    }
};

plots.sanitizeMargins = function(fullLayout) {
    // polar doesn't do margins...
    if(!fullLayout || !fullLayout.margin) return;

    var width = fullLayout.width,
        height = fullLayout.height,
        margin = fullLayout.margin,
        plotWidth = width - (margin.l + margin.r),
        plotHeight = height - (margin.t + margin.b),
        correction;

    // if margin.l + margin.r = 0 then plotWidth > 0
    // as width >= 10 by supplyDefaults
    // similarly for margin.t + margin.b

    if(plotWidth < 0) {
        correction = (width - 1) / (margin.l + margin.r);
        margin.l = Math.floor(correction * margin.l);
        margin.r = Math.floor(correction * margin.r);
    }

    if(plotHeight < 0) {
        correction = (height - 1) / (margin.t + margin.b);
        margin.t = Math.floor(correction * margin.t);
        margin.b = Math.floor(correction * margin.b);
    }
};

// called by legend and colorbar routines to see if we need to
// expand the margins to show them
// o is {x,l,r,y,t,b} where x and y are plot fractions,
// the rest are pixels in each direction
// or leave o out to delete this entry (like if it's hidden)
plots.autoMargin = function(gd, id, o) {
    var fullLayout = gd._fullLayout;

    if(!fullLayout._pushmargin) fullLayout._pushmargin = {};

    if(fullLayout.margin.autoexpand !== false) {
        if(!o) delete fullLayout._pushmargin[id];
        else {
            var pad = o.pad === undefined ? 12 : o.pad;

            // if the item is too big, just give it enough automargin to
            // make sure you can still grab it and bring it back
            if(o.l + o.r > fullLayout.width * 0.5) o.l = o.r = 0;
            if(o.b + o.t > fullLayout.height * 0.5) o.b = o.t = 0;

            fullLayout._pushmargin[id] = {
                l: {val: o.x, size: o.l + pad},
                r: {val: o.x, size: o.r + pad},
                b: {val: o.y, size: o.b + pad},
                t: {val: o.y, size: o.t + pad}
            };
        }

        if(!gd._replotting) plots.doAutoMargin(gd);
    }
};

plots.doAutoMargin = function(gd) {
    var fullLayout = gd._fullLayout;
    if(!fullLayout._size) fullLayout._size = {};
    if(!fullLayout._pushmargin) fullLayout._pushmargin = {};

    var gs = fullLayout._size,
        oldmargins = JSON.stringify(gs);

    // adjust margins for outside legends and colorbars
    // fullLayout.margin is the requested margin,
    // fullLayout._size has margins and plotsize after adjustment
    var ml = Math.max(fullLayout.margin.l || 0, 0),
        mr = Math.max(fullLayout.margin.r || 0, 0),
        mt = Math.max(fullLayout.margin.t || 0, 0),
        mb = Math.max(fullLayout.margin.b || 0, 0),
        pm = fullLayout._pushmargin;

    if(fullLayout.margin.autoexpand !== false) {
        // fill in the requested margins
        pm.base = {
            l: {val: 0, size: ml},
            r: {val: 1, size: mr},
            t: {val: 1, size: mt},
            b: {val: 0, size: mb}
        };
        // now cycle through all the combinations of l and r
        // (and t and b) to find the required margins
        Object.keys(pm).forEach(function(k1) {
            var pushleft = pm[k1].l || {},
                pushbottom = pm[k1].b || {},
                fl = pushleft.val,
                pl = pushleft.size,
                fb = pushbottom.val,
                pb = pushbottom.size;
            Object.keys(pm).forEach(function(k2) {
                if(isNumeric(pl) && pm[k2].r) {
                    var fr = pm[k2].r.val,
                        pr = pm[k2].r.size;
                    if(fr > fl) {
                        var newl = (pl * fr +
                                (pr - fullLayout.width) * fl) / (fr - fl),
                            newr = (pr * (1 - fl) +
                                (pl - fullLayout.width) * (1 - fr)) / (fr - fl);
                        if(newl >= 0 && newr >= 0 && newl + newr > ml + mr) {
                            ml = newl;
                            mr = newr;
                        }
                    }
                }
                if(isNumeric(pb) && pm[k2].t) {
                    var ft = pm[k2].t.val,
                        pt = pm[k2].t.size;
                    if(ft > fb) {
                        var newb = (pb * ft +
                                (pt - fullLayout.height) * fb) / (ft - fb),
                            newt = (pt * (1 - fb) +
                                (pb - fullLayout.height) * (1 - ft)) / (ft - fb);
                        if(newb >= 0 && newt >= 0 && newb + newt > mb + mt) {
                            mb = newb;
                            mt = newt;
                        }
                    }
                }
            });
        });
    }

    gs.l = Math.round(ml);
    gs.r = Math.round(mr);
    gs.t = Math.round(mt);
    gs.b = Math.round(mb);
    gs.p = Math.round(fullLayout.margin.pad);
    gs.w = Math.round(fullLayout.width) - gs.l - gs.r;
    gs.h = Math.round(fullLayout.height) - gs.t - gs.b;

    // if things changed and we're not already redrawing, trigger a redraw
    if(!gd._replotting && oldmargins !== '{}' &&
            oldmargins !== JSON.stringify(fullLayout._size)) {
        return Plotly.plot(gd);
    }
};

/**
 * JSONify the graph data and layout
 *
 * This function needs to recurse because some src can be inside
 * sub-objects.
 *
 * It also strips out functions and private (starts with _) elements.
 * Therefore, we can add temporary things to data and layout that don't
 * get saved.
 *
 * @param gd The graphDiv
 * @param {Boolean} dataonly If true, don't return layout.
 * @param {'keepref'|'keepdata'|'keepall'} [mode='keepref'] Filter what's kept
 *      keepref: remove data for which there's a src present
 *          eg if there's xsrc present (and xsrc is well-formed,
 *          ie has : and some chars before it), strip out x
 *      keepdata: remove all src tags, don't remove the data itself
 *      keepall: keep data and src
 * @param {String} output If you specify 'object', the result will not be stringified
 * @param {Boolean} useDefaults If truthy, use _fullLayout and _fullData
 * @returns {Object|String}
 */
plots.graphJson = function(gd, dataonly, mode, output, useDefaults) {
    // if the defaults aren't supplied yet, we need to do that...
    if((useDefaults && dataonly && !gd._fullData) ||
            (useDefaults && !dataonly && !gd._fullLayout)) {
        plots.supplyDefaults(gd);
    }

    var data = (useDefaults) ? gd._fullData : gd.data,
        layout = (useDefaults) ? gd._fullLayout : gd.layout;

    function stripObj(d) {
        if(typeof d === 'function') {
            return null;
        }
        if(Lib.isPlainObject(d)) {
            var o = {}, v, src;
            for(v in d) {
                // remove private elements and functions
                // _ is for private, [ is a mistake ie [object Object]
                if(typeof d[v] === 'function' ||
                        ['_', '['].indexOf(v.charAt(0)) !== -1) {
                    continue;
                }

                // look for src/data matches and remove the appropriate one
                if(mode === 'keepdata') {
                    // keepdata: remove all ...src tags
                    if(v.substr(v.length - 3) === 'src') {
                        continue;
                    }
                }
                else if(mode === 'keepstream') {
                    // keep sourced data if it's being streamed.
                    // similar to keepref, but if the 'stream' object exists
                    // in a trace, we will keep the data array.
                    src = d[v + 'src'];
                    if(typeof src === 'string' && src.indexOf(':') > 0) {
                        if(!Lib.isPlainObject(d.stream)) {
                            continue;
                        }
                    }
                }
                else if(mode !== 'keepall') {
                    // keepref: remove sourced data but only
                    // if the source tag is well-formed
                    src = d[v + 'src'];
                    if(typeof src === 'string' && src.indexOf(':') > 0) {
                        continue;
                    }
                }

                // OK, we're including this... recurse into it
                o[v] = stripObj(d[v]);
            }
            return o;
        }

        if(Array.isArray(d)) {
            return d.map(stripObj);
        }

        // convert native dates to date strings...
        // mostly for external users exporting to plotly
        if(d && d.getTime) {
            return Lib.ms2DateTime(d);
        }

        return d;
    }

    var obj = {
        data: (data || []).map(function(v) {
            var d = stripObj(v);
            // fit has some little arrays in it that don't contain data,
            // just fit params and meta
            if(dataonly) { delete d.fit; }
            return d;
        })
    };
    if(!dataonly) { obj.layout = stripObj(layout); }

    if(gd.framework && gd.framework.isPolar) obj = gd.framework.getConfig();

    return (output === 'object') ? obj : JSON.stringify(obj);
};

/**
 * Modify a keyframe using a list of operations:
 *
 * @param {array of objects} operations
 *      Sequence of operations to be performed on the keyframes
 */
plots.modifyFrames = function(gd, operations) {
    var i, op, frame;
    var _frames = gd._transitionData._frames;
    var _hash = gd._transitionData._frameHash;

    for(i = 0; i < operations.length; i++) {
        op = operations[i];

        switch(op.type) {
            // No reason this couldn't exist, but is currently unused/untested:
            /* case 'rename':
                frame = _frames[op.index];
                delete _hash[frame.name];
                _hash[op.name] = frame;
                frame.name = op.name;
                break;*/
            case 'replace':
                frame = op.value;
                var oldName = _frames[op.index].name;
                var newName = frame.name;
                _frames[op.index] = _hash[newName] = frame;

                if(newName !== oldName) {
                    // If name has changed in addition to replacement, then update
                    // the lookup table:
                    delete _hash[oldName];
                    _hash[newName] = frame;
                }

                break;
            case 'insert':
                frame = op.value;
                _hash[frame.name] = frame;
                _frames.splice(op.index, 0, frame);
                break;
            case 'delete':
                frame = _frames[op.index];
                delete _hash[frame.name];
                _frames.splice(op.index, 1);
                break;
        }
    }

    return Promise.resolve();
};

/*
 * Compute a keyframe. Merge a keyframe into its base frame(s) and
 * expand properties.
 *
 * @param {object} frameLookup
 *      An object containing frames keyed by name (i.e. gd._transitionData._frameHash)
 * @param {string} frame
 *      The name of the keyframe to be computed
 *
 * Returns: a new object with the merged content
 */
plots.computeFrame = function(gd, frameName) {
    var frameLookup = gd._transitionData._frameHash;
    var i, traceIndices, traceIndex, expandedObj, destIndex, copy;

    var framePtr = frameLookup[frameName];

    // Return false if the name is invalid:
    if(!framePtr) {
        return false;
    }

    var frameStack = [framePtr];
    var frameNameStack = [framePtr.name];

    // Follow frame pointers:
    while((framePtr = frameLookup[framePtr.baseframe])) {
        // Avoid infinite loops:
        if(frameNameStack.indexOf(framePtr.name) !== -1) break;

        frameStack.push(framePtr);
        frameNameStack.push(framePtr.name);
    }

    // A new object for the merged result:
    var result = {};

    // Merge, starting with the last and ending with the desired frame:
    while((framePtr = frameStack.pop())) {
        if(framePtr.layout) {
            copy = Lib.extendDeepNoArrays({}, framePtr.layout);
            expandedObj = Lib.expandObjectPaths(copy);
            result.layout = Lib.extendDeepNoArrays(result.layout || {}, expandedObj);
        }

        if(framePtr.data) {
            if(!result.data) {
                result.data = [];
            }
            traceIndices = framePtr.traces;

            if(!traceIndices) {
                // If not defined, assume serial order starting at zero
                traceIndices = [];
                for(i = 0; i < framePtr.data.length; i++) {
                    traceIndices[i] = i;
                }
            }

            if(!result.traces) {
                result.traces = [];
            }

            for(i = 0; i < framePtr.data.length; i++) {
                // Loop through this frames data, find out where it should go,
                // and merge it!
                traceIndex = traceIndices[i];
                if(traceIndex === undefined || traceIndex === null) {
                    continue;
                }

                destIndex = result.traces.indexOf(traceIndex);
                if(destIndex === -1) {
                    destIndex = result.data.length;
                    result.traces[destIndex] = traceIndex;
                }

                copy = Lib.extendDeepNoArrays({}, framePtr.data[i]);
                expandedObj = Lib.expandObjectPaths(copy);
                result.data[destIndex] = Lib.extendDeepNoArrays(result.data[destIndex] || {}, expandedObj);
            }
        }
    }

    return result;
};

/**
 * Transition to a set of new data and layout properties
 *
 * @param {DOM element} gd
 *      the DOM element of the graph container div
 * @param {Object[]} data
 *      an array of data objects following the normal Plotly data definition format
 * @param {Object} layout
 *      a layout object, following normal Plotly layout format
 * @param {Number[]} traces
 *      indices of the corresponding traces specified in `data`
 * @param {Object} frameOpts
 *      options for the frame (i.e. whether to redraw post-transition)
 * @param {Object} transitionOpts
 *      options for the transition
 */
plots.transition = function(gd, data, layout, traces, frameOpts, transitionOpts) {
    var i, traceIdx;

    var dataLength = Array.isArray(data) ? data.length : 0;
    var traceIndices = traces.slice(0, dataLength);

    var transitionedTraces = [];

    function prepareTransitions() {
        var i;

        for(i = 0; i < traceIndices.length; i++) {
            var traceIdx = traceIndices[i];
            var trace = gd._fullData[traceIdx];
            var module = trace._module;

            if(!module || !module.animatable) {
                continue;
            }

            transitionedTraces.push(traceIdx);

            // This is a multi-step process. First clone w/o arrays so that
            // we're not modifying the original:
            var update = Lib.extendDeepNoArrays({}, data[i]);

            // Then expand object paths since we don't obey object-overwrite
            // semantics here:
            update = Lib.expandObjectPaths(update);

            // Finally apply the update (without copying arrays, of course):
            Lib.extendDeepNoArrays(gd.data[traceIndices[i]], update);
        }

        // Follow the same procedure. Clone it so we don't mangle the input, then
        // expand any object paths so we can merge deep into gd.layout:
        var layoutUpdate = Lib.expandObjectPaths(Lib.extendDeepNoArrays({}, layout));

        // Before merging though, we need to modify the incoming layout. We only
        // know how to *transition* layout ranges, so it's imperative that a new
        // range not be sent to the layout before the transition has started. So
        // we must remove the things we can transition:
        var axisAttrRe = /^[xy]axis[0-9]*$/;
        for(var attr in layoutUpdate) {
            if(!axisAttrRe.test(attr)) continue;
            delete layoutUpdate[attr].range;
        }

        Lib.extendDeepNoArrays(gd.layout, layoutUpdate);

        // Supply defaults after applying the incoming properties. Note that any attempt
        // to simplify this step and reduce the amount of work resulted in the reconstruction
        // of essentially the whole supplyDefaults step, so that it seems sensible to just use
        // supplyDefaults even though it's heavier than would otherwise be desired for
        // transitions:
        plots.supplyDefaults(gd);

        plots.doCalcdata(gd);

        ErrorBars.calc(gd);

        return Promise.resolve();
    }

    function executeCallbacks(list) {
        var p = Promise.resolve();
        if(!list) return p;
        while(list.length) {
            p = p.then((list.shift()));
        }
        return p;
    }

    function flushCallbacks(list) {
        if(!list) return;
        while(list.length) {
            list.shift();
        }
    }

    var aborted = false;

    function executeTransitions() {
        return new Promise(function(resolve) {
            // This flag is used to disabled things like autorange:
            gd._transitioning = true;

            // When instantaneous updates are coming through quickly, it's too much to simply disable
            // all interaction, so store this flag so we can disambiguate whether mouse interactions
            // should be fully disabled or not:
            if(transitionOpts.duration > 0) {
                gd._transitioningWithDuration = true;
            }

            gd._transitionData._interruptCallbacks.push(function() {
                aborted = true;
            });

            // Construct callbacks that are executed on transition end. This ensures the d3 transitions
            // are *complete* before anything else is done.
            var numCallbacks = 0;
            var numCompleted = 0;
            function makeCallback() {
                numCallbacks++;
                return function() {
                    numCompleted++;
                    // When all are complete, perform a redraw:
                    if(!aborted && numCompleted === numCallbacks) {
                        completeTransition(resolve);
                    }
                };
            }

            var traceTransitionOpts;
            var j;
            var basePlotModules = gd._fullLayout._basePlotModules;
            var hasAxisTransition = false;

            if(layout) {
                for(j = 0; j < basePlotModules.length; j++) {
                    if(basePlotModules[j].transitionAxes) {
                        var newLayout = Lib.expandObjectPaths(layout);
                        hasAxisTransition = basePlotModules[j].transitionAxes(gd, newLayout, transitionOpts, makeCallback) || hasAxisTransition;
                    }
                }
            }

            // Here handle the exception that we refuse to animate scales and axes at the same
            // time. In other words, if there's an axis transition, then set the data transition
            // to instantaneous.
            if(hasAxisTransition) {
                traceTransitionOpts = Lib.extendFlat({}, transitionOpts);
                traceTransitionOpts.duration = 0;
            } else {
                traceTransitionOpts = transitionOpts;
            }

            for(j = 0; j < basePlotModules.length; j++) {
                // Note that we pass a callback to *create* the callback that must be invoked on completion.
                // This is since not all traces know about transitions, so it greatly simplifies matters if
                // the trace is responsible for creating a callback, if needed, and then executing it when
                // the time is right.
                basePlotModules[j].plot(gd, transitionedTraces, traceTransitionOpts, makeCallback);
            }

            // If nothing else creates a callback, then this will trigger the completion in the next tick:
            setTimeout(makeCallback());

        });
    }

    function completeTransition(callback) {
        flushCallbacks(gd._transitionData._interruptCallbacks);

        return Promise.resolve().then(function() {
            if(frameOpts.redraw) {
                return Plotly.redraw(gd);
            }
        }).then(function() {
            // Set transitioning false again once the redraw has occurred. This is used, for example,
            // to prevent the trailing redraw from autoranging:
            gd._transitioning = false;
            gd._transitioningWithDuration = false;

            gd.emit('plotly_transitioned', []);
        }).then(callback);
    }

    function interruptPreviousTransitions() {
        gd.emit('plotly_transitioninterrupted', []);

        // If a transition is interrupted, set this to false. At the moment, the only thing that would
        // interrupt a transition is another transition, so that it will momentarily be set to true
        // again, but this determines whether autorange or dragbox work, so it's for the sake of
        // cleanliness:
        gd._transitioning = false;
        gd._transtionWithDuration = false;

        return executeCallbacks(gd._transitionData._interruptCallbacks);
    }

    for(i = 0; i < traceIndices.length; i++) {
        traceIdx = traceIndices[i];
        var contFull = gd._fullData[traceIdx];
        var module = contFull._module;

        if(!module) continue;

        if(!module.animatable) {
            var thisUpdate = {};

            for(var ai in data[i]) {
                thisUpdate[ai] = [data[i][ai]];
            }
        }
    }

    var seq = [plots.previousPromises, interruptPreviousTransitions, prepareTransitions, executeTransitions];


    var transitionStarting = Lib.syncOrAsync(seq, gd);

    if(!transitionStarting || !transitionStarting.then) transitionStarting = Promise.resolve();

    return transitionStarting.then(function() {
        gd.emit('plotly_transitioning', []);
        return gd;
    });
};

plots.doCalcdata = function(gd, traces) {
    var axList = Plotly.Axes.list(gd),
        fullData = gd._fullData,
        fullLayout = gd._fullLayout,
        i;

    // XXX: Is this correct? Needs a closer look so that *some* traces can be recomputed without
    // *all* needing doCalcdata:
    var calcdata = new Array(fullData.length);
    var oldCalcdata = (gd.calcdata || []).slice(0);
    gd.calcdata = calcdata;

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
        // If traces were specified and this trace was not included, then transfer it over from
        // the old calcdata:
        if(Array.isArray(traces) && traces.indexOf(i) === -1) {
            calcdata[i] = oldCalcdata[i];
            continue;
        }

        var trace = fullData[i],
            _module = trace._module,
            cd = [];

        // If traces were specified and this trace was not included, then transfer it over from
        // the old calcdata:
        if(Array.isArray(traces) && traces.indexOf(i) === -1) {
            calcdata[i] = oldCalcdata[i];
            continue;
        }

        if(_module && trace.visible === true) {
            if(_module.calc) cd = _module.calc(gd, trace);
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

        calcdata[i] = cd;
    }
};

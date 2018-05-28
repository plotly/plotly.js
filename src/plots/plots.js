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

var Registry = require('../registry');
var PlotSchema = require('../plot_api/plot_schema');
var Lib = require('../lib');
var Color = require('../components/color');
var BADNUM = require('../constants/numerical').BADNUM;

var axisIDs = require('../plots/cartesian/axis_ids');
var sortBasePlotModules = require('./sort_modules').sortBasePlotModules;

var animationAttrs = require('./animation_attributes');
var frameAttrs = require('./frame_attributes');

var relinkPrivateKeys = Lib.relinkPrivateKeys;
var _ = Lib._;

var plots = module.exports = {};

// Expose registry methods on Plots for backward-compatibility
Lib.extendFlat(plots, Registry);

plots.attributes = require('./attributes');
plots.attributes.type.values = plots.allTypes;
plots.fontAttrs = require('./font_attributes');
plots.layoutAttributes = require('./layout_attributes');

// TODO make this a plot attribute?
plots.fontWeight = 'normal';

var transformsRegistry = plots.transformsRegistry;

var commandModule = require('./command');
plots.executeAPICommand = commandModule.executeAPICommand;
plots.computeAPICommandBindings = commandModule.computeAPICommandBindings;
plots.manageCommandObserver = commandModule.manageCommandObserver;
plots.hasSimpleAPICommandBindings = commandModule.hasSimpleAPICommandBindings;

// in some cases the browser doesn't seem to know how big
// the text is at first, so it needs to draw it,
// then wait a little, then draw it again
plots.redrawText = function(gd) {
    gd = Lib.getGraphDiv(gd);

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
    gd = Lib.getGraphDiv(gd);

    return new Promise(function(resolve, reject) {

        function isHidden(gd) {
            var display = window.getComputedStyle(gd).display;
            return !display || display === 'none';
        }

        if(!gd || isHidden(gd)) {
            reject(new Error('Resize must be passed a displayed plot div element.'));
        }

        if(gd._redrawTimer) clearTimeout(gd._redrawTimer);

        gd._redrawTimer = setTimeout(function() {
            // return if there is nothing to resize
            if(gd.layout.width && gd.layout.height) {
                resolve(gd);
                return;
            }

            delete gd.layout.width;
            delete gd.layout.height;

            // autosizing doesn't count as a change that needs saving
            var oldchanged = gd.changed;

            // nor should it be included in the undo queue
            gd.autoplay = true;

            Registry.call('relayout', gd, {autosize: true}).then(function() {
                gd.changed = oldchanged;
                resolve(gd);
            });
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
    // Do not do anything if showLink and showSources are not set to true in config
    if(!gd._context.showLink && !gd._context.showSources) return;

    var fullLayout = gd._fullLayout;

    var linkContainer = Lib.ensureSingle(fullLayout._paper, 'text', 'js-plot-link-container', function(s) {
        s.style({
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
    });

    // The text node inside svg
    var text = linkContainer.node();
    var attrs = {y: fullLayout._paper.attr('height') - 9};

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

var d3FormatKeys = [
    'days', 'shortDays', 'months', 'shortMonths', 'periods',
    'dateTime', 'date', 'time',
    'decimal', 'thousands', 'grouping', 'currency'
];

var extraFormatKeys = [
    'year', 'month', 'dayMonth', 'dayMonthYear'
];

/*
 * Fill in default values
 * @param {DOM element} gd
 * @param {object} opts
 * @param {boolean} opts.skipUpdateCalc: normally if the existing gd.calcdata looks
 *   compatible with the new gd._fullData we finish by linking the new _fullData traces
 *   to the old gd.calcdata, so it's correctly set if we're not going to recalc. But also,
 *   if there are calcTransforms on the trace, we first remap data arrays from the old full
 *   trace into the new one. Use skipUpdateCalc to defer this (needed by Plotly.react)
 *
 * gd.data, gd.layout:
 *   are precisely what the user specified (except as modified by cleanData/cleanLayout),
 *   these fields shouldn't be modified (except for filling in some auto values)
 *   nor used directly after the supply defaults step.
 *
 * gd._fullData, gd._fullLayout:
 *   are complete descriptions of how to draw the plot,
 *   use these fields in all required computations.
 *
 * gd._fullLayout._modules
 *   is a list of all the trace modules required to draw the plot.
 *
 * gd._fullLayout._basePlotModules
 *   is a list of all the plot modules required to draw the plot.
 *
 * gd._fullLayout._transformModules
 *   is a list of all the transform modules invoked.
 *
 */
plots.supplyDefaults = function(gd, opts) {
    var skipUpdateCalc = opts && opts.skipUpdateCalc;
    var oldFullLayout = gd._fullLayout || {};

    if(oldFullLayout._skipDefaults) {
        delete oldFullLayout._skipDefaults;
        return;
    }

    var newFullLayout = gd._fullLayout = {};
    var newLayout = gd.layout || {};

    var oldFullData = gd._fullData || [];
    var newFullData = gd._fullData = [];
    var newData = gd.data || [];

    var oldCalcdata = gd.calcdata || [];

    var context = gd._context || {};

    var i;

    // Create all the storage space for frames, but only if doesn't already exist
    if(!gd._transitionData) plots.createTransitionData(gd);

    // So we only need to do this once (and since we have gd here)
    // get the translated placeholder titles.
    // These ones get used as default values so need to be known at supplyDefaults
    // others keep their blank defaults but render the placeholder as desired later
    // TODO: make these work the same way, only inserting the placeholder text at draw time?
    // The challenge is that this has slightly different behavior right now in editable mode:
    // using the placeholder as default makes this text permanently (but lightly) visible,
    // but explicit '' for these titles gives you a placeholder that's hidden until you mouse
    // over it - so you're not distracted by it if you really don't want a title, but if you do
    // and you're new to plotly you may not be able to find it.
    // When editable=false the two behave the same, no title is drawn.
    newFullLayout._dfltTitle = {
        plot: _(gd, 'Click to enter Plot title'),
        x: _(gd, 'Click to enter X axis title'),
        y: _(gd, 'Click to enter Y axis title'),
        colorbar: _(gd, 'Click to enter Colorscale title'),
        annotation: _(gd, 'new text')
    };
    newFullLayout._traceWord = _(gd, 'trace');

    var formatObj = getFormatObj(gd, d3FormatKeys);

    // stash the token from context so mapbox subplots can use it as default
    newFullLayout._mapboxAccessToken = context.mapboxAccessToken;

    // first fill in what we can of layout without looking at data
    // because fullData needs a few things from layout
    if(oldFullLayout._initialAutoSizeIsDone) {

        // coerce the updated layout while preserving width and height
        var oldWidth = oldFullLayout.width,
            oldHeight = oldFullLayout.height;

        plots.supplyLayoutGlobalDefaults(newLayout, newFullLayout, formatObj);

        if(!newLayout.width) newFullLayout.width = oldWidth;
        if(!newLayout.height) newFullLayout.height = oldHeight;
    }
    else {

        // coerce the updated layout and autosize if needed
        plots.supplyLayoutGlobalDefaults(newLayout, newFullLayout, formatObj);

        var missingWidthOrHeight = (!newLayout.width || !newLayout.height),
            autosize = newFullLayout.autosize,
            autosizable = context.autosizable,
            initialAutoSize = missingWidthOrHeight && (autosize || autosizable);

        if(initialAutoSize) plots.plotAutoSize(gd, newLayout, newFullLayout);
        else if(missingWidthOrHeight) plots.sanitizeMargins(gd);

        // for backwards-compatibility with Plotly v1.x.x
        if(!autosize && missingWidthOrHeight) {
            newLayout.width = newFullLayout.width;
            newLayout.height = newFullLayout.height;
        }
    }

    newFullLayout._d3locale = getFormatter(formatObj, newFullLayout.separators);
    newFullLayout._extraFormat = getFormatObj(gd, extraFormatKeys);

    newFullLayout._initialAutoSizeIsDone = true;

    // keep track of how many traces are inputted
    newFullLayout._dataLength = newData.length;

    // clear the lists of trace and baseplot modules, and subplots
    newFullLayout._modules = [];
    newFullLayout._basePlotModules = [];
    var subplots = newFullLayout._subplots = emptySubplotLists();

    // initialize axis and subplot hash objects for splom-generated grids
    var splomAxes = newFullLayout._splomAxes = {x: {}, y: {}};
    var splomSubplots = newFullLayout._splomSubplots = {};
    // initialize splom grid defaults
    newFullLayout._splomGridDflt = {};

    // for traces to request a default rangeslider on their x axes
    // eg set `_requestRangeslider.x2 = true` for xaxis2
    newFullLayout._requestRangeslider = {};

    // then do the data
    newFullLayout._globalTransforms = (gd._context || {}).globalTransforms;
    plots.supplyDataDefaults(newData, newFullData, newLayout, newFullLayout);

    // redo grid size defaults with info about splom x/y axes,
    // and fill in generated cartesian axes and subplots
    var splomXa = Object.keys(splomAxes.x);
    var splomYa = Object.keys(splomAxes.y);
    if(splomXa.length > 1 && splomYa.length > 1) {
        Registry.getComponentMethod('grid', 'sizeDefaults')(newLayout, newFullLayout);

        for(i = 0; i < splomXa.length; i++) {
            Lib.pushUnique(subplots.xaxis, splomXa[i]);
        }
        for(i = 0; i < splomYa.length; i++) {
            Lib.pushUnique(subplots.yaxis, splomYa[i]);
        }
        for(var k in splomSubplots) {
            Lib.pushUnique(subplots.cartesian, k);
        }
    }

    // attach helper method to check whether a plot type is present on graph
    newFullLayout._has = plots._hasPlotType.bind(newFullLayout);

    // special cases that introduce interactions between traces
    var _modules = newFullLayout._modules;
    for(i = 0; i < _modules.length; i++) {
        var _module = _modules[i];
        if(_module.cleanData) _module.cleanData(newFullData);
    }

    if(oldFullData.length === newFullData.length) {
        for(i = 0; i < newFullData.length; i++) {
            relinkPrivateKeys(newFullData[i], oldFullData[i]);
        }
    }

    // finally, fill in the pieces of layout that may need to look at data
    plots.supplyLayoutModuleDefaults(newLayout, newFullLayout, newFullData, gd._transitionData);

    // turn on flag to optimize large splom-only graphs
    // mostly by omitting SVG layers during Cartesian.drawFramework
    newFullLayout._hasOnlyLargeSploms = (
        newFullLayout._basePlotModules.length === 1 &&
        newFullLayout._basePlotModules[0].name === 'splom' &&
        splomXa.length > 15 &&
        splomYa.length > 15 &&
        newFullLayout.shapes.length === 0 &&
        newFullLayout.images.length === 0
    );

    // TODO remove in v2.0.0
    // add has-plot-type refs to fullLayout for backward compatibility
    newFullLayout._hasCartesian = newFullLayout._has('cartesian');
    newFullLayout._hasGeo = newFullLayout._has('geo');
    newFullLayout._hasGL3D = newFullLayout._has('gl3d');
    newFullLayout._hasGL2D = newFullLayout._has('gl2d');
    newFullLayout._hasTernary = newFullLayout._has('ternary');
    newFullLayout._hasPie = newFullLayout._has('pie');

    // relink / initialize subplot axis objects
    plots.linkSubplots(newFullData, newFullLayout, oldFullData, oldFullLayout);

    // clean subplots and other artifacts from previous plot calls
    plots.cleanPlot(newFullData, newFullLayout, oldFullData, oldFullLayout, oldCalcdata);

    // relink functions and _ attributes to promote consistency between plots
    relinkPrivateKeys(newFullLayout, oldFullLayout);

    // TODO may return a promise
    plots.doAutoMargin(gd);

    // set scale after auto margin routine
    var axList = axisIDs.list(gd);
    for(i = 0; i < axList.length; i++) {
        var ax = axList[i];
        ax.setScale();
    }

    // update object references in calcdata
    if(!skipUpdateCalc && oldCalcdata.length === newFullData.length) {
        plots.supplyDefaultsUpdateCalc(oldCalcdata, newFullData);
    }

    // sort base plot modules for consistent ordering
    newFullLayout._basePlotModules.sort(sortBasePlotModules);
};

plots.supplyDefaultsUpdateCalc = function(oldCalcdata, newFullData) {
    for(var i = 0; i < newFullData.length; i++) {
        var newTrace = newFullData[i];
        var cd0 = oldCalcdata[i][0];
        if(cd0 && cd0.trace) {
            var oldTrace = cd0.trace;
            if(oldTrace._hasCalcTransform) {
                var arrayAttrs = oldTrace._arrayAttrs;
                var j, astr, oldArrayVal;

                for(j = 0; j < arrayAttrs.length; j++) {
                    astr = arrayAttrs[j];
                    oldArrayVal = Lib.nestedProperty(oldTrace, astr).get().slice();
                    Lib.nestedProperty(newTrace, astr).set(oldArrayVal);
                }
            }
            cd0.trace = newTrace;
        }
    }
};

/**
 * Make a container for collecting subplots we need to display.
 *
 * Finds all subplot types we need to enumerate once and caches it,
 * but makes a new output object each time.
 * Single-trace subplots (which have no `id`) such as pie, table, etc
 * do not need to be collected because we just draw all visible traces.
 */
var collectableSubplotTypes;
function emptySubplotLists() {
    var out = {};
    var i, j;

    if(!collectableSubplotTypes) {
        collectableSubplotTypes = [];

        var subplotsRegistry = Registry.subplotsRegistry;

        for(var subplotType in subplotsRegistry) {
            var subplotModule = subplotsRegistry[subplotType];
            var subplotAttr = subplotModule.attr;

            if(subplotAttr) {
                collectableSubplotTypes.push(subplotType);

                // special case, currently just for cartesian:
                // we need to enumerate axes, not just subplots
                if(Array.isArray(subplotAttr)) {
                    for(j = 0; j < subplotAttr.length; j++) {
                        Lib.pushUnique(collectableSubplotTypes, subplotAttr[j]);
                    }
                }
            }
        }
    }

    for(i = 0; i < collectableSubplotTypes.length; i++) {
        out[collectableSubplotTypes[i]] = [];
    }
    return out;
}

/**
 * getFormatObj: use _context to get the format object from locale.
 * Used to get d3.locale argument object and extraFormat argument object
 *
 * Regarding d3.locale argument :
 * decimal and thousands can be overridden later by layout.separators
 * grouping and currency are not presently used by our automatic number
 * formatting system but can be used by custom formats.
 *
 * @returns {object} d3.locale format object
 */
function getFormatObj(gd, formatKeys) {
    var locale = gd._context.locale;
    if(!locale) locale === 'en-US';

    var formatDone = false;
    var formatObj = {};

    function includeFormat(newFormat) {
        var formatFinished = true;
        for(var i = 0; i < formatKeys.length; i++) {
            var formatKey = formatKeys[i];
            if(!formatObj[formatKey]) {
                if(newFormat[formatKey]) {
                    formatObj[formatKey] = newFormat[formatKey];
                }
                else formatFinished = false;
            }
        }
        if(formatFinished) formatDone = true;
    }

    // same as localize, look for format parts in each format spec in the chain
    for(var i = 0; i < 2; i++) {
        var locales = gd._context.locales;
        for(var j = 0; j < 2; j++) {
            var formatj = (locales[locale] || {}).format;
            if(formatj) {
                includeFormat(formatj);
                if(formatDone) break;
            }
            locales = Registry.localeRegistry;
        }

        var baseLocale = locale.split('-')[0];
        if(formatDone || baseLocale === locale) break;
        locale = baseLocale;
    }

    // lastly pick out defaults from english (non-US, as DMY is so much more common)
    if(!formatDone) includeFormat(Registry.localeRegistry.en.format);

    return formatObj;
}

/**
 * getFormatter: combine the final separators with the locale formatting object
 * we pulled earlier to generate number and time formatters
 * TODO: remove separators in v2, only use locale, so we don't need this step?
 *
 * @param {object} formatObj: d3.locale format object
 * @param {string} separators: length-2 string to override decimal and thousands
 *   separators in number formatting
 *
 * @returns {object} {numberFormat, timeFormat} d3 formatter factory functions
 *   for numbers and time
 */
function getFormatter(formatObj, separators) {
    formatObj.decimal = separators.charAt(0);
    formatObj.thousands = separators.charAt(1);

    return d3.locale(formatObj);
}

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
// or trace has a category
plots._hasPlotType = function(category) {
    var i;

    // check base plot modules
    var basePlotModules = this._basePlotModules || [];
    for(i = 0; i < basePlotModules.length; i++) {
        if(basePlotModules[i].name === category) return true;
    }

    // check trace modules
    var modules = this._modules || [];
    for(i = 0; i < modules.length; i++) {
        var name = modules[i].name;
        if(name === category) return true;
        // N.B. this is modules[i] along with 'categories' as a hash object
        var _module = Registry.modules[name];
        if(_module && _module.categories[category]) return true;
    }

    return false;
};

plots.cleanPlot = function(newFullData, newFullLayout, oldFullData, oldFullLayout, oldCalcdata) {
    var i, j;

    var basePlotModules = oldFullLayout._basePlotModules || [];
    for(i = 0; i < basePlotModules.length; i++) {
        var _module = basePlotModules[i];

        if(_module.clean) {
            _module.clean(newFullData, newFullLayout, oldFullData, oldFullLayout, oldCalcdata);
        }
    }

    var hadGl = oldFullLayout._has && oldFullLayout._has('gl');
    var hasGl = newFullLayout._has && newFullLayout._has('gl');

    if(hadGl && !hasGl) {
        if(oldFullLayout._glcontainer !== undefined) {
            oldFullLayout._glcontainer.selectAll('.gl-canvas').remove();
            oldFullLayout._glcanvas = null;
        }
    }

    var hasInfoLayer = !!oldFullLayout._infolayer;

    oldLoop:
    for(i = 0; i < oldFullData.length; i++) {
        var oldTrace = oldFullData[i],
            oldUid = oldTrace.uid;

        for(j = 0; j < newFullData.length; j++) {
            var newTrace = newFullData[j];

            if(oldUid === newTrace.uid) continue oldLoop;
        }

        // clean old colorbars
        if(hasInfoLayer) {
            oldFullLayout._infolayer.select('.cb' + oldUid).remove();
        }
    }

    if(oldFullLayout._zoomlayer) {
        oldFullLayout._zoomlayer.selectAll('.select-outline').remove();
    }
};

plots.linkSubplots = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var oldSubplots = oldFullLayout._plots || {};
    var newSubplots = newFullLayout._plots = {};
    var newSubplotList = newFullLayout._subplots;

    var mockGd = {
        _fullData: newFullData,
        _fullLayout: newFullLayout
    };

    var ids = newSubplotList.cartesian.concat(newSubplotList.gl2d || []);

    var i, j, id, ax;

    for(i = 0; i < ids.length; i++) {
        id = ids[i];
        var oldSubplot = oldSubplots[id];
        var xaxis = axisIDs.getFromId(mockGd, id, 'x');
        var yaxis = axisIDs.getFromId(mockGd, id, 'y');
        var plotinfo;

        if(oldSubplot) {
            plotinfo = newSubplots[id] = oldSubplot;

            if(plotinfo.xaxis.layer !== xaxis.layer) {
                plotinfo.xlines.attr('d', null);
                plotinfo.xaxislayer.selectAll('*').remove();
            }

            if(plotinfo.yaxis.layer !== yaxis.layer) {
                plotinfo.ylines.attr('d', null);
                plotinfo.yaxislayer.selectAll('*').remove();
            }
        } else {
            plotinfo = newSubplots[id] = {};
            plotinfo.id = id;
        }

        plotinfo.xaxis = xaxis;
        plotinfo.yaxis = yaxis;

        // By default, we clip at the subplot level,
        // but if one trace on a given subplot has *cliponaxis* set to false,
        // we need to clip at the trace module layer level;
        // find this out here, once of for all.
        plotinfo._hasClipOnAxisFalse = false;

        for(j = 0; j < newFullData.length; j++) {
            var trace = newFullData[j];

            if(
                trace.xaxis === plotinfo.xaxis._id &&
                trace.yaxis === plotinfo.yaxis._id &&
                trace.cliponaxis === false
            ) {
                plotinfo._hasClipOnAxisFalse = true;
                break;
            }
        }
    }

    // while we're at it, link overlaying axes to their main axes and
    // anchored axes to the axes they're anchored to
    var axList = axisIDs.list(mockGd, null, true);
    for(i = 0; i < axList.length; i++) {
        ax = axList[i];
        var mainAx = null;

        if(ax.overlaying) {
            mainAx = axisIDs.getFromId(mockGd, ax.overlaying);

            // you cannot overlay an axis that's already overlaying another
            if(mainAx && mainAx.overlaying) {
                ax.overlaying = false;
                mainAx = null;
            }
        }
        ax._mainAxis = mainAx || ax;

        /*
         * For now force overlays to overlay completely... so they
         * can drag together correctly and share backgrounds.
         * Later perhaps we make separate axis domain and
         * tick/line domain or something, so they can still share
         * the (possibly larger) dragger and background but don't
         * have to both be drawn over that whole domain
         */
        if(mainAx) ax.domain = mainAx.domain.slice();

        ax._anchorAxis = ax.anchor === 'free' ?
            null :
            axisIDs.getFromId(mockGd, ax.anchor);
    }
};

// This function clears any trace attributes with valType: color and
// no set dflt filed in the plot schema. This is needed because groupby (which
// is the only transform for which this currently applies) supplies parent
// trace defaults, then expanded trace defaults. The result is that `null`
// colors are default-supplied and inherited as a color instead of a null.
// The result is that expanded trace default colors have no effect, with
// the final result that groups are indistinguishable. This function clears
// those colors so that individual groupby groups get unique colors.
plots.clearExpandedTraceDefaultColors = function(trace) {
    var colorAttrs, path, i;

    // This uses weird closure state in order to satisfy the linter rule
    // that we can't create functions in a loop.
    function locateColorAttrs(attr, attrName, attrs, level) {
        path[level] = attrName;
        path.length = level + 1;
        if(attr.valType === 'color' && attr.dflt === undefined) {
            colorAttrs.push(path.join('.'));
        }
    }

    path = [];

    // Get the cached colorAttrs:
    colorAttrs = trace._module._colorAttrs;

    // Or else compute and cache the colorAttrs on the module:
    if(!colorAttrs) {
        trace._module._colorAttrs = colorAttrs = [];
        PlotSchema.crawl(
            trace._module.attributes,
            locateColorAttrs
        );
    }

    for(i = 0; i < colorAttrs.length; i++) {
        var origprop = Lib.nestedProperty(trace, '_input.' + colorAttrs[i]);

        if(!origprop.get()) {
            Lib.nestedProperty(trace, colorAttrs[i]).set(null);
        }
    }
};


plots.supplyDataDefaults = function(dataIn, dataOut, layout, fullLayout) {
    var modules = fullLayout._modules;
    var basePlotModules = fullLayout._basePlotModules;
    var cnt = 0;
    var colorCnt = 0;

    var i, fullTrace, trace;

    fullLayout._transformModules = [];

    function pushModule(fullTrace) {
        dataOut.push(fullTrace);

        var _module = fullTrace._module;
        if(!_module) return;

        if(fullTrace.visible === true) Lib.pushUnique(modules, _module);
        Lib.pushUnique(basePlotModules, fullTrace._module.basePlotModule);

        cnt++;

        // TODO: do we really want color not to increment for explicitly invisible traces?
        // This logic is weird, but matches previous behavior: traces that you explicitly
        // set to visible:false do not increment the color, but traces WE determine to be
        // empty or invalid (and thus set to visible:false) DO increment color.
        // I kind of think we should just let all traces increment color, visible or not.
        // see mock: axes-autotype-empty vs. a test of restyling visible: false that
        // I can't find right now...
        if(fullTrace._input.visible !== false) colorCnt++;
    }

    var carpetIndex = {};
    var carpetDependents = [];

    for(i = 0; i < dataIn.length; i++) {
        trace = dataIn[i];
        fullTrace = plots.supplyTraceDefaults(trace, colorCnt, fullLayout, i);

        fullTrace.index = i;
        fullTrace._input = trace;
        fullTrace._expandedIndex = cnt;

        if(fullTrace.transforms && fullTrace.transforms.length) {
            var expandedTraces = applyTransforms(fullTrace, dataOut, layout, fullLayout);

            for(var j = 0; j < expandedTraces.length; j++) {
                var expandedTrace = expandedTraces[j];
                var fullExpandedTrace = plots.supplyTraceDefaults(expandedTrace, cnt, fullLayout, i);

                // relink private (i.e. underscore) keys expanded trace to full expanded trace so
                // that transform supply-default methods can set _ keys for future use.
                relinkPrivateKeys(fullExpandedTrace, expandedTrace);

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
            // add identify refs for consistency with transformed traces
            fullTrace._fullInput = fullTrace;
            fullTrace._expandedInput = fullTrace;

            pushModule(fullTrace);
        }

        if(Registry.traceIs(fullTrace, 'carpetAxis')) {
            carpetIndex[fullTrace.carpet] = fullTrace;
        }

        if(Registry.traceIs(fullTrace, 'carpetDependent')) {
            carpetDependents.push(i);
        }
    }

    for(i = 0; i < carpetDependents.length; i++) {
        fullTrace = dataOut[carpetDependents[i]];

        if(!fullTrace.visible) continue;

        var carpetAxis = carpetIndex[fullTrace.carpet];
        fullTrace._carpet = carpetAxis;

        if(!carpetAxis || !carpetAxis.visible) {
            fullTrace.visible = false;
            continue;
        }

        fullTrace.xaxis = carpetAxis.xaxis;
        fullTrace.yaxis = carpetAxis.yaxis;
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
    coerce('direction');
    coerce('fromcurrent');

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

plots.supplyTraceDefaults = function(traceIn, colorIndex, layout, traceInIndex) {
    var colorway = layout.colorway || Color.defaults;
    var traceOut = {},
        defaultColor = colorway[colorIndex % colorway.length];

    var i;

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, plots.attributes, attr, dflt);
    }

    var visible = coerce('visible');

    coerce('type');
    coerce('uid');
    coerce('name', layout._traceWord + ' ' + traceInIndex);

    // we want even invisible traces to make their would-be subplots visible
    // so coerce the subplot id(s) now no matter what
    var _module = plots.getModule(traceOut);
    traceOut._module = _module;
    if(_module) {
        var basePlotModule = _module.basePlotModule;
        var subplotAttr = basePlotModule.attr;
        var subplotAttrs = basePlotModule.attributes;
        if(subplotAttr && subplotAttrs) {
            var subplots = layout._subplots;
            var subplotId = '';

            // TODO - currently if we draw an empty gl2d subplot, it draws
            // nothing then gets stuck and you can't get it back without newPlot
            // sort this out in the regl refactor? but for now just drop empty gl2d subplots
            if(basePlotModule.name !== 'gl2d' || visible) {
                if(Array.isArray(subplotAttr)) {
                    for(i = 0; i < subplotAttr.length; i++) {
                        var attri = subplotAttr[i];
                        var vali = Lib.coerce(traceIn, traceOut, subplotAttrs, attri);

                        if(subplots[attri]) Lib.pushUnique(subplots[attri], vali);
                        subplotId += vali;
                    }
                }
                else {
                    subplotId = Lib.coerce(traceIn, traceOut, subplotAttrs, subplotAttr);
                }

                if(subplots[basePlotModule.name]) {
                    Lib.pushUnique(subplots[basePlotModule.name], subplotId);
                }
            }
        }
    }

    if(visible) {
        coerce('customdata');
        coerce('ids');

        if(Registry.traceIs(traceOut, 'showLegend')) {
            coerce('showlegend');
            coerce('legendgroup');
        }

        Registry.getComponentMethod(
            'fx',
            'supplyDefaults'
        )(traceIn, traceOut, defaultColor, layout);

        // TODO add per-base-plot-module trace defaults step

        if(_module) {
            _module.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            Lib.coerceHoverinfo(traceIn, traceOut, layout);
        }

        if(!Registry.traceIs(traceOut, 'noOpacity')) coerce('opacity');

        if(Registry.traceIs(traceOut, 'notLegendIsolatable')) {
            // This clears out the legendonly state for traces like carpet that
            // cannot be isolated in the legend
            traceOut.visible = !!traceOut.visible;
        }

        if(_module && _module.selectPoints) {
            coerce('selectedpoints');
        }

        plots.supplyTransformDefaults(traceIn, traceOut, layout);
    }

    return traceOut;
};

plots.supplyTransformDefaults = function(traceIn, traceOut, layout) {
    // For now we only allow transforms on 1D traces, ie those that specify a _length.
    // If we were to implement 2D transforms, we'd need to have each transform
    // describe its own applicability and disable itself when it doesn't apply.
    if(!traceOut._length) return;

    var globalTransforms = layout._globalTransforms || [];
    var transformModules = layout._transformModules || [];

    if(!Array.isArray(traceIn.transforms) && globalTransforms.length === 0) return;

    var containerIn = traceIn.transforms || [],
        transformList = globalTransforms.concat(containerIn),
        containerOut = traceOut.transforms = [];

    for(var i = 0; i < transformList.length; i++) {
        var transformIn = transformList[i],
            type = transformIn.type,
            _module = transformsRegistry[type],
            transformOut;

        /*
         * Supply defaults may run twice. First pass runs all supply defaults steps
         * and adds the _module to any output transforms.
         * If transforms exist another pass is run so that any generated traces also
         * go through supply defaults. This has the effect of rerunning
         * supplyTransformDefaults. If the transform does not have a `transform`
         * function it could not have generated any new traces and the second stage
         * is unnecessary. We detect this case with the following variables.
         */
        var isFirstStage = !(transformIn._module && transformIn._module === _module),
            doLaterStages = _module && typeof _module.transform === 'function';

        if(!_module) Lib.warn('Unrecognized transform type ' + type + '.');

        if(_module && _module.supplyDefaults && (isFirstStage || doLaterStages)) {
            transformOut = _module.supplyDefaults(transformIn, traceOut, layout, traceIn);
            transformOut.type = type;
            transformOut._module = _module;

            Lib.pushUnique(transformModules, _module);
        }
        else {
            transformOut = Lib.extendFlat({}, transformIn);
        }

        containerOut.push(transformOut);
    }
};

function applyTransforms(fullTrace, fullData, layout, fullLayout) {
    var container = fullTrace.transforms,
        dataOut = [fullTrace];

    for(var i = 0; i < container.length; i++) {
        var transform = container[i],
            _module = transformsRegistry[transform.type];

        if(_module && _module.transform) {
            dataOut = _module.transform(dataOut, {
                transform: transform,
                fullTrace: fullTrace,
                fullData: fullData,
                layout: layout,
                fullLayout: fullLayout,
                transformIndex: i
            });
        }
    }

    return dataOut;
}

plots.supplyLayoutGlobalDefaults = function(layoutIn, layoutOut, formatObj) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, plots.layoutAttributes, attr, dflt);
    }

    var globalFont = Lib.coerceFont(coerce, 'font');

    coerce('title', layoutOut._dfltTitle.plot);

    Lib.coerceFont(coerce, 'titlefont', {
        family: globalFont.family,
        size: Math.round(globalFont.size * 1.4),
        color: globalFont.color
    });

    // Make sure that autosize is defaulted to *true*
    // on layouts with no set width and height for backward compatibly,
    // in particular https://plot.ly/javascript/responsive-fluid-layout/
    //
    // Before https://github.com/plotly/plotly.js/pull/635 ,
    // layouts with no set width and height were set temporary set to 'initial'
    // to pass through the autosize routine
    //
    // This behavior is subject to change in v2.
    coerce('autosize', !(layoutIn.width && layoutIn.height));

    coerce('width');
    coerce('height');
    coerce('margin.l');
    coerce('margin.r');
    coerce('margin.t');
    coerce('margin.b');
    coerce('margin.pad');
    coerce('margin.autoexpand');

    if(layoutIn.width && layoutIn.height) plots.sanitizeMargins(layoutOut);

    Registry.getComponentMethod('grid', 'sizeDefaults')(layoutIn, layoutOut);

    coerce('paper_bgcolor');

    coerce('separators', formatObj.decimal + formatObj.thousands);
    coerce('hidesources');

    coerce('colorway');

    coerce('datarevision');

    Registry.getComponentMethod(
        'calendars',
        'handleDefaults'
    )(layoutIn, layoutOut, 'calendar');

    Registry.getComponentMethod(
        'fx',
        'supplyLayoutGlobalDefaults'
    )(layoutIn, layoutOut, coerce);
};

plots.plotAutoSize = function plotAutoSize(gd, layout, fullLayout) {
    var context = gd._context || {},
        frameMargins = context.frameMargins,
        newWidth,
        newHeight;

    var isPlotDiv = Lib.isPlotDiv(gd);

    if(isPlotDiv) gd.emit('plotly_autosize');

    // embedded in an iframe - just take the full iframe size
    // if we get to this point, with no aspect ratio restrictions
    if(context.fillFrame) {
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;

        // somehow we get a few extra px height sometimes...
        // just hide it
        document.body.style.overflow = 'hidden';
    }
    else if(isNumeric(frameMargins) && frameMargins > 0) {
        var reservedMargins = calculateReservedMargins(gd._boundingBoxMargins),
            reservedWidth = reservedMargins.left + reservedMargins.right,
            reservedHeight = reservedMargins.bottom + reservedMargins.top,
            factor = 1 - 2 * frameMargins;

        var gdBB = fullLayout._container && fullLayout._container.node ?
            fullLayout._container.node().getBoundingClientRect() : {
                width: fullLayout.width,
                height: fullLayout.height
            };

        newWidth = Math.round(factor * (gdBB.width - reservedWidth));
        newHeight = Math.round(factor * (gdBB.height - reservedHeight));
    }
    else {
        // plotly.js - let the developers do what they want, either
        // provide height and width for the container div,
        // specify size in layout, or take the defaults,
        // but don't enforce any ratio restrictions
        var computedStyle = isPlotDiv ? window.getComputedStyle(gd) : {};

        newWidth = parseFloat(computedStyle.width) || fullLayout.width;
        newHeight = parseFloat(computedStyle.height) || fullLayout.height;
    }

    var minWidth = plots.layoutAttributes.width.min,
        minHeight = plots.layoutAttributes.height.min;
    if(newWidth < minWidth) newWidth = minWidth;
    if(newHeight < minHeight) newHeight = minHeight;

    var widthHasChanged = !layout.width &&
            (Math.abs(fullLayout.width - newWidth) > 1),
        heightHasChanged = !layout.height &&
            (Math.abs(fullLayout.height - newHeight) > 1);

    if(heightHasChanged || widthHasChanged) {
        if(widthHasChanged) fullLayout.width = newWidth;
        if(heightHasChanged) fullLayout.height = newHeight;
    }

    // cache initial autosize value, used in relayout when
    // width or height values are set to null
    if(!gd._initialAutoSize) {
        gd._initialAutoSize = { width: newWidth, height: newHeight };
    }

    plots.sanitizeMargins(fullLayout);
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

plots.supplyLayoutModuleDefaults = function(layoutIn, layoutOut, fullData, transitionData) {
    var componentsRegistry = Registry.componentsRegistry;
    var basePlotModules = layoutOut._basePlotModules;
    var component, i, _module;

    var Cartesian = Registry.subplotsRegistry.cartesian;

    // check if any components need to add more base plot modules
    // that weren't captured by traces
    for(component in componentsRegistry) {
        _module = componentsRegistry[component];

        if(_module.includeBasePlot) {
            _module.includeBasePlot(layoutIn, layoutOut);
        }
    }

    // make sure we *at least* have some cartesian axes
    if(!basePlotModules.length) {
        basePlotModules.push(Cartesian);
    }

    // ensure all cartesian axes have at least one subplot
    if(layoutOut._has('cartesian')) {
        Registry.getComponentMethod('grid', 'contentDefaults')(layoutIn, layoutOut);
        Cartesian.finalizeSubplots(layoutIn, layoutOut);
    }

    // sort subplot lists
    for(var subplotType in layoutOut._subplots) {
        layoutOut._subplots[subplotType].sort(Lib.subplotSort);
    }

    // base plot module layout defaults
    for(i = 0; i < basePlotModules.length; i++) {
        _module = basePlotModules[i];

        // e.g. pie does not have a layout-defaults step
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

    // transform module layout defaults
    var transformModules = layoutOut._transformModules;
    for(i = 0; i < transformModules.length; i++) {
        _module = transformModules[i];

        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData, transitionData);
        }
    }

    for(component in componentsRegistry) {
        _module = componentsRegistry[component];

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
    if(fullLayout._glcontainer !== undefined) {
        fullLayout._glcontainer.selectAll('.gl-canvas').remove();
        fullLayout._glcontainer.remove();
        fullLayout._glcanvas = null;
    }
    if(fullLayout._geocontainer !== undefined) fullLayout._geocontainer.remove();

    // remove modebar
    if(fullLayout._modeBar) fullLayout._modeBar.destroy();

    if(gd._transitionData) {
        // Ensure any dangling callbacks are simply dropped if the plot is purged.
        // This is more or less only actually important for testing.
        if(gd._transitionData._interruptCallbacks) {
            gd._transitionData._interruptCallbacks.length = 0;
        }

        if(gd._transitionData._animationRaf) {
            window.cancelAnimationFrame(gd._transitionData._animationRaf);
        }
    }

    // remove any planned throttles
    Lib.clearThrottle();

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
    delete gd._promises;
    delete gd._redrawTimer;
    delete gd.firstscatter;
    delete gd._hmlumcount;
    delete gd._hmpixcount;
    delete gd._transitionData;
    delete gd._transitioning;
    delete gd._initialAutoSize;
    delete gd._transitioningWithDuration;

    // created during certain events, that *should* clean them up
    // themselves, but may not if there was an error
    delete gd._dragging;
    delete gd._dragged;
    delete gd._hoverdata;
    delete gd._snapshotInProgress;
    delete gd._editing;
    delete gd._replotPending;
    delete gd._mouseDownTime;
    delete gd._legendMouseDownTime;

    // remove all event listeners
    if(gd.removeAllListeners) gd.removeAllListeners();
};

plots.style = function(gd) {
    var _modules = gd._fullLayout._modules;
    var styleModules = [];
    var i;

    // some trace modules reuse the same style method,
    // make sure to not unnecessary call them multiple times.

    for(i = 0; i < _modules.length; i++) {
        var _module = _modules[i];
        if(_module.style) {
            Lib.pushUnique(styleModules, _module.style);
        }
    }

    for(i = 0; i < styleModules.length; i++) {
        styleModules[i](gd);
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

// called by components to see if we need to
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

        if(!fullLayout._replotting) plots.doAutoMargin(gd);
    }
};

plots.doAutoMargin = function(gd) {
    var fullLayout = gd._fullLayout;
    if(!fullLayout._size) fullLayout._size = {};
    if(!fullLayout._pushmargin) fullLayout._pushmargin = {};

    var gs = fullLayout._size,
        oldmargins = JSON.stringify(gs);

    // adjust margins for outside components
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

        for(var k1 in pm) {

            var pushleft = pm[k1].l || {},
                pushbottom = pm[k1].b || {},
                fl = pushleft.val,
                pl = pushleft.size,
                fb = pushbottom.val,
                pb = pushbottom.size;

            for(var k2 in pm) {
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
            }
        }
    }

    gs.l = Math.round(ml);
    gs.r = Math.round(mr);
    gs.t = Math.round(mt);
    gs.b = Math.round(mb);
    gs.p = Math.round(fullLayout.margin.pad);
    gs.w = Math.round(fullLayout.width) - gs.l - gs.r;
    gs.h = Math.round(fullLayout.height) - gs.t - gs.b;

    // if things changed and we're not already redrawing, trigger a redraw
    if(!fullLayout._replotting && oldmargins !== '{}' &&
            oldmargins !== JSON.stringify(fullLayout._size)) {
        return Registry.call('plot', gd);
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
        layout = (useDefaults) ? gd._fullLayout : gd.layout,
        frames = (gd._transitionData || {})._frames;

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
        if(Lib.isJSDate(d)) return Lib.ms2DateTimeLocal(+d);

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

    if(frames) obj.frames = stripObj(frames);

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
    var _frameHash = gd._transitionData._frameHash;

    for(i = 0; i < operations.length; i++) {
        op = operations[i];

        switch(op.type) {
            // No reason this couldn't exist, but is currently unused/untested:
            /* case 'rename':
                frame = _frames[op.index];
                delete _frameHash[frame.name];
                _frameHash[op.name] = frame;
                frame.name = op.name;
                break;*/
            case 'replace':
                frame = op.value;
                var oldName = (_frames[op.index] || {}).name;
                var newName = frame.name;
                _frames[op.index] = _frameHash[newName] = frame;

                if(newName !== oldName) {
                    // If name has changed in addition to replacement, then update
                    // the lookup table:
                    delete _frameHash[oldName];
                    _frameHash[newName] = frame;
                }

                break;
            case 'insert':
                frame = op.value;
                _frameHash[frame.name] = frame;
                _frames.splice(op.index, 0, frame);
                break;
            case 'delete':
                frame = _frames[op.index];
                delete _frameHash[frame.name];
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
    var i, traceIndices, traceIndex, destIndex;

    // Null or undefined will fail on .toString(). We'll allow numbers since we
    // make it clear frames must be given string names, but we'll allow numbers
    // here since they're otherwise fine for looking up frames as long as they're
    // properly cast to strings. We really just want to ensure here that this
    // 1) doesn't fail, and
    // 2) doens't give an incorrect answer (which String(frameName) would)
    if(!frameName) {
        throw new Error('computeFrame must be given a string frame name');
    }

    var framePtr = frameLookup[frameName.toString()];

    // Return false if the name is invalid:
    if(!framePtr) {
        return false;
    }

    var frameStack = [framePtr];
    var frameNameStack = [framePtr.name];

    // Follow frame pointers:
    while(framePtr.baseframe && (framePtr = frameLookup[framePtr.baseframe.toString()])) {
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
            result.layout = plots.extendLayout(result.layout, framePtr.layout);
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

                result.data[destIndex] = plots.extendTrace(result.data[destIndex], framePtr.data[i]);
            }
        }
    }

    return result;
};

/*
 * Recompute the lookup table that maps frame name -> frame object. addFrames/
 * deleteFrames already manages this data one at a time, so the only time this
 * is necessary is if you poke around manually in `gd._transitionData._frames`
 * and create and haven't updated the lookup table.
 */
plots.recomputeFrameHash = function(gd) {
    var hash = gd._transitionData._frameHash = {};
    var frames = gd._transitionData._frames;
    for(var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        if(frame && frame.name) {
            hash[frame.name] = frame;
        }
    }
};

/**
 * Extend an object, treating container arrays very differently by extracting
 * their contents and merging them separately.
 *
 * This exists so that we can extendDeepNoArrays and avoid stepping into data
 * arrays without knowledge of the plot schema, but so that we may also manually
 * recurse into known container arrays, such as transforms.
 *
 * See extendTrace and extendLayout below for usage.
 */
plots.extendObjectWithContainers = function(dest, src, containerPaths) {
    var containerProp, containerVal, i, j, srcProp, destProp, srcContainer, destContainer;
    var copy = Lib.extendDeepNoArrays({}, src || {});
    var expandedObj = Lib.expandObjectPaths(copy);
    var containerObj = {};

    // Step through and extract any container properties. Otherwise extendDeepNoArrays
    // will clobber any existing properties with an empty array and then supplyDefaults
    // will reset everything to defaults.
    if(containerPaths && containerPaths.length) {
        for(i = 0; i < containerPaths.length; i++) {
            containerProp = Lib.nestedProperty(expandedObj, containerPaths[i]);
            containerVal = containerProp.get();

            if(containerVal === undefined) {
                Lib.nestedProperty(containerObj, containerPaths[i]).set(null);
            }
            else {
                containerProp.set(null);
                Lib.nestedProperty(containerObj, containerPaths[i]).set(containerVal);
            }
        }
    }

    dest = Lib.extendDeepNoArrays(dest || {}, expandedObj);

    if(containerPaths && containerPaths.length) {
        for(i = 0; i < containerPaths.length; i++) {
            srcProp = Lib.nestedProperty(containerObj, containerPaths[i]);
            srcContainer = srcProp.get();

            if(!srcContainer) continue;

            destProp = Lib.nestedProperty(dest, containerPaths[i]);
            destContainer = destProp.get();

            if(!Array.isArray(destContainer)) {
                destContainer = [];
                destProp.set(destContainer);
            }

            for(j = 0; j < srcContainer.length; j++) {
                var srcObj = srcContainer[j];

                if(srcObj === null) destContainer[j] = null;
                else {
                    destContainer[j] = plots.extendObjectWithContainers(destContainer[j], srcObj);
                }
            }

            destProp.set(destContainer);
        }
    }

    return dest;
};

plots.dataArrayContainers = ['transforms', 'dimensions'];
plots.layoutArrayContainers = Registry.layoutArrayContainers;

/*
 * Extend a trace definition. This method:
 *
 *  1. directly transfers any array references
 *  2. manually recurses into container arrays like transforms
 *
 * The result is the original object reference with the new contents merged in.
 */
plots.extendTrace = function(destTrace, srcTrace) {
    return plots.extendObjectWithContainers(destTrace, srcTrace, plots.dataArrayContainers);
};

/*
 * Extend a layout definition. This method:
 *
 *  1. directly transfers any array references (not critically important for
 *     layout since there aren't really data arrays)
 *  2. manually recurses into container arrays like annotations
 *
 * The result is the original object reference with the new contents merged in.
 */
plots.extendLayout = function(destLayout, srcLayout) {
    return plots.extendObjectWithContainers(destLayout, srcLayout, plots.layoutArrayContainers);
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

            // There's nothing to do if this module is not defined:
            if(!module) continue;

            // Don't register the trace as transitioned if it doens't know what to do.
            // If it *is* registered, it will receive a callback that it's responsible
            // for calling in order to register the transition as having completed.
            if(module.animatable) {
                transitionedTraces.push(traceIdx);
            }

            gd.data[traceIndices[i]] = plots.extendTrace(gd.data[traceIndices[i]], data[i]);
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

        plots.extendLayout(gd.layout, layoutUpdate);

        // Supply defaults after applying the incoming properties. Note that any attempt
        // to simplify this step and reduce the amount of work resulted in the reconstruction
        // of essentially the whole supplyDefaults step, so that it seems sensible to just use
        // supplyDefaults even though it's heavier than would otherwise be desired for
        // transitions:

        // first delete calcdata so supplyDefaults knows a calc step is coming
        delete gd.calcdata;

        plots.supplyDefaults(gd);

        plots.doCalcdata(gd);

        Registry.getComponentMethod('errorbars', 'calc')(gd);

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

        gd.emit('plotly_transitioning', []);

        return new Promise(function(resolve) {
            // This flag is used to disabled things like autorange:
            gd._transitioning = true;

            // When instantaneous updates are coming through quickly, it's too much to simply disable
            // all interaction, so store this flag so we can disambiguate whether mouse interactions
            // should be fully disabled or not:
            if(transitionOpts.duration > 0) {
                gd._transitioningWithDuration = true;
            }


            // If another transition is triggered, this callback will be executed simply because it's
            // in the interruptCallbacks queue. If this transition completes, it will instead flush
            // that queue and forget about this callback.
            gd._transitionData._interruptCallbacks.push(function() {
                aborted = true;
            });

            if(frameOpts.redraw) {
                gd._transitionData._interruptCallbacks.push(function() {
                    return Registry.call('redraw', gd);
                });
            }

            // Emit this and make sure it happens last:
            gd._transitionData._interruptCallbacks.push(function() {
                gd.emit('plotly_transitioninterrupted', []);
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
        // This a simple workaround for tests which purge the graph before animations
        // have completed. That's not a very common case, so this is the simplest
        // fix.
        if(!gd._transitionData) return;

        flushCallbacks(gd._transitionData._interruptCallbacks);

        return Promise.resolve().then(function() {
            if(frameOpts.redraw) {
                return Registry.call('redraw', gd);
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
        // Fail-safe against purged plot:
        if(!gd._transitionData) return;

        // If a transition is interrupted, set this to false. At the moment, the only thing that would
        // interrupt a transition is another transition, so that it will momentarily be set to true
        // again, but this determines whether autorange or dragbox work, so it's for the sake of
        // cleanliness:
        gd._transitioning = false;

        return executeCallbacks(gd._transitionData._interruptCallbacks);
    }

    for(i = 0; i < traceIndices.length; i++) {
        traceIdx = traceIndices[i];
        var contFull = gd._fullData[traceIdx];
        var module = contFull._module;

        if(!module) continue;
    }

    var seq = [plots.previousPromises, interruptPreviousTransitions, prepareTransitions, plots.rehover, executeTransitions];

    var transitionStarting = Lib.syncOrAsync(seq, gd);

    if(!transitionStarting || !transitionStarting.then) {
        transitionStarting = Promise.resolve();
    }

    return transitionStarting.then(function() {
        return gd;
    });
};

plots.doCalcdata = function(gd, traces) {
    var axList = axisIDs.list(gd),
        fullData = gd._fullData,
        fullLayout = gd._fullLayout;

    var trace, _module, i, j;

    // XXX: Is this correct? Needs a closer look so that *some* traces can be recomputed without
    // *all* needing doCalcdata:
    var calcdata = new Array(fullData.length);
    var oldCalcdata = (gd.calcdata || []).slice(0);
    gd.calcdata = calcdata;

    // extra helper variables
    // firstscatter: fill-to-next on the first trace goes to zero
    gd.firstscatter = true;

    // how many box/violins plots do we have (in case they're grouped)
    fullLayout._numBoxes = 0;
    fullLayout._numViolins = 0;

    // initialize violin per-scale-group stats container
    fullLayout._violinScaleGroupStats = {};

    // for calculating avg luminosity of heatmaps
    gd._hmpixcount = 0;
    gd._hmlumcount = 0;

    // for sharing colors across pies (and for legend)
    fullLayout._piecolormap = {};
    fullLayout._piecolorway = null;
    fullLayout._piedefaultcolorcount = 0;

    // If traces were specified and this trace was not included,
    // then transfer it over from the old calcdata:
    for(i = 0; i < fullData.length; i++) {
        if(Array.isArray(traces) && traces.indexOf(i) === -1) {
            calcdata[i] = oldCalcdata[i];
            continue;
        }
    }

    // find array attributes in trace
    for(i = 0; i < fullData.length; i++) {
        trace = fullData[i];
        trace._arrayAttrs = PlotSchema.findArrayAttributes(trace);
    }

    // add polar axes to axis list
    var polarIds = fullLayout._subplots.polar || [];
    for(i = 0; i < polarIds.length; i++) {
        axList.push(
            fullLayout[polarIds[i]].radialaxis,
            fullLayout[polarIds[i]].angularaxis
        );
    }

    clearAxesCalc(axList);

    var hasCalcTransform = false;

    // transform loop
    for(i = 0; i < fullData.length; i++) {
        trace = fullData[i];

        if(trace.visible === true && trace.transforms) {
            _module = trace._module;

            // we need one round of trace module calc before
            // the calc transform to 'fill in' the categories list
            // used for example in the data-to-coordinate method
            if(_module && _module.calc) _module.calc(gd, trace);

            for(j = 0; j < trace.transforms.length; j++) {
                var transform = trace.transforms[j];

                _module = transformsRegistry[transform.type];
                if(_module && _module.calcTransform) {
                    trace._hasCalcTransform = true;
                    hasCalcTransform = true;
                    _module.calcTransform(gd, trace, transform);
                }
            }
        }
    }

    // clear stuff that should recomputed in 'regular' loop
    if(hasCalcTransform) clearAxesCalc(axList);

    function calci(i, isContainer) {
        trace = fullData[i];
        _module = trace._module;

        if(!!_module.isContainer !== isContainer) return;

        var cd = [];

        if(trace.visible === true) {

            // keep ref of index-to-points map object of the *last* enabled transform,
            // this index-to-points map object is required to determine the calcdata indices
            // that correspond to input indices (e.g. from 'selectedpoints')
            var transforms = trace.transforms || [];
            for(j = transforms.length - 1; j >= 0; j--) {
                if(transforms[j].enabled) {
                    trace._indexToPoints = transforms[j]._indexToPoints;
                    break;
                }
            }

            if(_module && _module.calc) {
                cd = _module.calc(gd, trace);
            }
        }

        // Make sure there is a first point.
        //
        // This ensures there is a calcdata item for every trace,
        // even if cartesian logic doesn't handle it (for things like legends).
        if(!Array.isArray(cd) || !cd[0]) {
            cd = [{x: BADNUM, y: BADNUM}];
        }

        // add the trace-wide properties to the first point,
        // per point properties to every point
        // t is the holder for trace-wide properties
        if(!cd[0].t) cd[0].t = {};
        cd[0].trace = trace;

        calcdata[i] = cd;
    }

    // 'regular' loop - make sure container traces (eg carpet) calc before
    // contained traces (eg contourcarpet)
    for(i = 0; i < fullData.length; i++) calci(i, true);
    for(i = 0; i < fullData.length; i++) calci(i, false);

    Registry.getComponentMethod('fx', 'calc')(gd);
};

function clearAxesCalc(axList) {
    for(var i = 0; i < axList.length; i++) {
        axList[i].clearCalc();
    }
}

plots.rehover = function(gd) {
    if(gd._fullLayout._rehover) {
        gd._fullLayout._rehover();
    }
};

plots.generalUpdatePerTraceModule = function(gd, subplot, subplotCalcData, subplotLayout) {
    var traceHashOld = subplot.traceHash;
    var traceHash = {};
    var i;

    // build up moduleName -> calcData hash
    for(i = 0; i < subplotCalcData.length; i++) {
        var calcTraces = subplotCalcData[i],
            trace = calcTraces[0].trace;

        // skip over visible === false traces
        // as they don't have `_module` ref
        if(trace.visible) {
            traceHash[trace.type] = traceHash[trace.type] || [];
            traceHash[trace.type].push(calcTraces);
        }
    }

    // when a trace gets deleted, make sure that its module's
    // plot method is called so that it is properly
    // removed from the DOM.
    for(var moduleNameOld in traceHashOld) {
        if(!traceHash[moduleNameOld]) {
            var fakeCalcTrace = traceHashOld[moduleNameOld][0],
                fakeTrace = fakeCalcTrace[0].trace;

            fakeTrace.visible = false;
            traceHash[moduleNameOld] = [fakeCalcTrace];
        }
    }

    // call module plot method
    for(var moduleName in traceHash) {
        var moduleCalcData = traceHash[moduleName];
        var _module = moduleCalcData[0][0].trace._module;

        _module.plot(gd, subplot, Lib.filterVisible(moduleCalcData), subplotLayout);
    }

    // update moduleName -> calcData hash
    subplot.traceHash = traceHash;
};

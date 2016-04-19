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
var Color = require('../components/color');

var plots = module.exports = {};

var modules = plots.modules = {},
    allTypes = plots.allTypes = [],
    allCategories = plots.allCategories = {},
    subplotsRegistry = plots.subplotsRegistry = {};

plots.attributes = require('./attributes');
plots.attributes.type.values = allTypes;
plots.fontAttrs = require('./font_attributes');
plots.layoutAttributes = require('./layout_attributes');

// TODO make this a plot attribute?
plots.fontWeight = 'normal';

/**
 * plots.register: register a module as the handler for a trace type
 *
 * @param {object} _module the module that will handle plotting this trace type
 * @param {string} thisType
 * @param {array of strings} categoriesIn all the categories this type is in,
 *     tested by calls: Plotly.Plots.traceIs(trace, oneCategory)
 * @param {object} meta meta information about the trace type
 */
plots.register = function(_module, thisType, categoriesIn, meta) {
    if(modules[thisType]) {
        console.log('type ' + thisType + ' already registered');
        return;
    }

    var categoryObj = {};
    for(var i = 0; i < categoriesIn.length; i++) {
        categoryObj[categoriesIn[i]] = true;
        allCategories[categoriesIn[i]] = true;
    }

    modules[thisType] = {
        _module: _module,
        categories: categoryObj
    };

    if(meta && Object.keys(meta).length) {
        modules[thisType].meta = meta;
    }

    allTypes.push(thisType);
};

function getTraceType(traceType) {
    if(typeof traceType === 'object') traceType = traceType.type;
    return traceType;
}

plots.getModule = function(trace) {
    if(trace.r !== undefined) {
        console.log('Oops, tried to put a polar trace ' +
            'on an incompatible graph of cartesian ' +
            'data. Ignoring this dataset.', trace
        );
        return false;
    }

    var _module = modules[getTraceType(trace)];
    if(!_module) return false;
    return _module._module;
};


/**
 * plots.traceIs: is this trace type in this category?
 *
 * traceType: a trace (object) or trace type (string)
 * category: a category (string)
 */
plots.traceIs = function traceIs(traceType, category) {
    traceType = getTraceType(traceType);

    if(traceType === 'various') return false;  // FIXME

    var _module = modules[traceType];

    if(!_module) {
        if(traceType !== undefined) {
            console.warn('unrecognized trace type ' + traceType);
        }
        _module = modules[plots.attributes.type.dflt];
    }

    return !!_module.categories[category];
};


/**
 * plots.registerSubplot: register a subplot type
 *
 * @param {object} _module subplot module:
 *
 *      @param {string or array of strings} attr
 *          attribute name in traces and layout
 *      @param {string or array of strings} idRoot
 *          root of id (setting the possible value for attrName)
 *      @param {object} attributes
 *          attribute(s) for traces of this subplot type
 *
 * In trace objects `attr` is the object key taking a valid `id` as value
 * (the set of all valid ids is generated below and stored in idRegex).
 *
 * In the layout object, a or several valid `attr` name(s) can be keys linked
 * to a nested attribute objects
 * (the set of all valid attr names is generated below and stored in attrRegex).
 *
 * TODO use these in Lib.coerce
 */
plots.registerSubplot = function(_module) {
    var plotType = _module.name;

    if(subplotsRegistry[plotType]) {
        console.log('plot type ' + plotType + ' already registered');
        return;
    }

    // not sure what's best for the 'cartesian' type at this point
    subplotsRegistry[plotType] = _module;
};

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
    if(type === 'cartesian' && !layout._hasCartesian) return [];
    if(type === 'gl2d' && !layout._hasGL2D) return [];
    if(type === 'cartesian' || type === 'gl2d') {
        return Object.keys(layout._plots);
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

            if(trace[attr[0]]===subplotX && trace[attr[1]]===subplotY) {
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

    // doesn't work presently (and not needed) for polar or 3d
    if(gd._fullLayout._hasGL3D || (gd.data && gd.data[0] && gd.data[0].r)) {
        return;
    }

    return new Promise(function(resolve) {
        setTimeout(function() {
            Plotly.Annotations.drawAll(gd);
            Plotly.Legend.draw(gd);
            (gd.calcdata||[]).forEach(function(d) {
                if(d[0]&&d[0].t&&d[0].t.cb) d[0].t.cb();
            });
            resolve(plots.previousPromises(gd));
        },300);
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
            .then(function() { gd._promises=[]; });
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

plots.supplyDefaults = function(gd) {
    // fill in default values:
    // gd.data, gd.layout:
    //   are precisely what the user specified
    // gd._fullData, gd._fullLayout:
    //   are complete descriptions of how to draw the plot
    var oldFullLayout = gd._fullLayout || {},
        newFullLayout = gd._fullLayout = {},
        newLayout = gd.layout || {},
        oldFullData = gd._fullData || [],
        newFullData = gd._fullData = [],
        newData = gd.data || [],
        modules = gd._modules = [];

    var i, trace, fullTrace, _module, axList, ax;


    // first fill in what we can of layout without looking at data
    // because fullData needs a few things from layout
    plots.supplyLayoutGlobalDefaults(newLayout, newFullLayout);

    // keep track of how many traces are inputted
    newFullLayout._dataLength = newData.length;

    // then do the data
    for(i = 0; i < newData.length; i++) {
        trace = newData[i];

        fullTrace = plots.supplyDataDefaults(trace, i, newFullLayout);
        newFullData.push(fullTrace);

        // detect plot type
        if(plots.traceIs(fullTrace, 'cartesian')) newFullLayout._hasCartesian = true;
        else if(plots.traceIs(fullTrace, 'gl3d')) newFullLayout._hasGL3D = true;
        else if(plots.traceIs(fullTrace, 'geo')) newFullLayout._hasGeo = true;
        else if(plots.traceIs(fullTrace, 'pie')) newFullLayout._hasPie = true;
        else if(plots.traceIs(fullTrace, 'gl2d')) newFullLayout._hasGL2D = true;
        else if(plots.traceIs(fullTrace, 'ternary')) newFullLayout._hasTernary = true;
        else if('r' in fullTrace) newFullLayout._hasPolar = true;

        _module = fullTrace._module;
        if(_module && modules.indexOf(_module)===-1) modules.push(_module);
    }

    // special cases that introduce interactions between traces
    for(i = 0; i < modules.length; i++) {
        _module = modules[i];
        if(_module.cleanData) _module.cleanData(newFullData);
    }

    if(oldFullData.length === newData.length) {
        for(i = 0; i < newFullData.length; i++) {
            relinkPrivateKeys(newFullData[i], oldFullData[i]);
        }
    }

    // finally, fill in the pieces of layout that may need to look at data
    plots.supplyLayoutModuleDefaults(newLayout, newFullLayout, newFullData);

    // clean subplots and other artifacts from previous plot calls
    plots.cleanPlot(newFullData, newFullLayout, oldFullData, oldFullLayout);

    /*
     * Relink functions and underscore attributes to promote consistency between
     * plots.
     */
    relinkPrivateKeys(newFullLayout, oldFullLayout);

    plots.doAutoMargin(gd);

    // can't quite figure out how to get rid of this... each axis needs
    // a reference back to the DOM object for just a few purposes
    axList = Plotly.Axes.list(gd);
    for(i = 0; i < axList.length; i++) {
        ax = axList[i];
        ax._gd = gd;
        ax.setScale();
    }

    // update object references in calcdata
    if((gd.calcdata || []).length === newFullData.length) {
        for(i = 0; i < newFullData.length; i++) {
            trace = newFullData[i];
            (gd.calcdata[i][0] || {}).trace = trace;
        }
    }
};

plots.cleanPlot = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var i, j;

    var plotTypes = Object.keys(subplotsRegistry);
    for(i = 0; i < plotTypes.length; i++) {
        var _module = subplotsRegistry[plotTypes[i]];

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

        // clean old heatmap and contour traces
        if(hasPaper) {
            oldFullLayout._paper.selectAll(
                '.hm' + oldUid +
                ',.contour' + oldUid +
                ',#clip' + oldUid
            ).remove();
        }

        // clean old colorbars
        if(hasInfoLayer) {
            oldFullLayout._infolayer.selectAll('.cb' + oldUid).remove();
        }
    }
};

/**
 * Relink private _keys and keys with a function value from one layout
 * (usually cached) to the new fullLayout.
 * relink means copying if object is pass-by-value and adding a reference
 * if object is pass-by-ref. This prevents deepCopying massive structures like
 * a webgl context.
 */
function relinkPrivateKeys(toLayout, fromLayout) {
    var keys = Object.keys(fromLayout);
    var j;

    for(var i = 0; i < keys.length; ++i) {
        var k = keys[i];
        if(k.charAt(0)==='_' || typeof fromLayout[k]==='function') {
            // if it already exists at this point, it's something
            // that we recreate each time around, so ignore it
            if(k in toLayout) continue;

            toLayout[k] = fromLayout[k];
        }
        else if(Array.isArray(fromLayout[k]) &&
                 Array.isArray(toLayout[k]) &&
                 fromLayout[k].length &&
                 Lib.isPlainObject(fromLayout[k][0])) {
            if(fromLayout[k].length !== toLayout[k].length) {
                // this should be handled elsewhere, it causes
                // ambiguity if we try to deal with it here.
                throw new Error('relinkPrivateKeys needs equal ' +
                                'length arrays');
            }

            for(j = 0; j < fromLayout[k].length; j++) {
                relinkPrivateKeys(toLayout[k][j], fromLayout[k][j]);
            }
        }
        else if(Lib.isPlainObject(fromLayout[k]) &&
                 Lib.isPlainObject(toLayout[k])) {
            // recurse into objects, but only if they still exist
            relinkPrivateKeys(toLayout[k], fromLayout[k]);
            if(!Object.keys(toLayout[k]).length) delete toLayout[k];
        }
    }
}

plots.supplyDataDefaults = function(traceIn, i, layout) {
    var traceOut = {},
        defaultColor = Color.defaults[i % Color.defaults.length];

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, plots.attributes, attr, dflt);
    }

    function coerceSubplotAttr(subplotType, subplotAttr) {
        if(!plots.traceIs(traceOut, subplotType)) return;
        return Lib.coerce(traceIn, traceOut,
            plots.subplotsRegistry[subplotType].attributes, subplotAttr);
    }

    // module-independent attributes
    traceOut.index = i;
    var visible = coerce('visible'),
        scene,
        _module;

    coerce('type');
    coerce('uid');

    // this is necessary otherwise we lose references to scene objects when
    // the traces of a scene are invisible. Also we handle visible/unvisible
    // differently for 3D cases.
    coerceSubplotAttr('gl3d', 'scene');
    coerceSubplotAttr('geo', 'geo');
    coerceSubplotAttr('ternary', 'subplot');

    // module-specific attributes --- note: we need to send a trace into
    // the 3D modules to have it removed from the webgl context.
    if(visible || scene) {
        _module = plots.getModule(traceOut);
        traceOut._module = _module;
    }

    // gets overwritten in pie, geo and ternary modules
    if(visible) coerce('hoverinfo', (layout._dataLength === 1) ? 'x+y+z+text' : undefined);

    if(_module && visible) _module.supplyDefaults(traceIn, traceOut, defaultColor, layout);

    if(visible) {
        coerce('name', 'trace ' + i);

        if(!plots.traceIs(traceOut, 'noOpacity')) coerce('opacity');

        coerceSubplotAttr('cartesian', 'xaxis');
        coerceSubplotAttr('cartesian', 'yaxis');

        coerceSubplotAttr('gl2d', 'xaxis');
        coerceSubplotAttr('gl2d', 'yaxis');

        if(plots.traceIs(traceOut, 'showLegend')) {
            coerce('showlegend');
            coerce('legendgroup');
        }
    }

    // NOTE: I didn't include fit info at all... for now I think it can stay
    // just in gd.data, as this info isn't involved in creating plots at all,
    // only in pulling back up the fit popover

    // reference back to the input object for convenience
    traceOut._input = traceIn;

    return traceOut;
};

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
    if(autosize!=='initial') plots.sanitizeMargins(layoutOut);

    coerce('paper_bgcolor');

    coerce('separators');
    coerce('hidesources');
    coerce('smith');
    coerce('_hasCartesian');
    coerce('_hasGL3D');
    coerce('_hasGeo');
    coerce('_hasPie');
    coerce('_hasGL2D');
    coerce('_hasTernary');
};

plots.supplyLayoutModuleDefaults = function(layoutIn, layoutOut, fullData) {
    var i, _module;

    // TODO incorporate into subplotRegistry
    Plotly.Axes.supplyLayoutDefaults(layoutIn, layoutOut, fullData);

    // plot module layout defaults
    var plotTypes = Object.keys(subplotsRegistry);
    for(i = 0; i < plotTypes.length; i++) {
        _module = subplotsRegistry[plotTypes[i]];

        // e.g. gl2d does not have a layout-defaults step
        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        }
    }

    // trace module layout defaults
    var traceTypes = Object.keys(modules);
    for(i = 0; i < traceTypes.length; i++) {
        _module = modules[allTypes[i]]._module;

        if(_module.supplyLayoutDefaults) {
            _module.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        }
    }

    // TODO register these
    // Legend must come after traces (e.g. it depends on 'barmode')
    var moduleLayoutDefaults = ['Fx', 'Annotations', 'Shapes', 'Legend'];
    for(i = 0; i < moduleLayoutDefaults.length; i++) {
        _module = moduleLayoutDefaults[i];

        if(Plotly[_module]) {
            Plotly[_module].supplyLayoutDefaults(layoutIn, layoutOut, fullData);
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
    delete gd._modules;
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

    // remove all event listeners
    if(gd.removeAllListeners) gd.removeAllListeners();
};

plots.style = function(gd) {
    var _modules = gd._modules;

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
            if(o.l+o.r > fullLayout.width*0.5) o.l = o.r = 0;
            if(o.b+o.t > fullLayout.height*0.5) o.b = o.t = 0;

            fullLayout._pushmargin[id] = {
                l: {val: o.x, size: o.l+pad},
                r: {val: o.x, size: o.r+pad},
                b: {val: o.y, size: o.b+pad},
                t: {val: o.y, size: o.t+pad}
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

    if(fullLayout.margin.autoexpand!==false) {
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
            var pushleft = pm[k1].l||{},
                pushbottom = pm[k1].b||{},
                fl = pushleft.val,
                pl = pushleft.size,
                fb = pushbottom.val,
                pb = pushbottom.size;
            Object.keys(pm).forEach(function(k2) {
                if(isNumeric(pl) && pm[k2].r) {
                    var fr = pm[k2].r.val,
                        pr = pm[k2].r.size;
                    if(fr>fl) {
                        var newl = (pl*fr +
                                (pr-fullLayout.width)*fl) / (fr-fl),
                            newr = (pr*(1-fl) +
                                (pl-fullLayout.width)*(1-fr)) / (fr-fl);
                        if(newl>=0 && newr>=0 && newl+newr>ml+mr) {
                            ml = newl;
                            mr = newr;
                        }
                    }
                }
                if(isNumeric(pb) && pm[k2].t) {
                    var ft = pm[k2].t.val,
                        pt = pm[k2].t.size;
                    if(ft>fb) {
                        var newb = (pb*ft +
                                (pt-fullLayout.height)*fb) / (ft-fb),
                            newt = (pt*(1-fb) +
                                (pb-fullLayout.height)*(1-ft)) / (ft-fb);
                        if(newb>=0 && newt>=0 && newb+newt>mb+mt) {
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
    gs.w = Math.round(fullLayout.width)-gs.l-gs.r;
    gs.h = Math.round(fullLayout.height)-gs.t-gs.b;

    // if things changed and we're not already redrawing, trigger a redraw
    if(!gd._replotting && oldmargins!=='{}' &&
            oldmargins!==JSON.stringify(fullLayout._size)) {
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
            var o={}, v, src;
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
                else if(mode==='keepstream') {
                    // keep sourced data if it's being streamed.
                    // similar to keepref, but if the 'stream' object exists
                    // in a trace, we will keep the data array.
                    src = d[v+'src'];
                    if(typeof src==='string' && src.indexOf(':')>0) {
                        if(!Lib.isPlainObject(d.stream)) {
                            continue;
                        }
                    }
                }
                else if(mode!=='keepall') {
                    // keepref: remove sourced data but only
                    // if the source tag is well-formed
                    src = d[v+'src'];
                    if(typeof src==='string' && src.indexOf(':')>0) {
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

    return (output==='object') ? obj : JSON.stringify(obj);
};

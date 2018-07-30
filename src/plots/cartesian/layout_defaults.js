/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Color = require('../../components/color');
var Template = require('../../plot_api/plot_template');
var basePlotLayoutAttributes = require('../layout_attributes');

var layoutAttributes = require('./layout_attributes');
var handleTypeDefaults = require('./type_defaults');
var handleAxisDefaults = require('./axis_defaults');
var handleConstraintDefaults = require('./constraint_defaults');
var handlePositionDefaults = require('./position_defaults');

var axisIds = require('./axis_ids');
var id2name = axisIds.id2name;
var name2id = axisIds.name2id;

var Registry = require('../../registry');
var traceIs = Registry.traceIs;
var getComponentMethod = Registry.getComponentMethod;

function appendList(cont, k, item) {
    if(Array.isArray(cont[k])) cont[k].push(item);
    else cont[k] = [item];
}

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    var ax2traces = {};
    var xaCheater = {};
    var xaNonCheater = {};
    var outerTicks = {};
    var noGrids = {};
    var i, j;

    // look for axes in the data
    for(i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        if(!traceIs(trace, 'cartesian') && !traceIs(trace, 'gl2d')) continue;

        var xaName;
        if(trace.xaxis) {
            xaName = id2name(trace.xaxis);
            appendList(ax2traces, xaName, trace);
        } else if(trace.xaxes) {
            for(j = 0; j < trace.xaxes.length; j++) {
                appendList(ax2traces, id2name(trace.xaxes[j]), trace);
            }
        }

        var yaName;
        if(trace.yaxis) {
            yaName = id2name(trace.yaxis);
            appendList(ax2traces, yaName, trace);
        } else if(trace.yaxes) {
            for(j = 0; j < trace.yaxes.length; j++) {
                appendList(ax2traces, id2name(trace.yaxes[j]), trace);
            }
        }

        // Two things trigger axis visibility:
        // 1. is not carpet
        // 2. carpet that's not cheater
        if(!traceIs(trace, 'carpet') || (trace.type === 'carpet' && !trace._cheater)) {
            if(xaName) xaNonCheater[xaName] = 1;
        }

        // The above check for definitely-not-cheater is not adequate. This
        // second list tracks which axes *could* be a cheater so that the
        // full condition triggering hiding is:
        //   *could* be a cheater and *is not definitely visible*
        if(trace.type === 'carpet' && trace._cheater) {
            if(xaName) xaCheater[xaName] = 1;
        }

        // check for default formatting tweaks
        if(traceIs(trace, '2dMap')) {
            outerTicks[xaName] = 1;
            outerTicks[yaName] = 1;
        }

        if(traceIs(trace, 'oriented')) {
            var positionAxis = trace.orientation === 'h' ? yaName : xaName;
            noGrids[positionAxis] = 1;
        }
    }

    var subplots = layoutOut._subplots;
    var xIds = subplots.xaxis;
    var yIds = subplots.yaxis;
    var xNames = Lib.simpleMap(xIds, id2name);
    var yNames = Lib.simpleMap(yIds, id2name);
    var axNames = xNames.concat(yNames);

    // plot_bgcolor only makes sense if there's a (2D) plot!
    // TODO: bgcolor for each subplot, to inherit from the main one
    var plot_bgcolor = Color.background;
    if(xIds.length && yIds.length) {
        plot_bgcolor = Lib.coerce(layoutIn, layoutOut, basePlotLayoutAttributes, 'plot_bgcolor');
    }

    var bgColor = Color.combine(plot_bgcolor, layoutOut.paper_bgcolor);

    var axName, axLetter, axLayoutIn, axLayoutOut;

    function coerce(attr, dflt) {
        return Lib.coerce(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
    }

    function coerce2(attr, dflt) {
        return Lib.coerce2(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
    }

    function getCounterAxes(axLetter) {
        return (axLetter === 'x') ? yIds : xIds;
    }

    var counterAxes = {x: getCounterAxes('x'), y: getCounterAxes('y')};

    function getOverlayableAxes(axLetter, axName) {
        var list = (axLetter === 'x') ? xNames : yNames;
        var out = [];

        for(var j = 0; j < list.length; j++) {
            var axName2 = list[j];

            if(axName2 !== axName && !(layoutIn[axName2] || {}).overlaying) {
                out.push(name2id(axName2));
            }
        }

        return out;
    }

    // first pass creates the containers, determines types, and handles most of the settings
    for(i = 0; i < axNames.length; i++) {
        axName = axNames[i];
        axLetter = axName.charAt(0);

        if(!Lib.isPlainObject(layoutIn[axName])) {
            layoutIn[axName] = {};
        }

        axLayoutIn = layoutIn[axName];
        axLayoutOut = Template.newContainer(layoutOut, axName, axLetter + 'axis');

        var traces = ax2traces[axName] || [];
        axLayoutOut._traceIndices = traces.map(function(t) { return t._expandedIndex; });
        axLayoutOut._annIndices = [];
        axLayoutOut._shapeIndices = [];

        handleTypeDefaults(axLayoutIn, axLayoutOut, coerce, traces, axName);

        var overlayableAxes = getOverlayableAxes(axLetter, axName);

        var defaultOptions = {
            letter: axLetter,
            font: layoutOut.font,
            outerTicks: outerTicks[axName],
            showGrid: !noGrids[axName],
            data: traces,
            bgColor: bgColor,
            calendar: layoutOut.calendar,
            automargin: true,
            cheateronly: axLetter === 'x' && xaCheater[axName] && !xaNonCheater[axName]
        };

        handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions, layoutOut);

        var spikecolor = coerce2('spikecolor'),
            spikethickness = coerce2('spikethickness'),
            spikedash = coerce2('spikedash'),
            spikemode = coerce2('spikemode'),
            spikesnap = coerce2('spikesnap'),
            showSpikes = coerce('showspikes', !!spikecolor || !!spikethickness || !!spikedash || !!spikemode || !!spikesnap);

        if(!showSpikes) {
            delete axLayoutOut.spikecolor;
            delete axLayoutOut.spikethickness;
            delete axLayoutOut.spikedash;
            delete axLayoutOut.spikemode;
            delete axLayoutOut.spikesnap;
        }

        var positioningOptions = {
            letter: axLetter,
            counterAxes: counterAxes[axLetter],
            overlayableAxes: overlayableAxes,
            grid: layoutOut.grid
        };

        handlePositionDefaults(axLayoutIn, axLayoutOut, coerce, positioningOptions);

        axLayoutOut._input = axLayoutIn;
    }

    // quick second pass for range slider and selector defaults
    var rangeSliderDefaults = getComponentMethod('rangeslider', 'handleDefaults');
    var rangeSelectorDefaults = getComponentMethod('rangeselector', 'handleDefaults');

    for(i = 0; i < xNames.length; i++) {
        axName = xNames[i];
        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName];

        rangeSliderDefaults(layoutIn, layoutOut, axName);

        if(axLayoutOut.type === 'date') {
            rangeSelectorDefaults(
                axLayoutIn,
                axLayoutOut,
                layoutOut,
                yNames,
                axLayoutOut.calendar
            );
        }

        coerce('fixedrange');
    }

    for(i = 0; i < yNames.length; i++) {
        axName = yNames[i];
        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName];

        var anchoredAxis = layoutOut[id2name(axLayoutOut.anchor)];

        var fixedRangeDflt = (
            anchoredAxis &&
            anchoredAxis.rangeslider &&
            anchoredAxis.rangeslider.visible
        );

        coerce('fixedrange', fixedRangeDflt);
    }

    // Finally, handle scale constraints. We need to do this after all axes have
    // coerced both `type` (so we link only axes of the same type) and
    // `fixedrange` (so we can avoid linking from OR TO a fixed axis).

    // sets of axes linked by `scaleanchor` along with the scaleratios compounded
    // together, populated in handleConstraintDefaults
    layoutOut._axisConstraintGroups = [];
    var allAxisIds = counterAxes.x.concat(counterAxes.y);

    for(i = 0; i < axNames.length; i++) {
        axName = axNames[i];
        axLetter = axName.charAt(0);

        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName];

        handleConstraintDefaults(axLayoutIn, axLayoutOut, coerce, allAxisIds, layoutOut);
    }
};

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
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


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    var xaCheater = {};
    var xaNonCheater = {};
    var outerTicks = {};
    var noGrids = {};
    var i;

    // look for axes in the data
    for(i = 0; i < fullData.length; i++) {
        var trace = fullData[i];

        if(!Registry.traceIs(trace, 'cartesian') && !Registry.traceIs(trace, 'gl2d')) {
            continue;
        }

        var xaName = axisIds.id2name(trace.xaxis);
        var yaName = axisIds.id2name(trace.yaxis);

        // Two things trigger axis visibility:
        // 1. is not carpet
        // 2. carpet that's not cheater
        if(!Registry.traceIs(trace, 'carpet') || (trace.type === 'carpet' && !trace._cheater)) {
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
        if(Registry.traceIs(trace, '2dMap')) {
            outerTicks[xaName] = true;
            outerTicks[yaName] = true;
        }

        if(Registry.traceIs(trace, 'oriented')) {
            var positionAxis = trace.orientation === 'h' ? yaName : xaName;
            noGrids[positionAxis] = true;
        }
    }

    var subplots = layoutOut._subplots;
    var xIds = subplots.xaxis;
    var yIds = subplots.yaxis;
    var xNames = Lib.simpleMap(xIds, axisIds.id2name);
    var yNames = Lib.simpleMap(yIds, axisIds.id2name);
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
                out.push(axisIds.name2id(axName2));
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

        handleTypeDefaults(axLayoutIn, axLayoutOut, coerce, fullData, axName);

        var overlayableAxes = getOverlayableAxes(axLetter, axName);

        var defaultOptions = {
            letter: axLetter,
            font: layoutOut.font,
            outerTicks: outerTicks[axName],
            showGrid: !noGrids[axName],
            data: fullData,
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
    var rangeSliderDefaults = Registry.getComponentMethod('rangeslider', 'handleDefaults');
    var rangeSelectorDefaults = Registry.getComponentMethod('rangeselector', 'handleDefaults');

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

        var anchoredAxis = layoutOut[axisIds.id2name(axLayoutOut.anchor)];

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

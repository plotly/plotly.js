/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var Color = require('../../components/color');
var basePlotLayoutAttributes = require('../layout_attributes');

var constants = require('./constants');
var layoutAttributes = require('./layout_attributes');
var handleTypeDefaults = require('./type_defaults');
var handleAxisDefaults = require('./axis_defaults');
var handleConstraintDefaults = require('./constraint_defaults');
var handlePositionDefaults = require('./position_defaults');
var axisIds = require('./axis_ids');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    var layoutKeys = Object.keys(layoutIn),
        xaListCartesian = [],
        yaListCartesian = [],
        xaListGl2d = [],
        yaListGl2d = [],
        xaListCheater = [],
        xaListNonCheater = [],
        outerTicks = {},
        noGrids = {},
        i;

    // look for axes in the data
    for(i = 0; i < fullData.length; i++) {
        var trace = fullData[i];
        var listX, listY;

        if(Registry.traceIs(trace, 'cartesian')) {
            listX = xaListCartesian;
            listY = yaListCartesian;
        }
        else if(Registry.traceIs(trace, 'gl2d')) {
            listX = xaListGl2d;
            listY = yaListGl2d;
        }
        else continue;

        var xaName = axisIds.id2name(trace.xaxis),
            yaName = axisIds.id2name(trace.yaxis);

        // Two things trigger axis visibility:
        // 1. is not carpet
        // 2. carpet that's not cheater
        if(!Registry.traceIs(trace, 'carpet') || (trace.type === 'carpet' && !trace._cheater)) {
            if(xaName) Lib.pushUnique(xaListNonCheater, xaName);
        }

        // The above check for definitely-not-cheater is not adequate. This
        // second list tracks which axes *could* be a cheater so that the
        // full condition triggering hiding is:
        //   *could* be a cheater and *is not definitely visible*
        if(trace.type === 'carpet' && trace._cheater) {
            if(xaName) Lib.pushUnique(xaListCheater, xaName);
        }

        // add axes implied by traces
        if(xaName && listX.indexOf(xaName) === -1) listX.push(xaName);
        if(yaName && listY.indexOf(yaName) === -1) listY.push(yaName);

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

    // N.B. Ignore orphan axes (i.e. axes that have no data attached to them)
    // if gl3d or geo is present on graph. This is retain backward compatible.
    //
    // TODO drop this in version 2.0
    var ignoreOrphan = (layoutOut._has('gl3d') || layoutOut._has('geo'));

    if(!ignoreOrphan) {
        for(i = 0; i < layoutKeys.length; i++) {
            var key = layoutKeys[i];

            // orphan layout axes are considered cartesian subplots

            if(xaListGl2d.indexOf(key) === -1 &&
                xaListCartesian.indexOf(key) === -1 &&
                    constants.xAxisMatch.test(key)) {
                xaListCartesian.push(key);
            }
            else if(yaListGl2d.indexOf(key) === -1 &&
                yaListCartesian.indexOf(key) === -1 &&
                    constants.yAxisMatch.test(key)) {
                yaListCartesian.push(key);
            }
        }
    }

    // make sure that plots with orphan cartesian axes
    // are considered 'cartesian'
    if(xaListCartesian.length && yaListCartesian.length) {
        Lib.pushUnique(layoutOut._basePlotModules, Registry.subplotsRegistry.cartesian);
    }

    function axSort(a, b) {
        var aNum = Number(a.substr(5) || 1),
            bNum = Number(b.substr(5) || 1);
        return aNum - bNum;
    }

    var xaList = xaListCartesian.concat(xaListGl2d).sort(axSort),
        yaList = yaListCartesian.concat(yaListGl2d).sort(axSort),
        axesList = xaList.concat(yaList);

    // plot_bgcolor only makes sense if there's a (2D) plot!
    // TODO: bgcolor for each subplot, to inherit from the main one
    var plot_bgcolor = Color.background;
    if(xaList.length && yaList.length) {
        plot_bgcolor = Lib.coerce(layoutIn, layoutOut, basePlotLayoutAttributes, 'plot_bgcolor');
    }

    var bgColor = Color.combine(plot_bgcolor, layoutOut.paper_bgcolor);

    var axName, axLetter, axLayoutIn, axLayoutOut;

    function coerce(attr, dflt) {
        return Lib.coerce(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
    }

    function getCounterAxes(axLetter) {
        var list = {x: yaList, y: xaList}[axLetter];
        return Lib.simpleMap(list, axisIds.name2id);
    }

    var counterAxes = {x: getCounterAxes('x'), y: getCounterAxes('y')};

    function getOverlayableAxes(axLetter, axName) {
        var list = {x: xaList, y: yaList}[axLetter];
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
    for(i = 0; i < axesList.length; i++) {
        axName = axesList[i];

        if(!Lib.isPlainObject(layoutIn[axName])) {
            layoutIn[axName] = {};
        }

        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName] = {};

        handleTypeDefaults(axLayoutIn, axLayoutOut, coerce, fullData, axName);

        axLetter = axName.charAt(0);
        var overlayableAxes = getOverlayableAxes(axLetter, axName);

        var defaultOptions = {
            letter: axLetter,
            font: layoutOut.font,
            outerTicks: outerTicks[axName],
            showGrid: !noGrids[axName],
            data: fullData,
            bgColor: bgColor,
            calendar: layoutOut.calendar,
            cheateronly: axLetter === 'x' && (xaListCheater.indexOf(axName) !== -1 && xaListNonCheater.indexOf(axName) === -1)
        };

        handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions, layoutOut);

        var showSpikes = coerce('showspikes');
        if(showSpikes) {
            coerce('spikecolor');
            coerce('spikethickness');
            coerce('spikedash');
            coerce('spikemode');
        }

        var positioningOptions = {
            letter: axLetter,
            counterAxes: counterAxes[axLetter],
            overlayableAxes: overlayableAxes
        };

        handlePositionDefaults(axLayoutIn, axLayoutOut, coerce, positioningOptions);

        axLayoutOut._input = axLayoutIn;
    }

    // quick second pass for range slider and selector defaults
    var rangeSliderDefaults = Registry.getComponentMethod('rangeslider', 'handleDefaults'),
        rangeSelectorDefaults = Registry.getComponentMethod('rangeselector', 'handleDefaults');

    for(i = 0; i < xaList.length; i++) {
        axName = xaList[i];
        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName];

        rangeSliderDefaults(layoutIn, layoutOut, axName);

        if(axLayoutOut.type === 'date') {
            rangeSelectorDefaults(
                axLayoutIn,
                axLayoutOut,
                layoutOut,
                yaList,
                axLayoutOut.calendar
            );
        }

        coerce('fixedrange');
    }

    for(i = 0; i < yaList.length; i++) {
        axName = yaList[i];
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

    for(i = 0; i < axesList.length; i++) {
        axName = axesList[i];
        axLetter = axName.charAt(0);

        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName];

        handleConstraintDefaults(axLayoutIn, axLayoutOut, coerce, allAxisIds, layoutOut);
    }
};

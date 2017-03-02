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
var handleAxisDefaults = require('./axis_defaults');
var handlePositionDefaults = require('./position_defaults');
var axisIds = require('./axis_ids');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    var layoutKeys = Object.keys(layoutIn),
        xaListCartesian = [],
        yaListCartesian = [],
        xaListGl2d = [],
        yaListGl2d = [],
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

    var axName, axLayoutIn, axLayoutOut;

    function coerce(attr, dflt) {
        return Lib.coerce(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
    }

    function getCounterAxes(axLetter) {
        var list = {x: yaList, y: xaList}[axLetter];
        return Lib.simpleMap(list, axisIds.name2id);
    }

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

    for(i = 0; i < axesList.length; i++) {
        axName = axesList[i];

        if(!Lib.isPlainObject(layoutIn[axName])) {
            layoutIn[axName] = {};
        }

        axLayoutIn = layoutIn[axName];
        axLayoutOut = layoutOut[axName] = {};

        var axLetter = axName.charAt(0);

        var defaultOptions = {
            letter: axLetter,
            font: layoutOut.font,
            outerTicks: outerTicks[axName],
            showGrid: !noGrids[axName],
            name: axName,
            data: fullData,
            bgColor: bgColor,
            calendar: layoutOut.calendar
        };

        handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions, layoutOut);

        var positioningOptions = {
            letter: axLetter,
            counterAxes: getCounterAxes(axLetter),
            overlayableAxes: getOverlayableAxes(axLetter, axName)
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
};

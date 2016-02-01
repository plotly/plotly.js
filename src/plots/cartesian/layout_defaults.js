/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Plots = require('../plots');

var constants = require('./constants');
var layoutAttributes = require('./layout_attributes');
var handleAxisDefaults = require('./axis_defaults');
var handlePositionDefaults = require('./position_defaults');
var utils = require('./utils');


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    // get the full list of axes already defined
    var layoutKeys = Object.keys(layoutIn),
        xaList = [],
        yaList = [],
        outerTicks = {},
        noGrids = {},
        i;

    for(i = 0; i < layoutKeys.length; i++) {
        var key = layoutKeys[i];
        if(constants.xAxisMatch.test(key)) xaList.push(key);
        else if(constants.yAxisMatch.test(key)) yaList.push(key);
    }

    for(i = 0; i < fullData.length; i++) {
        var trace = fullData[i],
            xaName = utils.id2name(trace.xaxis),
            yaName = utils.id2name(trace.yaxis);

        // add axes implied by traces
        if(xaName && xaList.indexOf(xaName) === -1) xaList.push(xaName);
        if(yaName && yaList.indexOf(yaName) === -1) yaList.push(yaName);

        // check for default formatting tweaks
        if(Plots.traceIs(trace, '2dMap')) {
            outerTicks[xaName] = true;
            outerTicks[yaName] = true;
        }

        if(Plots.traceIs(trace, 'oriented')) {
            var positionAxis = trace.orientation === 'h' ? yaName : xaName;
            noGrids[positionAxis] = true;
        }
    }

    function axSort(a,b) {
        var aNum = Number(a.substr(5)||1),
            bNum = Number(b.substr(5)||1);
        return aNum - bNum;
    }

    if(layoutOut._hasCartesian || layoutOut._hasGL2D || !fullData.length) {
        // make sure there's at least one of each and lists are sorted
        if(!xaList.length) xaList = ['xaxis'];
        else xaList.sort(axSort);

        if(!yaList.length) yaList = ['yaxis'];
        else yaList.sort(axSort);
    }

    xaList.concat(yaList).forEach(function(axName){
        var axLetter = axName.charAt(0),
            axLayoutIn = layoutIn[axName] || {},
            axLayoutOut = {},
            defaultOptions = {
                letter: axLetter,
                font: layoutOut.font,
                outerTicks: outerTicks[axName],
                showGrid: !noGrids[axName],
                name: axName,
                data: fullData
            },
            positioningOptions = {
                letter: axLetter,
                counterAxes: {x: yaList, y: xaList}[axLetter].map(utils.name2id),
                overlayableAxes: {x: xaList, y: yaList}[axLetter].filter(function(axName2){
                    return axName2!==axName && !(layoutIn[axName2]||{}).overlaying;
                }).map(utils.name2id)
            };

        function coerce(attr, dflt) {
            return Lib.coerce(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
        }

        handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions);
        handlePositionDefaults(axLayoutIn, axLayoutOut, coerce, positioningOptions);
        layoutOut[axName] = axLayoutOut;

        // so we don't have to repeat autotype unnecessarily,
        // copy an autotype back to layoutIn
        if(!layoutIn[axName] && axLayoutIn.type!=='-') {
            layoutIn[axName] = {type: axLayoutIn.type};
        }

    });

    // plot_bgcolor only makes sense if there's a (2D) plot!
    // TODO: bgcolor for each subplot, to inherit from the main one
    if(xaList.length && yaList.length) {
        Lib.coerce(layoutIn, layoutOut, Plots.layoutAttributes, 'plot_bgcolor');
    }
};

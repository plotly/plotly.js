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

        if(Plots.traceIs(trace, 'cartesian')) {
            listX = xaListCartesian;
            listY = yaListCartesian;
        }
        else if(Plots.traceIs(trace, 'gl2d')) {
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
        if(Plots.traceIs(trace, '2dMap')) {
            outerTicks[xaName] = true;
            outerTicks[yaName] = true;
        }

        if(Plots.traceIs(trace, 'oriented')) {
            var positionAxis = trace.orientation === 'h' ? yaName : xaName;
            noGrids[positionAxis] = true;
        }
    }

    // N.B. Ignore orphan axes (i.e. axes that have no data attached to them)
    // if gl3d or geo is present on graph. This is retain backward compatible.
    //
    // TODO drop this in version 2.0
    var ignoreOrphan = (layoutOut._hasGL3D || layoutOut._hasGeo);

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
        layoutOut._hasCartesian = true;
    }

    function axSort(a, b) {
        var aNum = Number(a.substr(5) || 1),
            bNum = Number(b.substr(5) || 1);
        return aNum - bNum;
    }

    var xaList = xaListCartesian.concat(xaListGl2d).sort(axSort),
        yaList = yaListCartesian.concat(yaListGl2d).sort(axSort);

    xaList.concat(yaList).forEach(function(axName) {
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
                counterAxes: {x: yaList, y: xaList}[axLetter].map(axisIds.name2id),
                overlayableAxes: {x: xaList, y: yaList}[axLetter].filter(function(axName2) {
                    return axName2!==axName && !(layoutIn[axName2]||{}).overlaying;
                }).map(axisIds.name2id)
            };

        function coerce(attr, dflt) {
            return Lib.coerce(axLayoutIn, axLayoutOut, layoutAttributes, attr, dflt);
        }

        handleAxisDefaults(axLayoutIn, axLayoutOut, coerce, defaultOptions);
        handlePositionDefaults(axLayoutIn, axLayoutOut, coerce, positioningOptions);
        layoutOut[axName] = axLayoutOut;

        // so we don't have to repeat autotype unnecessarily,
        // copy an autotype back to layoutIn
        if(!layoutIn[axName] && axLayoutIn.type !== '-') {
            layoutIn[axName] = {type: axLayoutIn.type};
        }

    });

    // plot_bgcolor only makes sense if there's a (2D) plot!
    // TODO: bgcolor for each subplot, to inherit from the main one
    if(xaList.length && yaList.length) {
        Lib.coerce(layoutIn, layoutOut, Plots.layoutAttributes, 'plot_bgcolor');
    }
};

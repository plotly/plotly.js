/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../registry');
var SUBPLOT_PATTERN = require('./cartesian/constants').SUBPLOT_PATTERN;

/**
 * Get calcdata trace(s) associated with a given subplot
 *
 * @param {array} calcData: as in gd.calcdata
 * @param {string} type: subplot type
 * @param {string} subplotId: subplot id to look for
 *
 * @return {array} array of calcdata traces
 */
exports.getSubplotCalcData = function(calcData, type, subplotId) {
    var basePlotModule = Registry.subplotsRegistry[type];
    if(!basePlotModule) return [];

    var attr = basePlotModule.attr;
    var subplotCalcData = [];

    for(var i = 0; i < calcData.length; i++) {
        var calcTrace = calcData[i];
        var trace = calcTrace[0].trace;

        if(trace[attr] === subplotId) subplotCalcData.push(calcTrace);
    }

    return subplotCalcData;
};
/**
 * Get calcdata trace(s) that can be plotted with a given module
 * NOTE: this isn't necessarily just exactly matching trace type,
 * if multiple trace types use the same plotting routine, they will be
 * collected here.
 * In order to not plot the same thing multiple times, we return two arrays,
 * the calcdata we *will* plot with this module, and the ones we *won't*
 *
 * @param {array} calcdata: as in gd.calcdata
 * @param {object|string} typeOrModule: the plotting module, or its name
 *
 * @return {array[array]} [foundCalcdata, remainingCalcdata]
 */
exports.getModuleCalcData = function(calcdata, typeOrModule) {
    var moduleCalcData = [];
    var remainingCalcData = [];
    var _module = typeof typeOrModule === 'string' ? Registry.getModule(typeOrModule) : typeOrModule;
    if(!_module) return [moduleCalcData, calcdata];

    for(var i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var trace = cd[0].trace;
        if(trace.visible !== true) continue;

        // we use this to find data to plot - so if there's a .plot
        if(trace._module.plot === _module.plot) {
            moduleCalcData.push(cd);
        }
        else {
            remainingCalcData.push(cd);
        }
    }

    return [moduleCalcData, remainingCalcData];
};

/**
 * Get the data trace(s) associated with a given subplot.
 *
 * @param {array} data  plotly full data array.
 * @param {string} type subplot type to look for.
 * @param {string} subplotId subplot id to look for.
 *
 * @return {array} list of trace objects.
 *
 */
exports.getSubplotData = function getSubplotData(data, type, subplotId) {
    if(!Registry.subplotsRegistry[type]) return [];

    var attr = Registry.subplotsRegistry[type].attr;
    var subplotData = [];
    var trace, subplotX, subplotY;

    if(type === 'gl2d') {
        var spmatch = subplotId.match(SUBPLOT_PATTERN);
        subplotX = 'x' + spmatch[1];
        subplotY = 'y' + spmatch[2];
    }

    for(var i = 0; i < data.length; i++) {
        trace = data[i];

        if(type === 'gl2d' && Registry.traceIs(trace, 'gl2d')) {
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

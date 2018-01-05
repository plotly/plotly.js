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
 * Get calcdata traces(s) associated with a given subplot
 *
 * @param {array} calcData (as in gd.calcdata)
 * @param {string} type subplot type
 * @param {string} subplotId subplot id to look for
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

exports.getModuleCalcData = function(calcdata, typeOrModule) {
    var moduleCalcData = [];
    var _module = typeof typeOrModule === 'string' ? Registry.getModule(typeOrModule) : typeOrModule;
    if(!_module) return moduleCalcData;

    for(var i = 0; i < calcdata.length; i++) {
        var cd = calcdata[i];
        var trace = cd[0].trace;

        if((trace._module === _module) && (trace.visible === true)) moduleCalcData.push(cd);
    }

    return moduleCalcData;
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

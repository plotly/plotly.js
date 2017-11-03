/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Registry = require('../registry');

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

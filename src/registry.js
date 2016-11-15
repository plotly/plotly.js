/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('./lib');
var basePlotAttributes = require('./plots/attributes');

exports.modules = {};
exports.allCategories = {};
exports.allTypes = [];
exports.subplotsRegistry = {};
exports.transformsRegistry = {};
exports.componentsRegistry = {};
exports.layoutArrayContainers = [];

/**
 * register a module as the handler for a trace type
 *
 * @param {object} _module the module that will handle plotting this trace type
 * @param {string} thisType
 * @param {array of strings} categoriesIn all the categories this type is in,
 *     tested by calls: traceIs(trace, oneCategory)
 * @param {object} meta meta information about the trace type
 */
exports.register = function(_module, thisType, categoriesIn, meta) {
    if(exports.modules[thisType]) {
        Lib.log('Type ' + thisType + ' already registered');
        return;
    }

    var categoryObj = {};
    for(var i = 0; i < categoriesIn.length; i++) {
        categoryObj[categoriesIn[i]] = true;
        exports.allCategories[categoriesIn[i]] = true;
    }

    exports.modules[thisType] = {
        _module: _module,
        categories: categoryObj
    };

    if(meta && Object.keys(meta).length) {
        exports.modules[thisType].meta = meta;
    }

    exports.allTypes.push(thisType);
};

/**
 * register a subplot type
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
 */
exports.registerSubplot = function(_module) {
    var plotType = _module.name;

    if(exports.subplotsRegistry[plotType]) {
        Lib.log('Plot type ' + plotType + ' already registered.');
        return;
    }

    // not sure what's best for the 'cartesian' type at this point
    exports.subplotsRegistry[plotType] = _module;
};

exports.registerComponent = function(_module) {
    var name = _module.name;

    exports.componentsRegistry[name] = _module;

    if(_module.layoutAttributes && _module.layoutAttributes._isLinkedToArray) {
        Lib.pushUnique(exports.layoutArrayContainers, name);
    }
};

/**
 * Get registered module using trace object or trace type
 *
 * @param {object||string} trace
 *  trace object with prop 'type' or trace type as a string
 * @return {object}
 *  module object corresponding to trace type
 */
exports.getModule = function(trace) {
    if(trace.r !== undefined) {
        Lib.warn('Tried to put a polar trace ' +
            'on an incompatible graph of cartesian ' +
            'data. Ignoring this dataset.', trace
        );
        return false;
    }

    var _module = exports.modules[getTraceType(trace)];
    if(!_module) return false;
    return _module._module;
};

/**
 * Determine if this trace type is in a given category
 *
 * @param {object||string} traceType
 *  a trace (object) or trace type (string)
 * @param {string} category
 *  category in question
 * @return {boolean}
 */
exports.traceIs = function(traceType, category) {
    traceType = getTraceType(traceType);

    // old plot.ly workspace hack, nothing to see here
    if(traceType === 'various') return false;

    var _module = exports.modules[traceType];

    if(!_module) {
        if(traceType && traceType !== 'area') {
            Lib.log('Unrecognized trace type ' + traceType + '.');
        }

        _module = exports.modules[basePlotAttributes.type.dflt];
    }

    return !!_module.categories[category];
};

/**
 * Retrieve component module method
 *
 * @param {string} name
 *  name of component (as declared in component module)
 * @param {string} method
 *  name of component module method
 * @return {function}
 */
exports.getComponentMethod = function(name, method) {
    var _module = exports.componentsRegistry[name];

    if(!_module) return Lib.noop;
    return _module[method];
};

function getTraceType(traceType) {
    if(typeof traceType === 'object') traceType = traceType.type;
    return traceType;
}

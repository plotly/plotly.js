/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Loggers = require('./lib/loggers');
var noop = require('./lib/noop');
var pushUnique = require('./lib/push_unique');
var ExtendModule = require('./lib/extend');
var extendFlat = ExtendModule.extendFlat;
var extendDeepAll = ExtendModule.extendDeepAll;

var basePlotAttributes = require('./plots/attributes');
var baseLayoutAttributes = require('./plots/layout_attributes');

exports.modules = {};
exports.allCategories = {};
exports.allTypes = [];
exports.subplotsRegistry = {};
exports.transformsRegistry = {};
exports.componentsRegistry = {};
exports.layoutArrayContainers = [];
exports.layoutArrayRegexes = [];
exports.traceLayoutAttributes = {};

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
        Loggers.log('Type ' + thisType + ' already registered');
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

    for(var componentName in exports.componentsRegistry) {
        mergeComponentAttrsToTrace(componentName, thisType);
    }

    /*
     * Collect all trace layout attributes in one place for easier lookup later
     * but don't merge them into the base schema as it would confuse the docs
     * (at least after https://github.com/plotly/documentation/issues/202 gets done!)
     */
    if(_module.layoutAttributes) {
        extendFlat(exports.traceLayoutAttributes, _module.layoutAttributes);
    }
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
        Loggers.log('Plot type ' + plotType + ' already registered.');
        return;
    }

    // relayout array handling will look for component module methods with this
    // name and won't find them because this is a subplot module... but that
    // should be fine, it will just fall back on redrawing the plot.
    findArrayRegexps(_module);

    // not sure what's best for the 'cartesian' type at this point
    exports.subplotsRegistry[plotType] = _module;

    for(var componentName in exports.componentsRegistry) {
        mergeComponentAttrsToSubplot(componentName, _module.name);
    }
};

exports.registerComponent = function(_module) {
    var name = _module.name;

    exports.componentsRegistry[name] = _module;

    if(_module.layoutAttributes) {
        if(_module.layoutAttributes._isLinkedToArray) {
            pushUnique(exports.layoutArrayContainers, name);
        }
        findArrayRegexps(_module);
    }

    for(var traceType in exports.modules) {
        mergeComponentAttrsToTrace(name, traceType);
    }

    for(var subplotName in exports.subplotsRegistry) {
        mergeComponentAttrsToSubplot(name, subplotName);
    }

    for(var transformType in exports.transformsRegistry) {
        mergeComponentAttrsToTransform(name, transformType);
    }

    if(_module.schema && _module.schema.layout) {
        extendDeepAll(baseLayoutAttributes, _module.schema.layout);
    }
};

exports.registerTransform = function(_module) {
    exports.transformsRegistry[_module.name] = _module;

    for(var componentName in exports.componentsRegistry) {
        mergeComponentAttrsToTransform(componentName, _module.name);
    }
};

function findArrayRegexps(_module) {
    if(_module.layoutAttributes) {
        var arrayAttrRegexps = _module.layoutAttributes._arrayAttrRegexps;
        if(arrayAttrRegexps) {
            for(var i = 0; i < arrayAttrRegexps.length; i++) {
                pushUnique(exports.layoutArrayRegexes, arrayAttrRegexps[i]);
            }
        }
    }
}

function mergeComponentAttrsToTrace(componentName, traceType) {
    var componentSchema = exports.componentsRegistry[componentName].schema;
    if(!componentSchema || !componentSchema.traces) return;

    var traceAttrs = componentSchema.traces[traceType];
    if(traceAttrs) {
        extendDeepAll(exports.modules[traceType]._module.attributes, traceAttrs);
    }
}

function mergeComponentAttrsToTransform(componentName, transformType) {
    var componentSchema = exports.componentsRegistry[componentName].schema;
    if(!componentSchema || !componentSchema.transforms) return;

    var transformAttrs = componentSchema.transforms[transformType];
    if(transformAttrs) {
        extendDeepAll(exports.transformsRegistry[transformType].attributes, transformAttrs);
    }
}

function mergeComponentAttrsToSubplot(componentName, subplotName) {
    var componentSchema = exports.componentsRegistry[componentName].schema;
    if(!componentSchema || !componentSchema.subplots) return;

    var subplotModule = exports.subplotsRegistry[subplotName];
    var subplotAttrs = subplotModule.layoutAttributes;
    var subplotAttr = subplotModule.attr === 'subplot' ? subplotModule.name : subplotModule.attr;
    if(Array.isArray(subplotAttr)) subplotAttr = subplotAttr[0];

    var componentLayoutAttrs = componentSchema.subplots[subplotAttr];
    if(subplotAttrs && componentLayoutAttrs) {
        extendDeepAll(subplotAttrs, componentLayoutAttrs);
    }
}

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
        Loggers.warn('Tried to put a polar trace ' +
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
            Loggers.log('Unrecognized trace type ' + traceType + '.');
        }

        _module = exports.modules[basePlotAttributes.type.dflt];
    }

    return !!_module.categories[category];
};

/**
 * Determine if this trace has a transform of the given type and return
 * array of matching indices.
 *
 * @param {object} data
 *  a trace object (member of data or fullData)
 * @param {string} type
 *  type of trace to test
 * @return {array}
 *  array of matching indices. If none found, returns []
 */
exports.getTransformIndices = function(data, type) {
    var indices = [];
    var transforms = data.transforms || [];
    for(var i = 0; i < transforms.length; i++) {
        if(transforms[i].type === type) {
            indices.push(i);
        }
    }
    return indices;
};

/**
 * Determine if this trace has a transform of the given type
 *
 * @param {object} data
 *  a trace object (member of data or fullData)
 * @param {string} type
 *  type of trace to test
 * @return {boolean}
 */
exports.hasTransform = function(data, type) {
    var transforms = data.transforms || [];
    for(var i = 0; i < transforms.length; i++) {
        if(transforms[i].type === type) {
            return true;
        }
    }
    return false;

};

/**
 * Retrieve component module method. Falls back on noop if either the
 * module or the method is missing, so the result can always be safely called
 *
 * @param {string} name
 *  name of component (as declared in component module)
 * @param {string} method
 *  name of component module method
 * @return {function}
 */
exports.getComponentMethod = function(name, method) {
    var _module = exports.componentsRegistry[name];

    if(!_module) return noop;
    return _module[method] || noop;
};

function getTraceType(traceType) {
    if(typeof traceType === 'object') traceType = traceType.type;
    return traceType;
}

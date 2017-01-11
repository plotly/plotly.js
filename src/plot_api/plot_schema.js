/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../registry');
var Lib = require('../lib');

var baseAttributes = require('../plots/attributes');
var baseLayoutAttributes = require('../plots/layout_attributes');
var frameAttributes = require('../plots/frame_attributes');
var animationAttributes = require('../plots/animation_attributes');

// polar attributes are not part of the Registry yet
var polarAreaAttrs = require('../plots/polar/area_attributes');
var polarAxisAttrs = require('../plots/polar/axis_attributes');

var extendFlat = Lib.extendFlat;
var extendDeep = Lib.extendDeep;

var IS_SUBPLOT_OBJ = '_isSubplotObj';
var IS_LINKED_TO_ARRAY = '_isLinkedToArray';
var DEPRECATED = '_deprecated';
var UNDERSCORE_ATTRS = [IS_SUBPLOT_OBJ, IS_LINKED_TO_ARRAY, DEPRECATED];

exports.IS_SUBPLOT_OBJ = IS_SUBPLOT_OBJ;
exports.IS_LINKED_TO_ARRAY = IS_LINKED_TO_ARRAY;
exports.DEPRECATED = DEPRECATED;
exports.UNDERSCORE_ATTRS = UNDERSCORE_ATTRS;

/** Outputs the full plotly.js plot schema
 *
 * @return {object}
 *  - defs
 *  - traces
 *  - layout
 *  - transforms
 *  - frames
 *  - animations
 *  - config (coming soon ...)
 */
exports.get = function() {
    var traces = {};

    Registry.allTypes.concat('area').forEach(function(type) {
        traces[type] = getTraceAttributes(type);
    });

    var transforms = {};

    Object.keys(Registry.transformsRegistry).forEach(function(type) {
        transforms[type] = getTransformAttributes(type);
    });

    return {
        defs: {
            valObjects: Lib.valObjects,
            metaKeys: UNDERSCORE_ATTRS.concat(['description', 'role'])
        },

        traces: traces,
        layout: getLayoutAttributes(),

        transforms: transforms,

        frames: getFramesAttributes(),
        animation: formatAttributes(animationAttributes)
    };
};

/**
 * Crawl the attribute tree, recursively calling a callback function
 *
 * @param {object} attrs
 *  The node of the attribute tree (e.g. the root) from which recursion originates
 * @param {Function} callback
 *  A callback function with the signature:
 *          @callback callback
 *          @param {object} attr an attribute
 *          @param {String} attrName name string
 *          @param {object[]} attrs all the attributes
 *          @param {Number} level the recursion level, 0 at the root
 * @param {Number} [specifiedLevel]
 *  The level in the tree, in order to let the callback function detect descend or backtrack,
 *  typically unsupplied (implied 0), just used by the self-recursive call.
 *  The necessity arises because the tree traversal is not controlled by callback return values.
 *  The decision to not use callback return values for controlling tree pruning arose from
 *  the goal of keeping the crawler backwards compatible. Observe that one of the pruning conditions
 *  precedes the callback call.
 *
 * @return {object} transformOut
 *  copy of transformIn that contains attribute defaults
 */
exports.crawl = function(attrs, callback, specifiedLevel) {
    var level = specifiedLevel || 0;

    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        if(UNDERSCORE_ATTRS.indexOf(attrName) !== -1) return;

        callback(attr, attrName, attrs, level);

        if(exports.isValObject(attr)) return;

        if(Lib.isPlainObject(attr)) exports.crawl(attr, callback, level + 1);
    });
};

/** Is object a value object (or a container object)?
 *
 * @param {object} obj
 * @return {boolean}
 *  returns true for a valid value object and
 *  false for tree nodes in the attribute hierarchy
 */
exports.isValObject = function(obj) {
    return obj && obj.valType !== undefined;
};

/**
 * Find all data array attributes in a given trace object - including
 * `arrayOk` attributes.
 *
 * @param {object} trace
 *  full trace object that contains a reference to `_module.attributes`
 *
 * @return {array} arrayAttributes
 *  list of array attributes for the given trace
 */
exports.findArrayAttributes = function(trace) {
    var arrayAttributes = [],
        stack = [];

    function callback(attr, attrName, attrs, level) {
        stack = stack.slice(0, level).concat([attrName]);

        var splittableAttr = attr && (attr.valType === 'data_array' || attr.arrayOk === true);
        if(!splittableAttr) return;

        var astr = toAttrString(stack);
        var val = Lib.nestedProperty(trace, astr).get();
        if(!Array.isArray(val)) return;

        arrayAttributes.push(astr);
    }

    function toAttrString(stack) {
        return stack.join('.');
    }

    exports.crawl(trace._module.attributes, callback);

    if(trace.transforms) {
        var transforms = trace.transforms;

        for(var i = 0; i < transforms.length; i++) {
            var transform = transforms[i];

            stack = ['transforms[' + i + ']'];

            exports.crawl(transform._module.attributes, callback, 1);
        }
    }

    // Look into the fullInput module attributes for array attributes
    // to make sure that 'custom' array attributes are detected.
    //
    // At the moment, we need this block to make sure that
    // ohlc and candlestick 'open', 'high', 'low', 'close' can be
    // used with filter ang groupby transforms.
    if(trace._fullInput) {
        exports.crawl(trace._fullInput._module.attributes, callback);

        arrayAttributes = Lib.filterUnique(arrayAttributes);
    }

    return arrayAttributes;
};

function getTraceAttributes(type) {
    var _module, basePlotModule;

    if(type === 'area') {
        _module = { attributes: polarAreaAttrs };
        basePlotModule = {};
    }
    else {
        _module = Registry.modules[type]._module,
        basePlotModule = _module.basePlotModule;
    }

    var attributes = {};

    // make 'type' the first attribute in the object
    attributes.type = null;

    // base attributes (same for all trace types)
    extendDeep(attributes, baseAttributes);

    // module attributes
    extendDeep(attributes, _module.attributes);

    // subplot attributes
    if(basePlotModule.attributes) {
        extendDeep(attributes, basePlotModule.attributes);
    }

    // add registered components trace attributes
    Object.keys(Registry.componentsRegistry).forEach(function(k) {
        var _module = Registry.componentsRegistry[k];

        if(_module.schema && _module.schema.traces && _module.schema.traces[type]) {
            Object.keys(_module.schema.traces[type]).forEach(function(v) {
                insertAttrs(attributes, _module.schema.traces[type][v], v);
            });
        }
    });

    // 'type' gets overwritten by baseAttributes; reset it here
    attributes.type = type;

    var out = {
        meta: _module.meta || {},
        attributes: formatAttributes(attributes),
    };

    // trace-specific layout attributes
    if(_module.layoutAttributes) {
        var layoutAttributes = {};

        extendDeep(layoutAttributes, _module.layoutAttributes);
        out.layoutAttributes = formatAttributes(layoutAttributes);
    }

    return out;
}

function getLayoutAttributes() {
    var layoutAttributes = {};

    // global layout attributes
    extendDeep(layoutAttributes, baseLayoutAttributes);

    // add base plot module layout attributes
    Object.keys(Registry.subplotsRegistry).forEach(function(k) {
        var _module = Registry.subplotsRegistry[k];

        if(!_module.layoutAttributes) return;

        if(_module.name === 'cartesian') {
            handleBasePlotModule(layoutAttributes, _module, 'xaxis');
            handleBasePlotModule(layoutAttributes, _module, 'yaxis');
        }
        else {
            var astr = _module.attr === 'subplot' ? _module.name : _module.attr;

            handleBasePlotModule(layoutAttributes, _module, astr);
        }
    });

    // polar layout attributes
    layoutAttributes = assignPolarLayoutAttrs(layoutAttributes);

    // add registered components layout attributes
    Object.keys(Registry.componentsRegistry).forEach(function(k) {
        var _module = Registry.componentsRegistry[k];

        if(!_module.layoutAttributes) return;

        if(_module.schema && _module.schema.layout) {
            Object.keys(_module.schema.layout).forEach(function(v) {
                insertAttrs(layoutAttributes, _module.schema.layout[v], v);
            });
        }
        else {
            insertAttrs(layoutAttributes, _module.layoutAttributes, _module.name);
        }
    });

    return {
        layoutAttributes: formatAttributes(layoutAttributes)
    };
}

function getTransformAttributes(type) {
    var _module = Registry.transformsRegistry[type];
    var attributes = extendDeep({}, _module.attributes);

    // add registered components transform attributes
    Object.keys(Registry.componentsRegistry).forEach(function(k) {
        var _module = Registry.componentsRegistry[k];

        if(_module.schema && _module.schema.transforms && _module.schema.transforms[type]) {
            Object.keys(_module.schema.transforms[type]).forEach(function(v) {
                insertAttrs(attributes, _module.schema.transforms[type][v], v);
            });
        }
    });

    return {
        attributes: formatAttributes(attributes)
    };
}

function getFramesAttributes() {
    var attrs = {
        frames: Lib.extendDeep({}, frameAttributes)
    };

    formatAttributes(attrs);

    return attrs.frames;
}

function formatAttributes(attrs) {
    mergeValTypeAndRole(attrs);
    formatArrayContainers(attrs);

    return attrs;
}

function mergeValTypeAndRole(attrs) {

    function makeSrcAttr(attrName) {
        return {
            valType: 'string',
            role: 'info',
            description: [
                'Sets the source reference on plot.ly for ',
                attrName, '.'
            ].join(' ')
        };
    }

    function callback(attr, attrName, attrs) {
        if(exports.isValObject(attr)) {
            if(attr.valType === 'data_array') {
                // all 'data_array' attrs have role 'data'
                attr.role = 'data';
                // all 'data_array' attrs have a corresponding 'src' attr
                attrs[attrName + 'src'] = makeSrcAttr(attrName);
            }
            else if(attr.arrayOk === true) {
                // all 'arrayOk' attrs have a corresponding 'src' attr
                attrs[attrName + 'src'] = makeSrcAttr(attrName);
            }
        }
        else if(Lib.isPlainObject(attr)) {
            // all attrs container objects get role 'object'
            attr.role = 'object';
        }
    }

    exports.crawl(attrs, callback);
}

function formatArrayContainers(attrs) {

    function callback(attr, attrName, attrs) {
        if(!attr) return;

        var itemName = attr[IS_LINKED_TO_ARRAY];

        if(!itemName) return;

        delete attr[IS_LINKED_TO_ARRAY];

        attrs[attrName] = { items: {} };
        attrs[attrName].items[itemName] = attr;
        attrs[attrName].role = 'object';
    }

    exports.crawl(attrs, callback);
}

function assignPolarLayoutAttrs(layoutAttributes) {
    extendFlat(layoutAttributes, {
        radialaxis: polarAxisAttrs.radialaxis,
        angularaxis: polarAxisAttrs.angularaxis
    });

    extendFlat(layoutAttributes, polarAxisAttrs.layout);

    return layoutAttributes;
}

function handleBasePlotModule(layoutAttributes, _module, astr) {
    var np = Lib.nestedProperty(layoutAttributes, astr),
        attrs = extendDeep({}, _module.layoutAttributes);

    attrs[IS_SUBPLOT_OBJ] = true;
    np.set(attrs);
}

function insertAttrs(baseAttrs, newAttrs, astr) {
    var np = Lib.nestedProperty(baseAttrs, astr);

    np.set(extendDeep(np.get() || {}, newAttrs));
}

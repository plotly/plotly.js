/**
* Copyright 2012-2016, Plotly, Inc.
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

// polar attributes are not part of the Registry yet
var polarAreaAttrs = require('../plots/polar/area_attributes');
var polarAxisAttrs = require('../plots/polar/axis_attributes');

var extendFlat = Lib.extendFlat;
var extendDeep = Lib.extendDeep;

var IS_SUBPLOT_OBJ = '_isSubplotObj';
var IS_LINKED_TO_ARRAY = '_isLinkedToArray';
var DEPRECATED = '_deprecated';
var UNDERSCORE_ATTRS = [IS_SUBPLOT_OBJ, IS_LINKED_TO_ARRAY, DEPRECATED];

exports.IS_SUBPLOT_OBJ = '_isSubplotObj';
exports.IS_LINKED_TO_ARRAY = '_isLinkedToArray';
exports.DEPRECATED = DEPRECATED;
exports.UNDERSCORE_ATTRS = UNDERSCORE_ATTRS;

/** Outputs the full plotly.js plot schema
 *
 * @return {object}
 *  - defs
 *  - traces
 *  - layout
 *  - transforms
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
            metaKeys: UNDERSCORE_ATTRS.concat['description', 'role']
        },

        traces: traces,
        layout: getLayoutAttributes(),

        transforms: transforms,




PlotSchema.crawl = Lib.crawl;

PlotSchema.isValObject = Lib.isValObject;






    }




    }
}



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

    // add registered components layout attribute
    Object.keys(Registry.componentsRegistry).forEach(function(k) {
        var _module = Registry.componentsRegistry[k];

        if(!_module.layoutAttributes) return;

        if(Array.isArray(_module.layoutNodes)) {
            _module.layoutNodes.forEach(function(v) {
                handleRegisteredComponent(layoutAttributes, _module, v + _module.name);
            });
        }
        else {
            handleRegisteredComponent(layoutAttributes, _module, _module.name);
        }
    });

    return {
        layoutAttributes: formatAttributes(layoutAttributes)
    };
}

function getTransformAttributes(type) {
    var _module = Registry.transformsRegistry[type];

    return {
        attributes: formatAttributes(_module.attributes)
    };
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
        if(PlotSchema.isValObject(attr)) {
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

    Lib.crawl(attrs, callback);
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

function handleRegisteredComponent(layoutAttributes, _module, astr) {
    var np = Lib.nestedProperty(layoutAttributes, astr),
        attrs = extendDeep(np.get() || {}, _module.layoutAttributes);

    np.set(attrs);
}

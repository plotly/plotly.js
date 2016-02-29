/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var Plots = require('../plots/plots');
var Lib = require('../lib');

var extendFlat = Lib.extendFlat;
var extendDeep = Lib.extendDeep;
var extendDeepAll = Lib.extendDeepAll;

var NESTED_MODULE = '_nestedModules',
    COMPOSED_MODULE = '_composedModules',
    IS_SUBPLOT_OBJ = '_isSubplotObj',
    IS_LINKED_TO_ARRAY = '_isLinkedToArray',
    DEPRECATED = '_deprecated';

// list of underscore attributes to keep in schema as is
var UNDERSCORE_ATTRS = [IS_SUBPLOT_OBJ, IS_LINKED_TO_ARRAY, DEPRECATED];

var plotSchema = {
    traces: {},
    layout: {},
    defs: {}
};

// FIXME polar attribute are not part of Plotly yet
var polarAreaAttrs = require('../plots/polar/area_attributes'),
    polarAxisAttrs = require('../plots/polar/axis_attributes');

var PlotSchema = module.exports = {};


PlotSchema.get = function() {
    Plots.allTypes
        .concat('area')  // FIXME polar 'area' attributes
        .forEach(getTraceAttributes);

    getLayoutAttributes();
    getDefs();
    return plotSchema;
};

PlotSchema.crawl = function(attrs, callback) {
    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        if(UNDERSCORE_ATTRS.indexOf(attrName) !== -1) return;

        callback(attr, attrName, attrs);

        if(PlotSchema.isValObject(attr)) return;
        if(Lib.isPlainObject(attr)) PlotSchema.crawl(attr, callback);
    });
};

PlotSchema.isValObject = function(obj) {
    return obj && obj.valType !== undefined;
};

function getTraceAttributes(type) {
    var globalAttributes = Plots.attributes,
        _module = getModule({type: type}),
        meta = getMeta(type),
        subplotRegistry = getSubplotRegistry(type);

    var attributes = {},
        layoutAttributes = {};

    // make 'type' the first attribute in the object
    attributes.type = null;

    // global attributes (same for all trace types)
    extendDeep(attributes, globalAttributes);

    // module attributes (+ nested + composed)
    attributes = coupleAttrs(
        _module.attributes, attributes, 'attributes', type
    );

    // subplot attributes
    if(subplotRegistry.attributes !== undefined) {
        extendDeep(attributes, subplotRegistry.attributes);
    }

    // 'type' gets overwritten by globalAttributes; reset it here
    attributes.type = type;

    attributes = removeUnderscoreAttrs(attributes);
    mergeValTypeAndRole(attributes);
    plotSchema.traces[type] = extendFlat({},
        meta,
        { attributes: attributes }
    );

    // trace-specific layout attributes
    if(_module.layoutAttributes !== undefined) {
        layoutAttributes = coupleAttrs(
            _module.layoutAttributes, layoutAttributes, 'layoutAttributes', type
        );

        mergeValTypeAndRole(layoutAttributes);
        plotSchema.traces[type].layoutAttributes = layoutAttributes;
    }
}

function getLayoutAttributes() {
    var globalLayoutAttributes = Plots.layoutAttributes,
        layoutAttributes = {};

    // layout module attributes (+ nested + composed)
    layoutAttributes = coupleAttrs(
        globalLayoutAttributes, layoutAttributes, 'layoutAttributes', '*'
    );

    // FIXME polar layout attributes
    layoutAttributes = assignPolarLayoutAttrs(layoutAttributes);

    // add IS_SUBPLOT_OBJ attribute
    layoutAttributes = handleSubplotObjs(layoutAttributes);

    layoutAttributes = removeUnderscoreAttrs(layoutAttributes);
    mergeValTypeAndRole(layoutAttributes);

    // generate IS_LINKED_TO_ARRAY structure
    layoutAttributes = handleLinkedToArray(layoutAttributes);

    plotSchema.layout = { layoutAttributes: layoutAttributes };
}

function getDefs() {
    plotSchema.defs = {
        valObjects: Lib.valObjects,
        metaKeys: UNDERSCORE_ATTRS.concat(['description', 'role'])
    };
}

function coupleAttrs(attrsIn, attrsOut, whichAttrs, type) {
    var nestedModule, nestedAttrs, nestedReference,
        composedModule, composedAttrs;

    Object.keys(attrsIn).forEach(function(k) {

        if(k === NESTED_MODULE) {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                nestedModule = getModule({module: attrsIn[k][kk]});
                if(nestedModule === undefined) return;

                nestedAttrs = nestedModule[whichAttrs];
                nestedReference = coupleAttrs(
                    nestedAttrs, {}, whichAttrs, type
                );

                Lib.nestedProperty(attrsOut, kk)
                    .set(extendDeep({}, nestedReference));
            });
            return;
        }

        if(k === COMPOSED_MODULE) {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                if(kk !== type) return;

                composedModule = getModule({module: attrsIn[k][kk]});
                if(composedModule === undefined) return;

                composedAttrs = composedModule[whichAttrs];
                composedAttrs = coupleAttrs(
                    composedAttrs, {}, whichAttrs, type
                );

                extendDeepAll(attrsOut, composedAttrs);
            });
            return;
        }

        attrsOut[k] = Lib.isPlainObject(attrsIn[k]) ?
            extendDeepAll({}, attrsIn[k]) :
            attrsIn[k];
    });

    return attrsOut;
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

    PlotSchema.crawl(attrs, callback);
}

// helper methods

function getModule(arg) {
    if('type' in arg) {
        return (arg.type === 'area') ?  // FIXME
            { attributes: polarAreaAttrs } :
            Plots.getModule({type: arg.type});
    }

    var subplotsRegistry = Plots.subplotsRegistry,
        _module = arg.module;

    if(subplotsRegistry[_module]) return subplotsRegistry[_module];
    else if('module' in arg) return Plotly[_module];
}

function removeUnderscoreAttrs(attributes) {
    Object.keys(attributes).forEach(function(k) {
        if(k.charAt(0) === '_' &&
            UNDERSCORE_ATTRS.indexOf(k) === -1) delete attributes[k];
    });
    return attributes;
}

function getMeta(type) {
    if(type === 'area') return {};  // FIXME
    return Plots.modules[type].meta || {};
}

function assignPolarLayoutAttrs(layoutAttributes) {
    extendFlat(layoutAttributes, {
        radialaxis: polarAxisAttrs.radialaxis,
        angularaxis: polarAxisAttrs.angularaxis
    });

    extendFlat(layoutAttributes, polarAxisAttrs.layout);

    return layoutAttributes;  // FIXME
}

function getSubplotRegistry(traceType) {
    if(traceType === 'area') return {};  // FIXME

    var subplotsRegistry = Plots.subplotsRegistry,
        subplotType = Object.keys(subplotsRegistry).filter(function(subplotType) {
            return Plots.traceIs({type: traceType}, subplotType);
        })[0];

    if(subplotType === undefined) return {};

    return subplotsRegistry[subplotType];
}

function handleSubplotObjs(layoutAttributes) {
    var subplotsRegistry = Plots.subplotsRegistry;

    Object.keys(layoutAttributes).forEach(function(k) {
        Object.keys(subplotsRegistry).forEach(function(subplotType) {
            var subplotRegistry = subplotsRegistry[subplotType],
                isSubplotObj;

            if(subplotType === 'cartesian' || subplotType === 'gl2d') {
                isSubplotObj = (
                    subplotRegistry.attrRegex.x.test(k) ||
                    subplotRegistry.attrRegex.y.test(k)
                );
            }
            else {
                isSubplotObj = subplotRegistry.attrRegex.test(k);
            }

            if(isSubplotObj) layoutAttributes[k][IS_SUBPLOT_OBJ] = true;
        });
    });

    return layoutAttributes;
}

function handleLinkedToArray(layoutAttributes) {
    Object.keys(layoutAttributes).forEach(function(k) {
        var attr = extendDeep({}, layoutAttributes[k]);

        if(attr[IS_LINKED_TO_ARRAY] !== true) return;

        var itemName = k.substr(0, k.length-1);  // TODO more robust logic

        delete attr[IS_LINKED_TO_ARRAY];

        layoutAttributes[k] = { items: {} };
        layoutAttributes[k].items[itemName] = attr;
        layoutAttributes[k].role = 'object';
    });

    return layoutAttributes;
}

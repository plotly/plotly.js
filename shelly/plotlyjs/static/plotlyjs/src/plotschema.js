'use strict';

var Plotly = require('./plotly'),
    objectAssign = require('object-assign');

var NESTED_MODULE_ID = '_nestedModules',
    COMPOSED_MODULE_ID = '_composedModules',
    IS_LINKED_TO_ARRAY = '_isLinkedToArray',
    IS_SUBPLOT_OBJ = '_isSubplotObj';

var plotSchema = {
    traces: {},
    layout: {},
    defs: {}
};

// FIXME polar attribute are not part of Plotly yet
var polarAreaAttrs = require('./polar/attributes/area'),
    polarAxisAttrs = require('./polar/attributes/polaraxes');

var PlotSchema = module.exports = {};

PlotSchema.get =  function() {
    Plotly.Plots.allTypes
        .concat('area')  // FIXME polar 'area' attributes
        .forEach(getTraceAttributes);

    getLayoutAttributes();
    getDefs();
    return plotSchema;
};

PlotSchema.crawl = function(attrs, callback) {
    Object.keys(attrs).forEach(function(attrName) {
        var attr = attrs[attrName];

        callback(attr, attrName);

        if(PlotSchema.isValObject(attr)) return;
        if(Plotly.Lib.isPlainObject(attr)) PlotSchema.crawl(attr, callback);
    });
};

PlotSchema.isValObject = function(obj) {
    return obj && obj.valType !== undefined;
};

function getTraceAttributes(type) {
    var globalAttributes = Plotly.Plots.attributes,
        _module = getModule({type: type}),
        meta = getMeta(type),
        attributes = {},
        layoutAttributes = {};

    // make 'type' the first attribute in the object
    attributes.type = null;

    // module attributes (+ nested + composed)
    attributes = coupleAttrs(
        _module.attributes, attributes, 'attributes', type
    );

    // global attributes (same for all trace types)
    attributes = objectAssign(attributes, globalAttributes);

    // 'type' gets overwritten by globalAttributes; reset it here
    attributes.type = type;

    attributes = removeUnderscoreAttrs(attributes);

    mergeValTypeAndRole(attributes);
    plotSchema.traces[type] = objectAssign(
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
    var globalLayoutAttributes = Plotly.Plots.layoutAttributes,
        subplotsRegistry = Plotly.Plots.subplotsRegistry,
        layoutAttributes = {};

    // global attributes (same for all trace types)
    layoutAttributes = objectAssign(layoutAttributes, globalLayoutAttributes);

    // layout module attributes (+ nested + composed)
    layoutAttributes = coupleAttrs(
        globalLayoutAttributes, layoutAttributes, 'layoutAttributes', '*'
    );

    // FIXME polar layout attributes
    layoutAttributes = assignPolarLayoutAttrs(layoutAttributes);
    layoutAttributes = removeUnderscoreAttrs(layoutAttributes);

    // add IS_SUBPLOT_OBJ key
    Object.keys(layoutAttributes).forEach(function(k) {
        if(subplotsRegistry.gl3d.idRegex.test(k) ||
            subplotsRegistry.geo.idRegex.test(k) ||
            /^xaxis[0-9]*$/.test(k) ||
            /^yaxis[0-9]*$/.test(k)
          ) layoutAttributes[k][IS_SUBPLOT_OBJ] = true;
    });

    mergeValTypeAndRole(layoutAttributes);
    plotSchema.layout = { layoutAttributes: layoutAttributes };
}

function getDefs() {
    plotSchema.defs = { valObjects: Plotly.Lib.valObjects };
}

function coupleAttrs(attrsIn, attrsOut, whichAttrs, type) {
    var nestedModule, nestedAttrs, nestedReference,
        composedModule, composedAttrs;

    Object.keys(attrsIn).forEach(function(k) {

        if(k === NESTED_MODULE_ID) {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                nestedModule = getModule({module: attrsIn[k][kk]});
                if(nestedModule === undefined) return;

                nestedAttrs = nestedModule[whichAttrs];
                nestedReference = coupleAttrs(
                    nestedAttrs, {}, whichAttrs, type
                );

                Plotly.Lib.nestedProperty(attrsOut, kk)
                    .set(nestedReference);
            });
            return;
        }

        if(k === COMPOSED_MODULE_ID) {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                if(kk !== type) return;

                composedModule = getModule({module: attrsIn[k][kk]});
                if(composedModule === undefined) return;

                composedAttrs = composedModule[whichAttrs];
                composedAttrs = coupleAttrs(
                    composedAttrs, {}, whichAttrs, type
                );

                attrsOut = objectAssign(attrsOut, composedAttrs);
            });
            return;
        }

        attrsOut[k] = objectAssign({}, attrsIn[k]);
    });

    return attrsOut;
}

function mergeValTypeAndRole(attrs) {

    function callback(attr) {
        if(PlotSchema.isValObject(attr)) {
           if(attr.valType === 'data_array') attr.role = 'data';
        }
        else if(Plotly.Lib.isPlainObject(attr)) attr.role = 'object';
    }

    PlotSchema.crawl(attrs, callback);
}

// helper methods

function getModule(arg) {
    if('type' in arg) {
        return (arg.type === 'area') ?  // FIXME
            { attributes: polarAreaAttrs } :
            Plotly.Plots.getModule({type: arg.type});
    }
    else if('module' in arg) return Plotly[arg.module];
}

function removeUnderscoreAttrs(attributes) {
    Object.keys(attributes).forEach(function(k){
        if(k.charAt(0) === '_' && k !== IS_LINKED_TO_ARRAY) delete attributes[k];
    });
    return attributes;
}
function getMeta(type) {
    if(type === 'area') return {};  // FIXME
    return Plotly.Plots.modules[type].meta || {};
}

function assignPolarLayoutAttrs(layoutAttributes) {
    layoutAttributes = objectAssign(layoutAttributes, {
        radialaxis: polarAxisAttrs.radialaxis,
        angularaxis: polarAxisAttrs.angularaxis
    });

    layoutAttributes = objectAssign(layoutAttributes, polarAxisAttrs.layout);

    return layoutAttributes;
}

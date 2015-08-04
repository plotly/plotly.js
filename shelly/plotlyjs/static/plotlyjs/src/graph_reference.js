'use strict';

var Plotly = require('./plotly'),
    objectAssign = require('object-assign');

var NESTEDMODULEID = '_nestedModules',
    COMPOSEDMODULEID = '_composedModules',
    ANYTYPE = '*',
    ISLINKEDTOARRAY = '_isLinkedToArray',
    ISSUBPLOTOBJ = '_isSubplotObj';

var graphReference = {
    traces: {},
    layout: {}
};


module.exports = function getGraphReference() {
    Plotly.Plots.allTypes.forEach(getTraceAttributes);
    getLayoutAttributes();
    return graphReference;
};

function getTraceAttributes(type) {
    var globalAttributes = Plotly.Plots.attributes,
        _module = getModule({type: type}),
        attributes = {},
        layoutAttributes = {};

    // global attributes (same for all trace types)
    attributes = objectAssign(attributes, globalAttributes);

    // module attributes (+ nested + composed)
    attributes = coupleAttrs(
        _module.attributes, attributes, 'attributes', type
    );

    attributes.type = type;
    attributes = removeUnderscoreAttrs(attributes);

    graphReference.traces[type] = { attributes: attributes };

    // trace-specific layout attributes
    if(_module.layoutAttributes !== undefined) {
        layoutAttributes = coupleAttrs(
            _module.layoutAttributes, layoutAttributes, 'layoutAttributes', type
        );
        graphReference.traces[type].layoutAttributes = layoutAttributes;
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
        globalLayoutAttributes, layoutAttributes, 'layoutAttributes', ANYTYPE
    );

    layoutAttributes = removeUnderscoreAttrs(layoutAttributes);

    // add ISSUBPLOTOBJ key
    Object.keys(layoutAttributes).forEach(function(k) {
        if(subplotsRegistry.gl3d.idRegex.test(k) ||
            subplotsRegistry.geo.idRegex.test(k) ||
            /^xaxis[0-9]*$/.test(k) ||
            /^yaxis[0-9]*$/.test(k)
          ) layoutAttributes[k][ISSUBPLOTOBJ] = true;
    });

    graphReference.layout = { layoutAttributes: layoutAttributes };
}

function coupleAttrs(attrsIn, attrsOut, whichAttrs, type) {
    var nestedModule, nestedAttrs, nestedReference,
        composedModule, composedAttrs;

    Object.keys(attrsIn).forEach(function(k) {

        if(k === NESTEDMODULEID) {
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

        if(k === COMPOSEDMODULEID) {
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

        attrsOut[k] = attrsIn[k];
    });

    return attrsOut;
}

// helper methods

function getModule(arg) {
    if('type' in arg) return Plotly.Plots.getModule({type: arg.type});
    else if('module' in arg) return Plotly[arg.module];
}

function removeUnderscoreAttrs(attributes) {
    Object.keys(attributes).forEach(function(k){
        if(k.charAt(0) === '_' && k !== ISLINKEDTOARRAY) delete attributes[k];
    });
    return attributes;
}

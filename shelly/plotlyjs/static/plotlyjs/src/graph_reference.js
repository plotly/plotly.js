'use strict';

var Plotly = require('./plotly'),
    objectAssign = require('object-assign');

var NESTEDMODULEID = '_nestedModules',
    COMPOSEDMODULEID = '_composedModules';


    ANYTYPE = '*',

var graphReference = {
    traces: {},
    layout: {}
};


function getGraphReference() {
    Plotly.Plots.allTypes.forEach(getTraceAttributes);
    getLayoutAttributes();
    return graphReference;
}

module.exports = getGraphReference;

function getTraceAttributes(type) {
    var globalAttributes = Plotly.Plots.attributes,
        module = getModule({type: type}),
        attributes = {},
        layoutAttributes = {};

    // global attributes (same for all trace types)
    attributes = objectAssign(attributes, globalAttributes);

    // module attributes (+ nested + composed)
    attributes = coupleAttrs(
        module.attributes, attributes, 'attributes', type
    );

    attributes.type = type;
    attributes = removeUnderscoreAttrs(attributes);

    graphReference.traces[type] = {
        attribures: attributes
    };

    // trace-specific layout attributes
    if(module.layoutAttributes !== undefined) {
        layoutAttributes = coupleAttrs(
            module.layoutAttributes, layoutAttributes, 'layoutAttributes', type
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
    // TODO how to present keys '{x,y}axis[1-9]' or 'scene[1-9]'?
    // TODO how to present 'annotations' Array ?


    graphReference.layout = {
        layoutAttributes: layoutAttributes
    };
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
       if(k.charAt(0) === '_') delete attributes[k];
    });
    return attributes;
}

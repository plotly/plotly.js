'use strict';

var Plotly = require('./plotly'),
    objectAssign = require('object-assign');

var graphReference = {},

var NESTEDMODULEID = '_nestedModules',
    COMPOSEDMODULEID = '_composedModules';


function getGraphReference() {
    var Plots = Plotly.Plots;

    Plots.allTypes.forEach(function(type) {

        graphReference[type] = {};
        Methods.getAttributes(type);
        Methods.getLayoutAttributes(type);

    });

    return graphReference;
}

module.exports = getGraphReference;

function getTraceAttributes(type) {
    var globalAttributes = Plotly.Plots.attributes,
        attributes = {};

        module = getModule({type: type}),

    // global attributes
    attributes = objectAssign(attributes, globalAttributes);

    // module attributes (+ nested + composed)
    attributes = coupleAttrs(
        module.attributes, attributes, 'attributes', type
    );
    attributes.type = type;
    attributes = removeUnderscoreAttrs(attributes);

    graphReference[type].attributes = attributes;

    var Plots = Plotly.Plots,
        globalLayoutAttributes = Plots.layoutAttributes,
        layoutAttributes = {};
}

function getLayoutAttributes() {
    var sceneAttrs;

    // global layout attributes
    layoutAttributes = objectAssign(layoutAttributes, globalLayoutAttributes);

    // more global (maybe list these in graph_obj ??)
    layoutAttributes = objectAssign(layoutAttributes, Plotly.Fx.layoutAttributes);
    layoutAttributes.legend = Plotly.Legend.layoutAttributes;

    if (Plots.traceIs(type, 'gl3d')) {
        sceneAttrs = Plotly.Gl3dLayout.layoutAttributes;
        sceneAttrs = Methods.coupleAttrs(
            sceneAttrs, {},
            'layoutAttributes', '-'
        );
        layoutAttributes.scene = sceneAttrs;
    }
    else {
        layoutAttributes.xaxis = Plotly.Axes.layoutAttributes;
        layoutAttributes.yaxis = Plotly.Axes.layoutAttributes;
        layoutAttributes.annotations = Plotly.Annotations.layoutAttributes;
    }

    layoutAttributes = removeUnderscoreAttrs(layoutAttributes);
    // TODO how to present keys '{x,y}axis[1-9]' or 'scene[1-9]'?
    // TODO how to present 'annotations' Array ?


    graphReference[type].layoutAttributes = layoutAttributes;
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

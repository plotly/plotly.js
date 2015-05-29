'use strict';

var Plotly = require('./plotly'),
    objectAssign = require('object-assign');

var graphReference = {},
    Methods = {};

function getGraphReference() {
    var Plots = Plotly.Plots;

    Plots.ALLTYPES.forEach(function(type) {

        graphReference[type] = {};
        Methods.getAttributes(type);
        Methods.getLayoutAttributes(type);

    });

    return graphReference;
}

module.exports = getGraphReference;

Methods.getAttributes = function(type) {
    var globalAttributes = Plotly.Plots.attributes,
        attributes = {};

    var module;

    // global attributes
    attributes = objectAssign(attributes, globalAttributes);

    // module attributes (+ nested + composed)
    module = Methods.getModule({type: type});
    attributes = Methods.coupleAttrs(module.attributes, attributes,
                                     'attributes', type);

    attributes.type = type;
    attributes = Methods.removeUnderscoreAttrs(attributes);

    graphReference[type].attributes = attributes;
};

Methods.getLayoutAttributes = function(type) {
    var Plots = Plotly.Plots,
        globalLayoutAttributes = Plots.layoutAttributes,
        layoutAttributes = {};

    var sceneAttrs;

    // global layout attributes
    layoutAttributes = objectAssign(layoutAttributes, globalLayoutAttributes);

    // more global (maybe list these in graph_obj ??)
    layoutAttributes = objectAssign(layoutAttributes, Plotly.Fx.layoutAttributes);
    layoutAttributes.legend = Plotly.Legend.layoutAttributes;

    if (Plots.traceIs(type, 'gl3d')) {
        sceneAttrs = Plotly.Gl3dLayout.layoutAttributes;
        sceneAttrs = Methods.coupleAttrs(sceneAttrs, {},
                                         'layoutAttributes', '-');
        layoutAttributes.scene = sceneAttrs;
    }
    else {
        layoutAttributes.xaxis = Plotly.Axes.layoutAttributes;
        layoutAttributes.yaxis = Plotly.Axes.layoutAttributes;
        layoutAttributes.annotations = Plotly.Annotations.layoutAttributes;
    }

    // TODO how to present keys '{x,y}axis[1-9]' or 'scene[1-9]'?
    // TODO how to present 'annotations' Array ?

    layoutAttributes = Methods.removeUnderscoreAttrs(layoutAttributes);

    graphReference[type].layoutAttributes = layoutAttributes;
};

Methods.coupleAttrs = function(attrsIn, attrsOut, whichAttrs, type) {
    var nestedModule, nestedAttrs,
        composedModule, composedAttrs;

    Object.keys(attrsIn).forEach(function(k) {

        if (k === '_nestedModules') {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                nestedModule = Methods.getModule({module: attrsIn[k][kk]});
                nestedAttrs = nestedModule[whichAttrs];
                attrsOut[kk] = Methods.coupleAttrs(nestedAttrs, {},
                                                   whichAttrs, type);
            });
            return;
        }

        if (k === '_composedModules') {
            Object.keys(attrsIn[k]).forEach(function(kk) {
                if (kk !== type) return;
                composedModule = Methods.getModule({module: attrsIn[k][kk]});
                composedAttrs = composedModule[whichAttrs];
                composedAttrs = Methods.coupleAttrs(composedAttrs, {},
                                                    whichAttrs, type);
                attrsOut = objectAssign(attrsOut, composedAttrs);
            });
            return;
        }

        attrsOut[k] = attrsIn[k];

    });

    return attrsOut;
};

// helper methods

Methods.getModule = function(arg) {
    if ('type' in arg) return Plotly.Plots.getModule({type: arg.type});
    else if ('module' in arg) return Plotly[arg.module];
};

Methods.removeUnderscoreAttrs = function(attributes) {
    Object.keys(attributes).forEach(function(k){
       if (k.charAt(0) === '_') delete attributes[k];
    });
    return attributes;
};

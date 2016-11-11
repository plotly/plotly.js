/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var handleArrayContainerDefaults = require('../../plots/array_container_defaults');

var attributes = require('./attributes');
var constants = require('./constants');

var name = constants.name;
var stepAttrs = attributes.steps;


module.exports = function slidersDefaults(layoutIn, layoutOut) {
    var opts = {
        name: name,
        handleItemDefaults: sliderDefaults
    };

    handleArrayContainerDefaults(layoutIn, layoutOut, opts);
};

function sliderDefaults(sliderIn, sliderOut, layoutOut) {

    function coerce(attr, dflt) {
        return Lib.coerce(sliderIn, sliderOut, attributes, attr, dflt);
    }

    var steps = stepsDefaults(sliderIn, sliderOut);

    var visible = coerce('visible', steps.length > 0);
    if(!visible) return;

    coerce('active');

    coerce('x');
    coerce('y');
    Lib.noneOrAll(sliderIn, sliderOut, ['x', 'y']);

    coerce('xanchor');
    coerce('yanchor');

    coerce('len');
    coerce('lenmode');

    coerce('pad.t');
    coerce('pad.r');
    coerce('pad.b');
    coerce('pad.l');

    Lib.coerceFont(coerce, 'font', layoutOut.font);

    var currentValueIsVisible = coerce('currentvalue.visible');

    if(currentValueIsVisible) {
        coerce('currentvalue.xanchor');
        coerce('currentvalue.prefix');
        coerce('currentvalue.suffix');
        coerce('currentvalue.offset');

        Lib.coerceFont(coerce, 'currentvalue.font', sliderOut.font);
    }

    coerce('transition.duration');
    coerce('transition.easing');

    coerce('bgcolor');
    coerce('activebgcolor');
    coerce('bordercolor');
    coerce('borderwidth');
    coerce('ticklen');
    coerce('tickwidth');
    coerce('tickcolor');
    coerce('minorticklen');
}

function stepsDefaults(sliderIn, sliderOut) {
    var valuesIn = sliderIn.steps || [],
        valuesOut = sliderOut.steps = [];

    var valueIn, valueOut;

    function coerce(attr, dflt) {
        return Lib.coerce(valueIn, valueOut, stepAttrs, attr, dflt);
    }

    for(var i = 0; i < valuesIn.length; i++) {
        valueIn = valuesIn[i];
        valueOut = {};

        if(!Lib.isPlainObject(valueIn) || !Array.isArray(valueIn.args)) {
            continue;
        }

        coerce('method');
        coerce('args');
        coerce('label', 'step-' + i);
        coerce('value', valueOut.label);

        valuesOut.push(valueOut);
    }

    return valuesOut;
}

/**
* Copyright 2012-2017, Plotly, Inc.
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
var buttonAttrs = attributes.buttons;


module.exports = function updateMenusDefaults(layoutIn, layoutOut) {
    var opts = {
        name: name,
        handleItemDefaults: menuDefaults
    };

    handleArrayContainerDefaults(layoutIn, layoutOut, opts);
};

function menuDefaults(menuIn, menuOut, layoutOut) {

    function coerce(attr, dflt) {
        return Lib.coerce(menuIn, menuOut, attributes, attr, dflt);
    }

    var buttons = buttonsDefaults(menuIn, menuOut);

    var visible = coerce('visible', buttons.length > 0);
    if(!visible) return;

    coerce('active');
    coerce('direction');
    coerce('type');
    coerce('showactive');

    coerce('x');
    coerce('y');
    Lib.noneOrAll(menuIn, menuOut, ['x', 'y']);

    coerce('xanchor');
    coerce('yanchor');

    coerce('pad.t');
    coerce('pad.r');
    coerce('pad.b');
    coerce('pad.l');

    Lib.coerceFont(coerce, 'font', layoutOut.font);

    coerce('bgcolor', layoutOut.paper_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
}

function buttonsDefaults(menuIn, menuOut) {
    var buttonsIn = menuIn.buttons || [],
        buttonsOut = menuOut.buttons = [];

    var buttonIn, buttonOut;

    function coerce(attr, dflt) {
        return Lib.coerce(buttonIn, buttonOut, buttonAttrs, attr, dflt);
    }

    for(var i = 0; i < buttonsIn.length; i++) {
        buttonIn = buttonsIn[i];
        buttonOut = {};

        if(!Lib.isPlainObject(buttonIn) || !Array.isArray(buttonIn.args)) {
            continue;
        }

        coerce('method');
        coerce('args');
        coerce('label');

        buttonOut._index = i;
        buttonsOut.push(buttonOut);
    }

    return buttonsOut;
}

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var buttonAttrs = require('./button_attributes');


module.exports = function rangeSelectorDefaults(containerIn, containerOut, layout) {
    var selectorIn = containerIn.rangeselector || {},
        selectorOut = containerOut.rangeselector = {};

    function coerce(attr, dflt) {
        return Lib.coerce(selectorIn, selectorOut, attributes, attr, dflt);
    }

    var buttons = buttonsDefaults(selectorIn, selectorOut);

    var visible = coerce('visible', buttons.length > 0);
    if(!visible) return;

    coerce('x');
    coerce('y');
    Lib.noneOrAll(containerIn, containerOut, ['x', 'y']);

    coerce('xanchor');
    coerce('yanchor');

    Lib.coerceFont(coerce, 'font', layout.font);

    coerce('bgcolor', layout.paper_bgcolor);
    coerce('bordercolor');
    coerce('borderwidth');
};

function buttonsDefaults(containerIn, containerOut) {
    var buttonsIn = containerIn.buttons || [],
        buttonsOut = containerOut.buttons = [];

    var buttonIn, buttonOut;

    function coerce(attr, dflt) {
        return Lib.coerce(buttonIn, buttonOut, buttonAttrs, attr, dflt);
    }

    for(var i = 0; i < buttonsIn.length; i++) {
        buttonIn = buttonsIn[i];
        buttonOut = {};

        coerce('step');
        coerce('stepmode');
        coerce('count');
        coerce('label');

        buttonsOut.push(buttonOut);
    }

    return buttonsOut;
}

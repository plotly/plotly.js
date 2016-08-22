/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Color = require('../color');

var attributes = require('./attributes');
var buttonAttrs = require('./button_attributes');
var constants = require('./constants');


module.exports = function rangeSelectorDefaults(containerIn, containerOut, layout, counterAxes) {
    var selectorIn = containerIn.rangeselector || {},
        selectorOut = containerOut.rangeselector = {};

    function coerce(attr, dflt) {
        return Lib.coerce(selectorIn, selectorOut, attributes, attr, dflt);
    }

    var buttons = buttonsDefaults(selectorIn, selectorOut);

    var visible = coerce('visible', buttons.length > 0);
    if(!visible) return;

    var posDflt = getPosDflt(containerOut, layout, counterAxes);
    coerce('x', posDflt[0]);
    coerce('y', posDflt[1]);
    Lib.noneOrAll(containerIn, containerOut, ['x', 'y']);

    coerce('xanchor');
    coerce('yanchor');

    Lib.coerceFont(coerce, 'font', layout.font);

    var bgColor = coerce('bgcolor');
    coerce('activecolor', Color.contrast(bgColor, constants.lightAmount, constants.darkAmount));
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

        if(!Lib.isPlainObject(buttonIn)) continue;

        var step = coerce('step');
        if(step !== 'all') {
            coerce('stepmode');
            coerce('count');
        }

        coerce('label');

        buttonOut._index = i;
        buttonsOut.push(buttonOut);
    }

    return buttonsOut;
}

function getPosDflt(containerOut, layout, counterAxes) {
    var anchoredList = counterAxes.filter(function(ax) {
        return layout[ax].anchor === containerOut._id;
    });

    var posY = 0;
    for(var i = 0; i < anchoredList.length; i++) {
        var domain = layout[anchoredList[i]].domain;
        if(domain) posY = Math.max(domain[1], posY);
    }

    return [containerOut.domain[0], posY + constants.yPad];
}

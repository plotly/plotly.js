/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var createModebar = require('./');
var buttonsConfig = require('./buttons_config');

/**
 * Modebar wrapper around 'create' and 'update',
 * chooses buttons to pass to Modebar constructor based on
 * plot type and plot config.
 *
 * @param {object} gd main plot object
 *
 */
module.exports = function manageModebar(gd) {
    var fullLayout = gd._fullLayout,
        context = gd._context,
        modebar = fullLayout._modebar;

    if(!context.displayModeBar && modebar) {
        modebar.destroy();
        delete fullLayout._modebar;
        return;
    }

    var buttons = chooseButtons(fullLayout, context.modebarButtons);

    if(modebar) modebar.update(gd, buttons);
    else fullLayout._modebar = createModebar(gd, buttons);
};

function chooseButtons(fullLayout) {
    var buttons = findButtons('all');

    if(fullLayout._hasGL3D) buttons = buttons.concat(findButtons('gl3d'));

    if(fullLayout._hasGeo) buttons = buttons.concat(findButtons('geo'));

    if(fullLayout._hasCartesian && !areAllAxesFixed(fullLayout)) {
        buttons = buttons.concat(findButtons('2d'));
        buttons = buttons.concat(findButtons('cartesian'));
    }

    if(fullLayout._hasGL2D) {
        buttons = buttons.concat(findButtons('2d'));
        buttons = buttons.concat(findButtons('gl2d'));
    }

    if(fullLayout._hasPie) buttons = buttons.concat(findButtons('pie'));

    buttons = groupButtons(buttons);

    return buttons;
}

function findButtons(category, list) {
    var buttonNames = Object.keys(buttonsConfig);
    var out = [];

    for(var i = 0; i < buttonNames.length; i++) {
        var buttonName = buttonNames[i];
        if(buttonsConfig[buttonName].category === category) out.push(buttonName);
    }

    return out;
}

function areAllAxesFixed(fullLayout) {
    var axList = Plotly.Axes.list({_fullLayout: fullLayout}, null, true);
    var allFixed = true;

    for(var i = 0; i < axList.length; i++) {
        if(!axList[i].fixedrange) {
            allFixed = false;
            break;
        }
    }

    return allFixed;
}

function groupButtons(buttons) {
    var hashObj = {};
    var i;

    for(i = 0; i < buttons.length; i++) {
        var button = buttons[i],
            group = buttonsConfig[button].group;

        if(hashObj[group] === undefined) hashObj[group] = [button];
        else hashObj[group].push(button);
    }

    var groups = Object.keys(hashObj);
    var out = [];

    for(i = 0; i < groups.length; i++) {
        out.push(hashObj[groups[i]]);
    }

    return out;
}

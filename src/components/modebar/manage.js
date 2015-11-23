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
var modebarButtons = require('./buttons');

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

    if(!Array.isArray(context.modebarButtonsToRemove)) {
        throw new Error([
            '*modebarButtonsToRemove* configuration options',
            'must be an array.'
        ].join(' '));
    }

    var buttons = chooseButtons(fullLayout, context.modebarButtonsToRemove);

    if(modebar) modebar.update(gd, buttons);
    else fullLayout._modebar = createModebar(gd, buttons);
};

function chooseButtons(fullLayout, buttonsToRemove) {
    var buttons = findButtons({category: 'all'}),
        buttons2d = findButtons({category: '2d'});

    // TODO how to plots of multiple types?

    if(fullLayout._hasGL3D) {
        buttons = buttons.concat(findButtons({category: 'gl3d'}));
    }

    if(fullLayout._hasGeo) {
        buttons = buttons.concat(findButtons({category: 'geo'}));
    }

    if(fullLayout._hasCartesian) {
        if(areAllAxesFixed(fullLayout)) {
            buttons = buttons.concat(findButtons({
                category: 'cartesian',
                group: 'hover'
            }));
        }
        else {
            buttons = buttons.concat(buttons2d);
            buttons = buttons.concat(findButtons({category: 'cartesian'}));
        }
    }

    if(fullLayout._hasGL2D) {
        buttons = buttons.concat(buttons2d);
        buttons = buttons.concat(findButtons({category: 'gl2d'}));
    }

    if(fullLayout._hasPie) {
        buttons = buttons.concat(findButtons({category: 'pie'}));
    }

    buttons = filterButtons(buttons, buttonsToRemove);
    buttons = groupButtons(buttons);

    return buttons;
}

// Find buttons in buttonsConfig by category or group
function findButtons(opts) {
    var buttonNames = Object.keys(buttonsConfig),
        category = opts.category,
        group = opts.group;

    var out = [];

    for(var i = 0; i < buttonNames.length; i++) {
        var buttonName = buttonNames[i];

        if(category && buttonsConfig[buttonName].category !== category) continue;
        if(group && buttonsConfig[buttonName].group !== group) continue;

        out.push(buttonName);
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

// Remove buttons according to modebarButtonsToRemove plot config options
function filterButtons(buttons, buttonsToRemove) {
    var out = [];

    for(var i = 0; i < buttons.length; i++) {
        var button = buttons[i];

        if(buttonsToRemove.indexOf(button) !== -1) continue;

        out.push(button);
    }

    return out;
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

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

    var buttonGroups = getButtonGroups(fullLayout, context.modebarButtonsToRemove);

    if(modebar) modebar.update(gd, buttonGroups);
    else fullLayout._modebar = createModebar(gd, buttonGroups);
};

// logic behind which buttons are displayed by default
function getButtonGroups(fullLayout, buttonsToRemove) {
    var groups = [];

    function addGroup(newGroup) {
        var out = [];

        for(var i = 0; i < newGroup.length; i++) {
            var button = newGroup[i];
            if(buttonsToRemove.indexOf(button) !== -1) continue;
            out.push(modebarButtons[button]);
        }

        groups.push(out);
    }

    // buttons common to all plot types
    addGroup(['toImage', 'sendDataToCloud']);

    if(fullLayout._hasGL3D) {
        addGroup(['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation']);
        addGroup(['resetCameraDefault3d', 'resetCameraLastSave3d']);
        addGroup(['hoverClosest3d']);
    }

    if(fullLayout._hasGeo) {
        addGroup(['zoomInGeo', 'zoomOutGeo', 'resetGeo']);
        addGroup(['hoverClosestGeo']);
    }

    var hasCartesian = fullLayout._hasCartesian,
        hasGL2D = fullLayout._hasGL2D,
        allAxesFixed = areAllAxesFixed(fullLayout);

    if((hasCartesian || hasGL2D) && !allAxesFixed) {
        addGroup(['zoom2d', 'pan2d']);
        addGroup(['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']);
    }

    if(hasCartesian) {
        addGroup(['hoverClosestCartesian', 'hoverCompareCartesian']);
    }
    if(hasGL2D) {
        addGroup(['hoverClosestGl2d']);
    }
    if(fullLayout._hasPie) {
        addGroup(['hoverClosestPie']);
    }

    return groups;
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

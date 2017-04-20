/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var scatterSubTypes = require('../../traces/scatter/subtypes');

var createModeBar = require('./modebar');
var modeBarButtons = require('./buttons');

/**
 * ModeBar wrapper around 'create' and 'update',
 * chooses buttons to pass to ModeBar constructor based on
 * plot type and plot config.
 *
 * @param {object} gd main plot object
 *
 */
module.exports = function manageModeBar(gd) {
    var fullLayout = gd._fullLayout,
        context = gd._context,
        modeBar = fullLayout._modeBar;

    if(!context.displayModeBar) {
        if(modeBar) {
            modeBar.destroy();
            delete fullLayout._modeBar;
        }
        return;
    }

    if(!Array.isArray(context.modeBarButtonsToRemove)) {
        throw new Error([
            '*modeBarButtonsToRemove* configuration options',
            'must be an array.'
        ].join(' '));
    }

    if(!Array.isArray(context.modeBarButtonsToAdd)) {
        throw new Error([
            '*modeBarButtonsToAdd* configuration options',
            'must be an array.'
        ].join(' '));
    }

    var customButtons = context.modeBarButtons;
    var buttonGroups;

    if(Array.isArray(customButtons) && customButtons.length) {
        buttonGroups = fillCustomButton(customButtons);
    }
    else {
        buttonGroups = getButtonGroups(
            gd,
            context.modeBarButtonsToRemove,
            context.modeBarButtonsToAdd
        );
    }

    if(modeBar) modeBar.update(gd, buttonGroups);
    else fullLayout._modeBar = createModeBar(gd, buttonGroups);
};

// logic behind which buttons are displayed by default
function getButtonGroups(gd, buttonsToRemove, buttonsToAdd) {
    var fullLayout = gd._fullLayout,
        fullData = gd._fullData;

    var hasCartesian = fullLayout._has('cartesian'),
        hasGL3D = fullLayout._has('gl3d'),
        hasGeo = fullLayout._has('geo'),
        hasPie = fullLayout._has('pie'),
        hasGL2D = fullLayout._has('gl2d'),
        hasTernary = fullLayout._has('ternary');

    var groups = [];

    function addGroup(newGroup) {
        var out = [];

        for(var i = 0; i < newGroup.length; i++) {
            var button = newGroup[i];
            if(buttonsToRemove.indexOf(button) !== -1) continue;
            out.push(modeBarButtons[button]);
        }

        groups.push(out);
    }

    // buttons common to all plot types
    addGroup(['toImage', 'sendDataToCloud']);

    // graphs with more than one plot types get 'union buttons'
    // which reset the view or toggle hover labels across all subplots.
    if((hasCartesian || hasGL2D || hasPie || hasTernary) + hasGeo + hasGL3D > 1) {
        addGroup(['resetViews', 'toggleHover']);
        return appendButtonsToGroups(groups, buttonsToAdd);
    }

    if(hasGL3D) {
        addGroup(['zoom3d', 'pan3d', 'orbitRotation', 'tableRotation']);
        addGroup(['resetCameraDefault3d', 'resetCameraLastSave3d']);
        addGroup(['hoverClosest3d']);
    }

    if(hasGeo) {
        addGroup(['zoomInGeo', 'zoomOutGeo', 'resetGeo']);
        addGroup(['hoverClosestGeo']);
    }

    var allAxesFixed = areAllAxesFixed(fullLayout),
        dragModeGroup = [];

    if(((hasCartesian || hasGL2D) && !allAxesFixed) || hasTernary) {
        dragModeGroup = ['zoom2d', 'pan2d'];
    }
    if((hasCartesian || hasTernary) && isSelectable(fullData)) {
        dragModeGroup.push('select2d');
        dragModeGroup.push('lasso2d');
    }
    if(dragModeGroup.length) addGroup(dragModeGroup);

    if((hasCartesian || hasGL2D) && !allAxesFixed && !hasTernary) {
        addGroup(['zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']);
    }

    if(hasCartesian && hasPie) {
        addGroup(['toggleHover']);
    }
    else if(hasGL2D) {
        addGroup(['hoverClosestGl2d']);
    }
    else if(hasCartesian) {
        addGroup(['toggleSpikelines', 'hoverClosestCartesian', 'hoverCompareCartesian']);
    }
    else if(hasPie) {
        addGroup(['hoverClosestPie']);
    }

    return appendButtonsToGroups(groups, buttonsToAdd);
}

function areAllAxesFixed(fullLayout) {
    var axList = Axes.list({_fullLayout: fullLayout}, null, true);
    var allFixed = true;

    for(var i = 0; i < axList.length; i++) {
        if(!axList[i].fixedrange) {
            allFixed = false;
            break;
        }
    }

    return allFixed;
}

// look for traces that support selection
// to be updated as we add more selectPoints handlers
function isSelectable(fullData) {
    var selectable = false;

    for(var i = 0; i < fullData.length; i++) {
        if(selectable) break;

        var trace = fullData[i];

        if(!trace._module || !trace._module.selectPoints) continue;

        if(trace.type === 'scatter' || trace.type === 'scatterternary') {
            if(scatterSubTypes.hasMarkers(trace) || scatterSubTypes.hasText(trace)) {
                selectable = true;
            }
        }
        // assume that in general if the trace module has selectPoints,
        // then it's selectable. Scatter is an exception to this because it must
        // have markers or text, not just be a scatter type.
        else selectable = true;
    }

    return selectable;
}

function appendButtonsToGroups(groups, buttons) {
    if(buttons.length) {
        if(Array.isArray(buttons[0])) {
            for(var i = 0; i < buttons.length; i++) {
                groups.push(buttons[i]);
            }
        }
        else groups.push(buttons);
    }

    return groups;
}

// fill in custom buttons referring to default mode bar buttons
function fillCustomButton(customButtons) {
    for(var i = 0; i < customButtons.length; i++) {
        var buttonGroup = customButtons[i];

        for(var j = 0; j < buttonGroup.length; j++) {
            var button = buttonGroup[j];

            if(typeof button === 'string') {
                if(modeBarButtons[button] !== undefined) {
                    customButtons[i][j] = modeBarButtons[button];
                }
                else {
                    throw new Error([
                        '*modeBarButtons* configuration options',
                        'invalid button name'
                    ].join(' '));
                }
            }
        }
    }

    return customButtons;
}

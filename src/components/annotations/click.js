/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');


module.exports = {
    hasClickToShow: hasClickToShow,
    onClick: onClick
};

/*
 * hasClickToShow: does the given hoverData have ANY annotations which will
 * turn ON if we click here? (used by hover events to set cursor)
 *
 * gd: graphDiv
 * hoverData: a hoverData array, as included with the *plotly_hover* or
 *     *plotly_click* events in the `points` attribute
 *
 * returns: boolean
 */
function hasClickToShow(gd, hoverData) {
    var sets = getToggleSets(gd, hoverData);
    return sets.on.length > 0 || sets.explicitOff.length > 0;
}

/*
 * onClick: perform the toggling (via Plotly.update) implied by clicking
 * at this hoverData
 *
 * gd: graphDiv
 * hoverData: a hoverData array, as included with the *plotly_hover* or
 *     *plotly_click* events in the `points` attribute
 *
 * returns: Promise that the update is complete
 */
function onClick(gd, hoverData) {
    var toggleSets = getToggleSets(gd, hoverData),
        onSet = toggleSets.on,
        offSet = toggleSets.off.concat(toggleSets.explicitOff),
        update = {},
        i;

    if(!(onSet.length || offSet.length)) return;

    for(i = 0; i < onSet.length; i++) {
        update['annotations[' + onSet[i] + '].visible'] = true;
    }

    for(i = 0; i < offSet.length; i++) {
        update['annotations[' + offSet[i] + '].visible'] = false;
    }

    return Plotly.update(gd, {}, update);
}

/*
 * getToggleSets: find the annotations which will turn on or off at this
 * hoverData
 *
 * gd: graphDiv
 * hoverData: a hoverData array, as included with the *plotly_hover* or
 *     *plotly_click* events in the `points` attribute
 *
 * returns: {
 *   on: Array (indices of annotations to turn on),
 *   off: Array (indices to turn off because you're not hovering on them),
 *   explicitOff: Array (indices to turn off because you *are* hovering on them)
 * }
 */
function getToggleSets(gd, hoverData) {
    var annotations = gd._fullLayout.annotations,
        onSet = [],
        offSet = [],
        explicitOffSet = [],
        hoverLen = (hoverData || []).length;

    var i, j, anni, showMode, pointj, toggleType;

    for(i = 0; i < annotations.length; i++) {
        anni = annotations[i];
        showMode = anni.clicktoshow;
        if(showMode) {
            for(j = 0; j < hoverLen; j++) {
                pointj = hoverData[j];
                if(pointj.x === anni._xclick && pointj.y === anni._yclick &&
                        pointj.xaxis._id === anni.xref &&
                        pointj.yaxis._id === anni.yref) {
                    // match! toggle this annotation
                    // regardless of its clicktoshow mode
                    // but if it's onout mode, off is implicit
                    if(anni.visible) {
                        if(showMode === 'onout') toggleType = offSet;
                        else toggleType = explicitOffSet;
                    }
                    else {
                        toggleType = onSet;
                    }
                    toggleType.push(i);
                    break;
                }
            }

            if(j === hoverLen) {
                // no match - only turn this annotation OFF, and only if
                // showmode is 'onout'
                if(anni.visible && showMode === 'onout') offSet.push(i);
            }
        }
    }

    return {on: onSet, off: offSet, explicitOff: explicitOffSet};
}

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var id2name = require('./axis_ids').id2name;


module.exports = function handleConstraintDefaults(containerIn, containerOut, coerce, allAxisIds, layoutOut) {
    var constraintGroups = layoutOut._axisConstraintGroups;
    var thisID = containerOut._id;
    var letter = thisID.charAt(0);

    if(containerOut.fixedrange) return;

    // coerce the constraint mechanics even if this axis has no scaleanchor
    // because it may be the anchor of another axis.
    coerce('constrain');
    Lib.coerce(containerIn, containerOut, {
        constraintoward: {
            valType: 'enumerated',
            values: letter === 'x' ? ['left', 'center', 'right'] : ['bottom', 'middle', 'top'],
            dflt: letter === 'x' ? 'center' : 'middle'
        }
    }, 'constraintoward');

    if(!containerIn.scaleanchor) return;

    var constraintOpts = getConstraintOpts(constraintGroups, thisID, allAxisIds, layoutOut);

    var scaleanchor = Lib.coerce(containerIn, containerOut, {
        scaleanchor: {
            valType: 'enumerated',
            values: constraintOpts.linkableAxes
        }
    }, 'scaleanchor');

    if(scaleanchor) {
        var scaleratio = coerce('scaleratio');
        // TODO: I suppose I could do attribute.min: Number.MIN_VALUE to avoid zero,
        // but that seems hacky. Better way to say "must be a positive number"?
        // Of course if you use several super-tiny values you could eventually
        // force a product of these to zero and all hell would break loose...
        // Likewise with super-huge values.
        if(!scaleratio) scaleratio = containerOut.scaleratio = 1;

        updateConstraintGroups(constraintGroups, constraintOpts.thisGroup,
            thisID, scaleanchor, scaleratio);
    }
    else if(allAxisIds.indexOf(containerIn.scaleanchor) !== -1) {
        Lib.warn('ignored ' + containerOut._name + '.scaleanchor: "' +
            containerIn.scaleanchor + '" to avoid either an infinite loop ' +
            'and possibly inconsistent scaleratios, or because the target' +
            'axis has fixed range.');
    }
};

function getConstraintOpts(constraintGroups, thisID, allAxisIds, layoutOut) {
    // If this axis is already part of a constraint group, we can't
    // scaleanchor any other axis in that group, or we'd make a loop.
    // Filter allAxisIds to enforce this, also matching axis types.

    var thisType = layoutOut[id2name(thisID)].type;

    var i, j, idj, axj;

    var linkableAxes = [];
    for(j = 0; j < allAxisIds.length; j++) {
        idj = allAxisIds[j];
        if(idj === thisID) continue;

        axj = layoutOut[id2name(idj)];
        if(axj.type === thisType && !axj.fixedrange) linkableAxes.push(idj);
    }

    for(i = 0; i < constraintGroups.length; i++) {
        if(constraintGroups[i][thisID]) {
            var thisGroup = constraintGroups[i];

            var linkableAxesNoLoops = [];
            for(j = 0; j < linkableAxes.length; j++) {
                idj = linkableAxes[j];
                if(!thisGroup[idj]) linkableAxesNoLoops.push(idj);
            }
            return {linkableAxes: linkableAxesNoLoops, thisGroup: thisGroup};
        }
    }

    return {linkableAxes: linkableAxes, thisGroup: null};
}


/*
 * Add this axis to the axis constraint groups, which is the collection
 * of axes that are all constrained together on scale.
 *
 * constraintGroups: a list of objects. each object is
 * {axis_id: scale_within_group}, where scale_within_group is
 * only important relative to the rest of the group, and defines
 * the relative scales between all axes in the group
 *
 * thisGroup: the group the current axis is already in
 * thisID: the id if the current axis
 * scaleanchor: the id of the axis to scale it with
 * scaleratio: the ratio of this axis to the scaleanchor axis
 */
function updateConstraintGroups(constraintGroups, thisGroup, thisID, scaleanchor, scaleratio) {
    var i, j, groupi, keyj, thisGroupIndex;

    if(thisGroup === null) {
        thisGroup = {};
        thisGroup[thisID] = 1;
        thisGroupIndex = constraintGroups.length;
        constraintGroups.push(thisGroup);
    }
    else {
        thisGroupIndex = constraintGroups.indexOf(thisGroup);
    }

    var thisGroupKeys = Object.keys(thisGroup);

    // we know that this axis isn't in any other groups, but we don't know
    // about the scaleanchor axis. If it is, we need to merge the groups.
    for(i = 0; i < constraintGroups.length; i++) {
        groupi = constraintGroups[i];
        if(i !== thisGroupIndex && groupi[scaleanchor]) {
            var baseScale = groupi[scaleanchor];
            for(j = 0; j < thisGroupKeys.length; j++) {
                keyj = thisGroupKeys[j];
                groupi[keyj] = baseScale * scaleratio * thisGroup[keyj];
            }
            constraintGroups.splice(thisGroupIndex, 1);
            return;
        }
    }

    // otherwise, we insert the new scaleanchor axis as the base scale (1)
    // in its group, and scale the rest of the group to it
    if(scaleratio !== 1) {
        for(j = 0; j < thisGroupKeys.length; j++) {
            thisGroup[thisGroupKeys[j]] *= scaleratio;
        }
    }
    thisGroup[scaleanchor] = 1;
}

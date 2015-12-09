/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// Vendor
var isNumeric = require('fast-isnumeric');

// Plotly things
var Lib = require('../lib');

exports.getGraphDiv = getGraphDiv;
exports.spliceTraces = spliceTraces;
// exports.positivifyIndices = positivifyIndices;

function getGraphDiv(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    }
    else if(gd === null || gd === undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;
}


/**
 * A private function to key Extend and Prepend traces DRY
 *
 * @param {Object|HTMLDivElement} gd
 * @param {Object} update
 * @param {Number[]} indices
 * @param {Number||Object} maxPoints
 * @param {Function} lengthenArray
 * @param {Function} spliceArray
 * @return {Object}
 */
function spliceTraces (gd, update, indices, maxPoints, lengthenArray, spliceArray) {

    assertExtendTracesArgs(gd, update, indices, maxPoints);

    var updateProps = getExtendProperties(gd, update, indices, maxPoints),
        remainder = [],
        undoUpdate = {},
        undoPoints = {},
        target,
        prop, 
        maxp;

    for (var i = 0; i < updateProps.length; i++) {

        // prop is the object returned by Lib.nestedProperties
        prop = updateProps[i].prop;
        maxp = updateProps[i].maxp;

        target = lengthenArray(updateProps[i].target, updateProps[i].insert);

        /*
         * If maxp is set within post-extension trace.length, splice to maxp length.
         * Otherwise skip function call as splice op will have no effect anyway.
         */
        if (maxp >= 0 && maxp < target.length) remainder = spliceArray(target, maxp);

        /*
         * to reverse this operation we need the size of the original trace as the reverse
         * operation will need to window out any lengthening operation performed in this pass.
         */
        maxp = updateProps[i].target.length;

        // Magic happens here! update gd.data.trace[key] with new array data.         
        prop.set(target);

        if (!Array.isArray(undoUpdate[prop.astr])) undoUpdate[prop.astr] = [];
        if (!Array.isArray(undoPoints[prop.astr])) undoPoints[prop.astr] = [];

        // build the inverse update object for the undo operation
        undoUpdate[prop.astr].push(remainder);

        // build the matching maxPoints undo object containing original trace lengths.
        undoPoints[prop.astr].push(maxp);
    }

    return { update: undoUpdate, maxPoints: undoPoints };
}


/**
 * A private function to reduce the type checking clutter in spliceTraces.
 * Get all update Properties from gd.data. Validate inputs and outputs.
 * Used by prependTrace and extendTraces
 *
 * @param gd
 * @param update
 * @param indices
 * @param maxPoints
 */
function assertExtendTracesArgs(gd, update, indices, maxPoints) {

    var maxPointsIsObject = Lib.isPlainObject(maxPoints);

    if (!Array.isArray(gd.data)) {
        throw new Error('gd.data must be an array');
    }
    if (!Lib.isPlainObject(update)) {
        throw new Error('update must be a key:value object');
    }

    if (typeof indices === 'undefined') {
        throw new Error('indices must be an integer or array of integers');
    }

    assertIndexArray(gd, indices, 'indices');

    for (var key in update) {

        /*
         * Verify that the attribute to be updated contains as many trace updates
         * as indices. Failure must result in throw and no-op
         */
        if (!Array.isArray(update[key]) || update[key].length !== indices.length) {
            throw new Error('attribute ' + key + ' must be an array of length equal to indices array length');
        }

        /*
         * if maxPoints is an object it must match keys and array lengths of 'update' 1:1
         */
        if (maxPointsIsObject &&
            (!(key in maxPoints) || !Array.isArray(maxPoints[key]) ||
             maxPoints[key].length !== update[key].length )) {
                 throw new Error('when maxPoints is set as a key:value object it must contain a 1:1 ' +
                                'corrispondence with the keys and number of traces in the update object');
             }
    }
}


/**
 * Ensures that an index array for manipulating gd.data is valid.
 *
 * Intended for use with addTraces, deleteTraces, and moveTraces.
 *
 * @param gd
 * @param indices
 * @param arrayName
 */
function assertIndexArray(gd, indices, arrayName) {
    var i,
        index;

    for (i = 0; i < indices.length; i++) {
        index = indices[i];

        // validate that indices are indeed integers
        if (index !== parseInt(index, 10)) {
            throw new Error('all values in ' + arrayName + ' must be integers');
        }

        // check that all indices are in bounds for given gd.data array length
        if (index >= gd.data.length || index < -gd.data.length) {
            throw new Error(arrayName + ' must be valid indices for gd.data.');
        }

        // check that indices aren't repeated
        if (indices.indexOf(index, i + 1) > -1 ||
                index >= 0 && indices.indexOf(-gd.data.length + index) > -1 ||
                index < 0 && indices.indexOf(gd.data.length + index) > -1) {
            throw new Error('each index in ' + arrayName + ' must be unique.');
        }
    }
}


/**
 * A private function to reduce the type checking clutter in spliceTraces.
 *
 * @param {Object|HTMLDivElement} gd
 * @param {Object} update
 * @param {Number[]} indices
 * @param {Number||Object} maxPoints
 * @return {Object[]}
 */
function getExtendProperties (gd, update, indices, maxPoints) {

    var maxPointsIsObject = Lib.isPlainObject(maxPoints),
        updateProps = [],
        trace, 
        target, 
        prop, 
        insert, 
        maxp;

    // allow scalar index to represent a single trace position
    if (!Array.isArray(indices)) indices = [indices];

    // negative indices are wrapped around to their positive value. Equivalent to python indexing.
    indices = positivifyIndices(indices, gd.data.length - 1);

    // loop through all update keys and traces and harvest validated data.
    for (var key in update) {

        for (var j = 0; j < indices.length; j++) {

            /*
             * Choose the trace indexed by the indices map argument and get the prop setter-getter
             * instance that references the key and value for this particular trace.
             */
            trace = gd.data[indices[j]];
            prop = Lib.nestedProperty(trace, key);

            /*
             * Target is the existing gd.data.trace.dataArray value like "x" or "marker.size"
             * Target must exist as an Array to allow the extend operation to be performed.
             */
            target = prop.get();
            insert = update[key][j];

            if (!Array.isArray(insert)) {
                throw new Error('attribute: ' + key + ' index: ' + j + ' must be an array');
            }
            if (!Array.isArray(target)) {
                throw new Error('cannot extend missing or non-array attribute: ' + key);
            }

            /*
             * maxPoints may be an object map or a scalar. If object select the key:value, else
             * Use the scalar maxPoints for all key and trace combinations.
             */
            maxp = maxPointsIsObject ? maxPoints[key][j] : maxPoints;

            // could have chosen null here, -1 just tells us to not take a window
            if (!isNumeric(maxp)) maxp = -1;

            /*
             * Wrap the nestedProperty in an object containing required data
             * for lengthening and windowing this particular trace - key combination.
             * Flooring maxp mirrors the behaviour of floats in the Array.slice JSnative function.
             */
            updateProps.push({
                prop: prop,
                target: target,
                insert: insert,
                maxp: Math.floor(maxp)
            });
        }
    }

    // all target and insertion data now validated
    return updateProps;
}


/**
 * Wrap negative indicies to their positive counterparts.
 *
 * @param {Number[]} indices An array of indices
 * @param {Number} maxIndex The maximum index allowable (arr.length - 1)
 */
function positivifyIndices(indices, maxIndex) {
    var parentLength = maxIndex + 1,
        positiveIndices = [],
        i,
        index;

    for (i = 0; i < indices.length; i++) {
        index = indices[i];
        if (index < 0) {
            positiveIndices.push(parentLength + index);
        } else {
            positiveIndices.push(index);
        }
    }
    return positiveIndices;
}

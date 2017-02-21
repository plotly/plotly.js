/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../lib');
var Registry = require('../registry');


var isAddVal = exports.isAddVal = function isAddVal(val) {
    return val === 'add' || Lib.isPlainObject(val);
};

var isRemoveVal = exports.isRemoveVal = function isRemoveVal(val) {
    return val === null || val === 'remove';
};

/*
 * containerArrayMatch: does this attribute string point into a
 * layout container array?
 *
 * @param {String} astr: an attribute string, like *annotations[2].text*
 *
 * @returns {Object | false} Returns false if `astr` doesn't match a container
 *  array. If it does, returns:
 *     {array: {String}, index: {Number}, property: {String}}
 *  ie the attribute string for the array, the index within the array (or ''
 *  if the whole array) and the property within that (or '' if the whole array
 *  or the whole object)
 */
exports.containerArrayMatch = function containerArrayMatch(astr) {
    var rootContainers = Registry.layoutArrayContainers,
        regexpContainers = Registry.layoutArrayRegexes,
        rootPart = astr.split('[')[0],
        arrayStr,
        match;

    // look for regexp matches first, because they may be nested inside root matches
    // eg updatemenus[i].buttons is nested inside updatemenus
    for(var i = 0; i < regexpContainers.length; i++) {
        match = astr.match(regexpContainers[i]);
        if(match && match.index === 0) {
            arrayStr = match[0];
            break;
        }
    }

    // now look for root matches
    if(!arrayStr) arrayStr = rootContainers[rootContainers.indexOf(rootPart)];

    if(!arrayStr) return false;

    var tail = astr.substr(arrayStr.length);
    if(!tail) return {array: arrayStr, index: '', property: ''};

    match = tail.match(/^\[(0|[1-9][0-9]*)\](\.(.+))?$/);
    if(!match) return false;

    return {array: arrayStr, index: Number(match[1]), property: match[3] || ''};
};

/*
 * editContainerArray: for managing arrays of layout components in relayout
 * handles them all with a consistent interface.
 *
 * Here are the supported actions -> relayout calls -> edits we get here
 * (as prepared in _relayout):
 *
 * add an empty obj -> {'annotations[2]': 'add'} -> {2: {'': 'add'}}
 * add a specific obj -> {'annotations[2]': {attrs}} -> {2: {'': {attrs}}}
 * delete an obj -> {'annotations[2]': 'remove'} -> {2: {'': 'remove'}}
 *               -> {'annotations[2]': null} -> {2: {'': null}}
 * delete the whole array -> {'annotations': 'remove'} -> {'': {'': 'remove'}}
 *                        -> {'annotations': null} -> {'': {'': null}}
 * edit an object -> {'annotations[2].text': 'boo'} -> {2: {'text': 'boo'}}
 *
 * You can combine many edits to different objects. Objects are added and edited
 * in ascending order, then removed in descending order.
 * For example, starting with [a, b, c], if you want to:
 * - replace b with d:
 *   {'annotations[1]': d, 'annotations[2]': null} (b is item 2 after adding d)
 * - add a new item d between a and b, and edit b:
 *    {'annotations[1]': d, 'annotations[2].x': newX} (b is item 2 after adding d)
 * - delete b and edit c:
 *    {'annotations[1]': null, 'annotations[2].x': newX} (c is edited before b is removed)
 *
 * You CANNOT combine adding/deleting an item at index `i` with edits to the same index `i`
 * You CANNOT combine replacing/deleting the whole array with anything else (for the same array).
 *
 * @param {HTMLDivElement} gd
 *  the DOM element of the graph container div
 * @param {Lib.nestedProperty} componentType: the array we are editing
 * @param {Object} edits
 *  the changes to make; keys are indices to edit, values are themselves objects:
 *  {attr: newValue} of changes to make to that index (with add/remove behavior
 *  in special values of the empty attr)
 * @param {Object} flags
 *  the flags for which actions we're going to perform to display these (and
 *  any other) changes. If we're already `recalc`ing, we don't need to redraw
 *  individual items
 *
 * @returns {bool} `true` if it managed to complete drawing of the changes
 *  `false` would mean the parent should replot.
 */
exports.editContainerArray = function editContainerArray(gd, np, edits, flags) {
    var componentType = np.astr,
        supplyComponentDefaults = Registry.getComponentMethod(componentType, 'supplyLayoutDefaults'),
        draw = Registry.getComponentMethod(componentType, 'draw'),
        drawOne = Registry.getComponentMethod(componentType, 'drawOne'),
        replotLater = flags.replot || flags.recalc || (supplyComponentDefaults === Lib.noop) ||
            (draw === Lib.noop),
        layout = gd.layout,
        fullLayout = gd._fullLayout;

    if(edits['']) {
        if(Object.keys(edits).length > 1) {
            Lib.warn('Full array edits are incompatible with other edits',
                componentType);
        }

        var fullVal = edits[''][''];

        if(isRemoveVal(fullVal)) np.set(null);
        else if(Array.isArray(fullVal)) np.set(fullVal);
        else {
            Lib.warn('Unrecognized full array edit value', componentType, fullVal);
            return true;
        }

        if(replotLater) return false;

        supplyComponentDefaults(layout, fullLayout);
        draw(gd);
        return true;
    }

    var componentNums = Object.keys(edits).map(Number).sort(),
        componentArrayIn = np.get(),
        componentArray = componentArrayIn || [];

    var deletes = [],
        firstIndexChange = -1,
        maxIndex = componentArray.length,
        i,
        j,
        componentNum,
        objEdits,
        objKeys,
        objVal,
        adding;

    // first make the add and edit changes
    for(i = 0; i < componentNums.length; i++) {
        componentNum = componentNums[i];
        objEdits = edits[componentNum];
        objKeys = Object.keys(objEdits);
        objVal = objEdits[''],
        adding = isAddVal(objVal);

        if(componentNum < 0 || componentNum > componentArray.length - (adding ? 0 : 1)) {
            Lib.warn('index out of range', componentType, componentNum);
            continue;
        }

        if(objVal !== undefined) {
            if(objKeys.length > 1) {
                Lib.warn(
                    'Insertion & removal are incompatible with edits to the same index.',
                    componentType, componentNum);
            }

            if(isRemoveVal(objVal)) {
                deletes.push(componentNum);
            }
            else if(adding) {
                if(objVal === 'add') objVal = {};
                componentArray.splice(componentNum, 0, objVal);
            }
            else {
                Lib.warn('Unrecognized full object edit value',
                    componentType, componentNum, objVal);
            }

            if(firstIndexChange === -1) firstIndexChange = componentNum;
        }
        else {
            for(j = 0; j < objKeys.length; j++) {
                Lib.nestedProperty(componentArray[componentNum], objKeys[j]).set(objEdits[objKeys[j]]);
            }
        }
    }

    // now do deletes
    for(i = deletes.length - 1; i >= 0; i--) {
        componentArray.splice(deletes[i], 1);
    }

    if(!componentArray.length) np.set(null);
    else if(!componentArrayIn) np.set(componentArray);

    if(replotLater) return false;

    supplyComponentDefaults(layout, fullLayout);

    // finally draw all the components we need to
    // if we added or removed any, redraw all after it
    if(drawOne !== Lib.noop) {
        var indicesToDraw;
        if(firstIndexChange === -1) {
            // there's no re-indexing to do, so only redraw components that changed
            indicesToDraw = componentNums;
        }
        else {
            // in case the component array was shortened, we still need do call
            // drawOne on the latter items so they get properly removed
            maxIndex = Math.max(componentArray.length, maxIndex);
            indicesToDraw = [];
            for(i = 0; i < componentNums.length; i++) {
                componentNum = componentNums[i];
                if(componentNum >= firstIndexChange) break;
                indicesToDraw.push(componentNum);
            }
            for(i = firstIndexChange; i < maxIndex; i++) {
                indicesToDraw.push(i);
            }
        }
        for(i = 0; i < indicesToDraw.length; i++) {
            drawOne(gd, indicesToDraw[i]);
        }
    }
    else draw(gd);

    return true;
};

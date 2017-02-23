/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var isArray = require('./is_array');
var isPlainObject = require('./is_plain_object');
var containerArrayMatch = require('../plot_api/container_array_match');

/**
 * convert a string s (such as 'xaxis.range[0]')
 * representing a property of nested object into set and get methods
 * also return the string and object so we don't have to keep track of them
 * allows [-1] for an array index, to set a property inside all elements
 * of an array
 * eg if obj = {arr: [{a: 1}, {a: 2}]}
 * you can do p = nestedProperty(obj, 'arr[-1].a')
 * but you cannot set the array itself this way, to do that
 * just set the whole array.
 * eg if obj = {arr: [1, 2, 3]}
 * you can't do nestedProperty(obj, 'arr[-1]').set(5)
 * but you can do nestedProperty(obj, 'arr').set([5, 5, 5])
 */
module.exports = function nestedProperty(container, propStr) {
    if(isNumeric(propStr)) propStr = String(propStr);
    else if(typeof propStr !== 'string' ||
            propStr.substr(propStr.length - 4) === '[-1]') {
        throw 'bad property string';
    }

    var j = 0,
        propParts = propStr.split('.'),
        indexed,
        indices,
        i;

    // check for parts of the nesting hierarchy that are numbers (ie array elements)
    while(j < propParts.length) {
        // look for non-bracket chars, then any number of [##] blocks
        indexed = String(propParts[j]).match(/^([^\[\]]*)((\[\-?[0-9]*\])+)$/);
        if(indexed) {
            if(indexed[1]) propParts[j] = indexed[1];
            // allow propStr to start with bracketed array indices
            else if(j === 0) propParts.splice(0, 1);
            else throw 'bad property string';

            indices = indexed[2]
                .substr(1, indexed[2].length - 2)
                .split('][');

            for(i = 0; i < indices.length; i++) {
                j++;
                propParts.splice(j, 0, Number(indices[i]));
            }
        }
        j++;
    }

    if(typeof container !== 'object') {
        return badContainer(container, propStr, propParts);
    }

    return {
        set: npSet(container, propParts, propStr),
        get: npGet(container, propParts),
        astr: propStr,
        parts: propParts,
        obj: container
    };
};

function npGet(cont, parts) {
    return function() {
        var curCont = cont,
            curPart,
            allSame,
            out,
            i,
            j;

        for(i = 0; i < parts.length - 1; i++) {
            curPart = parts[i];
            if(curPart === -1) {
                allSame = true;
                out = [];
                for(j = 0; j < curCont.length; j++) {
                    out[j] = npGet(curCont[j], parts.slice(i + 1))();
                    if(out[j] !== out[0]) allSame = false;
                }
                return allSame ? out[0] : out;
            }
            if(typeof curPart === 'number' && !isArray(curCont)) {
                return undefined;
            }
            curCont = curCont[curPart];
            if(typeof curCont !== 'object' || curCont === null) {
                return undefined;
            }
        }

        // only hit this if parts.length === 1
        if(typeof curCont !== 'object' || curCont === null) return undefined;

        out = curCont[parts[i]];
        if(out === null) return undefined;
        return out;
    };
}

/*
 * Can this value be deleted? We can delete any empty object (null, undefined, [], {})
 * EXCEPT empty data arrays, {} inside an array, or anything INSIDE an *args* array.
 *
 * Info arrays can be safely deleted, but not deleting them has no ill effects other
 * than leaving a trace or layout object with some cruft in it.
 *
 * Deleting data arrays can change the meaning of the object, as `[]` means there is
 * data for this attribute, it's just empty right now while `undefined` means the data
 * should be filled in with defaults to match other data arrays.
 *
 * `{}` inside an array means "the default object" which is clearly different from
 * popping it off the end of the array, or setting it `undefined` inside the array.
 *
 * *args* arrays get passed directly to API methods and we should respect precisely
 * what the user has put there - although if the whole *args* array is empty it's fine
 * to delete that.
 *
 * So we do some simple tests here to find known non-data arrays but don't worry too
 * much about not deleting some arrays that would actually be safe to delete.
 */
var INFO_PATTERNS = /(^|\.)((domain|range)(\.[xy])?|args|parallels)$/;
var ARGS_PATTERN = /(^|\.)args\[/;
function isDeletable(val, propStr) {
    if(!emptyObj(val) ||
        (isPlainObject(val) && propStr.charAt(propStr.length - 1) === ']') ||
        (propStr.match(ARGS_PATTERN) && val !== undefined)
    ) {
        return false;
    }
    if(!isArray(val)) return true;

    if(propStr.match(INFO_PATTERNS)) return true;

    var match = containerArrayMatch(propStr);
    // if propStr matches the container array itself, index is an empty string
    // otherwise we've matched something inside the container array, which may
    // still be a data array.
    return match && (match.index === '');
}

function npSet(cont, parts, propStr) {
    return function(val) {
        var curCont = cont,
            propPart = '',
            containerLevels = [[cont, propPart]],
            toDelete = isDeletable(val, propStr),
            curPart,
            i;

        for(i = 0; i < parts.length - 1; i++) {
            curPart = parts[i];

            if(typeof curPart === 'number' && !isArray(curCont)) {
                throw 'array index but container is not an array';
            }

            // handle special -1 array index
            if(curPart === -1) {
                toDelete = !setArrayAll(curCont, parts.slice(i + 1), val, propStr);
                if(toDelete) break;
                else return;
            }

            if(!checkNewContainer(curCont, curPart, parts[i + 1], toDelete)) {
                break;
            }

            curCont = curCont[curPart];

            if(typeof curCont !== 'object' || curCont === null) {
                throw 'container is not an object';
            }

            propPart = joinPropStr(propPart, curPart);

            containerLevels.push([curCont, propPart]);
        }

        if(toDelete) {
            if(i === parts.length - 1) delete curCont[parts[i]];
            pruneContainers(containerLevels);
        }
        else curCont[parts[i]] = val;
    };
}

function joinPropStr(propStr, newPart) {
    var toAdd = newPart;
    if(isNumeric(newPart)) toAdd = '[' + newPart + ']';
    else if(propStr) toAdd = '.' + newPart;

    return propStr + toAdd;
}

// handle special -1 array index
function setArrayAll(containerArray, innerParts, val, propStr) {
    var arrayVal = isArray(val),
        allSet = true,
        thisVal = val,
        thisPropStr = propStr.replace('-1', 0),
        deleteThis = arrayVal ? false : isDeletable(val, thisPropStr),
        firstPart = innerParts[0],
        i;

    for(i = 0; i < containerArray.length; i++) {
        thisPropStr = propStr.replace('-1', i);
        if(arrayVal) {
            thisVal = val[i % val.length];
            deleteThis = isDeletable(thisVal, thisPropStr);
        }
        if(deleteThis) allSet = false;
        if(!checkNewContainer(containerArray, i, firstPart, deleteThis)) {
            continue;
        }
        npSet(containerArray[i], innerParts, propStr.replace('-1', i))(thisVal);
    }
    return allSet;
}

/**
 * make new sub-container as needed.
 * returns false if there's no container and none is needed
 * because we're only deleting an attribute
 */
function checkNewContainer(container, part, nextPart, toDelete) {
    if(container[part] === undefined) {
        if(toDelete) return false;

        if(typeof nextPart === 'number') container[part] = [];
        else container[part] = {};
    }
    return true;
}

function pruneContainers(containerLevels) {
    var i,
        j,
        curCont,
        propPart,
        keys,
        remainingKeys;
    for(i = containerLevels.length - 1; i >= 0; i--) {
        curCont = containerLevels[i][0];
        propPart = containerLevels[i][1];

        remainingKeys = false;
        if(isArray(curCont)) {
            for(j = curCont.length - 1; j >= 0; j--) {
                if(isDeletable(curCont[j], joinPropStr(propPart, j))) {
                    if(remainingKeys) curCont[j] = undefined;
                    else curCont.pop();
                }
                else remainingKeys = true;
            }
        }
        else if(typeof curCont === 'object' && curCont !== null) {
            keys = Object.keys(curCont);
            remainingKeys = false;
            for(j = keys.length - 1; j >= 0; j--) {
                if(isDeletable(curCont[keys[j]], joinPropStr(propPart, keys[j]))) {
                    delete curCont[keys[j]];
                }
                else remainingKeys = true;
            }
        }
        if(remainingKeys) return;
    }
}

function emptyObj(obj) {
    if(obj === undefined || obj === null) return true;
    if(typeof obj !== 'object') return false; // any plain value
    if(isArray(obj)) return !obj.length; // []
    return !Object.keys(obj).length; // {}
}

function badContainer(container, propStr, propParts) {
    return {
        set: function() { throw 'bad container'; },
        get: function() {},
        astr: propStr,
        parts: propParts,
        obj: container
    };
}

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

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
            else if(j === 0) propParts.splice(0,1);
            else throw 'bad property string';

            indices = indexed[2]
                .substr(1,indexed[2].length-2)
                .split('][');

            for(i=0; i<indices.length; i++) {
                j++;
                propParts.splice(j,0,Number(indices[i]));
            }
        }
        j++;
    }

    if(typeof container !== 'object') {
        return badContainer(container, propStr, propParts);
    }

    return {
        set: npSet(container, propParts),
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
            if(curPart===-1) {
                allSame = true;
                out = [];
                for(j = 0; j < curCont.length; j++) {
                    out[j] = npGet(curCont[j], parts.slice(i + 1))();
                    if(out[j]!==out[0]) allSame = false;
                }
                return allSame ? out[0] : out;
            }
            if(typeof curPart === 'number' && !Array.isArray(curCont)) {
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
 * Check known non-data-array arrays (containers). Data arrays only contain scalars,
 * so parts[end] values, such as -1 or n, indicate we are not dealing with a dataArray.
 * The ONLY case we are looking for is where the entire array is selected, parts[end] === 'x'
 * AND the replacement value is an array.
 */
function isDataArray(val, key) {

    var containers = ['annotations', 'shapes', 'range', 'domain', 'buttons'],
        isNotAContainer = containers.indexOf(key) === -1;

    return Array.isArray(val) && isNotAContainer;
}

function npSet(cont, parts) {
    return function(val) {
        var curCont = cont,
            containerLevels = [cont],
            toDelete = emptyObj(val) && !isDataArray(val, parts[parts.length-1]),
            curPart,
            i;

        for(i = 0; i < parts.length - 1; i++) {
            curPart = parts[i];

            if(typeof curPart === 'number' && !Array.isArray(curCont)) {
                throw 'array index but container is not an array';
            }

            // handle special -1 array index
            if(curPart===-1) {
                toDelete = !setArrayAll(curCont, parts.slice(i + 1), val);
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

            containerLevels.push(curCont);
        }

        if(toDelete) {
            if(i === parts.length - 1) delete curCont[parts[i]];
            pruneContainers(containerLevels);
        }
        else curCont[parts[i]] = val;
    };
}

// handle special -1 array index
function setArrayAll(containerArray, innerParts, val) {
    var arrayVal = Array.isArray(val),
        allSet = true,
        thisVal = val,
        deleteThis = arrayVal ? false : emptyObj(val),
        firstPart = innerParts[0],
        i;

    for(i = 0; i < containerArray.length; i++) {
        if(arrayVal) {
            thisVal = val[i % val.length];
            deleteThis = emptyObj(thisVal);
        }
        if(deleteThis) allSet = false;
        if(!checkNewContainer(containerArray, i, firstPart, deleteThis)) {
            continue;
        }
        npSet(containerArray[i], innerParts)(thisVal);
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
        keys,
        remainingKeys;
    for(i = containerLevels.length - 1; i >= 0; i--) {
        curCont = containerLevels[i];
        remainingKeys = false;
        if(Array.isArray(curCont)) {
            for(j = curCont.length - 1; j >= 0; j--) {
                if(emptyObj(curCont[j])) {
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
                if(emptyObj(curCont[keys[j]]) && !isDataArray(curCont[keys[j]], keys[j])) delete curCont[keys[j]];
                else remainingKeys = true;
            }
        }
        if(remainingKeys) return;
    }
}

function emptyObj(obj) {
    if(obj===undefined || obj===null) return true;
    if(typeof obj !== 'object') return false; // any plain value
    if(Array.isArray(obj)) return !obj.length; // []
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

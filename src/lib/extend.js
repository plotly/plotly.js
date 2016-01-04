/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isPlainObject = require('./is_plain_object.js');
var isArray = Array.isArray;

exports.extendFlat = function() {
    return _extend(arguments, false, false);
};

exports.extendDeep = function() {
    return _extend(arguments, true, false);
};

exports.extendDeepAll = function() {
    return _extend(arguments, true, true);
};

/*
 * Inspired by https://github.com/justmoon/node-extend/blob/master/index.js
 * All credit to the jQuery authors for perfecting this amazing utility.
 *
 * API difference with jQuery version:
 * - No optional boolean (true -> deep extend) first argument,
 *   use `extendFlat` for first-level only extend and
 *   use `extendDeep` for a deep extend.
 *
 * Other differences with jQuery version:
 * - Uses a modern (and faster) isPlainObject routine.
 * - Expected to work with object {} and array [] arguments only.
 * - Does not check for circular structure.
 *   FYI: jQuery only does a check across one level.
 *   Warning: this might result in infinite loops.
 *
 */
function _extend(inputs, isDeep, keepAllKeys) {
    var target = inputs[0],
        length = inputs.length;

    var input, key, src, copy, copyIsArray, clone;

    for(var i = 1; i < length; i++) {
        input = inputs[i];

        for(key in input) {
            src = target[key];
            copy = input[key];

            // recurse if we're merging plain objects or arrays
            if(isDeep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                if(copyIsArray) {
                    copyIsArray = false;
                    clone = src && isArray(src) ? src : [];
                } else {
                    clone = src && isPlainObject(src) ? src : {};
                }

                // never move original objects, clone them
                target[key] = _extend([clone, copy], isDeep, keepAllKeys);
            }

            // don't bring in undefined values, except for extendDeepAll
            else if(typeof copy !== 'undefined' || keepAllKeys) {
                target[key] = copy;
            }
        }
    }

    return target;
}

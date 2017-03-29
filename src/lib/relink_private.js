/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isArray = require('./is_array');
var isPlainObject = require('./is_plain_object');

/**
 * Relink private _keys and keys with a function value from one container
 * to the new container.
 * Relink means copying if object is pass-by-value and adding a reference
 * if object is pass-by-ref.
 * This prevents deepCopying massive structures like a webgl context.
 */
module.exports = function relinkPrivateKeys(toContainer, fromContainer) {
    var keys = Object.keys(fromContainer || {});

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i],
            fromVal = fromContainer[k],
            toVal = toContainer[k];

        if(k.charAt(0) === '_' || typeof fromVal === 'function') {

            // if it already exists at this point, it's something
            // that we recreate each time around, so ignore it
            if(k in toContainer) continue;

            toContainer[k] = fromVal;
        }
        else if(isArray(fromVal) && isArray(toVal) && isPlainObject(fromVal[0])) {

            // recurse into arrays containers
            for(var j = 0; j < fromVal.length; j++) {
                if(isPlainObject(fromVal[j]) && isPlainObject(toVal[j])) {
                    relinkPrivateKeys(toVal[j], fromVal[j]);
                }
            }
        }
        else if(isPlainObject(fromVal) && isPlainObject(toVal)) {

            // recurse into objects, but only if they still exist
            relinkPrivateKeys(toVal, fromVal);

            if(!Object.keys(toVal).length) delete toContainer[k];
        }
    }
};

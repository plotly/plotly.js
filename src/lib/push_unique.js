/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Push array with unique items
 *
 * @param {array} array
 *  array to be filled
 * @param {any} item
 *  item to be or not to be inserted
 * @return {array}
 *  ref to array (now possibly containing one more item)
 *
 */
module.exports = function pushUnique(array, item) {
    if(item instanceof RegExp) {
        var itemStr = item.toString(),
            i;
        for(i = 0; i < array.length; i++) {
            if(array[i] instanceof RegExp && array[i].toString() === itemStr) {
                return array;
            }
        }
        array.push(item);
    }
    else if(item && array.indexOf(item) === -1) array.push(item);

    return array;
};

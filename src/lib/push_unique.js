'use strict';

/**
 * Push array with unique items
 *
 * Ignores falsy items, except 0 so we can use it to construct arrays of indices.
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
        var itemStr = item.toString();
        for(var i = 0; i < array.length; i++) {
            if(array[i] instanceof RegExp && array[i].toString() === itemStr) {
                return array;
            }
        }
        array.push(item);
    } else if((item || item === 0) && array.indexOf(item) === -1) array.push(item);

    return array;
};

'use strict';

/**
 * Return the keys of an object in lexicographic (default `Array.prototype.sort`) order.
 *
 * @param obj - object whose own enumerable keys will be listed and sorted
 */
function sortObjectKeys(obj: Record<string, any>) {
    return Object.keys(obj).sort();
}

export default sortObjectKeys;

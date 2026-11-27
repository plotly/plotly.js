'use strict';

var isArrayOrTypedArray = require('../../lib/array').isArrayOrTypedArray;
var isTypedArraySpec = require('../../lib/array').isTypedArraySpec;

// 'total ascending', 'median descending', ... - ordering by aggregated value,
// which `sortAxisCategoriesByValue` only implements for 'category' axes.
// Mirrors `sortAxisCategoriesByValueRegex` in plots.js
var VALUE_ORDER_RE = /(total|sum|min|max|mean|geometric mean|median) (ascending|descending)/;

function isValidCategory(v) {
    return v !== null && v !== undefined;
}

// a multicategory entry is a [parent, child] pair
function isValidPair(v) {
    return Array.isArray(v) && v.length === 2 &&
        isValidCategory(v[0]) && isValidCategory(v[1]);
}

function compareAsString(a, b) {
    a = String(a);
    b = String(b);
    return a < b ? -1 : (a > b ? 1 : 0);
}

function comparePairs(a, b) {
    return compareAsString(a[0], b[0]) || compareAsString(a[1], b[1]);
}

function getAxData(ax, opts) {
    var dataAttr = opts.dataAttr || ax._id.charAt(0);

    if(opts.axData) {
        // non-x/y case
        return opts.axData;
    }

    // x/y case
    var axData = [];
    for(var i = 0; i < opts.data.length; i++) {
        var trace = opts.data[i];
        if(trace[dataAttr + 'axis'] === ax._id) {
            axData.push(trace);
        }
    }
    return axData;
}

function findCategories(ax, opts) {
    var dataAttr = opts.dataAttr || ax._id.charAt(0);
    var axData = getAxData(ax, opts);
    var lookup = {};
    var i, j;

    for(i = 0; i < axData.length; i++) {
        var vals = axData[i][dataAttr];
        for(j = 0; j < vals.length; j++) {
            var v = vals[j];
            if(isValidCategory(v)) {
                lookup[v] = 1;
            }
        }
    }

    return Object.keys(lookup);
}

// multicategory variant: returns the unique [parent, child] pairs found in the
// data, which is what `_categories` holds for these axes
function findCategoryPairs(ax, opts) {
    var dataAttr = opts.dataAttr || ax._id.charAt(0);
    var axData = getAxData(ax, opts);
    var lookup = Object.create(null);
    var list = [];
    var i, j;

    for(i = 0; i < axData.length; i++) {
        var arrayIn = axData[i][dataAttr];
        if(!isArrayOrTypedArray(arrayIn) ||
            !isArrayOrTypedArray(arrayIn[0]) ||
            !isArrayOrTypedArray(arrayIn[1])
        ) continue;

        var len = Math.min(arrayIn[0].length, arrayIn[1].length);

        for(j = 0; j < len; j++) {
            var v0 = arrayIn[0][j];
            var v1 = arrayIn[1][j];

            if(isValidCategory(v0) && isValidCategory(v1)) {
                var key = v0 + ',' + v1;
                if(!(key in lookup)) {
                    lookup[key] = 1;
                    list.push([v0, v1]);
                }
            }
        }
    }

    return list;
}

/**
 * Fills in category* default and initial categories.
 *
 * @param {object} containerIn : input axis object
 * @param {object} containerOut : full axis object
 * @param {function} coerce : Lib.coerce fn wrapper
 * @param {object} opts :
 *   - data {array} : (full) data trace
 * OR
 *   - axData {array} : (full) data associated with axis being coerced here
 *   - dataAttr {string} : attribute name corresponding to coordinate array
 */
module.exports = function handleCategoryOrderDefaults(containerIn, containerOut, coerce, opts) {
    var isMultiCategory = containerOut.type === 'multicategory';
    if(containerOut.type !== 'category' && !isMultiCategory) return;

    var arrayIn = containerIn.categoryarray;
    var isValidArray = (Array.isArray(arrayIn) && arrayIn.length > 0) ||
        isTypedArraySpec(arrayIn);

    // on multicategory axes every entry must be a [parent, child] pair
    if(isMultiCategory && isValidArray) {
        isValidArray = Array.isArray(arrayIn) && arrayIn.some(isValidPair);
    }

    // override default 'categoryorder' value when non-empty array is supplied
    var orderDefault;
    if(isValidArray) orderDefault = 'array';

    var order = coerce('categoryorder', orderDefault);
    var array;

    // ordering by aggregated value is not implemented for multicategory axes -
    // it would also interleave children across parents, breaking the grouping
    if(isMultiCategory && VALUE_ORDER_RE.test(order)) {
        order = containerOut.categoryorder = 'trace';
    }

    // coerce 'categoryarray' only in array order case
    if(order === 'array') {
        array = coerce('categoryarray');
    }

    // cannot set 'categoryorder' to 'array' with an invalid 'categoryarray'
    if(!isValidArray && order === 'array') {
        order = containerOut.categoryorder = 'trace';
    }

    // set up things for makeCalcdata
    if(order === 'trace') {
        containerOut._initialCategories = [];
    } else if(order === 'array') {
        array = array.slice();
        // drop malformed entries so they can't land in `_categories`
        if(isMultiCategory) array = array.filter(isValidPair);
        containerOut._initialCategories = array;
    } else {
        array = isMultiCategory ?
            findCategoryPairs(containerOut, opts).sort(comparePairs) :
            findCategories(containerOut, opts).sort();

        if(order === 'category ascending') {
            containerOut._initialCategories = array;
        } else if(order === 'category descending') {
            containerOut._initialCategories = array.reverse();
        }
    }
};

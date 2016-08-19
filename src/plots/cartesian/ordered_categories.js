/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

// flattenUniqueSort :: String -> Function -> [[String]] -> [String]
function flattenUniqueSort(axisLetter, sortFunction, data) {

    // Bisection based insertion sort of distinct values for logarithmic time complexity.
    // Can't use a hashmap, which is O(1), because ES5 maps coerce keys to strings. If it ever becomes a bottleneck,
    // code can be separated: a hashmap (JS object) based version if all values encountered are strings; and
    // downgrading to this O(log(n)) array on the first encounter of a non-string value.

    var categoryArray = [];

    var traceLines = data.map(function(d) {return d[axisLetter];});

    var i, j, tracePoints, category, insertionIndex;

    var bisector = d3.bisector(sortFunction).left;

    for(i = 0; i < traceLines.length; i++) {

        tracePoints = traceLines[i];

        for(j = 0; j < tracePoints.length; j++) {

            category = tracePoints[j];

            // skip loop: ignore null and undefined categories
            if(category === null || category === undefined) continue;

            insertionIndex = bisector(categoryArray, category);

            // skip loop on already encountered values
            if(insertionIndex < categoryArray.length && categoryArray[insertionIndex] === category) continue;

            // insert value
            categoryArray.splice(insertionIndex, 0, category);
        }
    }

    return categoryArray;
}


/**
 * This pure function returns the ordered categories for specified axisLetter, categoryorder, categoryarray and data.
 *
 * If categoryorder is 'array', the result is a fresh copy of categoryarray, or if unspecified, an empty array.
 *
 * If categoryorder is 'category ascending' or 'category descending', the result is an array of ascending or descending
 * order of the unique categories encountered in the data for specified axisLetter.
 *
 * See cartesian/layout_attributes.js for the definition of categoryorder and categoryarray
 *
 */

// orderedCategories :: String -> String -> [String] -> [[String]] -> [String]
module.exports = function orderedCategories(axisLetter, categoryorder, categoryarray, data) {

    switch(categoryorder) {
        case 'array': return Array.isArray(categoryarray) ? categoryarray.slice() : [];
        case 'category ascending': return flattenUniqueSort(axisLetter, d3.ascending, data);
        case 'category descending': return flattenUniqueSort(axisLetter, d3.descending, data);
        case 'trace': return [];
        default: return [];
    }
};

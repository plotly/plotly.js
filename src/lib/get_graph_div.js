/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Allow referencing a graph DOM element either directly
 * or its id string
 *
 * @param {HTMLDivElement|string} gd: a graph element or its id
 *
 * @returns {HTMLDivElement} the DOM element of the graph
 */
// Get the container div: we store all variables for this plot as
// properties of this div
// some callers send this in by DOM element, others by id (string)
module.exports = function(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    }
    else if(gd === null || gd === undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    return gd;  // otherwise assume that gd is a DOM element
};

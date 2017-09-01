/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// Simple helper functions
// none of these need any external deps

/*
 * make a regex for matching counter ids/names ie xaxis, xaxis2, xaxis10...
 *  eg: regexCounter('x')
 * tail is an optional piece after the id
 *  eg regexCounter('scene', '.annotations') for scene2.annotations etc.
 */
exports.counter = function(head, tail, openEnded) {
    return new RegExp('^' + head + '([2-9]|[1-9][0-9]+)?' +
        (tail || '') + (openEnded ? '' : '$'));
};

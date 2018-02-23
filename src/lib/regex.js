/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * make a regex for matching counter ids/names ie xaxis, xaxis2, xaxis10...
 *
 * @param {string} head: the head of the pattern, eg 'x' matches 'x', 'x2', 'x10' etc.
 *      'xy' is a special case for cartesian subplots: it matches 'x2y3' etc
 * @param {Optional(string)} tail: a fixed piece after the id
 *      eg counterRegex('scene', '.annotations') for scene2.annotations etc.
 * @param {boolean} openEnded: if true, the string may continue past the match.
 */
exports.counter = function(head, tail, openEnded) {
    var fullTail = (tail || '') + (openEnded ? '' : '$');
    if(head === 'xy') {
        return new RegExp('^x([2-9]|[1-9][0-9]+)?y([2-9]|[1-9][0-9]+)?' + fullTail);
    }
    return new RegExp('^' + head + '([2-9]|[1-9][0-9]+)?' + fullTail);
};

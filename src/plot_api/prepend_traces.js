/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

var Queue = require('../lib/queue');

var Helpers = require('./helpers');
var redraw = require('./redraw');
var extendTraces = require('./extend_traces');


module.exports = prependTraces;


/**
 * extend && prepend traces at indices with update arrays, window trace lengths to maxPoints
 *
 * Extend and Prepend have identical APIs. Prepend inserts an array at the head while Extend
 * inserts an array off the tail. Prepend truncates the tail of the array - counting maxPoints
 * from the head, whereas Extend truncates the head of the array, counting backward maxPoints
 * from the tail.
 *
 * If maxPoints is undefined, nonNumeric, negative or greater than extended trace length no
 * truncation / windowing will be performed. If its zero, well the whole trace is truncated.
 *
 * @param {Object|HTMLDivElement} gd The graph div
 * @param {Object} update The key:array map of target attributes to extend
 * @param {Number|Number[]} indices The locations of traces to be extended
 * @param {Number|Object} [maxPoints] Number of points for trace window after lengthening.
 *
 */
// function prependTraces (gd, update, indices, maxPoints) {
//     gd = Helpers.getGraphDiv(gd);


//     function lengthen(target, insert) {
//         return insert.concat(target);
//     };

//     function spliceArray(target, maxPoints) {
//         return target.splice(maxPoints, target.length);
//     };

//     var undo = Helpers.spliceTraces(gd, update, indices, maxPoints, lengthen, spliceArray),
//         promise = redraw(gd),
//         undoArgs = [gd, undo.update, indices, undo.maxPoints];

//     if (Queue) {
//         Queue.add(gd, extendTraces, undoArgs, prependTraces, arguments);
//     }

//     return promise;
// };

function prependTraces (gd, update, indices, maxPoints) {
    gd = Helpers.getGraphDiv(gd);

    var undo = Helpers.spliceTraces(gd, update, indices, maxPoints,

                           /*
                            * The Lengthen operation extends trace by appending insert to start
                            */
                            function(target, insert) {
                                return insert.concat(target);
                            },

                            /*
                             * Window the trace keeping maxPoints, counting forward from the start
                             */
                            function(target, maxPoints) {
                                return target.splice(maxPoints, target.length);
                            });

    var promise = redraw(gd);

    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    if (Queue) {
        Queue.add(gd, extendTraces, undoArgs, prependTraces, arguments);
    }

    return promise;
};

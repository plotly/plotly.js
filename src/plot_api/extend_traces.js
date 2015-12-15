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
var prependTraces = require('./prepend_traces');


module.exports = extendTraces;


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
// function extendTraces (gd, update, indices, maxPoints) {
//     gd = Helpers.getGraphDiv(gd);


//     function lengthen(target, insert) {
//         return target.concat(insert);
//     };

//     function spliceArray(target, maxPts) {
//         return target.splice(0, target.length - maxPts);
//     };

//     var undo = Helpers.spliceTraces(gd, update, indices, maxPoints, lengthen, spliceArray),
//         promise = redraw(gd),
//         undoArgs = [gd, undo.update, indices, undo.maxPoints];

//     if (Queue) {
//         Queue.add(gd, prependTraces, undoArgs, extendTraces, arguments);
//     }

//     return promise;
// };

function extendTraces (gd, update, indices, maxPoints) {
    console.log(gd);
    gd = Helpers.getGraphDiv(gd);
    console.log(gd);

    var undo = Helpers.spliceTraces(gd, update, indices, maxPoints,

                           /*
                            * The Lengthen operation extends trace from end with insert
                            */
                            function(target, insert) {
                                return target.concat(insert);
                            },

                            /*
                             * Window the trace keeping maxPoints, counting back from the end
                             */
                            function(target, maxPoints) {
                                return target.splice(0, target.length - maxPoints);
                            });

    var promise = redraw(gd);

    var undoArgs = [gd, undo.update, indices, undo.maxPoints];
    if (Queue) {
        Queue.add(gd, prependTraces, undoArgs, extendTraces, arguments);
    }

    return promise;
}

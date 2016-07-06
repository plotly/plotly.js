/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extend = require('./extend');

/*
 * Merge two keyframe specifications, returning in a third object that
 * can be used for plotting.
 *
 * @param {object} target
 *      An object with data, layout, and trace data
 * @param {object} source
 *      An object with data, layout, and trace data
 *
 * Returns: a third object with the merged content
 */
module.exports = function mergeFrames(target, source) {
    var result;

    result = extend.extendDeep({}, target);
    result = extend.extendDeep(result, source);

    return result;
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/** Filter out object items with visible !== true
 *  insider array container.
 *
 *  @param {array of objects} container
 *  @return {array of objects} of length <= container
 *
 */
module.exports = function filterVisible(container) {
    var out = [];

    for(var i = 0; i < container.length; i++) {
        var item = container[i];

        if(item.visible === true) out.push(item);
    }

    return out;
};

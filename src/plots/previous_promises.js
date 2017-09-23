/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// for use in Lib.syncOrAsync, check if there are any
// pending promises in this plot and wait for them
module.exports = function(gd) {
    if((gd._promises || []).length) {
        return Promise.all(gd._promises)
            .then(function() { gd._promises = []; });
    }
};

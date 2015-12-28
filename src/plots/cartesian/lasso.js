/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function prepLasso(e, startX, startY, dragOptions) {
    console.log('lasso start', e, startX, startY, dragOptions);

    dragOptions.moveFn = function(dx0, dy0) {
        console.log('lasso move', dx0, dy0);
    };

    dragOptions.doneFn = function(dragged, numclicks) {
        console.log('lasso done', dragged, numclicks);
    };
};

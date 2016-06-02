/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = function handleCategoryOrderDefaults(containerIn, containerOut, coerce) {
    if(containerOut.type !== 'category') return;

    var arrayIn = containerIn.categoryarray,
        orderDefault;

    var isValidArray = (Array.isArray(arrayIn) && arrayIn.length > 0);

    // override default 'categoryorder' value when non-empty array is supplied
    if(isValidArray) orderDefault = 'array';

    var order = coerce('categoryorder', orderDefault);

    // coerce 'categoryarray' only in array order case
    if(order === 'array') coerce('categoryarray');

    // cannot set 'categoryorder' to 'array' with an invalid 'categoryarray'
    if(!isValidArray && order === 'array') {
        containerOut.categoryorder = 'trace';
    }
};

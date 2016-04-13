/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var layoutAttributes = require('./layout_attributes');

module.exports = function handleCategoryModeDefaults(containerIn, containerOut, coerce) {

    if(containerIn.type !== 'category') return;

    var validCategories = layoutAttributes.categorymode.values;

    var properCategoryList = Array.isArray(containerIn.categorylist) && containerIn.categorylist.length > 0;

    if(validCategories.indexOf(containerIn.categorymode) === -1 && properCategoryList) {

        // when unspecified or invalid, use the default, unless categorylist implies 'array'
        coerce('categorymode', 'array'); // promote to 'array'

    } else if(containerIn.categorymode === 'array' && !properCategoryList) {

        // when mode is 'array' but no list is given, revert to default

        containerIn.categorymode = 'trace'; // revert to default
        coerce('categorymode');

    } else {

        // otherwise use the supplied mode, or the default one if unsupplied or invalid
        coerce('categorymode');

    }
};

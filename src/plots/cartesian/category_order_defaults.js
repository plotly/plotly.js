/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var layoutAttributes = require('./layout_attributes');

module.exports = function handleCategoryOrderDefaults(containerIn, containerOut, coerce) {

    if(containerIn.type !== 'category') return;

    var validCategories = layoutAttributes.categoryorder.values;

    var propercategoryarray = Array.isArray(containerIn.categoryarray) && containerIn.categoryarray.length > 0;

    if(validCategories.indexOf(containerIn.categoryorder) === -1 && propercategoryarray) {

        // when unspecified or invalid, use the default, unless categoryarray implies 'array'
        coerce('categoryorder', 'array'); // promote to 'array'

    } else if(containerIn.categoryorder === 'array' && !propercategoryarray) {

        // when mode is 'array' but no list is given, revert to default

        containerIn.categoryorder = 'trace'; // revert to default
        coerce('categoryorder');

    } else {

        // otherwise use the supplied mode, or the default one if unsupplied or invalid
        coerce('categoryorder');

    }
};

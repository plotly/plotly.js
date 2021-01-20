/**
* Copyright 2012-2021, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function registerExtra(Plotly) {
    // transforms
    //
    // Please note that all *transform* methods are executed before
    // all *calcTransform* methods - which could possibly lead to
    // unexpected results when applying multiple transforms of different types
    // to a given trace.
    //
    // For more info, see:
    // https://github.com/plotly/plotly.js/pull/978#pullrequestreview-2403353
    //
    Plotly.register([
        require('./aggregate'),
        require('./filter'),
        require('./groupby'),
        require('./sort')
    ]);

    // components
    Plotly.register([
        require('./calendars')
    ]);
};

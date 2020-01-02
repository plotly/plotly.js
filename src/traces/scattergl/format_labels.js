/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterFormatLabels = require('../scatter/format_labels');

module.exports = function formatLabels(cdi, trace, fullLayout) {
    var i = cdi.i;
    if(!('x' in cdi)) cdi.x = trace._x[i];
    if(!('y' in cdi)) cdi.y = trace._y[i];
    return scatterFormatLabels(cdi, trace, fullLayout);
};

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function handleXYDefaults(traceIn, traceOut, coerce) {
    var x = coerce('x');
    var y = coerce('y');

    traceOut._cheater = !x;

    return !!x || !!y;
};

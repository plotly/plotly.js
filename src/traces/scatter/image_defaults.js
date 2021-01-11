/**
* Copyright 2012-2021, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

module.exports = function(traceIn, traceOut, layout, coerce, opts) {
    opts = opts || {};

    coerce('image.source');
    coerce('image.width');
    coerce('image.height');
};

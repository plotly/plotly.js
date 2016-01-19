/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');


// common to 'scatter', 'scatter3d' and 'scattergeo'
module.exports = function(traceIn, traceOut, layout, coerce) {
    coerce('textposition');
    Lib.coerceFont(coerce, 'textfont', layout.font);
};

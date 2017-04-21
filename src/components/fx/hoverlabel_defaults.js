/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function handleHoverLabelDefaults(contIn, contOut, coerce, opts) {
    opts = opts || {};

    coerce('hoverlabel.bgcolor', opts.bgcolor);
    coerce('hoverlabel.bordercolor', opts.bordercolor);
    Lib.coerceFont(coerce, 'hoverlabel.font', opts.font);
};

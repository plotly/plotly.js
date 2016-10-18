/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var saneTopojson = require('sane-topojson');


// package version injected by `npm run preprocess`
exports.version = '1.18.1';

exports.topojson = saneTopojson;

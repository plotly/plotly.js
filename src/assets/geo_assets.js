/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


var saneTopojson = require('sane-topojson');

// export the version found in the package.json
exports.version = require('../../package.json').version;

exports.topojson = saneTopojson;

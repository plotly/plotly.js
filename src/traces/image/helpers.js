/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var sizeOf = require('image-size');
var dataUri = require('../../snapshot/helpers').IMAGE_URL_PREFIX;
var Buffer = require('buffer/').Buffer;  // note: the trailing slash is important!

exports.getImageSize = function(src) {
    var data = src.replace(dataUri, '');
    var buff = new Buffer(data, 'base64');
    return sizeOf(buff);
};

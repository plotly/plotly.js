/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var scales = require('./scales');
var isValidScaleArray = require('./is_valid_scale_array');


module.exports = function isValidScale(scl) {
    if(scales[scl] !== undefined || isValidScaleArray(scl)) {
        return true;
    }
    if(scl !== undefined) Lib.warn('Invalid scale passed', scl);
    return false;
};

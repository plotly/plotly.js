/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var tinycolor = require('tinycolor2');


module.exports = function isValidScaleArray(scl) {
    var isValid = true,
        highestVal = 0,
        si;

    if(!Array.isArray(scl)) return false;
    else {
        if(+scl[0][0] !== 0 || +scl[scl.length - 1][0] !== 1) return false;
        for(var i = 0; i < scl.length; i++) {
            si = scl[i];
            if(si.length !== 2 || +si[0] < highestVal || !tinycolor(si[1]).isValid()) {
                isValid = false;
                break;
            }
            highestVal = +si[0];
        }
        return isValid;
    }
};

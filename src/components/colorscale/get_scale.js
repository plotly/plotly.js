/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scales = require('./scales');
var defaultScale = require('./default_scale');
var isValidScaleArray = require('./is_valid_scale_array');


module.exports = function getScale(scl, dflt) {
    if(!dflt) dflt = defaultScale;
    if(!scl) return dflt;

    function parseScale() {
        try {
            scl = scales[scl] || JSON.parse(scl);
        }
        catch(e) {
            scl = dflt;
        }
    }

    if(typeof scl === 'string') {
        parseScale();
        // occasionally scl is double-JSON encoded...
        if(typeof scl === 'string') parseScale();
    }

    if(!isValidScaleArray(scl)) return dflt;
    return scl;
};

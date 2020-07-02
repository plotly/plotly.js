/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var handleHoverLabelDefaults = require('./hoverlabel_defaults');
var layoutAttributes = require('./layout_attributes');

module.exports = function supplyLayoutGlobalDefaults(gd, layoutIn, layoutOut) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    handleHoverLabelDefaults(gd, layoutIn, layoutOut, coerce);
};

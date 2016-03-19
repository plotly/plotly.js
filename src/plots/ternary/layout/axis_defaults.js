/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../../lib');
var layoutAttributes = require('./axis_attributes');

var axesNames = ['aaxis', 'baxis', 'caxis'];


module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, options) {
    var containerIn, containerOut;

    function coerce(attr, dflt) {
        return Lib.coerce(containerIn, containerOut, layoutAttributes, attr, dflt);
    }

    for(var j = 0; j < axesNames.length; j++) {
        var axName = axesNames[j];
        containerIn = layoutIn[axName] || {};

        containerOut = {
            _name: axName
        };

        // TODO - what can we reuse from cartesian?
    }
};

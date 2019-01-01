/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var colorscaleAttrs = require('./layout_attributes');
var Template = require('../../plot_api/plot_template');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut) {
    var colorscaleIn = layoutIn.colorscale;
    var colorscaleOut = Template.newContainer(layoutOut, 'colorscale');
    function coerce(attr, dflt) {
        return Lib.coerce(colorscaleIn, colorscaleOut, colorscaleAttrs, attr, dflt);
    }

    coerce('sequential');
    coerce('sequentialminus');
    coerce('diverging');
};

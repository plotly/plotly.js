/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Contour = {};

Contour.attributes = require('./attributes');
Contour.supplyDefaults = require('./defaults');
Contour.calc = require('./calc');
Contour.plot = require('./plot');
Contour.style = require('./style');
Contour.colorbar = require('./colorbar');
Contour.hoverPoints = require('./hover');

Contour.moduleType = 'trace';
Contour.name = 'contour';
Contour.basePlotModule = require('../../plots/cartesian');
Contour.categories = ['cartesian', '2dMap', 'contour'];
Contour.meta = {
    description: [
        'The data from which contour lines are computed is set in `z`.',
        'Data in `z` must be a {2D array} of numbers.',

        'Say that `z` has N rows and M columns, then by default,',
        'these N rows correspond to N y coordinates',
        '(set in `y` or auto-generated) and the M columns',
        'correspond to M x coordinates (set in `x` or auto-generated).',
        'By setting `transpose` to *true*, the above behavior is flipped.'
    ].join(' ')
};

module.exports = Contour;

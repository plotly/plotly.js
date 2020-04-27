/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Color = require('../../color');


module.exports = function supplyDrawNewShapeDefaults(layoutIn, layoutOut, coerce) {
    coerce('newshape.drawdirection');
    coerce('newshape.layer');
    coerce('newshape.fillcolor');
    coerce('newshape.fillrule');
    coerce('newshape.opacity');
    var newshapeLineWidth = coerce('newshape.line.width');
    if(newshapeLineWidth) {
        var bgcolor = (layoutIn || {}).plot_bgcolor || '#FFF';
        coerce('newshape.line.color', Color.contrast(bgcolor));
        coerce('newshape.line.dash');
    }

    coerce('activeshape.fillcolor');
    coerce('activeshape.opacity');
};

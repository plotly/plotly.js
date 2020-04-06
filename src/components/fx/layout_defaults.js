/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var isUnifiedHover = require('./helpers').isUnifiedHover;
var layoutAttributes = require('./layout_attributes');
var handleHoverModeDefaults = require('./hovermode_defaults');
var handleHoverLabelDefaults = require('./hoverlabel_defaults');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }

    var hoverMode = handleHoverModeDefaults(layoutIn, layoutOut, fullData);
    if(hoverMode) {
        coerce('hoverdistance');
        coerce('spikedistance', isUnifiedHover(hoverMode) ? -1 : undefined);
    }

    var dragMode = coerce('dragmode');
    if(dragMode === 'select') coerce('selectdirection');

    // if only mapbox or geo subplots is present on graph,
    // reset 'zoom' dragmode to 'pan' until 'zoom' is implemented,
    // so that the correct modebar button is active
    var hasMapbox = layoutOut._has('mapbox');
    var hasGeo = layoutOut._has('geo');
    var len = layoutOut._basePlotModules.length;

    if(layoutOut.dragmode === 'zoom' && (
        ((hasMapbox || hasGeo) && len === 1) ||
        (hasMapbox && hasGeo && len === 2)
    )) {
        layoutOut.dragmode = 'pan';
    }

    handleHoverLabelDefaults(layoutIn, layoutOut, coerce);
};

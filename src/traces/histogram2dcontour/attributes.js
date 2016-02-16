/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var histogram2dAttrs = require('../histogram2d/attributes');
var contourAttrs = require('../contour/attributes');

module.exports = {
    x: histogram2dAttrs.x,
    y: histogram2dAttrs.y,
    z: histogram2dAttrs.z,
    marker: histogram2dAttrs.marker,

    histnorm: histogram2dAttrs.histnorm,
    histfunc: histogram2dAttrs.histfunc,
    autobinx: histogram2dAttrs.autobinx,
    nbinsx: histogram2dAttrs.nbinsx,
    xbins: histogram2dAttrs.xbins,
    autobiny: histogram2dAttrs.autobiny,
    nbinsy: histogram2dAttrs.nbinsy,
    ybins: histogram2dAttrs.ybins,

    zauto: contourAttrs.zauto,
    zmin: contourAttrs.zmin,
    zmax: contourAttrs.zmax,
    colorscale: contourAttrs.colorscale,
    autocolorscale: contourAttrs.autocolorscale,
    reversescale: contourAttrs.reversescale,
    showscale: contourAttrs.showscale,

    autocontour: contourAttrs.autocontour,
    ncontours: contourAttrs.ncontours,
    contours: contourAttrs.contours,
    line: contourAttrs.line,

    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};

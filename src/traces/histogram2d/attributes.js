/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var histogramAttrs = require('../histogram/attributes');
var heatmapAttrs = require('../heatmap/attributes');

module.exports = {
    x: histogramAttrs.x,
    y: histogramAttrs.y,

    z: {
        valType: 'data_array',
        description: 'Sets the aggregation data.'
    },
    marker: {
        color: {
            valType: 'data_array',
            description: 'Sets the aggregation data.'
        }
    },

    histnorm: histogramAttrs.histnorm,
    histfunc: histogramAttrs.histfunc,
    autobinx: histogramAttrs.autobinx,
    nbinsx: histogramAttrs.nbinsx,
    xbins: histogramAttrs.xbins,
    autobiny: histogramAttrs.autobiny,
    nbinsy: histogramAttrs.nbinsy,
    ybins: histogramAttrs.ybins,

    zauto: heatmapAttrs.zauto,
    zmin: heatmapAttrs.zmin,
    zmax: heatmapAttrs.zmax,
    colorscale: heatmapAttrs.colorscale,
    autocolorscale: heatmapAttrs.autocolorscale,
    reversescale: heatmapAttrs.reversescale,
    showscale: heatmapAttrs.showscale,

    zsmooth: heatmapAttrs.zsmooth,

    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};

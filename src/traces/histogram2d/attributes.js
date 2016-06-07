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
var colorscaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat({},
    {
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

        zsmooth: heatmapAttrs.zsmooth,

        _nestedModules: {
            'colorbar': 'Colorbar'
        }
    },
    colorscaleAttrs,
    {autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale, {dflt: false})}
);

/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var histogramAttrs = require('../histogram/attributes');
var makeBinAttrs = require('../histogram/bin_attributes');
var heatmapAttrs = require('../heatmap/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = extendFlat(
    {
        x: histogramAttrs.x,
        y: histogramAttrs.y,

        z: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the aggregation data.'
        },
        marker: {
            color: {
                valType: 'data_array',
                editType: 'calc',
                description: 'Sets the aggregation data.'
            },
            editType: 'calc'
        },

        histnorm: histogramAttrs.histnorm,
        histfunc: histogramAttrs.histfunc,
        nbinsx: histogramAttrs.nbinsx,
        xbins: makeBinAttrs('x'),
        nbinsy: histogramAttrs.nbinsy,
        ybins: makeBinAttrs('y'),
        autobinx: histogramAttrs.autobinx,
        autobiny: histogramAttrs.autobiny,

        xgap: heatmapAttrs.xgap,
        ygap: heatmapAttrs.ygap,
        zsmooth: heatmapAttrs.zsmooth,
        zhoverformat: heatmapAttrs.zhoverformat
    },
    colorscaleAttrs('', {
        cLetter: 'z',
        autoColorDflt: false
    }),
    { colorbar: colorbarAttrs }
);

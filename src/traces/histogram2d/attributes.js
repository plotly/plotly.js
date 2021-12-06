'use strict';

var histogramAttrs = require('../histogram/attributes');
var makeBinAttrs = require('../histogram/bin_attributes');
var heatmapAttrs = require('../heatmap/attributes');
var baseAttrs = require('../../plots/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var colorScaleAttrs = require('../../components/colorscale/attributes');

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

        bingroup: extendFlat({}, histogramAttrs.bingroup, {
            description: [
                'Set the `xbingroup` and `ybingroup` default prefix',
                'For example, setting a `bingroup` of *1* on two histogram2d traces',
                'will make them their x-bins and y-bins match separately.'
            ].join(' ')
        }),
        xbingroup: extendFlat({}, histogramAttrs.bingroup, {
            description: [
                'Set a group of histogram traces which will have compatible x-bin settings.',
                'Using `xbingroup`, histogram2d and histogram2dcontour traces ',
                '(on axes of the same axis type) can have compatible x-bin settings.',
                'Note that the same `xbingroup` value can be used to set (1D) histogram `bingroup`'
            ].join(' ')
        }),
        ybingroup: extendFlat({}, histogramAttrs.bingroup, {
            description: [
                'Set a group of histogram traces which will have compatible y-bin settings.',
                'Using `ybingroup`, histogram2d and histogram2dcontour traces ',
                '(on axes of the same axis type) can have compatible y-bin settings.',
                'Note that the same `ybingroup` value can be used to set (1D) histogram `bingroup`'
            ].join(' ')
        }),

        xgap: heatmapAttrs.xgap,
        ygap: heatmapAttrs.ygap,
        zsmooth: heatmapAttrs.zsmooth,
        xhoverformat: axisHoverFormat('x'),
        yhoverformat: axisHoverFormat('y'),
        zhoverformat: axisHoverFormat('z', 1),
        hovertemplate: hovertemplateAttrs({}, {keys: 'z'}),
        texttemplate: texttemplateAttrs({
            arrayOk: false,
            editType: 'plot'
        }, {
            keys: 'z'
        }),
        textfont: heatmapAttrs.textfont,
        showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false})
    },
    colorScaleAttrs('', {cLetter: 'z', autoColorDflt: false})
);

'use strict';

var barAttrs = require('../bar/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var fontAttrs = require('../../plots/font_attributes');
var makeBinAttrs = require('./bin_attributes');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the sample data to be binned on the x axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the sample data to be binned on the y axis.'
        ].join(' ')
    },

    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),

    text: extendFlat({}, barAttrs.text, {
        description: [
            'Sets hover text elements associated with each bar.',
            'If a single string, the same string appears over all bars.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s coordinates.'
        ].join(' ')
    }),
    hovertext: extendFlat({}, barAttrs.hovertext, {
        description: 'Same as `text`.'
    }),
    orientation: barAttrs.orientation,

    histfunc: {
        valType: 'enumerated',
        values: ['count', 'sum', 'avg', 'min', 'max'],
        dflt: 'count',
        editType: 'calc',
        description: [
            'Specifies the binning function used for this histogram trace.',

            'If *count*, the histogram values are computed by counting the',
            'number of values lying inside each bin.',

            'If *sum*, *avg*, *min*, *max*,',
            'the histogram values are computed using',
            'the sum, the average, the minimum or the maximum',
            'of the values lying inside each bin respectively.'
        ].join(' ')
    },
    histnorm: {
        valType: 'enumerated',
        values: ['', 'percent', 'probability', 'density', 'probability density'],
        dflt: '',
        editType: 'calc',
        description: [
            'Specifies the type of normalization used for this histogram trace.',

            'If **, the span of each bar corresponds to the number of',
            'occurrences (i.e. the number of data points lying inside the bins).',

            'If *percent* / *probability*, the span of each bar corresponds to',
            'the percentage / fraction of occurrences with respect to the total',
            'number of sample points',
            '(here, the sum of all bin HEIGHTS equals 100% / 1).',

            'If *density*, the span of each bar corresponds to the number of',
            'occurrences in a bin divided by the size of the bin interval',
            '(here, the sum of all bin AREAS equals the',
            'total number of sample points).',

            'If *probability density*, the area of each bar corresponds to the',
            'probability that an event will fall into the corresponding bin',
            '(here, the sum of all bin AREAS equals 1).'
        ].join(' ')
    },

    cumulative: {
        enabled: {
            valType: 'boolean',
            dflt: false,
            editType: 'calc',
            description: [
                'If true, display the cumulative distribution by summing the',
                'binned values. Use the `direction` and `centralbin` attributes',
                'to tune the accumulation method.',
                'Note: in this mode, the *density* `histnorm` settings behave',
                'the same as their equivalents without *density*:',
                '** and *density* both rise to the number of data points, and',
                '*probability* and *probability density* both rise to the',
                'number of sample points.'
            ].join(' ')
        },

        direction: {
            valType: 'enumerated',
            values: ['increasing', 'decreasing'],
            dflt: 'increasing',
            editType: 'calc',
            description: [
                'Only applies if cumulative is enabled.',
                'If *increasing* (default) we sum all prior bins, so the result',
                'increases from left to right. If *decreasing* we sum later bins',
                'so the result decreases from left to right.'
            ].join(' ')
        },

        currentbin: {
            valType: 'enumerated',
            values: ['include', 'exclude', 'half'],
            dflt: 'include',
            editType: 'calc',
            description: [
                'Only applies if cumulative is enabled.',
                'Sets whether the current bin is included, excluded, or has half',
                'of its value included in the current cumulative value.',
                '*include* is the default for compatibility with various other',
                'tools, however it introduces a half-bin bias to the results.',
                '*exclude* makes the opposite half-bin bias, and *half* removes',
                'it.'
            ].join(' ')
        },
        editType: 'calc'
    },
    nbinsx: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        editType: 'calc',
        description: [
            'Specifies the maximum number of desired bins. This value will be used',
            'in an algorithm that will decide the optimal bin size such that the',
            'histogram best visualizes the distribution of the data.',
            'Ignored if `xbins.size` is provided.'
        ].join(' ')
    },
    xbins: makeBinAttrs('x', true),

    nbinsy: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        editType: 'calc',
        description: [
            'Specifies the maximum number of desired bins. This value will be used',
            'in an algorithm that will decide the optimal bin size such that the',
            'histogram best visualizes the distribution of the data.',
            'Ignored if `ybins.size` is provided.'
        ].join(' ')
    },
    ybins: makeBinAttrs('y', true),
    autobinx: {
        valType: 'boolean',
        dflt: null,
        editType: 'calc',
        description: [
            'Obsolete: since v1.42 each bin attribute is auto-determined',
            'separately and `autobinx` is not needed. However, we accept',
            '`autobinx: true` or `false` and will update `xbins` accordingly',
            'before deleting `autobinx` from the trace.'
        ].join(' ')
    },
    autobiny: {
        valType: 'boolean',
        dflt: null,
        editType: 'calc',
        description: [
            'Obsolete: since v1.42 each bin attribute is auto-determined',
            'separately and `autobiny` is not needed. However, we accept',
            '`autobiny: true` or `false` and will update `ybins` accordingly',
            'before deleting `autobiny` from the trace.'
        ].join(' ')
    },

    bingroup: {
        valType: 'string',
        dflt: '',
        editType: 'calc',
        description: [
            'Set a group of histogram traces which will have compatible bin settings.',
            'Note that traces on the same subplot and with the same *orientation*',
            'under `barmode` *stack*, *relative* and *group* are forced into the same bingroup,',
            'Using `bingroup`, traces under `barmode` *overlay* and on different axes',
            '(of the same axis type) can have compatible bin settings.',
            'Note that histogram and histogram2d* trace can share the same `bingroup`'
        ].join(' ')
    },

    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    texttemplate: texttemplateAttrs({
        arrayOk: false,
        editType: 'plot'
    }, {
        keys: ['label', 'value']
    }),

    textposition: extendFlat({}, barAttrs.textposition, {
        arrayOk: false
    }),

    textfont: fontAttrs({
        arrayOk: false,
        editType: 'plot',
        colorEditType: 'style',
        description: 'Sets the text font.'
    }),

    outsidetextfont: fontAttrs({
        arrayOk: false,
        editType: 'plot',
        colorEditType: 'style',
        description: 'Sets the font used for `text` lying outside the bar.'
    }),

    insidetextfont: fontAttrs({
        arrayOk: false,
        editType: 'plot',
        colorEditType: 'style',
        description: 'Sets the font used for `text` lying inside the bar.'
    }),

    insidetextanchor: barAttrs.insidetextanchor,

    textangle: barAttrs.textangle,
    cliponaxis: barAttrs.cliponaxis,
    constraintext: barAttrs.constraintext,

    marker: barAttrs.marker,

    offsetgroup: barAttrs.offsetgroup,
    alignmentgroup: barAttrs.alignmentgroup,

    selected: barAttrs.selected,
    unselected: barAttrs.unselected,

    zorder: barAttrs.zorder
};

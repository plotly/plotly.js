/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var barAttrs = require('../bar/attributes');


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

    text: barAttrs.text,
    orientation: barAttrs.orientation,

    histfunc: {
        valType: 'enumerated',
        values: ['count', 'sum', 'avg', 'min', 'max'],
        role: 'style',
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
        role: 'style',
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
            role: 'info',
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
            role: 'info',
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
            role: 'info',
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

    autobinx: {
        valType: 'boolean',
        dflt: null,
        role: 'style',
        editType: 'calc',
        impliedEdits: {
            'xbins.start': undefined,
            'xbins.end': undefined,
            'xbins.size': undefined
        },
        description: [
            'Determines whether or not the x axis bin attributes are picked',
            'by an algorithm. Note that this should be set to false if you',
            'want to manually set the number of bins using the attributes in',
            'xbins.'
        ].join(' ')
    },
    nbinsx: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'style',
        editType: 'calc',
        description: [
            'Specifies the maximum number of desired bins. This value will be used',
            'in an algorithm that will decide the optimal bin size such that the',
            'histogram best visualizes the distribution of the data.'
        ].join(' ')
    },
    xbins: makeBinsAttr('x'),

    autobiny: {
        valType: 'boolean',
        dflt: null,
        role: 'style',
        editType: 'calc',
        impliedEdits: {
            'ybins.start': undefined,
            'ybins.end': undefined,
            'ybins.size': undefined
        },
        description: [
            'Determines whether or not the y axis bin attributes are picked',
            'by an algorithm. Note that this should be set to false if you',
            'want to manually set the number of bins using the attributes in',
            'ybins.'
        ].join(' ')
    },
    nbinsy: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'style',
        editType: 'calc',
        description: [
            'Specifies the maximum number of desired bins. This value will be used',
            'in an algorithm that will decide the optimal bin size such that the',
            'histogram best visualizes the distribution of the data.'
        ].join(' ')
    },
    ybins: makeBinsAttr('y'),

    marker: barAttrs.marker,

    error_y: barAttrs.error_y,
    error_x: barAttrs.error_x,

    _deprecated: {
        bardir: barAttrs._deprecated.bardir
    }
};

function makeBinsAttr(axLetter) {
    var impliedEdits = {};
    impliedEdits['autobin' + axLetter] = false;
    var impliedEditsInner = {};
    impliedEditsInner['^autobin' + axLetter] = false;

    return {
        start: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            editType: 'calc',
            impliedEdits: impliedEditsInner,
            description: [
                'Sets the starting value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        end: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            editType: 'calc',
            impliedEdits: impliedEditsInner,
            description: [
                'Sets the end value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        size: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            editType: 'calc',
            impliedEdits: impliedEditsInner,
            description: [
                'Sets the step in-between value each', axLetter,
                'axis bin.'
            ].join(' ')
        },
        editType: 'calc',
        impliedEdits: impliedEdits
    };
}

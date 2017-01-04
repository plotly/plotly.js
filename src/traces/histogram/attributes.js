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
        description: [
            'Sets the sample data to be binned on the x axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
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
        description: [
            'Specifies the type of normalization used for this histogram trace.',

            'If **, the span of each bar corresponds to the number of',
            'occurrences (i.e. the number of data points lying inside the bins).',

            'If *percent*, the span of each bar corresponds to the percentage',
            'of occurrences with respect to the total number of sample points',
            '(here, the sum of all bin area equals 100%).',

            'If *density*, the span of each bar corresponds to the number of',
            'occurrences in a bin divided by the size of the bin interval',
            '(here, the sum of all bin area equals the',
            'total number of sample points).',

            'If *probability density*, the span of each bar corresponds to the',
            'probability that an event will fall into the corresponding bin',
            '(here, the sum of all bin area equals 1).'
        ].join(' ')
    },

    autobinx: {
        valType: 'boolean',
        dflt: null,
        role: 'style',
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
    return {
        start: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            description: [
                'Sets the starting value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        end: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            description: [
                'Sets the end value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        size: {
            valType: 'any', // for date axes
            dflt: null,
            role: 'style',
            description: [
                'Sets the step in-between value each', axLetter,
                'axis bin.'
            ].join(' ')
        }
    };
}

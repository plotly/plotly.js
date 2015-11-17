/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var barAttrs = require('../bars/attributes');


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
    z: {
        valType: 'data_array',
        description: 'Sets the aggregation data.'
    },
    marker: {
        color: {  // FIXME this overrides 'bar'
            valType: 'data_array',
            arrayOk: undefined
        }
    },
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
        dflt: true,
        role: 'style',
        description: [
            'Determines whether or not the x axis bin attributes are picked',
            'by an algorithm.'
        ].join(' ')
    },
    nbinsx: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'style',
        description: 'Sets the number of x axis bins.'
    },
    xbins: makeBinsAttr('x'),
    autobiny: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
        description: [
            'Determines whether or not the y axis bin attributes are picked',
            'by an algorithm.'
        ].join(' ')
    },
    nbinsy: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'style',
        description: 'Sets the number of y axis bins.'
    },
    ybins: makeBinsAttr('y')
};

function makeBinsAttr(axLetter) {
    return {
        start: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: [
                'Sets the starting value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        end: {
            valType: 'number',
            dflt: null,
            role: 'style',
            description: [
                'Sets the end value for the', axLetter,
                'axis bins.'
            ].join(' ')
        },
        size: {
            valType: 'any', // for date axes
            dflt: 1,
            role: 'style',
            description: [
                'Sets the step in-between value each', axLetter,
                'axis bin.'
            ].join(' ')
        }
    };
}

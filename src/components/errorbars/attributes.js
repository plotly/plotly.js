/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    visible: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Determines whether or not this set of error bars is visible.'
        ].join(' ')
    },
    type: {
        valType: 'enumerated',
        values: ['percent', 'constant', 'sqrt', 'data'],
        role: 'info',
        description: [
            'Determines the rule used to generate the error bars.',

            'If *constant`, the bar lengths are of a constant value.',
            'Set this constant in `value`.',

            'If *percent*, the bar lengths correspond to a percentage of',
            'underlying data. Set this percentage in `value`.',

            'If *sqrt*, the bar lengths correspond to the sqaure of the',
            'underlying data.',

            'If *array*, the bar lengths are set with data set `array`.'
        ].join(' ')
    },
    symmetric: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Determines whether or not the error bars have the same length',
            'in both direction',
            '(top/bottom for vertical bars, left/right for horizontal bars.'
        ].join(' ')
    },
    array: {
        valType: 'data_array',
        description: [
            'Sets the data corresponding the length of each error bar.',
            'Values are plotted relative to the underlying data.'
        ].join(' ')
    },
    arrayminus: {
        valType: 'data_array',
        description: [
            'Sets the data corresponding the length of each error bar in the',
            'bottom (left) direction for vertical (horizontal) bars',
            'Values are plotted relative to the underlying data.'
        ].join(' ')
    },
    value: {
        valType: 'number',
        min: 0,
        dflt: 10,
        role: 'info',
        description: [
            'Sets the value of either the percentage',
            '(if `type` is set to *percent*) or the constant',
            '(if `type` is set to *constant*) corresponding to the lengths of',
            'the error bars.'
        ].join(' ')
    },
    valueminus: {
        valType: 'number',
        min: 0,
        dflt: 10,
        role: 'info',
        description: [
            'Sets the value of either the percentage',
            '(if `type` is set to *percent*) or the constant',
            '(if `type` is set to *constant*) corresponding to the lengths of',
            'the error bars in the',
            'bottom (left) direction for vertical (horizontal) bars'
        ].join(' ')
    },
    traceref: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'info'
    },
    tracerefminus: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        role: 'info'
    },
    copy_ystyle: {
        valType: 'boolean',
        role: 'style'
    },
    copy_zstyle: {
        valType: 'boolean',
        role: 'style'
    },
    color: {
        valType: 'color',
        role: 'style',
        description: 'Sets the stoke color of the error bars.'
    },
    thickness: {
        valType: 'number',
        min: 0,
        dflt: 2,
        role: 'style',
        description: 'Sets the thickness (in px) of the error bars.'
    },
    width: {
        valType: 'number',
        min: 0,
        role: 'style',
        description: [
            'Sets the width (in px) of the cross-bar at both ends',
            'of the error bars.'
        ].join(' ')
    },

    _deprecated: {
        opacity: {
            valType: 'number',
            role: 'style',
            description: [
                'Obsolete.',
                'Use the alpha channel in error bar `color` to set the opacity.'
            ].join(' ')
        }
    }
};

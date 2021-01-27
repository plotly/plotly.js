'use strict';


module.exports = {
    visible: {
        valType: 'boolean',
        editType: 'calc',
        description: [
            'Determines whether or not this set of error bars is visible.'
        ].join(' ')
    },
    type: {
        valType: 'enumerated',
        values: ['percent', 'constant', 'sqrt', 'data'],
        editType: 'calc',
        description: [
            'Determines the rule used to generate the error bars.',

            'If *constant`, the bar lengths are of a constant value.',
            'Set this constant in `value`.',

            'If *percent*, the bar lengths correspond to a percentage of',
            'underlying data. Set this percentage in `value`.',

            'If *sqrt*, the bar lengths correspond to the square of the',
            'underlying data.',

            'If *data*, the bar lengths are set with data set `array`.'
        ].join(' ')
    },
    symmetric: {
        valType: 'boolean',
        editType: 'calc',
        description: [
            'Determines whether or not the error bars have the same length',
            'in both direction',
            '(top/bottom for vertical bars, left/right for horizontal bars.'
        ].join(' ')
    },
    array: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the data corresponding the length of each error bar.',
            'Values are plotted relative to the underlying data.'
        ].join(' ')
    },
    arrayminus: {
        valType: 'data_array',
        editType: 'calc',
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
        editType: 'calc',
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
        editType: 'calc',
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
        editType: 'style'
    },
    tracerefminus: {
        valType: 'integer',
        min: 0,
        dflt: 0,
        editType: 'style'
    },
    copy_ystyle: {
        valType: 'boolean',
        editType: 'plot'
    },
    copy_zstyle: {
        valType: 'boolean',
        editType: 'style'
    },
    color: {
        valType: 'color',
        editType: 'style',
        description: 'Sets the stoke color of the error bars.'
    },
    thickness: {
        valType: 'number',
        min: 0,
        dflt: 2,
        editType: 'style',
        description: 'Sets the thickness (in px) of the error bars.'
    },
    width: {
        valType: 'number',
        min: 0,
        editType: 'plot',
        description: [
            'Sets the width (in px) of the cross-bar at both ends',
            'of the error bars.'
        ].join(' ')
    },
    editType: 'calc',

    _deprecated: {
        opacity: {
            valType: 'number',
            editType: 'style',
            description: [
                'Obsolete.',
                'Use the alpha channel in error bar `color` to set the opacity.'
            ].join(' ')
        }
    }
};

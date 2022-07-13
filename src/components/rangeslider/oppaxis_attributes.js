'use strict';

module.exports = {
    // not really a 'subplot' attribute container,
    // but this is the flag we use to denote attributes that
    // support yaxis, yaxis2, yaxis3, ... counters
    _isSubplotObj: true,

    rangemode: {
        valType: 'enumerated',
        values: ['auto', 'fixed', 'match'],
        dflt: 'match',
        editType: 'calc',
        description: [
            'Determines whether or not the range of this axis in',
            'the rangeslider use the same value than in the main plot',
            'when zooming in/out.',
            'If *auto*, the autorange will be used.',
            'If *fixed*, the `range` is used.',
            'If *match*, the current range of the corresponding y-axis on the main subplot is used.'
        ].join(' ')
    },
    range: {
        valType: 'info_array',
        items: [
            {valType: 'any', editType: 'plot'},
            {valType: 'any', editType: 'plot'}
        ],
        editType: 'plot',
        description: [
            'Sets the range of this axis for the rangeslider.'
        ].join(' ')
    },
    editType: 'calc'
};

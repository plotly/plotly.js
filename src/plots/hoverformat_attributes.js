'use strict';

var FORMAT_LINK = require('../constants/docs').FORMAT_LINK;

module.exports = function axisHoverFormat(x, mockedAxis) {
    return {
        valType: 'string',
        dflt: '',
        editType: 'none',
        description: [
            'Sets the hover text formatting rule for `' + x + '`',
            ' using d3 formatting mini-languages which are very similar to those in Python.',
            'See: ' + FORMAT_LINK,
            'By default the values are formatted using ' + (
                mockedAxis ?
                    'generic number format' :
                    ('`' + x + 'axis.hoverformat`')
            ) + '.',
        ].join(' ')
    };
};

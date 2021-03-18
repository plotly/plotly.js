'use strict';

var FORMAT_LINK = require('../constants/docs').FORMAT_LINK;

function axisHoverFormat(axis) {
    return {
        valType: 'string',
        dflt: '',
        editType: 'none',
        description: [
            'Sets the hover text formatting rule on the ' + axis + ' axis using d3 formatting mini-languages',
            'which are very similar to those in Python. See:',
            FORMAT_LINK
        ].join(' ')
    };
}

module.exports = {
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),
    zhoverformat: axisHoverFormat('z')
};

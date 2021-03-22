'use strict';

var FORMAT_LINK = require('../constants/docs').FORMAT_LINK;

function axisHoverFormat(str) {
    return {
        valType: 'string',
        dflt: '',
        editType: 'none',
        description: [
            'Sets the hover text formatting rule for the ' + str + ' using d3 formatting mini-languages',
            'which are very similar to those in Python. See:',
            FORMAT_LINK
        ].join(' ')
    };
}

module.exports = {
    uhoverformat: axisHoverFormat('u component'),
    vhoverformat: axisHoverFormat('v component'),
    whoverformat: axisHoverFormat('w component'),

    xhoverformat: axisHoverFormat('x axis'),
    yhoverformat: axisHoverFormat('y aixs'),
    zhoverformat: axisHoverFormat('z axis')
};

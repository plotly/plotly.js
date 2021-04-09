'use strict';

var docs = require('../constants/docs')
var FORMAT_LINK = docs.FORMAT_LINK;
var DATE_FORMAT_LINK = docs.DATE_FORMAT_LINK;

module.exports = function axisHoverFormat(x, noDates) {
    return {
        valType: 'string',
        dflt: '',
        editType: 'none',
        description: [
            'Sets the hover text formatting rule for `' + x + '`',
            ' using d3 formatting mini-languages which are very similar to those in Python.',
            'See: ' + FORMAT_LINK + (
                noDates ?
                    '' :
                    ' And for dates see: ' + DATE_FORMAT_LINK
                ),
            'By default the values are formatted using ' + (
                noDates ?
                    'generic number format' :
                    ('`' + x + 'axis.hoverformat`')
            ) + '.',
        ].join(' ')
    };
};

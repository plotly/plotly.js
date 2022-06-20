'use strict';

var dash = require('../../drawing/attributes').dash;
var extendFlat = require('../../../lib/extend').extendFlat;

module.exports = {
    newselection: {
        line: {
            color: {
                valType: 'color',
                editType: 'none',
                description: [
                    'Sets the line color.',
                    'By default uses either dark grey or white',
                    'to increase contrast with background color.'
                ].join(' ')
            },
            width: {
                valType: 'number',
                min: 1,
                dflt: 1,
                editType: 'none',
                description: 'Sets the line width (in px).'
            },
            dash: extendFlat({}, dash, {
                dflt: 'dot',
                editType: 'none'
            }),
            editType: 'none'
        },

        // no drawdirection here noting that layout.selectdirection is used instead.

        editType: 'none'
    },

    activeselection: {
        fillcolor: {
            valType: 'color',
            dflt: '#7f7f7f',
            editType: 'none',
            description: 'Sets the color filling the active selection\' interior.'
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 0.5,
            editType: 'none',
            description: 'Sets the opacity of the active selection.'
        },
        editType: 'none'
    }
};

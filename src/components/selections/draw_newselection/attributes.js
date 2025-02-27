'use strict';

var dash = require('../../drawing/attributes').dash;
var extendFlat = require('../../../lib/extend').extendFlat;

module.exports = {
    newselection: {
        mode: {
            valType: 'enumerated',
            values: ['immediate', 'gradual'],
            dflt: 'immediate',
            editType: 'none',
            description: [
                'Describes how a new selection is created.',
                'If `immediate`, a new selection is created after first mouse up.',
                'If `gradual`, a new selection is not created after first mouse.',
                'By adding to and subtracting from the initial selection,',
                'this option allows declaring extra outlines of the selection.'
            ].join(' ')
        },

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
            dflt: 'rgba(0,0,0,0)',
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

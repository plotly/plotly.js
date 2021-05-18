'use strict';

var constants = require('./constants');

module.exports = {
    editType: 'modebar',

    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        dflt: 'h',
        editType: 'modebar',
        description: 'Sets the orientation of the modebar.'
    },
    bgcolor: {
        valType: 'color',
        editType: 'modebar',
        description: 'Sets the background color of the modebar.'
    },
    color: {
        valType: 'color',
        editType: 'modebar',
        description: 'Sets the color of the icons in the modebar.'
    },
    activecolor: {
        valType: 'color',
        editType: 'modebar',
        description: 'Sets the color of the active or hovered on icons in the modebar.'
    },
    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of user-driven changes related to the modebar,',
            'including `hovermode`, `dragmode`, and `showspikes` at both the',
            'root level and inside subplots. Defaults to `layout.uirevision`.'
        ].join(' ')
    },
    add: {
        valType: 'string',
        arrayOk: true,
        dflt: '',
        editType: 'modebar',
        description: [
            'Determines which predefined modebar buttons to add.',
            'Please note that these buttons will only be shown if they are',
            'compatible with all trace types used in a graph.',
            'Similar to `config.modeBarButtonsToAdd` option.',
            'This may include *' + constants.backButtons.join('*, *') + '*.'
        ].join(' ')
    },
    remove: {
        valType: 'string',
        arrayOk: true,
        dflt: '',
        editType: 'modebar',
        description: [
            'Determines which predefined modebar buttons to remove.',
            'Similar to `config.modeBarButtonsToRemove` option.',
            'This may include *' + constants.foreButtons.join('*, *') + '*.'
        ].join(' ')
    }
};

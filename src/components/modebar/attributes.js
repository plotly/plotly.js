'use strict';

var modeBarButtons = require('./buttons');
var buttonList = Object.keys(modeBarButtons);
var backButtons = [
    'v1hovermode',
    'hoverclosest',
    'hovercompare',
    'togglehover',
    'togglespikelines',
    'drawclosedpath',
    'drawopenpath',
    'drawline',
    'drawrect',
    'drawcircle',
    'eraseshape',
];

var foreButtons = [];
var addToForeButtons = function(b) {
    if(backButtons.indexOf(b._cat || b.name) !== -1) return;
    // for convenience add lowercase shotname e.g. zoomin as well fullname zoomInGeo
    var name = b.name;
    var _cat = (b._cat || b.name).toLowerCase();
    if(foreButtons.indexOf(name) === -1) foreButtons.push(name);
    if(foreButtons.indexOf(_cat) === -1) foreButtons.push(_cat);
};
buttonList.forEach(function(k) {
    addToForeButtons(modeBarButtons[k]);
});
foreButtons.sort();

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
        valType: 'flaglist',
        flags: backButtons,
        dflt: '',
        editType: 'modebar',
        description: [
            'Determines which predefined modebar buttons to add.',
            'Please note that these buttons will only be shown if they are',
            'compatible with all trace types used in a graph.',
            'Similar to `config.modeBarButtonsToAdd` option'
        ].join(' ')
    },
    remove: {
        valType: 'flaglist',
        flags: foreButtons,
        dflt: '',
        editType: 'modebar',
        description: [
            'Determines which predefined modebar buttons to remove.',
            'Similar to `config.modeBarButtonsToRemove` option'
        ].join(' ')
    }
};

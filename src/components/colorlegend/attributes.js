'use strict';

var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../color/attributes');


module.exports = {
    // not really a 'subplot' attribute container,
    // but this is the flag we use to denote attributes that
    // support colorlegend, colorlegend2, colorlegend3, ... counters
    _isSubplotObj: true,

    visible: {
        valType: 'boolean',
        dflt: true,
        editType: 'legend',
        description: 'Determines whether this color legend is visible.'
    },

    title: {
        text: {
            valType: 'string',
            dflt: '',
            editType: 'legend',
            description: 'Sets the title of the color legend.'
        },
        font: fontAttrs({
            editType: 'legend',
            description: 'Sets the font for the color legend title.'
        }),
        side: {
            valType: 'enumerated',
            values: ['top', 'left', 'right'],
            dflt: 'top',
            editType: 'legend',
            description: 'Determines the location of the legend title.'
        },
        editType: 'legend'
    },

    // Positioning (same pattern as legend)
    x: {
        valType: 'number',
        dflt: 1.02,
        editType: 'legend',
        description: 'Sets the x position with respect to `xref`.'
    },
    xref: {
        valType: 'enumerated',
        values: ['container', 'paper'],
        dflt: 'paper',
        editType: 'legend',
        description: 'Sets the container `x` refers to.'
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        editType: 'legend',
        description: 'Sets the horizontal anchor.'
    },
    y: {
        valType: 'number',
        dflt: 1,
        editType: 'legend',
        description: 'Sets the y position with respect to `yref`.'
    },
    yref: {
        valType: 'enumerated',
        values: ['container', 'paper'],
        dflt: 'paper',
        editType: 'legend',
        description: 'Sets the container `y` refers to.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        editType: 'legend',
        description: 'Sets the vertical anchor.'
    },

    // Styling
    bgcolor: {
        valType: 'color',
        editType: 'legend',
        description: 'Sets the background color.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'legend',
        description: 'Sets the border color.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        editType: 'legend',
        description: 'Sets the border width.'
    },
    font: fontAttrs({
        editType: 'legend',
        description: 'Sets the font for legend item text.'
    }),

    // Orientation
    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        dflt: 'v',
        editType: 'legend',
        description: 'Sets the orientation of the legend items.'
    },

    // Item sizing
    itemsizing: {
        valType: 'enumerated',
        values: ['trace', 'constant'],
        dflt: 'constant',
        editType: 'legend',
        description: [
            'Determines if legend items symbols scale with their corresponding data values',
            'or remain constant.'
        ].join(' ')
    },
    itemwidth: {
        valType: 'number',
        min: 30,
        dflt: 30,
        editType: 'legend',
        description: 'Sets the width of the legend item symbols.'
    },

    // Behavior
    itemclick: {
        valType: 'enumerated',
        values: ['toggle', 'toggleothers', false],
        dflt: 'toggle',
        editType: 'legend',
        description: 'Determines the behavior on legend item click.'
    },
    itemdoubleclick: {
        valType: 'enumerated',
        values: ['toggle', 'toggleothers', false],
        dflt: 'toggleothers',
        editType: 'legend',
        description: 'Determines the behavior on legend item double-click.'
    },

    // Continuous data binning
    binning: {
        valType: 'enumerated',
        values: ['auto', 'discrete'],
        dflt: 'auto',
        editType: 'calc',
        description: [
            'For numeric color data, *auto* creates bins while',
            '*discrete* treats each unique value as a category.'
        ].join(' ')
    },
    nbins: {
        valType: 'integer',
        min: 1,
        dflt: 5,
        editType: 'calc',
        description: 'Sets the number of bins for continuous data when binning is *auto*.'
    },

    editType: 'legend'
};

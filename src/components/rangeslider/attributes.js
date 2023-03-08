'use strict';

var colorAttributes = require('../color/attributes');

module.exports = {
    bgcolor: {
        valType: 'color',
        dflt: colorAttributes.background,
        editType: 'plot',
        description: 'Sets the background color of the range slider.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttributes.defaultLine,
        editType: 'plot',
        description: 'Sets the border color of the range slider.'
    },
    borderwidth: {
        valType: 'integer',
        dflt: 0,
        min: 0,
        editType: 'plot',
        description: 'Sets the border width of the range slider.'
    },
    autorange: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        impliedEdits: {'range[0]': undefined, 'range[1]': undefined},
        description: [
            'Determines whether or not the range slider range is',
            'computed in relation to the input data.',
            'If `range` is provided, then `autorange` is set to *false*.'
        ].join(' ')
    },
    range: {
        valType: 'info_array',
        items: [
            {valType: 'any', editType: 'calc', impliedEdits: {'^autorange': false}},
            {valType: 'any', editType: 'calc', impliedEdits: {'^autorange': false}}
        ],
        editType: 'calc',
        impliedEdits: {autorange: false},
        description: [
            'Sets the range of the range slider.',
            'If not set, defaults to the full xaxis range.',
            'If the axis `type` is *log*, then you must take the',
            'log of your desired range.',
            'If the axis `type` is *date*, it should be date strings,',
            'like date data, though Date objects and unix milliseconds',
            'will be accepted and converted to strings.',
            'If the axis `type` is *category*, it should be numbers,',
            'using the scale where each category is assigned a serial',
            'number from zero in the order it appears.'
        ].join(' ')
    },
    thickness: {
        valType: 'number',
        dflt: 0.15,
        min: 0,
        max: 1,
        editType: 'plot',
        description: [
            'The height of the range slider as a fraction of the',
            'total plot area height.'
        ].join(' ')
    },
    visible: {
        valType: 'boolean',
        dflt: true,
        editType: 'calc',
        description: [
            'Determines whether or not the range slider will be visible.',
            'If visible, perpendicular axes will be set to `fixedrange`'
        ].join(' ')
    },
    editType: 'calc'
};

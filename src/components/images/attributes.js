'use strict';

var cartesianConstants = require('../../plots/cartesian/constants');
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var axisPlaceableObjs = require('../../constants/axis_placeable_objects');


module.exports = templatedArray('image', {
    visible: {
        valType: 'boolean',
        dflt: true,
        editType: 'arraydraw',
        description: [
            'Determines whether or not this image is visible.'
        ].join(' ')
    },

    source: {
        valType: 'string',
        editType: 'arraydraw',
        description: [
            'Specifies the URL of the image to be used.',
            'The URL must be accessible from the domain where the',
            'plot code is run, and can be either relative or absolute.'

        ].join(' ')
    },

    layer: {
        valType: 'enumerated',
        values: ['below', 'above'],
        dflt: 'above',
        editType: 'arraydraw',
        description: [
            'Specifies whether images are drawn below or above traces.',
            'When `xref` and `yref` are both set to `paper`,',
            'image is drawn below the entire plot area.'
        ].join(' ')
    },

    sizex: {
        valType: 'number',
        dflt: 0,
        editType: 'arraydraw',
        description: [
            'Sets the image container size horizontally.',
            'The image will be sized based on the `position` value.',
            'When `xref` is set to `paper`, units are sized relative',
            'to the plot width.',
            'When `xref` ends with ` domain`, units are sized relative',
            'to the axis width.',
        ].join(' ')
    },

    sizey: {
        valType: 'number',
        dflt: 0,
        editType: 'arraydraw',
        description: [
            'Sets the image container size vertically.',
            'The image will be sized based on the `position` value.',
            'When `yref` is set to `paper`, units are sized relative',
            'to the plot height.',
            'When `yref` ends with ` domain`, units are sized relative',
            'to the axis height.'
        ].join(' ')
    },

    sizing: {
        valType: 'enumerated',
        values: ['fill', 'contain', 'stretch'],
        dflt: 'contain',
        editType: 'arraydraw',
        description: [
            'Specifies which dimension of the image to constrain.'
        ].join(' ')
    },

    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'arraydraw',
        description: 'Sets the opacity of the image.'
    },

    x: {
        valType: 'any',
        dflt: 0,
        editType: 'arraydraw',
        description: [
            'Sets the image\'s x position.',
            'When `xref` is set to `paper`, units are sized relative',
            'to the plot height.',
            'See `xref` for more info'
        ].join(' ')
    },

    y: {
        valType: 'any',
        dflt: 0,
        editType: 'arraydraw',
        description: [
            'Sets the image\'s y position.',
            'When `yref` is set to `paper`, units are sized relative',
            'to the plot height.',
            'See `yref` for more info'
        ].join(' ')
    },

    xanchor: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        dflt: 'left',
        editType: 'arraydraw',
        description: 'Sets the anchor for the x position'
    },

    yanchor: {
        valType: 'enumerated',
        values: ['top', 'middle', 'bottom'],
        dflt: 'top',
        editType: 'arraydraw',
        description: 'Sets the anchor for the y position.'
    },

    xref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.x.toString()
        ],
        dflt: 'paper',
        editType: 'arraydraw',
        description: [
            'Sets the images\'s x coordinate axis.',
            axisPlaceableObjs.axisRefDescription('x', 'left', 'right'),
        ].join(' ')
    },

    yref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.y.toString()
        ],
        dflt: 'paper',
        editType: 'arraydraw',
        description: [
            'Sets the images\'s y coordinate axis.',
            axisPlaceableObjs.axisRefDescription('y', 'bottom', 'top'),
        ].join(' ')
    },
    editType: 'arraydraw'
});

'use strict';

var fontAttrs = require('../../../plots/font_attributes');
var dash = require('../../drawing/attributes').dash;
var extendFlat = require('../../../lib/extend').extendFlat;

module.exports = {
    newshape: {
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
                min: 0,
                dflt: 4,
                editType: 'none',
                description: 'Sets the line width (in px).'
            },
            dash: extendFlat({}, dash, {
                dflt: 'solid',
                editType: 'none'
            }),
            editType: 'none'
        },
        fillcolor: {
            valType: 'color',
            dflt: 'rgba(0,0,0,0)',
            editType: 'none',
            description: [
                'Sets the color filling new shapes\' interior.',
                'Please note that if using a fillcolor with alpha greater than half,',
                'drag inside the active shape starts moving the shape underneath,',
                'otherwise a new shape could be started over.'
            ].join(' ')
        },
        fillrule: {
            valType: 'enumerated',
            values: ['evenodd', 'nonzero'],
            dflt: 'evenodd',
            editType: 'none',
            description: [
                'Determines the path\'s interior.',
                'For more info please visit https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule'
            ].join(' ')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            editType: 'none',
            description: 'Sets the opacity of new shapes.'
        },
        layer: {
            valType: 'enumerated',
            values: ['below', 'above'],
            dflt: 'above',
            editType: 'none',
            description: 'Specifies whether new shapes are drawn below or above traces.'
        },
        drawdirection: {
            valType: 'enumerated',
            values: ['ortho', 'horizontal', 'vertical', 'diagonal'],
            dflt: 'diagonal',
            editType: 'none',
            description: [
                'When `dragmode` is set to *drawrect*, *drawline* or *drawcircle*',
                'this limits the drag to be horizontal, vertical or diagonal.',
                'Using *diagonal* there is no limit e.g. in drawing lines in any direction.',
                '*ortho* limits the draw to be either horizontal or vertical.',
                '*horizontal* allows horizontal extend.',
                '*vertical* allows vertical extend.'
            ].join(' ')
        },
        label: {
            text: {
                valType: 'string',
                dflt: '',
                editType: 'none',
                description: 'Sets the text to display with shape.'
            },
            font: fontAttrs({
                editType: 'none',
                description: 'Sets the shape label text font.'
            }),
            textposition: {
                valType: 'enumerated',
                values: [
                    'top left', 'top center', 'top right',
                    'middle left', 'middle center', 'middle right',
                    'bottom left', 'bottom center', 'bottom right',
                    'start', 'middle', 'end',
                ],
                editType: 'none',
                description: 'Sets the position of the label text relative to the shape.'
            },
            textangle: {
                valType: 'angle',
                editType: 'none',
                description: [
                    'Sets the angle at which the label text is drawn',
                    'with respect to the horizontal. For lines, the default textangle is `auto`,',
                    'which displays the text at the same angle as the line. For all other shapes,',
                    'the default textangle is 0 (horizontal).'
                ].join(' ')
            },
            xanchor: {
                valType: 'enumerated',
                values: ['auto', 'left', 'center', 'right'],
                dflt: 'auto',
                editType: 'none',
                description: 'Sets the text box\'s horizontal position anchor.',
            },
            yanchor: {
                valType: 'enumerated',
                values: ['top', 'middle', 'bottom'],
                editType: 'none',
                description: 'Sets the text box\'s vertical position anchor.',
            },
            padding: {
                valType: 'number',
                dflt: 3,
                editType: 'none',
                description: 'Sets padding between edge of label and xanchor / yanchor.'
            },
            editType: 'none'
        },
        editType: 'none'
    },

    activeshape: {
        fillcolor: {
            valType: 'color',
            dflt: 'rgb(255,0,255)',
            editType: 'none',
            description: 'Sets the color filling the active shape\' interior.'
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 0.5,
            editType: 'none',
            description: 'Sets the opacity of the active shape.'
        },
        editType: 'none'
    }
};

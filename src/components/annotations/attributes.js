/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ARROWPATHS = require('./arrow_paths');
var fontAttrs = require('../../plots/font_attributes');
var cartesianConstants = require('../../plots/cartesian/constants');
var extendFlat = require('../../lib/extend').extendFlat;


module.exports = {
    _isLinkedToArray: true,

    text: {
        valType: 'string',
        role: 'info',
        description: [
            'Sets the text associated with this annotation.',
            'Plotly uses a subset of HTML tags to do things like',
            'newline (<br>), bold (<b></b>), italics (<i></i>),',
            'hyperlinks (<a href=\'...\'></a>). Tags <em>, <sup>, <sub>',
            '<span> are also supported.'
        ].join(' ')
    },
    textangle: {
        valType: 'angle',
        dflt: 0,
        role: 'style',
        description: [
            'Sets the angle at which the `text` is drawn',
            'with respect to the horizontal.'
        ].join(' ')
    },
    font: extendFlat({}, fontAttrs, {
        description: 'Sets the annotation text font.'
    }),
    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        role: 'style',
        description: 'Sets the opacity of the annotation (text + arrow).'
    },
    align: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        dflt: 'center',
        role: 'style',
        description: [
            'Sets the vertical alignment of the `text` with',
            'respect to the set `x` and `y` position.',
            'Has only an effect if `text` spans more two or more lines',
            '(i.e. `text` contains one or more <br> HTML tags).'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        role: 'style',
        description: 'Sets the background color of the annotation.'
    },
    bordercolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        role: 'style',
        description: [
            'Sets the color of the border enclosing the annotation `text`.'
        ].join(' ')
    },
    borderpad: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: [
            'Sets the padding (in px) between the `text`',
            'and the enclosing border.'
        ].join(' ')
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: [
            'Sets the width (in px) of the border enclosing',
            'the annotation `text`.'
        ].join(' ')
    },
    // arrow
    showarrow: {
        valType: 'boolean',
        dflt: true,
        role: 'style',
        description: [
            'Determines whether or not the annotation is drawn with an arrow.',
            'If *true*, `text` is placed near the arrow\'s tail.',
            'If *false*, `text` lines up with the `x` and `y` provided.'
        ].join(' ')
    },
    arrowcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the color of the annotation arrow.'
    },
    arrowhead: {
        valType: 'integer',
        min: 0,
        max: ARROWPATHS.length,
        dflt: 1,
        role: 'style',
        description: 'Sets the annotation arrow head style.'
    },
    arrowsize: {
        valType: 'number',
        min: 0.3,
        dflt: 1,
        role: 'style',
        description: 'Sets the size (in px) of annotation arrow head.'
    },
    arrowwidth: {
        valType: 'number',
        min: 0.1,
        role: 'style',
        description: 'Sets the width (in px) of annotation arrow.'
    },
    ax: {
        valType: 'number',
        dflt: -10,
        role: 'info',
        description: [
            'Sets the x component of the arrow tail about the arrow head.',
            'A positive (negative) component corresponds to an arrow pointing',
            'from right to left (left to right)'
        ].join(' ')
    },
    ay: {
        valType: 'number',
        dflt: -30,
        role: 'info',
        description: [
            'Sets the y component of the arrow tail about the arrow head.',
            'A positive (negative) component corresponds to an arrow pointing',
            'from bottom to top (top to bottom)'
        ].join(' ')
    },
    // positioning
    xref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.x.toString()
        ],
        role: 'info',
        description: [
            'Sets the annotation\'s x coordinate axis.',
            'If set to an x axis id (e.g. *x* or *x2*), the `x` position',
            'refers to an x coordinate',
            'If set to *paper*, the `x` position refers to the distance from',
            'the left side of the plotting area in normalized coordinates',
            'where 0 (1) corresponds to the left (right) side.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the annotation\'s x position.',
            'Note that dates and categories are converted to numbers.'
        ].join(' ')
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the annotation\'s horizontal position anchor',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the annotation.',
            'For example, if `x` is set to 1, `xref` to *paper* and',
            '`xanchor` to *right* then the right-most portion of the',
            'annotation lines up with the right-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *center* for',
            'data-referenced annotations',
            'whereas for paper-referenced, the anchor picked corresponds',
            'to the closest side.'
        ].join(' ')
    },
    yref: {
        valType: 'enumerated',
        values: [
            'paper',
            cartesianConstants.idRegex.y.toString()
        ],
        role: 'info',
        description: [
            'Sets the annotation\'s y coordinate axis.',
            'If set to an y axis id (e.g. *y* or *y2*), the `y` position',
            'refers to an y coordinate',
            'If set to *paper*, the `y` position refers to the distance from',
            'the bottom of the plotting area in normalized coordinates',
            'where 0 (1) corresponds to the bottom (top).'
        ].join(' ')
    },
    y: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the annotation\'s y position.',
            'Note that dates and categories are converted to numbers.'
        ].join(' ')
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the annotation\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the annotation.',
            'For example, if `y` is set to 1, `yref` to *paper* and',
            '`yanchor` to *top* then the top-most portion of the',
            'annotation lines up with the top-most edge of the',
            'plotting area.',
            'If *auto*, the anchor is equivalent to *middle* for',
            'data-referenced annotations',
            'whereas for paper-referenced, the anchor picked corresponds',
            'to the closest side.'
        ].join(' ')
    },

    _deprecated: {
        ref: {
            valType: 'string',
            role: 'info',
            description: [
                'Obsolete. Set `xref` and `yref` separately instead.'
            ].join(' ')
        }
    }
};

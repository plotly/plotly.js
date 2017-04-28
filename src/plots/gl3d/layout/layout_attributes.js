/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var gl3dAxisAttrs = require('./axis_attributes');
var annAtts = require('../../../components/annotations/attributes');
var extendFlat = require('../../../lib/extend').extendFlat;

function makeVector(x, y, z) {
    return {
        x: {
            valType: 'number',
            role: 'info',
            dflt: x
        },
        y: {
            valType: 'number',
            role: 'info',
            dflt: y
        },
        z: {
            valType: 'number',
            role: 'info',
            dflt: z
        }
    };
}

module.exports = {
    _arrayAttrRegexps: [/^scene([2-9]|[1-9][0-9]+)?\.annotations/],

    bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: 'rgba(0,0,0,0)'
    },
    camera: {
        up: extendFlat(makeVector(0, 0, 1), {
            description: [
                'Sets the (x,y,z) components of the \'up\' camera vector.',
                'This vector determines the up direction of this scene',
                'with respect to the page.',
                'The default is *{x: 0, y: 0, z: 1}* which means that',
                'the z axis points up.'
            ].join(' ')
        }),
        center: extendFlat(makeVector(0, 0, 0), {
            description: [
                'Sets the (x,y,z) components of the \'center\' camera vector',
                'This vector determines the translation (x,y,z) space',
                'about the center of this scene.',
                'By default, there is no such translation.'
            ].join(' ')
        }),
        eye: extendFlat(makeVector(1.25, 1.25, 1.25), {
            description: [
                'Sets the (x,y,z) components of the \'eye\' camera vector.',
                'This vector determines the view point about the origin',
                'of this scene.'
            ].join(' ')
        })
    },
    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the horizontal domain of this scene',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the vertical domain of this scene',
                '(in plot fraction).'
            ].join(' ')
        }
    },
    aspectmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['auto', 'cube', 'data', 'manual'],
        dflt: 'auto',
        description: [
            'If *cube*, this scene\'s axes are drawn as a cube,',
            'regardless of the axes\' ranges.',

            'If *data*, this scene\'s axes are drawn',
            'in proportion with the axes\' ranges.',

            'If *manual*, this scene\'s axes are drawn',
            'in proportion with the input of *aspectratio*',
            '(the default behavior if *aspectratio* is provided).',

            'If *auto*, this scene\'s axes are drawn',
            'using the results of *data* except when one axis',
            'is more than four times the size of the two others,',
            'where in that case the results of *cube* are used.'
        ].join(' ')
    },
    aspectratio: { // must be positive (0's are coerced to 1)
        x: {
            valType: 'number',
            role: 'info',
            min: 0
        },
        y: {
            valType: 'number',
            role: 'info',
            min: 0
        },
        z: {
            valType: 'number',
            role: 'info',
            min: 0
        },
        description: [
            'Sets this scene\'s axis aspectratio.'
        ].join(' ')
    },

    xaxis: gl3dAxisAttrs,
    yaxis: gl3dAxisAttrs,
    zaxis: gl3dAxisAttrs,

    annotations: {
        _isLinkedToArray: 'annotation',

        visible: annAtts.visible,
        x: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the annotation\'s x position.'
            ].join(' ')
        },
        y: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the annotation\'s y position.'
            ].join(' ')
        },
        z: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the annotation\'s z position.'
            ].join(' ')
        },
        ax: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the x component of the arrow tail about the arrow head.'
            ].join(' ')
        },
        ay: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the y component of the arrow tail about the arrow head.'
            ].join(' ')
        },

        xanchor: annAtts.xanchor,
        xshift: annAtts.xshift,
        yanchor: annAtts.yanchor,
        yshift: annAtts.yshift,

        text: annAtts.text,
        textangle: annAtts.textangle,
        font: annAtts.font,
        width: annAtts.width,
        height: annAtts.height,
        opacity: annAtts.opacity,
        align: annAtts.align,
        valign: annAtts.valign,
        bgcolor: annAtts.bgcolor,
        bordercolor: annAtts.bordercolor,
        borderpad: annAtts.borderpad,
        borderwidth: annAtts.borderwidth,
        showarrow: annAtts.showarrow,
        arrowcolor: annAtts.arrowcolor,
        arrowhead: annAtts.arrowhead,
        arrowsize: annAtts.arrowsize,
        arrowwidth: annAtts.arrowwidth,
        standoff: annAtts.standoff,

        // maybes later
        // clicktoshow: annAtts.clicktoshow,
        // xclick: annAtts.xclick,
        // yclick: annAtts.yclick,

        // not needed!
        // axref: 'pixel'
        // ayref: 'pixel'
        // xref: 'x'
        // yref: 'y
        // zref: 'z'
    },

    dragmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['orbit', 'turntable', 'zoom', 'pan', false],
        dflt: 'turntable',
        description: [
            'Determines the mode of drag interactions for this scene.'
        ].join(' ')
    },
    hovermode: {
        valType: 'enumerated',
        role: 'info',
        values: ['closest', false],
        dflt: 'closest',
        description: [
            'Determines the mode of hover interactions for this scene.'
        ].join(' ')
    },

    _deprecated: {
        cameraposition: {
            valType: 'info_array',
            role: 'info',
            description: 'Obsolete. Use `camera` instead.'
        }
    }
};

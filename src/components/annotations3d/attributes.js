/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var annAtts = require('../annotations/attributes');

module.exports = {
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
        valType: 'number',
        role: 'info',
        description: [
            'Sets the x component of the arrow tail about the arrow head (in pixels).'
        ].join(' ')
    },
    ay: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the y component of the arrow tail about the arrow head (in pixels).'
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
    hovertext: annAtts.hovertext,
    hoverlabel: annAtts.hoverlabel,
    captureevents: annAtts.captureevents

    // maybes later?
    // clicktoshow: annAtts.clicktoshow,
    // xclick: annAtts.xclick,
    // yclick: annAtts.yclick,

    // not needed!
    // axref: 'pixel'
    // ayref: 'pixel'
    // xref: 'x'
    // yref: 'y
    // zref: 'z'
};

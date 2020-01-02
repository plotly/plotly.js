/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var annAttrs = require('../annotations/attributes');
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var templatedArray = require('../../plot_api/plot_template').templatedArray;

module.exports = overrideAll(templatedArray('annotation', {
    visible: annAttrs.visible,
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

    xanchor: annAttrs.xanchor,
    xshift: annAttrs.xshift,
    yanchor: annAttrs.yanchor,
    yshift: annAttrs.yshift,

    text: annAttrs.text,
    textangle: annAttrs.textangle,
    font: annAttrs.font,
    width: annAttrs.width,
    height: annAttrs.height,
    opacity: annAttrs.opacity,
    align: annAttrs.align,
    valign: annAttrs.valign,
    bgcolor: annAttrs.bgcolor,
    bordercolor: annAttrs.bordercolor,
    borderpad: annAttrs.borderpad,
    borderwidth: annAttrs.borderwidth,
    showarrow: annAttrs.showarrow,
    arrowcolor: annAttrs.arrowcolor,
    arrowhead: annAttrs.arrowhead,
    startarrowhead: annAttrs.startarrowhead,
    arrowside: annAttrs.arrowside,
    arrowsize: annAttrs.arrowsize,
    startarrowsize: annAttrs.startarrowsize,
    arrowwidth: annAttrs.arrowwidth,
    standoff: annAttrs.standoff,
    startstandoff: annAttrs.startstandoff,
    hovertext: annAttrs.hovertext,
    hoverlabel: annAttrs.hoverlabel,
    captureevents: annAttrs.captureevents,

    // maybes later?
    // clicktoshow: annAttrs.clicktoshow,
    // xclick: annAttrs.xclick,
    // yclick: annAttrs.yclick,

    // not needed!
    // axref: 'pixel'
    // ayref: 'pixel'
    // xref: 'x'
    // yref: 'y
    // zref: 'z'
}), 'calc', 'from-root');

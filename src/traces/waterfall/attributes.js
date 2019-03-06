/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;

var barAttrs = require('../bar/attributes');

var dash = require('../../components/drawing/attributes').dash;
var lineAttrs = require('../scatter/attributes').line;

module.exports = {

    initialized: {
        valType: 'boolean',
        dflt: false,

        role: 'info',
        editType: 'calc',
        description: [
            'Could be used to display the first value as an initial value',
            'rather than the difference.'
        ].join(' ')
    },

    x: barAttrs.x,
    x0: barAttrs.x0,
    dx: barAttrs.dx,
    y: barAttrs.y,
    y0: barAttrs.y0,
    dy: barAttrs.dy,

    r: barAttrs.r,
    t: barAttrs.t,

    text: barAttrs.text,
    hovertext: barAttrs.hovertext,
    hovertemplate: barAttrs.hovertemplate,

    textposition: barAttrs.textposition,

    textfont: barAttrs.textfont,

    insidetextfont: barAttrs.insidetextfont,

    outsidetextfont: barAttrs.outsidetextfont,

    constraintext: barAttrs.constraintext,

    cliponaxis: barAttrs.cliponaxis,

    orientation: barAttrs.orientation,

    offset: barAttrs.offset,

    width: barAttrs.width,

    marker: barAttrs.marker,

    connector: {
        color: extendFlat({}, lineAttrs.color, {dflt: '#FFFFFF'}),
        width: lineAttrs.width,
        dash: dash,
        editType: 'style'
    },

    offsetgroup: barAttrs.offsetgroup,
    alignmentgroup: barAttrs.offsetgroup,

    selected: barAttrs.selected,
    unselected: barAttrs.unselected
};

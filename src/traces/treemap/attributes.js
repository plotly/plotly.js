/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var pieAttrs = require('../pie/attributes');
var sunburstAttrs = require('../sunburst/attributes');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    labels: sunburstAttrs.labels,
    parents: sunburstAttrs.parents,

    values: sunburstAttrs.values,
    branchvalues: sunburstAttrs.branchvalues,
    count: sunburstAttrs.count,

    level: sunburstAttrs.level,
    maxdepth: sunburstAttrs.maxdepth,

    tiling: {
        packing: {
            valType: 'enumerated',
            values: [
                'squarify',
                'binary',
                'dice',
                'slice',
                'slice-dice',
                'dice-slice'
            ],
            dflt: 'squarify',
            role: 'info',
            editType: 'plot',
            description: [
                'Determines d3 treemap solver.',
                'For more info please refer to https://github.com/d3/d3-hierarchy#treemap-tiling'
            ].join(' ')
        },

        squarifyratio: {
            valType: 'number',
            role: 'info',
            min: 1,
            dflt: 1,
            editType: 'plot',
            description: [
                'When using *squarify* `packing` algorithm, according to https://github.com/d3/d3-hierarchy/blob/master/README.md#squarify_ratio',
                'this option specifies the desired aspect ratio of the generated rectangles.',
                'The ratio must be specified as a number greater than or equal to one.',
                'Note that the orientation of the generated rectangles (tall or wide)',
                'is not implied by the ratio; for example, a ratio of two will attempt',
                'to produce a mixture of rectangles whose width:height ratio is either 2:1 or 1:2.',
                'When using *squarify*, unlike d3 which uses the Golden Ratio i.e. 1.618034,',
                'Plotly applies 1 to increase squares in treemap layouts.'
            ].join(' ')
        },

        mirror: {
            valType: 'flaglist',
            role: 'info',
            flags: [
                'x',
                'y'
            ],
            dflt: '',
            editType: 'plot',
            description: [
                'Determines if the positions obtained from solver are mirrored on each axis.'
            ].join(' ')
        },

        pad: {
            valType: 'number',
            role: 'style',
            min: 0,
            dflt: 3,
            editType: 'plot',
            description: [
                'Sets the inner padding (in px).'
            ].join(' ')
        },

        editType: 'calc',
    },

    marker: extendFlat({
        pad: {
            top: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 'auto',
                editType: 'plot',
                description: [
                    'Sets the padding form the top (in px).'
                ].join(' ')
            },
            left: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 'auto',
                editType: 'plot',
                description: [
                    'Sets the padding form the left (in px).'
                ].join(' ')
            },
            right: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 'auto',
                editType: 'plot',
                description: [
                    'Sets the padding form the right (in px).'
                ].join(' ')
            },
            bottom: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 'auto',
                editType: 'plot',
                description: [
                    'Sets the padding form the bottom (in px).'
                ].join(' ')
            },

            editType: 'calc'
        },

        colors: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Sets the color of each sector of this treemap chart.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        opacity: {
            valType: 'number',
            editType: 'style',
            role: 'style',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the opacity for the sectors. With colorscale',
                'it is defaulted to 1; otherwise it is defaulted to 0.5'
            ].join(' ')
        },

        line: {
            color: extendFlat({}, pieAttrs.marker.line.color, {
                dflt: null,
                description: [
                    'Sets the color of the line enclosing each sector.',
                    'Defaults to the `paper_bgcolor` value.'
                ].join(' ')
            }),
            width: extendFlat({}, pieAttrs.marker.line.width, {dflt: 1}),
            editType: 'calc'
        },

        editType: 'calc'
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false // TODO: set to anim: true?
        })
    ),

    branch: {
        opacity: {
            valType: 'number',
            editType: 'style',
            role: 'style',
            min: 0,
            max: 1,
            description: [
                'Sets the opacity of the leaves i.e. based on the hierarchy height.',
                'With colorscale it is defaulted to 1; otherwise it is defaulted to 0.7'
            ].join(' ')
        },
        editType: 'plot'
    },

    pathbar: {
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            editType: 'plot',
            description: [
                'Determines if the path bar is drawn.'
            ].join(' ')
        },

        position: {
            valType: 'enumerated',
            values: [
                'top',
                'bottom'
            ],
            dflt: 'top',
            role: 'info',
            editType: 'plot',
            description: [
                'Determines on which side of the the treemap the',
                '`pathbar` should be presented.'
            ].join(' ')
        },

        divider: {
            valType: 'enumerated',
            values: [
                '>',
                '<',
                '|',
                '/',
                '\\'
            ],
            dflt: 'auto',
            role: 'style',
            editType: 'plot',
            description: [
                'Determines which divider is used between labels.',
                'With *top* `pathbar.position` it is defaulted to */*; and',
                'with *bottom* `pathbar.position` it is defaulted to *\\*.'
            ].join(' ')
        },

        height: {
            valType: 'number',
            dflt: 'auto',
            min: 12,
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the height (in px). If not specified the `parbath.textfont.size` is used',
                'with 3 pixles extra padding on each side.'
            ].join(' ')
        },

        textfont: extendFlat({}, pieAttrs.textfont, {
            description: 'Sets the font used inside `pathbar`.'
        }),

        editType: 'calc'
    },

    text: pieAttrs.text,
    textinfo: sunburstAttrs.textinfo,
    // TODO: incorporate `label` and `value` in the eventData
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: constants.eventDataKeys.concat(['label', 'value'])
    }),

    hovertext: pieAttrs.hovertext,
    hoverinfo: sunburstAttrs.hoverinfo,
    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    textfont: pieAttrs.textfont,
    insidetextfont: pieAttrs.insidetextfont,
    outsidetextfont: pieAttrs.outsidetextfont,

    textposition: {
        valType: 'enumerated',
        values: [
            'top left', 'top center', 'top right',
            'middle left', 'middle center', 'middle right',
            'bottom left', 'bottom center', 'bottom right'
        ],
        dflt: 'top left',
        role: 'style',
        editType: 'plot',
        description: [
            'Sets the positions of the `text` elements.'
        ].join(' ')
    },

    domain: domainAttrs({name: 'treemap', trace: true, editType: 'calc'}),

    _hovered: {
        marker: {
            line: {
                color: extendFlat({}, pieAttrs.marker.line.color, {
                    dflt: 'auto',
                    description: [
                        'Sets the color of the line',
                        'enclosing each sector when it is hovered'
                    ].join(' ')
                }),
                width: extendFlat({}, pieAttrs.marker.line.width, {
                    dflt: 'auto',
                    description: [
                        'Sets the width (in px) of the line',
                        'enclosing each sector when it is hovered.'
                    ].join(' ')
                }),
                editType: 'style'
            },

            editType: 'style'
        },
        editType: 'style'
    }
};

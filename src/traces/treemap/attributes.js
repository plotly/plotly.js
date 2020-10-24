/**
* Copyright 2012-2020, Plotly, Inc.
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

        flip: {
            valType: 'flaglist',
            role: 'info',
            flags: [
                'x',
                'y'
            ],
            dflt: '',
            editType: 'plot',
            description: [
                'Determines if the positions obtained from solver are flipped on each axis.'
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
            t: {
                valType: 'number',
                role: 'style',
                min: 0,
                editType: 'plot',
                description: [
                    'Sets the padding form the top (in px).'
                ].join(' ')
            },
            l: {
                valType: 'number',
                role: 'style',
                min: 0,
                editType: 'plot',
                description: [
                    'Sets the padding form the left (in px).'
                ].join(' ')
            },
            r: {
                valType: 'number',
                role: 'style',
                min: 0,
                editType: 'plot',
                description: [
                    'Sets the padding form the right (in px).'
                ].join(' ')
            },
            b: {
                valType: 'number',
                role: 'style',
                min: 0,
                editType: 'plot',
                description: [
                    'Sets the padding form the bottom (in px).'
                ].join(' ')
            },

            editType: 'calc'
        },

        colors: sunburstAttrs.marker.colors,

        depthfade: {
            valType: 'enumerated',
            values: [true, false, 'reversed'],
            editType: 'style',
            role: 'style',
            description: [
                'Determines if the sector colors are faded towards',
                'the background from the leaves up to the headers.',
                'This option is unavailable when a `colorscale` is present,',
                'defaults to false when `marker.colors` is set,',
                'but otherwise defaults to true.',
                'When set to *reversed*, the fading direction is inverted,',
                'that is the top elements within hierarchy are drawn with fully saturated colors',
                'while the leaves are faded towards the background color.'
            ].join(' ')
        },

        line: sunburstAttrs.marker.line,

        editType: 'calc'
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false // TODO: set to anim: true?
        })
    ),

    pathbar: {
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            editType: 'plot',
            description: [
                'Determines if the path bar is drawn',
                'i.e. outside the trace `domain` and',
                'with one pixel gap.'
            ].join(' ')
        },

        side: {
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

        edgeshape: {
            valType: 'enumerated',
            values: [
                '>',
                '<',
                '|',
                '/',
                '\\'
            ],
            dflt: '>',
            role: 'style',
            editType: 'plot',
            description: [
                'Determines which shape is used for edges between `barpath` labels.'
            ].join(' ')
        },

        thickness: {
            valType: 'number',
            min: 12,
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the thickness of `pathbar` (in px). If not specified the `pathbar.textfont.size` is used',
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
    outsidetextfont: extendFlat({}, pieAttrs.outsidetextfont, {
        description: [
            'Sets the font used for `textinfo` lying outside the sector.',
            'This option refers to the root of the hierarchy',
            'presented on top left corner of a treemap graph.',
            'Please note that if a hierarchy has multiple root nodes,',
            'this option won\'t have any effect and `insidetextfont` would be used.'
        ].join(' ')
    }),

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
    sort: pieAttrs.sort,
    root: sunburstAttrs.root,

    domain: domainAttrs({name: 'treemap', trace: true, editType: 'calc'}),
};

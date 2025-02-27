'use strict';

var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var pieAttrs = require('../pie/attributes');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;
var pattern = require('../../components/drawing/attributes').pattern;

module.exports = {
    labels: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the labels of each of the sectors.'
        ].join(' ')
    },
    parents: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the parent sectors for each of the sectors.',
            'Empty string items \'\' are understood to reference',
            'the root node in the hierarchy.',
            'If `ids` is filled, `parents` items are understood to be "ids" themselves.',
            'When `ids` is not set, plotly attempts to find matching items in `labels`,',
            'but beware they must be unique.'
        ].join(' ')
    },

    values: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the values associated with each of the sectors.',
            'Use with `branchvalues` to determine how the values are summed.'
        ].join(' ')
    },
    branchvalues: {
        valType: 'enumerated',
        values: ['remainder', 'total'],
        dflt: 'remainder',
        editType: 'calc',
        description: [
            'Determines how the items in `values` are summed.',
            'When set to *total*, items in `values` are taken to be value of all its descendants.',
            'When set to *remainder*, items in `values` corresponding to the root and the branches sectors',
            'are taken to be the extra part not part of the sum of the values at their leaves.'
        ].join(' ')
    },
    count: {
        valType: 'flaglist',
        flags: [
            'branches',
            'leaves'
        ],
        dflt: 'leaves',
        editType: 'calc',
        description: [
            'Determines default for `values` when it is not provided,',
            'by inferring a 1 for each of the *leaves* and/or *branches*, otherwise 0.'
        ].join(' ')
    },

    level: {
        valType: 'any',
        editType: 'plot',
        anim: true,
        description: [
            'Sets the level from which this trace hierarchy is rendered.',
            'Set `level` to `\'\'` to start from the root node in the hierarchy.',
            'Must be an "id" if `ids` is filled in, otherwise plotly attempts to find a matching',
            'item in `labels`.'
        ].join(' ')
    },
    maxdepth: {
        valType: 'integer',
        editType: 'plot',
        dflt: -1,
        description: [
            'Sets the number of rendered sectors from any given `level`.',
            'Set `maxdepth` to *-1* to render all the levels in the hierarchy.'
        ].join(' ')
    },

    marker: extendFlat({
        colors: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Sets the color of each sector of this trace.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        // colorinheritance: {
        //     valType: 'enumerated',
        //     values: ['per-branch', 'per-label', false]
        // },

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
        pattern: pattern,
        editType: 'calc'
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false // TODO: set to anim: true?
        })
    ),

    leaf: {
        opacity: {
            valType: 'number',
            editType: 'style',
            min: 0,
            max: 1,
            description: [
                'Sets the opacity of the leaves. With colorscale',
                'it is defaulted to 1; otherwise it is defaulted to 0.7'
            ].join(' ')
        },
        editType: 'plot'
    },

    text: pieAttrs.text,
    textinfo: {
        valType: 'flaglist',
        flags: [
            'label',
            'text',
            'value',
            'current path',
            'percent root',
            'percent entry',
            'percent parent'
        ],
        extras: ['none'],
        editType: 'plot',
        description: [
            'Determines which trace information appear on the graph.'
        ].join(' ')
    },

    // TODO: incorporate `label` and `value` in the eventData
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: constants.eventDataKeys.concat(['label', 'value'])
    }),

    hovertext: pieAttrs.hovertext,
    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: [
            'label',
            'text',
            'value',
            'name',
            'current path',
            'percent root',
            'percent entry',
            'percent parent'
        ],
        dflt: 'label+text+value+name'
    }),
    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    textfont: pieAttrs.textfont,
    insidetextorientation: pieAttrs.insidetextorientation,
    insidetextfont: pieAttrs.insidetextfont,
    outsidetextfont: extendFlat({}, pieAttrs.outsidetextfont, {
        description: [
            'Sets the font used for `textinfo` lying outside the sector.',
            'This option refers to the root of the hierarchy',
            'presented at the center of a sunburst graph.',
            'Please note that if a hierarchy has multiple root nodes,',
            'this option won\'t have any effect and `insidetextfont` would be used.'
        ].join(' ')
    }),
    rotation: {
        valType: 'angle',
        dflt: 0,
        editType: 'plot',
        description: [
            'Rotates the whole diagram counterclockwise by some angle.',
            'By default the first slice starts at 3 o\'clock.'
        ].join(' ')
    },
    sort: pieAttrs.sort,

    root: {
        color: {
            valType: 'color',
            editType: 'calc',
            dflt: 'rgba(0,0,0,0)',
            description: [
                'sets the color of the root node for a sunburst/treemap/icicle trace.',
                'this has no effect when a colorscale is used to set the markers.'
            ].join(' ')
        },
        editType: 'calc'
    },

    domain: domainAttrs({name: 'sunburst', trace: true, editType: 'calc'})
};

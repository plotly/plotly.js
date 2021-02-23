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
        flip: {
            valType: 'flaglist',
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
        colors: sunburstAttrs.marker.colors,

        line: sunburstAttrs.marker.line,

        editType: 'calc'
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false // TODO: set to anim: true?
        })
    ),

    leaf: sunburstAttrs.leaf,

    pathbar: {
        visible: {
            valType: 'boolean',
            dflt: true,
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
            editType: 'plot',
            description: [
                'Determines on which side of the the icicle the',
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
            editType: 'plot',
            description: [
                'Determines which shape is used for edges between `barpath` labels.'
            ].join(' ')
        },

        thickness: {
            valType: 'number',
            min: 12,
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
            'presented on top left corner of a icicle graph.',
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
        editType: 'plot',
        description: [
            'Sets the positions of the `text` elements.'
        ].join(' ')
    },
    sort: pieAttrs.sort,
    root: sunburstAttrs.root,

    domain: domainAttrs({name: 'icicle', trace: true, editType: 'calc'}),
};

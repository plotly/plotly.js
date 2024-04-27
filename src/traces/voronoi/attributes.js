'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var pieAttrs = require('../pie/attributes');
var sunburstAttrs = require('../sunburst/attributes');
var constants = require('../treemap/constants');
var extendFlat = require('../../lib/extend').extendFlat;
var pattern = require('../../components/drawing/attributes').pattern;

module.exports = {
    labels: sunburstAttrs.labels,
    parents: sunburstAttrs.parents,

    values: sunburstAttrs.values,
    branchvalues: sunburstAttrs.branchvalues,
    count: sunburstAttrs.count,

    level: sunburstAttrs.level,
    maxdepth: sunburstAttrs.maxdepth,

    tiling: {
        seed: {
            valType: 'integer',
            dflt: 0,
            min: 0,
            max: 100,
            editType: 'plot',
            description: [
                'Determines seed which controls creation of identical or different grid representations.',

            ].join(' ')
        },

        shape: {
            valType: 'enumerated',
            values: [
                'circle',
                'ellipse',
                'rectangle',
                'triangle',
                'square',
                'pentagon',
                'hexagon',
                'heptagon',
                'octagon',
                'nonagon',
                'decagon',
                'undecagon',
                'dodecagon',
                // TODO: add other shapes e.g. half circle, pie
            ],
            dflt: 'hexagon',
            editType: 'plot',
            description: [
                'Determines aspect ratio between width and height of shape',
            ].join(' ')
        },

        aspectratio: {
            valType: 'number',
            min: 0,
            editType: 'plot',
            description: [
                'Determines aspect ratio between width and height of shape',
                'Defalts to 0 when `tiling.shape` is set to *rectangle*, *ellipse* or *triangle*.',
                'Defalts to 1 when `tiling.shape` is set to *square*, *circle*, *pentagon*, *hexagon*, etc.'
            ].join(' ')
        },

        // TODO: add rotation?
        // TODO: add flip?

        pad: {
            valType: 'number',
            min: 0,
            dflt: 2,
            editType: 'plot',
            description: [
                'Sets the inner padding (in px) for each level of the hierarchy.',
            ].join(' ')
        },

        editType: 'calc',
    },

    marker: extendFlat({
        colors: sunburstAttrs.marker.colors,

        pattern: pattern,

        depthfade: {
            valType: 'enumerated',
            values: [true, false, 'reversed'],
            editType: 'style',
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

        cornerradius: {
            valType: 'number',
            min: 0,
            dflt: 0,
            editType: 'plot',
            description: [
                'Sets the maximum rounding of corners (in px).'
            ].join(' ')
        },

        editType: 'calc',
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
                'Determines on which side of the the voronoi the',
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
            'presented on top left corner of a voronoi graph.',
            'Please note that if a hierarchy has multiple root nodes,',
            'this option won\'t have any effect and `insidetextfont` would be used.'
        ].join(' ')
    }),

    sort: pieAttrs.sort,
    root: sunburstAttrs.root,

    domain: domainAttrs({name: 'voronoi', trace: true, editType: 'calc'}),
};

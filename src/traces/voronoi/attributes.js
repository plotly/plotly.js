'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var treemapAttrs = require('../treemap/attributes');
var treemapMarker = treemapAttrs.marker;

module.exports = {
    labels: treemapAttrs.labels,
    parents: treemapAttrs.parents,

    values: treemapAttrs.values,
    branchvalues: treemapAttrs.branchvalues,
    count: treemapAttrs.count,

    level: treemapAttrs.level,
    maxdepth: treemapAttrs.maxdepth,

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
        colors: treemapMarker.colors,
        pattern: treemapMarker.pattern,
        depthfade: treemapMarker.depthfade,
        line: treemapMarker.line,
        cornerradius: treemapMarker.cornerradius,
        editType: 'calc',
    },
        colorScaleAttrs('marker', {
            colorAttr: 'colors',
            anim: false
        })
    ),

    pathbar: treemapAttrs.pathbar,

    text: treemapAttrs.text,
    textinfo: treemapAttrs.textinfo,

    hovertext: treemapAttrs.hovertext,
    hoverinfo: treemapAttrs.hoverinfo,
    hovertemplate: treemapAttrs.hovertemplate,
    texttemplate: treemapAttrs.texttemplate,

    textfont: treemapAttrs.textfont,
    insidetextfont: treemapAttrs.insidetextfont,
    outsidetextfont: extendFlat({}, treemapAttrs.outsidetextfont, {
        description: [
            'Sets the font used for `textinfo` lying outside the sector.',
            'This option refers to the root of the hierarchy',
            'presented when viewing the root of a voronoi graph.',
            'Please note that if a hierarchy has multiple root nodes,',
            'this option won\'t have any effect and `insidetextfont` would be used.'
        ].join(' ')
    }),


    sort: treemapAttrs.sort, // TODO: possibly unused?
    root: treemapAttrs.root,

    domain: domainAttrs({name: 'voronoi', trace: true, editType: 'calc'}),
};

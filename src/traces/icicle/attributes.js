'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;

var colorScaleAttrs = require('../../components/colorscale/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var pieAttrs = require('../pie/attributes');
var sunburstAttrs = require('../sunburst/attributes');
var treemapAttrs = require('../treemap/attributes');
var constants = require('../treemap/constants');
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
        orientation: {
            valType: 'enumerated',
            values: ['v', 'h'],
            dflt: 'h',
            editType: 'plot',
            description: [
                'Sets the orientation of the icicle.',
                'With *v* the icicle grows vertically.',
                'With *h* the icicle grows horizontally.',
            ].join(' ')
        },

        flip: treemapAttrs.tiling.flip,

        pad: treemapAttrs.tiling.pad,

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

    pathbar: treemapAttrs.pathbar,

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
    outsidetextfont: treemapAttrs.outsidetextfont,

    textposition: treemapAttrs.textposition,
    sort: pieAttrs.sort,
    root: sunburstAttrs.root,

    domain: domainAttrs({name: 'icicle', trace: true, editType: 'calc'}),
};

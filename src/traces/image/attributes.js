'use strict';

var baseAttrs = require('../../plots/attributes');
var zorder = require('../scatter/attributes').zorder;
const { hovertemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var colormodel = require('./constants').colormodel;

var cm = ['rgb', 'rgba', 'rgba256', 'hsl', 'hsla'];
var zminDesc = [];
var zmaxDesc = [];
for (var i = 0; i < cm.length; i++) {
    var cr = colormodel[cm[i]];
    zminDesc.push('For the `' + cm[i] + '` colormodel, it is [' + (cr.zminDflt || cr.min).join(', ') + '].');
    zmaxDesc.push('For the `' + cm[i] + '` colormodel, it is [' + (cr.zmaxDflt || cr.max).join(', ') + '].');
}

module.exports = extendFlat({
    source: {
        valType: 'string',
        editType: 'calc',
        description: [
            'Specifies the data URI of the image to be visualized.',
            'The URI consists of "data:image/[<media subtype\\\\>][;base64\\\\],<data\\\\>"'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'A 2-dimensional array in which each element is an array of 3 or 4 numbers representing a color.'
        ].join(' ')
    },
    colormodel: {
        valType: 'enumerated',
        values: cm,
        editType: 'calc',
        description: [
            'Color model used to map the numerical color components described in `z` into colors.',
            'If `source` is specified, this attribute will be set to `rgba256`',
            'otherwise it defaults to `rgb`.'
        ].join(' ')
    },
    zsmooth: {
        valType: 'enumerated',
        values: ['fast', false],
        dflt: false,
        editType: 'plot',
        description: [
            'Picks a smoothing algorithm used to smooth `z` data.',
            'This only applies for image traces that use the `source` attribute.'
        ].join(' ')
    },
    zmin: {
        valType: 'info_array',
        items: [
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' }
        ],
        editType: 'calc',
        description: [
            'Array defining the lower bound for each color component.',
            'Note that the default value will depend on the colormodel.',
            zminDesc.join(' ')
        ].join(' ')
    },
    zmax: {
        valType: 'info_array',
        items: [
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' },
            { valType: 'number', editType: 'calc' }
        ],
        editType: 'calc',
        description: [
            'Array defining the higher bound for each color component.',
            'Note that the default value will depend on the colormodel.',
            zmaxDesc.join(' ')
        ].join(' ')
    },
    x0: {
        valType: 'any',
        dflt: 0,
        editType: 'calc+clearAxisTypes',
        description: [
            "Set the image's x position. The left edge of the image",
            '(or the right edge if the x axis is reversed or dx is negative)',
            'will be found at xmin=x0-dx/2'
        ].join(' ')
    },
    y0: {
        valType: 'any',
        dflt: 0,
        editType: 'calc+clearAxisTypes',
        description: [
            "Set the image's y position. The top edge of the image",
            '(or the bottom edge if the y axis is NOT reversed or if dy is negative)',
            'will be found at ymin=y0-dy/2. By default when an image trace is',
            'included, the y axis will be reversed so that the image is right-side-up,',
            'but you can disable this by setting yaxis.autorange=true or by providing',
            'an explicit y axis range.'
        ].join(' ')
    },
    dx: {
        valType: 'number',
        dflt: 1,
        editType: 'calc',
        description: "Set the pixel's horizontal size."
    },
    dy: {
        valType: 'number',
        dflt: 1,
        editType: 'calc',
        description: "Set the pixel's vertical size"
    },
    text: {
        valType: 'data_array',
        editType: 'plot',
        description: 'Sets the text elements associated with each z value.'
    },
    hovertext: {
        valType: 'data_array',
        editType: 'plot',
        description: 'Same as `text`.'
    },
    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['x', 'y', 'z', 'color', 'name', 'text'],
        dflt: 'x+y+z+text+name'
    }),
    hovertemplate: hovertemplateAttrs({}, { keys: ['z', 'color', 'colormodel'] }),
    hovertemplatefallback: templatefallbackAttrs(),

    zorder: zorder
});

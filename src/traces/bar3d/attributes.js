'use strict';

var colorScaleAttrs = require('../../components/colorscale/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var meshAttrs = require('../mesh3d/attributes');
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

var attrs = module.exports = overrideAll(extendFlat({
    x: {
        valType: 'data_array',
        description: [
            'Sets the X coordinates of bars on X axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        description: [
            'Sets the Y coordinates of bars on Y axis.'
        ].join(' ')
    },
    base: {
        valType: 'data_array',
        description: [
            'Sets the Z coordinates (i.e. the base) of bars on Z axis.'
        ].join(' ')
    },
    value: {
        valType: 'data_array',
        description: [
            'Sets the height of bars.'
        ].join(' ')
    },

    showbase: {
        valType: 'boolean',
        dflt: false,
        editType: 'calc',
        description: [
            'Determines whether or not the base of a bar is filled.'
        ].join(' ')
    },

    xgap: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.2,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'adjacent location coordinates on X axis.'
        ].join(' ')
    },

    ygap: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.2,
        editType: 'calc',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'adjacent location coordinates on Y axis.'
        ].join(' ')
    },

    marker: {
        color: {
            valType: 'color',
            dflt: '#eee', // TODO: Is this a good default?
            // TODO: support arrayOk
            editType: 'calc',
            description: [
                'Sets the color of the whole mesh if `coloring` is set to *color*.'
            ].join(' ')
        },
        coloring: {
            valType: 'enumerated',
            values: ['color', 'fill', 'heatmap'],
            dflt: 'heatmap',
            editType: 'calc',
            description: [
                'Determines the coloring method showing the bar values.',
                'If *color*, *marker.color* is used for all bars.',
                'If *fill*, coloring is done evenly across a single bar.',
                'If *heatmap*, a heatmap gradient coloring is applied',
                'between each level from bottom to top.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the fill ratio of the `marker` elements. The default fill value',
                'is 0.15 meaning that only 15% of the area of every faces of tetras would be',
                'shaded. Applying a greater `fill` ratio would allow the creation of stronger',
                'elements or could be sued to have entirely closed areas (in case of using 1).'
            ].join(' ')
        },
    },

    text: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        description: [
            'Sets the text elements associated with the vertices.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        description: 'Same as `text`.'
    },
    hovertemplate: hovertemplateAttrs(),
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),
    zhoverformat: axisHoverFormat('z'),
    valuehoverformat: axisHoverFormat('value', 1),

    showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false})
},

colorScaleAttrs('', {
    colorAttr: '`value`',
    showScaleDflt: true,
    editTypeOverride: 'calc'
}), {
    opacity: meshAttrs.opacity,
    lightposition: meshAttrs.lightposition,
    lighting: meshAttrs.lighting,
    flatshading: meshAttrs.flatshading,
    contour: meshAttrs.contour,

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo)
}), 'calc', 'nested');

// required defaults to speed up surface normal calculations
attrs.flatshading.dflt = true; attrs.lighting.facenormalsepsilon.dflt = 0;

attrs.x.editType = attrs.y.editType = attrs.base.editType = attrs.value.editType = 'calc+clearAxisTypes';
attrs.transforms = undefined;

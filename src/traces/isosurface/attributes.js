'use strict';

var colorScaleAttrs = require('../../components/colorscale/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var meshAttrs = require('../mesh3d/attributes');
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

function makeSliceAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            dflt: false,
            description: [
                'Determines whether or not slice planes about the', axLetter,
                'dimension are drawn.'
            ].join(' ')
        },
        locations: {
            valType: 'data_array',
            dflt: [],
            description: [
                'Specifies the location(s) of slices on the axis.',
                'When not specified slices would be created for',
                'all points of the axis', axLetter, 'except start and end.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the fill ratio of the `slices`. The default fill value of the',
                '`slices` is 1 meaning that they are entirely shaded. On the other hand',
                'Applying a `fill` ratio less than one would allow the creation of',
                'openings parallel to the edges.'
            ].join(' ')
        }
    };
}

function makeCapAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            dflt: true,
            description: [
                'Sets the fill ratio of the `slices`. The default fill value of the', axLetter,
                '`slices` is 1 meaning that they are entirely shaded. On the other hand',
                'Applying a `fill` ratio less than one would allow the creation of',
                'openings parallel to the edges.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the fill ratio of the `caps`. The default fill value of the',
                '`caps` is 1 meaning that they are entirely shaded. On the other hand',
                'Applying a `fill` ratio less than one would allow the creation of',
                'openings parallel to the edges.'
            ].join(' ')
        }
    };
}

var attrs = module.exports = overrideAll(extendFlat({
    x: {
        valType: 'data_array',
        description: [
            'Sets the X coordinates of the vertices on X axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        description: [
            'Sets the Y coordinates of the vertices on Y axis.'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        description: [
            'Sets the Z coordinates of the vertices on Z axis.'
        ].join(' ')
    },
    value: {
        valType: 'data_array',
        description: [
            'Sets the 4th dimension (value) of the vertices.'
        ].join(' ')
    },
    isomin: {
        valType: 'number',
        description: [
            'Sets the minimum boundary for iso-surface plot.'
        ].join(' ')
    },
    isomax: {
        valType: 'number',
        description: [
            'Sets the maximum boundary for iso-surface plot.'
        ].join(' ')
    },

    surface: {
        show: {
            valType: 'boolean',
            dflt: true,
            description: [
                'Hides/displays surfaces between minimum and maximum iso-values.'
            ].join(' ')
        },
        count: {
            valType: 'integer',
            dflt: 2,
            min: 1,
            description: [
                'Sets the number of iso-surfaces between minimum and maximum iso-values.',
                'By default this value is 2 meaning that only minimum and maximum surfaces',
                'would be drawn.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the fill ratio of the iso-surface. The default fill value of the',
                'surface is 1 meaning that they are entirely shaded. On the other hand',
                'Applying a `fill` ratio less than one would allow the creation of',
                'openings parallel to the edges.'
            ].join(' ')
        },
        pattern: {
            valType: 'flaglist',
            flags: ['A', 'B', 'C', 'D', 'E'],
            extras: ['all', 'odd', 'even'],
            dflt: 'all',
            description: [
                'Sets the surface pattern of the iso-surface 3-D sections. The default pattern of',
                'the surface is `all` meaning that the rest of surface elements would be shaded.',
                'The check options (either 1 or 2) could be used to draw half of the squares',
                'on the surface. Using various combinations of capital `A`, `B`, `C`, `D` and `E`',
                'may also be used to reduce the number of triangles on the iso-surfaces and',
                'creating other patterns of interest.'
            ].join(' ')
        }
    },

    spaceframe: {
        show: {
            valType: 'boolean',
            dflt: false,
            description: [
                'Displays/hides tetrahedron shapes between minimum and',
                'maximum iso-values. Often useful when either caps or',
                'surfaces are disabled or filled with values less than 1.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 0.15,
            description: [
                'Sets the fill ratio of the `spaceframe` elements. The default fill value',
                'is 0.15 meaning that only 15% of the area of every faces of tetras would be',
                'shaded. Applying a greater `fill` ratio would allow the creation of stronger',
                'elements or could be sued to have entirely closed areas (in case of using 1).'
            ].join(' ')
        }
    },

    slices: {
        x: makeSliceAttr('x'),
        y: makeSliceAttr('y'),
        z: makeSliceAttr('z')
    },

    caps: {
        x: makeCapAttr('x'),
        y: makeCapAttr('y'),
        z: makeCapAttr('z')
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

attrs.x.editType = attrs.y.editType = attrs.z.editType = attrs.value.editType = 'calc+clearAxisTypes';

/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var surfaceAtts = require('../surface/attributes');
var meshAttrs = require('../mesh3d/attributes');
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

function makeSliceAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Determines whether or not slice planes about the', axLetter,
                'dimension are drawn.'
            ].join(' ')
        },
        locations: {
            valType: 'data_array',
            dflt: [],
            role: 'info',
            description: [
                'Specifies the location(s) of slices on the axis [0, n].',
                'When not locations specified slices would be created for',
                'all (0, n) i.e. except start and end caps. Please note that',
                'if a location do not match the point on the', axLetter, 'axis,',
                'the slicing plane would simply be located on the closest',
                'point on the axis (does not interpolate on the axis).'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            role: 'style',
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
            role: 'info',
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
            role: 'style',
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
        role: 'info',
        description: [
            'Sets the X coordinates of the vertices on X axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        description: [
            'Sets the Y coordinates of the vertices on Y axis.'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        description: [
            'Sets the Z coordinates of the vertices on Z axis.'
        ].join(' ')
    },
    value: {
        valType: 'data_array',
        role: 'info',
        description: [
            'Sets the 4th dimension of the vertices. It should be',
            'one dimensional array containing n=X.length*Y.length*Z.length numbers.'
        ].join(' ')
    },
    isomin: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the minimum boundary for iso-surface plot.'
        ].join(' ')
    },
    isomax: {
        valType: 'number',
        role: 'info',
        description: [
            'Sets the maximum boundary for iso-surface plot.'
        ].join(' ')
    },

    surface: {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            description: [
                'Hides/displays surfaces between minimum and maximum iso-values.'
            ].join(' ')
        },
        count: {
            valType: 'integer',
            role: 'info',
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
            role: 'style',
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
            valType: 'enumerated',
            values: ['all', 'checker1', 'checker2', 'A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC'],
            dflt: 'all',
            role: 'style',
            description: [
                'Sets the surface pattern of the iso-surface 3-D sections. The default pattern of',
                'the surface is `all` meaning that the rest of surface elements would be shaded.',
                'The checker options (either 1 or 2) could be used to draw half of the squares',
                'on the surface. Using various combinations of capital `A`, `B`, and `C` may also',
                'be used to reduce the number of triangles on the iso-surfaces and creating other',
                'patterns of interest.'
            ].join(' ')
        }
    },

    spaceframe: {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Displays/hides tetrahedron shapes between minimum and',
                'maximum iso-values. Often useful when either caps or',
                'surfaces are disabled or filled with values less than 1.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            role: 'style',
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
        role: 'info',
        dflt: '',
        arrayOk: true,
        description: [
            'Sets the text elements associated with the vertices.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
},

colorscaleAttrs('', {
    colorAttr: '`value`',
    showScaleDflt: true,
    editTypeOverride: 'calc'
}), {

    colorbar: colorbarAttrs,

    // Flat shaded mode
    flatshading: {
        valType: 'boolean',
        role: 'style',
        dflt: false,
        description: [
            'Determines whether or not normal smoothing is applied to the isosurfaces,',
            'creating isosurfaces with an angular, low-poly look via flat reflections.'
        ].join(' ')
    },

    contour: {
        show: extendFlat({}, surfaceAtts.contours.x.show, {
            description: [
                'Sets whether or not dynamic contours are shown on hover.',
                'Contours are more useful when hovering on caps and slices.'
            ].join(' ')
        }),
        color: surfaceAtts.contours.x.color,
        width: surfaceAtts.contours.x.width
    },

    lightposition: {
        x: extendFlat({}, surfaceAtts.lightposition.x, {dflt: 1e5}),
        y: extendFlat({}, surfaceAtts.lightposition.y, {dflt: 1e5}),
        z: extendFlat({}, surfaceAtts.lightposition.z, {dflt: 0})
    },
    lighting: meshAttrs.lighting,

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo)
}), 'calc', 'nested');

attrs.x.editType = attrs.y.editType = attrs.z.editType = attrs.value.editType = 'calc+clearAxisTypes';
attrs.transforms = undefined;

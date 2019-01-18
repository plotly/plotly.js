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
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

function makeSliceAttr(axLetter) {
    return {
        editType: 'calc',
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            editType: 'calc',
            description: [
                'Determines whether or not slice planes about the', axLetter,
                'dimension are drawn.'
            ].join(' ')
        },
        locations: {
            valType: 'data_array',
            dflt: [],
            role: 'info',
            editType: 'calc',
            description: [
                'Specifies the location(s) of slices on the axis [0, n].',
                'When not locations specified slices would be created for',
                'all (0, n) i.e. except start and end caps.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            dflt: 1,
            editType: 'calc',
            description: 'Sets the fill ratio of the interior slices.'
        }
    };
}

function makeCapAttr(axLetter) {
    return {
        editType: 'calc',
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'calc',
            description: [
                'Determines whether or not cap planes on both sides of the', axLetter,
                'dimension are drawn. Note: it is possible to use `slices` in order to',
                'display a cap only on one side.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            dflt: 1,
            editType: 'calc',
            description: 'Sets the fill ratio of the caps.'
        }
    };
}


module.exports = extendFlat({
    x: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the X coordinates of the vertices on X axis.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the Y coordinates of the vertices on Y axis.'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the Z coordinates of the vertices on Z axis.'
        ].join(' ')
    },
    value: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the 4th dimension of the vertices. It should be',
            'one dimensional array containing n=X.length*Y.length*Z.length numbers.'
        ].join(' ')
    },
    isomin: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the minimum boundary for iso-surface plot.'
        ].join(' ')
    },
    isomax: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the maximum boundary for iso-surface plot.'
        ].join(' ')
    },

    surface: {
        editType: 'calc',
        show: {
            valType: 'boolean',
            role: 'info',
            editType: 'calc',
            dflt: true,
            description: [
                'Hides/displays surfaces between minimum and maximum iso-values.'
            ].join(' ')
        },
        fill: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            dflt: 1,
            editType: 'calc',
            description: 'Sets the fill ratio of the iso-surface.'
        },
        pattern: {
            valType: 'enumerated',
            values: ['all', 'checker1', 'checker2', 'A', 'B', 'C', 'AB', 'AC', 'BC', 'ABC'],
            dflt: 'all',
            role: 'style',
            editType: 'calc',
            description: 'Sets the fill ratio of the iso-surface.'
        }
    },

    brace: {
        editType: 'calc',
        show: {
            valType: 'boolean',
            role: 'info',
            editType: 'calc',
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
            editType: 'calc',
            description: 'Sets the fill ratio of the interior braces (tetrahedron fills).'
        }
    },

    slices: {
        editType: 'calc',
        x: makeSliceAttr('x'),
        y: makeSliceAttr('y'),
        z: makeSliceAttr('z')
    },

    caps: {
        editType: 'calc',
        x: makeCapAttr('x'),
        y: makeCapAttr('y'),
        z: makeCapAttr('z')
    },

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the text elements associated with the vertices.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },

    transforms: undefined
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
        editType: 'calc',
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
        width: surfaceAtts.contours.x.width,
        editType: 'calc'
    },

    lightposition: {
        x: extendFlat({}, surfaceAtts.lightposition.x, {dflt: 1e5}),
        y: extendFlat({}, surfaceAtts.lightposition.y, {dflt: 1e5}),
        z: extendFlat({}, surfaceAtts.lightposition.z, {dflt: 0}),
        editType: 'calc'
    },
    lighting: extendFlat({
        vertexnormalsepsilon: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1,
            dflt: 1e-12, // otherwise finely tessellated things eg. the brain will have no specular light reflection
            editType: 'calc',
            description: 'Epsilon for vertex normals calculation avoids math issues arising from degenerate geometry.'
        },
        facenormalsepsilon: {
            valType: 'number',
            role: 'style',
            min: 0.00,
            max: 1,
            dflt: 1e-6, // even the brain model doesn't appear to need finer than this
            editType: 'calc',
            description: 'Epsilon for face normals calculation avoids math issues arising from degenerate geometry.'
        },
        editType: 'calc'
    }, surfaceAtts.lighting),

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {editType: 'calc'})
});

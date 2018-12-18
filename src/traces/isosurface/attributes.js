/**
* Copyright 2012-2018, Plotly, Inc.
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
    volume: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the 4th dimension of the vertices.'
        ].join(' ')
    },
    isovalue: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        dflt: [0],
        description: [
            'Sets iso surface boundaries.'
        ].join(' ')
    },
    meshalgo: {
        valType: 'string',
        role: 'info',
        dflt: 'MarchingCubes',
        editType: 'calc',
        description: [
            'Sets the isosurface polygonizer algorithm:',
            'including: `MarchingCubes` (i.e. default),',
            '`MarchingTetrahedra` or `SurfaceNets`.'
        ].join(' ')
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

    // Color field
    color: {
        valType: 'color',
        role: 'style',
        editType: 'calc',
        description: 'Sets the color of the whole isosurface'
    },
    vertexcolor: {
        valType: 'data_array',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the color of each vertex',
            'Overrides *color*.'
        ].join(' ')
    },
    facecolor: {
        valType: 'data_array',
        role: 'style',
        editType: 'calc',
        description: [
            'Sets the color of each face',
            'Overrides *color* and *vertexcolor*.'
        ].join(' ')
    },
    transforms: undefined
},

colorscaleAttrs('', {
    colorAttr: '`intensity`',
    showScaleDflt: true,
    editTypeOverride: 'calc'
}), {

    colorbar: colorbarAttrs,

    opacity: surfaceAtts.opacity,

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
                'Sets whether or not dynamic contours are shown on hover'
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

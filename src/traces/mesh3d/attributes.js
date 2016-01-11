/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleAttrs = require('../../components/colorscale/attributes');
var surfaceAtts = require('../surface/attributes');
var extendFlat = require('../../lib/extend').extendFlat;


module.exports = {
    x: {
        valType: 'data_array',
        description: 'Sets the x coordinates of the vertices'
    },
    y: {
        valType: 'data_array',
        description: 'Sets the y coordinates of the vertices'
    },
    z: {
        valType: 'data_array',
        description: 'Sets the z coordinates of the vertices'
    },

    i: {
        valType: 'data_array',
        description: 'Sets the indices of x coordinates of the vertices'
    },
    j: {
        valType: 'data_array',
        description: 'Sets the indices of y coordinates of the vertices'
    },
    k: {
        valType: 'data_array',
        description: 'Sets the indices of z coordinates of the vertices'
    },

    delaunayaxis: {
        valType: 'enumerated',
        role: 'info',
        values: [ 'x', 'y', 'z' ],
        dflt: 'z',
        description: [
            'Sets the Delaunay axis from which the triangulation of the mesh',
            'takes place.',
            'An alternative to setting the `i`, `j`, `k` indices triplets.'
        ].join(' ')
    },

    alphahull: {
        valType: 'number',
        role: 'style',
        dflt: -1,
        description: [
            'Sets the shape of the mesh',
            'If *-1*, Delaunay triangulation is used',
            'If *>0*, the alpha-shape algorithm is used',
            'If *0*,  the convex-hull algorithm is used',
            'An alternative to the `i`, `j`, `k` indices triplets.'
        ].join(' ')
    },

    intensity: {
        valType: 'data_array',
        description: [
            'Sets the vertex intensity values,',
            'used for plotting fields on meshes'
        ].join(' ')
    },

    //Color field
    color: {
        valType: 'color',
        role: 'style',
        description: 'Sets the color of the whole mesh'
    },
    vertexcolor: {
        valType: 'data_array',  // FIXME: this should be a color array
        role: 'style',
        description: [
            'Sets the color of each vertex',
            'Overrides *color*.'
        ].join(' ')
    },
    facecolor: {
        valType: 'data_array',
        role: 'style',
        description: [
            'Sets the color of each face',
            'Overrides *color* and *vertexcolor*.'
        ].join(' ')
    },

    //Opacity
    opacity: extendFlat({}, surfaceAtts.opacity),

    //Flat shaded mode
    flatshading: {
        valType: 'boolean',
        role: 'style',
        dflt: false,
        description: [
            'Determines whether or not normal smoothing is applied to the meshes,',
            'creating meshes with a low-poly look.'
        ].join(' ')
    },

    contour: {
        show: extendFlat({}, surfaceAtts.contours.x.show, {
            description: [
                'Sets whether or not dynamic contours are shown on hover'
            ].join(' ')
        }),
        color: extendFlat({}, surfaceAtts.contours.x.color),
        width: extendFlat({}, surfaceAtts.contours.x.width)
    },

    colorscale: colorscaleAttrs.colorscale,
    reversescale: colorscaleAttrs.reversescale,
    showscale: colorscaleAttrs.showscale,

    lighting: extendFlat({}, surfaceAtts.lighting),

    _nestedModules: {  // nested module coupling
        'colorbar': 'Colorbar'
    }
};

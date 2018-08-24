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
var mesh3dAttrs = require('../mesh3d/attributes');
var baseAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var attrs = {
    x: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the x coordinates of the isosurface'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y coordinates of the isosurface'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the z coordinates of the isosurface'
        ].join(' ')
    },

    value: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: 'Sets the intensity values of the isosurface.'
    },

    isomin: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the minimum iso bound of the isosurface.'
    },

    isomax: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the maximum iso bound of the isosurface.'
    },

    xmin: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the minimum x bound of the isosurface.'
    },

    xmax: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the maximum x bound of the isosurface.'
    },

    ymin: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the minimum y bound of the isosurface.'
    },

    ymax: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the maximum y bound of the isosurface.'
    },

    zmin: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the minimum z bound of the isosurface.'
    },

    zmax: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the maximum z bound of the isosurface.'
    },

    smoothnormals: {
        valType: 'boolean',
        editType: 'calc',
        description: ''
    },

    singlemesh: {
        valType: 'boolean',
        editType: 'calc',
        description: ''
    },

    isocaps: {
        valType: 'boolean',
        editType: 'calc',
        description: ''
    },

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the text elements associated with the isosurface points.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    }
};

extendFlat(attrs, colorscaleAttrs('', {
    colorAttr: 'value',
    showScaleDflt: true,
    editTypeOverride: 'calc'
}), {
    colorbar: colorbarAttrs
});

var fromMesh3d = ['opacity', 'lightposition', 'lighting'];
fromMesh3d.forEach(function(k) {
    attrs[k] = mesh3dAttrs[k];
});

attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {
    editType: 'calc',
    flags: ['x', 'y', 'z', 'value', 'text', 'name'],
    dflt: 'x+y+z+value+text+name'
});

module.exports = attrs;

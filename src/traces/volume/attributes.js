/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../components/colorscale/color_attributes');
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

    u: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the intensity values of the isosurface.'
    },

    imin: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the minimum iso bound of the isosurface.'
    },

    imax: {
        valType: 'number',
        editType: 'calc',
        description: 'Sets the maximum iso bound of the isosurface.'
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

    boundmin: {
        valType: 'data_array',
        editType: 'calc',
        description: ''
    },

    boundmax: {
        valType: 'data_array',
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

extendFlat(attrs, colorAttrs('', 'calc', true), {
    showscale: colorscaleAttrs.showscale,
    colorbar: colorbarAttrs
});
delete attrs.color;

var fromMesh3d = ['opacity', 'lightposition', 'lighting'];

fromMesh3d.forEach(function(k) {
    attrs[k] = mesh3dAttrs[k];
});

attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {
    editType: 'calc',
    flags: ['x', 'y', 'z', 'intensity', 'text', 'name'],
    dflt: 'x+y+z+intensity+text+name'
});

module.exports = attrs;

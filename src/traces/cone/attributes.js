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
            'Sets the x positions of the cones.',
            'When `vx`, `vy`, `vz` are not set,',
            ' these are also the x coordinates of the u/v/w vector field.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y positions of the cones.',
            'When `vx`, `vy`, `vz` are not set,',
            ' these are also the y coordinates of the u/v/w vector field.'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the z positions of the cones.',
            'When `vx`, `vy`, `vz` are not set,',
            ' these are also the z coordinates of the u/v/w vector field.'
        ].join(' ')
    },

    u: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the x components of the vector field.'
    },
    v: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the y components of the vector field.'
    },
    w: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the z components of the vector field.'
    },

    vx: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the x coordinates of the vector field mesh.'
    },
    vy: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the y coordinates of the vector field mesh.'
    },
    vz: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the z coordinates of the vector field mesh.'
    },

    sizemode: {
        valType: 'enumerated',
        values: ['scaled', 'absolute'],
        role: 'info',
        editType: 'calc',
        dflt: 'scaled',
        description: [
            'Sets the mode by which the cones are sized.',
            'If *scaled*, `sizeref` scales such that the reference cone size',
            'for the maximum vector magnitude is 1.',
            'If *absolute*, `sizeref` scales such that the reference cone size',
            'for vector magnitude 1 is one grid unit.'
        ].join(' ')
    },
    sizeref: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        min: 0,
        dflt: 1,
        description: 'Sets the cone size reference value.'
    },

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the text elements associated with the cones.',
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

var fromMesh3d = ['opacity', 'flatshading', 'lightposition', 'lighting'];

fromMesh3d.forEach(function(k) {
    attrs[k] = mesh3dAttrs[k];
});

attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {editType: 'calc'});

module.exports = attrs;

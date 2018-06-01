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
        description: 'Sets the x coordinates of the vector field'
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the y coordinates of the vector field'
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the z coordinates of the vector field'
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

    startx: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the x components of the starting position of the streamtubes',
            ''
        ].join(' ')
    },
    starty: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the y components of the starting position of the streamtubes',
            ''
        ].join(' ')
    },
    startz: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the z components of the starting position of the streamtubes',
            ''
        ].join(' ')
    },

    // TODO
    // maxLength

    sizeref: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        min: 0,
        dflt: 1,
        description: ''
    },

    // TODO maybe just remove completely?
    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
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

var fromMesh3d = ['opacity', 'lightposition', 'lighting'];
fromMesh3d.forEach(function(k) {
    attrs[k] = mesh3dAttrs[k];
});

// TODO maybe add divergence field?
attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {
    editType: 'calc',
    flags: ['x', 'y', 'z', 'u', 'v', 'w', 'norm', 'text', 'name'],
    dflt: 'x+y+z+norm+text+name'
});

module.exports = attrs;

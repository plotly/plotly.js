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
            'Sets the x coordinates of the vector field',
            'If `cones` positions are not provided, this array',
            'corresponds to the x coordinates of the cones displayed as well.'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y coordinates of the vector field',
            'If `cones` positions are not provided, this array',
            'corresponds to the y coordinates of the cones displayed as well.'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the z coordinates of the vector field',
            'If `cones` positions are not provided, this array',
            'corresponds to the z coordinates of the cones displayed as well.'
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

    cones: {
        // potential attributes to add:
        //
        // - meshmode: 'cartesian-product', 'pts', 'grid'
        //
        // under `meshmode: 'grid'`
        // - (x|y|z)grid.start
        // - (x|y|z)grid.end
        // - (x|y|z)grid.size

        x: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the x coordinates of the cones to be displayed.'
        },
        y: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the y coordinates of the cones to be displayed.'
        },
        z: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the z coordinates of the cones to be displayed.'
        },

        editType: 'calc',
        description: [
            'By setting `cones.x`, `cones.y` and `cones.z` to 1D arrays,',
            'plotly creates a mesh using the cartesian product of those 3 arrays.'
        ].join(' ')
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

    anchor: {
        valType: 'enumerated',
        role: 'info',
        editType: 'calc',
        values: ['tip', 'tail', 'cm', 'center'],
        dflt: 'cm',
        description: [
            'Sets the cones\' anchor with respect to their x/y/z positions.',
            'Note that *cm* denote the cone\'s center of mass with corresponds to',
            '1/4 from the tail to tip.'
        ].join(' ')
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

attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {
    editType: 'calc',
    flags: ['x', 'y', 'z', 'u', 'v', 'w', 'norm', 'text', 'name'],
    dflt: 'x+y+z+norm+text'
});

module.exports = attrs;

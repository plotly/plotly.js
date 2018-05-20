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
        editType: 'calc',
        description: ''
    },
    y: {
        valType: 'data_array',
        editType: 'calc'
    },
    z: {
        valType: 'data_array',
        editType: 'calc'
    },

    u: {
        valType: 'data_array',
        editType: 'calc',
        description: [
        ].join(' ')
    },
    v: {
        valType: 'data_array',
        editType: 'calc',
        description: [
        ].join(' ')

    },
    w: {
        valType: 'data_array',
        editType: 'calc',
        description: [
        ].join(' ')

    },

    cx: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
        ].join(' ')
    },
    cy: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
        ].join(' ')
    },
    cz: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
        ].join(' ')
    },

    bounds: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
        ].join(' ')
    },

    colormap: {
        valType: 'string',
        role: 'style',
        editType: 'calc',
        description: [
        ].join(' ')
    },

    maxLength: {
        valType: 'number',
        min: 1,
        dflt: 1000,
        editType: 'calc',
        description: [
        ].join(' ')
    },

    widthScale: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 100,
        editType: 'calc',
        description: [
        ].join(' ')
    },

    // TODO
//     sizemode: {},
//     sizescale: {},

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [

        ].join(' ')
    }
};

extendFlat(attrs, colorAttrs('', 'calc', false), {
    showscale: colorscaleAttrs.showscale,
    colorbar: colorbarAttrs
});

var fromMesh3d = ['opacity', 'flatshading', 'lightposition', 'lighting'];

fromMesh3d.forEach(function(k) {
    attrs[k] = mesh3dAttrs[k];
});

attrs.hoverinfo = extendFlat({}, baseAttrs.hoverinfo, {editType: 'calc'});

module.exports = attrs;

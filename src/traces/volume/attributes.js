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
            'Sets the x coordinates of the volume'
        ].join(' ')
    },
    y: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the y coordinates of the volume'
        ].join(' ')
    },
    z: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the z coordinates of the volume'
        ].join(' ')
    },

    values: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: 'Sets the intensity values of the volume.'
    },

    opacityscale: {
        valType: 'data_array',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the opacity scale of the volume.',
            'Defines which opacity to use for which intensity.',
            'Multiplied with trace.opacity to obtain the final opacity.',
            'Colorscale-like array of [[0, opacity0], [v1, opacity1], ..., [1, opacityN]].'
        ].join(' ')
    },

    vmin: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: 'Sets the minimum intensity bound of the volume. Defaults to the smallest value in values.'
    },

    vmax: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: 'Sets the maximum intensity bound of the volume. Defaults to the largest value in values.'
    },

    cmin: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: 'Sets the colorscale start intensity of the volume. Defaults to the smallest value in values.'
    },

    cmax: {
        valType: 'number',
        role: 'info',
        editType: 'calc',
        description: 'Sets the colorscale end intensity of the volume. Defaults to the largest value in values.'
    },

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the text elements associated with the volume points.',
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

module.exports = attrs;

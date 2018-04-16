/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var extendFlat = require('../../lib').extendFlat;
var scatterAttrs = require('../scatter/attributes');
var dash = require('../../components/drawing/attributes').dash;

var INCREASING_COLOR = '#3D9970';
var DECREASING_COLOR = '#FF4136';

var lineAttrs = scatterAttrs.line;

function directionAttrs(lineColorDefault) {
    return {
        name: {
            valType: 'string',
            role: 'info',
            editType: 'style',
            description: [
                'Sets the segment name.',
                'The segment name appear as the legend item and on hover.'
            ].join(' ')
        },

        showlegend: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'style',
            description: [
                'Determines whether or not an item corresponding to this',
                'segment is shown in the legend.'
            ].join(' ')
        },

        line: {
            color: extendFlat({}, lineAttrs.color, {dflt: lineColorDefault}),
            width: lineAttrs.width,
            dash: dash,
            editType: 'style'
        },
        editType: 'style'
    };
}

module.exports = {

    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the x coordinates.',
            'If absent, linear coordinate will be generated.'
        ].join(' ')
    },

    open: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the open values.'
    },

    high: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the high values.'
    },

    low: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the low values.'
    },

    close: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the close values.'
    },

    line: {
        width: extendFlat({}, lineAttrs.width, {
            description: [
                lineAttrs.width,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.width` and',
                '`decreasing.line.width`.'
            ].join(' ')
        }),
        dash: extendFlat({}, dash, {
            description: [
                dash.description,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.dash` and',
                '`decreasing.line.dash`.'
            ].join(' ')
        }),
        editType: 'style'
    },

    increasing: directionAttrs(INCREASING_COLOR),

    decreasing: directionAttrs(DECREASING_COLOR),

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets hover text elements associated with each sample point.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to',
            'this trace\'s sample points.'
        ].join(' ')
    },

    tickwidth: {
        valType: 'number',
        min: 0,
        max: 0.5,
        dflt: 0.3,
        role: 'style',
        editType: 'calcIfAutorange',
        description: [
            'Sets the width of the open/close tick marks',
            'relative to the *x* minimal interval.'
        ].join(' ')
    }
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var scatterAttrs = require('../scatter/attributes');

var INCREASING_COLOR = '#3D9970';
var DECREASING_COLOR = '#FF4136';

var lineAttrs = scatterAttrs.line;

var directionAttrs = {
    name: {
        valType: 'string',
        role: 'info',
        description: [
            'Sets the segment name.',
            'The segment name appear as the legend item and on hover.'
        ].join(' ')
    },

    showlegend: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Determines whether or not an item corresponding to this',
            'segment is shown in the legend.'
        ].join(' ')
    },

    line: {
        color: Lib.extendFlat({}, lineAttrs.color),
        width: Lib.extendFlat({}, lineAttrs.width),
        dash: Lib.extendFlat({}, lineAttrs.dash),
    }
};

module.exports = {

    x: {
        valType: 'data_array',
        description: [
            'Sets the x coordinates.',
            'If absent, linear coordinate will be generated.'
        ].join(' ')
    },

    open: {
        valType: 'data_array',
        dflt: [],
        description: 'Sets the open values.'
    },

    high: {
        valType: 'data_array',
        dflt: [],
        description: 'Sets the high values.'
    },

    low: {
        valType: 'data_array',
        dflt: [],
        description: 'Sets the low values.'
    },

    close: {
        valType: 'data_array',
        dflt: [],
        description: 'Sets the close values.'
    },

    line: {
        width: Lib.extendFlat({}, lineAttrs.width, {
            description: [
                lineAttrs.width,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.width` and',
                '`decreasing.line.width`.'
            ].join(' ')
        }),
        dash: Lib.extendFlat({}, lineAttrs.dash, {
            description: [
                lineAttrs.dash,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.dash` and',
                '`decreasing.line.dash`.'
            ].join(' ')
        }),
    },

    increasing: Lib.extendDeep({}, directionAttrs, {
        line: { color: { dflt: INCREASING_COLOR } }
    }),

    decreasing: Lib.extendDeep({}, directionAttrs, {
        line: { color: { dflt: DECREASING_COLOR } }
    }),

    text: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
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
        description: [
            'Sets the width of the open/close tick marks',
            'relative to the *x* minimal interval.'
        ].join(' ')
    }
};

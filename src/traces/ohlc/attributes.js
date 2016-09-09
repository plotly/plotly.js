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

var lineAttrs = scatterAttrs.line;

var directionAttrs = {
    visible: {
        valType: 'enumerated',
        values: [true, false, 'legendonly'],
        role: 'info',
        dflt: true,
        description: [

        ].join(' ')
    },

    color: Lib.extendFlat({}, lineAttrs.color),
    width: Lib.extendFlat({}, lineAttrs.width),
    dash: Lib.extendFlat({}, lineAttrs.dash),

    tickwidth: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.1,
        role: 'style',
        description: [
            'Sets the width of the open/close tick marks',
            'relative to the *t* minimal interval.'
        ].join(' ')
    }
};

module.exports = {

    // or should this be 'x'
    //
    //
    // should we add the option for ohlc along y-axis ??
    t: {
        valType: 'data_array',
        description: [
            'Sets the time coordinate.',
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

    // TODO find better colors
    increasing: Lib.extendDeep({}, directionAttrs, {
        color: { dflt: 'green' }
    }),

    decreasing: Lib.extendDeep({}, directionAttrs, {
        color: { dflt: 'red' }
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
            'If an array of string, the items are mapped in order to the',
            'this trace\'s sample points.'
        ].join(' ')
    }
};

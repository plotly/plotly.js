/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterGlAttrs = require('../scattergl/attributes');
var cartesianIdRegex = require('../../plots/cartesian/constants').idRegex;

function makeAxesValObject(axLetter) {
    return {
        valType: 'info_array',
        freeLength: true,
        role: 'info',
        editType: 'calc',
        items: {
            valType: 'enumerated',
            values: [cartesianIdRegex[axLetter].toString(), ''],
            editType: 'plot'
        },
        description: [
            '..'
        ].join(' ')
    };
}

module.exports = {
    dimensions: {
        _isLinkedToArray: 'dimension',

        visible: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'calc',
            description: ''
        },
        label: {
            valType: 'string',
            role: 'info',
            editType: 'calc',
            description: ''
        },
        values: {
            valType: 'data_array',
            role: 'info',
            editType: 'calc+clearAxisTypes',
            description: [
                ''
            ].join(' ')
        },

        // TODO should add an attribute to pin down x only vars and y only vars
        // like https://seaborn.pydata.org/generated/seaborn.pairplot.html
        // x_vars and y_vars

        editType: 'calc+clearAxisTypes',
        description: [
            '..'
        ].join(' ')
    },

    mode: scatterGlAttrs.mode,
    text: scatterGlAttrs.text,

    marker: scatterGlAttrs.marker,

    line: scatterGlAttrs.line,
    connectgaps: scatterGlAttrs.connectgaps,

    xdirection: {
        valType: 'enumerated',
        values: ['right', 'left'],
        dflt: 'right',
        role: 'info',
        editType: 'plot',
        description: ''
    },
    ydirection: {
        valType: 'enumerated',
        values: ['top', 'bottom'],
        dflt: 'bottom',
        role: 'info',
        editType: 'plot',
        description: ''
    },

    xaxes: makeAxesValObject('x'),
    yaxes: makeAxesValObject('y'),

    showdiagonal: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'plot',
        description: ''
    },
    showupperhalf: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'plot',
        description: ''
    },
    showlowerhalf: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'plot',
        description: ''
    },

    selected: scatterGlAttrs.selected,
    unselected: scatterGlAttrs.unselected,

    opacity: scatterGlAttrs.opacity
};

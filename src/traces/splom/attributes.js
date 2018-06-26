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
var templatedArray = require('../../plot_api/plot_template').templatedArray;

function makeAxesValObject(axLetter) {
    return {
        valType: 'info_array',
        freeLength: true,
        role: 'info',
        editType: 'calc',
        items: {
            valType: 'subplotid',
            regex: cartesianIdRegex[axLetter],
            editType: 'plot'
        },
        description: [
            'Sets the list of ' + axLetter + ' axes',
            'corresponding to this splom trace.',
            'By default, a splom will match the first N ' + axLetter + 'axes',
            'where N is the number of input dimensions.'
        ].join(' ')
    };
}

module.exports = {
    dimensions: templatedArray('dimension', {
        visible: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'calc',
            description: [
                'Determines whether or not this dimension is shown on the graph.',
                'Note that even visible false dimension contribute to the',
                'default grid generate by this splom trace.'
            ].join(' ')
        },
        label: {
            valType: 'string',
            role: 'info',
            editType: 'calc',
            description: 'Sets the label corresponding to this splom dimension.'
        },
        values: {
            valType: 'data_array',
            role: 'info',
            editType: 'calc+clearAxisTypes',
            description: 'Sets the dimension values to be plotted.'
        },

        // TODO should add an attribute to pin down x only vars and y only vars
        // like https://seaborn.pydata.org/generated/seaborn.pairplot.html
        // x_vars and y_vars

        // maybe more axis defaulting option e.g. `showgrid: false`

        editType: 'calc+clearAxisTypes'
    }),

    // mode: {}, (only 'markers' for now)

    text: scatterGlAttrs.text,
    marker: scatterGlAttrs.marker,

    xaxes: makeAxesValObject('x'),
    yaxes: makeAxesValObject('y'),

    diagonal: {
        visible: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'calc',
            description: [
                'Determines whether or not subplots on the diagonal are displayed.'
            ].join(' ')
        },

        // type: 'scattergl' | 'histogram' | 'box' | 'violin'
        // ...
        // more options

        editType: 'calc'
    },

    showupperhalf: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'calc',
        description: [
            'Determines whether or not subplots on the upper half',
            'from the diagonal are displayed.'
        ].join(' ')
    },
    showlowerhalf: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'calc',
        description: [
            'Determines whether or not subplots on the lower half',
            'from the diagonal are displayed.'
        ].join(' ')
    },

    selected: {
        marker: scatterGlAttrs.selected.marker,
        editType: 'calc'
    },
    unselected: {
        marker: scatterGlAttrs.unselected.marker,
        editType: 'calc'
    },

    opacity: scatterGlAttrs.opacity
};

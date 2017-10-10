/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var constants = require('./constants');

var fontAttrs = require('../../plots/font_attributes')({
    editType: 'none',
    description: 'Sets the default hover label font used by all traces on the graph.'
});
fontAttrs.family.dflt = constants.HOVERFONT;
fontAttrs.size.dflt = constants.HOVERFONTSIZE;

module.exports = {
    dragmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['zoom', 'pan', 'select', 'lasso', 'orbit', 'turntable'],
        dflt: 'zoom',
        editType: 'modebar',
        description: [
            'Determines the mode of drag interactions.',
            '*select* and *lasso* apply only to scatter traces with',
            'markers or text. *orbit* and *turntable* apply only to',
            '3D scenes.'
        ].join(' ')
    },
    hovermode: {
        valType: 'enumerated',
        role: 'info',
        values: ['x', 'y', 'closest', false],
        editType: 'modebar',
        description: 'Determines the mode of hover interactions.'
    },

    hoverlabel: {
        bgcolor: {
            valType: 'color',
            role: 'style',
            editType: 'none',
            description: [
                'Sets the background color of all hover labels on graph'
            ].join(' ')
        },
        bordercolor: {
            valType: 'color',
            role: 'style',
            editType: 'none',
            description: [
                'Sets the border color of all hover labels on graph.'
            ].join(' ')
        },
        font: fontAttrs,
        namelength: {
            valType: 'integer',
            min: -1,
            dflt: 15,
            role: 'style',
            editType: 'none',
            description: [
                'Sets the default length (in number of characters) of the trace name in',
                'the hover labels for all traces. -1 shows the whole name',
                'regardless of length. 0-3 shows the first 0-3 characters, and',
                'an integer >3 will show the whole name if it is less than that',
                'many characters, but if it is longer, will truncate to',
                '`namelength - 3` characters and add an ellipsis.'
            ].join(' ')
        },
        editType: 'none'
    }
};

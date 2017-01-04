/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    barmode: {
        valType: 'enumerated',
        values: ['stack', 'group', 'overlay', 'relative'],
        dflt: 'group',
        role: 'info',
        description: [
            'Determines how bars at the same location coordinate',
            'are displayed on the graph.',
            'With *stack*, the bars are stacked on top of one another',
            'With *relative*, the bars are stacked on top of one another,',
            'with negative values below the axis, positive values above',
            'With *group*, the bars are plotted next to one another',
            'centered around the shared location.',
            'With *overlay*, the bars are plotted over one another,',
            'you might need to an *opacity* to see multiple bars.'
        ].join(' ')
    },
    barnorm: {
        valType: 'enumerated',
        values: ['', 'fraction', 'percent'],
        dflt: '',
        role: 'info',
        description: [
            'Sets the normalization for bar traces on the graph.',
            'With *fraction*, the value of each bar is divide by the sum of the',
            'values at the location coordinate.',
            'With *percent*, the results form *fraction* are presented in percents.'
        ].join(' ')
    },
    bargap: {
        valType: 'number',
        min: 0,
        max: 1,
        role: 'style',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'adjacent location coordinates.'
        ].join(' ')
    },
    bargroupgap: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        role: 'style',
        description: [
            'Sets the gap (in plot fraction) between bars of',
            'the same location coordinate.'
        ].join(' ')
    }
};

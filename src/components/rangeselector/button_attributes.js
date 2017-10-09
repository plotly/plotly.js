/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    step: {
        valType: 'enumerated',
        role: 'info',
        values: ['month', 'year', 'day', 'hour', 'minute', 'second', 'all'],
        dflt: 'month',
        editType: 'plot',
        description: [
            'The unit of measurement that the `count` value will set the range by.'
        ].join(' ')
    },
    stepmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['backward', 'todate'],
        dflt: 'backward',
        editType: 'plot',
        description: [
            'Sets the range update mode.',
            'If *backward*, the range update shifts the start of range',
            'back *count* times *step* milliseconds.',
            'If *todate*, the range update shifts the start of range',
            'back to the first timestamp from *count* times',
            '*step* milliseconds back.',
            'For example, with `step` set to *year* and `count` set to *1*',
            'the range update shifts the start of the range back to',
            'January 01 of the current year.',
            'Month and year *todate* are currently available only',
            'for the built-in (Gregorian) calendar.'
        ].join(' ')
    },
    count: {
        valType: 'number',
        role: 'info',
        min: 0,
        dflt: 1,
        editType: 'plot',
        description: [
            'Sets the number of steps to take to update the range.',
            'Use with `step` to specify the update interval.'
        ].join(' ')
    },
    label: {
        valType: 'string',
        role: 'info',
        editType: 'plot',
        description: 'Sets the text label to appear on the button.'
    },
    editType: 'plot'
};

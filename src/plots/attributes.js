/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fxAttrs = require('../components/fx/attributes');

module.exports = {
    type: {
        valType: 'enumerated',
        role: 'info',
        values: [],     // listed dynamically
        dflt: 'scatter',
        editType: 'calc+clearAxisTypes',
        _noTemplating: true // we handle this at a higher level
    },
    visible: {
        valType: 'enumerated',
        values: [true, false, 'legendonly'],
        role: 'info',
        dflt: true,
        editType: 'plot',
        description: [
            'Determines whether or not this trace is visible.',
            'If *legendonly*, the trace is not drawn,',
            'but can appear as a legend item',
            '(provided that the legend itself is visible).'
        ].join(' ')
    },
    showlegend: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        editType: 'style',
        description: [
            'Determines whether or not an item corresponding to this',
            'trace is shown in the legend.'
        ].join(' ')
    },
    legendgroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
        editType: 'style',
        description: [
            'Sets the legend group for this trace.',
            'Traces part of the same legend group hide/show at the same time',
            'when toggling legend items.'
        ].join(' ')
    },
    opacity: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'style',
        description: 'Sets the opacity of the trace.'
    },
    name: {
        valType: 'string',
        role: 'info',
        editType: 'style',
        description: [
            'Sets the trace name.',
            'The trace name appear as the legend item and on hover.'
        ].join(' ')
    },
    uid: {
        valType: 'string',
        role: 'info',
        editType: 'plot'
    },
    ids: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Assigns id labels to each datum.',
            'These ids for object constancy of data points during animation.',
            'Should be an array of strings, not numbers or any other type.'
        ].join(' ')
    },
    customdata: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Assigns extra data each datum.',
            'This may be useful when listening to hover, click and selection events.',
            'Note that, *scatter* traces also appends customdata items in the markers',
            'DOM elements'
        ].join(' ')
    },

    // N.B. these cannot be 'data_array' as they do not have the same length as
    // other data arrays and arrayOk attributes in general
    //
    // Maybe add another valType:
    // https://github.com/plotly/plotly.js/issues/1894
    selectedpoints: {
        valType: 'any',
        role: 'info',
        editType: 'calc',
        description: [
            'Array containing integer indices of selected points.',
            'Has an effect only for traces that support selections.',
            'Note that an empty array means an empty selection where the `unselected`',
            'are turned on for all points, whereas, any other non-array values means no',
            'selection all where the `selected` and `unselected` styles have no effect.'
        ].join(' ')
    },

    hoverinfo: {
        valType: 'flaglist',
        role: 'info',
        flags: ['x', 'y', 'z', 'text', 'name'],
        extras: ['all', 'none', 'skip'],
        arrayOk: true,
        dflt: 'all',
        editType: 'none',
        description: [
            'Determines which trace information appear on hover.',
            'If `none` or `skip` are set, no information is displayed upon hovering.',
            'But, if `none` is set, click and hover events are still fired.'
        ].join(' ')
    },
    hoverlabel: fxAttrs.hoverlabel,
    stream: {
        token: {
            valType: 'string',
            noBlank: true,
            strict: true,
            role: 'info',
            editType: 'calc',
            description: [
                'The stream id number links a data trace on a plot with a stream.',
                'See https://plot.ly/settings for more details.'
            ].join(' ')
        },
        maxpoints: {
            valType: 'number',
            min: 0,
            max: 10000,
            dflt: 500,
            role: 'info',
            editType: 'calc',
            description: [
                'Sets the maximum number of points to keep on the plots from an',
                'incoming stream.',
                'If `maxpoints` is set to *50*, only the newest 50 points will',
                'be displayed on the plot.'
            ].join(' ')
        },
        editType: 'calc'
    },
    transforms: {
        _isLinkedToArray: 'transform',
        editType: 'calc',
        description: [
            'An array of operations that manipulate the trace data,',
            'for example filtering or sorting the data arrays.'
        ].join(' ')
    }
};

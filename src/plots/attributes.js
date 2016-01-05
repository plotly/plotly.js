/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


module.exports = {
    type: {
        valType: 'enumerated',
        role: 'info',
        values: [],     // listed dynamically
        dflt: 'scatter'
    },
    visible: {
        valType: 'enumerated',
        values: [true, false, 'legendonly'],
        role: 'info',
        dflt: true,
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
        description: [
            'Determines whether or not an item corresponding to this',
            'trace is shown in the legend.'
        ].join(' ')
    },
    legendgroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
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
        description: 'Sets the opacity of the trace.'
    },
    name: {
        valType: 'string',
        role: 'info',
        description: [
            'Sets the trace name.',
            'The trace name appear as the legend item and on hover.'
        ].join(' ')
    },
    uid: {
        valType: 'string',
        role: 'info',
        dflt: ''
    },
    hoverinfo: {
        valType: 'flaglist',
        role: 'info',
        flags: ['x', 'y', 'z', 'text', 'name', 'xtext'],
        extras: ['all', 'none'],
        dflt: 'all',
        description: 'Determines which trace information appear on hover.'
    },
    stream: {
        token: {
            valType: 'string',
            noBlank: true,
            strict: true,
            role: 'info',
            description: [
                'The stream id number links a data trace on a plot with a stream.',
                'See https://plot.ly/settings for more details.'
            ].join(' ')
        },
        maxpoints: {
            valType: 'number',
            min: 0,
            role: 'info',
            description: [
                'Sets the maximum number of points to keep on the plots from an',
                'incoming stream.',
                'If `maxpoints` is set to *50*, only the newest 50 points will',
                'be displayed on the plot.'
            ].join(' ')
        }
    }
};

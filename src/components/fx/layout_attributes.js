/**
* Copyright 2012-2018, Plotly, Inc.
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
    clickmode: {
        valType: 'flaglist',
        role: 'info',
        flags: ['event', 'select'],
        dflt: 'event',
        editType: 'plot',
        description: [
            'Determines the mode of single click interactions.',
            '*event* is the default value and only emits *plotly_selected*',
            'events with no event data (kept for compatibility reasons) in dragmodes',
            '*lasso* and *select*. The *select* flag enables selecting single',
            'data points by click. Its behavior is closely tied to *hovermode*. The',
            'data point that is being currently hovered on, will be the data point',
            'to be selected. So setting *hovermode* to *closest* may be the best fit',
            'for most applications. Click-to-select also supports persistent selections,',
            'meaning that pressing Shift while clicking, adds to / subtracts from an',
            'existing selection.',
            'When *clickmode* is being set to *select+event*, click-to-select is enabled',
            'and select events are sent with corresponding eventData attached.'
        ].join(' ')
    },
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
    hoverdistance: {
        valType: 'integer',
        min: -1,
        dflt: 20,
        role: 'info',
        editType: 'none',
        description: [
            'Sets the default distance (in pixels) to look for data',
            'to add hover labels (-1 means no cutoff, 0 means no looking for data).',
            'This is only a real distance for hovering on point-like objects,',
            'like scatter points. For area-like objects (bars, scatter fills, etc)',
            'hovering is on inside the area and off outside, but these objects',
            'will not supersede hover on point-like objects in case of conflict.'
        ].join(' ')
    },
    spikedistance: {
        valType: 'integer',
        min: -1,
        dflt: 20,
        role: 'info',
        editType: 'none',
        description: [
            'Sets the default distance (in pixels) to look for data to draw',
            'spikelines to (-1 means no cutoff, 0 means no looking for data).',
            'As with hoverdistance, distance does not apply to area-like objects.',
            'In addition, some objects can be hovered on but will not generate',
            'spikelines, such as scatter fills.'
        ].join(' ')
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
    },
    selectdirection: {
        valType: 'enumerated',
        role: 'info',
        values: ['h', 'v', 'd', 'any'],
        dflt: 'any',
        description: [
            'When "dragmode" is set to "select", this limits the selection of the drag to',
            'horizontal, vertical or diagonal. "h" only allows horizontal selection,',
            '"v" only vertical, "d" only diagonal and "any" sets no limit.'
        ].join(' '),
        editType: 'none'
    }
};

/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../components/color/attributes');
var fontAttrs = require('../../plots/font_attributes');
var plotAttrs = require('../../plots/attributes');
var domainAttrs = require('../../plots/domain').attributes;

var extendFlat = require('../../lib/extend').extendFlat;

var textFontAttrs = fontAttrs({
    editType: 'calc',
    colorEditType: 'style',
    description: 'Sets the font used for `textinfo`.'
});

module.exports = {
    labels: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the sector labels.',
            'If `labels` entries are duplicated, we sum associated `values`',
            'or simply count occurrences if `values` is not provided.',
            'For other array attributes (including color) we use the first',
            'non-empty entry among all occurrences of the label.'
        ].join(' ')
    },
    // equivalent of x0 and dx, if label is missing
    label0: {
        valType: 'number',
        role: 'info',
        dflt: 0,
        editType: 'calc',
        description: [
            'Alternate to `labels`.',
            'Builds a numeric set of labels.',
            'Use with `dlabel`',
            'where `label0` is the starting label and `dlabel` the step.'
        ].join(' ')
    },
    dlabel: {
        valType: 'number',
        role: 'info',
        dflt: 1,
        editType: 'calc',
        description: 'Sets the label step. See `label0` for more info.'
    },

    values: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the values of the sectors of this pie chart.',
            'If omitted, we count occurrences of each label.'
        ].join(' ')
    },

    marker: {
        colors: {
            valType: 'data_array',  // TODO 'color_array' ?
            editType: 'calc',
            description: [
                'Sets the color of each sector of this pie chart.',
                'If not specified, the default trace color set is used',
                'to pick the sector colors.'
            ].join(' ')
        },

        line: {
            color: {
                valType: 'color',
                role: 'style',
                dflt: colorAttrs.defaultLine,
                arrayOk: true,
                editType: 'style',
                description: [
                    'Sets the color of the line enclosing each sector.'
                ].join(' ')
            },
            width: {
                valType: 'number',
                role: 'style',
                min: 0,
                dflt: 0,
                arrayOk: true,
                editType: 'style',
                description: [
                    'Sets the width (in px) of the line enclosing each sector.'
                ].join(' ')
            },
            editType: 'calc'
        },
        editType: 'calc'
    },

    text: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets text elements associated with each sector.',
            'If trace `textinfo` contains a *text* flag, these elements will seen',
            'on the chart.',
            'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
            'these elements will be seen in the hover labels.'
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        role: 'info',
        dflt: '',
        arrayOk: true,
        editType: 'style',
        description: [
            'Sets hover text elements associated with each sector.',
            'If a single string, the same string appears for',
            'all data points.',
            'If an array of string, the items are mapped in order of',
            'this trace\'s sectors.',
            'To be seen, trace `hoverinfo` must contain a *text* flag.'
        ].join(' ')
    },

// 'see eg:'
// 'https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif',
// '(this example involves a map too - may someday be a whole trace type',
// 'of its own. but the point is the size of the whole pie is important.)'
    scalegroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
        editType: 'calc',
        description: [
            'If there are multiple pies that should be sized according to',
            'their totals, link them by providing a non-empty group id here',
            'shared by every trace in the same group.'
        ].join(' ')
    },

    // labels (legend is handled by plots.attributes.showlegend and layout.hiddenlabels)
    textinfo: {
        valType: 'flaglist',
        role: 'info',
        flags: ['label', 'text', 'value', 'percent'],
        extras: ['none'],
        editType: 'calc',
        description: [
            'Determines which trace information appear on the graph.'
        ].join(' ')
    },
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['label', 'text', 'value', 'percent', 'name']
    }),
    textposition: {
        valType: 'enumerated',
        role: 'info',
        values: ['inside', 'outside', 'auto', 'none'],
        dflt: 'auto',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Specifies the location of the `textinfo`.'
        ].join(' ')
    },
    // TODO make those arrayOk?
    textfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo`.'
    }),
    insidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo` lying inside the pie.'
    }),
    outsidetextfont: extendFlat({}, textFontAttrs, {
        description: 'Sets the font used for `textinfo` lying outside the pie.'
    }),

    // position and shape
    domain: domainAttrs({name: 'pie', trace: true, editType: 'calc'}),

    hole: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 0,
        editType: 'calc',
        description: [
            'Sets the fraction of the radius to cut out of the pie.',
            'Use this to make a donut chart.'
        ].join(' ')
    },

    // ordering and direction
    sort: {
        valType: 'boolean',
        role: 'style',
        dflt: true,
        editType: 'calc',
        description: [
            'Determines whether or not the sectors are reordered',
            'from largest to smallest.'
        ].join(' ')
    },
    direction: {
        /**
         * there are two common conventions, both of which place the first
         * (largest, if sorted) slice with its left edge at 12 o'clock but
         * succeeding slices follow either cw or ccw from there.
         *
         * see http://visage.co/data-visualization-101-pie-charts/
         */
        valType: 'enumerated',
        values: ['clockwise', 'counterclockwise'],
        role: 'style',
        dflt: 'counterclockwise',
        editType: 'calc',
        description: [
            'Specifies the direction at which succeeding sectors follow',
            'one another.'
        ].join(' ')
    },
    rotation: {
        valType: 'number',
        role: 'style',
        min: -360,
        max: 360,
        dflt: 0,
        editType: 'calc',
        description: [
            'Instead of the first slice starting at 12 o\'clock,',
            'rotate to some other angle.'
        ].join(' ')
    },

    pull: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 0,
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets the fraction of larger radius to pull the sectors',
            'out from the center. This can be a constant',
            'to pull all slices apart from each other equally',
            'or an array to highlight one or more slices.'
        ].join(' ')
    }
};

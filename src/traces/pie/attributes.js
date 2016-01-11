/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../components/color/attributes');
var fontAttrs = require('../../plots/font_attributes');
var plotAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;


module.exports = {
    labels: {
        valType: 'data_array',
        description: 'Sets the sector labels.'
    },
    // equivalent of x0 and dx, if label is missing
    label0: {
        valType: 'number',
        role: 'info',
        dflt: 0,
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
        description: 'Sets the label step. See `label0` for more info.'
    },

    values: {
        valType: 'data_array',
        description: 'Sets the values of the sectors of this pie chart.'
    },

    marker: {
        colors: {
            valType: 'data_array',  // TODO 'color_array' ?
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
                description: [
                    'Sets the width (in px) of the line enclosing each sector.'
                ].join(' ')
            }
        }
    },

    text: {
        valType: 'data_array',
        description: 'Sets text elements associated with each sector.'
    },

// 'see eg:'
// 'https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif',
// '(this example involves a map too - may someday be a whole trace type',
// 'of its own. but the point is the size of the whole pie is important.)'
    scalegroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
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
        description: [
            'Specifies the location of the `textinfo`.'
        ].join(' ')
    },
    // TODO make those arrayOk?
    textfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo`.'
    }),
    insidetextfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo` lying inside the pie.'
    }),
    outsidetextfont: extendFlat({}, fontAttrs, {
        description: 'Sets the font used for `textinfo` lying outside the pie.'
    }),

    // position and shape
    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the horizontal domain of this pie trace',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the vertical domain of this pie trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },
    // 3D attributes commented out until I finish them in a later PR
    // tilt: {
    //     // degrees to tilt the pie back from straight on
    //     valType: 'number',
    //     min: 0,
    //     max: 90,
    //     dflt: 0
    // },
    // tiltaxis: {
    //     // degrees away from straight up to tilt the pie
    //     // only has an effect if tilt is nonzero
    //     valType: 'number',
    //     min: -360,
    //     max: 360,
    //     dflt: 0
    // },
    // depth: {
    //     // "3D" size, as a fraction of radius
    //     // only has an effect if tilt is nonzero
    //     valType: 'number',
    //     min: 0,
    //     max: 10,
    //     dflt: 0.5
    // },
    // shading: {
    //     // how much darker to make the sides than the top,
    //     // with a 3D effect. We could of course get all
    //     // fancy with lighting effects, but maybe this is
    //     // sufficient.
    //     valType: 'number',
    //     min: 0,
    //     max: 1,
    //     dflt: 0.2
    // },
    hole: {
        valType: 'number',
        role: 'style',
        min: 0,
        max: 1,
        dflt: 0,
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
        description: [
            'Determines whether or not the sectors of reordered',
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
        description: [
            'Sets the fraction of larger radius to pull the sectors',
            'out from the center. This can be a constant',
            'to pull all slices apart from each other equally',
            'or an array to highlight one or more slices.'
        ].join(' ')
    }
};

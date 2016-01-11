/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var axesAttrs = require('../cartesian/layout_attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var domainAttr = extendFlat({}, axesAttrs.domain, {
    description: [
        'Polar chart subplots are not supported yet.',
        'This key has currently no effect.'
    ].join(' ')
});

function mergeAttrs(axisName, nonCommonAttrs) {
    var commonAttrs = {
        showline: {
            valType: 'boolean',
            role: 'style',
            description: [
                'Determines whether or not the line bounding this',
                axisName, 'axis',
                'will be shown on the figure.'
            ].join(' ')
        },
        showticklabels: {
            valType: 'boolean',
            role: 'style',
            description: [
                'Determines whether or not the',
                axisName, 'axis ticks',
                'will feature tick labels.'
            ].join(' ')
        },
        tickorientation: {
            valType: 'enumerated',
            values: ['horizontal', 'vertical'],
            role: 'style',
            description: [
                'Sets the orientation (from the paper perspective)',
                'of the', axisName, 'axis tick labels.'
            ].join(' ')
        },
        ticklen: {
            valType: 'number',
            min: 0,
            role: 'style',
            description: [
                'Sets the length of the tick lines on this', axisName, 'axis.'
            ].join(' ')
        },
        tickcolor: {
            valType: 'color',
            role: 'style',
            description: [
                'Sets the color of the tick lines on this', axisName, 'axis.'
            ].join(' ')
        },
        ticksuffix: {
            valType: 'string',
            role: 'style',
            description: [
                'Sets the length of the tick lines on this', axisName, 'axis.'
            ].join(' ')
        },
        endpadding: {
            valType: 'number',
            role: 'style'
        },
        visible: {
            valType: 'boolean',
            role: 'info',
            description: [
                'Determines whether or not this axis will be visible.'
            ].join(' ')
        }
    };

    return extendFlat({}, nonCommonAttrs, commonAttrs);
}

module.exports = {
    radialaxis: mergeAttrs('radial', {
        range: {
            valType: 'info_array',
            role: 'info',
            items: [
                { valType: 'number' },
                { valType: 'number' }
            ],
            description: [
                'Defines the start and end point of this radial axis.'
            ].join(' ')
        },
        domain: domainAttr,
        orientation: {
            valType: 'number',
            role: 'style',
            description: [
                'Sets the orientation (an angle with respect to the origin)',
                'of the radial axis.'
            ].join(' ')
        }
    }),

    angularaxis: mergeAttrs('angular', {
        range: {
            valType: 'info_array',
            role: 'info',
            items: [
                { valType: 'number', dflt: 0 },
                { valType: 'number', dflt: 360 }
            ],
            description: [
                'Defines the start and end point of this angular axis.'
            ].join(' ')
        },
        domain: domainAttr
    }),

    // attributes that appear at layout root
    layout: {
        direction: {
            valType: 'enumerated',
            values: ['clockwise', 'counterclockwise'],
            role: 'info',
            description: [
                'For polar plots only.',
                'Sets the direction corresponding to positive angles.'
            ].join(' ')
        },
        orientation: {
            valType: 'angle',
            role: 'info',
            description: [
                'For polar plots only.',
                'Rotates the entire polar by the given angle.'
            ].join(' ')
        }
    }
};

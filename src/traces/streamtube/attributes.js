/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var colorAttributes = require('../../components/colorscale/color_attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker;

function makeProjectionAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Sets whether or not projections are shown along the',
                axLetter, 'axis.'
            ].join(' ')
        },
        opacity: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            dflt: 1,
            description: 'Sets the projection color.'
        },
        scale: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 10,
            dflt: 2 / 3,
            description: [
                'Sets the scale factor determining the size of the',
                'projection marker points.'
            ].join(' ')
        }
    };
}

module.exports = {
    x: {
        valType: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        valType: 'data_array',
        description: 'Sets the y coordinates.'
    },
    z: {
        valType: 'data_array',
        description: 'Sets the z coordinates.'
    },
    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (x,y,z) triplet.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (x,y,z) coordinates.'
        ].join(' ')
    }),
    mode: extendFlat({}, scatterAttrs.mode,  // shouldn't this be on-par with 2D?
        {dflt: 'lines+markers'}),
    projection: {
        x: makeProjectionAttr('x'),
        y: makeProjectionAttr('y'),
        z: makeProjectionAttr('z')
    },
    connectgaps: scatterAttrs.connectgaps,
    line: extendFlat({}, {
        width: scatterLineAttrs.width,
        connectionradius: extendFlat({}, scatterMarkerAttrs.size, {
            dflt: 1,
            description: 'Sets the radius of the line connection. Either a number, or an array with as many elements as the number of points.'
        }),
        showscale: {
            valType: 'boolean',
            role: 'info',
            dflt: false,
            description: [
                'Has an effect only if `line.color` is set to a numerical array.',
                'Determines whether or not a colorbar is displayed.'
            ].join(' ')
        }
    },
        colorAttributes('line')
    ),
    marker: extendFlat({}, {
        size: extendFlat({}, scatterMarkerAttrs.size, {dflt: 8}),
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        opacity: extendFlat({}, scatterMarkerAttrs.opacity, {
            arrayOk: false,
            description: [
                'Sets the marker opacity.',
                'Note that the marker opacity for scatter3d traces',
                'must be a scalar value for performance reasons.',
                'To set a blending opacity value',
                '(i.e. which is not transparent), set *marker.color*',
                'to an rgba color and use its alpha channel.'
            ].join(' ')
        }),
        showscale: scatterMarkerAttrs.showscale
    },
        colorAttributes('marker')
    ),
    textposition: extendFlat({}, scatterAttrs.textposition, {dflt: 'top center'}),
    textfont: scatterAttrs.textfont,
    _nestedModules: {
        'marker.colorbar': 'Colorbar'
    }
};

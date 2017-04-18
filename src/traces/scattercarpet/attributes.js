/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var plotAttrs = require('../../plots/attributes');
var colorAttributes = require('../../components/colorscale/color_attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var scatterMarkerAttrs = scatterAttrs.marker,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

module.exports = {
    carpet: {
        valType: 'string',
        role: 'info',
        description: [
            'An identifier for this carpet, so that `scattercarpet` and',
            '`scattercontour` traces can specify a carpet plot on which',
            'they lie'
        ].join(' ')
    },
    a: {
        valType: 'data_array',
        description: [
            'Sets the quantity of component `a` in each data point.',
            'If `a`, `b`, and `c` are all provided, they need not be',
            'normalized, only the relative values matter. If only two',
            'arrays are provided they must be normalized to match',
            '`ternary<i>.sum`.'
        ].join(' ')
    },
    b: {
        valType: 'data_array',
        description: [
            'Sets the quantity of component `a` in each data point.',
            'If `a`, `b`, and `c` are all provided, they need not be',
            'normalized, only the relative values matter. If only two',
            'arrays are provided they must be normalized to match',
            '`ternary<i>.sum`.'
        ].join(' ')
    },
    sum: {
        valType: 'number',
        role: 'info',
        dflt: 0,
        min: 0,
        description: [
            'The number each triplet should sum to,',
            'if only two of `a`, `b`, and `c` are provided.',
            'This overrides `ternary<i>.sum` to normalize this specific',
            'trace, but does not affect the values displayed on the axes.',
            '0 (or missing) means to use ternary<i>.sum'
        ].join(' ')
    },
    mode: extendFlat({}, scatterAttrs.mode, {dflt: 'markers'}),
    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (a,b,c) point.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of strings, the items are mapped in order to the',
            'the data points in (a,b,c).'
        ].join(' ')
    }),
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash,
        shape: extendFlat({}, scatterLineAttrs.shape,
            {values: ['linear', 'spline']}),
        smoothing: scatterLineAttrs.smoothing
    },
    connectgaps: scatterAttrs.connectgaps,
    fill: extendFlat({}, scatterAttrs.fill, {
        values: ['none', 'toself', 'tonext'],
        description: [
            'Sets the area to fill with a solid color.',
            'Use with `fillcolor` if not *none*.',
            'scatterternary has a subset of the options available to scatter.',
            '*toself* connects the endpoints of the trace (or each segment',
            'of the trace if it has gaps) into a closed shape.',
            '*tonext* fills the space between two traces if one completely',
            'encloses the other (eg consecutive contour lines), and behaves like',
            '*toself* if there is no trace before it. *tonext* should not be',
            'used if one trace does not enclose the other.'
        ].join(' ')
    }),
    fillcolor: scatterAttrs.fillcolor,
    marker: extendFlat({}, {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        maxdisplayed: scatterMarkerAttrs.maxdisplayed,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        line: extendFlat({},
            {width: scatterMarkerLineAttrs.width},
            colorAttributes('marker'.line)
        )
    }, colorAttributes('marker'), {
        showscale: scatterMarkerAttrs.showscale,
        colorbar: colorbarAttrs
    }),

    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['a', 'b', 'c', 'text', 'name']
    }),
    hoveron: scatterAttrs.hoveron,
};

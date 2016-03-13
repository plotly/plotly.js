/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var plotAttrs = require('../../plots/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var scatterMarkerAttrs = scatterAttrs.marker,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;


module.exports = {
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
            '`ternary(i).sum`.'
        ].join(' ')
    },
    c: {
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
        dflt: 1,
        min: 0,
        description: [
            'The number each triplet should sum to,',
            'if only two of `a`, `b`, and `c` are provided.',
            'This overrides `ternary<i>.sum` to normalize this specific',
            'trace, but does not affect the values displayed on the axes.'
        ].join(' ')
    },
    mode: extendFlat({}, scatterAttrs.mode, {dflt: 'markers'}),
    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (a,b,c) point.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (a,b,c) coordinates.'
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
        values: ['none', 'tozeroa', 'tozerob', 'tozeroc',
            'tonexta', 'tonextb', 'tonextc']
    }),
    fillcolor: scatterAttrs.fillcolor,
    marker: {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        color: scatterMarkerAttrs.color,
        colorscale: scatterMarkerAttrs.colorscale,
        cauto: scatterMarkerAttrs.cauto,
        cmax: scatterMarkerAttrs.cmax,
        cmin: scatterMarkerAttrs.cmin,
        autocolorscale: scatterMarkerAttrs.autocolorscale,
        reversescale: scatterMarkerAttrs.reversescale,
        showscale: scatterMarkerAttrs.showscale,
        line: {
            color: scatterMarkerLineAttrs.color,
            width: scatterMarkerLineAttrs.width,
            colorscale: scatterMarkerLineAttrs.colorscale,
            cauto: scatterMarkerLineAttrs.cauto,
            cmax: scatterMarkerLineAttrs.cmax,
            cmin: scatterMarkerLineAttrs.cmin,
            autocolorscale: scatterMarkerLineAttrs.autocolorscale,
            reversescale: scatterMarkerLineAttrs.reversescale
        }
    },
    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['a', 'b', 'c', 'text', 'name']
    }),
    _nestedModules: {
        'marker.colorbar': 'Colorbar'
    }
};

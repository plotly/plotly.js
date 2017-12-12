/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var scatterAttrs = require('../scatter/attributes');
var plotAttrs = require('../../plots/attributes');
var lineAttrs = scatterAttrs.line;

module.exports = {
    // TODO is this correct?
    // `dflt: 'markers' matches the scattergeo, scattermapbox types,
    // scatter, scattergl, scatterternary, scattercarpet use a special 'line' vs 'markers+lines' logic
    // while scatter3d has a hard 'markers+lines' default
    mode: extendFlat({}, scatterAttrs.mode, {
        dflt: 'markers'
    }),

    r: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the radial coordinates'
    },

    theta: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the angular coordinates'
    },

    thetaunit: {
        valType: 'enumerated',
        values: ['radians', 'degrees', 'gradians'],
        dflt: 'degrees',
        role: 'info',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the unit of input *theta* values.'
    },

    // TODO not sure r0,  dr, theta0, dtheta
    // would make sense here?

    text: scatterAttrs.text,
    hovertext: scatterAttrs.hovertext,

    line: {
        color: lineAttrs.color,
        width: lineAttrs.width,
        dash: lineAttrs.dash,
        shape: extendFlat({}, lineAttrs.shape, {
            values: ['linear', 'spline']
        }),
        smoothing: lineAttrs.smoothing,
        editType: 'calc'
    },
    connectgaps: scatterAttrs.connectgaps,

    marker: scatterAttrs.marker,
    cliponaxis: scatterAttrs.cliponaxis,

    textposition: scatterAttrs.textposition,
    textfont: scatterAttrs.textfont,

    fill: extendFlat({}, scatterAttrs.fill, {
        values: ['none', 'toself', 'tonext'],
        description: [
            'Sets the area to fill with a solid color.',
            'Use with `fillcolor` if not *none*.',
            'scatterpolar has a subset of the options available to scatter.',
            '*toself* connects the endpoints of the trace (or each segment',
            'of the trace if it has gaps) into a closed shape.',
            '*tonext* fills the space between two traces if one completely',
            'encloses the other (eg consecutive contour lines), and behaves like',
            '*toself* if there is no trace before it. *tonext* should not be',
            'used if one trace does not enclose the other.'
        ].join(' ')
    }),
    fillcolor: scatterAttrs.fillcolor,

    // TODO (probably not for first push)
    // https://stackoverflow.com/a/26597487/4068492
    // error_x (error_r, error_theta)
    // error_y

    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['r', 'theta', 'text', 'name']
    }),
    hoveron: scatterAttrs.hoveron,

    selected: scatterAttrs.selected,
    unselected: scatterAttrs.unselected
};

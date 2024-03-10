'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var extendFlat = require('../../lib/extend').extendFlat;
var makeFillcolorAttr = require('../scatter/fillcolor_attribute');
var scatterAttrs = require('../scatter/attributes');
var baseAttrs = require('../../plots/attributes');
var lineAttrs = scatterAttrs.line;

module.exports = {
    mode: scatterAttrs.mode,

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

    r0: {
        valType: 'any',
        dflt: 0,
        editType: 'calc+clearAxisTypes',
        description: [
            'Alternate to `r`.',
            'Builds a linear space of r coordinates.',
            'Use with `dr`',
            'where `r0` is the starting coordinate and `dr` the step.'
        ].join(' ')
    },
    dr: {
        valType: 'number',
        dflt: 1,
        editType: 'calc',
        description: 'Sets the r coordinate step.'
    },

    theta0: {
        valType: 'any',
        dflt: 0,
        editType: 'calc+clearAxisTypes',
        description: [
            'Alternate to `theta`.',
            'Builds a linear space of theta coordinates.',
            'Use with `dtheta`',
            'where `theta0` is the starting coordinate and `dtheta` the step.'
        ].join(' ')
    },
    dtheta: {
        valType: 'number',
        editType: 'calc',
        description: [
            'Sets the theta coordinate step.',
            'By default, the `dtheta` step equals the subplot\'s period divided',
            'by the length of the `r` coordinates.'
        ].join(' ')
    },

    thetaunit: {
        valType: 'enumerated',
        values: ['radians', 'degrees', 'gradians'],
        dflt: 'degrees',
        editType: 'calc+clearAxisTypes',
        description: [
            'Sets the unit of input *theta* values.',
            'Has an effect only when on *linear* angular axes.'
        ].join(' ')
    },

    text: scatterAttrs.text,
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['r', 'theta', 'text']
    }),
    hovertext: scatterAttrs.hovertext,

    line: {
        color: lineAttrs.color,
        width: lineAttrs.width,
        dash: lineAttrs.dash,
        backoff: lineAttrs.backoff,
        shape: extendFlat({}, lineAttrs.shape, {
            values: ['linear', 'spline']
        }),
        smoothing: lineAttrs.smoothing,
        editType: 'calc'
    },
    connectgaps: scatterAttrs.connectgaps,

    marker: scatterAttrs.marker,
    cliponaxis: extendFlat({}, scatterAttrs.cliponaxis, {dflt: false}),

    textposition: scatterAttrs.textposition,
    textfont: scatterAttrs.textfont,

    fill: extendFlat({}, scatterAttrs.fill, {
        values: ['none', 'toself', 'tonext'],
        dflt: 'none',
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
    fillcolor: makeFillcolorAttr(),

    // TODO error bars
    // https://stackoverflow.com/a/26597487/4068492
    // error_x (error_r, error_theta)
    // error_y

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['r', 'theta', 'text', 'name']
    }),
    hoveron: scatterAttrs.hoveron,
    hovertemplate: hovertemplateAttrs(),

    selected: scatterAttrs.selected,
    unselected: scatterAttrs.unselected
};

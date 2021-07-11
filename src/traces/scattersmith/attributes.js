'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var extendFlat = require('../../lib/extend').extendFlat;
var scatterAttrs = require('../scatter/attributes');
var baseAttrs = require('../../plots/attributes');
var lineAttrs = scatterAttrs.line;

module.exports = {
    mode: scatterAttrs.mode,

    re: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the real coordinates'
    },

    im: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the imaginary coordinates'
    },

    text: scatterAttrs.text,
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: ['re', 'im', 'text']
    }),
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
    fillcolor: scatterAttrs.fillcolor,

    // TODO error bars
    // https://stackoverflow.com/a/26597487/4068492
    // error_x (error_r, error_theta)
    // error_y

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['re', 'im', 'text', 'name']
    }),
    hoveron: scatterAttrs.hoveron,
    hovertemplate: hovertemplateAttrs(),

    selected: scatterAttrs.selected,
    unselected: scatterAttrs.unselected
};

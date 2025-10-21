'use strict';

const colorScaleAttrs = require('../../components/colorscale/attributes');
const { extendFlat } = require('../../lib/extend');
const baseAttrs = require('../../plots/attributes');
const { axisHoverFormat } = require('../../plots/cartesian/axis_format_attributes');
const fontAttrs = require('../../plots/font_attributes');
const { hovertemplateAttrs, templatefallbackAttrs, texttemplateAttrs } = require('../../plots/template_attributes');
const scatterAttrs = require('../scatter/attributes');

module.exports = extendFlat(
    {
        z: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the z data.'
        },
        x: extendFlat({}, scatterAttrs.x, { impliedEdits: { xtype: 'array' } }),
        x0: extendFlat({}, scatterAttrs.x0, { impliedEdits: { xtype: 'scaled' } }),
        dx: extendFlat({}, scatterAttrs.dx, { impliedEdits: { xtype: 'scaled' } }),
        y: extendFlat({}, scatterAttrs.y, { impliedEdits: { ytype: 'array' } }),
        y0: extendFlat({}, scatterAttrs.y0, { impliedEdits: { ytype: 'scaled' } }),
        dy: extendFlat({}, scatterAttrs.dy, { impliedEdits: { ytype: 'scaled' } }),

        xperiod: extendFlat({}, scatterAttrs.xperiod, { impliedEdits: { xtype: 'scaled' } }),
        yperiod: extendFlat({}, scatterAttrs.yperiod, { impliedEdits: { ytype: 'scaled' } }),
        xperiod0: extendFlat({}, scatterAttrs.xperiod0, { impliedEdits: { xtype: 'scaled' } }),
        yperiod0: extendFlat({}, scatterAttrs.yperiod0, { impliedEdits: { ytype: 'scaled' } }),
        xperiodalignment: extendFlat({}, scatterAttrs.xperiodalignment, { impliedEdits: { xtype: 'scaled' } }),
        yperiodalignment: extendFlat({}, scatterAttrs.yperiodalignment, { impliedEdits: { ytype: 'scaled' } }),

        text: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Sets the text elements associated with each z value.'
        },
        hovertext: {
            valType: 'data_array',
            editType: 'calc',
            description: 'Same as `text`.'
        },
        transpose: {
            valType: 'boolean',
            dflt: false,
            editType: 'calc',
            description: 'Transposes the z data.'
        },
        xtype: {
            valType: 'enumerated',
            values: ['array', 'scaled'],
            editType: 'calc+clearAxisTypes',
            description: [
                "If *array*, the heatmap's x coordinates are given by *x*",
                '(the default behavior when `x` is provided).',
                "If *scaled*, the heatmap's x coordinates are given by *x0* and *dx*",
                '(the default behavior when `x` is not provided).'
            ].join(' ')
        },
        ytype: {
            valType: 'enumerated',
            values: ['array', 'scaled'],
            editType: 'calc+clearAxisTypes',
            description: [
                "If *array*, the heatmap's y coordinates are given by *y*",
                '(the default behavior when `y` is provided)',
                "If *scaled*, the heatmap's y coordinates are given by *y0* and *dy*",
                '(the default behavior when `y` is not provided)'
            ].join(' ')
        },
        zsmooth: {
            valType: 'enumerated',
            values: ['fast', 'best', false],
            dflt: false,
            editType: 'calc',
            description: ['Picks a smoothing algorithm use to smooth `z` data.'].join(' ')
        },
        hoverongaps: {
            valType: 'boolean',
            dflt: true,
            editType: 'none',
            description: [
                'Determines whether or not gaps',
                '(i.e. {nan} or missing values)',
                'in the `z` data have hover labels associated with them.'
            ].join(' ')
        },
        connectgaps: {
            valType: 'boolean',
            editType: 'calc',
            description: [
                'Determines whether or not gaps',
                '(i.e. {nan} or missing values)',
                'in the `z` data are filled in.',
                'It is defaulted to true if `z` is a',
                'one dimensional array and `zsmooth` is not false;',
                'otherwise it is defaulted to false.'
            ].join(' ')
        },
        xgap: {
            valType: 'number',
            dflt: 0,
            min: 0,
            editType: 'plot',
            description: 'Sets the horizontal gap (in pixels) between bricks.'
        },
        ygap: {
            valType: 'number',
            dflt: 0,
            min: 0,
            editType: 'plot',
            description: 'Sets the vertical gap (in pixels) between bricks.'
        },
        xhoverformat: axisHoverFormat('x'),
        yhoverformat: axisHoverFormat('y'),
        zhoverformat: axisHoverFormat('z', 1),

        hovertemplate: hovertemplateAttrs(),
        hovertemplatefallback: templatefallbackAttrs(),
        texttemplate: texttemplateAttrs({ arrayOk: false, editType: 'plot' }, { keys: ['x', 'y', 'z', 'text'] }),
        texttemplatefallback: templatefallbackAttrs({ editType: 'plot' }),
        textfont: fontAttrs({
            editType: 'plot',
            autoSize: true,
            autoColor: true,
            colorEditType: 'style',
            description: 'Sets the text font.'
        }),

        showlegend: extendFlat({}, baseAttrs.showlegend, { dflt: false }),
        zorder: scatterAttrs.zorder
    },
    colorScaleAttrs('', { cLetter: 'z', autoColorDflt: false })
);

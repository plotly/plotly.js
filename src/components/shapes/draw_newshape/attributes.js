'use strict';

var overrideAll = require('../../../plot_api/edit_types').overrideAll;
var basePlotAttributes = require('../../../plots/attributes');
var fontAttrs = require('../../../plots/font_attributes');
var dash = require('../../drawing/attributes').dash;
var extendFlat = require('../../../lib/extend').extendFlat;
const { shapeTexttemplateAttrs, templatefallbackAttrs } = require('../../../plots/template_attributes');
var shapeLabelTexttemplateVars = require('../label_texttemplate');

module.exports = overrideAll(
    {
        newshape: {
            visible: extendFlat({}, basePlotAttributes.visible, {
                description: [
                    'Determines whether or not new shape is visible.',
                    'If *legendonly*, the shape is not drawn,',
                    'but can appear as a legend item',
                    '(provided that the legend itself is visible).'
                ].join(' ')
            }),

            showlegend: {
                valType: 'boolean',
                dflt: false,
                description: ['Determines whether or not new', 'shape is shown in the legend.'].join(' ')
            },

            legend: extendFlat({}, basePlotAttributes.legend, {
                description: [
                    'Sets the reference to a legend to show new shape in.',
                    'References to these legends are *legend*, *legend2*, *legend3*, etc.',
                    'Settings for these legends are set in the layout, under',
                    '`layout.legend`, `layout.legend2`, etc.'
                ].join(' ')
            }),

            legendgroup: extendFlat({}, basePlotAttributes.legendgroup, {
                description: [
                    'Sets the legend group for new shape.',
                    'Traces and shapes part of the same legend group hide/show at the same time',
                    'when toggling legend items.'
                ].join(' ')
            }),

            legendgrouptitle: {
                text: extendFlat({}, basePlotAttributes.legendgrouptitle.text, {}),
                font: fontAttrs({
                    description: ["Sets this legend group's title font."].join(' ')
                })
            },

            legendrank: extendFlat({}, basePlotAttributes.legendrank, {
                description: [
                    'Sets the legend rank for new shape.',
                    'Items and groups with smaller ranks are presented on top/left side while',
                    'with *reversed* `legend.traceorder` they are on bottom/right side.',
                    'The default legendrank is 1000,',
                    'so that you can use ranks less than 1000 to place certain items before all unranked items,',
                    'and ranks greater than 1000 to go after all unranked items.'
                ].join(' ')
            }),

            legendwidth: extendFlat({}, basePlotAttributes.legendwidth, {
                description: 'Sets the width (in px or fraction) of the legend for new shape.'
            }),

            line: {
                color: {
                    valType: 'color',
                    description: [
                        'Sets the line color.',
                        'By default uses either dark grey or white',
                        'to increase contrast with background color.'
                    ].join(' ')
                },
                width: {
                    valType: 'number',
                    min: 0,
                    dflt: 4,
                    description: 'Sets the line width (in px).'
                },
                dash: extendFlat({}, dash, {
                    dflt: 'solid'
                })
            },
            fillcolor: {
                valType: 'color',
                dflt: 'rgba(0,0,0,0)',
                description: [
                    "Sets the color filling new shapes' interior.",
                    'Please note that if using a fillcolor with alpha greater than half,',
                    'drag inside the active shape starts moving the shape underneath,',
                    'otherwise a new shape could be started over.'
                ].join(' ')
            },
            fillrule: {
                valType: 'enumerated',
                values: ['evenodd', 'nonzero'],
                dflt: 'evenodd',
                description: [
                    "Determines the path's interior.",
                    'For more info please visit https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule'
                ].join(' ')
            },
            opacity: {
                valType: 'number',
                min: 0,
                max: 1,
                dflt: 1,
                description: 'Sets the opacity of new shapes.'
            },
            layer: {
                valType: 'enumerated',
                values: ['below', 'above', 'between'],
                dflt: 'above',
                description: [
                    'Specifies whether new shapes are drawn below gridlines (*below*),',
                    'between gridlines and traces (*between*) or above traces (*above*).'
                ].join(' ')
            },
            drawdirection: {
                valType: 'enumerated',
                values: ['ortho', 'horizontal', 'vertical', 'diagonal'],
                dflt: 'diagonal',
                description: [
                    'When `dragmode` is set to *drawrect*, *drawline* or *drawcircle*',
                    'this limits the drag to be horizontal, vertical or diagonal.',
                    'Using *diagonal* there is no limit e.g. in drawing lines in any direction.',
                    '*ortho* limits the draw to be either horizontal or vertical.',
                    '*horizontal* allows horizontal extend.',
                    '*vertical* allows vertical extend.'
                ].join(' ')
            },

            name: extendFlat({}, basePlotAttributes.name, {
                description: ['Sets new shape name.', 'The name appears as the legend item.'].join(' ')
            }),

            label: {
                text: {
                    valType: 'string',
                    dflt: '',
                    description: [
                        'Sets the text to display with the new shape.',
                        'It is also used for legend item if `name` is not provided.'
                    ].join(' ')
                },
                texttemplate: shapeTexttemplateAttrs(
                    { newshape: true },
                    { keys: Object.keys(shapeLabelTexttemplateVars) }
                ),
                texttemplatefallback: templatefallbackAttrs({ editType: 'arraydraw' }),
                font: fontAttrs({
                    description: 'Sets the new shape label text font.'
                }),
                textposition: {
                    valType: 'enumerated',
                    values: [
                        'top left',
                        'top center',
                        'top right',
                        'middle left',
                        'middle center',
                        'middle right',
                        'bottom left',
                        'bottom center',
                        'bottom right',
                        'start',
                        'middle',
                        'end'
                    ],
                    description: [
                        'Sets the position of the label text relative to the new shape.',
                        'Supported values for rectangles, circles and paths are',
                        '*top left*, *top center*, *top right*, *middle left*,',
                        '*middle center*, *middle right*, *bottom left*, *bottom center*,',
                        'and *bottom right*.',
                        'Supported values for lines are *start*, *middle*, and *end*.',
                        'Default: *middle center* for rectangles, circles, and paths; *middle* for lines.'
                    ].join(' ')
                },
                textangle: {
                    valType: 'angle',
                    dflt: 'auto',
                    description: [
                        'Sets the angle at which the label text is drawn',
                        'with respect to the horizontal. For lines, angle *auto*',
                        'is the same angle as the line. For all other shapes,',
                        'angle *auto* is horizontal.'
                    ].join(' ')
                },
                xanchor: {
                    valType: 'enumerated',
                    values: ['auto', 'left', 'center', 'right'],
                    dflt: 'auto',
                    description: [
                        "Sets the label's horizontal position anchor",
                        'This anchor binds the specified `textposition` to the *left*, *center*',
                        'or *right* of the label text.',
                        'For example, if `textposition` is set to *top right* and',
                        '`xanchor` to *right* then the right-most portion of the',
                        'label text lines up with the right-most edge of the',
                        'new shape.'
                    ].join(' ')
                },
                yanchor: {
                    valType: 'enumerated',
                    values: ['top', 'middle', 'bottom'],
                    description: [
                        "Sets the label's vertical position anchor",
                        'This anchor binds the specified `textposition` to the *top*, *middle*',
                        'or *bottom* of the label text.',
                        'For example, if `textposition` is set to *top right* and',
                        '`yanchor` to *top* then the top-most portion of the',
                        'label text lines up with the top-most edge of the',
                        'new shape.'
                    ].join(' ')
                },
                padding: {
                    valType: 'number',
                    dflt: 3,
                    min: 0,
                    description: 'Sets padding (in px) between edge of label and edge of new shape.'
                }
            }
        },

        activeshape: {
            fillcolor: {
                valType: 'color',
                dflt: 'rgb(255,0,255)',
                description: "Sets the color filling the active shape' interior."
            },
            opacity: {
                valType: 'number',
                min: 0,
                max: 1,
                dflt: 0.5,
                description: 'Sets the opacity of the active shape.'
            }
        }
    },
    'none',
    'from-root'
);

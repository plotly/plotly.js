'use strict';

var annAttrs = require('../annotations/attributes');
var fontAttrs = require('../../plots/font_attributes');
var scatterLineAttrs = require('../../traces/scatter/attributes').line;
var dash = require('../drawing/attributes').dash;
var extendFlat = require('../../lib/extend').extendFlat;
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var axisPlaceableObjs = require('../../constants/axis_placeable_objects');
var basePlotAttributes = require('../../plots/attributes');
const { shapeTexttemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var shapeLabelTexttemplateVars = require('./label_texttemplate');

module.exports = templatedArray('shape', {
    visible: extendFlat({}, basePlotAttributes.visible, {
        editType: 'calc+arraydraw',
        description: [
            'Determines whether or not this shape is visible.',
            'If *legendonly*, the shape is not drawn,',
            'but can appear as a legend item',
            '(provided that the legend itself is visible).'
        ].join(' ')
    }),

    showlegend: {
        valType: 'boolean',
        dflt: false,
        editType: 'calc+arraydraw',
        description: ['Determines whether or not this', 'shape is shown in the legend.'].join(' ')
    },

    legend: extendFlat({}, basePlotAttributes.legend, {
        editType: 'calc+arraydraw',
        description: [
            'Sets the reference to a legend to show this shape in.',
            'References to these legends are *legend*, *legend2*, *legend3*, etc.',
            'Settings for these legends are set in the layout, under',
            '`layout.legend`, `layout.legend2`, etc.'
        ].join(' ')
    }),

    legendgroup: extendFlat({}, basePlotAttributes.legendgroup, {
        editType: 'calc+arraydraw',
        description: [
            'Sets the legend group for this shape.',
            'Traces and shapes part of the same legend group hide/show at the same time',
            'when toggling legend items.'
        ].join(' ')
    }),

    legendgrouptitle: {
        text: extendFlat({}, basePlotAttributes.legendgrouptitle.text, {
            editType: 'calc+arraydraw'
        }),
        font: fontAttrs({
            editType: 'calc+arraydraw',
            description: ["Sets this legend group's title font."].join(' ')
        }),
        editType: 'calc+arraydraw'
    },

    legendrank: extendFlat({}, basePlotAttributes.legendrank, {
        editType: 'calc+arraydraw',
        description: [
            'Sets the legend rank for this shape.',
            'Items and groups with smaller ranks are presented on top/left side while',
            'with *reversed* `legend.traceorder` they are on bottom/right side.',
            'The default legendrank is 1000,',
            'so that you can use ranks less than 1000 to place certain items before all unranked items,',
            'and ranks greater than 1000 to go after all unranked items.',
            'When having unranked or equal rank items shapes would be displayed after traces',
            'i.e. according to their order in data and layout.'
        ].join(' ')
    }),

    legendwidth: extendFlat({}, basePlotAttributes.legendwidth, {
        editType: 'calc+arraydraw',
        description: 'Sets the width (in px or fraction) of the legend for this shape.'
    }),

    type: {
        valType: 'enumerated',
        values: ['circle', 'rect', 'path', 'line'],
        editType: 'calc+arraydraw',
        description: [
            'Specifies the shape type to be drawn.',

            'If *line*, a line is drawn from (`x0`,`y0`) to (`x1`,`y1`)',
            "with respect to the axes' sizing mode.",

            'If *circle*, a circle is drawn from',
            '((`x0`+`x1`)/2, (`y0`+`y1`)/2))',
            'with radius',
            '(|(`x0`+`x1`)/2 - `x0`|, |(`y0`+`y1`)/2 -`y0`)|)',
            "with respect to the axes' sizing mode.",

            'If *rect*, a rectangle is drawn linking',
            '(`x0`,`y0`), (`x1`,`y0`), (`x1`,`y1`), (`x0`,`y1`), (`x0`,`y0`)',
            "with respect to the axes' sizing mode.",

            'If *path*, draw a custom SVG path using `path`.',
            "with respect to the axes' sizing mode."
        ].join(' ')
    },

    layer: {
        valType: 'enumerated',
        values: ['below', 'above', 'between'],
        dflt: 'above',
        editType: 'arraydraw',
        description: [
            'Specifies whether shapes are drawn below gridlines (*below*),',
            'between gridlines and traces (*between*) or above traces (*above*).'
        ].join(' ')
    },

    xref: extendFlat({}, annAttrs.xref, {
        description: [
            "Sets the shape's x coordinate axis.",
            axisPlaceableObjs.axisRefDescription('x', 'left', 'right')
        ].join(' ')
    }),
    xsizemode: {
        valType: 'enumerated',
        values: ['scaled', 'pixel'],
        dflt: 'scaled',
        editType: 'calc+arraydraw',
        description: [
            "Sets the shapes's sizing mode along the x axis.",
            'If set to *scaled*, `x0`, `x1` and x coordinates within `path` refer to',
            "data values on the x axis or a fraction of the plot area's width",
            '(`xref` set to *paper*).',
            'If set to *pixel*, `xanchor` specifies the x position in terms',
            'of data or plot fraction but `x0`, `x1` and x coordinates within `path`',
            'are pixels relative to `xanchor`. This way, the shape can have',
            'a fixed width while maintaining a position relative to data or',
            'plot fraction.'
        ].join(' ')
    },
    xanchor: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            'Only relevant in conjunction with `xsizemode` set to *pixel*.',
            'Specifies the anchor point on the x axis to which `x0`, `x1`',
            'and x coordinates within `path` are relative to.',
            'E.g. useful to attach a pixel sized shape to a certain data value.',
            'No effect when `xsizemode` not set to *pixel*.'
        ].join(' ')
    },
    x0: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: ["Sets the shape's starting x position.", 'See `type` and `xsizemode` for more info.'].join(' ')
    },
    x1: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: ["Sets the shape's end x position.", 'See `type` and `xsizemode` for more info.'].join(' ')
    },
    x0shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Shifts `x0` away from the center of the category when `xref` is a *category* or',
            '*multicategory* axis. -0.5 corresponds to the start of the category and 0.5',
            'corresponds to the end of the category.'
        ].join(' ')
    },
    x1shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Shifts `x1` away from the center of the category when `xref` is a *category* or',
            '*multicategory* axis. -0.5 corresponds to the start of the category and 0.5',
            'corresponds to the end of the category.'
        ].join(' ')
    },
    yref: extendFlat({}, annAttrs.yref, {
        description: [
            "Sets the shape's y coordinate axis.",
            axisPlaceableObjs.axisRefDescription('y', 'bottom', 'top')
        ].join(' ')
    }),
    ysizemode: {
        valType: 'enumerated',
        values: ['scaled', 'pixel'],
        dflt: 'scaled',
        editType: 'calc+arraydraw',
        description: [
            "Sets the shapes's sizing mode along the y axis.",
            'If set to *scaled*, `y0`, `y1` and y coordinates within `path` refer to',
            "data values on the y axis or a fraction of the plot area's height",
            '(`yref` set to *paper*).',
            'If set to *pixel*, `yanchor` specifies the y position in terms',
            'of data or plot fraction but `y0`, `y1` and y coordinates within `path`',
            'are pixels relative to `yanchor`. This way, the shape can have',
            'a fixed height while maintaining a position relative to data or',
            'plot fraction.'
        ].join(' ')
    },
    yanchor: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: [
            'Only relevant in conjunction with `ysizemode` set to *pixel*.',
            'Specifies the anchor point on the y axis to which `y0`, `y1`',
            'and y coordinates within `path` are relative to.',
            'E.g. useful to attach a pixel sized shape to a certain data value.',
            'No effect when `ysizemode` not set to *pixel*.'
        ].join(' ')
    },
    y0: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: ["Sets the shape's starting y position.", 'See `type` and `ysizemode` for more info.'].join(' ')
    },
    y1: {
        valType: 'any',
        editType: 'calc+arraydraw',
        description: ["Sets the shape's end y position.", 'See `type` and `ysizemode` for more info.'].join(' ')
    },
    y0shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Shifts `y0` away from the center of the category when `yref` is a *category* or',
            '*multicategory* axis. -0.5 corresponds to the start of the category and 0.5',
            'corresponds to the end of the category.'
        ].join(' ')
    },
    y1shift: {
        valType: 'number',
        dflt: 0,
        min: -1,
        max: 1,
        editType: 'calc',
        description: [
            'Shifts `y1` away from the center of the category when `yref` is a *category* or',
            '*multicategory* axis. -0.5 corresponds to the start of the category and 0.5',
            'corresponds to the end of the category.'
        ].join(' ')
    },
    path: {
        valType: 'string',
        editType: 'calc+arraydraw',
        description: [
            'For `type` *path* - a valid SVG path with the pixel values',
            'replaced by data values in `xsizemode`/`ysizemode` being *scaled*',
            'and taken unmodified as pixels relative to `xanchor` and `yanchor`',
            'in case of *pixel* size mode.',
            'There are a few restrictions / quirks',
            'only absolute instructions, not relative. So the allowed segments',
            'are: M, L, H, V, Q, C, T, S, and Z',
            'arcs (A) are not allowed because radius rx and ry are relative.',

            'In the future we could consider supporting relative commands,',
            'but we would have to decide on how to handle date and log axes.',
            'Note that even as is, Q and C Bezier paths that are smooth on',
            'linear axes may not be smooth on log, and vice versa.',
            'no chained "polybezier" commands - specify the segment type for',
            'each one.',

            'On category axes, values are numbers scaled to the serial numbers',
            'of categories because using the categories themselves there would',
            'be no way to describe fractional positions',
            'On data axes: because space and T are both normal components of path',
            "strings, we can't use either to separate date from time parts.",
            "Therefore we'll use underscore for this purpose:",
            '2015-02-21_13:45:56.789'
        ].join(' ')
    },

    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'arraydraw',
        description: 'Sets the opacity of the shape.'
    },
    line: {
        color: extendFlat({}, scatterLineAttrs.color, { editType: 'arraydraw' }),
        width: extendFlat({}, scatterLineAttrs.width, { editType: 'calc+arraydraw' }),
        dash: extendFlat({}, dash, { editType: 'arraydraw' }),
        editType: 'calc+arraydraw'
    },
    fillcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        editType: 'arraydraw',
        description: ["Sets the color filling the shape's interior. Only applies to closed shapes."].join(' ')
    },
    fillrule: {
        valType: 'enumerated',
        values: ['evenodd', 'nonzero'],
        dflt: 'evenodd',
        editType: 'arraydraw',
        description: [
            'Determines which regions of complex paths constitute the interior.',
            'For more info please visit https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-rule'
        ].join(' ')
    },
    editable: {
        valType: 'boolean',
        dflt: false,
        editType: 'calc+arraydraw',
        description: [
            'Determines whether the shape could be activated for edit or not.',
            'Has no effect when the older editable shapes mode is enabled via',
            '`config.editable` or `config.edits.shapePosition`.'
        ].join(' ')
    },
    label: {
        text: {
            valType: 'string',
            dflt: '',
            editType: 'arraydraw',
            description: [
                'Sets the text to display with shape.',
                'It is also used for legend item if `name` is not provided.'
            ].join(' ')
        },
        texttemplate: shapeTexttemplateAttrs({}, { keys: Object.keys(shapeLabelTexttemplateVars) }),
        texttemplatefallback: templatefallbackAttrs({ editType: 'arraydraw' }),
        font: fontAttrs({
            editType: 'calc+arraydraw',
            colorEditType: 'arraydraw',
            description: 'Sets the shape label text font.'
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
            editType: 'arraydraw',
            description: [
                'Sets the position of the label text relative to the shape.',
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
            editType: 'calc+arraydraw',
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
            editType: 'calc+arraydraw',
            description: [
                "Sets the label's horizontal position anchor",
                'This anchor binds the specified `textposition` to the *left*, *center*',
                'or *right* of the label text.',
                'For example, if `textposition` is set to *top right* and',
                '`xanchor` to *right* then the right-most portion of the',
                'label text lines up with the right-most edge of the',
                'shape.'
            ].join(' ')
        },
        yanchor: {
            valType: 'enumerated',
            values: ['top', 'middle', 'bottom'],
            editType: 'calc+arraydraw',
            description: [
                "Sets the label's vertical position anchor",
                'This anchor binds the specified `textposition` to the *top*, *middle*',
                'or *bottom* of the label text.',
                'For example, if `textposition` is set to *top right* and',
                '`yanchor` to *top* then the top-most portion of the',
                'label text lines up with the top-most edge of the',
                'shape.'
            ].join(' ')
        },
        padding: {
            valType: 'number',
            dflt: 3,
            min: 0,
            editType: 'arraydraw',
            description: 'Sets padding (in px) between edge of label and edge of shape.'
        },
        editType: 'arraydraw'
    },
    editType: 'arraydraw'
});

'use strict';

var baseAttrs = require('../../plots/attributes');
var fontAttrs = require('../../plots/font_attributes');
var makeFillcolorAttr = require('../scatter/fillcolor_attribute');
var scatterAttrs = require('../scatter/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
var colorScaleAttrs = require('../../components/colorscale/attributes');

var sortObjectKeys = require('../../lib/sort_object_keys');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var DASHES = require('./constants').DASHES;

var scatterLineAttrs = scatterAttrs.line;
var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var attrs = (module.exports = overrideAll(
    {
        x: scatterAttrs.x,
        x0: scatterAttrs.x0,
        dx: scatterAttrs.dx,
        y: scatterAttrs.y,
        y0: scatterAttrs.y0,
        dy: scatterAttrs.dy,

        xperiod: scatterAttrs.xperiod,
        yperiod: scatterAttrs.yperiod,
        xperiod0: scatterAttrs.xperiod0,
        yperiod0: scatterAttrs.yperiod0,
        xperiodalignment: scatterAttrs.xperiodalignment,
        yperiodalignment: scatterAttrs.yperiodalignment,
        xhoverformat: axisHoverFormat('x'),
        yhoverformat: axisHoverFormat('y'),

        text: scatterAttrs.text,
        hovertext: scatterAttrs.hovertext,

        textposition: scatterAttrs.textposition,
        textfont: fontAttrs({
            noFontShadow: true,
            noFontLineposition: true,
            noFontTextcase: true,
            editType: 'calc',
            colorEditType: 'style',
            arrayOk: true,
            noNumericWeightValues: true,
            variantValues: ['normal', 'small-caps'],
            description: 'Sets the text font.'
        }),

        mode: {
            valType: 'flaglist',
            flags: ['lines', 'markers', 'text'],
            extras: ['none'],
            description: ['Determines the drawing mode for this scatter trace.'].join(' ')
        },
        line: {
            color: scatterLineAttrs.color,
            width: scatterLineAttrs.width,
            shape: {
                valType: 'enumerated',
                values: ['linear', 'hv', 'vh', 'hvh', 'vhv'],
                dflt: 'linear',
                editType: 'plot',
                description: ['Determines the line shape.', 'The values correspond to step-wise line shapes.'].join(' ')
            },
            dash: {
                valType: 'enumerated',
                values: sortObjectKeys(DASHES),
                dflt: 'solid',
                description: 'Sets the style of the lines.'
            }
        },
        marker: extendFlat({}, colorScaleAttrs('marker'), {
            symbol: scatterMarkerAttrs.symbol,
            angle: scatterMarkerAttrs.angle,
            size: scatterMarkerAttrs.size,
            sizeref: scatterMarkerAttrs.sizeref,
            sizemin: scatterMarkerAttrs.sizemin,
            sizemode: scatterMarkerAttrs.sizemode,
            opacity: scatterMarkerAttrs.opacity,
            colorbar: scatterMarkerAttrs.colorbar,
            line: extendFlat({}, colorScaleAttrs('marker.line'), {
                width: scatterMarkerLineAttrs.width
            })
        }),
        connectgaps: scatterAttrs.connectgaps,
        fill: extendFlat({}, scatterAttrs.fill, { dflt: 'none' }),
        fillcolor: makeFillcolorAttr(),

        // no hoveron

        selected: {
            marker: scatterAttrs.selected.marker,
            textfont: scatterAttrs.selected.textfont
        },
        unselected: {
            marker: scatterAttrs.unselected.marker,
            textfont: scatterAttrs.unselected.textfont
        },

        opacity: baseAttrs.opacity
    },
    'calc',
    'nested'
));

attrs.x.editType = attrs.y.editType = attrs.x0.editType = attrs.y0.editType = 'calc+clearAxisTypes';
attrs.hovertemplate = scatterAttrs.hovertemplate;
attrs.hovertemplatefallback = scatterAttrs.hovertemplatefallback;
attrs.texttemplate = scatterAttrs.texttemplate;
attrs.texttemplatefallback = scatterAttrs.texttemplatefallback;

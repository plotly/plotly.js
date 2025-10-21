'use strict';

var scatterAttrs = require('../scatter/attributes');
var fontAttrs = require('../../plots/font_attributes');
var colorAttributes = require('../../components/colorscale/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
const { hovertemplateAttrs, texttemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var baseAttrs = require('../../plots/attributes');
var DASHES = require('../../constants/gl3d_dashes');

var MARKER_SYMBOLS = require('../../constants/gl3d_markers');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var sortObjectKeys = require('../../lib/sort_object_keys');

var scatterLineAttrs = scatterAttrs.line;
var scatterMarkerAttrs = scatterAttrs.marker;
var scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var lineAttrs = extendFlat(
    {
        width: scatterLineAttrs.width,
        dash: {
            valType: 'enumerated',
            values: sortObjectKeys(DASHES),
            dflt: 'solid',
            description: 'Sets the dash style of the lines.'
        }
    },
    colorAttributes('line')
);

function makeProjectionAttr(axLetter) {
    return {
        show: {
            valType: 'boolean',
            dflt: false,
            description: ['Sets whether or not projections are shown along the', axLetter, 'axis.'].join(' ')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: 'Sets the projection color.'
        },
        scale: {
            valType: 'number',
            min: 0,
            max: 10,
            dflt: 2 / 3,
            description: ['Sets the scale factor determining the size of the', 'projection marker points.'].join(' ')
        }
    };
}

var attrs = (module.exports = overrideAll(
    {
        x: scatterAttrs.x,
        y: scatterAttrs.y,
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
                "this trace's (x,y,z) coordinates.",
                'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
                'these elements will be seen in the hover labels.'
            ].join(' ')
        }),
        texttemplate: texttemplateAttrs(),
        texttemplatefallback: templatefallbackAttrs({ editType: 'calc' }),
        hovertext: extendFlat({}, scatterAttrs.hovertext, {
            description: [
                'Sets text elements associated with each (x,y,z) triplet.',
                'If a single string, the same string appears over',
                'all the data points.',
                'If an array of string, the items are mapped in order to the',
                "this trace's (x,y,z) coordinates.",
                'To be seen, trace `hoverinfo` must contain a *text* flag.'
            ].join(' ')
        }),
        hovertemplate: hovertemplateAttrs(),
        hovertemplatefallback: templatefallbackAttrs(),

        xhoverformat: axisHoverFormat('x'),
        yhoverformat: axisHoverFormat('y'),
        zhoverformat: axisHoverFormat('z'),

        mode: extendFlat(
            {},
            scatterAttrs.mode, // shouldn't this be on-par with 2D?
            { dflt: 'lines+markers' }
        ),
        surfaceaxis: {
            valType: 'enumerated',
            values: [-1, 0, 1, 2],
            dflt: -1,
            description: [
                'If *-1*, the scatter points are not fill with a surface',
                'If *0*, *1*, *2*, the scatter points are filled with',
                'a Delaunay surface about the x, y, z respectively.'
            ].join(' ')
        },
        surfacecolor: {
            valType: 'color',
            description: 'Sets the surface fill color.'
        },
        projection: {
            x: makeProjectionAttr('x'),
            y: makeProjectionAttr('y'),
            z: makeProjectionAttr('z')
        },

        connectgaps: scatterAttrs.connectgaps,
        line: lineAttrs,

        marker: extendFlat(
            {
                // Parity with scatter.js?
                symbol: {
                    valType: 'enumerated',
                    values: sortObjectKeys(MARKER_SYMBOLS),
                    dflt: 'circle',
                    arrayOk: true,
                    description: 'Sets the marker symbol type.'
                },
                size: extendFlat({}, scatterMarkerAttrs.size, { dflt: 8 }),
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
                colorbar: scatterMarkerAttrs.colorbar,

                line: extendFlat(
                    {
                        width: extendFlat({}, scatterMarkerLineAttrs.width, { arrayOk: false })
                    },
                    colorAttributes('marker.line')
                )
            },
            colorAttributes('marker')
        ),

        textposition: extendFlat({}, scatterAttrs.textposition, { dflt: 'top center' }),
        textfont: fontAttrs({
            noFontShadow: true,
            noFontLineposition: true,
            noFontTextcase: true,
            editType: 'calc',
            colorEditType: 'style',
            arrayOk: true,
            variantValues: ['normal', 'small-caps'],
            description: 'Sets the text font.'
        }),

        opacity: baseAttrs.opacity,

        hoverinfo: extendFlat({}, baseAttrs.hoverinfo)
    },
    'calc',
    'nested'
));

attrs.x.editType = attrs.y.editType = attrs.z.editType = 'calc+clearAxisTypes';

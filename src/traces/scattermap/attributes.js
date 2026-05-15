'use strict';

const { hovertemplateAttrs, texttemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var makeFillcolorAttr = require('../scatter/fillcolor_attribute');
var scatterGeoAttrs = require('../scattergeo/attributes');
var scatterAttrs = require('../scatter/attributes');
var mapAttrs = require('../../plots/map/layout_attributes');
var baseAttrs = require('../../plots/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');

var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var mapLayoutAtributes = require('../../plots/map/layout_attributes');

var lineAttrs = scatterGeoAttrs.line;
var markerAttrs = scatterGeoAttrs.marker;

module.exports = overrideAll(
    {
        lon: scatterGeoAttrs.lon,
        lat: scatterGeoAttrs.lat,

        cluster: {
            enabled: {
                valType: 'boolean',
                description: 'Determines whether clustering is enabled or disabled.'
            },
            maxzoom: extendFlat({}, mapLayoutAtributes.layers.maxzoom, {
                description: [
                    'Sets the maximum zoom level.',
                    'At zoom levels equal to or greater than this, points will never be clustered.'
                ].join(' ')
            }),
            step: {
                valType: 'number',
                arrayOk: true,
                dflt: -1,
                min: -1,
                description: [
                    'Sets how many points it takes to create a cluster or advance to the next cluster step.',
                    'Use this in conjunction with arrays for `size` and / or `color`.',
                    'If an integer, steps start at multiples of this number.',
                    'If an array, each step extends from the given value until one less than the next value.'
                ].join(' ')
            },
            size: {
                valType: 'number',
                arrayOk: true,
                dflt: 20,
                min: 0,
                description: ['Sets the size for each cluster step.'].join(' ')
            },
            color: {
                valType: 'color',
                arrayOk: true,
                description: ['Sets the color for each cluster step.'].join(' ')
            },
            opacity: extendFlat({}, markerAttrs.opacity, {
                dflt: 1
            })
        },

        // locations
        // locationmode

        mode: extendFlat({}, scatterAttrs.mode, {
            dflt: 'markers',
            description: [
                'Determines the drawing mode for this scatter trace.',
                'If the provided `mode` includes *text* then the `text` elements',
                'appear at the coordinates. Otherwise, the `text` elements',
                'appear on hover.'
            ].join(' ')
        }),

        text: extendFlat({}, scatterAttrs.text, {
            description: [
                'Sets text elements associated with each (lon,lat) pair',
                'If a single string, the same string appears over',
                'all the data points.',
                'If an array of string, the items are mapped in order to the',
                "this trace's (lon,lat) coordinates.",
                'If trace `hoverinfo` contains a *text* flag and *hovertext* is not set,',
                'these elements will be seen in the hover labels.'
            ].join(' ')
        }),
        texttemplate: texttemplateAttrs({ editType: 'plot' }, { keys: ['lat', 'lon', 'text'] }),
        texttemplatefallback: templatefallbackAttrs({ editType: 'plot' }),
        hovertext: extendFlat({}, scatterAttrs.hovertext, {
            description: [
                'Sets hover text elements associated with each (lon,lat) pair',
                'If a single string, the same string appears over',
                'all the data points.',
                'If an array of string, the items are mapped in order to the',
                "this trace's (lon,lat) coordinates.",
                'To be seen, trace `hoverinfo` must contain a *text* flag.'
            ].join(' ')
        }),

        line: {
            color: lineAttrs.color,
            width: lineAttrs.width

            // TODO
            // dash: dash
        },

        connectgaps: scatterAttrs.connectgaps,

        marker: extendFlat(
            {
                symbol: {
                    valType: 'string',
                    dflt: 'circle',
                    arrayOk: true,
                    description: [
                        'Sets the marker symbol.',
                        'Full list: https://www.mapbox.com/maki-icons/',
                        'Note that the array `marker.color` and `marker.size`',
                        'are only available for *circle* symbols.'
                    ].join(' ')
                },
                angle: {
                    valType: 'number',
                    dflt: 'auto',
                    arrayOk: true,
                    description: [
                        'Sets the marker orientation from true North, in degrees clockwise.',
                        'When using the *auto* default, no rotation would be applied',
                        'in perspective views which is different from using a zero angle.'
                    ].join(' ')
                },
                allowoverlap: {
                    valType: 'boolean',
                    dflt: false,
                    description: ['Flag to draw all symbols, even if they overlap.'].join(' ')
                },
                opacity: markerAttrs.opacity,
                size: markerAttrs.size,
                sizeref: markerAttrs.sizeref,
                sizemin: markerAttrs.sizemin,
                sizemode: markerAttrs.sizemode
            },
            colorScaleAttrs('marker')
            // line
        ),

        fill: scatterGeoAttrs.fill,
        fillcolor: makeFillcolorAttr(),

        textfont: mapAttrs.layers.symbol.textfont,
        textposition: mapAttrs.layers.symbol.textposition,

        below: {
            valType: 'string',
            description: [
                "Determines if this scattermap trace's layers are to be inserted",
                'before the layer with the specified ID.',
                'By default, scattermap layers are inserted',
                'above all the base layers.',
                "To place the scattermap layers above every other layer, set `below` to *''*."
            ].join(' ')
        },

        selected: {
            marker: scatterAttrs.selected.marker
        },
        unselected: {
            marker: scatterAttrs.unselected.marker
        },

        hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
            flags: ['lon', 'lat', 'text', 'name']
        }),
        hovertemplate: hovertemplateAttrs(),
        hovertemplatefallback: templatefallbackAttrs()
    },
    'calc',
    'nested'
);

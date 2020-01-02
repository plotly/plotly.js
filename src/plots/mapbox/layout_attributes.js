/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var defaultLine = require('../../components/color').defaultLine;
var domainAttrs = require('../domain').attributes;
var fontAttrs = require('../font_attributes');
var textposition = require('../../traces/scatter/attributes').textposition;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var templatedArray = require('../../plot_api/plot_template').templatedArray;

var constants = require('./constants');

var fontAttr = fontAttrs({
    description: [
        'Sets the icon text font (color=mapbox.layer.paint.text-color, size=mapbox.layer.layout.text-size).',
        'Has an effect only when `type` is set to *symbol*.'
    ].join(' ')
});
fontAttr.family.dflt = 'Open Sans Regular, Arial Unicode MS Regular';

var attrs = module.exports = overrideAll({
    _arrayAttrRegexps: [Lib.counterRegex('mapbox', '.layers', true)],

    domain: domainAttrs({name: 'mapbox'}),

    accesstoken: {
        valType: 'string',
        noBlank: true,
        strict: true,
        role: 'info',
        description: [
            'Sets the mapbox access token to be used for this mapbox map.',
            'Alternatively, the mapbox access token can be set in the',
            'configuration options under `mapboxAccessToken`.',
            'Note that accessToken are only required when `style`',
            '(e.g with values :', constants.styleValuesMapbox.join(', '), ')',
            'and/or a layout layer references the Mapbox server.'
        ].join(' ')
    },
    style: {
        valType: 'any',
        values: constants.styleValuesMapbox.concat(constants.styleValuesNonMapbox),
        dflt: constants.styleValueDflt,
        role: 'style',
        description: [
            'Defines the map layers that are rendered by default below the trace layers defined in `data`,',
            'which are themselves by default rendered below the layers defined in `layout.mapbox.layers`.',
            '',
            'These layers can be defined either explicitly as a Mapbox Style object which can contain multiple',
            'layer definitions that load data from any public or private Tile Map Service (TMS or XYZ) or Web Map Service (WMS)',
            'or implicitly by using one of the built-in style objects which use WMSes which do not require any',
            'access tokens, or by using a default Mapbox style or custom Mapbox style URL, both of',
            'which require a Mapbox access token',
            '',
            'Note that Mapbox access token can be set in the `accesstoken` attribute',
            'or in the `mapboxAccessToken` config option.',
            '',
            'Mapbox Style objects are of the form described in the Mapbox GL JS documentation available at',
            'https://docs.mapbox.com/mapbox-gl-js/style-spec',
            '',
            'The built-in plotly.js styles objects are:', constants.styleValuesNonMapbox.join(', '),
            '',
            'The built-in Mapbox styles are:', constants.styleValuesMapbox.join(', '),
            '',
            'Mapbox style URLs are of the form: mapbox://mapbox.mapbox-<name>-<version>'
        ].join(' ')
    },

    center: {
        lon: {
            valType: 'number',
            dflt: 0,
            role: 'info',
            description: 'Sets the longitude of the center of the map (in degrees East).'
        },
        lat: {
            valType: 'number',
            dflt: 0,
            role: 'info',
            description: 'Sets the latitude of the center of the map (in degrees North).'
        }
    },
    zoom: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        description: 'Sets the zoom level of the map (mapbox.zoom).'
    },
    bearing: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: 'Sets the bearing angle of the map in degrees counter-clockwise from North (mapbox.bearing).'
    },
    pitch: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: [
            'Sets the pitch angle of the map',
            '(in degrees, where *0* means perpendicular to the surface of the map) (mapbox.pitch).'
        ].join(' ')
    },

    layers: templatedArray('layer', {
        visible: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            description: [
                'Determines whether this layer is displayed'
            ].join(' ')
        },
        sourcetype: {
            valType: 'enumerated',
            values: ['geojson', 'vector', 'raster', 'image'],
            dflt: 'geojson',
            role: 'info',
            description: [
                'Sets the source type for this layer,',
                'that is the type of the layer data.'
            ].join(' ')
        },

        source: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the source data for this layer (mapbox.layer.source).',
                'When `sourcetype` is set to *geojson*, `source` can be a URL to a GeoJSON',
                'or a GeoJSON object.',
                'When `sourcetype` is set to *vector* or *raster*, `source` can be a URL or',
                'an array of tile URLs.',
                'When `sourcetype` is set to *image*, `source` can be a URL to an image.'
            ].join(' ')
        },

        sourcelayer: {
            valType: 'string',
            dflt: '',
            role: 'info',
            description: [
                'Specifies the layer to use from a vector tile source (mapbox.layer.source-layer).',
                'Required for *vector* source type that supports multiple layers.'
            ].join(' ')
        },

        sourceattribution: {
            valType: 'string',
            role: 'info',
            description: [
                'Sets the attribution for this source.'
            ].join(' ')
        },

        type: {
            valType: 'enumerated',
            values: ['circle', 'line', 'fill', 'symbol', 'raster'],
            dflt: 'circle',
            role: 'info',
            description: [
                'Sets the layer type,',
                'that is the how the layer data set in `source` will be rendered',
                'With `sourcetype` set to *geojson*, the following values are allowed:',
                '*circle*, *line*, *fill* and *symbol*.',
                'but note that *line* and *fill* are not compatible with Point',
                'GeoJSON geometries.',
                'With `sourcetype` set to *vector*, the following values are allowed:',
                ' *circle*, *line*, *fill* and *symbol*.',
                'With `sourcetype` set to *raster* or `*image*`, only the *raster* value is allowed.'
            ].join(' ')
        },

        coordinates: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the coordinates array contains [longitude, latitude] pairs',
                'for the image corners listed in clockwise order:',
                'top left, top right, bottom right, bottom left.',
                'Only has an effect for *image* `sourcetype`.'
            ].join(' ')
        },

        // attributes shared between all types
        below: {
            valType: 'string',
            role: 'info',
            description: [
                'Determines if the layer will be inserted',
                'before the layer with the specified ID.',
                'If omitted or set to \'\',',
                'the layer will be inserted above every existing layer.'
            ].join(' ')
        },
        color: {
            valType: 'color',
            dflt: defaultLine,
            role: 'style',
            description: [
                'Sets the primary layer color.',
                'If `type` is *circle*, color corresponds to the circle color (mapbox.layer.paint.circle-color)',
                'If `type` is *line*, color corresponds to the line color (mapbox.layer.paint.line-color)',
                'If `type` is *fill*, color corresponds to the fill color (mapbox.layer.paint.fill-color)',
                'If `type` is *symbol*, color corresponds to the icon color (mapbox.layer.paint.icon-color)'
            ].join(' ')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            role: 'info',
            description: [
                'Sets the opacity of the layer.',
                'If `type` is *circle*, opacity corresponds to the circle opacity (mapbox.layer.paint.circle-opacity)',
                'If `type` is *line*, opacity corresponds to the line opacity (mapbox.layer.paint.line-opacity)',
                'If `type` is *fill*, opacity corresponds to the fill opacity (mapbox.layer.paint.fill-opacity)',
                'If `type` is *symbol*, opacity corresponds to the icon/text opacity (mapbox.layer.paint.text-opacity)'
            ].join(' ')
        },
        minzoom: {
            valType: 'number',
            min: 0,
            max: 24,
            dflt: 0,
            role: 'info',
            description: [
                'Sets the minimum zoom level (mapbox.layer.minzoom).',
                'At zoom levels less than the minzoom, the layer will be hidden.',
            ].join(' ')
        },
        maxzoom: {
            valType: 'number',
            min: 0,
            max: 24,
            dflt: 24,
            role: 'info',
            description: [
                'Sets the maximum zoom level (mapbox.layer.maxzoom).',
                'At zoom levels equal to or greater than the maxzoom, the layer will be hidden.'
            ].join(' ')
        },

        // type-specific style attributes
        circle: {
            radius: {
                valType: 'number',
                dflt: 15,
                role: 'style',
                description: [
                    'Sets the circle radius (mapbox.layer.paint.circle-radius).',
                    'Has an effect only when `type` is set to *circle*.'
                ].join(' ')
            }
        },

        line: {
            width: {
                valType: 'number',
                dflt: 2,
                role: 'style',
                description: [
                    'Sets the line width (mapbox.layer.paint.line-width).',
                    'Has an effect only when `type` is set to *line*.'
                ].join(' ')
            },
            dash: {
                valType: 'data_array',
                role: 'style',
                description: [
                    'Sets the length of dashes and gaps (mapbox.layer.paint.line-dasharray).',
                    'Has an effect only when `type` is set to *line*.'
                ].join(' ')
            }
        },

        fill: {
            outlinecolor: {
                valType: 'color',
                dflt: defaultLine,
                role: 'style',
                description: [
                    'Sets the fill outline color (mapbox.layer.paint.fill-outline-color).',
                    'Has an effect only when `type` is set to *fill*.'
                ].join(' ')
            }
        },

        symbol: {
            icon: {
                valType: 'string',
                dflt: 'marker',
                role: 'style',
                description: [
                    'Sets the symbol icon image (mapbox.layer.layout.icon-image).',
                    'Full list: https://www.mapbox.com/maki-icons/'
                ].join(' ')
            },
            iconsize: {
                valType: 'number',
                dflt: 10,
                role: 'style',
                description: [
                    'Sets the symbol icon size (mapbox.layer.layout.icon-size).',
                    'Has an effect only when `type` is set to *symbol*.'
                ].join(' ')
            },
            text: {
                valType: 'string',
                dflt: '',
                role: 'info',
                description: [
                    'Sets the symbol text (mapbox.layer.layout.text-field).'
                ].join(' ')
            },
            placement: {
                valType: 'enumerated',
                values: ['point', 'line', 'line-center'],
                dflt: 'point',
                role: 'info',
                description: [
                    'Sets the symbol and/or text placement (mapbox.layer.layout.symbol-placement).',
                    'If `placement` is *point*, the label is placed where the geometry is located',
                    'If `placement` is *line*, the label is placed along the line of the geometry',
                    'If `placement` is *line-center*, the label is placed on the center of the geometry',
                ].join(' ')
            },
            textfont: fontAttr,
            textposition: Lib.extendFlat({}, textposition, { arrayOk: false })
        }
    })
}, 'plot', 'from-root');

// set uirevision outside of overrideAll so it can be `editType: 'none'`
attrs.uirevision = {
    valType: 'any',
    role: 'info',
    editType: 'none',
    description: [
        'Controls persistence of user-driven changes in the view:',
        '`center`, `zoom`, `bearing`, `pitch`. Defaults to `layout.uirevision`.'
    ].join(' ')
};

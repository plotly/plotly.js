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
    noFontVariant: true,
    noFontShadow: true,
    noFontLineposition: true,
    noFontTextcase: true,
    description: [
        'Sets the icon text font (color=map.layer.paint.text-color, size=map.layer.layout.text-size).',
        'Has an effect only when `type` is set to *symbol*.'
    ].join(' ')
});
fontAttr.family.dflt = 'Open Sans Regular, Arial Unicode MS Regular';

var attrs = module.exports = overrideAll({
    _arrayAttrRegexps: [Lib.counterRegex('map', '.layers', true)],

    domain: domainAttrs({name: 'map'}),

    style: {
        valType: 'any',
        values: constants.styleValuesMap,
        dflt: constants.styleValueDflt,
        description: [
            'Defines the map layers that are rendered by default below the trace layers defined in `data`,',
            'which are themselves by default rendered below the layers defined in `layout.map.layers`.',
            '',
            'These layers can be defined either explicitly as a Map Style object which can contain multiple',
            'layer definitions that load data from any public or private Tile Map Service (TMS or XYZ) or Web Map Service (WMS)',
            'or implicitly by using one of the built-in style objects which use WMSes',
            'or by using a custom style URL',
            '',
            'Map Style objects are of the form described in the MapLibre GL JS documentation available at',
            'https://maplibre.org/maplibre-style-spec/',
            '',
            'The built-in plotly.js styles objects are:', constants.styleValuesMap.join(', ') + '.'
        ].join(' ')
    },

    center: {
        lon: {
            valType: 'number',
            dflt: 0,
            description: 'Sets the longitude of the center of the map (in degrees East).'
        },
        lat: {
            valType: 'number',
            dflt: 0,
            description: 'Sets the latitude of the center of the map (in degrees North).'
        }
    },
    zoom: {
        valType: 'number',
        dflt: 1,
        description: 'Sets the zoom level of the map (map.zoom).'
    },
    bearing: {
        valType: 'number',
        dflt: 0,
        description: 'Sets the bearing angle of the map in degrees counter-clockwise from North (map.bearing).'
    },
    pitch: {
        valType: 'number',
        dflt: 0,
        description: [
            'Sets the pitch angle of the map',
            '(in degrees, where *0* means perpendicular to the surface of the map) (map.pitch).'
        ].join(' ')
    },

    bounds: {
        west: {
            valType: 'number',
            description: [
                'Sets the minimum longitude of the map (in degrees East)',
                'if `east`, `south` and `north` are declared.'
            ].join(' ')
        },
        east: {
            valType: 'number',
            description: [
                'Sets the maximum longitude of the map (in degrees East)',
                'if `west`, `south` and `north` are declared.'
            ].join(' ')
        },
        south: {
            valType: 'number',
            description: [
                'Sets the minimum latitude of the map (in degrees North)',
                'if `east`, `west` and `north` are declared.'
            ].join(' ')
        },
        north: {
            valType: 'number',
            description: [
                'Sets the maximum latitude of the map (in degrees North)',
                'if `east`, `west` and `south` are declared.'
            ].join(' ')
        }
    },

    layers: templatedArray('layer', {
        visible: {
            valType: 'boolean',
            dflt: true,
            description: [
                'Determines whether this layer is displayed'
            ].join(' ')
        },
        sourcetype: {
            valType: 'enumerated',
            values: ['geojson', 'vector', 'raster', 'image'],
            dflt: 'geojson',
            description: [
                'Sets the source type for this layer,',
                'that is the type of the layer data.'
            ].join(' ')
        },

        source: {
            valType: 'any',
            description: [
                'Sets the source data for this layer (map.layer.source).',
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
            description: [
                'Specifies the layer to use from a vector tile source (map.layer.source-layer).',
                'Required for *vector* source type that supports multiple layers.'
            ].join(' ')
        },

        sourceattribution: {
            valType: 'string',
            description: [
                'Sets the attribution for this source.'
            ].join(' ')
        },

        type: {
            valType: 'enumerated',
            values: ['circle', 'line', 'fill', 'symbol', 'raster'],
            dflt: 'circle',
            description: [
                'Sets the layer type,',
                'that is the how the layer data set in `source` will be rendered',
                'With `sourcetype` set to *geojson*, the following values are allowed:',
                '*circle*, *line*, *fill* and *symbol*.',
                'but note that *line* and *fill* are not compatible with Point',
                'GeoJSON geometries.',
                'With `sourcetype` set to *vector*, the following values are allowed:',
                ' *circle*, *line*, *fill* and *symbol*.',
                'With `sourcetype` set to *raster* or *image*, only the *raster* value is allowed.'
            ].join(' ')
        },

        coordinates: {
            valType: 'any',
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
            description: [
                'Sets the primary layer color.',
                'If `type` is *circle*, color corresponds to the circle color (map.layer.paint.circle-color)',
                'If `type` is *line*, color corresponds to the line color (map.layer.paint.line-color)',
                'If `type` is *fill*, color corresponds to the fill color (map.layer.paint.fill-color)',
                'If `type` is *symbol*, color corresponds to the icon color (map.layer.paint.icon-color)'
            ].join(' ')
        },
        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: [
                'Sets the opacity of the layer.',
                'If `type` is *circle*, opacity corresponds to the circle opacity (map.layer.paint.circle-opacity)',
                'If `type` is *line*, opacity corresponds to the line opacity (map.layer.paint.line-opacity)',
                'If `type` is *fill*, opacity corresponds to the fill opacity (map.layer.paint.fill-opacity)',
                'If `type` is *symbol*, opacity corresponds to the icon/text opacity (map.layer.paint.text-opacity)'
            ].join(' ')
        },
        minzoom: {
            valType: 'number',
            min: 0,
            max: 24,
            dflt: 0,
            description: [
                'Sets the minimum zoom level (map.layer.minzoom).',
                'At zoom levels less than the minzoom, the layer will be hidden.',
            ].join(' ')
        },
        maxzoom: {
            valType: 'number',
            min: 0,
            max: 24,
            dflt: 24,
            description: [
                'Sets the maximum zoom level (map.layer.maxzoom).',
                'At zoom levels equal to or greater than the maxzoom, the layer will be hidden.'
            ].join(' ')
        },

        // type-specific style attributes
        circle: {
            radius: {
                valType: 'number',
                dflt: 15,
                description: [
                    'Sets the circle radius (map.layer.paint.circle-radius).',
                    'Has an effect only when `type` is set to *circle*.'
                ].join(' ')
            }
        },

        line: {
            width: {
                valType: 'number',
                dflt: 2,
                description: [
                    'Sets the line width (map.layer.paint.line-width).',
                    'Has an effect only when `type` is set to *line*.'
                ].join(' ')
            },
            dash: {
                valType: 'data_array',
                description: [
                    'Sets the length of dashes and gaps (map.layer.paint.line-dasharray).',
                    'Has an effect only when `type` is set to *line*.'
                ].join(' ')
            }
        },

        fill: {
            outlinecolor: {
                valType: 'color',
                dflt: defaultLine,
                description: [
                    'Sets the fill outline color (map.layer.paint.fill-outline-color).',
                    'Has an effect only when `type` is set to *fill*.'
                ].join(' ')
            }
        },

        symbol: {
            icon: {
                valType: 'string',
                dflt: 'marker',
                description: [
                    'Sets the symbol icon image (map.layer.layout.icon-image).',
                    'Full list: https://www.mapbox.com/maki-icons/'
                ].join(' ')
            },
            iconsize: {
                valType: 'number',
                dflt: 10,
                description: [
                    'Sets the symbol icon size (map.layer.layout.icon-size).',
                    'Has an effect only when `type` is set to *symbol*.'
                ].join(' ')
            },
            text: {
                valType: 'string',
                dflt: '',
                description: [
                    'Sets the symbol text (map.layer.layout.text-field).'
                ].join(' ')
            },
            placement: {
                valType: 'enumerated',
                values: ['point', 'line', 'line-center'],
                dflt: 'point',
                description: [
                    'Sets the symbol and/or text placement (map.layer.layout.symbol-placement).',
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
    editType: 'none',
    description: [
        'Controls persistence of user-driven changes in the view:',
        '`center`, `zoom`, `bearing`, `pitch`. Defaults to `layout.uirevision`.'
    ].join(' ')
};

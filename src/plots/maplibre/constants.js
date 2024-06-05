'use strict';

var sortObjectKeys = require('../../lib/sort_object_keys');

var requiredVersion = '1.13.4';

var OSM = '© <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
var carto = [
    '© <a target="_blank" href="https://carto.com/">Carto</a>',
    OSM
].join(' ');

var stamenTerrainOrToner = [
    'Map tiles by <a target="_blank" href="https://stamen.com">Stamen Design</a>',
    'under <a target="_blank" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>',
    '|',
    'Data by <a target="_blank" href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    'under <a target="_blank" href="https://www.openstreetmap.org/copyright">ODbL</a>'
].join(' ');

var stamenWaterColor = [
    'Map tiles by <a target="_blank" href="https://stamen.com">Stamen Design</a>',
    'under <a target="_blank" href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>',
    '|',
    'Data by <a target="_blank" href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    'under <a target="_blank" href="https://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'
].join(' ');

var stylesNonMapbox = {
    'open-street-map': {
        id: 'osm',
        version: 8,
        sources: {
            'plotly-osm-tiles': {
                type: 'raster',
                attribution: OSM,
                tiles: [
                    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
                ],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-osm-tiles',
            type: 'raster',
            source: 'plotly-osm-tiles',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'white-bg': {
        id: 'white-bg',
        version: 8,
        sources: {},
        layers: [{
            id: 'white-bg',
            type: 'background',
            paint: {'background-color': '#FFFFFF'},
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'carto-positron': {
        id: 'carto-positron',
        version: 8,
        sources: {
            'plotly-carto-positron': {
                type: 'raster',
                attribution: carto,
                tiles: ['https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-carto-positron',
            type: 'raster',
            source: 'plotly-carto-positron',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'carto-darkmatter': {
        id: 'carto-darkmatter',
        version: 8,
        sources: {
            'plotly-carto-darkmatter': {
                type: 'raster',
                attribution: carto,
                tiles: ['https://cartodb-basemaps-c.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-carto-darkmatter',
            type: 'raster',
            source: 'plotly-carto-darkmatter',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'stamen-terrain': {
        id: 'stamen-terrain',
        version: 8,
        sources: {
            'plotly-stamen-terrain': {
                type: 'raster',
                attribution: stamenTerrainOrToner,
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png?api_key=pk.eyJ1IjoicGxvdGx5LWRvY3MiLCJhIjoiY2xpMGYyNWgxMGJhdzNzbXhtNGI0Nnk0aSJ9.0oBvi_UUZ0O1N0xk0yfRwg'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-stamen-terrain',
            type: 'raster',
            source: 'plotly-stamen-terrain',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'stamen-toner': {
        id: 'stamen-toner',
        version: 8,
        sources: {
            'plotly-stamen-toner': {
                type: 'raster',
                attribution: stamenTerrainOrToner,
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png?api_key=pk.eyJ1IjoicGxvdGx5LWRvY3MiLCJhIjoiY2xpMGYyNWgxMGJhdzNzbXhtNGI0Nnk0aSJ9.0oBvi_UUZ0O1N0xk0yfRwg'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-stamen-toner',
            type: 'raster',
            source: 'plotly-stamen-toner',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    },
    'stamen-watercolor': {
        id: 'stamen-watercolor',
        version: 8,
        sources: {
            'plotly-stamen-watercolor': {
                type: 'raster',
                attribution: stamenWaterColor,
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key=pk.eyJ1IjoicGxvdGx5LWRvY3MiLCJhIjoiY2xpMGYyNWgxMGJhdzNzbXhtNGI0Nnk0aSJ9.0oBvi_UUZ0O1N0xk0yfRwg'],
                tileSize: 256
            }
        },
        layers: [{
            id: 'plotly-stamen-watercolor',
            type: 'raster',
            source: 'plotly-stamen-watercolor',
            minzoom: 0,
            maxzoom: 22
        }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
    }
};

var styleValuesNonMapbox = sortObjectKeys(stylesNonMapbox);

module.exports = {
    requiredVersion: requiredVersion,

    styleValuesMapLibre: [],
    styleValueDflt: 'carto-positron',
    stylesNonMapbox: stylesNonMapbox,
    styleValuesNonMapbox: styleValuesNonMapbox,

    traceLayerPrefix: 'plotly-trace-layer-',
    layoutLayerPrefix: 'plotly-layout-layer-',

    // wrongVersionErrorMsg: [
    //     'Your custom plotly.js bundle is not using the correct maplibre-gl version',
    //     'Please install @plotly/maplibre-gl@' + requiredVersion + '.'
    // ].join('\n'),


    missingStyleErrorMsg: [
        'No valid maplibre style found, please set `maplibre.style` to one of:',
        styleValuesNonMapbox.join(', '),
        'or use a tile service.'
    ].join('\n'),


    mapOnErrorMsg: 'MapLibre error.',


};

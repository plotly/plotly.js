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



var cartoPositron = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
var cartoDarkmatter = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
var cartoVoyager = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
var arcgisSat = 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/arcgis_hybrid.json';

var stylesMapbox = {
    'basic': cartoVoyager,
    'streets': cartoPositron,
    'outdoors': cartoVoyager,
    'light': cartoPositron,
    'dark': cartoDarkmatter,
    'satellite': arcgisSat,
    'satellite-streets': arcgisSat,
    'open-street-map': {
        id: 'osm',
        version: 8,
        sources: {
            'plotly-osm-tiles': {
                type: 'raster',
                attribution: OSM,
                tiles: [
                    'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
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
    'carto-positron': cartoPositron,
    'carto-darkmatter': cartoDarkmatter,
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

var styleValuesMapbox = sortObjectKeys(stylesMapbox);

module.exports = {
    requiredVersion: requiredVersion,


    styleValueDflt: 'carto-positron',
    stylesMapbox: stylesMapbox,
    styleValuesMapbox: styleValuesMapbox,

    traceLayerPrefix: 'plotly-trace-layer-',
    layoutLayerPrefix: 'plotly-layout-layer-',


    missingStyleErrorMsg: [
        'No valid maplibre style found, please set `mapbox.style` to one of:',
        styleValuesMapbox.join(', '),
        'or use a tile service.'
    ].join('\n'),


    mapOnErrorMsg: 'Mapbox error.',


};

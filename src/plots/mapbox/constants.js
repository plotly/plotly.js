'use strict';

var sortObjectKeys = require('../../lib/sort_object_keys');

var requiredVersion = '1.13.4';

var OSM = '© <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
var cartoPositronNoLabels = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
var cartoDarkmatterNoLabels = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
var cartoVoyagerNoLabels = 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json';
var arcgisSatHybrid = 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/arcgis_hybrid.json';
var arcgisSat = {
    version: 8,
    name: 'orto',
    metadata: {},
    center: [
        1.537786,
        41.837539
    ],
    zoom: 12,
    bearing: 0,
    pitch: 0,
    light: {
        anchor: 'viewport',
        color: 'white',
        intensity: 0.4,
        position: [
            1.15,
            45,
            30
        ]
    },
    sources: {
        ortoEsri: {
            type: 'raster',
            tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'ESRI &copy; <a href=\'http://www.esri.com\'>ESRI</a>'
        },
        ortoInstaMaps: {
            type: 'raster',
            tiles: [
                'https://tilemaps.icgc.cat/mapfactory/wmts/orto_8_12/CAT3857/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            maxzoom: 13
        },
        ortoICGC: {
            type: 'raster',
            tiles: [
                'https://geoserveis.icgc.cat/icc_mapesmultibase/noutm/wmts/orto/GRID3857/{z}/{x}/{y}.jpeg'
            ],
            tileSize: 256,
            minzoom: 13.1,
            maxzoom: 20
        },
        openmaptiles: {
            type: 'vector',
            url: 'https://geoserveis.icgc.cat/contextmaps/basemap.json'
        }
    },

    sprite: 'https://geoserveis.icgc.cat/contextmaps/sprites/sprite@1',
    glyphs: 'https://geoserveis.icgc.cat/contextmaps/glyphs/{fontstack}/{range}.pbf',
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: {
                'background-color': '#F4F9F4'
            }
        },
        {
            id: 'ortoEsri',
            type: 'raster',
            source: 'ortoEsri',
            maxzoom: 16,
            layout: {
                visibility: 'visible'
            }
        },
        {
            id: 'ortoICGC',
            type: 'raster',
            source: 'ortoICGC',
            minzoom: 13.1,
            maxzoom: 19,
            layout: {
                visibility: 'visible'
            }
        },
        {
            id: 'ortoInstaMaps',
            type: 'raster',
            source: 'ortoInstaMaps',
            maxzoom: 13,
            layout: {
                visibility: 'visible'
            }
        },
    ],

};

var stylesMapbox = {
    basic: cartoVoyager,
    streets: cartoVoyager,
    outdoors: cartoVoyager,
    light: cartoPositron,
    dark: cartoDarkmatter,
    satellite: arcgisSat,
    'satellite-streets': arcgisSatHybrid,
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
    'carto-voyager': cartoVoyager,
    'carto-positron-nolabels': cartoPositronNoLabels,
    'carto-darkmatter-nolabels': cartoDarkmatterNoLabels,
    'carto-voyager-nolabels': cartoVoyagerNoLabels,
    'stamen-terrain': {
        id: 'stamen-terrain',
        version: 8,
        sources: {
            'plotly-stamen-terrain': {
                type: 'raster',
                attribution: stamenTerrainOrToner,
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png'],
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
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png'],
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
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg'],
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


    styleValueDflt: 'basic',
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

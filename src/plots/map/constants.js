'use strict';

var sortObjectKeys = require('../../lib/sort_object_keys');
var arcgisSatHybrid = require('./styles/arcgis-sat-hybrid.json'); // https://raw.githubusercontent.com/go2garret/maps/v1.0.0/LICENSE
var arcgisSat = require('./styles/arcgis-sat.json');


var OSM = '© <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

var cartoPositron = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
var cartoDarkmatter = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
var cartoVoyager = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';
var cartoPositronNoLabels = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
var cartoDarkmatterNoLabels = 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json';
var cartoVoyagerNoLabels = 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json';


var stylesMap = {
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
};

var styleValuesMap = sortObjectKeys(stylesMap);

module.exports = {
    styleValueDflt: 'basic',
    stylesMap: stylesMap,
    styleValuesMap: styleValuesMap,

    traceLayerPrefix: 'plotly-trace-layer-',
    layoutLayerPrefix: 'plotly-layout-layer-',


    missingStyleErrorMsg: [
        'No valid maplibre style found, please set `map.style` to one of:',
        styleValuesMap.join(', '),
        'or use a tile service.'
    ].join('\n'),


    mapOnErrorMsg: 'Map error.',


};

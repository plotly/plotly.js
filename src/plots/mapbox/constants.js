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
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png?api_key='],
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
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png?api_key='],
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
                tiles: ['https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg?api_key='],
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

    styleUrlPrefix: 'mapbox://styles/mapbox/',
    styleUrlSuffix: 'v9',

    styleValuesMapbox: ['basic', 'streets', 'outdoors', 'light', 'dark', 'satellite', 'satellite-streets'],
    styleValueDflt: 'basic',
    stylesNonMapbox: stylesNonMapbox,
    styleValuesNonMapbox: styleValuesNonMapbox,

    traceLayerPrefix: 'plotly-trace-layer-',
    layoutLayerPrefix: 'plotly-layout-layer-',

    wrongVersionErrorMsg: [
        'Your custom plotly.js bundle is not using the correct mapbox-gl version',
        'Please install @plotly/mapbox-gl@' + requiredVersion + '.'
    ].join('\n'),

    noAccessTokenErrorMsg: [
        'Missing Mapbox access token.',
        'Mapbox trace type require a Mapbox access token to be registered.',
        'For example:',
        '  Plotly.newPlot(gd, data, layout, { mapboxAccessToken: \'my-access-token\' });',
        'More info here: https://www.mapbox.com/help/define-access-token/'
    ].join('\n'),

    missingStyleErrorMsg: [
        'No valid mapbox style found, please set `mapbox.style` to one of:',
        styleValuesNonMapbox.join(', '),
        'or register a Mapbox access token to use a Mapbox-served style.'
    ].join('\n'),

    multipleTokensErrorMsg: [
        'Set multiple mapbox access token across different mapbox subplot,',
        'using first token found as mapbox-gl does not allow multiple' +
        'access tokens on the same page.'
    ].join('\n'),

    mapOnErrorMsg: 'Mapbox error.',

    // Mapbox logo for static export
    mapboxLogo: {
        path0: 'm 10.5,1.24 c -5.11,0 -9.25,4.15 -9.25,9.25 0,5.1 4.15,9.25 9.25,9.25 5.1,0 9.25,-4.15 9.25,-9.25 0,-5.11 -4.14,-9.25 -9.25,-9.25 z m 4.39,11.53 c -1.93,1.93 -4.78,2.31 -6.7,2.31 -0.7,0 -1.41,-0.05 -2.1,-0.16 0,0 -1.02,-5.64 2.14,-8.81 0.83,-0.83 1.95,-1.28 3.13,-1.28 1.27,0 2.49,0.51 3.39,1.42 1.84,1.84 1.89,4.75 0.14,6.52 z',
        path1: 'M 10.5,-0.01 C 4.7,-0.01 0,4.7 0,10.49 c 0,5.79 4.7,10.5 10.5,10.5 5.8,0 10.5,-4.7 10.5,-10.5 C 20.99,4.7 16.3,-0.01 10.5,-0.01 Z m 0,19.75 c -5.11,0 -9.25,-4.15 -9.25,-9.25 0,-5.1 4.14,-9.26 9.25,-9.26 5.11,0 9.25,4.15 9.25,9.25 0,5.13 -4.14,9.26 -9.25,9.26 z',
        path2: 'M 14.74,6.25 C 12.9,4.41 9.98,4.35 8.23,6.1 5.07,9.27 6.09,14.91 6.09,14.91 c 0,0 5.64,1.02 8.81,-2.14 C 16.64,11 16.59,8.09 14.74,6.25 Z m -2.27,4.09 -0.91,1.87 -0.9,-1.87 -1.86,-0.91 1.86,-0.9 0.9,-1.87 0.91,1.87 1.86,0.9 z',
        polygon: '11.56,12.21 10.66,10.34 8.8,9.43 10.66,8.53 11.56,6.66 12.47,8.53 14.33,9.43 12.47,10.34'
    },

    // a subset of node_modules/mapbox-gl/dist/mapbox-gl.css
    styleRules: {
        map: 'overflow:hidden;position:relative;',
        'missing-css': 'display:none;',
        canary: 'background-color:salmon;',

        // Reusing CSS directives from: https://api.tiles.mapbox.com/mapbox-gl-js/v1.1.1/mapbox-gl.css
        'ctrl-bottom-left': 'position: absolute; pointer-events: none; z-index: 2; bottom: 0; left: 0;',
        'ctrl-bottom-right': 'position: absolute; pointer-events: none; z-index: 2; right: 0; bottom: 0;',
        ctrl: 'clear: both; pointer-events: auto; transform: translate(0, 0);',

        // Compact ctrl
        'ctrl-attrib.mapboxgl-compact .mapboxgl-ctrl-attrib-inner': 'display: none;',
        'ctrl-attrib.mapboxgl-compact:hover .mapboxgl-ctrl-attrib-inner': 'display: block; margin-top:2px',
        'ctrl-attrib.mapboxgl-compact:hover': 'padding: 2px 24px 2px 4px; visibility: visible; margin-top: 6px;',
        'ctrl-attrib.mapboxgl-compact::after': 'content: ""; cursor: pointer; position: absolute; background-image: url(\'data:image/svg+xml;charset=utf-8,%3Csvg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E %3Cpath fill="%23333333" fill-rule="evenodd" d="M4,10a6,6 0 1,0 12,0a6,6 0 1,0 -12,0 M9,7a1,1 0 1,0 2,0a1,1 0 1,0 -2,0 M9,10a1,1 0 1,1 2,0l0,3a1,1 0 1,1 -2,0"/%3E %3C/svg%3E\'); background-color: rgba(255, 255, 255, 0.5); width: 24px; height: 24px; box-sizing: border-box; border-radius: 12px;',
        'ctrl-attrib.mapboxgl-compact': 'min-height: 20px; padding: 0; margin: 10px; position: relative; background-color: #fff; border-radius: 3px 12px 12px 3px;',
        'ctrl-bottom-right > .mapboxgl-ctrl-attrib.mapboxgl-compact::after': 'bottom: 0; right: 0',
        'ctrl-bottom-left > .mapboxgl-ctrl-attrib.mapboxgl-compact::after': 'bottom: 0; left: 0',

        'ctrl-bottom-left .mapboxgl-ctrl': 'margin: 0 0 10px 10px; float: left;',
        'ctrl-bottom-right .mapboxgl-ctrl': 'margin: 0 10px 10px 0; float: right;',

        'ctrl-attrib': 'color: rgba(0, 0, 0, 0.75); text-decoration: none; font-size: 12px',
        'ctrl-attrib a': 'color: rgba(0, 0, 0, 0.75); text-decoration: none; font-size: 12px',
        'ctrl-attrib a:hover': 'color: inherit; text-decoration: underline;',

        'ctrl-attrib .mapbox-improve-map': 'font-weight: bold; margin-left: 2px;',
        'attrib-empty': 'display: none;',

        // Compact Mapbox logo without text
        'ctrl-logo': 'display:block; width: 21px; height: 21px; background-image: url(\'data:image/svg+xml;charset=utf-8,%3C?xml version="1.0" encoding="utf-8"?%3E %3Csvg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 21 21" style="enable-background:new 0 0 21 21;" xml:space="preserve"%3E%3Cg transform="translate(0,0.01)"%3E%3Cpath d="m 10.5,1.24 c -5.11,0 -9.25,4.15 -9.25,9.25 0,5.1 4.15,9.25 9.25,9.25 5.1,0 9.25,-4.15 9.25,-9.25 0,-5.11 -4.14,-9.25 -9.25,-9.25 z m 4.39,11.53 c -1.93,1.93 -4.78,2.31 -6.7,2.31 -0.7,0 -1.41,-0.05 -2.1,-0.16 0,0 -1.02,-5.64 2.14,-8.81 0.83,-0.83 1.95,-1.28 3.13,-1.28 1.27,0 2.49,0.51 3.39,1.42 1.84,1.84 1.89,4.75 0.14,6.52 z" style="opacity:0.9;fill:%23ffffff;enable-background:new" class="st0"/%3E%3Cpath d="M 10.5,-0.01 C 4.7,-0.01 0,4.7 0,10.49 c 0,5.79 4.7,10.5 10.5,10.5 5.8,0 10.5,-4.7 10.5,-10.5 C 20.99,4.7 16.3,-0.01 10.5,-0.01 Z m 0,19.75 c -5.11,0 -9.25,-4.15 -9.25,-9.25 0,-5.1 4.14,-9.26 9.25,-9.26 5.11,0 9.25,4.15 9.25,9.25 0,5.13 -4.14,9.26 -9.25,9.26 z" style="opacity:0.35;enable-background:new" class="st1"/%3E%3Cpath d="M 14.74,6.25 C 12.9,4.41 9.98,4.35 8.23,6.1 5.07,9.27 6.09,14.91 6.09,14.91 c 0,0 5.64,1.02 8.81,-2.14 C 16.64,11 16.59,8.09 14.74,6.25 Z m -2.27,4.09 -0.91,1.87 -0.9,-1.87 -1.86,-0.91 1.86,-0.9 0.9,-1.87 0.91,1.87 1.86,0.9 z" style="opacity:0.35;enable-background:new" class="st1"/%3E%3Cpolygon points="11.56,12.21 10.66,10.34 8.8,9.43 10.66,8.53 11.56,6.66 12.47,8.53 14.33,9.43 12.47,10.34 " style="opacity:0.9;fill:%23ffffff;enable-background:new" class="st0"/%3E%3C/g%3E%3C/svg%3E\')'

        // Mapbox logo WITH text below (commented out for now)
        // 'ctrl-logo': 'width: 85px; height: 21px; margin: 0 0 -3px -3px; display: block; background-repeat: no-repeat; cursor: pointer; background-image: url(\'data:image/svg+xml;charset=utf-8,%3C?xml version="1.0" encoding="utf-8"?%3E%3Csvg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 84.49 21" style="enable-background:new 0 0 84.49 21;" xml:space="preserve"%3E%3Cg%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M83.25,14.26c0,0.12-0.09,0.21-0.21,0.21h-1.61c-0.13,0-0.24-0.06-0.3-0.17l-1.44-2.39l-1.44,2.39 c-0.06,0.11-0.18,0.17-0.3,0.17h-1.61c-0.04,0-0.08-0.01-0.12-0.03c-0.09-0.06-0.13-0.19-0.06-0.28l0,0l2.43-3.68L76.2,6.84 c-0.02-0.03-0.03-0.07-0.03-0.12c0-0.12,0.09-0.21,0.21-0.21h1.61c0.13,0,0.24,0.06,0.3,0.17l1.41,2.36l1.4-2.35 c0.06-0.11,0.18-0.17,0.3-0.17H83c0.04,0,0.08,0.01,0.12,0.03c0.09,0.06,0.13,0.19,0.06,0.28l0,0l-2.37,3.63l2.43,3.67 C83.24,14.18,83.25,14.22,83.25,14.26z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M66.24,9.59c-0.39-1.88-1.96-3.28-3.84-3.28c-1.03,0-2.03,0.42-2.73,1.18V3.51c0-0.13-0.1-0.23-0.23-0.23h-1.4 c-0.13,0-0.23,0.11-0.23,0.23v10.72c0,0.13,0.1,0.23,0.23,0.23h1.4c0.13,0,0.23-0.11,0.23-0.23V13.5c0.71,0.75,1.7,1.18,2.73,1.18 c1.88,0,3.45-1.41,3.84-3.29C66.37,10.79,66.37,10.18,66.24,9.59L66.24,9.59z M62.08,13c-1.32,0-2.39-1.11-2.41-2.48v-0.06 c0.02-1.38,1.09-2.48,2.41-2.48s2.42,1.12,2.42,2.51S63.41,13,62.08,13z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M71.67,6.32c-1.98-0.01-3.72,1.35-4.16,3.29c-0.13,0.59-0.13,1.19,0,1.77c0.44,1.94,2.17,3.32,4.17,3.3 c2.35,0,4.26-1.87,4.26-4.19S74.04,6.32,71.67,6.32z M71.65,13.01c-1.33,0-2.42-1.12-2.42-2.51s1.08-2.52,2.42-2.52 c1.33,0,2.42,1.12,2.42,2.51S72.99,13,71.65,13.01L71.65,13.01z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M62.08,7.98c-1.32,0-2.39,1.11-2.41,2.48v0.06C59.68,11.9,60.75,13,62.08,13s2.42-1.12,2.42-2.51 S63.41,7.98,62.08,7.98z M62.08,11.76c-0.63,0-1.14-0.56-1.17-1.25v-0.04c0.01-0.69,0.54-1.25,1.17-1.25 c0.63,0,1.17,0.57,1.17,1.27C63.24,11.2,62.73,11.76,62.08,11.76z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M71.65,7.98c-1.33,0-2.42,1.12-2.42,2.51S70.32,13,71.65,13s2.42-1.12,2.42-2.51S72.99,7.98,71.65,7.98z M71.65,11.76c-0.64,0-1.17-0.57-1.17-1.27c0-0.7,0.53-1.26,1.17-1.26s1.17,0.57,1.17,1.27C72.82,11.21,72.29,11.76,71.65,11.76z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M45.74,6.53h-1.4c-0.13,0-0.23,0.11-0.23,0.23v0.73c-0.71-0.75-1.7-1.18-2.73-1.18 c-2.17,0-3.94,1.87-3.94,4.19s1.77,4.19,3.94,4.19c1.04,0,2.03-0.43,2.73-1.19v0.73c0,0.13,0.1,0.23,0.23,0.23h1.4 c0.13,0,0.23-0.11,0.23-0.23V6.74c0-0.12-0.09-0.22-0.22-0.22C45.75,6.53,45.75,6.53,45.74,6.53z M44.12,10.53 C44.11,11.9,43.03,13,41.71,13s-2.42-1.12-2.42-2.51s1.08-2.52,2.4-2.52c1.33,0,2.39,1.11,2.41,2.48L44.12,10.53z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M41.71,7.98c-1.33,0-2.42,1.12-2.42,2.51S40.37,13,41.71,13s2.39-1.11,2.41-2.48v-0.06 C44.1,9.09,43.03,7.98,41.71,7.98z M40.55,10.49c0-0.7,0.52-1.27,1.17-1.27c0.64,0,1.14,0.56,1.17,1.25v0.04 c-0.01,0.68-0.53,1.24-1.17,1.24C41.08,11.75,40.55,11.19,40.55,10.49z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M52.41,6.32c-1.03,0-2.03,0.42-2.73,1.18V6.75c0-0.13-0.1-0.23-0.23-0.23h-1.4c-0.13,0-0.23,0.11-0.23,0.23 v10.72c0,0.13,0.1,0.23,0.23,0.23h1.4c0.13,0,0.23-0.1,0.23-0.23V13.5c0.71,0.75,1.7,1.18,2.74,1.18c2.17,0,3.94-1.87,3.94-4.19 S54.58,6.32,52.41,6.32z M52.08,13.01c-1.32,0-2.39-1.11-2.42-2.48v-0.07c0.02-1.38,1.09-2.49,2.4-2.49c1.32,0,2.41,1.12,2.41,2.51 S53.4,13,52.08,13.01L52.08,13.01z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M52.08,7.98c-1.32,0-2.39,1.11-2.42,2.48v0.06c0.03,1.38,1.1,2.48,2.42,2.48s2.41-1.12,2.41-2.51 S53.4,7.98,52.08,7.98z M52.08,11.76c-0.63,0-1.14-0.56-1.17-1.25v-0.04c0.01-0.69,0.54-1.25,1.17-1.25c0.63,0,1.17,0.58,1.17,1.27 S52.72,11.76,52.08,11.76z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M36.08,14.24c0,0.13-0.1,0.23-0.23,0.23h-1.41c-0.13,0-0.23-0.11-0.23-0.23V9.68c0-0.98-0.74-1.71-1.62-1.71 c-0.8,0-1.46,0.7-1.59,1.62l0.01,4.66c0,0.13-0.11,0.23-0.23,0.23h-1.41c-0.13,0-0.23-0.11-0.23-0.23V9.68 c0-0.98-0.74-1.71-1.62-1.71c-0.85,0-1.54,0.79-1.6,1.8v4.48c0,0.13-0.1,0.23-0.23,0.23h-1.4c-0.13,0-0.23-0.11-0.23-0.23V6.74 c0.01-0.13,0.1-0.22,0.23-0.22h1.4c0.13,0,0.22,0.11,0.23,0.22V7.4c0.5-0.68,1.3-1.09,2.16-1.1h0.03c1.09,0,2.09,0.6,2.6,1.55 c0.45-0.95,1.4-1.55,2.44-1.56c1.62,0,2.93,1.25,2.9,2.78L36.08,14.24z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M84.34,13.59l-0.07-0.13l-1.96-2.99l1.94-2.95c0.44-0.67,0.26-1.56-0.41-2.02c-0.02,0-0.03,0-0.04-0.01 c-0.23-0.15-0.5-0.22-0.78-0.22h-1.61c-0.56,0-1.08,0.29-1.37,0.78L79.72,6.6l-0.34-0.56C79.09,5.56,78.57,5.27,78,5.27h-1.6 c-0.6,0-1.13,0.37-1.35,0.92c-2.19-1.66-5.28-1.47-7.26,0.45c-0.35,0.34-0.65,0.72-0.89,1.14c-0.9-1.62-2.58-2.72-4.5-2.72 c-0.5,0-1.01,0.07-1.48,0.23V3.51c0-0.82-0.66-1.48-1.47-1.48h-1.4c-0.81,0-1.47,0.66-1.47,1.47v3.75 c-0.95-1.36-2.5-2.18-4.17-2.19c-0.74,0-1.46,0.16-2.12,0.47c-0.24-0.17-0.54-0.26-0.84-0.26h-1.4c-0.45,0-0.87,0.21-1.15,0.56 c-0.02-0.03-0.04-0.05-0.07-0.08c-0.28-0.3-0.68-0.47-1.09-0.47h-1.39c-0.3,0-0.6,0.09-0.84,0.26c-0.67-0.3-1.39-0.46-2.12-0.46 c-1.83,0-3.43,1-4.37,2.5c-0.2-0.46-0.48-0.89-0.83-1.25c-0.8-0.81-1.89-1.25-3.02-1.25h-0.01c-0.89,0.01-1.75,0.33-2.46,0.88 c-0.74-0.57-1.64-0.88-2.57-0.88H28.1c-0.29,0-0.58,0.03-0.86,0.11c-0.28,0.06-0.56,0.16-0.82,0.28c-0.21-0.12-0.45-0.18-0.7-0.18 h-1.4c-0.82,0-1.47,0.66-1.47,1.47v7.5c0,0.82,0.66,1.47,1.47,1.47h1.4c0.82,0,1.48-0.66,1.48-1.48l0,0V9.79 c0.03-0.36,0.23-0.59,0.36-0.59c0.18,0,0.38,0.18,0.38,0.47v4.57c0,0.82,0.66,1.47,1.47,1.47h1.41c0.82,0,1.47-0.66,1.47-1.47 l-0.01-4.57c0.06-0.32,0.25-0.47,0.35-0.47c0.18,0,0.38,0.18,0.38,0.47v4.57c0,0.82,0.66,1.47,1.47,1.47h1.41 c0.82,0,1.47-0.66,1.47-1.47v-0.38c0.96,1.29,2.46,2.06,4.06,2.06c0.74,0,1.46-0.16,2.12-0.47c0.24,0.17,0.54,0.26,0.84,0.26h1.39 c0.3,0,0.6-0.09,0.84-0.26v2.01c0,0.82,0.66,1.47,1.47,1.47h1.4c0.82,0,1.47-0.66,1.47-1.47v-1.77c0.48,0.15,0.99,0.23,1.49,0.22 c1.7,0,3.22-0.87,4.17-2.2v0.52c0,0.82,0.66,1.47,1.47,1.47h1.4c0.3,0,0.6-0.09,0.84-0.26c0.66,0.31,1.39,0.47,2.12,0.47 c1.92,0,3.6-1.1,4.49-2.73c1.54,2.65,4.95,3.53,7.58,1.98c0.18-0.11,0.36-0.22,0.53-0.36c0.22,0.55,0.76,0.91,1.35,0.9H78 c0.56,0,1.08-0.29,1.37-0.78l0.37-0.61l0.37,0.61c0.29,0.48,0.81,0.78,1.38,0.78h1.6c0.81,0,1.46-0.66,1.45-1.46 C84.49,14.02,84.44,13.8,84.34,13.59L84.34,13.59z M35.86,14.47h-1.41c-0.13,0-0.23-0.11-0.23-0.23V9.68 c0-0.98-0.74-1.71-1.62-1.71c-0.8,0-1.46,0.7-1.59,1.62l0.01,4.66c0,0.13-0.1,0.23-0.23,0.23h-1.41c-0.13,0-0.23-0.11-0.23-0.23 V9.68c0-0.98-0.74-1.71-1.62-1.71c-0.85,0-1.54,0.79-1.6,1.8v4.48c0,0.13-0.1,0.23-0.23,0.23h-1.4c-0.13,0-0.23-0.11-0.23-0.23 V6.74c0.01-0.13,0.11-0.22,0.23-0.22h1.4c0.13,0,0.22,0.11,0.23,0.22V7.4c0.5-0.68,1.3-1.09,2.16-1.1h0.03 c1.09,0,2.09,0.6,2.6,1.55c0.45-0.95,1.4-1.55,2.44-1.56c1.62,0,2.93,1.25,2.9,2.78l0.01,5.16C36.09,14.36,35.98,14.46,35.86,14.47 L35.86,14.47z M45.97,14.24c0,0.13-0.1,0.23-0.23,0.23h-1.4c-0.13,0-0.23-0.11-0.23-0.23V13.5c-0.7,0.76-1.69,1.18-2.72,1.18 c-2.17,0-3.94-1.87-3.94-4.19s1.77-4.19,3.94-4.19c1.03,0,2.02,0.43,2.73,1.18V6.74c0-0.13,0.1-0.23,0.23-0.23h1.4 c0.12-0.01,0.22,0.08,0.23,0.21c0,0.01,0,0.01,0,0.02v7.51h-0.01V14.24z M52.41,14.67c-1.03,0-2.02-0.43-2.73-1.18v3.97 c0,0.13-0.1,0.23-0.23,0.23h-1.4c-0.13,0-0.23-0.1-0.23-0.23V6.75c0-0.13,0.1-0.22,0.23-0.22h1.4c0.13,0,0.23,0.11,0.23,0.23v0.73 c0.71-0.76,1.7-1.18,2.73-1.18c2.17,0,3.94,1.86,3.94,4.18S54.58,14.67,52.41,14.67z M66.24,11.39c-0.39,1.87-1.96,3.29-3.84,3.29 c-1.03,0-2.02-0.43-2.73-1.18v0.73c0,0.13-0.1,0.23-0.23,0.23h-1.4c-0.13,0-0.23-0.11-0.23-0.23V3.51c0-0.13,0.1-0.23,0.23-0.23 h1.4c0.13,0,0.23,0.11,0.23,0.23v3.97c0.71-0.75,1.7-1.18,2.73-1.17c1.88,0,3.45,1.4,3.84,3.28C66.37,10.19,66.37,10.8,66.24,11.39 L66.24,11.39L66.24,11.39z M71.67,14.68c-2,0.01-3.73-1.35-4.17-3.3c-0.13-0.59-0.13-1.19,0-1.77c0.44-1.94,2.17-3.31,4.17-3.3 c2.36,0,4.26,1.87,4.26,4.19S74.03,14.68,71.67,14.68L71.67,14.68z M83.04,14.47h-1.61c-0.13,0-0.24-0.06-0.3-0.17l-1.44-2.39 l-1.44,2.39c-0.06,0.11-0.18,0.17-0.3,0.17h-1.61c-0.04,0-0.08-0.01-0.12-0.03c-0.09-0.06-0.13-0.19-0.06-0.28l0,0l2.43-3.68 L76.2,6.84c-0.02-0.03-0.03-0.07-0.03-0.12c0-0.12,0.09-0.21,0.21-0.21h1.61c0.13,0,0.24,0.06,0.3,0.17l1.41,2.36l1.41-2.36 c0.06-0.11,0.18-0.17,0.3-0.17h1.61c0.04,0,0.08,0.01,0.12,0.03c0.09,0.06,0.13,0.19,0.06,0.28l0,0l-2.38,3.64l2.43,3.67 c0.02,0.03,0.03,0.07,0.03,0.12C83.25,14.38,83.16,14.47,83.04,14.47L83.04,14.47L83.04,14.47z"/%3E %3Cpath class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" d="M10.5,1.24c-5.11,0-9.25,4.15-9.25,9.25s4.15,9.25,9.25,9.25s9.25-4.15,9.25-9.25 C19.75,5.38,15.61,1.24,10.5,1.24z M14.89,12.77c-1.93,1.93-4.78,2.31-6.7,2.31c-0.7,0-1.41-0.05-2.1-0.16c0,0-1.02-5.64,2.14-8.81 c0.83-0.83,1.95-1.28,3.13-1.28c1.27,0,2.49,0.51,3.39,1.42C16.59,8.09,16.64,11,14.89,12.77z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M10.5-0.01C4.7-0.01,0,4.7,0,10.49s4.7,10.5,10.5,10.5S21,16.29,21,10.49C20.99,4.7,16.3-0.01,10.5-0.01z M10.5,19.74c-5.11,0-9.25-4.15-9.25-9.25s4.14-9.26,9.25-9.26s9.25,4.15,9.25,9.25C19.75,15.61,15.61,19.74,10.5,19.74z"/%3E %3Cpath class="st1" style="opacity:0.35; enable-background:new;" d="M14.74,6.25C12.9,4.41,9.98,4.35,8.23,6.1c-3.16,3.17-2.14,8.81-2.14,8.81s5.64,1.02,8.81-2.14 C16.64,11,16.59,8.09,14.74,6.25z M12.47,10.34l-0.91,1.87l-0.9-1.87L8.8,9.43l1.86-0.9l0.9-1.87l0.91,1.87l1.86,0.9L12.47,10.34z"/%3E %3Cpolygon class="st0" style="opacity:0.9; fill: %23FFFFFF; enable-background: new;" points="14.33,9.43 12.47,10.34 11.56,12.21 10.66,10.34 8.8,9.43 10.66,8.53 11.56,6.66 12.47,8.53 "/%3E%3C/g%3E%3C/svg%3E\');'
    }
};

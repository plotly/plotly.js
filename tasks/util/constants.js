var fs = require('fs');
var path = require('path');
var pkg = require('../../package.json');

var pathToRoot = path.join(__dirname, '../../');
var pathToSrc = path.join(pathToRoot, 'src/');
var pathToLib = path.join(pathToRoot, 'lib/');
var pathToTest = path.join(pathToRoot, 'test/');
var pathToImageTest = path.join(pathToTest, 'image/');
var pathToStrictD3Module = path.join(pathToRoot, 'test/strict-d3.js');
var pathToDraftlogs = path.join(pathToRoot, 'draftlogs/');
var pathToDist = path.join(pathToRoot, 'dist/');
var pathToBuild = path.join(pathToRoot, 'build/');

function startsWithLowerCase(v) {
    return v.charAt(0) !== v.charAt(0).toUpperCase();
}


var pathToPlotlyIndex = path.join(pathToLib, 'index.js');
var pathToPlotlyStrict = path.join(pathToLib, 'index-strict.js');
var mainIndex = fs.readFileSync(pathToPlotlyIndex, 'utf-8');
var strictIndex = fs.readFileSync(pathToPlotlyStrict, 'utf-8');
var allTraces = fs.readdirSync(path.join(pathToSrc, 'traces'))
    .filter(startsWithLowerCase);

var allTransforms = fs.readdirSync(path.join(pathToSrc, 'transforms'))
    .filter(function(v) {
        return startsWithLowerCase(v) && v !== 'helpers.js';
    })
    .map(function(e) { return e.replace('.js', ''); });

var pathToTopojsonSrc;
try {
    pathToTopojsonSrc = path.join(path.dirname(require.resolve('sane-topojson')), 'dist/');
} catch(e) {
    console.log([
        '',
        'WARN: Cannot resolve path to *sane-topojson* package.',
        '  This can happen when one `npm link sane-topojson`',
        '  and runs a command in a Docker container.',
        '  There is nothing to worry, if you see this warning while running',
        '  `npm run test-image`, `npm run test-export` or `npm run baseline` ;)',
        ''
    ].join('\n'));
}

var partialBundleNames = [
    'basic', 'cartesian', 'geo', 'gl3d', 'gl2d', 'mapbox', 'finance', 'strict'
];

var partialBundleTraces = {
    basic: [
        'bar',
        'pie',
        'scatter'
    ],
    cartesian: [
        'bar',
        'box',
        'contour',
        'heatmap',
        'histogram',
        'histogram2d',
        'histogram2dcontour',
        'image',
        'pie',
        'scatter',
        'scatterternary',
        'violin'
    ],
    finance: [
        'bar',
        'candlestick',
        'funnel',
        'funnelarea',
        'histogram',
        'indicator',
        'ohlc',
        'pie',
        'scatter',
        'waterfall'
    ],
    geo: [
        'choropleth',
        'scatter',
        'scattergeo'
    ],
    gl2d: [
        'heatmapgl',
        'parcoords',
        'pointcloud',
        'scatter',
        'scattergl',
        'splom'
    ],
    gl3d: [
        'cone',
        'isosurface',
        'mesh3d',
        'scatter',
        'scatter3d',
        'streamtube',
        'surface',
        'volume'
    ],
    mapbox: [
        'choroplethmapbox',
        'densitymapbox',
        'scatter',
        'scattermapbox'
    ],
    strict: [
        'bar',
        'barpolar',
        'box',
        'candlestick',
        'carpet',
        'choropleth',
        'choroplethmapbox',
        'cone',
        'contour',
        'contourcarpet',
        'densitymapbox',
        'funnel',
        'funnelarea',
        'heatmap',
        'heatmapgl',
        'histogram',
        'histogram2d',
        'histogram2dcontour',
        'icicle',
        'image',
        'indicator',
        'isosurface',
        'mesh3d',
        'ohlc',
        'parcats',
        'parcoords',
        'pie',
        'pointcloud',
        'sankey',
        'scatter',
        'scattergl',
        'scatter3d',
        'scattercarpet',
        'scattergeo',
        'scattermapbox',
        'scatterpolar',
        'scatterpolargl',
        'scattersmith',
        'scatterternary',
        'splom',
        'streamtube',
        'sunburst',
        'surface',
        'table',
        'treemap',
        'violin',
        'volume',
        'waterfall'
    ]
};

function makePartialBundleOpts(name) {
    return {
        name: name,
        traceList: partialBundleTraces[name],
        transformList: allTransforms,
        calendars: true,
        index: path.join(pathToLib, 'index-' + name + '.js'),
        dist: path.join(pathToDist, 'plotly-' + name + '.js'),
        distMin: path.join(pathToDist, 'plotly-' + name + '.min.js')
    };
}

var year = (new Date()).getFullYear();

module.exports = {
    makePartialBundleOpts: makePartialBundleOpts,

    pathToRoot: pathToRoot,
    pathToSrc: pathToSrc,
    pathToLib: pathToLib,
    pathToBuild: pathToBuild,
    pathToDist: pathToDist,
    pathToDraftlogs: pathToDraftlogs,
    pathToChangelog: path.join(pathToRoot, 'CHANGELOG.md'),

    partialBundleTraces: partialBundleTraces,

    allTransforms: allTransforms,
    allTraces: allTraces,
    mainIndex: mainIndex,
    strictIndex: strictIndex,
    pathToPlotlyIndex: pathToPlotlyIndex,
    pathToPlotlyStrict: pathToPlotlyStrict,
    pathToPlotlyCore: path.join(pathToSrc, 'core.js'),
    pathToPlotlyVersion: path.join(pathToSrc, 'version.js'),
    pathToPlotlyBuild: path.join(pathToBuild, 'plotly.js'),
    pathToPlotlyBuildMin: path.join(pathToBuild, 'plotly.min.js'),
    pathToPlotlyDist: path.join(pathToDist, 'plotly.js'),
    pathToPlotlyDistMin: path.join(pathToDist, 'plotly.min.js'),
    pathToPlotlyDistWithMeta: path.join(pathToDist, 'plotly-with-meta.js'),
    pathToPlotlyStrictDist: path.join(pathToDist, 'plotly-strict.js'),
    pathToPlotlyStrictDistMin: path.join(pathToDist, 'plotly-strict.min.js'),

    pathToSchemaDiff: path.join(pathToTest, 'plot-schema.json'),
    pathToSchemaDist: path.join(pathToDist, 'plot-schema.json'),
    pathToTranslationKeys: path.join(pathToDist, 'translation-keys.txt'),

    partialBundleNames: partialBundleNames,

    reglCodegenSubdir: path.join('generated', 'regl-codegen'),
    pathToReglCodegenSrc: path.join(pathToSrc, 'generated', 'regl-codegen'),

    pathToTopojsonSrc: pathToTopojsonSrc,
    pathToTopojsonDist: path.join(pathToDist, 'topojson/'),
    pathToPlotlyGeoAssetsSrc: path.join(pathToSrc, 'assets/geo_assets.js'),
    pathToPlotlyGeoAssetsDist: path.join(pathToDist, 'plotly-geo-assets.js'),

    pathToSCSS: path.join(pathToSrc, 'css/style.scss'),
    pathToCSSBuild: path.join(pathToBuild, 'plotcss.js'),

    pathToTestDashboardBundle: path.join(pathToBuild, 'test_dashboard-bundle.js'),
    pathToReglCodegenBundle: path.join(pathToBuild, 'regl_codegen-bundle.js'),

    pathToImageTest: pathToImageTest,
    pathToTestImageMocks: path.join(pathToImageTest, 'mocks/'),
    pathToTestImageBaselines: path.join(pathToImageTest, 'baselines/'),
    pathToTestImages: path.join(pathToBuild, 'test_images/'),
    pathToTestImagesDiff: path.join(pathToBuild, 'test_images_diff/'),
    pathToTestImagesDiffList: path.join(pathToBuild, 'list_of_incorrect_images.txt'),

    pathToStrictD3Module: pathToStrictD3Module,

    pathToJasmineTests: path.join(pathToRoot, 'test/jasmine/tests'),
    pathToJasmineBundleTests: path.join(pathToRoot, 'test/jasmine/bundle_tests'),

    // this mapbox access token is 'public', no need to hide it
    // more info: https://www.mapbox.com/help/define-access-token/
    mapboxAccessToken: 'pk.eyJ1IjoicGxvdGx5LWRvY3MiLCJhIjoiY2xpMGYyNWgxMGJhdzNzbXhtNGI0Nnk0aSJ9.0oBvi_UUZ0O1N0xk0yfRwg',
    pathToCredentials: path.join(pathToBuild, 'credentials.json'),

    testContainerImage: 'plotly/testbed:latest',
    testContainerName: process.env.PLOTLYJS_TEST_CONTAINER_NAME || 'imagetest',
    testContainerPort: '9010',
    testContainerUrl: 'http://localhost:9010/',
    testContainerHome: '/var/www/streambed/image_server/plotly.js',

    licenseDist: [
        '/**',
        '* plotly.js v' + pkg.version,
        '* Copyright 2012-' + year + ', Plotly, Inc.',
        '* All rights reserved.',
        '* Licensed under the MIT license',
        '*/'
    ].join('\n'),
};

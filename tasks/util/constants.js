var path = require('path');

var pkg = require('../../package.json');

var pathToRoot = path.join(__dirname, '../../');
var pathToSrc = path.join(pathToRoot, 'src/');
var pathToLib = path.join(pathToRoot, 'lib/');
var pathToImageTest = path.join(pathToRoot, 'test/image');
var pathToDist = path.join(pathToRoot, 'dist/');
var pathToBuild = path.join(pathToRoot, 'build/');

var pathToTopojsonSrc = path.join(
    path.dirname(require.resolve('sane-topojson')), 'dist/'
);

var year = (new Date()).getFullYear();

module.exports = {
    pathToRoot: pathToRoot,
    pathToSrc: pathToSrc,
    pathToLib: pathToLib,
    pathToBuild: pathToBuild,

    pathToPlotlyIndex: path.join(pathToLib, 'index.js'),
    pathToPlotlyCore: path.join(pathToSrc, 'core.js'),
    pathToPlotlyBuild: path.join(pathToBuild, 'plotly.js'),
    pathToPlotlyDist: path.join(pathToDist, 'plotly.js'),
    pathToPlotlyDistMin: path.join(pathToDist, 'plotly.min.js'),
    pathToPlotlyDistWithMeta: path.join(pathToDist, 'plotly-with-meta.js'),

    pathToTopojsonSrc: pathToTopojsonSrc,
    pathToTopojsonDist: path.join(pathToDist, 'topojson/'),
    pathToPlotlyGeoAssetsSrc: path.join(pathToSrc, 'assets/geo_assets.js'),
    pathToPlotlyGeoAssetsDist: path.join(pathToDist, 'plotly-geo-assets.js'),

    pathToFontSVG: path.join(pathToSrc, 'fonts/ploticon/ploticon.svg'),
    pathToFontSVGBuild: path.join(pathToBuild, 'ploticon.js'),

    pathToSCSS: path.join(pathToSrc, 'css/style.scss'),
    pathToCSSBuild: path.join(pathToBuild, 'plotcss.js'),

    pathToTestDashboardBundle: path.join(pathToBuild, 'test_dashboard-bundle.js'),
    pathToImageViewerBundle: path.join(pathToBuild, 'image_viewer-bundle.js'),

    pathToTestImageMocks: path.join(pathToImageTest, 'mocks/'),
    pathToTestImageBaselines: path.join(pathToImageTest, 'baselines/'),
    pathToTestImages: path.join(pathToBuild, 'test_images/'),
    pathToTestImagesDiff: path.join(pathToBuild, 'test_images_diff/'),
    pathToTestImagesDiffList: path.join(pathToBuild, 'list_of_incorrect_images.txt'),

    pathToJasmineTests: path.join(pathToRoot, 'test/jasmine/tests'),
    pathToJasmineBundleTests: path.join(pathToRoot, 'test/jasmine/bundle_tests'),

    uglifyOptions: {
        fromString: true,
        mangle: true,
        compress: {
            warnings: false,
            screw_ie8: true
        },
        output: {
            beautify: false,
            ascii_only: true
        }
    },

    licenseDist: [
        '/**',
        '* plotly.js v' + pkg.version,
        '* Copyright 2012-' + year + ', Plotly, Inc.',
        '* All rights reserved.',
        '* Licensed under the MIT license',
        '*/'
    ].join('\n'),

    licenseSrc: [
        '/**',
        '* Copyright 2012-' + year + ', Plotly, Inc.',
        '* All rights reserved.',
        '*',
        '* This source code is licensed under the MIT license found in the',
        '* LICENSE file in the root directory of this source tree.',
        '*/'
    ].join('\n')
};

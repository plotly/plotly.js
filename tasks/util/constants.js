var fs = require('fs');
var path = require('path');

var pathToRoot = path.join(__dirname, '../../');
var pathToRootParent = path.join(__dirname, '../../../../');
var pathToSrc = path.join(pathToRoot, 'src/');
var pathToImageTest = path.join(pathToRoot, 'test/image');
var pathToDist = path.join(pathToRoot, 'dist/');
var pathToBuild = path.join(pathToRoot, 'build/');

var pathToTopojsonSrc;

// npm3 flattens modules, so they won't be accessible through the old nested npm2 paths
// attempt a synchronous filestat check, and on error, use the npm3 path
try {
    pathToTopojsonSrc = path.join(pathToRoot, 'node_modules/sane-topojson/dist/');
    fs.statSync(pathToTopojsonSrc);
} catch (e) {
    pathToTopojsonSrc = path.join(pathToRootParent, 'node_modules/sane-topojson/dist/');
}

module.exports = {
    pathToRoot: pathToRoot,
    pathToSrc: pathToSrc,
    pathToMocks: path.join(pathToRoot, 'test/image/mocks'),

    pathToPlotlySrc: path.join(pathToSrc, 'index.js'),
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
   }
};

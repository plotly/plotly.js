var path = require('path');

var pathToRoot = path.join(__dirname, '../../');
var pathToSrc = path.join(pathToRoot, 'src/');
var pathToImageTest = path.join(pathToRoot, 'test/image');
var pathToDist = path.join(pathToRoot, 'dist/');
var pathToBuild = path.join(pathToRoot, 'build/');

module.exports = {
    pathToRoot: pathToRoot,
    pathToSrc: pathToSrc,
    pathToMocks: path.join(pathToRoot, 'test/image/mocks'),

    pathToPlotlySrc: path.join(pathToSrc, 'index.js'),
    pathToPlotlyDist: path.join(pathToDist, 'plotly.js'),
    pathToPlotlyDistMin: path.join(pathToDist, 'plotly.min.js'),
    pathToPlotlyDistWithMeta: path.join(pathToDist, 'plotly-with-meta.js'),

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

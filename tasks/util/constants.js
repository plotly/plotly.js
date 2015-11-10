var path = require('path');

var pathToRoot = path.join(__dirname, '../../');
var pathToSrc = path.join(pathToRoot, 'src/');
var pathToDist = path.join(pathToRoot, 'dist/');
var pathToBuild = path.join(pathToRoot, 'build/');

module.exports = {
    pathToRoot: pathToRoot,
    pathToSrc: pathToSrc,
    pathToMocks: path.join(pathToRoot, 'test/image/mocks'),

    pathToPlotlySrc: path.join(pathToSrc, 'plotly.js'),
    pathToPlotlyDist: path.join(pathToDist, 'plotly.js'),
    pathToPlotlyDistMin: path.join(pathToDist, 'plotly.min.js'),
    pathToPlotlyDistWithMeta: path.join(pathToDist, 'plotly-with-meta.js'),

    pathToPlotlyGeoAssetsSrc: path.join(pathToSrc, 'geo/geo-assets.js'),
    pathToPlotlyGeoAssetsDist: path.join(pathToDist, 'plotly-geo-assets.js'),

    pathToFontSVG: path.join(pathToSrc, 'fonts/ploticon/ploticon.svg'),
    pathToFontSVGBuild: path.join(pathToBuild, 'ploticon.js'),

    pathToSCSS: path.join(pathToSrc, 'css/style.scss'),
    pathToCSSBuild: path.join(pathToBuild, 'plotcss.js'),

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

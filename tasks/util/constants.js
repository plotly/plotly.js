var path = require('path');

var pathToSrc = path.join(__dirname, '../../src/');
var pathToDist = path.join(__dirname, '../../dist/');

module.exports = {
    pathToPlotlySrc: path.join(pathToSrc, 'plotly.js'),
    pathToPlotlyDist: path.join(pathToDist, 'plotly.js'),
    pathToPlotlyDistMin: path.join(pathToDist, 'plotly.min.js'),
    pathToPlotlyDistWithMeta: path.join(pathToDist, 'plotly-with-meta.js'),

    pathToPlotlyGeoAssetsSrc: path.join(pathToSrc, 'geo/geo-assets.js'),
    pathToPlotlyGeoAssetsDist: path.join(pathToDist, 'plotly-geo-assets.js'),

    pathToFontSVG: path.join(pathToSrc, 'fonts/ploticon/ploticon.svg'),
    pathToFontSVGBuild: path.join(pathToSrc, 'fonts/ploticon.js'),
    
    pathToSCSS: path.join(pathToSrc, 'css/scss/style.scss'),
    pathToCSSBuild: path.join(pathToSrc, 'css/plotcss.js'),

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

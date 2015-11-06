var fs = require('fs');
var sass = require('node-sass');

var pullCSS = require('./util/pull_css');
var pullFontSVG = require('./util/pull_font_svg');
var constants = require('./util/constants');


// convert scss to css
sass.render({
    file: constants.pathToSCSS,
    outputStyle: 'compressed'
}, function(err, result) {
    if(err) console.log('SASS error');

    // css to js
    pullCSS(String(result.css), constants.pathToCSSBuild);
});

// convert font svg into js
fs.readFile(constants.pathToFontSVG, function(err, data) {
    pullFontSVG(data.toString(), constants.pathToFontSVGBuild);
});

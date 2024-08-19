var path = require('path');
var { glob } = require('glob');

var constants = require('./util/constants');
var wrapLocale = require('./util/wrap_locale');

var pathToLib = constants.pathToLib;
var pathToDist = constants.pathToDist;

// Bundle the locales
var localeGlob = path.join(pathToLib, 'locales', '*.js');
glob(localeGlob).then(function(files) {
    files.forEach(function(file) {
        var outName = 'plotly-locale-' + path.basename(file);
        var outPath = path.join(pathToDist, outName);
        wrapLocale(file, outPath);
    });
});

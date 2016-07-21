var path = require('path');
var fs = require('fs');

var prependFile = require('prepend-file');
var falafel = require('falafel');
var glob = require('glob');

var constants = require('./util/constants');

updateHeadersInSrcFiles();

// add headers to dist files

var pathsDist = [
    constants.pathToPlotlyDistMin,
    constants.pathToPlotlyDist,
    constants.pathToPlotlyDistWithMeta,
    constants.pathToPlotlyGeoAssetsDist
];

constants.partialBundleNames.forEach(function(name) {
    var pathToBundle = path.join(constants.pathToDist, 'plotly-' + name + '.js'),
        pathToMinBundle = path.join(constants.pathToDist, 'plotly-' + name + '.min.js');

    pathsDist.push(pathToBundle, pathToMinBundle);
});

function headerLicense(path) {
    prependFile(path, constants.licenseDist + '\n', function(err) {
        if(err) throw err;
    });
}

// add or update header to src/ lib/ files
function updateHeadersInSrcFiles() {
    var srcGlob = path.join(constants.pathToSrc, '**/*.js');
    var libGlob = path.join(constants.pathToLib, '**/*.js');
pathsDist.forEach(headerLicense);

    // remove leading '/*' and trailing '*/' for comparison with falafel output
    var licenseSrc = constants.licenseSrc;
    var licenseStr = licenseSrc.substring(2, licenseSrc.length - 2);

    glob('{' + srcGlob + ',' + libGlob + '}', function(err, files) {
        files.forEach(function(file) {
            fs.readFile(file, 'utf-8', function(err, code) {

                // parse through code string while keeping track of comments
                var comments = [];
                falafel(code, {onComment: comments, locations: true}, function() {});

                var header = comments[0];

                // error out if no header is found
                if(!header || header.loc.start.line > 1) {
                    throw new Error(file + ' : has no header information.');
                }

                // if header and license are the same, do nothing
                if(isCorrect(header)) return;

                // if header and license only differ by date, update header
                else if(hasWrongDate(header)) {
                    var codeLines = code.split('\n');

                    codeLines.splice(header.loc.start.line - 1, header.loc.end.line);

                    var newCode = licenseSrc + '\n' + codeLines.join('\n');

                    fs.writeFile(file, newCode, function(err) {
                        if(err) throw err;
                    });
                }
                else {
                    // otherwise, throw an error
                    throw new Error(file + ' : has wrong header information.');
                }
            });
        });
    });

    function isCorrect(header) {
        return (header.value === licenseStr);
    }

    function hasWrongDate(header) {
        var regex = /Copyright 20[0-9][0-9]-20[0-9][0-9]/g;

        return (header.value.replace(regex, '') === licenseStr.replace(regex, ''));
    }
}

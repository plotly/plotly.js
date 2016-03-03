var path = require('path');
var fs = require('fs');

var prependFile = require('prepend-file');
var falafel = require('falafel');
var glob = require('glob');

var constants = require('./util/constants');


// add headers to dist files

var pathsDist = [
    constants.pathToPlotlyDistMin,
    constants.pathToPlotlyDist,
    constants.pathToPlotlyDistWithMeta,
    constants.pathToPlotlyGeoAssetsDist
];

function headerLicense(path) {
    prependFile(path, constants.licenseDist + '\n', function(err) {
        if(err) throw err;
    });
}

pathsDist.forEach(headerLicense);


// add or update header to src files

// remove leading '/*' and trailing '*/' for comparison with falafel output
var licenseSrc = constants.licenseSrc;
var licenseStr = licenseSrc.substring(2, licenseSrc.length - 2);

var srcGlob = path.join(constants.pathToSrc, '**/*.js');
var libGlob = path.join(constants.pathToLib, '**/*.js');
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

                codeLines.splice(header.loc.start.line-1, header.loc.end.line);

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

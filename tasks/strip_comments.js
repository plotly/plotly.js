var path = require('path');
var fs = require('fs');
var glob = require('glob');
var stripComments = require('strip-comments');

var constants = require('./util/constants');

function removeCommentsFromUnminifiedBundles() {
    var distGlob = path.join(constants.pathToDist, '**/plotly*.js');

    glob(distGlob, function(err, allFileNames) {
        allFileNames.forEach(function(fileName) {
            if(
                -1 === fileName.indexOf('.min.js') &&
                -1 === fileName.indexOf('-with-meta') && // keeps all the comments in plotly-with-meta
                -1 === fileName.indexOf('geo-assets.js') &&
                -1 === fileName.indexOf('plotly-locale-')
            ) {
                console.log('processing:', fileName);

                var fileIn = fs.openSync(fileName, 'r');
                var strIn = fs.readFileSync(fileIn, 'utf8');

                var fileOut = fs.openSync(fileName, 'w');
                var strOut = stripComments(strIn, {
                    line: true,
                    block: true,
                    preserveNewlines: false
                });

                fs.writeFileSync(fileOut, strOut);
            }
        });
    });
}

removeCommentsFromUnminifiedBundles();

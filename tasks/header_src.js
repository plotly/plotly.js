var path = require('path');
var fs = require('fs');
var falafel = require('falafel');
var glob = require('glob');

var constants = require('./util/constants');
var common = require('./util/common');

function updateHeadersInSrcAndLibFiles() {
    var srcGlob = path.join(constants.pathToSrc, '**/*.js');
    var libGlob = path.join(constants.pathToLib, '**/*.js');

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

                // if header and license are the same remove the header!
                if(isRedundant(header)) {
                    var codeLines = code.split('\n');

                    codeLines.splice(header.loc.start.line - 1, header.loc.end.line);

                    var i;
                    for(i = 0; i < codeLines.length; i++) {
                        if(codeLines[i]) {
                            break;
                        }
                    }

                    var newCode = codeLines.splice(i).join('\n');

                    common.writeFile(file, newCode);
                }
            });
        });
    });

    function isRedundant(header) {
        return (
            header.value.replace(/\s+$/gm, '') ===
            licenseStr.replace(/\s+$/gm, '')
        );
    }
}

updateHeadersInSrcAndLibFiles();

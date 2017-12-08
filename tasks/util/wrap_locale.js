var fs = require('fs');
var path = require('path');

var minify = require('minify-stream');
var intoStream = require('into-stream');
var addStream = require('add-stream');

var constants = require('./constants');

var prefix = 'Plotly.register(';
var suffix = ');';

/** Wrap a locale json file into a standalone js file
 *
 * @param {string} pathToInput path to the locale json file
 * @param {string} pathToOutput path to destination file
 *
 * Logs basename of bundle when completed.
 */
module.exports = function wrap_locale(pathToInput, pathToOutput) {
    intoStream(prefix)
        .pipe(addStream(fs.createReadStream(pathToInput)))
        .pipe(addStream(intoStream(suffix)))
        .pipe(minify(constants.uglifyOptions))
        .pipe(fs.createWriteStream(pathToOutput))
        .on('finish', function() {
            logger(pathToOutput);
        });
};

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);

    console.log(log);
}

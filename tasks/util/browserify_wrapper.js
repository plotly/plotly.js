var fs = require('fs');
var path = require('path');

var browserify = require('browserify');
var UglifyJS = require('uglify-js');

var constants = require('./constants');
var compressAttributes = require('./compress_attributes');
var patchMinified = require('./patch_minified');

/** Convenience browserify wrapper
 *
 * @param {string} pathToIndex path to index file to bundle
 * @param {string} pathToBunlde path to destination bundle
 *
 * @param {object} opts
 *
 *  Browserify options:
 *  - standalone {string}
 *  - debug {boolean} [optional]
 *
 *  Additional option:
 *  - pathToMinBundle {string} path to destination minified bundle
 *
 * Outputs one bundle (un-minified) file if opts.pathToMinBundle is omitted
 * or opts.debug is true. Otherwise outputs two file: one un-minified bundle and
 * one minified bundle.
 *
 * Logs basename of bundle when completed.
 */
module.exports = function _bundle(pathToIndex, pathToBundle, opts) {
    opts = opts || {};

    // do we output a minified file?
    var pathToMinBundle = opts.pathToMinBundle,
        outputMinified = !!pathToMinBundle && !opts.debug;

    var browserifyOpts = {};
    browserifyOpts.standalone = opts.standalone;
    browserifyOpts.debug = opts.debug;
    browserifyOpts.transform = outputMinified ? [compressAttributes] : [];

    var b = browserify(pathToIndex, browserifyOpts),
        bundleWriteStream = fs.createWriteStream(pathToBundle);

    bundleWriteStream.on('finish', function() {
        logger(pathToBundle);
    });

    b.bundle(function(err, buf) {
        if(err) throw err;

        if(outputMinified) {
            var minifiedCode = UglifyJS.minify(buf.toString(), constants.uglifyOptions).code;
            minifiedCode = patchMinified(minifiedCode);

            fs.writeFile(pathToMinBundle, minifiedCode, function(err) {
                if(err) throw err;

                logger(pathToMinBundle);
            });
        }
    })
    .pipe(bundleWriteStream);
};

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);

    console.log(log);
}

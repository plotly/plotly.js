var fs = require('fs');
var path = require('path');

var browserify = require('browserify');
<<<<<<< HEAD
var bubleify = require('bubleify');
=======
>>>>>>> bundle-up
var minify = require('minify-stream');

var constants = require('./constants');
var compressAttributes = require('./compress_attributes');
var strictD3 = require('./strict_d3');

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
    var pathToMinBundle = opts.pathToMinBundle;
    var outputMinified = !!pathToMinBundle;

    var browserifyOpts = {};
    browserifyOpts.standalone = opts.standalone;
    browserifyOpts.debug = opts.debug;
    browserifyOpts.transform = outputMinified ? [compressAttributes] : [];

    if(opts.debug) {
        browserifyOpts.transform.push(strictD3);
    }

    var b = browserify(pathToIndex, browserifyOpts);

    var bundleStream = b.bundle(function(err) {
        if(err) throw err;
    });

    if(outputMinified) {
        bundleStream
            .pipe(minify(constants.uglifyOptions))
            .pipe(fs.createWriteStream(pathToMinBundle))
            .on('finish', function() {
                logger(pathToMinBundle);
            });
    }

    bundleStream
        .pipe(fs.createWriteStream(pathToBundle))
        .on('finish', function() {
            logger(pathToBundle);
            if(opts.then) {
                opts.then();
            }
        });
};

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);

    console.log(log);
}

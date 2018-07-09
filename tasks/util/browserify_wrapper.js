var fs = require('fs');
var path = require('path');

var browserify = require('browserify');
var minify = require('minify-stream');

var compressAttributes = require('./compress_attributes');
var strictD3 = require('./strict_d3');

/** Convenience browserify wrapper
 *
 * @param {string} pathToIndex path to index file to bundle
 * @param {string} pathToBunlde path to destination bundle
 * @param {object} opts
 *  Browserify options:
 *  - standalone {string}
 *  - debug {boolean} [optional]
 *  Additional option:
 *  - pathToMinBundle {string} path to destination minified bundle
 *  - compressAttrs {boolean} do we compress attribute meta?
 * @param {function} cb callback
 *
 * Outputs one bundle (un-minified) file if opts.pathToMinBundle is omitted
 * or opts.debug is true. Otherwise outputs two file: one un-minified bundle and
 * one minified bundle.
 *
 * Logs basename of bundle when completed.
 */
module.exports = function _bundle(pathToIndex, pathToBundle, opts, cb) {
    opts = opts || {};

    var pathToMinBundle = opts.pathToMinBundle;

    var browserifyOpts = {};
    browserifyOpts.standalone = opts.standalone;
    browserifyOpts.debug = opts.debug;

    browserifyOpts.transform = [];
    if(opts.compressAttrs) {
        browserifyOpts.transform.push(compressAttributes);
    }
    if(opts.debug) {
        browserifyOpts.transform.push(strictD3);
    }

    var b = browserify(pathToIndex, browserifyOpts);
    var pending = pathToMinBundle ? 2 : 1;

    function done() {
        if(cb && --pending === 0) cb(null);
    }

    var bundleStream = b.bundle(function(err) {
        if(err) {
            if(cb) cb(err);
            else throw err;
        }
    });

    if(pathToMinBundle) {
        var uglifyOptions = {
            ecma: 5,
            mangle: true,
            compress: true,
            output: {
                beautify: false,
                ascii_only: true
            },
            sourceMap: false
        };

        // need this to make mapbox-gl work in minified bundles
        // see https://github.com/plotly/plotly.js/issues/2787
        var fname = path.basename(pathToMinBundle);
        if(fname === 'plotly.min.js' || fname === 'plotly-mapbox.min.js') {
            uglifyOptions.compress = {typeofs: false};
        }

        bundleStream
            .pipe(minify(uglifyOptions))
            .pipe(fs.createWriteStream(pathToMinBundle))
            .on('finish', function() {
                logger(pathToMinBundle);
                done();
            });
    }

    bundleStream
        .pipe(fs.createWriteStream(pathToBundle))
        .on('finish', function() {
            logger(pathToBundle);
            done();
        });
};

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);
    console.log(log);
}

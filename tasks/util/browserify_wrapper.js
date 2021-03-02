var fs = require('fs');
var path = require('path');

var browserify = require('browserify');
var minify = require('minify-stream');
var derequire = require('derequire');
var through = require('through2');

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
 *  - noCompress {boolean} skip attribute meta compression?
 * @param {function} cb callback
 *
 * Outputs one bundle (un-minified) file if opts.pathToMinBundle is omitted.
 * Otherwise outputs two file: one un-minified bundle and one minified bundle.
 *
 * Logs basename of bundle when completed.
 */
module.exports = function _bundle(pathToIndex, pathToBundle, opts, cb) {
    opts = opts || {};

    var pathToMinBundle = opts.pathToMinBundle;

    var browserifyOpts = {};
    browserifyOpts.standalone = opts.standalone;
    browserifyOpts.debug = opts.debug;

    if(opts.noCompress) {
        browserifyOpts.ignoreTransform = './tasks/compress_attributes.js';
    }

    browserifyOpts.transform = [];
    if(opts.debug) {
        browserifyOpts.transform.push(strictD3);
    }

    var b = browserify(pathToIndex, browserifyOpts);
    var pending = (pathToMinBundle && pathToBundle) ? 2 : 1;

    function done() {
        if(cb && --pending === 0) {
            if(opts.deleteIndex) {
                console.log('delete', pathToIndex);
                fs.unlinkSync(pathToIndex, {});
            }

            cb(null);
        }
    }

    var bundleStream = b.bundle(function(err) {
        if(err) {
            if(cb) cb(err);
            else throw err;
        }
    });

    if(pathToMinBundle) {
        var minifyOpts = {
            ecma: 5,
            mangle: true,
            output: {
                beautify: false,
                ascii_only: true
            },

            sourceMap: false
        };

        bundleStream
            .pipe(applyDerequire())
            .pipe(minify(minifyOpts))
            .pipe(fs.createWriteStream(pathToMinBundle))
            .on('finish', function() {
                logger(pathToMinBundle);
                done();
            });
    }

    if(pathToBundle) {
        bundleStream
            .pipe(applyDerequire())
            .pipe(fs.createWriteStream(pathToBundle))
            .on('finish', function() {
                logger(pathToBundle);
                done();
            });
    }
};

function logger(pathToOutput) {
    var log = 'ok ' + path.basename(pathToOutput);
    console.log(log);
}

function applyDerequire() {
    var buf = '';
    return through(function(chunk, enc, next) {
        buf += chunk.toString();
        next();
    }, function(done) {
        this.push(derequire(buf));
        done();
    });
}

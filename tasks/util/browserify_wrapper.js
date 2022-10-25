var path = require('path');

var webpack = require('webpack');

var config = require('../../webpack.config.js');

/** Convenience bundle wrapper
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

    if(!opts.noCompress) {
        config.module.rules.push({
            test: /\.js$/,
            use: [
                'ify-loader'
            ]
        });
    }

    config.entry = pathToIndex;

    var pending = (pathToMinBundle && pathToBundle) ? 2 : 1;

    var parsedPath;
    parsedPath = path.parse(pathToBundle);
    config.output.path = parsedPath.dir;
    config.output.filename = parsedPath.base;

    config.optimization = {
        minimize: pending === 1 && pathToMinBundle
    };

    var compiler = webpack(config);

    compiler.run(function(err, stats) {
        console.log(stats);

        if(err) {
            console.log('err:', err);
        } else {
            console.log('success:', config.output.path + '/' + config.output.filename);

            if(pending === 2) {
                parsedPath = path.parse(pathToMinBundle);
                config.output.path = parsedPath.dir;
                config.output.filename = parsedPath.base;

                config.optimization = {
                    minimize: true
                };

                compiler = webpack(config);

                compiler.run(function(err, stats) {
                    console.log(stats);

                    if(err) {
                        console.log('err:', err);
                    } else {
                        console.log('success:', config.output.path + '/' + config.output.filename);

                        if(cb) cb();
                    }
                });
            } else {
                if(cb) cb();
            }
        }
    });
};

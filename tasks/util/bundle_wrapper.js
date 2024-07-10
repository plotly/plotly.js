var path = require('path');

var webpack = require('webpack');

var config = require('../../webpack.config.js');

var nRules = config.module.rules.length;

/** Convenience bundle wrapper
 *
 * @param {string} pathToIndex path to index file to bundle
 * @param {string} pathToBunlde path to destination bundle
 * @param {object} opts
 *  Bundle options:
 *  - standalone {string}
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

    config.module.rules[nRules] = opts.noCompress ? {} : {
        test: /\.js$/,
        use: [
            'transform-loader?' + path.resolve(__dirname, '../../tasks/compress_attributes.js')
        ]
    };

    config.entry = pathToIndex;

    var pending = (pathToMinBundle && pathToBundle) ? 2 : 1;

    var parsedPath;
    parsedPath = path.parse(pathToBundle || pathToMinBundle);
    config.output.path = parsedPath.dir;
    config.output.filename = parsedPath.base;

    config.output.library.name = opts.standalone || 'Plotly';

    config.optimization = {
        minimize: !!(pathToMinBundle && pending === 1)
    };

    var compiler = webpack(config);

    compiler.run(function(err, stats) {
        if(err) {
            console.log('err:', err);
        } if(stats.errors && stats.errors.length) {
            console.log('stats.errors:', stats.errors);
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
                    if(err) {
                        console.log('err:', err);
                    } else if(stats.errors && stats.errors.length) {
                        console.log('stats.errors:', stats.errors);
                    } else if(stats.compilation && stats.compilation.errors && stats.compilation.errors.length) {
                        console.log('stats.compilation.errors:', stats.compilation.errors);
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

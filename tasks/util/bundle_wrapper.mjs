import { build } from 'esbuild';

import esbuildConfig from '../../esbuild-config.js';
import browserifyAdapter from 'esbuild-plugin-browserify-adapter';

import transform from '../../tasks/compress_attributes.js';

var basePlugins = esbuildConfig.plugins;

/** Convenience bundle wrapper
 *
 * @param {string} pathToIndex path to index file to bundle
 * @param {string} pathToBunlde path to destination bundle
 * @param {object} opts
 *  Bundle options:
 *  - standalone {string}
 *  Additional option:
 *  - noCompressAttributes {boolean} skip attribute meta compression?
 * @param {function} cb callback
 *
 * Otherwise outputs two file: one un-minified bundle and one minified bundle.
 *
 * Logs basename of bundle when completed.
 */
export default async function _bundle(pathToIndex, pathToBundle, opts, cb) {
    opts = opts || {};

    var config = {...esbuildConfig};

    config.entryPoints = [pathToIndex];
    config.outfile = pathToBundle;
    config.minify = !!opts.minify;

    if(!opts.noCompressAttributes) {
        config.plugins = basePlugins.concat([browserifyAdapter(transform)]);
    }

    if(opts.noPlugins) config.plugins = [];

    await build(config);
    if(cb) cb();
}

import path from 'path';

import { build } from 'esbuild';
import config from '../../esbuild-config.mjs';

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
export default async function _bundle(pathToIndex, pathToBundle, opts, cb) {
    opts = opts || {};

    var pathToMinBundle = opts.pathToMinBundle;

    /*
    config.module.rules.push(opts.noCompress ? {} : {
        test: /\.js$/,
        use: [
            'transform-loader?' + path.resolve(__dirname, '../../tasks/compress_attributes.js')
        ]
    });
    */

    config.entryPoints = [pathToIndex];

    var pending = (pathToMinBundle && pathToBundle) ? 2 : 1;

    config.outfile = pathToBundle || pathToMinBundle;

    config.minify = !!(pathToMinBundle && pending === 1);

    await build(config);

    if(pending === 2) {
        config.minify = true;
        await build(config);
    }

    if(cb) cb();
}

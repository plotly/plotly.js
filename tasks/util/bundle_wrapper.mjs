import fs from 'fs';
import fsExtra from 'fs-extra';
import prependFile from 'prepend-file';

import { build } from 'esbuild';

import esbuildConfig from '../../esbuild-config.js';
import browserifyAdapter from 'esbuild-plugin-browserify-adapter';

import transform from '../../tasks/compress_attributes.js';
import common from './common.js';

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

    addWrapper(pathToBundle);

    if(pathToBundle.endsWith('.js')) {
        var len = pathToBundle.length;
        var cssOutput = pathToBundle.slice(0, len - 3) + '.css';

        // remove unwanted css file
        if (fs.existsSync(cssOutput)) {
            fs.unlinkSync(cssOutput);
        }
    }

    if(cb) cb();
}

// Until https://github.com/evanw/esbuild/pull/513 is merged
// Thanks to https://github.com/prantlf and https://github.com/birkskyum
function addWrapper(path){
    prependFile.sync(
        path,
        [
            '(',
            ' function(root, factory) {',
            '  if (typeof module === "object" && module.exports) {',
            '   module.exports = factory();',
            '  } else {',
            '   root.moduleName = factory();',
            '  }',
            '} (typeof self !== "undefined" ? self : this, () => {',
            ''
        ].join('\n'),
        common.throwOnError
    );

    fsExtra.appendFile(
        path,
        [
            '',
            'window.Plotly = Plotly;',
            'return Plotly;',
            '}));',
        ].join('\n'),
        common.throwOnError
    );
}

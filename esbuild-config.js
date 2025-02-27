var glsl = require('esbuild-plugin-glsl').glsl;
var environmentPlugin = require('esbuild-plugin-environment').environmentPlugin;
const stylePlugin = require('esbuild-style-plugin');

module.exports = {
    entryPoints: ['./lib/index.js'],
    format: 'iife',
    globalName: 'Plotly',
    bundle: true,
    minify: false,
    sourcemap: false,
    plugins: [
        stylePlugin(),
        glsl({
            minify: true,
        }),
        environmentPlugin({
            NODE_DEBUG: false,
        }),
    ],
    alias: {
        stream: 'stream-browserify',
    },
    define: {
        global: 'window',
        'define.amd': 'false',
    },
    target: 'es2016',
    logLevel: 'info',
};

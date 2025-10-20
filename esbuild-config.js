const { environmentPlugin } = require('esbuild-plugin-environment');
const { glsl } = require('esbuild-plugin-glsl');
const InlineCSSPlugin = require('esbuild-plugin-inline-css');
const path = require('path');
const constants = require('./tasks/util/constants.js');

// Default config used when building library
const esbuildConfig = {
    entryPoints: ['./lib/index.js'],
    format: 'iife',
    globalName: 'Plotly',
    bundle: true,
    minify: false,
    sourcemap: false,
    plugins: [InlineCSSPlugin(), glsl({ minify: true }), environmentPlugin({ NODE_DEBUG: false })],
    alias: {
        stream: 'stream-browserify'
    },
    define: {
        global: 'window',
        'define.amd': 'false'
    },
    target: 'es2016',
    logLevel: 'info'
};

// Config used when building bundle to serve test dashboard
const devtoolsConfig = {
    entryPoints: [path.join(constants.pathToRoot, 'devtools', 'test_dashboard', 'devtools.js')],
    outfile: path.join(constants.pathToRoot, 'build', 'test_dashboard-bundle.js'),
    format: 'cjs',
    globalName: 'Tabs',
    bundle: true,
    minify: false,
    sourcemap: false,
    plugins: [glsl({ minify: true })],
    define: { global: 'window' },
    target: 'es2016',
    logLevel: 'info'
};

// Config used when building plotly.js for local development
const localDevConfig = {
    ...esbuildConfig,
    outfile: './build/plotly.js'
};

// Config used when building bundle to serve regl
const localDevReglCodegenConfig = {
    ...esbuildConfig,
    entryPoints: [path.join(constants.pathToRoot, 'devtools/regl_codegen', 'devtools.js')],
    outfile: './build/regl_codegen-bundle.js',
    sourcemap: false,
    minify: false
};

module.exports = {
    devtoolsConfig,
    esbuildConfig,
    localDevConfig,
    localDevReglCodegenConfig
};

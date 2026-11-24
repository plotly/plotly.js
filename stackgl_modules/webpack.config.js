var path = require('path');

module.exports = {
    target: 'web',
    entry: './main.js',
    output: {
        path: path.resolve('.'),
        filename: 'index.js',
        library: {
            type: 'commonjs-module'
        }
    },
    optimization: {
        minimize: false
    },
    module: {
        rules: [{
            // GLSL has no module system. glslify adds one: it resolves the
            // `#pragma glslify: name = require('glsl-module')` directives in
            // the shader files against node_modules, then inlines the result
            // as a single string. esbuild cannot do this, so webpack bundles
            // these packages here and the output, index.js, is committed.
            test: /\.(js|glsl)$/,
            use: [
                'ify-loader'
            ]
        }]
    }
};

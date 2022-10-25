var path = require('path');
var NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
    target: ['web', 'es5'],
    entry: './lib/index.js',
    output: {
        path: path.resolve('./build'),
        filename: 'plotly.js',
        library: {
            name: 'Plotly',
            type: 'umd',
            umdNamedDefine: true
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }, {
            test: /\.js$/,
            include: /node_modules[\\\/](buffer|pngjs)[\\\/]/,
            use: {
                loader: 'babel-loader',
                options: {
                    babelrc: false,
                    configFile: false,
                    presets: [
                        '@babel/preset-env'
                    ]
                }
            },
        }]
    },
    resolve: {
        fallback: {
            'stream': require.resolve('stream-browserify'),
            'buffer': require.resolve('buffer/'),
            'assert': require.resolve('assert/')
        }
    },
    plugins: [
        new NodePolyfillPlugin({ includeAliases: ['process'] })
    ],
    watchOptions: {
        ignored: [
            '**/node_modules',
            '**/stackgl_modules'
        ],
        poll: 1000, // Check for changes every second
    }
};

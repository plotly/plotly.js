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
            umdNamedDefine: false
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
            include: /node_modules[\\\/](buffer|d3-color|d3-interpolate|is-mobile)[\\\/]/,
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
        }, {
            test: /\.glsl$/,
            include: /node_modules/,
            use: {
                loader: 'raw-loader'
            }
        }, {
            test: /\.(js|glsl)$/,
            use: [
                'ify-loader'
            ]
        }, {
            test: /\.css$/,
            use: [
                'style-loader',
                'css-loader'
            ]
        }]
    },
    resolve: {
        fallback: {
            stream: require.resolve('stream-browserify')
        }
    },
    plugins: [
        new NodePolyfillPlugin({ additionalAliases: ['process'] })
    ],
    watchOptions: {
        ignored: [
            '**/node_modules',
            '**/stackgl_modules'
        ],
        poll: 1000, // Check for changes every second
    }
};

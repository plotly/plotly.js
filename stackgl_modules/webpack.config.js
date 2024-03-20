var path = require('path');

module.exports = {
    target: ['web', 'es5'],
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
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        }, {
            test: /\.js$/,
            include: /node_modules[\\\/](buffer|is-mobile)[\\\/]/,
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
        }]
    }
};

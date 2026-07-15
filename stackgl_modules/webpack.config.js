var path = require('path');

module.exports = {
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

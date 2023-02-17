var path = require('path');

var plotlyjsConfig = require('../webpack.config');

module.exports = {
    target: ['web', 'es5'],
    entry: './main.js',
    output: {
        path: path.resolve('.'),
        filename: 'index.js',
        library: {
            name: 'Stackgl',
            type: 'umd'
        }
    },
    optimization: {
        minimize: false
    },
    module: plotlyjsConfig.module
};

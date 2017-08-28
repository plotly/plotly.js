var imageExporter = require('image-exporter');
var path = require('path');
var constants = require('../../../tasks/util/constants');

function run(input, argv, write) {
    argv = argv || {};

    if(!Array.isArray(input) || input.length === 0) {
        throw new Error('Empty input list');
    }

    var app = imageExporter.run({
        input: input,
        write: write,
        parallelLimit: argv.queue ? 1 : argv['parallel-limit'],
        debug: argv.debug,
        component: {
            name: 'plotly-graph',
            options: {
                plotlyJS: constants.pathToPlotlyBuild,
                mapboxAccessToken: constants.mapboxAccessToken,
                mathjax: '',
                topojson: constants.pathToPlotlyGeoAssetsDist
            }
        }
    });

    var failed = [];

    app.on('after-export', function(info) {
        var mockName = getMockName(info);
        console.log('ok ' + mockName);
    });

    app.on('export-error', function(info) {
        var mockName = getMockName(info);

        var msg = 'not ok (' + info.code + '): ' + mockName + ' - ' + info.msg;
        if(info.error) msg += ' ' + info.error;

        console.warn(msg);
        failed.push(msg);
    });

    app.on('renderer-error', function(info) {
        console.warn('renderer error: ' + info.msg);
        console.warn(info.error);
    });

    app.on('after-export-all', function(info) {
        if(info.code === 1) {
            console.log('\nFailed test(s):');
            console.log(failed.join('\n'));
        }
    });

    function getMockName(info) {
        var item = input[info.itemIndex];
        var mockPath = item.figure ? item.figure : item;
        var mockName = path.parse(mockPath).name;
        return mockName;
    }

    return app;
}

module.exports = run;

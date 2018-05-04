var orca = require('orca/src');
var constants = require('../../../tasks/util/constants');

function run(mockList, input, argv, write) {
    argv = argv || {};

    if(!Array.isArray(mockList) || mockList.length === 0) {
        errorOut('Empty mockList list');
    }
    if(!Array.isArray(input) || input.length === 0) {
        errorOut('Empty input list');
    }
    if(mockList.length !== input.length) {
        errorOut('mockList and input must have same length');
    }

    var app = orca.run({
        input: input,
        write: function(info, _, done) { write(info, done); },
        parallelLimit: argv.queue ? 1 : argv['parallel-limit'],
        debug: process.env.DEBUG,
        component: {
            name: 'plotly-graph',
            options: {
                plotlyJS: constants.pathToPlotlyBuild,
                mapboxAccessToken: constants.mapboxAccessToken,
                mathjax: constants.pathToMathJax,
                topojson: constants.pathToPlotlyGeoAssetsDist
            }
        }
    });

    var failed = [];

    app.on('after-export', function(info) {
        var mockName = mockList[info.itemIndex];
        console.log('ok ' + mockName);
    });

    app.on('export-error', function(info) {
        var mockName = mockList[info.itemIndex];

        var msg = 'not ok ' + mockName + ' - ' + info.msg;
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
        process.exit(info.code);
    });

    return app;
}

function errorOut(msg) {
    console.error(msg);
    process.exit(1);
}

module.exports = run;

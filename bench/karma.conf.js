/* eslint-env node*/

var pkg = require('../package.json');
var execSync = require('child_process').execSync;

function func(config) {
    func.defaultConfig.logLevel = config.LOG_INFO;
    func.defaultConfig.browserConsoleLogOptions = {level: 'log'};
    config.set(func.defaultConfig);
}

func.defaultConfig = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'benchmark'],
    reporters: ['benchmark', 'benchmark-json'],

    // list of files / patterns to load in the browser
    files: [
        '../build/plotly.js',
        './suites/*_bench.js'
    ],

    preprocessors: {
        './suites/*_bench.js': ['browserify']
    },

    browserify: {
        transform: ['../tasks/util/shortcut_paths.js'],
        extensions: ['.js'],
        debug: true
    },

    benchmarkJsonReporter: {
        pathToJson: '../dist/benchmarks.json',
        formatOutput: function(results) {
            return {
                meta: {
                    version: pkg.version,
                    commit: execSync('git rev-parse HEAD').toString().replace('\n', ''),
                    date: (new Date()).toTimeString()
                },
                results: results
            };
        }
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // how long will Karma wait for a message from a browser before disconnecting (30 ms)
    browserNoActivityTimeout: 30000,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome_WindowSized'],

    // custom browser options
    //
    // window-size values came from observing default size
    //
    // '--ignore-gpu-blacklist' allow to test WebGL on CI (!!!)
    customLaunchers: {
        Chrome_WindowSized: {
            base: 'Chrome',
            flags: ['--window-size=1035,617', '--ignore-gpu-blacklist']
        },
        Firefox_WindowSized: {
            base: 'Firefox',
            flags: ['--width=1035', '--height=617']
        }
    }
};

module.exports = func;

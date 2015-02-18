// Karma configuration
// Generated on Wed Sep 10 2014 15:06:40 GMT-0700 (PDT)

function func(config){

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    func.defaultConfig.logLevel = config.LOG_INFO;

    config.set(func.defaultConfig);
}

func.defaultConfig = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
        '../plugins/jquery-1.8.3.min.js',
        '../plugins/streamhead-bundle.js',
        '../plugins/d3.v3.min.js',
        '../plugins/png.js',
        '../plugins/tinycolor.js',
        '../lib.js', // soon this all will get replaced with the plotly.js bundle...
        '../plotly_util.js',
        '../axes.js',
        '../graph_obj.js',
        '../color.js',
        '../drawing.js',
        '../scatter.js',
        '../annotations.js',
        '../bars.js',
        '../boxes.js',
        '../colorbar.js',
        '../contour.js',
        '../errorbars.js',
        '../graph_interact.js',
        '../heatmap.js',
        '../histogram.js',
        '../legend.js',
        '../storage.js',
        '../modebar.js',
        '../plugins/promise-4.0.0.min.js',
        '../plugins/promise-done-1.0.0.js', // end plotly.js bundle
        '../graph_reference.js',
        '../themes.js',
        '../graph_edit.js',
        '../plot_tile.js',
        '*_test.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        '../themes.js': ['coverage'],
        '../graph_edit.js': ['coverage']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // optionally, configure the reporter
    coverageReporter: {
        type : 'html',
        dir : 'htmlcov/'
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
};


module.exports = func;

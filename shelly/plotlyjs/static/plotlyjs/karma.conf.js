// Karma configuration
// Generated on Wed Sep 10 2014 15:06:40 GMT-0700 (PDT)

function func(config){

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    func.defaultConfig.logLevel = config.LOG_INFO;

    config.set(func.defaultConfig);
}

var shellyStatic = '../../../shelly/static/js/';

func.defaultConfig = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '.',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
        shellyStatic + 'plugins/jquery-1.8.3.min.js',
        //shellyStatic + 'plugins/streamhead-bundle.js',
        shellyStatic + 'plugins/d3.v3.min.js',
        shellyStatic + 'plugins/png.js',
        shellyStatic + 'plugins/tinycolor.js',
        './src/lib.js', // soon this all will get replaced with the plotly.js bundle...
        './src/plotly_util.js',
        './src/axes.js',
        './src/graph_obj.js',
        './src/color.js',
        './src/drawing.js',
        './src/scatter.js',
        './src/annotations.js',
        './src/shapes.js',
        './src/bars.js',
        './src/boxes.js',
        './src/colorbar.js',
        './src/contour.js',
        './src/errorbars.js',
        './src/graph_interact.js',
        './src/heatmap.js',
        './src/histogram.js',
        './src/legend.js',
        './src/modebar.js',
        shellyStatic + 'plugins/promise-4.0.0.min.js', // end plotly.js bundle
        'tests/*_test.js'
    ],

    // list of files to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        './src/axes.js': ['coverage'],
        './src/graph_obj.js': ['coverage'],
        './src/lib.js': ['coverage'],
        './src/modebar.js': ['coverage']
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
    browsers: ['Firefox'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
};


module.exports = func;

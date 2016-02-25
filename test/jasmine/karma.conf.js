/*eslint-env node*/

// Karma configuration

/*
 * Test file globs can be passed with an argument.
 *
 * Example:
 *
 *  $ npm run test-jasmine -- tests/axes_test.js
 *
 * will only run the tests in axes_test.js
 *
 */
var testFileGlob = process.argv[4] ? process.argv[4] : 'tests/*_test.js';


function func(config) {

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
    frameworks: ['jasmine', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
        'assets/jquery-1.8.3.min.js',
        testFileGlob
    ],

    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    //
    // N.B. this field is filled below
    preprocessors: {},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

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
    singleRun: false,

    browserify: {
        transform: ['../../tasks/util/shortcut_paths.js'],
        extensions: ['.js'],
        watch: true,
        debug: true
    }
};

// browserify the test files
func.defaultConfig.preprocessors[testFileGlob] = ['browserify'];

module.exports = func;

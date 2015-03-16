// Karma configuration
// Generated on Mon Sep 15 2014 15:00:51 GMT-0400 (EDT)

function func(config){

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    func.defaultConfig.logLevel = config.LOG_INFO;

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    func.defaultConfig.singleRun = true;

    func.defaultConfig.autoWatch = false;

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    func.defaultConfig.preprocessors = {
        '../themes.js': ['coverage'],
        '../graph_edit.js': ['coverage']
    };

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    func.defaultConfig.reporters = ['progress', 'coverage'];

    func.defaultConfig.coverageReporter = {
        type : 'html',
        dir : 'htmlcov/'
    };

    config.set(func.defaultConfig);
}

func.defaultConfig = require('./karma.conf').defaultConfig;
module.exports = func;

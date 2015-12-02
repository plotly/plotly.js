// Karma configuration

function func(config) {

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    func.defaultConfig.logLevel = config.LOG_INFO;

    // Continuous Integration mode

    // exclude the WebGL interaction test on circle runs
    func.defaultConfig.exclude = ['tests/gl_plot_interact_test.js'];

    // if true, Karma captures browsers, runs the tests and exits
    func.defaultConfig.singleRun = true;

    func.defaultConfig.browserNoActivityTimeout = 30000; // 30 seconds

    func.defaultConfig.autoWatch = false;

    func.defaultConfig.browsers = ['Firefox'];


    config.set(func.defaultConfig);
}

func.defaultConfig = require('./karma.conf').defaultConfig;
module.exports = func;

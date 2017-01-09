// Karma configuration

function func(config) {

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    func.defaultConfig.logLevel = config.LOG_INFO;

    // Note: config.LOG_DEBUG may not be verbose enough to pin down the source of failed tests.
    // See the note in CONTRIBUTING.md about karma-verbose-reporter:
    // func.defaultConfig.reporters = ['verbose'];


    // Continuous Integration mode

    /*
     * WebGL interaction test cases fail on the CircleCI
     * most likely due to a WebGL/driver issue;
     * exclude them from the CircleCI test bundle.
     *
     */
    func.defaultConfig.exclude = [
        'tests/gl_plot_interact_test.js',
        'tests/gl_plot_interact_basic_test.js',
        'tests/gl2d_scatterplot_contour_test.js',
        'tests/gl2d_pointcloud_test.js'
    ];

    // if true, Karma captures browsers, runs the tests and exits
    func.defaultConfig.singleRun = true;

    func.defaultConfig.browserNoActivityTimeout = 30000; // 30 seconds

    func.defaultConfig.autoWatch = false;

    func.defaultConfig.browsers = ['Firefox_WindowSized'];

    config.set(func.defaultConfig);
}

func.defaultConfig = require('./karma.conf').defaultConfig;
module.exports = func;

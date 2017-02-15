/* eslint-env node */

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

var constants = require("../../tasks/util/constants");

var arg = process.argv[4];

var testFileGlob = arg ? arg : "tests/*_test.js";
var isSingleSuiteRun = arg && arg.indexOf("bundle_tests/") === -1;
var isRequireJSTest = arg && arg.indexOf("bundle_tests/requirejs") !== -1;
var isIE9Test = arg && arg.indexOf("bundle_tests/ie9") !== -1;

var pathToMain = "../../lib/index.js";
var pathToJQuery = "assets/jquery-1.8.3.min.js";

function func(config) {
  // level of logging
  // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
  //
  // NB: if you try config.LOG_DEBUG, you may actually be looking for karma-verbose-reporter.
  //     See CONTRIBUTING.md for additional notes on reporting.
  func.defaultConfig.logLevel = config.LOG_INFO;

  config.set(func.defaultConfig);
}

func.defaultConfig = {
  // base path that will be used to resolve all patterns (eg. files, exclude)
  basePath: ".",
  // frameworks to use
  // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
  frameworks: ["jasmine", "browserify"],
  // list of files / patterns to load in the browser
  //
  // N.B. this field is filled below
  files: [],
  exclude: [],
  // preprocess matching files before serving them to the browser
  // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
  //
  // N.B. this field is filled below
  preprocessors: {},
  // test results reporter to use
  // possible values: 'dots', 'progress'
  // available reporters: https://npmjs.org/browse/keyword/karma-reporter
  //
  // See note in CONTRIBUTING.md about more verbose reporting via karma-verbose-reporter:
  // https://www.npmjs.com/package/karma-verbose-reporter ('verbose')
  //
  reporters: ["progress"],
  // web server port
  port: 9876,
  // enable / disable colors in the output (reporters and logs)
  colors: true,
  // enable / disable watching file and executing tests whenever any file changes
  autoWatch: true,
  // start these browsers
  // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
  browsers: ["Chrome_WindowSized"],
  // custom browser options
  // window-size values came from observing default size
  customLaunchers: {
    Chrome_WindowSized: {
      base: "Chrome",
      flags: ["--window-size=1035,617", "--ignore-gpu-blacklist"]
    },
    Firefox_WindowSized: {
      base: "Firefox",
      flags: ["--width=1035", "--height=617"]
    }
  },
  // Continuous Integration mode
  // if true, Karma captures browsers, runs the tests and exits
  singleRun: false,
  browserify: {
    transform: ["../../tasks/util/shortcut_paths.js"],
    extensions: [".js"],
    watch: true,
    debug: true
  }
};

// Add lib/index.js to single-suite runs,
// to avoid import conflicts due to plotly.js
// circular dependencies.
if (isSingleSuiteRun) {
  func.defaultConfig.files = [pathToJQuery, pathToMain, testFileGlob];

  func.defaultConfig.preprocessors[pathToMain] = ["browserify"];
  func.defaultConfig.preprocessors[testFileGlob] = ["browserify"];
} else if (isRequireJSTest) {
  func.defaultConfig.files = [
    constants.pathToRequireJS,
    constants.pathToRequireJSFixture,
    testFileGlob
  ];
} else if (isIE9Test) {
  // load ie9_mock.js before plotly.js+test bundle
  // to catch reference errors that could occur
  // when plotly.js is first loaded.
  func.defaultConfig.files = ["./assets/ie9_mock.js", testFileGlob];

  func.defaultConfig.preprocessors[testFileGlob] = ["browserify"];
} else {
  func.defaultConfig.files = [pathToJQuery, testFileGlob];

  func.defaultConfig.preprocessors[testFileGlob] = ["browserify"];
}

module.exports = func;

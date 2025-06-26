var path = require('path');
var exec = require('child_process').exec;
var { glob } = require('glob');
var runSeries = require('run-series');

var constants = require('./util/constants');
var pathToJasminePerformanceTests = constants.pathToJasminePerformanceTests;

/**
 * Run all jasmine 'performance' test in series
 *
 * To run specific performance tests, use
 *
 * $ npm run test-jasmine -- --performanceTest=<name-of-suite>
 */

var testCases = require('../test/jasmine/performance_tests/assets/test_cases').testCases;

glob(pathToJasminePerformanceTests + '/*.js').then(function(files) {
    var tasks = [];
    for(let file of files) {
        for(let testCase of testCases) {
            tasks.push(function(cb) {
                var cmd = [
                    'karma', 'start',
                    path.join(constants.pathToRoot, 'test', 'jasmine', 'karma.conf.js'),
                    '--performanceTest=' + path.basename(file),
                    '--nowatch',
                    '--tracesType=' + testCase.traceType,
                    '--tracesMode=' + testCase.mode,
                    '--tracesCount=' + testCase.nTraces,
                    '--tracesPoints=' + testCase.n,
                ].join(' ');

                console.log('Running: ' + cmd);

                exec(cmd, function(err) {
                    cb(null, err);
                }).stdout.pipe(process.stdout);
            });
        }
    }

    runSeries(tasks, function(err, results) {
        if(err) throw err;

        var failed = results.filter(function(r) { return r; });

        if(failed.length) {
            console.log('\ntest-performance summary:');
            failed.forEach(function(r) { console.warn('- ' + r.cmd + ' failed'); });
            console.log('');
            process.exit(1);
        }
    });
});

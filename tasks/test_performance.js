var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var { glob } = require('glob');
var runSeries = require('run-series');

var constants = require('./util/constants');
var pathToJasminePerformanceTests = constants.pathToJasminePerformanceTests;
var pathToRoot = constants.pathToRoot;

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
        var failed = results.filter(function(r) { return r; });

        if(failed.length) {
            console.log('\ntest-performance summary:');
            failed.forEach(function(r) { console.warn('- ' + r.cmd + ' failed'); });
            console.log('');

            // Create CSV file for failed cases
            var str = [
                'number of traces',
                'chart type & mode',
                'data points',
                'run id',
                'rendering time(ms)'
            ].join(',') + '\n';

            failed.forEach(function(r) {
                // split command string frist by space then by equal to get
                var cmdArgs = r.cmd.split(' ').map(part => {
                    return part.split('=');
                });

                var test = {};

                for(var i = 0; i < cmdArgs.length; i++) {
                    if('--tracesCount' === cmdArgs[i][0]) {
                        test.nTraces = cmdArgs[i][1];
                    }
                }

                for(var i = 0; i < cmdArgs.length; i++) {
                    if('--tracesType' === cmdArgs[i][0]) {
                        test.traceType = cmdArgs[i][1];
                    }
                }

                for(var i = 0; i < cmdArgs.length; i++) {
                    if('--tracesMode' === cmdArgs[i][0]) {
                        test.mode = cmdArgs[i][1];
                    }
                }

                for(var i = 0; i < cmdArgs.length; i++) {
                    if('--tracesPoints' === cmdArgs[i][0]) {
                        test.n = cmdArgs[i][1];
                    }
                }

                str += [
                    (test.nTraces || 1),
                    (test.traceType + (test.mode ? ' ' + test.mode : '')),
                    test.n,
                    'failed',
                    ''
                ].join(',') + '\n';
            });

            var failedCSV = pathToRoot + '../Downloads/failed.csv';
            console.log('Saving:', failedCSV)
            console.log(str);
            fs.writeFileSync(failedCSV, str);
        }
    });
});

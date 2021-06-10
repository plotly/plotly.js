var minimist = require('minimist');
var path = require('path');
var spawn = require('child_process').spawn;

var getMockList = require('./assets/get_mock_list');

/**
 *  Baseline image generation script.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining the baseline(s) to be generated
 *
 *  Examples:
 *
 *  Generate or (re-generate) all baselines:
 *
 *      npm run baseline
 *
 *  Generate or (re-generate) the 'contour_nolines' baseline:
 *
 *      npm run baseline -- contour_nolines
 *
 *  Generate or (re-generate) all gl3d baseline:
 *
 *      npm run baseline -- gl3d_*
 *
 */

var argv = minimist(process.argv.slice(2), {});

var allMockList = [];
argv._.forEach(function(pattern) {
    var mockList = getMockList(pattern);

    if(mockList.length === 0) {
        throw new Error('No mocks found with pattern ' + pattern);
    }

    allMockList = allMockList.concat(mockList);
});

if(allMockList.length) console.log(allMockList);
console.log('Please wait for the process to complete.');

var p = spawn(
    'python3',
    [
        path.join('test', 'image', 'make_baseline.py'),
        '= ' + allMockList.join(' ')
    ]
);
try {
    p.stdout.on('data', function(data) {
        console.log(data.toString());
    });
} catch(e) {
    console.error(e.stack);
    p.exit(1);
}

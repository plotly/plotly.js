var fs = require('fs');
var PNG = require('pngjs').PNG;
var pixelmatch = require('pixelmatch');
var parallel = require('run-parallel');

var run = require('./assets/run');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

var argv = require('minimist')(process.argv.slice(2), {
    'boolean': ['queue', 'help', 'debug'],
    'string': ['parallel-limit', 'threshold'],
    'alias': {
        help: ['h', 'info']
    },
    'default': {
        queue: false,
        help: false,
        debug: false,
        threshold: 1e-6,
        'parallel-limit': 4
    }
});

var IS_CI = process.env.CIRCLECI;

if(argv.help) {
    console.log([
        'Image pixel comparison test script.',
        '',
        'CLI arguments:',
        '',
        '1. \'pattern\' : glob determining which mock(s) are to be tested',
        '2. --queue : if sent, the image will be run in queue instead of in batch.',
        '    Makes the test run significantly longer, but is recommended on weak hardware.',
        '',
        'Examples:',
        '',
        'Run all tests in batch:',
        '',
        '    npm run test-image',
        '',
        'Run the \'contour_nolines\' test:',
        '',
        '    npm run test-image -- contour_nolines',
        '',
        'Run all gl3d image test in queue:',
        '',
        '    npm run test-image -- gl3d_* --queue',
        ''
    ].join('\n'));
    process.exit(0);
}

var mockList = getMockList(argv._);

// filter out untestable mocks if no input is specified
if(argv._.length === 0) {
    console.log('Filtering out untestable mocks:');
    mockList = mockList.filter(untestableFilter);
    console.log('\n');
}

// gl2d have limited image-test support
if(argv._.indexOf('gl2d_*') !== -1) {
    if(!argv.queue) {
        console.log('WARN: Running gl2d image tests in batch may lead to unwanted results\n');
    }

    if(IS_CI) {
        console.log('Filtering out multiple-subplot gl2d mocks:');
        mockList = mockList
            .filter(untestableGL2DonCIfilter)
            .sort(sortForGL2DonCI);
        console.log('\n');
    }
}

var input = mockList.map(function(m) { return getImagePaths(m).mock; });

run(mockList, input, argv, function write(info, done) {
    var mockName = mockList[info.itemIndex];
    var paths = getImagePaths(mockName);
    var imgData = info.body;

    if(!fs.existsSync(paths.baseline)) {
        return done('baseline image for ' + mockName + ' does not exist');
    }

    parallel([
        function(cb) {
            var img = fs.createReadStream(paths.baseline).pipe(new PNG());
            img.on('parsed', function() { return cb(null, img); });
            img.on('error', function(err) { return cb(err); });
        },
        function(cb) { (new PNG()).parse(imgData, cb); },
        function(cb) { fs.writeFile(paths.test, imgData, cb); },
    ], function(err, results) {
        if(err) done(err);

        var baseline = results[0];
        var width = baseline.width;
        var height = baseline.height;
        var test = results[1];
        var diff = new PNG({width: width, height: height});

        var numDiffPixels = pixelmatch(
            baseline.data, test.data, diff.data,
            width, height,
            {threshold: argv.threshold}
        );

        if(numDiffPixels) {
            var diffStream = fs.createWriteStream(paths.diff).on('finish', function() {
                done('(' + numDiffPixels + ' pixels differ with threshold ' + argv.threshold + ')');
            });
            diff.pack().pipe(diffStream);
        } else {
            done();
        }
    });
});

/* Test cases:
 *
 * - font-wishlist
 * - all gl2d
 * - all mapbox
 *
 * don't behave consistently from run-to-run and/or
 * machine-to-machine; skip over them for now.
 *
 */
function untestableFilter(mockName) {
    var cond = !(
        mockName === 'font-wishlist' ||
        mockName.indexOf('gl2d_') !== -1 ||
        mockName.indexOf('mapbox_') !== -1
    );

    if(!cond) console.log(' -', mockName);

    return cond;
}

/* gl2d mocks that have multiple subplots
 * can't be generated properly on CircleCI
 * at the moment.
 *
 * For more info see:
 * https://github.com/plotly/plotly.js/pull/980
 *
 */
function untestableGL2DonCIfilter(mockName) {
    var cond = [
        'gl2d_multiple_subplots',
        'gl2d_simple_inset',
        'gl2d_stacked_coupled_subplots',
        'gl2d_stacked_subplots'
    ].indexOf(mockName) === -1;

    if(!cond) console.log(' -', mockName);

    return cond;
}

/* gl2d pointcloud mock(s) must be tested first
 * on CircleCI in order to work; sort them here.
 *
 * Pointcloud relies on gl-shader@4.2.1 whereas
 * other gl2d trace modules rely on gl-shader@4.2.0,
 * we suspect that the lone gl context on CircleCI is
 * having issues with dealing with the two different
 * gl-shader versions.
 *
 * More info here:
 * https://github.com/plotly/plotly.js/pull/1037
 */
function sortForGL2DonCI(a, b) {
    var root = 'gl2d_pointcloud',
        ai = a.indexOf(root),
        bi = b.indexOf(root);

    if(ai < bi) return 1;
    if(ai > bi) return -1;

    return 0;
}

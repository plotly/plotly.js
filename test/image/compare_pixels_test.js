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
        threshold: '1e-3',
        'parallel-limit': '4'
    }
});

if(argv.help) {
    console.log([
        'Image pixel comparison test script.',
        '',
        'CLI arguments:',
        '',
        '1. \'pattern\' : glob(s) determining which mock(s) are to be tested',
        '2. --queue : if sent, the image will be run in queue instead of in batch.',
        '    Makes the test run significantly longer, but is recommended on weak hardware.',
        '',
        'Examples:',
        '',
        'Run all tests in batch:',
        '',
        '   npm run test-image',
        '',
        'Run the \'contour_nolines\' test:',
        '',
        '   npm run test-image -- contour_nolines',
        '',
        'Run all gl3d image test in queue:',
        '',
        '   npm run test-image -- gl3d_* --queue',
        '',
        'Run all image tests except gl3d and pie (N.B. need to escape special characters):',
        '',
        '   npm run baseline -- "\!\(gl3d_*\|pie_*\)"',
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
    console.log('\nSorting gl2d mocks to avoid gl-shader conflicts');
    sortGl2dMockList(mockList);
    console.log('');
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

/* gl2d pointcloud and other non-regl gl2d mock(s)
 * must be tested first on in order to work;
 * sort them here.
 *
 * gl-shader appears to conflict with regl.
 * We suspect that the lone gl context on CircleCI is
 * having issues with dealing with the two different
 * program binding algorithm.
 *
 * The problem will be solved by switching all our
 * WebGL-based trace types to regl.
 *
 * More info here:
 * https://github.com/plotly/plotly.js/pull/1037
 */
function sortGl2dMockList(mockList) {
    var mockNames = ['gl2d_pointcloud-basic', 'gl2d_heatmapgl'];
    var pos = 0;

    mockNames.forEach(function(m) {
        var ind = mockList.indexOf(m);
        var tmp = mockList[pos];
        mockList[pos] = m;
        mockList[ind] = tmp;
        pos++;
    });
}

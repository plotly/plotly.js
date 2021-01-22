var fs = require('fs');
var minimist = require('minimist');

var common = require('../../tasks/util/common');
var getMockList = require('./assets/get_mock_list');
var getRequestOpts = require('./assets/get_image_request_options');
var getImagePaths = require('./assets/get_image_paths');

// packages inside the image server docker
var test = require('tape');
var request = require('request');
var gm = require('gm');

// pixel comparison tolerance
var TOLERANCE = 1e-6;

// wait time between each test batch
var BATCH_WAIT = 500;

// number of tests in each test batch
var BATCH_SIZE = 5;

// wait time between each test in test queue
var QUEUE_WAIT = 10;

/**
 *  Image pixel comparison test script.
 *
 *  Called by `tasks/test_image.sh in `npm run test-image`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *  2. --queue : if sent, the image will be run in queue instead of in batch.
 *      Makes the test run significantly longer, but is recommended on weak hardware.
 *
 *  Examples:
 *
 *  Run all tests in batch:
 *
 *      npm run test-image
 *
 *  Run the 'contour_nolines' test:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run all gl3d image test in queue:
 *
 *      npm run test-image -- gl3d_* --queue
 *
 *
 */

var argv = minimist(process.argv.slice(2), {
    boolean: ['queue', 'filter', 'skip-flaky', 'just-flaky']
});

var allMock = false;
// If no pattern is provided, all mocks are compared
if(argv._.length === 0) {
    allMock = true;
    argv._.push('');
}

// Build list of mocks to compare
var allMockList = [];
argv._.forEach(function(pattern) {
    var mockList = getMockList(pattern);

    if(mockList.length === 0) {
        throw new Error('No mocks found with pattern ' + pattern);
    }

    allMockList = allMockList.concat(mockList);
});

// To get rid of duplicates
function unique(value, index, self) {
    return self.indexOf(value) === index;
}
allMockList = allMockList.filter(unique);

// filter out untestable mocks if no pattern is specified (ie. we're testing all mocks)
// or if flag '--filter' is provided
console.log('');
if(allMock || argv.filter) {
    console.log('Filtering out untestable mocks:');
    // Test cases:
    // - font-wishlist
    // - all mapbox
    // don't behave consistently from run-to-run and/or
    // machine-to-machine; skip over them for now.
    allMockList = allMockList.filter(function(mockName) {
        var cond = !(
            mockName === 'font-wishlist' ||
            mockName.indexOf('mapbox_') !== -1
        );
        if(!cond) console.log(' -', mockName);
        return cond;
    });
}

var FLAKY_LIST = [
    'treemap_coffee',
    'treemap_sunburst_marker_colors',
    'treemap_textposition',
    'treemap_with-without_values',
    'gl3d_directions-streamtube1',
];

console.log('');
if(argv['skip-flaky']) {
    allMockList = allMockList.filter(function(mockName) {
        var cond = FLAKY_LIST.indexOf(mockName) === -1;
        if(!cond) console.log('Skipping flaky mock', mockName);
        return cond;
    });
} else if(argv['just-flaky']) {
    allMockList = allMockList.filter(function(mockName) {
        return FLAKY_LIST.indexOf(mockName) !== -1;
    });
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
        if(ind === -1) return;
        var tmp = mockList[pos];
        mockList[pos] = m;
        mockList[ind] = tmp;
        pos++;
    });
}

function runInBatch(mockList) {
    var running = 0;

    test('testing mocks in batch', function(t) {
        t.plan(mockList.length);

        for(var i = 0; i < mockList.length; i++) {
            run(mockList[i], t);
        }
    });

    function run(mockName, t) {
        if(running >= BATCH_SIZE) {
            setTimeout(function() {
                run(mockName, t);
            }, BATCH_WAIT);
            return;
        }
        running++;

        // throttle the number of tests running concurrently

        comparePixels(mockName, function(isEqual, mockName) {
            running--;
            t.ok(isEqual, mockName + ' should be pixel perfect');
        });
    }
}

function runInQueue(mockList) {
    var index = 0;

    test('testing mocks in queue', function(t) {
        t.plan(mockList.length);

        run(mockList[index], t);
    });

    function run(mockName, t) {
        comparePixels(mockName, function(isEqual, mockName) {
            t.ok(isEqual, mockName + ' should be pixel perfect');

            index++;
            if(index < mockList.length) {
                setTimeout(function() {
                    run(mockList[index], t);
                }, QUEUE_WAIT);
            }
        });
    }
}

function comparePixels(mockName, cb) {
    var requestOpts = getRequestOpts({ mockName: mockName });
    var imagePaths = getImagePaths(mockName);
    var saveImageStream = fs.createWriteStream(imagePaths.test);

    function log(msg) {
        process.stdout.write('Error for', mockName + ':', msg);
    }

    function checkImage() {
        // baseline image must be generated first
        if(!common.doesFileExist(imagePaths.baseline)) {
            var err = new Error('baseline image not found');
            return onEqualityCheck(err, false);
        }

        /*
         * N.B. The non-zero tolerance was added in
         * https://github.com/plotly/plotly.js/pull/243
         * where some legend mocks started generating different png outputs
         * on `npm run test-image` and `npm run test-image -- mock.json`.
         *
         * Note that the svg outputs for the problematic mocks were the same
         * and playing around with the batch size and timeout durations
         * did not seem to affect the results.
         *
         * With the above tolerance individual `npm run test-image` and
         * `npm run test-image -- mock.json` give the same result.
         *
         * Further investigation is needed.
         */

        var gmOpts = {
            file: imagePaths.diff,
            highlightColor: 'purple',
            tolerance: TOLERANCE
        };

        gm.compare(
            imagePaths.test,
            imagePaths.baseline,
            gmOpts,
            onEqualityCheck
        );
    }

    function onEqualityCheck(err, isEqual) {
        if(err) {
            common.touch(imagePaths.diff);
            log(err);
            return cb(false, mockName);
        }
        if(isEqual) {
            fs.unlinkSync(imagePaths.diff);
        }

        cb(isEqual, mockName);
    }

    // 525 means a plotly.js error
    function onResponse(response) {
        if(+response.statusCode === 525) {
            log('plotly.js error');
            return cb(false, mockName);
        }
    }

    // this catches connection errors
    // e.g. when the image server blows up
    function onError(err) {
        log(err);
        return cb(false, mockName);
    }

    request(requestOpts)
        .on('error', onError)
        .on('response', onResponse)
        .pipe(saveImageStream)
        .on('close', checkImage);
}

sortGl2dMockList(allMockList);
console.log('');

// main
if(argv.queue) {
    runInQueue(allMockList);
} else {
    runInBatch(allMockList);
}

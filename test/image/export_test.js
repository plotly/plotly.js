var fs = require('fs');
var sizeOf = require('image-size');

var getMockList = require('./assets/get_mock_list');
var getRequestOpts = require('./assets/get_image_request_options');
var getImagePaths = require('./assets/get_image_paths');

// packages inside the image server docker
var request = require('request');
var test = require('tape');

// image formats to test
//
// N.B. 'png' is tested in `npm run test-image, no need to duplicate here
//
// N.B. 'jpeg' and 'webp' lead to errors because of the image server code
//      is looking for Plotly.Color which isn't exposed anymore
var FORMATS = ['svg', 'pdf', 'eps'];

// non-exhaustive list of mocks to test
var DEFAULT_LIST = [
    '0', 'geo_first', 'gl3d_z-range', 'text_export', 'layout_image', 'gl2d_12',
    'range_slider_initial_valid'
];

// return dimensions [in px]
var WIDTH = 700;
var HEIGHT = 500;

// minimum satisfactory file size [in bytes]
var MIN_SIZE = 100;

// wait time between each test batch
var BATCH_WAIT = 500;

// number of tests in each test batch
var BATCH_SIZE = 5;

/**
 *  Image export test script.
 *
 *  Called by `tasks/test_export.sh in `npm run test-export`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run the export test on the default mock list (in batch):
 *
 *      npm run test-image
 *
 *  Run the export on the 'contour_nolines' mock:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run the export test on all gl3d mocks (in batch):
 *
 *      npm run test-image -- gl3d_*
 */

var pattern = process.argv[2];
var mockList = pattern ? getMockList(pattern) : DEFAULT_LIST;

if(mockList.length === 0) {
    throw new Error('No mocks found with pattern ' + pattern);
}

// main
runInBatch(mockList);

function runInBatch(mockList) {
    var running = 0;

    test('testing image export formats', function(t) {
        t.plan(mockList.length * FORMATS.length);

        for(var i = 0; i < mockList.length; i++) {
            for(var j = 0; j < FORMATS.length; j++) {
                run(mockList[i], FORMATS[j], t);
            }
        }
    });

    function run(mockName, format, t) {
        if(running >= BATCH_SIZE) {
            setTimeout(function() {
                run(mockName, format, t);
            }, BATCH_WAIT);
            return;
        }
        running++;

        // throttle the number of tests running concurrently

        testExport(mockName, format, function(didExport, mockName, format) {
            running--;
            t.ok(didExport, mockName + ' should be properly exported as a ' + format);
        });
    }
}

// The tests below determine whether the images are properly
// exported by (only) checking the file size of the generated images.
function testExport(mockName, format, cb) {
    var specs = {
        mockName: mockName,
        format: format,
        width: WIDTH,
        height: HEIGHT
    };

    var requestOpts = getRequestOpts(specs),
        imagePaths = getImagePaths(mockName, format),
        saveImageStream = fs.createWriteStream(imagePaths.test);

    function checkExport(err) {
        if(err) throw err;

        var didExport;

        if(format === 'svg') {
            var dims = sizeOf(imagePaths.test);
            didExport = (dims.width === WIDTH) && (dims.height === HEIGHT);
        }
        else {
            var stats = fs.statSync(imagePaths.test);
            didExport = stats.size > MIN_SIZE;
        }

        cb(didExport, mockName, format);
    }

    request(requestOpts)
        .pipe(saveImageStream)
        .on('close', checkExport);
}

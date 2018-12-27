var fs = require('fs');

var getMockList = require('./assets/get_mock_list');
var getRequestOpts = require('./assets/get_image_request_options');
var getImagePaths = require('./assets/get_image_paths');

// packages inside the image server docker
var request = require('request');

// wait time between each baseline generation
var QUEUE_WAIT = 10;

/**
 *  Baseline image generation script.
 *
 *  Called by `tasks/baseline.sh in `npm run baseline`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining the baseline(s) to be generated
 *
 *  Examples:
 *
 *  Generate or (re-generate) all baselines (in queue):
 *
 *      npm run baseline
 *
 *  Generate or (re-generate) the 'contour_nolines' baseline:
 *
 *      npm run baseline -- contour_nolines
 *
 *  Generate or (re-generate) all gl3d baseline (in queue):
 *
 *      npm run baseline -- gl3d_*
 *
 */
var pattern = process.argv[2];
var mockList = getMockList(pattern);

if(mockList.length === 0) {
    throw new Error('No mocks found with pattern ' + pattern);
}

// main
runInQueue(mockList);

function runInQueue(mockList) {
    var index = 0;

    run(mockList[index]);

    function run(mockName) {
        makeBaseline(mockName, function() {
            console.log('generated ' + mockName + ' successfully');

            index++;
            if(index < mockList.length) {
                setTimeout(function() {
                    run(mockList[index]);
                }, QUEUE_WAIT);
            }
        });
    }
}

function makeBaseline(mockName, cb) {
    var requestOpts = getRequestOpts({ mockName: mockName });
    var imagePaths = getImagePaths(mockName);
    var saveImageStream = fs.createWriteStream(imagePaths.baseline);

    function checkFormat(err, res) {
        if(err) throw err;
        if(res.headers['content-type'] !== 'image/png') {
            throw new Error('Generated image is not a valid png');
        }
    }

    request(requestOpts, checkFormat)
        .pipe(saveImageStream)
        .on('close', cb);
}

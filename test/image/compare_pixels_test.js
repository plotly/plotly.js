var fs = require('fs');
var path = require('path');

var constants = require('../../tasks/util/constants');
var getOptions = require('../../tasks/util/get_image_request_options');

// packages inside the image server docker
var request = require('request');
var test = require('tape');
var gm = require('gm');

var touch = function(fileName) {
    fs.closeSync(fs.openSync(fileName, 'w'));
};


// make artifact folders
if(!fs.existsSync(constants.pathToTestImagesDiff)) {
    fs.mkdirSync(constants.pathToTestImagesDiff);
}
if(!fs.existsSync(constants.pathToTestImages)) {
    fs.mkdirSync(constants.pathToTestImages);
}

var userFileName = process.argv[2];

// run the test(s)
if(!userFileName) runAll();
else runSingle(userFileName);

function runAll() {
    test('testing mocks', function(t) {

        var allMocks = fs.readdirSync(constants.pathToTestImageMocks);

        /*
         * Some test cases exhibit run-to-run randomness;
         * skip over these few test cases for now.
         *
         * More info:
         * https://github.com/plotly/plotly.js/issues/62
         *
         * 41 test cases are removed:
         * - font-wishlist (1 test case)
         * - all gl2d (38)
         * - gl3d_bunny-hull (1)
         * - polar_scatter (1)
         */
        var mocks = allMocks.filter(function(mock) {
            return !(
                mock === 'font-wishlist.json' ||
                mock.indexOf('gl2d') !== -1 ||
                mock === 'gl3d_bunny-hull.json' ||
                mock === 'polar_scatter.json'
            );
        });

        var BASE_TIMEOUT = 500,  // base timeout time
            BATCH_SIZE = 5,      // size of each test 'batch'
            cnt = 0;

        function testFunction() {
            testMock(mocks[cnt++], t);
        }

        t.plan(mocks.length);

        for(var i = 0; i < mocks.length; i++) {
            setTimeout(testFunction,
                BASE_TIMEOUT * Math.floor(i / BATCH_SIZE) * BATCH_SIZE);
        }

    });
}

function runSingle(userFileName) {
    test('testing single mock: ' + userFileName, function(t) {
        t.plan(1);
        testMock(userFileName, t);
    });
}

function testMock(fileName, t) {
    var figure = require(path.join(constants.pathToTestImageMocks, fileName));
    var bodyMock = {
        figure: figure,
        format: 'png',
        scale: 1
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = path.join(constants.pathToTestImages, imageFileName);
    var diffPath = path.join(constants.pathToTestImagesDiff, 'diff-' + imageFileName);
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    function checkImage() {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 1e-6
        };

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

        gm.compare(
            savedImagePath,
            path.join(constants.pathToTestImageBaselines, imageFileName),
            options,
            onEqualityCheck
        );
    }

    function onEqualityCheck(err, isEqual) {
        if(err) {
            touch(diffPath);
            return console.error(err, imageFileName);
        }
        if(isEqual) {
            fs.unlinkSync(diffPath);
        }

        t.ok(isEqual, imageFileName + ' should be pixel perfect');
    }

    request(options)
        .pipe(savedImageStream)
        .on('close', checkImage);
}

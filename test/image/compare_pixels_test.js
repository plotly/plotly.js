var fs = require('fs');
var path = require('path');

var constants = require('../../tasks/util/constants');
var getOptions = require('../../tasks/util/get_image_request_options');

// packages inside the image server docker
var request = require('request');
var test = require('tape');
var gm = require('gm');


// make artifact folders
if(!fs.existsSync(constants.pathToTestImagesDiff)) fs.mkdirSync(constants.pathToTestImagesDiff);
if(!fs.existsSync(constants.pathToTestImages)) fs.mkdirSync(constants.pathToTestImages);

var userFileName = process.argv[2];

var touch = function(fileName) {
    fs.closeSync(fs.openSync(fileName, 'w'));
};

if (!userFileName) runAll();
else runSingle(userFileName);

function runAll () {
    test('testing mocks', function (t) {

        var files = fs.readdirSync(constants.pathToTestImageMocks);

        /*
         * Some test cases exhibit run-to-run randomness;
         * skip over these few test cases for now.
         *
         * More info:
         * https://github.com/plotly/plotly.js/issues/62
         *
         * 40 test cases are removed:
         * - font-wishlist (1 test case)
         * - all gl2d (38)
         * - gl2d_bunny-hull (1)
         */
        t.plan(files.length - 40);

        for (var i = 0; i < files.length; i ++) {
            testMock(files[i], t);
        }

    });
}

function runSingle (userFileName) {
    test('testing single mock: ' + userFileName, function (t) {
        t.plan(1);
        testMock(userFileName, t);
    });
}

function testMock (fileName, t) {
    if(path.extname(fileName) !== '.json') return;
    if(fileName === 'font-wishlist.json' && !userFileName) return;

    // TODO fix race condition in gl2d image generation
    if(fileName.indexOf('gl2d_') !== -1) return;

    // TODO fix run-to-run randomness
    if(fileName === 'gl3d_bunny-hull.json') return;

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

    function checkImage () {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 0.0
        };

        gm.compare(
            savedImagePath,
            path.join(constants.pathToTestImageBaselines, imageFileName),
            options,
            onEqualityCheck
        );
    }

    function onEqualityCheck (err, isEqual) {
        if (err) {
            touch(diffPath);
            return console.error(err, imageFileName);
        }
        if (isEqual) {
            fs.unlinkSync(diffPath);
        }

        t.ok(isEqual, imageFileName + ' should be pixel perfect');
    }

    request(options)
	.on('response', function() { console.log('pong') })
        .pipe(savedImageStream)
        .on('close', checkImage);
}

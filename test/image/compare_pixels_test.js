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

        console.error('### beginning pixel comparison tests ###');
        var files = fs.readdirSync(constants.pathToTestImageMocks);

        // -1 for font-wishlist and
        // -38 for the gl2d mocks
        t.plan(files.length - 39);

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
    var statusCode;

    function checkImage () {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 0.0
        };

        if(statusCode === 485) {
            console.error(imageFileName, '- skip');
        }
        else {
            gm.compare(
                savedImagePath,
                path.join(constants.pathToTestImageBaselines, imageFileName),
                options,
                onEqualityCheck
            );
        }
    }

    function onEqualityCheck (err, isEqual) {
        if (err) {
            touch(diffPath);
            return console.error(err, imageFileName);
        }
        if (isEqual) {
            fs.unlinkSync(diffPath);
            console.error(imageFileName + ' is pixel perfect');
        }

        t.ok(isEqual, savedImagePath + ' should be pixel perfect');
    }

    request(options)
        .on('response', function(response) {
            statusCode = response.statusCode;
        })
        .pipe(savedImageStream)
        .on('close', checkImage);
}

'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');
var path = require('path');
var getOptions = require('./tools/get-options');
var gm = require('gm');
var statusMsg485 = require('../server_app/config/statusmsgs')['485'];

if (!fs.existsSync('./test-images-diffs')) fs.mkdirSync('./test-images-diffs');
if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

var userFileName = process.argv[2];

var touch = function(fileName) {
    fs.closeSync(fs.openSync(fileName, 'w'));
};

if (!userFileName) runAll();
else runSingle(userFileName);

function runAll () {
    test('testing mocks', function (t) {

        console.error('### beginning pixel comparison tests ###');
        var files = fs.readdirSync('./mocks');

        t.plan(files.length - 1); // -1 is for font-wishlist...
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
    if (path.extname(fileName) !== '.json') return;
    if (fileName === 'font-wishlist.json' && !userFileName) return;

    var figure = require('./mocks/' + fileName);
    var bodyMock = {
        figure: figure,
        format: 'png',
        scale: 1
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = 'test-images/' + imageFileName;
    var diffPath = 'test-images-diffs/' + 'diff-' + imageFileName;
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
            console.error(imageFileName, '-', statusMsg485, '- skip');
        }
        else {
            gm.compare(savedImagePath, 'test-images-baseline/' + imageFileName, options, onEqualityCheck);
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

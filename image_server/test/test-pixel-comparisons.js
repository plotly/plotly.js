'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');
var path = require('path');
var getOptions = require('./tools/get-options');
var gm = require('gm');

if (!fs.existsSync('./test-images-diffs')) fs.mkdirSync('./test-images-diffs');
if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

var userFileName = process.argv[2];

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

    function checkImage () {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 0.0
        };
        gm.compare(savedImagePath, 'test-images-baseline/' + imageFileName, options, onEqualityCheck);
    }

    function onEqualityCheck (err, isEqual) {
        if (err) return console.error(err, imageFileName);
        if (isEqual) {
            fs.unlinkSync(diffPath);
            console.error(imageFileName + ' is pixel perfect');
        }

        t.ok(isEqual, savedImagePath + ' should be pixel perfect');
    }

    request(options)
        .pipe(savedImageStream)
        .on('close', checkImage);
}

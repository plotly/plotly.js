'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');
var path = require('path');
var getOptions = require('./tools/get-options');
var gm = require('gm');

if (!fs.existsSync('./test-images-diffs')) fs.mkdirSync('./test-images-diffs');
if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

test('testing fonts', function (t) {

    var fileName = 'fonts.json';
    var figure = require('./mocks/' + fileName);
    var bodyMock = {
        figure: figure,
        format: 'png'
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = 'test-images/' + imageFileName;
    var diffPath = 'test-images-diffs/' + 'diff-' + imageFileName;
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/png', 'data is in correct png format');
    }

    function checkImage () {
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 0.0
        };
        gm.compare(savedImagePath, 'test-images-baseline/' + imageFileName, options, onEqualityCheck);
    }

    function onEqualityCheck (err, isEqual) {
        if (err) return console.error(err);
        if (isEqual) fs.unlinkSync(diffPath);
        t.ok(isEqual, savedImagePath + ' should be pixel perfect');
    }

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', checkImage);
});

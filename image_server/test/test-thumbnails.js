'use strict';

var test = require('tape');
var request = require('request');
var getOptions = require('./tools/get-options');
var fs = require('fs');
var path = require('path');
var gm = require('gm');

if (!fs.existsSync('./test-images-diffs')) fs.mkdirSync('./test-images-diffs');
if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

test('testing thumbnail image server call', function (t) {
    t.plan(2);

    var bodyMock = {
        figure: {'data': [{'x': [1,2], 'y': [10,20]}]},
        format: 'png',
        thumbnail: true
    };

    var imageFileName = 'thumbnail.png';
    var savedImagePath = 'test-images/' + imageFileName;
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', checkImage);

    function checkFormat (err, res) {
        if (err) console.log(err);

        if (res.headers['content-type'] !== 'image/png') console.log(res.statusCode);
        t.equal(res.headers['content-type'], 'image/png', 'data is in correct png format');
    }

    function checkImage () {
        var diffPath = 'test-images-diffs/' + 'diff-' + imageFileName;
        var options = {
            file: diffPath,
            highlightColor: 'purple',
            tolerance: 0.0
        };
        gm.compare(savedImagePath, 'test-images-baseline/' + imageFileName, options, onEqualityCheck);

        function onEqualityCheck (err, isEqual, equality, raw, path1) {
            if (err) return console.error(err);
            console.log(path1);
            t.ok(isEqual, path1 + ' is the same (should === 0.00) -> ' + equality + '  ');
            if (isEqual) {
                fs.unlink(diffPath, function (err) {
                    if (err) return console.log(err);
                    console.log('removed perfect image');
                });
            }
            t.end();

        }
    }

});

/*
*   Give it a json object for the body,
*   it'll return an options object ready
*   for request().
*   Just for added testing easypeasyness.
*/
function getOptions (body, url) {

    var opts = {
        url: url || 'http://localhost:9010/',
        method: 'POST'
    };

    if (body) opts.body = JSON.stringify(body);
    //console.log(opts.body);

    return opts;
}

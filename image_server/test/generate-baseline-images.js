'use strict';

var request = require('request');
var fs = require('fs');
var path = require('path');

var root = __dirname;

fs.readdir(root + '/mocks', function (err, files) {
    if (err) return console.log(err);
    files.forEach(createBaselineImage);

});

function createBaselineImage (fileName) {
    if (path.extname(fileName) !== '.json') return;

    var figure = require('./mocks/' + fileName);
    var bodyMock = {
        figure: figure,
        format: 'png'
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = root + '/test-images-baseline/' + imageFileName;
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', onClose);

    function checkFormat (err, res) {
        if (err) console.log(err);
        if (res.headers['content-type'] !== 'image/png') console.log(res.statusCode);
    }

    function onClose () {
        console.log('successfully created Image: ' + savedImagePath);
    }

}

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

    return opts;
}

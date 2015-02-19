'use strict';

var request = require('request');
var getOptions = require('./get-options');
var fs = require('fs');
var path = require('path');

var root = __dirname;

function createBaselineImage (fileName) {
    if (path.extname(fileName) !== '.json') return;
    //if (fileName !== '28.json') return;

    var figure = require('../mocks/' + fileName);
    var bodyMock = {
        figure: figure,
        format: 'png',
        scale: 3
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = root + '/../test-images-baseline/' + imageFileName;
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    function checkFormat (err, res) {
        if (err) console.log(err);
        if (res.headers['content-type'] !== 'image/png') console.log(res.statusCode);
    }

    function onClose () {
        console.log('successfully created Image: ' + savedImagePath);
    }

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', onClose);
}

fs.readdir(root + '/../mocks', function (err, files) {
    if (err) return console.log(err);
    files.forEach(createBaselineImage);

});

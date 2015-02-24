'use strict';

var request = require('request');
var getOptions = require('./get-options');
var fs = require('fs');
var path = require('path');
var root = __dirname;
var userFileName = process.argv[2];


if (!userFileName) {
    console.log('must supply an example to run');
    process.exit();
}

function createBaselineImage (fileName) {
    if (path.extname(fileName) !== '.json') return;

    var figure = require('../mocks/' + fileName);
    var bodyMock = {
        figure: figure,
        format: 'png',
        scale: 1
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
        console.log('successfully created baseline Image for: ' + fileName);
    }

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', onClose);
}

createBaselineImage(userFileName);

'use strict';

var request = require('request');
var getOptions = require('./get-options');
var fs = require('fs');
var path = require('path');
var ProgressBar = require('progress');
var bar;

var root = __dirname;

var userFileName = process.argv[2];


if (!userFileName) {
    fs.readdir(root + '/../mocks', function (err, files) {
        console.log('#######  ' + files.length + ' total baseline images to build  #######');
        bar = new ProgressBar('processing [:bar] [:current / :total]', { total: files.length, width: 30 });
        if (err) return console.log(err);
        files.forEach(createBaselineImage);
    });
} else {
    createBaselineImage(userFileName);
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
        if (bar) bar.tick();
        if (userFileName) console.log('generated : ' + imageFileName + ' successfully');
    }

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', onClose);
}

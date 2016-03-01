var fs = require('fs');
var path = require('path');

var constants = require('../../tasks/util/constants');
var getOptions = require('../../tasks/util/get_image_request_options');

// packages inside the image server docker
var ProgressBar = require('progress');
var request = require('request');

var userFileName = process.argv[2];
var bar;


if(!userFileName) {
    fs.readdir(constants.pathToTestImageMocks, function(err, files) {
        console.log('#######  ' + files.length + ' total baseline images to build  #######');
        bar = new ProgressBar('processing [:bar] [:current / :total]', { total: files.length, width: 30 });
        if(err) return console.log(err);
        files.forEach(createBaselineImage);
    });
}
else {
    createBaselineImage(userFileName);
}


function createBaselineImage(fileName) {
    if(path.extname(fileName) !== '.json') return;

    var figure = require(path.join(constants.pathToTestImageMocks, fileName));
    var bodyMock = {
        figure: figure,
        format: 'png',
        scale: 1
    };

    var imageFileName = fileName.split('.')[0] + '.png';
    var savedImagePath = path.join(constants.pathToTestImageBaselines, imageFileName);
    var savedImageStream = fs.createWriteStream(savedImagePath);
    var options = getOptions(bodyMock, 'http://localhost:9010/');

    function checkFormat(err, res) {
        if(err) console.log(err);
        if(res.headers['content-type'] !== 'image/png') console.log(res.statusCode);
    }

    function onClose() {
        if(bar) bar.tick();
        if(userFileName) console.log('generated : ' + imageFileName + ' successfully');
    }

    request(options, checkFormat)
        .pipe(savedImageStream)
        .on('close', onClose);
}

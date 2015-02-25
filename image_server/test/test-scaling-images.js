'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');
var sizeOf = require('image-size');
var getOptions = require('./tools/get-options');

if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');


test('request unscaled JPEG with figure size', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 1200,
                'height': 600 // undefined autosize
            }
        },
        'format': 'jpeg'
    };

    var path = 'test-images/figure-1200x600-unscaled.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 1200, 'output jpeg width matches figure width');
        t.equal(height, 600, 'output jpeg height matches figure height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request scaled JPEG with figure size', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 1200,
                'height': 600,
                'autosize': false
            }
        },
        'format': 'jpeg',
        'scale': 3
    };

    var path = 'test-images/figure-1200x600-3x.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 3600, 'output jpeg width matches scaled figure width');
        t.equal(height, 1800, 'output jpeg height matches scaled figure height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request unscaled JPEG with body size', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 1200,
                'height': 600,
                'autosize': false
            }
        },
        'format': 'jpeg',
        'width': 500,
        'height': 300
    };

    var path = 'test-images/body-500x300-unscaled.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 500, 'output jpeg width matches body width');
        t.equal(height, 300, 'output jpeg height matches body height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request scaled JPEG with body size', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 1200,
                'height': 600,
                'autosize': true
            }
        },
        'format': 'jpeg',
        'width': 500,
        'height': 300,
        'scale': 3
    };

    var path = 'test-images/body-500x300-3x.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 1500, 'output jpeg width matches scaled body width');
        t.equal(height, 900, 'output jpeg height matches scaled body height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);

});

test('request default size unscaled JPEG', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 5000,  // wont ever make it
                'height': 5000, // because autosize is set to true
                'autosize': true
            }
        },
        'format': 'jpeg'
    };

    var path = 'test-images/body-defaultsize-700x500-unscaled.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 700, 'output jpeg width matches scaled default width');
        t.equal(height, 500, 'output jpeg height matches scaled default height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request default size scaled JPEG from body', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'autosize': true
            }
        },
        'format': 'jpeg',
        'scale': 3
    };

    var path = 'test-images/body-defaultsize-700x500-3x.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(width, 2100, 'output jpeg width matches scaled default width');
        t.equal(height, 1500, 'output jpeg height matches scaled default height');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

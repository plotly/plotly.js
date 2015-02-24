'use strict';

var test = require('tape');
var request = require('request');
var getOptions = require('./tools/get-options');
var fs = require('fs');
var sizeOf = require('image-size');

if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

test('monit heartbeat test', function (t) {
    t.plan(1);

    var options = getOptions(null, 'http://localhost:9010/ping');

    request(options, function (err, res, body) {
        if (err) return console.error(err);
        t.equal(body, 'pong');
        t.end();
    });


});


test('basic figure to image test', function (t) {
    t.plan(3);

    var bodyMock = {
        'figure': {'data': [{'x': [1,2], 'y': [10,20]}]},
        'format': 'png',
        'width': 700,
        'height': 500
    };

    var path = 'test-images/basic-figure-to-image.png';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/png', 'data is in correct png format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;
        t.equal(height, bodyMock.height, 'output png height matches');
        t.equal(width, bodyMock.width, 'output png width matches');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request SVG from figure', function (t) {
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
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'svg',
        'width': 700,
        'height': 500
    };

    var path = 'test-images/figure-to-svg.svg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/svg+xml', 'Returned Data is in SVG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(height, bodyMock.height, 'output svg height matches body height');
        t.equal(width, bodyMock.width, 'output svg width matches body width');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);

});

test('request JPEG from figure', function (t) {
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
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'jpeg',
        'width': 700,
        'height': 500
    };

    var path = 'test-images/figure-to-jpeg.jpeg';
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

        t.equal(height, bodyMock.height, 'output jpeg height matches body height');
        t.equal(width, bodyMock.width, 'output jpeg width matches body width');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

test('request PDF from figure', function (t) {
    t.plan(1);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'pdf',
        'width': 700,
        'height': 500
    };

    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'application/pdf', 'Returned Data is in PDF Format');
        t.end();
    }

    request(options, checkFormat);

});

test('request EPS from figure', function (t) {
    t.plan(1);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ],
            'layout': {
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'eps',
        'width': 700,
        'height': 500
    };

    var options = getOptions(bodyMock);


    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'application/postscript', 'Returned Data is in EPS Format');
        t.end();
    }

    request(options, checkFormat);

});


test('request WEBP from figure', function (t) {
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
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'webp',
        'width': 700,
        'height': 500
    };

    var path = 'test-images/figure-to-webp.webp';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/webp', 'Returned Data is in WEBP Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(height, bodyMock.height, 'output webp height matches body height');
        t.equal(width, bodyMock.width, 'output webp width matches body width');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});


test('test body height and width not numbers', function (t) {
    t.plan(2);

    var bodyMock = {
        'figure': {
            'data': [
                {
                    'x': [1,2],
                    'y': [10,20]
                }
            ]
        },
        'format': 'png',
        'width': null,
        'height': null
    };

    var options = getOptions(bodyMock);

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 200, 'Server correctly handles non number height and width in body');
        t.equal(res.headers['content-type'], 'image/png', 'data is in correct png format');
        t.end();
    });
});

test('request WEBP from figure', function (t) {
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
                'width': 400,
                'height': 1500,
                'autosize': false
            }
        },
        'format': 'webp',
        'width': 700,
        'height': 500
    };

    var path = 'test-images/figure-to-webp.webp';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/webp', 'Returned Data is in WEBP Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(height, bodyMock.height, 'output webp height matches body height');
        t.equal(width, bodyMock.width, 'output webp width matches body width');
        t.end();
    }

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);
});

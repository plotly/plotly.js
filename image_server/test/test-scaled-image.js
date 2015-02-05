'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');
var sizeOf = require('image-size');

if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

test('request scaled JPEG from figure', function (t) {
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
                'width': 500,
                'height': 400,
                'autosize': false
            }
        },
        'format': 'jpeg',
        'scale': 2
    };

    var path = 'test-images/scaled-image.jpeg';
    var imageStream = fs.createWriteStream(path);
    var options = getOptions(bodyMock);

    request(options, checkFormat)
        .pipe(imageStream)
        .on('close', checkImage);

    function checkFormat (err, res) {
        if (err) return console.error(err);
        t.equal(res.headers['content-type'], 'image/jpeg', 'Returned Data is in JPEG Format');
    }

    function checkImage () {
        var imageDimensions = sizeOf(path);
        var height = imageDimensions.height;
        var width = imageDimensions.width;

        t.equal(height, 800, 'output jpeg height matches body height');
        t.equal(width, 1000, 'output jpeg width matches body width');
        t.end();
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

    return opts;
}

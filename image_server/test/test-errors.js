'use strict';

var test = require('tape');
var request = require('request');
var fs = require('fs');

if (!fs.existsSync('./test-images')) fs.mkdirSync('./test-images');

test('request nonsense format: should return error 400', function (t) {
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
        'format': 'nonsense'
    };

    var options = getOptions(bodyMock);

    request(options, function (err, res, body) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 400, 'Server correctly handles foobar image type');
        t.equal(body, 'invalid or malformed request syntax', 'error message matches');
        t.end();
    });


});

test('test bad figure, should get error 460: bad figure', function (t) {
    t.plan(2);

    var bodyMock = {
        'figure': {
            'data': {}
        },
        'format': 'svg'
    };

    var options = getOptions(bodyMock);

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 422, 'Server correctly handles bad figure');
        t.equal(res.body, 'json parse error', 'error message matches');
        t.end();
    });


});

test('test bad figure, should get error 460: bad figure not an object', function (t) {
    t.plan(2);

    var bodyMock = {
        'figure': {
            'data': {}
        },
        'format': 'svg'
    };

    var options = {
        url: 'http://localhost:9010/',
        method: 'POST',
        body: JSON.stringify(bodyMock) + '/'
    };

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 422, 'Server correctly handles bad figure');
        t.equal(res.body, 'json parse error', 'error message matches');
        t.end();
    });


});

test('test bad figure, should get error 534: bad user json', function (t) {
    t.plan(1);

    var bodyMock = {
        'figure' : {
            'data': [
            {
            'x': [[1,2], [10,20]],
            'y': [[1,2], [10,20]],
            'z': [[1,2], [10,20]],
            'type': 'heatmap'
            }
        ],
        'format' : 'svg'
        }
    };

    var options = getOptions(bodyMock);

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 500, 'Server handled bad json');
        t.end();
    });


});



/*
*   Give it a json object for the body,
*   it'll return an options object ready
*   for request().
*/
function getOptions (body, url) {

    var opts = {
        url: url || 'http://localhost:9010/',
        method: 'POST'
    };

    if (body) opts.body = JSON.stringify(body);

    return opts;
}

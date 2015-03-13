'use strict';

var test = require('tape');
var request = require('request');
var getOptions = require('./tools/get-options');
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

test('test empty figure, should get error 400', function (t) {
    t.plan(2);

    var bodyMock = {
        'figure': {}
    };

    var options = getOptions(bodyMock);

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 400, 'Server correctly handles bad figure');
        t.equal(res.body, 'invalid or malformed request syntax', 'error message matches');
        t.end();
    });


});

test('test bad data in figure, should get error 400', function (t) {
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
        body: JSON.stringify(bodyMock)
    };

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 400, 'Server correctly handles bad data in figure');
        t.equal(res.body, 'invalid or malformed request syntax', 'error message matches');
        t.end();
    });


});

test('test bad layout in figure, should get error 400', function (t) {
    t.plan(2);

    var bodyMock = {
        'figure': {
            'layout': []
        },
        'format': 'svg'
    };

    var options = {
        url: 'http://localhost:9010/',
        method: 'POST',
        body: JSON.stringify(bodyMock)
    };

    request(options, function (err, res) {
        if (err) return console.error(err);
        t.equal(res.statusCode, 400, 'Server correctly handles bad layout in figure');
        t.equal(res.body, 'invalid or malformed request syntax', 'error message matches');
        t.end();
    });


});

test('test bad body (tailing slash), should get error 422', function (t) {
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
        t.equal(res.statusCode, 422, 'Server correctly handles bad body');
        t.equal(res.body, 'json parse error', 'error message matches');
        t.end();
    });


});


test('test including wrong data in plotly.js figure. should 525: plotly.js error', function (t) {
    t.plan(2);

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
        t.equal(res.statusCode, 525, 'plotlyjs handled bad json as expected');
        t.equal(res.body, 'plotlyjs error', 'error message matches');
        t.end();
    });


});

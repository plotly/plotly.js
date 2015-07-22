'use strict';

var http = require('http');
var ecstatic = require('ecstatic');
var browserify = require('browserify');
var open = require('open');
var fs = require('fs');
var exec = require('child_process').exec;

var bundleName = 'test-images-viewer-bundle.js';

fs.unlink(bundleName, function(error) {
    exec('ls ../test-images-diffs/ > list-of-incorrect-images.txt', function() {
        var b = browserify('./viewer.js', {
                    debug: true,
                    verbose: true
                });
        b.transform('brfs');
        b.bundle().pipe(fs.createWriteStream(bundleName));
    });
});

http.createServer(
    ecstatic({ root: '../.'  })
).listen(9090);

console.log('Listening on :9090');
open('http://localhost:9090/test-images-viewer');

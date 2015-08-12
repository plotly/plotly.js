'use strict';

var http = require('http');
var ecstatic = require('ecstatic');
var browserify = require('browserify');
var open = require('open');
var fs = require('fs');
var exec = require('child_process').exec;

var bundleName = 'test-images-viewer-bundle.js',
    listName = 'list-of-incorrect-images.txt';

fs.unlink(bundleName, function(err) {
    exec('ls ../test-images-diffs/ > ' + listName, function() {
        var b = browserify('./viewer.js', {
                    debug: true,
                    verbose: true
                });
        b.transform('brfs');
        b.bundle().pipe(fs.createWriteStream(bundleName));

        fs.readFile(listName, 'utf8', function(err, data) {
            console.log('In ' + listName + ':\n' + data);
        });
    });
});

http.createServer(
    ecstatic({ root: '../.'  })
).listen(9090);

console.log('Listening on :9090\n');
open('http://localhost:9090/test-images-viewer');

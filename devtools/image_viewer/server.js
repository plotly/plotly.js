var fs = require('fs');
var http = require('http');
var path = require('path');
var exec = require('child_process').exec;

var browserify = require('browserify');
var ecstatic = require('ecstatic');
var _open = require('open');

var constants = require('../../tasks/util/constants');


// TODO make this an optional argument
var PORT = '9090';

console.log('Listening on :' + PORT + '\n');

var listName = 'list-of-incorrect-images.txt';

// build image viewer bundle
fs.unlink(constants.pathToImageViewerBundle, function() {
    exec('ls ../test-images-diffs/ > ' + listName, function() {
        var b = browserify(path.join(__dirname, './viewer.js'), { debug: true });

        b.transform('brfs');
        b.bundle(function(err) {
            if(err) throw err;

            _open('http://localhost:' + PORT + '/devtools/image_viewer');
        })
        .pipe(fs.createWriteStream(constants.pathToImageViewerBundle));

        fs.readFile(listName, 'utf8', function(err, data) {
            console.log('In ' + listName + ':\n' + data);
        });
    });
});

// boot up server
http.createServer(
    ecstatic({ root: constants.pathToRoot })
).listen(PORT);

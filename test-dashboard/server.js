var http = require('http');
var ecstatic = require('ecstatic');
var browserify = require('browserify');
var open = require('open');
var fs = require('fs');
var watchify = require('watchify');
var path = require('path');
var outpipe = require('outpipe');
var outfile = path.join(__dirname, '../shelly/plotlyjs/static/plotlyjs/build/plotlyjs-bundle.js');

var testFile = process.argv[2]==='geo' ? './test-geo' : './test';
console.log('using ' + testFile);

var b = browserify(path.join(__dirname, '../shelly/plotlyjs/static/plotlyjs/src/plotly.js'), {
  debug: true,
  verbose: true,
  standalone: 'Plotly',
  cache: {},
  packageCache: {}
});

var w = watchify(b);

var bytes, time;
w.on('bytes', function (b) { bytes = b });
w.on('time', function (t) { time = t });

w.on('update', bundle);
bundle();

function bundle () {
    var didError = false;
    var outStream = process.platform === 'win32'
        ? fs.createWriteStream(outfile)
        : outpipe(outfile);

    var wb = w.bundle();
    wb.on('error', function (err) {
        console.error(String(err));
        didError = true;
        outStream.end('console.error('+JSON.stringify(String(err))+');');
    });
    wb.pipe(outStream);

    outStream.on('error', function (err) {
        console.error(err);
    });
    outStream.on('close', function () {
        if (!didError) {
            console.error(bytes + ' bytes written to ' + outfile
                + ' (' + (time / 1000).toFixed(2) + ' seconds)'
            );
        }
    });
}

////// build the test examples

fs.unlink('./test-bundle.js', function(error) {
    browserify({
        debug: true,
        verbose: true
    }).add(testFile).bundle()
        .pipe(fs.createWriteStream('test-bundle.js'));
});

http.createServer(
  ecstatic({ root: '../.'  })
).listen(8080);

console.log('Listening on :8080');

open('http://localhost:8080/test-dashboard');

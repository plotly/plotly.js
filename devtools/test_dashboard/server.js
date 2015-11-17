var fs = require('fs');
var http = require('http');
var path = require('path');

var browserify = require('browserify');
var ecstatic = require('ecstatic');
var _open = require('open');

var makeWatchifiedBundle = require('../../tasks/util/make_watchified_bundle');
var shortcutPaths = require('../../tasks/util/shortcut_paths');
var constants = require('../../tasks/util/constants');


// TODO make this an optional argument
var PORT = '8080';

var testFile;
switch(process.argv[2]) {
    case 'geo':
        testFile = 'test_geo';
    break;
    case 'gl3d':
        testFile = 'test_gl3d';
    break;
    default:
        testFile = 'test_gl2d';
}

console.log('Using ' + testFile);
console.log('Listening on :' + PORT + '\n');

// watch plotly.js
var watchifiedBundle = makeWatchifiedBundle(function onFirstBundleCallback() {
    _open('http://localhost:' + PORT + '/devtools/test_dashboard');
});
watchifiedBundle();

// build the test examples
fs.unlink(constants.pathToTestDashboardBundle, function() {
    browserify(path.join(__dirname, testFile), {
        debug: true,
        transform: [shortcutPaths]
    })
    .bundle(function(err) {
        if(err) throw err;
    })
    .pipe(fs.createWriteStream(constants.pathToTestDashboardBundle));
});

// boot up server
http.createServer(
    ecstatic({ root: constants.pathToRoot })
).listen(PORT);

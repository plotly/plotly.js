var fs = require('fs');
var http = require('http');
var ecstatic = require('ecstatic');
var open = require('open');
var browserify = require('browserify');
var watchify = require('watchify');

var constants = require('../../tasks/util/constants');
var compress = require('../../tasks/util/compress_attributes');

var PORT = process.argv[2] || 3000;

var server = http.createServer(ecstatic({
    root: constants.pathToRoot,
    cache: 0,
    gzip: true
}));


// Bundle development code
var b = browserify(constants.pathToPlotlyIndex, {
    debug: true,
    standalone: 'Plotly',
    transform: [compress],
    cache: {},
    packageCache: {},
    plugin: [watchify]
});
b.on('update', bundle);

var firstBundle = true;
function bundle() {
    b.bundle(function(err) {
        if(err) {
            console.error('Error while bundling!', err);
        }

        if(firstBundle) {
            open('http://localhost:' + PORT + '/devtools/test_dashboard_v2');
            firstBundle = false;
        }
        console.log('Bundle updated at ' + new Date().toLocaleTimeString());
    }).pipe(fs.createWriteStream(constants.pathToPlotlyBuild));
}

bundle();
server.listen(PORT);

console.log('Building the first bundle. This might take a little while...\n');

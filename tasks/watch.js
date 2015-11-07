var fs = require('fs');
var browserify = require('browserify');
var watchify = require('watchify');

var compressAttributes = require('./util/compress_attributes');
var setWatchifyOutput = require('./util/set_bundle_stdout');
var constants = require('./util/constants');
 

// Watchify plotly.js
var b = browserify(constants.pathToPlotlySrc, {
    debug: true.
    standalone: 'Plotly',
    transform: [compressAttributes],
    cache: {},
    packageCache: {},
    plugin: [watchify]
});

b.on('update', bundle);
setWatchifyOutput(b);
bundle();

function bundle() {
    b.bundle().pipe(
        fs.createWriteStream(constants.pathToPlotlyDist)
    );
}

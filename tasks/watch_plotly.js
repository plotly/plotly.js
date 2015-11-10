var fs = require('fs');

var browserify = require('browserify');
var watchify = require('watchify');

var compressAttributes = require('./util/compress_attributes');
var formatBundleMsg = require('./util/format_bundle_msg');
var constants = require('./util/constants');

/**
 * Make a browserify bundle function watched by watchify.
 *
 * @param {function} onFirstBundleCallback executed when first bundle is completed
 *
 */
function makeWatchifiedBundle(onFirstBundleCallback) {
    var b = browserify(constants.pathToPlotlySrc, {
        debug: true,
        standalone: 'Plotly',
        transform: [compressAttributes],
        cache: {},
        packageCache: {},
        plugin: [watchify]
    });

    var firstBundle = true;

    if(firstBundle) {
        console.log([
            '***',
            'Building the first bundle, this should take ~10 seconds',
            '***\n'
        ].join(' '));
    }

    b.on('update', bundle);
    formatBundleMsg(b, 'plotly.js');

    function bundle() {
        b.bundle(function(err) {
            if(err) console.error(JSON.stringify(String(err)));

            if(firstBundle) {
                onFirstBundleCallback();
                firstBundle = false;
            }
        })
        .pipe(
            fs.createWriteStream(constants.pathToPlotlyDist)
        );
    }

    return bundle;
}

// call watchifiedBundle if ran in CLI
if(process.argv[1] === __filename) {
    var watchifiedBundle = makeWatchifiedBundle(function() {});
    watchifiedBundle();
}

// export if required in
module.exports = makeWatchifiedBundle;

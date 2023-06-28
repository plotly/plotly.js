var minimist = require('minimist');
var pixelmatch = require('pixelmatch');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var common = require('../../tasks/util/common');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

/**
 *  Image pixel comparison test script.
 *
 *  Called by `tasks/test_image.sh in `npm run test-image`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run all tests:
 *
 *      npm run test-image
 *
 *  Run the 'contour_nolines' test:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run all gl3d image test
 *
 *      npm run test-image -- gl3d_*
 *
 */

var argv = minimist(process.argv.slice(2), {});

// If no pattern is provided, all mocks are compared
if(argv._.length === 0) {
    argv._.push('');
}

// Build list of mocks to compare
var allMockList = [];
var mathjax3;
argv._.forEach(function(pattern) {
    if(pattern === 'mathjax3') {
        mathjax3 = true;
    } else {
        var mockList = getMockList(pattern);

        if(mockList.length === 0) {
            throw 'No mocks found with pattern ' + pattern;
        }

        allMockList = allMockList.concat(mockList);
    }
});

allMockList = allMockList.filter(function(a) {
    return (
        // used to pass before 2023 Jun 20
        a !== 'mapbox_stamen-style' &&

        // skip for now | TODO: figure out why needed this in https://github.com/plotly/plotly.js/pull/6610
        a !== 'mapbox_custom-style'
    );
});

if(mathjax3) {
    allMockList = [
        'legend_mathjax_title_and_items',
        'mathjax',
        'parcats_grid_subplots',
        'table_latex_multitrace_scatter',
        'table_plain_birds',
        'table_wrapped_birds',
        'ternary-mathjax'
    ];
}

// To get rid of duplicates
function unique(value, index, self) {
    return self.indexOf(value) === index;
}
allMockList = allMockList.filter(unique);

var skipped = [];
var failed = [];
var fail = function(mockName) {
    if(failed.indexOf(mockName) === -1) {
        failed.push(mockName);
    }
};
for(var i = 0; i < allMockList.length; i++) {
    var mockName = allMockList[i];

    // skip blacklist
    if([
        'mapbox_density0-legend',
        'mapbox_osm-style'
    ].indexOf(mockName) !== -1) {
        continue;
    }

    var isMapbox = mockName.substr(0, 7) === 'mapbox_';
    var isOtherFlaky = [
        // list flaky mocks other than mapbox:
        'gl3d_bunny-hull'
    ].indexOf(mockName) !== -1;

    if(mathjax3) mockName = 'mathjax3___' + mockName;

    var imagePaths = getImagePaths(mockName);
    var base = imagePaths.baseline;
    var test = imagePaths.test;

    if(!common.doesFileExist(test) && !mathjax3) {
        console.log('- skip:', mockName);
        skipped.push(mockName);
        continue;
    }
    console.log('+ test:', mockName);

    var img0 = PNG.sync.read(fs.readFileSync(base));
    var img1 = PNG.sync.read(fs.readFileSync(test));
    var s0, s1, key;

    key = 'width';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        fail(mockName);
    }

    key = 'height';
    s0 = img0[key];
    s1 = img0[key];
    if(s0 !== s1) {
        console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
        fail(mockName);
    }

    var width = img0.width;
    var height = img0.height;

    var diff = new PNG({
        width: width,
        height: height
    });

    var shouldBePixelPerfect = !(isMapbox || isOtherFlaky);

    var numDiffPixels = pixelmatch(img0.data, img1.data, diff.data, width, height, {
        threshold: shouldBePixelPerfect ? 0 :
            [
                // more flaky
                'mapbox_angles',
                'mapbox_layers',
                'mapbox_custom-style',
                'mapbox_geojson-attributes'
            ].indexOf(mockName) !== -1 ? 1 : 0.15
    });

    if(numDiffPixels) {
        fs.writeFileSync(imagePaths.diff, PNG.sync.write(diff));

        console.error('pixels do not match: ' + numDiffPixels);
        fail(mockName);
    } else {
        // remove when identical
        fs.unlinkSync(imagePaths.test);
    }
}

if(failed.length || skipped.length) {
    throw JSON.stringify({
        failed: failed,
        skipped: skipped
    }, null, 2);
}

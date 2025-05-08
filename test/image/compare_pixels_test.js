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
var virtualWebgl = false;
argv._.forEach(function(pattern) {
    if(pattern === 'mathjax3') {
        mathjax3 = true;
    } else if(pattern === 'virtual-webgl') {
        virtualWebgl = true;
        allMockList = getMockList('');
    } else {
        var mockList = getMockList(pattern);

        if(mockList.length === 0) {
            throw 'No mocks found with pattern ' + pattern;
        }

        allMockList = allMockList.concat(mockList);
    }
});

var blacklist = [
    'map_angles',
    'map_stamen-style',
    'map_predefined-styles2',
    'map_scattercluster',
    'map_fonts-supported-open-sans',
    'map_fonts-supported-open-sans-weight',
];

if(virtualWebgl) {
    allMockList = allMockList.filter(function(a) {
        return a.slice(0, 2) === 'gl';
    });
}

if(mathjax3) {
    allMockList = [
        'legend_mathjax_title_and_items',
        'mathjax',
        'parcats_grid_subplots',
        'table_latex_multitrace_scatter',
        'table_plain_birds',
        'table_wrapped_birds',
        'ternary-mathjax',
        'ternary-mathjax-title-place-subtitle',
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
    if(blacklist.indexOf(mockName) !== -1) continue;

    var flakyMap = [
        // more flaky
        'map_density0-legend',
        'map_osm-style',
        'map_predefined-styles1',
        'map_predefined-styles2',
    ].indexOf(mockName) !== -1;

    var otherFlaky = [
        // list flaky mocks other than maps:
        'gl3d_bunny-hull'
    ].indexOf(mockName) !== -1;

    var threshold =
        flakyMap ? 1 :
        otherFlaky ? 0.15 :
        0;

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

    if(virtualWebgl) {
        threshold = Math.max(0.4, threshold);
        if([
            'gl3d_ibm-plot',
            'gl3d_isosurface_2surfaces-checker_spaceframe',
            'gl3d_opacity-scaling-spikes',
            'gl3d_cone-wind',
            'gl3d_isosurface_math',
            'gl3d_scatter3d-blank-text',
            'gl3d_mesh3d_surface3d_scatter3d_line3d_error3d_log_reversed_ranges'
        ].indexOf(mockName) !== -1) threshold = 0.7;
    }

    var numDiffPixels = pixelmatch(img0.data, img1.data, diff.data, width, height, {
        threshold: threshold
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

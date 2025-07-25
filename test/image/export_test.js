var probeSync = require('probe-image-size/sync');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

// image formats to test
//
// N.B. 'png' is tested in `npm run test-image, no need to duplicate here
var FORMATS = ['svg', 'jpg', 'jpeg', 'webp', 'pdf'];

var ONLY_FILE_SIZE = ['eps', 'pdf'];

// minimum satisfactory file size [in bytes]
var MIN_SIZE = 100;

// non-exhaustive list of mocks to test
var DEFAULT_LIST = [
    'plot_types',
    'annotations',
    'shapes',
    'range_slider',
    'contour_legend-colorscale',
    'layout_image',
    'image_astronaut_source',
    'gl2d_no-clustering2',
    'gl3d_surface-heatmap-treemap_transparent-colorscale',
    'map_density-multiple_legend',
    'smith_modes',
    'zsmooth_methods',
    'fonts',
    'mathjax'
];

/**
 *  Image export test script.
 *
 *  Called by `tasks/test_export.sh in `npm run test-export`.
 *
 *  CLI arguments:
 *
 *  1. 'pattern' : glob determining which mock(s) are to be tested
 *
 *  Examples:
 *
 *  Run the export test on the default mock list:
 *
 *      npm run test-image
 *
 *  Run the export on the 'contour_nolines' mock:
 *
 *      npm run test-image -- contour_nolines
 *
 *  Run the export test on all gl3d mocks:
 *
 *      npm run test-image -- gl3d_*
 */

var pattern = process.argv[2];
var mockList = pattern ? getMockList(pattern) : DEFAULT_LIST;

if(mockList.length === 0) {
    throw 'No mocks found with pattern ' + pattern;
}

var failed = 0;
for(var i = 0; i < mockList.length; i++) {
    for(var j = 0; j < FORMATS.length; j++) {
        var mockName = mockList[i];
        var format = FORMATS[j];
        var base = getImagePaths(mockName).baseline;
        var test = getImagePaths(mockName, format).test;
        console.log('testing sizes of' + mockName + '.' + format);

        var fileSize = fs.statSync(test).size;
        if(!(fileSize >= MIN_SIZE)) {
            console.error('invalid file size: ' + fileSize);
            failed++;
        }

        if(ONLY_FILE_SIZE.indexOf(format) === -1) {
            var img0 = PNG.sync.read(fs.readFileSync(base));
            var img1 = probeSync(fs.readFileSync(test));
            var s0, s1, key;

            key = 'width';
            s0 = img0[key];
            s1 = img1[key];
            if(s0 !== s1) {
                console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
                failed++;
            }

            key = 'height';
            s0 = img0[key];
            s1 = img1[key];
            if(s0 !== s1) {
                console.error(key + 's do not match: ' + s0 + ' vs ' + s1);
                failed++;
            }
        }
    }
}

if(failed) {
    throw 'Problem during export.';
}

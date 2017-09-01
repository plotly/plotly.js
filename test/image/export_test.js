var fs = require('fs');
var sizeOf = require('image-size');

var run = require('./assets/run');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

var argv = require('minimist')(process.argv.slice(2), {
    'boolean': ['help', 'debug'],
    'alias': {
        help: ['h', 'info']
    },
    'default': {
        help: false,
        debug: false
    }
});

// no 'png' as it is tested in `compare_pixels_test.js`
var FORMATS = ['jpeg', 'webp', 'svg', 'pdf', 'eps'];

// non-exhaustive list of mocks to test
var DEFAULT_LIST = [
    '0', 'geo_first', 'gl3d_z-range', 'text_export', 'layout_image', 'gl2d_12',
    'range_slider_initial_valid'
];

// return dimensions [in px]
var WIDTH = 700;
var HEIGHT = 500;

// minimum satisfactory file size [in bytes]
var MIN_SIZE = 100;

if(argv.help) {
    console.log([
        'Image export test script.',
        '',
        'The tests below determine whether the images are properly',
        'exported by (only) checking the file size of the generated images.',
        '',
        'Called by `tasks/test_export.sh in `npm run test-export`.',
        '',
        'CLI arguments:',
        '',
        '1. \'pattern\' : glob determining which mock(s) are to be tested',
        '',
        'Examples:',
        '',
        'Run the export test on the default mock list (in batch):',
        '',
        '   npm run test-image',
        '',
        'Run the export on the \'contour_nolines\' mock:',
        '',
        '    npm run test-image -- contour_nolines',
        '',
        'Run the export test on all gl3d mocks (in batch):',
        '',
        '    npm run test-image -- gl3d_*',
    ].join('\n'));
    process.exit(0);
}

var _mockList = argv._.length > 0 ? getMockList(argv._) : DEFAULT_LIST;
var mockList = [];
var input = [];

_mockList.forEach(function(mockName) {
    FORMATS.forEach(function(format) {
        mockList.push(mockName + '.' + format)
        input.push({
            figure: getImagePaths(mockName).mock,
            format: format,
            width: WIDTH,
            height: HEIGHT
        });
    });
});

run(mockList, input, argv, function write(info, done) {
    var mockName = mockList[info.itemIndex];
    var format = info.format;
    var paths = getImagePaths(mockName, format);

    fs.writeFile(paths.test, info.body, function(err) {
        if(err) return done(err);

        var didExport;

        if(format === 'pdf' || format === 'eps') {
            var stats = fs.statSync(paths.test);
            didExport = stats.size > MIN_SIZE;
        } else {
            var dims = sizeOf(paths.test);
            didExport = (dims.width === WIDTH) && (dims.height === HEIGHT);
        }

        done(didExport ? '' : format);
    });
});

var fs = require('fs');

var run = require('./assets/run');
var getMockList = require('./assets/get_mock_list');
var getImagePaths = require('./assets/get_image_paths');

var argv = require('minimist')(process.argv.slice(2), {
    'boolean': ['queue', 'help', 'debug'],
    'string': ['parallel-limit'],
    'alias': {
        help: ['h', 'info']
    },
    'default': {
        'parallel-limit': '1'
    }
});

if(argv.help) {
    console.log([
        'Baseline image generation script.',
        '',
        '  CLI arguments:',
        '',
        '  1. \'pattern\' : glob determining the baseline(s) to be generated',
        '',
        'Examples:',
        '',
        'Generate or (re-generate) all baselines (in queue):',
        '',
        '   npm run baseline',
        '',
        'Generate or (re-generate) the \'contour_nolines\' baseline:',
        '',
        '   npm run baseline -- contour_nolines',
        '',
        'Generate or (re-generate) all gl3d baseline (in queue):',
        '',
        '   npm run baseline -- gl3d_*',
        '',
        'Generate all baselines except gl3d and pie (N.B. need to escape special characters):',
        '',
        '   npm run baseline -- "\!\(gl3d_*\|pie_*\)"',
        ''
    ].join('\n'));
    process.exit(0);
}

var mockList = getMockList(argv._);
var input = mockList.map(function(m) { return getImagePaths(m).mock; });

run(mockList, input, argv, function write(info, done) {
    var mockName = mockList[info.itemIndex];
    var imgData = info.body;
    var paths = getImagePaths(mockName);

    fs.writeFile(paths.baseline, imgData, function(err) {
        if(err) {
            done('error while saving ' + mockName + ' test image');
        } else {
            done();
        }
    });
});

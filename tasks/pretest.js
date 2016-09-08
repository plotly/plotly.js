var fs = require('fs');

var constants = require('./util/constants');
var common = require('./util/common');

// main
makeCredentialsFile();
makeSetPlotConfigFile();
makeTestImageFolders();
makeRequireJSFixture();

// Create a credentials json file,
// to be required in jasmine test suites and test dashboard
function makeCredentialsFile() {
    var credentials = JSON.stringify({
        MAPBOX_ACCESS_TOKEN: constants.mapboxAccessToken
    }, null, 2);

    common.writeFile(constants.pathToCredentials, credentials);
    logger('make build/credentials.json');
}

// Create a 'set plot config' file,
// to be included in the image test index
function makeSetPlotConfigFile() {
    var setPlotConfig = [
        '\'use strict\';',
        '',
        '/* global Plotly:false */',
        '',
        'Plotly.setPlotConfig({',
        '    mapboxAccessToken: \'' + constants.mapboxAccessToken + '\'',
        '});',
        ''
    ].join('\n');

    common.writeFile(constants.pathToSetPlotConfig, setPlotConfig);
    logger('make build/set_plot_config.js');
}

// Make artifact folders for image tests
function makeTestImageFolders() {

    function makeOne(folderPath, info) {
        if(!common.doesDirExist(folderPath)) {
            fs.mkdirSync(folderPath);
            logger('initialize ' + info);
        }
        else logger(info + ' is present');
    }

    makeOne(constants.pathToTestImages, 'test image folder');
    makeOne(constants.pathToTestImagesDiff, 'test image diff folder');
}

// Make script file that define plotly in a RequireJS context
function makeRequireJSFixture() {
    var bundle = fs.readFileSync(constants.pathToPlotlyDistMin, 'utf-8'),
        template = 'define(\'plotly\', function(require, exports, module) { {{bundle}} });',
        index = template.replace('{{bundle}}', bundle);

    common.writeFile(constants.pathToRequireJSFixture, index);
    logger('make build/requirejs_fixture.js');
}

function logger(task) {
    console.log('ok ' + task);
}

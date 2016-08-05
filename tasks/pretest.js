var fs = require('fs');

var constants = require('./util/constants');
var common = require('./util/common');
var containerCommands = require('./util/container_commands');
var isCI = process.env.CIRCLECI;

// main
makeCredentialsFile();
makeSetPlotConfigFile();
makeTestImageFolders();
if(isCI) runAndSetupImageTestContainer();

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

// On CircleCI, run and setup image test container once an for all
function runAndSetupImageTestContainer() {

    function run() {
        var cmd = containerCommands.dockerRun;
        common.execCmd(cmd, function() {
            logger('run docker container');

            setTimeout(setup, 500);
        });
    }

    function setup() {
        var cmd = containerCommands.getRunCmd(isCI, [
            containerCommands.setup
        ]);
        common.execCmd(cmd, function() {
            logger('setup docker container');
        });
    }

    run();
}

function logger(task) {
    console.log('ok ' + task);
}

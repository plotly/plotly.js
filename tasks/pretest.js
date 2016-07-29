var fs = require('fs');
var constants = require('./util/constants');



// Create a credentials json file,
// to be required in jasmine test suites and test dashboard
var credentials = JSON.stringify({
    MAPBOX_ACCESS_TOKEN: mapboxAccessToken
}, null, 2);

fs.writeFile(constants.pathToCredentials, credentials, function(err) {
    if(err) throw err;
});

// Create a 'set plot config' file,
// to be included in the image test index
var setPlotConfig = [
    '\'use strict\';',
    '',
    '/* global Plotly:false */',
    '',
    'Plotly.setPlotConfig({',
    '    mapboxAccessToken: \'' + mapboxAccessToken + '\'',
    '});',
    ''
].join('\n');

fs.writeFile(constants.pathToSetPlotConfig, setPlotConfig, function(err) {
    if(err) throw err;
});

// make artifact folders for image tests
if(!doesDirExist(constants.pathToTestImagesDiff)) {
    fs.mkdirSync(constants.pathToTestImagesDiff);
}
if(!doesDirExist(constants.pathToTestImages)) {
    fs.mkdirSync(constants.pathToTestImages);
}

function doesDirExist(dirPath) {
    try {
        if(fs.statSync(dirPath).isDirectory()) return true;
    }
    catch(e) {
        return false;
    }

    return false;
}

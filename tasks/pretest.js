var fs = require('fs');
var constants = require('./util/constants');
var mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;


if(!mapboxAccessToken) {
    throw new Error([
        'MAPBOX_ACCESS_TOKEN not found!!!',
        'Please export your mapbox access token into and try again.'
    ].join('\n'));
}

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
if(!fs.existsSync(constants.pathToTestImagesDiff)) {
    fs.mkdirSync(constants.pathToTestImagesDiff);
}
if(!fs.existsSync(constants.pathToTestImages)) {
    fs.mkdirSync(constants.pathToTestImages);
}

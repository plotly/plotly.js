var constants = require('./util/constants');
var makeEmptyDirectory = require('./util/make_empty_directory');
var emptyDir = makeEmptyDirectory.emptyDir;
var makeDir = makeEmptyDirectory.makeDir;

var dist = constants.pathToDist; // dist
var distTopojson = constants.pathToTopojsonDist; // dist/topojson

// main
emptyDir(distTopojson);
emptyDir(dist);
makeDir(dist);
makeDir(distTopojson);

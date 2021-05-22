var path = require('path');
var fs = require('fs-extra');
var common = require('./util/common');
var constants = require('./util/constants');

var dist = constants.pathToDist; // dist
var distTopojson = constants.pathToTopojsonDist; // dist/topojson
// main
emptyDir(distTopojson);
emptyDir(dist);
makeDir(dist);
makeDir(distTopojson);

function emptyDir(dir) {
    if(common.doesDirExist(dir)) {
        console.log('empty ' + dir);
        try {
            var allFiles = fs.readdirSync(dir);
            allFiles.forEach(function(file) {
                // remove file
                fs.unlinkSync(path.join(dir, file));
            });

            fs.rmdirSync(dir);
        } catch(err) {
            console.error(err);
        }
    }
}

function makeDir(dir) {
    if(!common.doesDirExist(dir)) {
        // create folder
        fs.mkdirSync(dir);
    }
}

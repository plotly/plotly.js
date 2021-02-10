var fs = require('fs-extra');
var common = require('./util/common');
var constants = require('./util/constants');

// main
emptyDist();

function emptyDist() {
    var dir = constants.pathToDist;
    if(common.doesDirExist(dir)) {
        console.log('empty ' + dir);
        try {
            fs.rmdirSync(dir, { recursive: true });
        } catch(err) {
            console.error(err);
        }

        // create folder
        fs.mkdirSync(dir);
    }
}

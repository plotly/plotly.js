var fs = require('fs');

var constants = require('./util/constants');
var common = require('./util/common');

// main
makeTestImageFolders();


// Make artifact folders for image tests
function makeTestImageFolders() {
    function makeOne(folderPath, info) {
        if(!common.doesDirExist(folderPath)) {
            fs.mkdirSync(folderPath);
            logger('initialize ' + info);
        } else logger(info + ' is present');
    }

    makeOne(constants.pathToTestImages, 'test image folder');
    makeOne(constants.pathToTestImagesDiff, 'test image diff folder');
}

function logger(task) {
    console.log('ok ' + task);
}

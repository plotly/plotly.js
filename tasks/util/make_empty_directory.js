var path = require('path');
var fs = require('fs-extra');
var common = require('./common');

module.exports = {
    emptyDir: emptyDir,
    makeDir: makeDir
};

function emptyDir(dir, opts) {
    if(common.doesDirExist(dir)) {
        console.log('empty ' + dir);
        try {
            var allFiles = fs.readdirSync(dir);
            var hasFilter = false;
            if(opts && opts.filter) {
                hasFilter = true;
                allFiles = allFiles.filter(opts.filter);
            }

            allFiles.forEach(function(file) {
                // remove file
                fs.unlinkSync(path.join(dir, file));
            });

            if(!hasFilter) {
                fs.rmdirSync(dir);
            }
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

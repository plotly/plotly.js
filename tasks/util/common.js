var fs = require('fs');
var exec = require('child_process').exec;

exports.execCmd = function(cmd, cb, errorCb) {
    cb = cb ? cb : function() {};
    errorCb = errorCb ? errorCb : function(err) { if(err) throw err; };

    exec(cmd, function(err) {
        errorCb(err);
        cb();
    })
    .stdout.pipe(process.stdout);
};

exports.writeFile = function(filePath, content, cb) {
    fs.writeFile(filePath, content, function(err) {
        if(err) throw err;
        if(cb) cb();
    });
};

exports.doesDirExist = function(dirPath) {
    try {
        if(fs.statSync(dirPath).isDirectory()) return true;
    }
    catch(e) {
        return false;
    }

    return false;
};

exports.doesFileExist = function(filePath) {
    try {
        if(fs.statSync(filePath).isFile()) return true;
    }
    catch(e) {
        return false;
    }

    return false;
};

exports.formatTime = function(date) {
    return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        date.toString().match(/\(([A-Za-z\s].*)\)/)[1]
    ].join(' ');
};

exports.getTimeLastModified = function(filePath) {
    if(!exports.doesFileExist(filePath)) {
        throw new Error(filePath + ' does not exist');
    }

    var stats = fs.statSync(filePath),
        formattedTime = exports.formatTime(stats.mtime);

    return formattedTime;
};

exports.touch = function(filePath) {
    fs.closeSync(fs.openSync(filePath, 'w'));
};

exports.throwOnError = function(err) {
    if(err) throw err;
};

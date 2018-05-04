var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var constants = require('./constants');

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
    } catch(e) {
        return false;
    }

    return false;
};

exports.doesFileExist = function(filePath) {
    try {
        if(fs.statSync(filePath).isFile()) return true;
    } catch(e) {
        return false;
    }

    return false;
};

exports.formatTime = function(date) {
    return [
        date.toLocaleDateString(),
        date.toLocaleTimeString()
    ].join(' ');
};

exports.getTimeLastModified = function(filePath) {
    if(!exports.doesFileExist(filePath)) {
        throw new Error(filePath + ' does not exist');
    }

    var stats = fs.statSync(filePath);
    var formattedTime = exports.formatTime(stats.mtime);

    return formattedTime;
};

exports.touch = function(filePath) {
    fs.closeSync(fs.openSync(filePath, 'w'));
};

exports.throwOnError = function(err) {
    if(err) throw err;
};

exports.testImageWrapper = function(opts) {
    var isCI = process.env.CIRCLECI;
    var useLocalElectron = process.env.LOCAL_ELECTRON;
    var args = opts.args.join(' ');

    var msg = [
        'Running ' + opts.msg + ' using build/plotly.js from',
        exports.getTimeLastModified(constants.pathToPlotlyBuild),
        '\n'
    ].join(' ');

    var pathToElectron;
    var pathToScript;
    var cmd;

    if(useLocalElectron) {
        try {
            // N.B. this is what require('electron') in a node context
            pathToElectron = require('electron');
        } catch(e) {
            throw new Error('electron not installed locally');
        }

        pathToScript = path.join(constants.pathToImageTest, opts.script);
        cmd = [pathToElectron, pathToScript, args].join(' ');
    } else {
        pathToElectron = path.join(constants.testContainerHome, '..', 'node_modules', '.bin', 'electron');
        pathToScript = path.join(constants.testContainerHome, 'test', 'image', opts.script);

        var baseCmd = [
            'xvfb-run --auto-servernum',
            '--server-args \'-screen 0, 1024x768x24\'',
            pathToElectron, pathToScript, args
        ].join(' ');

        if(isCI) {
            cmd = baseCmd;
        } else {
            cmd = [
                'docker exec -i', constants.testContainerName,
                '/bin/bash -c',
                '"' + baseCmd + '"'
            ].join(' ');
        }
    }

    console.log(msg);
    if(process.env.DEBUG) console.log('\n' + cmd);

    execSync(cmd, {stdio: [0, 1, 2]});
};

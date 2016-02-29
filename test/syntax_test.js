var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');

var constants = require('../tasks/util/constants');

// check for for focus and exclude jasmine blocks

var BLACK_LIST = ['fdescribe', 'fit', 'xdescribe', 'xit'];
var testGlob = path.join(constants.pathToJasmineTests, '**/*.js');
var bundleTestGlob = path.join(constants.pathToJasmineBundleTests, '**/*.js');

var logsJasmine = [];
glob('{' + testGlob + ',' + bundleTestGlob + '}', function(err, files) {
    files.forEach(function(file) {
        var code = fs.readFileSync(file, 'utf-8');

        falafel(code, {locations: true}, function(node) {
            if(node.type === 'Identifier' && BLACK_LIST.indexOf(node.name) !== -1) {
                logsJasmine.push([
                    path.basename(file),
                    '[line ' + node.loc.start.line + '] :',
                    'contains either a *fdescribe*, *fit*,',
                    '*xdescribe* or *xit* block.'
                ].join(' '));
            }
        });

    });

    if(logsJasmine.length) {
        throw new Error('\n' + logsJasmine.join('\n') + '\n');
    }
});

// check for header in src and lib files

var licenseSrc = constants.licenseSrc;
var licenseStr = licenseSrc.substring(2, licenseSrc.length - 2);
var srcGlob = path.join(constants.pathToSrc, '**/*.js');
var libGlob = path.join(constants.pathToLib, '**/*.js');

var logsHeader = [];
glob('{' + srcGlob + ',' + libGlob + '}', function(err, files) {
    files.forEach(function(file) {
        var code = fs.readFileSync(file, 'utf-8');

        // parse through code string while keeping track of comments
        var comments = [];
        falafel(code, {onComment: comments, locations: true}, function() {});

        var header = comments[0];

        if(!header || header.loc.start.line > 1) {
            logsHeader.push(file + ' : has no header information.');
            return;
        }

        if(header.value !== licenseStr) {
            logsHeader.push(file + ' : has incorrect header information.');
        }
    });

    if(logsHeader.length) {
        throw new Error('\n' + logsHeader.join('\n') + '\n');
    }
});

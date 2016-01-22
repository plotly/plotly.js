var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');

var constants = require('../tasks/util/constants');

var BLACK_LIST = ['fdescribe', 'fit', 'xdescribe', 'xit'];
var logs = [];

var testGlob = path.join(constants.pathToJasmineTests, '**/*.js');
var bundleTestGlob = path.join(constants.pathToJasmineBundleTests, '**/*.js');


glob('{' + testGlob + ',' + bundleTestGlob + '}', function(err, files) {
    files.forEach(function(file) {
        var code = fs.readFileSync(file, 'utf-8');

        falafel(code, {locations: true}, function(node) {
            if(node.type === 'Identifier' && BLACK_LIST.indexOf(node.name) !== -1) {
                logs.push([
                    path.basename(file),
                    '[line ' + node.loc.start.line + '] :',
                    'contains either a *fdescribe*, *fit*,',
                    '*xdescribe* or *xit* block.'
                ].join(' '));
            }
        });

    });

    if(logs.length) throw new Error('\n' + logs.join('\n') + '\n');
});

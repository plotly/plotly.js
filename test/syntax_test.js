var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');

var constants = require('../tasks/util/constants');

var focusGlobals = ['fdescribe', 'fit'];
var logs = [];


glob(path.join(constants.pathToJasmineTests, '**/*.js'), function(err, files) {
    files.forEach(function(file) {
        var code = fs.readFileSync(file, 'utf-8');

        falafel(code, {locations: true}, function(node) {
            if(node.type === 'Identifier' && focusGlobals.indexOf(node.name) !== -1) {
                logs.push([
                    path.basename(file),
                    '[line ' + node.loc.start.line + '] :',
                    'contains either a *fdescribe* or a *fit* block.'
                ].join(' '));
            }
        });

    });

    if(logs.length) throw new Error(logs.join('\n'));
});

var path = require('path');
var fs = require('fs');

var jshint = require('jshint').JSHINT;
var glob = require('glob');

var constants = require('../tasks/util/constants');

var focusGlobals = ['fdescribe', 'fit'];
var logs = [];


glob(path.join(constants.pathToJasmineTests, '**/*.js'), function(err, files) {
    files.forEach(function(file) {
        var code = fs.readFileSync(file, 'utf-8');

        jshint(code);

        var impliedGlobals = jshint.data().implieds;

        impliedGlobals.forEach(function(obj) {
            if(focusGlobals.indexOf(obj.name) !== -1) {
                logs.push([
                    path.basename(file),
                    '[line ' + obj.line + '] :',
                    'contains either a *fdescribe* or a *fit* block.'
                ].join(' '));
            }
        });
    });

    if(logs.length) throw new Error(logs.join('\n'));
});

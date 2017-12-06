var path = require('path');
var fs = require('fs');

var falafel = require('falafel');
var glob = require('glob');

var constants = require('./util/constants');
var srcGlob = path.join(constants.pathToSrc, '**/*.js');

var common = require('./util/common');

var EXIT_CODE = 0;

var localizeRE = /(^|[\.])(_|localize)$/;

// main
findLocaleStrings();

function findLocaleStrings() {
    glob(srcGlob, function(err, files) {
        if(err) {
            EXIT_CODE = 1;
            console.log(err);
            return;
        }

        var dict = {};
        var hasTranslation = false;

        files.forEach(function(file) {
            var code = fs.readFileSync(file, 'utf-8');

            falafel(code, {locations: true}, function(node) {
                // parse through code string looking for translated strings
                // You may either assign `Lib.localize` to `_` and use that, or
                // call `Lib.localize` directly.
                if(node.type === 'CallExpression' &&
                    (node.callee.name === '_' || node.callee.source() === 'Lib._')
                ) {
                    var strNode = node.arguments[1];
                    if(node.arguments.length !== 2) {
                        logError(file, node, 'Localize takes 2 args');
                    }
                    if(strNode.type !== 'Literal') {
                        logError(file, node, 'Translated string must be a literal');
                    }
                    dict[strNode.value] = 1;
                    hasTranslation = true;
                }

                // make sure localize is the only thing we assign to a variable `_`
                // NB: this does not preclude using `_` for an unused function arg
                else if(node.type === 'VariableDeclarator' && node.id.name === '_') {
                    var src = node.init.source();
                    if(!localizeRE.test(src)) {
                        logError(file, node, 'Use `_` only to mean localization');
                    }
                }
            });
        });

        if(!hasTranslation) {
            console.error('Found no translations.');
            EXIT_CODE = 1;
        }

        if(!EXIT_CODE) {
            var strings = Object.keys(dict).sort().join('\n');
            common.writeFile(constants.pathToTranslationKeys, strings);
            console.log('ok find_locale_strings');
        }
    });
}

function logError(file, node, msg) {
    console.error(file + ' [line ' + node.loc.start.line + '] ' + msg +
        '\n   ' + node.source());
    EXIT_CODE = 1;
}

process.on('exit', function() {
    if(EXIT_CODE) {
        throw new Error('find_locale_strings failed.');
    }
});

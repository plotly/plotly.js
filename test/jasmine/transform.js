var transformTools = require('browserify-transform-tools');

/**
 * Transform require paths starting with '@src/' to
 * appropriate src/ folder paths
 */
var linkRoot = '@src';
var pathToSrc = '../../../src';

module.exports = transformTools.makeRequireTransform('requireTransform',
    { evaluateArguments: true, jsFilesOnly: true },
    function(args, opts, cb) {
        var arg = args[0];

        if(arg.indexOf(linkRoot) !== -1) {
            var tail = arg.split(linkRoot)[1];

            return cb(null, 'require(\''+ pathToSrc + tail + '\')');
        }
        else return cb();
    });

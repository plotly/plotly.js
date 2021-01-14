var transformTools = require('browserify-transform-tools');
var pathToStrictD3Module = require('./constants').pathToStrictD3Module;

/**
 * Transform `require('@plotly/d3')` expressions to `require(/path/to/strict-d3.js)`
 */

module.exports = transformTools.makeRequireTransform('requireTransform',
    { evaluateArguments: true, jsFilesOnly: true },
    function(args, opts, cb) {
        var pathIn = args[0];
        var pathOut;

        if(pathIn === '@plotly/d3' && opts.file !== pathToStrictD3Module) {
            // JSON.stringify: fix npm-scripts for windows users, for whom
            // path has \ in it, without stringify that turns into control chars.
            pathOut = 'require(' + JSON.stringify(pathToStrictD3Module) + ')';
        }

        if(pathOut) return cb(null, pathOut);
        else return cb();
    });

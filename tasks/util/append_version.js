var fs = require('fs');

var pkg = require('../../package.json');

/**
 * Append package version to bundle
 *
 * @param {string} path path to bundle
 * @param {object} opts
 *   - object {string} the standalone object in the bundle
 *   - DEV {boolean} is this a DEV build?
 */
module.exports = function appendVersion(path, opts) {
    var txt = [
        opts.object,
        '.version=', '\'',
        pkg.version, opts.DEV ? '-dev' : '',
        '\'', ';'
    ].join('');

    fs.appendFile(path, txt, function(err) {
        if(err) throw err;
    }) ;
};

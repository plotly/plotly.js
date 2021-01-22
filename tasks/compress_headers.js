var through = require('through2');

var licenseSrc = require('./util/constants').licenseSrc
    .replace(/\//g, '\\/')
    .replace(/\*/g, '\\*')
    .replace(/\n/g, '[^]');

/**
 * Browserify transform that strips redundant plotly.js Copyright comments out
 * of the plotly.js bundles
 */

var WHITESPACE_BEFORE = '\\s*';

module.exports = function() {
    var allChunks = [];
    return through(function(chunk, enc, next) {
        allChunks.push(chunk);
        next();
    }, function(done) {
        var str = Buffer.concat(allChunks).toString('utf-8');
        this.push(
            str.replace(new RegExp(WHITESPACE_BEFORE + licenseSrc, 'g'), '')
        );
        done();
    });
};

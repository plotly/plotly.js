var through = require('through2');
var falafel = require('falafel');

var constants = require('./constants');

var noop = function() {};


module.exports = function() {
    return through(function(buf, enc, next) {
        var code = buf.toString('utf-8');
        var comments = [];

        /*
         * Acorn (falafel's default parser) fails to parse
         * plot_api.js, axes.js and graph_interact.js,
         * possibly because of their size.
         *
         */

        try {
            falafel(code, {onComment: comments, locations: true}, noop);

            // locate license header (understood to be the first comment block),
            var header = comments[0];
            var codeLines = code.split('\n');

            // remove it
            codeLines.splice(header.loc.start.line-1, header.loc.end.line);

            this.push(codeLines.join('\n'));
        }
        catch(e) {
            this.push(code);
        }

        next();
    });
};

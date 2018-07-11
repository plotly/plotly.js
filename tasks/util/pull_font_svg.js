var fs = require('fs');
var xml2js = require('xml2js');

var parser = new xml2js.Parser();


module.exports = function pullFontSVG(data, pathOut) {
    parser.parseString(data, function(err, result) {
        if(err) throw err;

        var font_obj = result.svg.defs[0].font[0],
            default_width = Number(font_obj.$['horiz-adv-x']),
            ascent = Number(font_obj['font-face'][0].$.ascent),
            descent = Number(font_obj['font-face'][0].$.descent),
            chars = {};

        font_obj.glyph.forEach(function(glyph) {
            var name = glyph.$['glyph-name'],
                transform = name === 'spikeline' ?
                    'matrix(1.5 0 0 -1.5 0 ' + ascent + ')' :
                    'matrix(1 0 0 -1 0 ' + ascent + ')';

            chars[name] = {
                width: Number(glyph.$['horiz-adv-x']) || default_width,
                height: ascent - descent,
                path: glyph.$.d,
                transform: transform,
            };
        });

        // turn remaining double quotes into single
        var charStr = JSON.stringify(chars, null, 4).replace(/\"/g, '\'');

        var outStr = [
            '\'use strict\';',
            '',
            'module.exports = ' + charStr + ';',
            ''
        ].join('\n');

        fs.writeFile(pathOut, outStr, function(err) {
            if(err) throw err;
        });
    });
};

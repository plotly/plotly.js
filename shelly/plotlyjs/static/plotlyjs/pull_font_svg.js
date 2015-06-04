var fs = require('fs'),
    xml2js = require('xml2js'),
    parser = new xml2js.Parser();

fs.readFile(__dirname + '/src/fonts/ploticon/ploticon.svg', function(err, data) {
    'use strict';
    if(err) throw err;
    parser.parseString(data, function(err2, result) {
        if(err2) throw err2;

        var font_obj = result.svg.defs[0].font[0],
            default_width = Number(font_obj.$['horiz-adv-x']),
            chars = {
                ascent: Number(font_obj['font-face'][0].$.ascent),
                descent: Number(font_obj['font-face'][0].$.descent)
            };

        font_obj.glyph.forEach(function(glyph) {
            chars[glyph.$['glyph-name']] = {
                width: Number(glyph.$['horiz-adv-x']) || default_width,
                path: glyph.$.d
            };
        });

        var charStr = JSON.stringify(chars, null, 4)
            .replace(/\"/g, '\''); // turn remaining double quotes into single

        fs.writeFile(__dirname + '/build/ploticon.js',
            '/*jshint quotmark:true */\n\'use strict\';\n\nmodule.exports = ' + charStr + ';\n',
            function(err3) { if(err3) throw err3; }
        );
    });
});

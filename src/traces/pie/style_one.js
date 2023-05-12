'use strict';

var Color = require('../../components/color');
var castOption = require('./helpers').castOption;
var Drawing = require('../../components/drawing');

module.exports = function styleOne(s, pt, trace, gd) {
    var line = trace.marker.line;
    var lineColor = castOption(line.color, pt.pts) || Color.defaultLine;
    var lineWidth = castOption(line.width, pt.pts) || 0;

    // some temporary console statements, for later debugging, needs to be removed once the assembler below gets clean
    // console.log('styleOne - s0', s[0], s[0][0], '__data__', s[0][0].__data__);
    // console.log( 's0 iiiiiiiii pie    : ', (s[0][0].__data__.i !== undefined ? s[0][0].__data__.i : 'nope'));
    // console.log( 's0 iiiiiiiii legend : ', (s[0][0].__data__[0] !== undefined ? s[0][0].__data__[0].i : 'nope'));
    // console.log( 'pie style_one: s', s, 'trace', trace, 'gd', gd);

    // to do: rework this assembler code in a next iteration.
    if(s[0][0].__data__.i === undefined) {
        // coming from a legend
        s[0][0].__data__.i = s[0][0].__data__[0].i;
    }
    // console.log( 's0 - i : ', s[0][0].__data__['i']);

    Drawing.pointStyle(s, trace, gd);
    // to do : push into s.style d3 logic

    s.style('stroke-width', lineWidth)
        // .call(Color.fill, pt.color)
        .call(Color.stroke, lineColor);
};

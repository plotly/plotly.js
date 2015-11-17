'use strict';

var tinycolor = require('tinycolor2');
var arrtools = require('arraytools');

function str2RgbaArray(color) {
    color = tinycolor(color);
    return arrtools.str2RgbaArray(color.toRgbString());
}

module.exports = str2RgbaArray;

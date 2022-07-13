'use strict';

var rgba = require('color-normalize');

function str2RgbaArray(color) {
    if(!color) return [0, 0, 0, 1];
    return rgba(color);
}

module.exports = str2RgbaArray;

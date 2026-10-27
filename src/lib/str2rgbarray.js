'use strict';

const { normalize: rgba } = require('../components/color');

function str2RgbaArray(color) {
    if(!color) return [0, 0, 0, 1];
    return rgba(color);
}

module.exports = str2RgbaArray;

'use strict';

var Lib = require('../../lib');

function format(vRounded) {
    return (
        vRounded.indexOf('e') !== -1 ? vRounded.replace(/[.]?0+e/, 'e') :
        vRounded.indexOf('.') !== -1 ? vRounded.replace(/[.]?0+$/, '') :
        vRounded
    );
}

exports.formatPiePercent = function formatPiePercent(v, separators) {
    var vRounded = format((v * 100).toPrecision(3));
    return Lib.numSeparate(vRounded, separators) + '%';
};

exports.formatPieValue = function formatPieValue(v, separators) {
    var vRounded = format(v.toPrecision(10));
    return Lib.numSeparate(vRounded, separators);
};

exports.getFirstFilled = function getFirstFilled(array, indices) {
    if(!Lib.isArrayOrTypedArray(array)) return;
    for(var i = 0; i < indices.length; i++) {
        var v = array[indices[i]];
        if(v || v === 0 || v === '') return v;
    }
};

exports.castOption = function castOption(item, indices) {
    if(Lib.isArrayOrTypedArray(item)) return exports.getFirstFilled(item, indices);
    else if(item) return item;
};

exports.getRotationAngle = function(rotation) {
    return (rotation === 'auto' ? 0 : rotation) * Math.PI / 180;
};

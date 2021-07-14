'use strict';

var isTypedArray = require('../../lib').isTypedArray;

exports.convertTypedArray = function(a) {
    return isTypedArray(a) ? Array.prototype.slice.call(a) : a;
};

exports.isOrdinal = function(dimension) {
    return !!dimension.tickvals;
};

exports.isVisible = function(dimension) {
    return dimension.visible || !('visible' in dimension);
};

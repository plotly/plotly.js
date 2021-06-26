'use strict';

module.exports = function zip3(x, y, z, len) {
    len = len || x.length;

    var result = new Array(len);
    for(var i = 0; i < len; i++) {
        result[i] = [x[i], y[i], z[i]];
    }
    return result;
};

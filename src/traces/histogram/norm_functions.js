'use strict';


module.exports = {
    percent: function(size, total) {
        var nMax = size.length;
        var norm = 100 / total;
        for(var n = 0; n < nMax; n++) size[n] *= norm;
    },
    probability: function(size, total) {
        var nMax = size.length;
        for(var n = 0; n < nMax; n++) size[n] /= total;
    },
    density: function(size, total, inc, yinc) {
        var nMax = size.length;
        yinc = yinc || 1;
        for(var n = 0; n < nMax; n++) size[n] *= inc[n] * yinc;
    },
    'probability density': function(size, total, inc, yinc) {
        var nMax = size.length;
        if(yinc) total /= yinc;
        for(var n = 0; n < nMax; n++) size[n] *= inc[n] / total;
    }
};

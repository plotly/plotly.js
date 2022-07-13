'use strict';

var isNumeric = require('fast-isnumeric');


module.exports = {
    count: function(n, i, size) {
        size[n]++;
        return 1;
    },

    sum: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            size[n] += v;
            return v;
        }
        return 0;
    },

    avg: function(n, i, size, counterData, counts) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            size[n] += v;
            counts[n]++;
        }
        return 0;
    },

    min: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            if(!isNumeric(size[n])) {
                size[n] = v;
                return v;
            } else if(size[n] > v) {
                var delta = v - size[n];
                size[n] = v;
                return delta;
            }
        }
        return 0;
    },

    max: function(n, i, size, counterData) {
        var v = counterData[i];
        if(isNumeric(v)) {
            v = Number(v);
            if(!isNumeric(size[n])) {
                size[n] = v;
                return v;
            } else if(size[n] < v) {
                var delta = v - size[n];
                size[n] = v;
                return delta;
            }
        }
        return 0;
    }
};

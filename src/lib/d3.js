'use strict';

var d3 = require('d3');

d3.round = function(x, n) { // copy of d3.round from v3
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};

module.exports = d3;

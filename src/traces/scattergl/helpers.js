'use strict';

var constants = require('./constants');

exports.isOpenSymbol = function(symbol) {
    return (typeof symbol === 'string') ?
        constants.OPEN_RE.test(symbol) :
        symbol % 200 > 100;
};

exports.isDotSymbol = function(symbol) {
    return (typeof symbol === 'string') ?
        constants.DOT_RE.test(symbol) :
        symbol > 200;
};

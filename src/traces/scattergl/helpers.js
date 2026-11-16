'use strict';

const { symbolNumber } = require('../../components/drawing');

exports.isOpenSymbol = (symbol) => symbolNumber(symbol) % 200 >= 100;

exports.isDotSymbol = (symbol) => symbolNumber(symbol) >= 200;

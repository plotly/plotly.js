'use strict';

var Lib = require('../../lib');
var layoutAttributes = require('./layout_attributes');
var boxLayoutDefaults = require('../box/layout_defaults');

module.exports = function supplyLayoutDefaults(layoutIn, layoutOut, fullData) {
    function coerce(attr, dflt) {
        return Lib.coerce(layoutIn, layoutOut, layoutAttributes, attr, dflt);
    }
    boxLayoutDefaults._supply(layoutIn, layoutOut, fullData, coerce, 'violin');
};

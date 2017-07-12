/*
 * strict-d3: wrap selection.style to prohibit specific incorrect style values
 * that are known to cause problems in IE (at least IE9)
 */
'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var selProto = d3.selection.prototype;
var originalSelStyle = selProto.style;

selProto.style = function() {
    var sel = this;
    var obj = arguments[0];

    if(sel.size()) {
        if(typeof obj === 'string') {
            checkStyleVal(sel, obj, arguments[1]);
        } else {
            Object.keys(obj).forEach(function(key) { checkStyleVal(sel, key, obj[key]); });
        }
    }

    return originalSelStyle.apply(sel, arguments);
};

function checkStyleVal(sel, key, val) {
    if(typeof val === 'string') {
        // in case of multipart styles (stroke-dasharray, margins, etc)
        // test each part separately
        val.split(/[, ]/g).forEach(function(valPart) {
            var pxSplit = valPart.length - 2;
            if(valPart.substr(pxSplit) === 'px' && !isNumeric(valPart.substr(0, pxSplit))) {
                throw new Error('d3 selection.style called with value: ' + val);
            }
        });
    }

    // Microsoft browsers incl. "Edge" don't support CSS transform on SVG elements
    if(key === 'transform' && sel.node() instanceof SVGElement) {
        throw new Error('d3 selection.style called on an SVG element with key: ' + key);
    }
}

module.exports = d3;

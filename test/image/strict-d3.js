/*
 * strict-d3: wrap selection.style to prohibit specific incorrect style values
 * that are known to cause problems in IE (at least IE9)
 */

'use strict';

var d3 = require('@plotly/d3');
var isNumeric = require('fast-isnumeric');

var selProto = d3.selection.prototype;
var originalSelAttr = selProto.attr;
var originalSelStyle = selProto.style;

selProto.attr = function() {
    var sel = this;
    var obj = arguments[0];

    if(sel.size()) {
        if(typeof obj === 'string') {
            checkAttrVal(sel, obj, arguments[1]);
        } else {
            Object.keys(obj).forEach(function(key) { checkAttrVal(sel, key, obj[key]); });
        }
    }

    return originalSelAttr.apply(sel, arguments);
};

selProto.style = function() {
    var sel = this;
    var obj = arguments[0];

    if(sel.size()) {
        if(typeof obj === 'string') {
            if(arguments.length === 1 && !d3.event) {
                throw new Error('d3 selection.style called as getter: ' +
                    'disallowed outside event handlers as it can fail for ' +
                    'unattached elements. Use node.style.attribute instead.');
            }
            checkStyleVal(sel, obj, arguments[1]);
        } else {
            Object.keys(obj).forEach(function(key) { checkStyleVal(sel, key, obj[key]); });
        }
    }

    return originalSelStyle.apply(sel, arguments);
};

function checkAttrVal(sel, key, val) {
    // setting the transform attribute on a <clipPath> does not
    // work in Chrome, IE and Edge
    if(sel.node().nodeName === 'clipPath' && key === 'transform') {
        throw new Error('d3 selection.attr called with key \'transform\' on a clipPath node');
    }

    // make sure no double-negative string get into the DOM,
    // their handling differs from browsers to browsers
    if(/--/.test(val) && isNumeric(val.split('--')[1].charAt(0))) {
        throw new Error('d3 selection.attr called with value ' + val + ' which includes a double negative');
    }

    if(/transform/.test(key) && /NaN/.test(val)) {
        throw new Error('d3 selection.attr called with ' + key + ' ' + val + ' containing a NaN');
    }
}

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

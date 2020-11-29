/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var loggers = require('./loggers');
var matrix = require('./matrix');
var mat4X4 = require('gl-mat4');

/**
 * Allow referencing a graph DOM element either directly
 * or by its id string
 *
 * @param {HTMLDivElement|string} gd: a graph element or its id
 *
 * @returns {HTMLDivElement} the DOM element of the graph
 */
function getGraphDiv(gd) {
    var gdElement;

    if(typeof gd === 'string') {
        gdElement = document.getElementById(gd);

        if(gdElement === null) {
            throw new Error('No DOM element with id \'' + gd + '\' exists on the page.');
        }

        return gdElement;
    } else if(gd === null || gd === undefined) {
        throw new Error('DOM element provided is null or undefined');
    }

    // otherwise assume that gd is a DOM element
    return gd;
}

function isPlotDiv(el) {
    var el3 = d3.select(el);
    return el3.node() instanceof HTMLElement &&
        el3.size() &&
        el3.classed('js-plotly-plot');
}

function removeElement(el) {
    var elParent = el && el.parentNode;
    if(elParent) elParent.removeChild(el);
}

/**
 * for dynamically adding style rules
 * makes one stylesheet that contains all rules added
 * by all calls to this function
 */
function addStyleRule(selector, styleString) {
    addRelatedStyleRule('global', selector, styleString);
}

/**
 * for dynamically adding style rules
 * to a stylesheet uniquely identified by a uid
 */
function addRelatedStyleRule(uid, selector, styleString) {
    var id = 'plotly.js-style-' + uid;
    var style = document.getElementById(id);
    if(!style) {
        style = document.createElement('style');
        style.setAttribute('id', id);
        // WebKit hack :(
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
    }
    var styleSheet = style.sheet;

    if(styleSheet.insertRule) {
        styleSheet.insertRule(selector + '{' + styleString + '}', 0);
    } else if(styleSheet.addRule) {
        styleSheet.addRule(selector, styleString, 0);
    } else loggers.warn('addStyleRule failed');
}

/**
 * to remove from the page a stylesheet identified by a given uid
 */
function deleteRelatedStyleRule(uid) {
    var id = 'plotly.js-style-' + uid;
    var style = document.getElementById(id);
    if(style) removeElement(style);
}

function getFullTransformMatrix(element) {
    var allElements = getElementAndAncestors(element);
    // the identity matrix
    var out = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
    allElements.forEach(function(e) {
        var t = getElementTransformMatrix(e);
        if(t) {
            var m = matrix.convertCssMatrix(t);
            out = mat4X4.multiply(out, out, m);
        }
    });
    return out;
}

/**
 * extracts and parses the 2d css style transform matrix from some element
 */
function getElementTransformMatrix(element) {
    var style = window.getComputedStyle(element, null);
    var transform = (
      style.getPropertyValue('-webkit-transform') ||
      style.getPropertyValue('-moz-transform') ||
      style.getPropertyValue('-ms-transform') ||
      style.getPropertyValue('-o-transform') ||
      style.getPropertyValue('transform')
    );

    if(transform === 'none') return null;
    // the transform is a string in the form of matrix(a, b, ...) or matrix3d(...)
    return transform
        .replace('matrix', '')
        .replace('3d', '')
        .slice(1, -1)
        .split(',')
        .map(function(n) { return +n; });
}
/**
 * retrieve all DOM elements that are ancestors of the specified one (including itself)
 */
function getElementAndAncestors(element) {
    var allElements = [];
    while(isTransformableElement(element)) {
        allElements.push(element);
        element = element.parentNode;
    }
    return allElements;
}

function isTransformableElement(element) {
    return element && (element instanceof Element || element instanceof HTMLElement);
}

function equalDomRects(a, b) {
    return (
        a && b &&
        a.x === b.x &&
        a.y === b.y &&
        a.top === b.top &&
        a.left === b.left &&
        a.right === b.right &&
        a.bottom === b.bottom
    );
}

module.exports = {
    getGraphDiv: getGraphDiv,
    isPlotDiv: isPlotDiv,
    removeElement: removeElement,
    addStyleRule: addStyleRule,
    addRelatedStyleRule: addRelatedStyleRule,
    deleteRelatedStyleRule: deleteRelatedStyleRule,
    getFullTransformMatrix: getFullTransformMatrix,
    getElementTransformMatrix: getElementTransformMatrix,
    getElementAndAncestors: getElementAndAncestors,
    equalDomRects: equalDomRects
};

'use strict';

var d3 = require('@plotly/d3');
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
    if(style && style.matches('.no-inline-styles')) {
        // Do not proceed if user disable inline styles explicitly...
        return;
    }
    if(!style) {
        style = document.createElement('style');
        style.setAttribute('id', id);
        // WebKit hack :(
        style.appendChild(document.createTextNode(''));
        document.head.appendChild(style);
    }
    var styleSheet = style.sheet;

    if(!styleSheet) {
        loggers.warn('Cannot addRelatedStyleRule, probably due to strict CSP...');
    } else if(styleSheet.insertRule) {
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

/**
 * Setup event listeners on button elements to emulate the ':hover' state without using inline styles,
 * which is not allowed with strict CSP.  This supports modebar buttons set with the 'active' class,
 * in which case, the active style remains even when it's no longer hovered.
 * @param {string} selector selector for button elements to be styled when hovered
 * @param {string} activeSelector selector used to determine if selected element is active
 * @param {string} childSelector the child element on which the styling needs to be updated
 * @param {string} activeStyle    style that has to be applied when 'hovered' or 'active'
 * @param {string} inactiveStyle    style that has to be applied when not 'hovered' nor 'active'
 */
function setStyleOnHover(selector, activeSelector, childSelector, activeStyle, inactiveStyle, element) {
    var activeStyleParts = activeStyle.split(':');
    var inactiveStyleParts = inactiveStyle.split(':');
    var eventAddedAttrName = 'data-btn-style-event-added';
    if (!element) {
        element = document;
    }
    element.querySelectorAll(selector).forEach(function(el) {
        if(!el.getAttribute(eventAddedAttrName)) {
            // Emulate ":hover" CSS style using JS event handlers to set the
            // style in a strict CSP-compliant manner.
            el.addEventListener('mouseenter', function() {
                var childEl = this.querySelector(childSelector);
                if(childEl) {
                    childEl.style[activeStyleParts[0]] = activeStyleParts[1];
                }
            });
            el.addEventListener('mouseleave', function() {
                var childEl = this.querySelector(childSelector);
                if(childEl) {
                    if(activeSelector && this.matches(activeSelector)) {
                        childEl.style[activeStyleParts[0]] = activeStyleParts[1];
                    } else {
                        childEl.style[inactiveStyleParts[0]] = inactiveStyleParts[1];
                    }
                }
            });
            el.setAttribute(eventAddedAttrName, true);
        }
    });
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
        if(typeof ShadowRoot === 'function' && element instanceof ShadowRoot) {
            element = element.host;
        }
    }
    return allElements;
}

function isTransformableElement(element) {
    return element && (element instanceof Element || element instanceof HTMLElement);
}

function equalDomRects(a, b) {
    return (
        a && b &&
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
    setStyleOnHover: setStyleOnHover,
    getFullTransformMatrix: getFullTransformMatrix,
    getElementTransformMatrix: getElementTransformMatrix,
    getElementAndAncestors: getElementAndAncestors,
    equalDomRects: equalDomRects
};

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var lib = require('./index');
var plotcss = require('../../build/plotcss');

// Inject styling information into the document containing the graph div
exports.injectStyles = function injectStyles(gd) {
    // If the graph div has already been styled, bail
    if(gd._plotCSSLoaded) return;

    var targetSelectors = exports.getAllRuleSelectors(gd._document);
    var targetStyleSheet = null;

    if(gd._document.getElementsByTagName('style').length === 0) {
        var style = gd._document.createElement('style');
        // WebKit hack :(
        style.appendChild(gd._document.createTextNode(''));
        gd._document.head.appendChild(style);
        targetStyleSheet = style.sheet;
    }
    else {
        // Just grab the first style element to append to
        targetStyleSheet = gd._document.getElementsByTagName('style')[0].sheet;
    }

    for(var selector in plotcss) {
        var fullSelector = exports.buildFullSelector(selector);

        // Don't duplicate selectors
        if(targetSelectors.indexOf(fullSelector) === -1) {
            if(targetStyleSheet.insertRule) {
                targetStyleSheet.insertRule(fullSelector + '{' + plotcss[selector] + '}', 0);
            }
            else if(targetStyleSheet.addRule) {
                targetStyleSheet.addRule(fullSelector, plotcss[selector], 0);
            }
            else lib.warn('injectStyles failed');
        }
    }

    gd._plotCSSLoaded = true;
};

// expands a plotcss selector
exports.buildFullSelector = function buildFullSelector(selector) {
    var fullSelector = selector.replace(/,/, ', ')
        .replace(/:after/g, '::after')
        .replace(/:before/g, '::before')
        .replace(/X/g, '.js-plotly-plot .plotly')
        .replace(/Y/g, '.plotly-notifier');

    return fullSelector;
};

// Gets all the rules currently attached to the document
exports.getAllRuleSelectors = function getAllRuleSelectors(sourceDocument) {
    var allSelectors = [];

    for(var i = 0; i < sourceDocument.styleSheets.length; i++) {
        var styleSheet = sourceDocument.styleSheets[i];

        if(!styleSheet.cssRules) continue; // It's possible for rules to be undefined

        for(var j = 0; j < styleSheet.cssRules.length; j++) {
            var cssRule = styleSheet.cssRules[j];

            allSelectors.push(cssRule.selectorText);
        }
    }

    return allSelectors;
};

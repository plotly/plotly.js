/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var plotcss = require('../../build/plotcss');

// Inject styling information into the document containing the graph div
module.exports = function injectStyles(gd) {
    var targetSelectors = getAllRuleSelectors(gd.ownerDocument);
    var targetStyleSheet = null;

    if(gd.ownerDocument.getElementsByTagName('style').length === 0) {
        var style = gd.ownerDocument.createElement('style');
        // WebKit hack :(
        style.appendChild(gd.ownerDocument.createTextNode(''));
        gd.ownerDocument.head.appendChild(style);
        targetStyleSheet = style.sheet;
    }
    else{
        // Just grab the first style element to append to
        targetStyleSheet = gd.ownerDocument.getElementsByTagName('style')[0].sheet;
    }

    for(var selector in plotcss) {
        var fullSelector = selector.replace(/^,/,' ,')
            .replace(/X/g, '.js-plotly-plot .plotly')
            .replace(/Y/g, '.plotly-notifier');

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
}

// Gets all the rules currently attached to the document
function getAllRuleSelectors(sourceDocument) {
    var allSelectors = [];

    for(var i = 0; i < sourceDocument.styleSheets.length; i++) {
        var styleSheet = sourceDocument.styleSheets[i];

        for(var j = 0; j < styleSheet.cssRules.length; j++) {
            var cssRule = styleSheet.cssRules[j];

            allSelectors.push(cssRule.selectorText);
        }
    }

    return allSelectors;
}

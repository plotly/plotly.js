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

module.exports = function injectStyles(targetDocument) {
    var targetSelectors = getAllRuleSelectors(targetDocument);

    for(var selector in plotcss) {
        var fullSelector = selector.replace(/^,/,' ,')
            .replace(/X/g, '.js-plotly-plot .plotly')
            .replace(/Y/g, '.plotly-notifier');

        //Don't duplicate selectors
        if(targetSelectors.indexOf(fullSelector) === -1) {
            Plotly.Lib.addStyleRule(targetDocument, fullSelector, plotcss[selector]);
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

/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// expands a plotcss selector
exports.buildFullSelector = function buildFullSelector(selector) {
    var fullSelector = selector.replace(/,/, ', ')
        .replace(/:after/g, '::after')
        .replace(/:before/g, '::before')
        .replace(/X/g, '.js-plotly-plot .plotly')
        .replace(/Y/g, '.plotly-notifier');

    return fullSelector;
}

// Gets all the rules currently attached to the document
exports.getAllRuleSelectors = function getAllRuleSelectors(sourceDocument) {
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

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
	for(var selector in plotcss) {
			var fullSelector = selector.replace(/^,/,' ,')
					.replace(/X/g, '.js-plotly-plot .plotly')
					.replace(/Y/g, '.plotly-notifier');
			Plotly.Lib.addStyleRule(targetDocument, fullSelector, plotcss[selector]);
	}
}

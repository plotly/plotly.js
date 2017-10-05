/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plots = require('../../plots/plots');
var tablePlot = require('./plot');

exports.name = 'table';

exports.attr = 'type';

exports.plot = function(gd) {
    var calcData = Plots.getSubplotCalcData(gd.calcdata, 'table', 'table');
    if(calcData.length) tablePlot(gd, calcData);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadTable = (oldFullLayout._has && oldFullLayout._has('table'));
    var hasTable = (newFullLayout._has && newFullLayout._has('table'));

    if(hadTable && !hasTable) {
        oldFullLayout._paperdiv.selectAll('.table').remove();
    }
};

/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

var Plots = require('../plots/plots');

var Helpers = require('./helpers');
var plot = require('./plot');


module.exports = newPlot;


function newPlot (gd, data, layout, config) {
    gd = Helpers.getGraphDiv(gd);
    Plots.purge(gd);
    return plot(gd, data, layout, config);
};



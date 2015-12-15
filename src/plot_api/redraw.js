/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

var Lib = require('../lib');

var Helpers = require('./helpers');
var plot = require('./plot');

var isPlotDiv = require('@src/plotly').Lib.isPlotDiv;
module.exports = redraw;


function redraw(gd) {
    gd = Helpers.getGraphDiv(gd);

    // if(!Lib.isPlotDiv(gd)) {
    if(!isPlotDiv(gd)) {
        console.log('This element is not a Plotly Plot', gd);
        return;
    }

    gd.calcdata = undefined;
    return plot(gd).then(function () {
        gd.emit('plotly_redraw');
        return gd;
    });
}

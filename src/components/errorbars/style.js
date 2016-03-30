/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Color = require('../color');


module.exports = function style(traces) {
    traces.each(function(d) {
        var trace = d[0].trace,
            yObj = trace.error_y || {},
            xObj = trace.error_x || {};

        var s = d3.select(this);

        s.selectAll('path.yerror')
            .style('stroke-width', yObj.thickness + 'px')
            .call(Color.stroke, yObj.color);

        if(xObj.copy_ystyle) xObj = yObj;

        s.selectAll('path.xerror')
            .style('stroke-width', xObj.thickness + 'px')
            .call(Color.stroke, xObj.color);
    });
};

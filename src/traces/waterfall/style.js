/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var lineGroupStyle = require('../../components/drawing').lineGroupStyle;
var barStyle = require('../bar/style').style;
var barStyleOnSelect = require('../bar/style').styleOnSelect;

function style(gd, cd) {
    barStyle(gd, cd);

    var s = cd ? cd[0].node3 : d3.select(gd).selectAll('g.trace.bars');

    s.selectAll('g.lines').each(function(d) {
        var sel = d3.select(this);
        var connectorLine = (d[0].trace.connector.line || {});

        lineGroupStyle(sel.selectAll('path'),
            connectorLine.width,
            connectorLine.color,
            connectorLine.dash
        );
    });
}

function styleOnSelect(gd, cd) {
    barStyleOnSelect(gd, cd);
}

module.exports = {
    style: style,
    styleOnSelect: styleOnSelect
};

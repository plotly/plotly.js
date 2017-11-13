/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';
var Lib = require('../../lib');
var extendDeepAll = Lib.extendDeepAll;
var d3 = require('d3');
var µ = module.exports = { version: '0.2.2' };
µ.tooltipPanel = function() {
    var tooltipEl, tooltipTextEl, backgroundEl;
    var config = {
        container: null,
        hasTick: false,
        fontSize: 12,
        color: 'white',
        padding: 5
    };
    var id = 'tooltip-' + µ.tooltipPanel.uid++;
    var tickSize = 10;
    var exports = function() {
        tooltipEl = config.container.selectAll('g.' + id).data([ 0 ]);
        var tooltipEnter = tooltipEl.enter().append('g').classed(id, true).style({
            'pointer-events': 'none',
            display: 'none'
        });
        backgroundEl = tooltipEnter.append('path').style({
            fill: 'white',
            'fill-opacity': 0.9
        }).attr({
            d: 'M0 0'
        });
        tooltipTextEl = tooltipEnter.append('text').attr({
            dx: config.padding + tickSize,
            dy: +config.fontSize * 0.3
        });
        return exports;
    };
    exports.text = function(_text) {
        var l = d3.hsl(config.color).l;
        var strokeColor = l >= 0.5 ? '#aaa' : 'white';
        var fillColor = l >= 0.5 ? 'black' : 'white';
        var text = _text || '';
        tooltipTextEl.style({
            fill: fillColor,
            'font-size': config.fontSize + 'px'
        }).text(text);
        var padding = config.padding;
        var bbox = tooltipTextEl.node().getBBox();
        var boxStyle = {
            fill: config.color,
            stroke: strokeColor,
            'stroke-width': '2px'
        };
        var backGroundW = bbox.width + padding * 2 + tickSize;
        var backGroundH = bbox.height + padding * 2;
        backgroundEl.attr({
            d: 'M' + [ [ tickSize, -backGroundH / 2 ], [ tickSize, -backGroundH / 4 ], [ config.hasTick ? 0 : tickSize, 0 ], [ tickSize, backGroundH / 4 ], [ tickSize, backGroundH / 2 ], [ backGroundW, backGroundH / 2 ], [ backGroundW, -backGroundH / 2 ] ].join('L') + 'Z'
        }).style(boxStyle);
        tooltipEl.attr({
            transform: 'translate(' + [ tickSize, -backGroundH / 2 + padding * 2 ] + ')'
        });
        tooltipEl.style({
            display: 'block'
        });
        return exports;
    };
    exports.move = function(_pos) {
        if(!tooltipEl) return;
        tooltipEl.attr({
            transform: 'translate(' + [ _pos[0], _pos[1] ] + ')'
        }).style({
            display: 'block'
        });
        return exports;
    };
    exports.hide = function() {
        if(!tooltipEl) return;
        tooltipEl.style({
            display: 'none'
        });
        return exports;
    };
    exports.show = function() {
        if(!tooltipEl) return;
        tooltipEl.style({
            display: 'block'
        });
        return exports;
    };
    exports.config = function(_x) {
        extendDeepAll(config, _x);
        return exports;
    };
    return exports;
};
module.exports.tooltipPanel = µ.tooltipPanel;

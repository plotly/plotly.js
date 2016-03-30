/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Plotly = require('../../plotly');
var Color = require('../color');
var Drawing = require('../drawing');
var svgTextUtils = require('../../lib/svg_text_utils');
var axisIds = require('../../plots/cartesian/axis_ids');
var anchorUtils = require('../legend/anchor_utils');

var constants = require('./constants');
var getUpdateObject = require('./get_update_object');


module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout;

    var selectors = fullLayout._infolayer.selectAll('.rangeselector')
        .data(makeSelectorData(gd), selectorKeyFunc);

    selectors.enter().append('g')
        .classed('rangeselector', true);

    selectors.exit().remove();

    selectors.style({
        cursor: 'pointer',
        'pointer-events': 'all'
    });

    selectors.each(function(d) {
        var selector = d3.select(this),
            axisLayout = d,
            selectorLayout = axisLayout.rangeselector;

        var buttons = selector.selectAll('g.button')
            .data(selectorLayout.buttons);

        buttons.enter().append('g')
            .classed('button', true);

        buttons.exit().remove();

        buttons.each(function(d) {
            var button = d3.select(this);

            button.call(drawButtonRect, selectorLayout, d);
            button.call(drawButtonText, selectorLayout, d);

            button.on('click', function() {
                var update = getUpdateObject(axisLayout, d);

                Plotly.relayout(gd, update);
            });
        });

        reposition(buttons, selectorLayout, fullLayout._size);
    });
};

function makeSelectorData(gd) {
    var axes = axisIds.list(gd, 'x', true);
    var data = [];

    for(var i = 0; i < axes.length; i++) {
        var axis = axes[i];

        if(axis.rangeselector && axis.rangeselector.visible) {
            data.push(axis);
        }
    }

    return data;
}

function selectorKeyFunc(d) {
    return d._id;
}

function drawButtonRect(button, selectorLayout) {
    var rect = button.selectAll('rect')
        .data([0]);

    rect.enter().append('rect')
        .classed('selector-rect', true);

    rect.attr('shape-rendering', 'crispEdges');

    rect.call(Color.stroke, selectorLayout.bordercolor)
        .call(Color.fill, selectorLayout.bgcolor)
        .style('stroke-width', selectorLayout.borderwidth + 'px');
}

function drawButtonText(button, selectorLayout, d) {
    function textLayout(s) {
        svgTextUtils.convertToTspans(s, function() {
            // TODO do we need this???
//             if(gd.firstRender) repositionLegend(gd, traces);
        });
    }

    var text = button.selectAll('text')
        .data([0]);

    text.enter().append('text')
        .classed('selector-text', true)
        .classed('user-select-none', true);

    // TODO is this correct?
    text.attr('text-anchor', 'middle');

    text.call(Drawing.font, selectorLayout.font)
        .text(d.label || d.count + ' ' + d.step.charAt(0))
        .call(textLayout);
}

function reposition(buttons, opts, graphSize) {
    opts.width = 0;
    opts.height = 0;

    var borderWidth = opts.borderwidth;

    buttons.each(function(d) {
        var button = d3.select(this),
            rect = button.select('.selector-rect'),
            text = button.select('.selector-text'),
            tspans = text.selectAll('tspan'),
            mathJaxGroup = button.select('g[class*=math-group]');

        var tWidth = text.node() && Drawing.bBox(text.node()).width,
            tHeight = opts.font.size * 1.3,
            tLines = tspans[0].length || 1;

        var wEff = Math.min(tWidth + 10, 50),
            hEff = Math.max(tHeight * tLines, 16) + 3;

        // TODO add buttongap attribute

        button.attr('transform', 'translate(' +
            (borderWidth + opts.width) + ',' + borderWidth +
        ')');

        rect.attr({
            x: 0,
            y: 0,
            width: wEff
        });

        var textAttr = {
            x: wEff / 2,
            y: tHeight * (1.5 - tLines / 2)  // could do better
        };

        text.attr(textAttr);
        tspans.attr(textAttr);

        opts.width += wEff + 5;
        opts.height = Math.max(opts.height, hEff);

        console.log([wEff, opts.width], [hEff, opts.height]);
    });

    buttons.selectAll('rect').attr('height', opts.height);



}

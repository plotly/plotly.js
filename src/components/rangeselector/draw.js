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
var Plots = require('../../plots/plots');
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
            var update = getUpdateObject(axisLayout, d);

            d.isActive = isActive(axisLayout, d, update);

            button.call(drawButtonRect, selectorLayout, d);
            button.call(drawButtonText, selectorLayout, d);

            button.on('click', function() {
                if(gd._dragged) return;

                Plotly.relayout(gd, update);
            });

            button.on('mouseover', function() {
                d.isHovered = true;
                button.call(drawButtonRect, selectorLayout, d);
            });

            button.on('mouseout', function() {
                d.isHovered = false;
                button.call(drawButtonRect, selectorLayout, d);
            });
        });

        // N.B. this mutates selectorLayout
        reposition(gd, buttons, selectorLayout, axisLayout._name);

        selector.attr('transform', 'translate(' +
            selectorLayout.lx + ',' + selectorLayout.ly +
        ')');
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

function isActive(axisLayout, opts, update) {
    if(opts.step === 'all') {
        return axisLayout.autorange === true;
    }
    else {
        var keys = Object.keys(update);

        return (
            axisLayout.range[0] === update[keys[0]] &&
            axisLayout.range[1] === update[keys[1]]
        );
    }
}

function drawButtonRect(button, selectorLayout, d) {
    var rect = button.selectAll('rect')
        .data([0]);

    rect.enter().append('rect')
        .classed('selector-rect', true);

    rect.attr('shape-rendering', 'crispEdges');

    rect.attr({
        'rx': constants.rx,
        'ry': constants.ry
    });

    rect.call(Color.stroke, selectorLayout.bordercolor)
        .call(Color.fill, getFillColor(selectorLayout, d))
        .style('stroke-width', selectorLayout.borderwidth + 'px');
}

function getFillColor(selectorLayout, d) {
    return (d.isActive || d.isHovered) ?
        selectorLayout.activecolor :
        selectorLayout.bgcolor;
}

function drawButtonText(button, selectorLayout, d) {
    function textLayout(s) {
        svgTextUtils.convertToTspans(s);

        // TODO do we need anything else here?
    }

    var text = button.selectAll('text')
        .data([0]);

    text.enter().append('text')
        .classed('selector-text', true)
        .classed('user-select-none', true);

    text.attr('text-anchor', 'middle');

    text.call(Drawing.font, selectorLayout.font)
        .text(getLabel(d))
        .call(textLayout);
}

function getLabel(opts) {
    if(opts.label) return opts.label;

    if(opts.step === 'all') return 'all';

    return opts.count + opts.step.charAt(0);
}

function reposition(gd, buttons, opts, axName) {
    opts.width = 0;
    opts.height = 0;

    var borderWidth = opts.borderwidth;

    buttons.each(function() {
        var button = d3.select(this),
            text = button.select('.selector-text'),
            tspans = text.selectAll('tspan');

        var tHeight = opts.font.size * 1.3,
            tLines = tspans[0].length || 1,
            hEff = Math.max(tHeight * tLines, 16) + 3;

        opts.height = Math.max(opts.height, hEff);
    });

    buttons.each(function() {
        var button = d3.select(this),
            rect = button.select('.selector-rect'),
            text = button.select('.selector-text'),
            tspans = text.selectAll('tspan');

        var tWidth = text.node() && Drawing.bBox(text.node()).width,
            tHeight = opts.font.size * 1.3,
            tLines = tspans[0].length || 1;

        var wEff = Math.max(tWidth + 10, constants.minButtonWidth);

        // TODO add MathJax support

        // TODO add buttongap attribute

        button.attr('transform', 'translate(' +
            (borderWidth + opts.width) + ',' + borderWidth +
        ')');

        rect.attr({
            x: 0,
            y: 0,
            width: wEff,
            height: opts.height
        });

        var textAttrs = {
            x: wEff / 2,
            y: opts.height / 2 - ((tLines - 1) * tHeight / 2) + 3
        };

        text.attr(textAttrs);
        tspans.attr(textAttrs);

        opts.width += wEff + 5;
    });

    buttons.selectAll('rect').attr('height', opts.height);

    var graphSize = gd._fullLayout._size;
    opts.lx = graphSize.l + graphSize.w * opts.x;
    opts.ly = graphSize.t + graphSize.h * (1 - opts.y);

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(opts)) {
        opts.lx -= opts.width;
        xanchor = 'right';
    }
    if(anchorUtils.isCenterAnchor(opts)) {
        opts.lx -= opts.width / 2;
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(anchorUtils.isBottomAnchor(opts)) {
        opts.ly -= opts.height;
        yanchor = 'bottom';
    }
    if(anchorUtils.isMiddleAnchor(opts)) {
        opts.ly -= opts.height / 2;
        yanchor = 'middle';
    }

    opts.width = Math.ceil(opts.width);
    opts.height = Math.ceil(opts.height);
    opts.lx = Math.round(opts.lx);
    opts.ly = Math.round(opts.ly);

    Plots.autoMargin(gd, axName + '-range-selector', {
        x: opts.x,
        y: opts.y,
        l: opts.width * ({right: 1, center: 0.5}[xanchor] || 0),
        r: opts.width * ({left: 1, center: 0.5}[xanchor] || 0),
        b: opts.height * ({top: 1, middle: 0.5}[yanchor] || 0),
        t: opts.height * ({bottom: 1, middle: 0.5}[yanchor] || 0)
    });
}

/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Registry = require('../../registry');
var Plots = require('../../plots/plots');
var Color = require('../color');
var Drawing = require('../drawing');
var Lib = require('../../lib');
var svgTextUtils = require('../../lib/svg_text_utils');
var axisIds = require('../../plots/cartesian/axis_ids');

var alignmentConstants = require('../../constants/alignment');
var LINE_SPACING = alignmentConstants.LINE_SPACING;
var FROM_TL = alignmentConstants.FROM_TL;
var FROM_BR = alignmentConstants.FROM_BR;

var constants = require('./constants');
var getUpdateObject = require('./get_update_object');

function draw(gd) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;

    var selectors = fullLayout._infolayer.selectAll('.rangeselector')
        .data(makeSelectorData(gd), selectorKeyFunc);

    selectors.enter().append('g')
        .classed('rangeselector', true);

    selectors.exit().remove();

    selectors.style({
        cursor: 'pointer',
        'pointer-events': 'all'
    });

    selectors.each(function(ax) {
        var selector = d3.select(this);
        var opts = ax.rangeselector;
        var dims = opts._dims;
        var bw = opts.borderwidth;

        var lx = Math.round(
            gs.l + gs.w * opts.x -
            dims.width * FROM_TL[Lib.getXanchor(opts)]
        );
        var ly = Math.round(
            gs.t + gs.h * (1 - opts.y) -
            dims.height * FROM_TL[Lib.getYanchor(opts)]
        );

        selector.attr('transform', 'translate(' + lx + ',' + ly + ')');

        var buttons = selector.selectAll('g.button')
            .data(Lib.filterVisible(opts.buttons));

        buttons.enter().append('g')
            .classed('button', true);

        buttons.exit().remove();

        var posX = 0;

        buttons.each(function(d, i) {
            var button = d3.select(this);
            var update = getUpdateObject(ax, d);

            d._isActive = isActive(ax, d, update);

            button.call(drawButtonRect, opts, d);
            button.call(drawButtonText, opts, d, gd);

            button.attr('transform', 'translate(' + [bw + posX, bw] + ')');
            posX += dims.widths[i] + 5;

            Drawing.setRect(button.select('.selector-rect'), 0, 0,
                dims.widths[i],
                dims.height
            );

            svgTextUtils.positionText(button.select('.selector-text'),
                dims.widths[i] / 2,
                dims.height / 2 + dims.tyOffsets[i]
            );

            button.on('click', function() {
                if(gd._dragged) return;
                Registry.call('_guiRelayout', gd, update);
            });

            button.on('mouseover', function() {
                d._isHovered = true;
                button.call(drawButtonRect, opts, d);
            });

            button.on('mouseout', function() {
                d._isHovered = false;
                button.call(drawButtonRect, opts, d);
            });
        });
    });
}

function makeSelectorData(gd) {
    var axList = axisIds.list(gd, 'x', true);
    var data = [];

    for(var i = 0; i < axList.length; i++) {
        var ax = axList[i];

        if(ax.rangeselector && ax.rangeselector.visible) {
            data.push(ax);
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
    } else {
        var keys = Object.keys(update);

        return (
            axisLayout.range[0] === update[keys[0]] &&
            axisLayout.range[1] === update[keys[1]]
        );
    }
}

function drawButtonRect(button, opts, d) {
    var rect = Lib.ensureSingle(button, 'rect', 'selector-rect', function(s) {
        s.attr('shape-rendering', 'crispEdges');
    });

    rect.attr({
        'rx': constants.rx,
        'ry': constants.ry
    });

    rect.call(Color.stroke, opts.bordercolor)
        .call(Color.fill, getFillColor(opts, d))
        .style('stroke-width', opts.borderwidth + 'px');
}

function getFillColor(opts, d) {
    return (d._isActive || d._isHovered) ?
        opts.activecolor :
        opts.bgcolor;
}

function drawButtonText(button, opts, d, gd) {
    function textLayout(s) {
        svgTextUtils.convertToTspans(s, gd);
    }

    // TODO add MathJax support

    var text = Lib.ensureSingle(button, 'text', 'selector-text', function(s) {
        s.classed('user-select-none', true)
            .attr('text-anchor', 'middle');
    });

    text.call(Drawing.font, opts.font)
        .text(getLabel(d, gd._fullLayout._meta))
        .call(textLayout);
}

function getLabel(d, _meta) {
    if(d.label) {
        return _meta ?
            Lib.templateString(d.label, _meta) :
            d.label;
    }

    if(d.step === 'all') return 'all';

    return d.count + d.step.charAt(0);
}

function findDimensions(gd, ax) {
    var opts = ax.rangeselector;
    var buttonData = Lib.filterVisible(opts.buttons);
    var nButtons = buttonData.length;

    var dims = opts._dims = {
        // width of each button
        widths: new Array(nButtons),
        // y offset for multi-line button text
        tyOffsets: new Array(nButtons),
        // height of range selector
        height: 0,
        // (total) width of range selector
        width: 0
    };

    var fakeButtons = Drawing.tester.selectAll('g.button')
        .data(Lib.filterVisible(opts.buttons));

    fakeButtons.enter().append('g')
        .classed('g.button', true);

    fakeButtons.each(function(d, i) {
        var button = d3.select(this);
        drawButtonText(button, opts, d, gd);
        var text = button.select('.selector-text');

        var tLines = svgTextUtils.lineCount(text);
        var tHeight = opts.font.size * LINE_SPACING;
        var tWidth = text.node() && Drawing.bBox(text.node()).width;

        var hEff = Math.ceil(Math.max(tHeight * tLines, 16) + 3);
        var wEff = Math.ceil(Math.max(tWidth + 10, constants.minButtonWidth));

        dims.widths[i] = wEff;
        dims.tyOffsets[i] = 3 - (tLines - 1) * tHeight / 2;

        dims.width += wEff + 5;
        dims.height = Math.max(dims.height, hEff);
    });

    fakeButtons.remove();

    dims.width = Math.ceil(dims.width);
    dims.height = Math.ceil(dims.height);

    return dims;
}

function pushMargin(gd) {
    var selectorData = makeSelectorData(gd);

    for(var i = 0; i < selectorData.length; i++) {
        var ax = selectorData[i];
        var opts = ax.rangeselector;
        var xanchor = Lib.getXanchor(opts);
        var yanchor = Lib.getYanchor(opts);
        var dims = findDimensions(gd, ax);

        Plots.autoMargin(gd, ax._id + '-range-selector', {
            x: opts.x,
            y: opts.y,
            l: dims.width * FROM_TL[xanchor],
            r: dims.width * FROM_BR[xanchor],
            b: dims.height * FROM_BR[yanchor],
            t: dims.height * FROM_TL[yanchor]
        });
    }
}

module.exports = {
    pushMargin: pushMargin,
    draw: draw
};

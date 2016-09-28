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
var Lib = require('../../lib');
var Color = require('../color');
var Drawing = require('../drawing');
var svgTextUtils = require('../../lib/svg_text_utils');
var anchorUtils = require('../legend/anchor_utils');

var constants = require('./constants');


module.exports = function draw(gd) {
    var fullLayout = gd._fullLayout,
        sliderData = makeSliderData(fullLayout);

    // draw a container for *all* sliders:
    var sliders = fullLayout._infolayer
        .selectAll('g.' + constants.containerClassName)
        .data(sliderData.length > 0 ? [0] : []);

    sliders.enter().append('g')
        .classed(constants.containerClassName, true)
        .style('cursor', 'pointer');

    sliders.exit().remove();

    // If no more sliders, clear the margisn:
    if(sliders.exit().size()) clearPushMargins(gd);

    // Return early if no menus visible:
    if(sliderData.length === 0) return;

    var sliderGroups = sliders.selectAll('g.'+ constants.groupClassName)
        .data(sliderData, keyFunction);

    sliderGroups.enter().append('g')
        .classed(constants.groupClassName, true);

    sliderGroups.exit().each(function(sliderOpts) {
        d3.select(this).remove();

        Plots.autoMargin(gd, constants.autoMarginIdRoot + sliderOpts._index);
    });

    // Find the dimensions of the sliders:
    for(var i = 0; i < sliderData.length; i++) {
        var sliderOpts = sliderData[i];
        findDimensions(gd, sliderOpts);
    }

    sliderGroups.each(function(sliderOpts) {
        computeDisplayedSteps(sliderOpts);

        drawSlider(gd, d3.select(this), sliderOpts);

        makeInputProxy(gd, d3.select(this), sliderOpts);

    });
};

function makeInputProxy(gd, sliderGroup, sliderOpts) {
    sliderOpts.inputProxy = gd._fullLayout._paperdiv.selectAll('input.' + constants.inputProxyClass)
        .data([0]);
}



// This really only just filters by visibility:
function makeSliderData(fullLayout) {
    var contOpts = fullLayout[constants.name],
        sliderData = [];

    for(var i = 0; i < contOpts.length; i++) {
        var item = contOpts[i];
        if(item.visible) sliderData.push(item);
    }

    return sliderData;
}

// This is set in the defaults step:
function keyFunction(opts) {
    return opts._index;
}

// Compute the dimensions (mutates sliderOpts):
function findDimensions(gd, sliderOpts) {
    sliderOpts._gd = gd;

    sliderOpts.inputAreaWidth = Math.max(
        constants.railWidth,
        constants.gripHeight
    );

    var graphSize = gd._fullLayout._size;
    sliderOpts.lx = graphSize.l + graphSize.w * sliderOpts.x;
    sliderOpts.ly = graphSize.t + graphSize.h * (1 - sliderOpts.y);

    if (sliderOpts.lenmode === 'fraction') {
        // fraction:
        sliderOpts.outerLength = Math.round(graphSize.w * sliderOpts.len);
    } else {
        // pixels:
        sliderOpts.outerLength = sliderOpts.len;
    }

    // Set the length-wise padding so that the grip ends up *on* the end of
    // the bar when at either extreme
    sliderOpts.lenPad = Math.round(constants.gripWidth * 0.5);

    // The length of the rail, *excluding* padding on either end:
    sliderOpts.inputAreaStart = 0;
    sliderOpts.inputAreaLength = Math.round(sliderOpts.outerLength - sliderOpts.xpad * 2);
    sliderOpts.railInset = Math.round(Math.max(0, constants.gripWidth - constants.railWidth) * 0.5);
    sliderOpts.stepInset = Math.round(Math.max(sliderOpts.railInset, constants.gripWidth * 0.5));

    // Hard-code this for now:
    sliderOpts.height = 150;

    var xanchor = 'left';
    if(anchorUtils.isRightAnchor(sliderOpts)) {
        sliderOpts.lx -= sliderOpts.outerLength;
        xanchor = 'right';
    }
    if(anchorUtils.isCenterAnchor(sliderOpts)) {
        sliderOpts.lx -= sliderOpts.outerLength / 2;
        xanchor = 'center';
    }

    var yanchor = 'top';
    if(anchorUtils.isBottomAnchor(sliderOpts)) {
        sliderOpts.ly -= sliderOpts.height;
        yanchor = 'bottom';
    }
    if(anchorUtils.isMiddleAnchor(sliderOpts)) {
        sliderOpts.ly -= sliderOpts.height / 2;
        yanchor = 'middle';
    }

    sliderOpts.outerLength = Math.ceil(sliderOpts.outerLength);
    sliderOpts.height = Math.ceil(sliderOpts.height);
    sliderOpts.lx = Math.round(sliderOpts.lx);
    sliderOpts.ly = Math.round(sliderOpts.ly);

    Plots.autoMargin(gd, constants.autoMarginIdRoot + sliderOpts._index, {
        x: sliderOpts.x,
        y: sliderOpts.y,
        l: sliderOpts.outerLength * ({right: 1, center: 0.5}[xanchor] || 0),
        r: sliderOpts.outerLength * ({left: 1, center: 0.5}[xanchor] || 0),
        b: sliderOpts.height * ({top: 1, middle: 0.5}[yanchor] || 0),
        t: sliderOpts.height * ({bottom: 1, middle: 0.5}[yanchor] || 0)
    });
}

function drawSlider(gd, group, sliderOpts) {
    // These are carefully ordered for proper z-ordering:
    group
        .call(drawRail, sliderOpts)
        .call(drawTouchRect, sliderOpts)
        .call(drawTicks, sliderOpts)
        .call(drawGrip, sliderOpts)

    group.call(setGripPosition, sliderOpts, 0);
    group.call(attachFocusEvents, sliderOpts);

    // Position the rectangle:
    Lib.setTranslate(group, sliderOpts.lx + sliderOpts.xpad, sliderOpts.ly + sliderOpts.ypad);
}

function drawGrip(sliderGroup, sliderOpts) {
    var grip = sliderGroup.selectAll('rect.' + constants.gripRectClass)
        .data([0]);

    grip.enter().append('rect')
        .classed(constants.gripRectClass, true)
        .call(attachGripEvents, sliderGroup, sliderOpts)
        .style('pointer-events', 'all');

    grip.attr({
            width: constants.gripHeight,
            height: constants.gripWidth,
            rx: constants.gripRadius,
            ry: constants.gripRadius,
        })
        .call(Color.stroke, constants.gripBorderColor)
        .call(Color.fill, constants.gripBgColor)
        .style('stroke-width', constants.gripBorderWidth + 'px');
}

function handleInput(sliderGroup, sliderOpts, normalizedPosition) {
    var quantizedPosition = Math.round(normalizedPosition * (sliderOpts.steps.length - 1));

    if (quantizedPosition !== sliderOpts._active) {
        setActive(sliderGroup, sliderOpts, quantizedPosition);
    }
}

function setActive(sliderGroup, sliderOpts, active) {
    sliderOpts._active = active;

    sliderGroup.call(setGripPosition, sliderOpts, sliderOpts._active / (sliderOpts.steps.length - 1));

    var step = sliderOpts.steps[sliderOpts._active];

    if (step && step.method) {
        var args = step.args;
        Plotly[step.method](gd, args[0], args[1], args[2]).catch(function(msg) {
            // This is not a disaster. Some methods like `animate` reject if interrupted
            // and *should* nicely log a warning.
            Lib.warn('Warning: Plotly.' + step.method + ' was called and rejected.');
        });
    }
}

function attachFocusEvents(sliderGroup, sliderOpts) {
    sliderGroup.on('focus', function() {
    }).on('blur', function() {
    });
}

function attachGripEvents(item, sliderGroup, sliderOpts) {
    var gd = d3.select(sliderOpts._gd);
    var node = sliderGroup.node();

    item.on('mousedown', function(event) {
        var grip = sliderGroup.select('.' + constants.gripRectClass);

        d3.event.stopPropagation();
        d3.event.preventDefault();
        grip.call(Color.fill, constants.gripBgActiveColor)

        var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
        handleInput(sliderGroup, sliderOpts, normalizedPosition);

        gd.on('mousemove', function() {
            var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
            handleInput(sliderGroup, sliderOpts, normalizedPosition);
        });

        gd.on('mouseup', function() {
            grip.call(Color.fill, constants.gripBgColor)
            gd.on('mouseup', null);
            gd.on('mousemove', null);
        });
    });
}

function drawTicks(sliderGroup, sliderOpts) {
    var tick = sliderGroup.selectAll('rect.' + constants.tickRectClass)
        .data(sliderOpts.displayedSteps);

    tick.enter().append('rect')
        .classed(constants.tickRectClass, true)

    tick.attr({
            width: constants.tickWidth,
            height: constants.tickLength,
            'shape-rendering': 'crispEdges'
        })
        .call(Color.fill, constants.tickColor);

    tick.each(function (d, i) {
        Lib.setTranslate(
            d3.select(this),
            normalizedValueToPosition(sliderOpts, d.fraction) - 0.5 * constants.tickWidth,
            constants.tickOffset
        );
    });

}

function computeDisplayedSteps(sliderOpts) {
    sliderOpts.displayedSteps = [];
    var i0 = 0;
    var step = 1;
    var nsteps = sliderOpts.steps.length;

    for (var i = i0; i < nsteps; i += step) {
        sliderOpts.displayedSteps.push({
            fraction: i / (nsteps - 1),
            step: sliderOpts.steps[i]
        });
    }
}

function setGripPosition(sliderGroup, sliderOpts, position) {
    var grip = sliderGroup.select('rect.' + constants.gripRectClass);

    var x = normalizedValueToPosition(sliderOpts, position);
    Lib.setTranslate(grip, x - constants.gripWidth * 0.5, 0);
}

// Convert a number from [0-1] to a pixel position relative to the slider group container:
function normalizedValueToPosition(sliderOpts, normalizedPosition) {
    return sliderOpts.inputAreaStart + sliderOpts.stepInset +
        (sliderOpts.inputAreaLength - 2 * sliderOpts.stepInset) * Math.min(1, Math.max(0, normalizedPosition));
}

// Convert a position relative to the slider group to a nubmer in [0, 1]
function positionToNormalizedValue(sliderOpts, position) {
    return Math.min(1, Math.max(0, (position - sliderOpts.stepInset - sliderOpts.inputAreaStart) / (sliderOpts.inputAreaLength - 2 * sliderOpts.stepInset - 2 * sliderOpts.inputAreaStart)));
}

function drawTouchRect(sliderGroup, sliderOpts) {
    var rect = sliderGroup.selectAll('rect.' + constants.railTouchRectClass)
        .data([0]);

    rect.enter().append('rect')
        .classed(constants.railTouchRectClass, true)
        .call(attachGripEvents, sliderGroup, sliderOpts)
        .style('pointer-events', 'all');

    rect.attr({
            width: sliderOpts.inputAreaLength,
            height: sliderOpts.inputAreaWidth
        })
        .call(Color.fill, constants.gripBgColor)
        .attr('opacity', 0)

    Lib.setTranslate(rect, 0, 0);
}

function drawRail(sliderGroup, sliderOpts) {
    var rect = sliderGroup.selectAll('rect.' + constants.railRectClass)
        .data([0]);

    rect.enter().append('rect')
        .classed(constants.railRectClass, true)

    var computedLength = sliderOpts.inputAreaLength - sliderOpts.railInset * 2;

    rect.attr({
            width: computedLength,
            height: constants.railWidth,
            rx: constants.railRadius,
            ry: constants.railRadius,
            'shape-rendering': 'crispEdges'
        })
        .call(Color.stroke, constants.railBorderColor)
        .call(Color.fill, constants.railBgColor)
        .style('stroke-width', '1px');

    Lib.setTranslate(rect, sliderOpts.railInset, (sliderOpts.inputAreaWidth - constants.railWidth) * 0.5);
}


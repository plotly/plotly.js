/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

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
        .style('cursor', 'ew-resize');

    sliders.exit().remove();

    // If no more sliders, clear the margisn:
    if(sliders.exit().size()) clearPushMargins(gd);

    // Return early if no menus visible:
    if(sliderData.length === 0) return;

    var sliderGroups = sliders.selectAll('g.' + constants.groupClassName)
        .data(sliderData, keyFunction);

    sliderGroups.enter().append('g')
        .classed(constants.groupClassName, true);

    sliderGroups.exit().each(function(sliderOpts) {
        d3.select(this).remove();

        sliderOpts._commandObserver.remove();
        delete sliderOpts._commandObserver;

        Plots.autoMargin(gd, constants.autoMarginIdRoot + sliderOpts._index);
    });

    // Find the dimensions of the sliders:
    for(var i = 0; i < sliderData.length; i++) {
        var sliderOpts = sliderData[i];
        findDimensions(gd, sliderOpts);
    }

    sliderGroups.each(function(sliderOpts) {
        // If it has fewer than two options, it's not really a slider:
        if(sliderOpts.steps.length < 2) return;

        var gSlider = d3.select(this);

        computeLabelSteps(sliderOpts);

        Plots.manageCommandObserver(gd, sliderOpts, sliderOpts.steps, function(data) {
            if(sliderOpts.active === data.index) return;
            if(sliderOpts._dragging) return;

            setActive(gd, gSlider, sliderOpts, data.index, false, true);
        });

        drawSlider(gd, d3.select(this), sliderOpts);

        // makeInputProxy(gd, d3.select(this), sliderOpts);
    });
};

/* function makeInputProxy(gd, sliderGroup, sliderOpts) {
    sliderOpts.inputProxy = gd._fullLayout._paperdiv.selectAll('input.' + constants.inputProxyClass)
        .data([0]);
}*/

// This really only just filters by visibility:
function makeSliderData(fullLayout) {
    var contOpts = fullLayout[constants.name],
        sliderData = [];

    for(var i = 0; i < contOpts.length; i++) {
        var item = contOpts[i];
        if(!item.visible || !item.steps.length) continue;
        sliderData.push(item);
    }

    return sliderData;
}

// This is set in the defaults step:
function keyFunction(opts) {
    return opts._index;
}

// Compute the dimensions (mutates sliderOpts):
function findDimensions(gd, sliderOpts) {
    var sliderLabels = gd._tester.selectAll('g.' + constants.labelGroupClass)
        .data(sliderOpts.steps);

    sliderLabels.enter().append('g')
        .classed(constants.labelGroupClass, true);

    // loop over fake buttons to find width / height
    var maxLabelWidth = 0;
    var labelHeight = 0;
    sliderLabels.each(function(stepOpts) {
        var labelGroup = d3.select(this);

        var text = drawLabel(labelGroup, {step: stepOpts}, sliderOpts);

        var tWidth = (text.node() && Drawing.bBox(text.node()).width) || 0;

        // This just overwrites with the last. Which is fine as long as
        // the bounding box (probably incorrectly) measures the text *on
        // a single line*:
        labelHeight = (text.node() && Drawing.bBox(text.node()).height) || 0;

        maxLabelWidth = Math.max(maxLabelWidth, tWidth);
    });

    sliderLabels.remove();

    sliderOpts.inputAreaWidth = Math.max(
        constants.railWidth,
        constants.gripHeight
    );

    sliderOpts.currentValueMaxWidth = 0;
    sliderOpts.currentValueHeight = 0;
    sliderOpts.currentValueTotalHeight = 0;

    if(sliderOpts.currentvalue.visible) {
        // Get the dimensions of the current value label:
        var dummyGroup = gd._tester.append('g');

        sliderLabels.each(function(stepOpts) {
            var curValPrefix = drawCurrentValue(dummyGroup, sliderOpts, stepOpts.label);
            var curValSize = (curValPrefix.node() && Drawing.bBox(curValPrefix.node())) || {width: 0, height: 0};
            sliderOpts.currentValueMaxWidth = Math.max(sliderOpts.currentValueMaxWidth, Math.ceil(curValSize.width));
            sliderOpts.currentValueHeight = Math.max(sliderOpts.currentValueHeight, Math.ceil(curValSize.height));
        });

        sliderOpts.currentValueTotalHeight = sliderOpts.currentValueHeight + sliderOpts.currentvalue.offset;

        dummyGroup.remove();
    }

    var graphSize = gd._fullLayout._size;
    sliderOpts.lx = graphSize.l + graphSize.w * sliderOpts.x;
    sliderOpts.ly = graphSize.t + graphSize.h * (1 - sliderOpts.y);

    if(sliderOpts.lenmode === 'fraction') {
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
    sliderOpts.inputAreaLength = Math.round(sliderOpts.outerLength - sliderOpts.pad.l - sliderOpts.pad.r);

    var textableInputLength = sliderOpts.inputAreaLength - 2 * constants.stepInset;
    var availableSpacePerLabel = textableInputLength / (sliderOpts.steps.length - 1);
    var computedSpacePerLabel = maxLabelWidth + constants.labelPadding;
    sliderOpts.labelStride = Math.max(1, Math.ceil(computedSpacePerLabel / availableSpacePerLabel));
    sliderOpts.labelHeight = labelHeight;

    sliderOpts.height = sliderOpts.currentValueTotalHeight + constants.tickOffset + sliderOpts.ticklen + constants.labelOffset + sliderOpts.labelHeight + sliderOpts.pad.t + sliderOpts.pad.b;

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

function drawSlider(gd, sliderGroup, sliderOpts) {
    // These are carefully ordered for proper z-ordering:
    sliderGroup
        .call(drawCurrentValue, sliderOpts)
        .call(drawRail, sliderOpts)
        .call(drawLabelGroup, sliderOpts)
        .call(drawTicks, sliderOpts)
        .call(drawTouchRect, gd, sliderOpts)
        .call(drawGrip, gd, sliderOpts);

    // Position the rectangle:
    Lib.setTranslate(sliderGroup, sliderOpts.lx + sliderOpts.pad.l, sliderOpts.ly + sliderOpts.pad.t);

    sliderGroup.call(setGripPosition, sliderOpts, sliderOpts.active / (sliderOpts.steps.length - 1), false);
    sliderGroup.call(drawCurrentValue, sliderOpts);

}

function drawCurrentValue(sliderGroup, sliderOpts, valueOverride) {
    if(!sliderOpts.currentvalue.visible) return;

    var x0, textAnchor;
    var text = sliderGroup.selectAll('text')
        .data([0]);

    switch(sliderOpts.currentvalue.xanchor) {
        case 'right':
        // This is anchored left and adjusted by the width of the longest label
        // so that the prefix doesn't move. The goal of this is to emphasize
        // what's actually changing and make the update less distracting.
            x0 = sliderOpts.inputAreaLength - constants.currentValueInset - sliderOpts.currentValueMaxWidth;
            textAnchor = 'left';
            break;
        case 'center':
            x0 = sliderOpts.inputAreaLength * 0.5;
            textAnchor = 'middle';
            break;
        default:
            x0 = constants.currentValueInset;
            textAnchor = 'left';
    }

    text.enter().append('text')
        .classed(constants.labelClass, true)
        .classed('user-select-none', true)
        .attr('text-anchor', textAnchor);

    var str = sliderOpts.currentvalue.prefix ? sliderOpts.currentvalue.prefix : '';

    if(typeof valueOverride === 'string') {
        str += valueOverride;
    } else {
        var curVal = sliderOpts.steps[sliderOpts.active].label;
        str += curVal;
    }

    if(sliderOpts.currentvalue.suffix) {
        str += sliderOpts.currentvalue.suffix;
    }

    text.call(Drawing.font, sliderOpts.currentvalue.font)
        .text(str)
        .call(svgTextUtils.convertToTspans);

    Lib.setTranslate(text, x0, sliderOpts.currentValueHeight);

    return text;
}

function drawGrip(sliderGroup, gd, sliderOpts) {
    var grip = sliderGroup.selectAll('rect.' + constants.gripRectClass)
        .data([0]);

    grip.enter().append('rect')
        .classed(constants.gripRectClass, true)
        .call(attachGripEvents, gd, sliderGroup, sliderOpts)
        .style('pointer-events', 'all');

    grip.attr({
        width: constants.gripWidth,
        height: constants.gripHeight,
        rx: constants.gripRadius,
        ry: constants.gripRadius,
    })
        .call(Color.stroke, sliderOpts.bordercolor)
        .call(Color.fill, sliderOpts.bgcolor)
        .style('stroke-width', sliderOpts.borderwidth + 'px');
}

function drawLabel(item, data, sliderOpts) {
    var text = item.selectAll('text')
        .data([0]);

    text.enter().append('text')
        .classed(constants.labelClass, true)
        .classed('user-select-none', true)
        .attr('text-anchor', 'middle');

    text.call(Drawing.font, sliderOpts.font)
        .text(data.step.label)
        .call(svgTextUtils.convertToTspans);

    return text;
}

function drawLabelGroup(sliderGroup, sliderOpts) {
    var labels = sliderGroup.selectAll('g.' + constants.labelsClass)
        .data([0]);

    labels.enter().append('g')
        .classed(constants.labelsClass, true);

    var labelItems = labels.selectAll('g.' + constants.labelGroupClass)
        .data(sliderOpts.labelSteps);

    labelItems.enter().append('g')
        .classed(constants.labelGroupClass, true);

    labelItems.exit().remove();

    labelItems.each(function(d) {
        var item = d3.select(this);

        item.call(drawLabel, d, sliderOpts);

        Lib.setTranslate(item,
            normalizedValueToPosition(sliderOpts, d.fraction),
            constants.tickOffset + sliderOpts.ticklen + sliderOpts.labelHeight + constants.labelOffset + sliderOpts.currentValueTotalHeight
        );
    });

}

function handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, doTransition) {
    var quantizedPosition = Math.round(normalizedPosition * (sliderOpts.steps.length - 1));

    if(quantizedPosition !== sliderOpts.active) {
        setActive(gd, sliderGroup, sliderOpts, quantizedPosition, true, doTransition);
    }
}

function setActive(gd, sliderGroup, sliderOpts, index, doCallback, doTransition) {
    var previousActive = sliderOpts.active;
    sliderOpts._input.active = sliderOpts.active = index;

    var step = sliderOpts.steps[sliderOpts.active];

    sliderGroup.call(setGripPosition, sliderOpts, sliderOpts.active / (sliderOpts.steps.length - 1), doTransition);
    sliderGroup.call(drawCurrentValue, sliderOpts);

    gd.emit('plotly_sliderchange', {
        slider: sliderOpts,
        step: sliderOpts.steps[sliderOpts.active],
        interaction: doCallback,
        previousActive: previousActive
    });

    if(step && step.method && doCallback) {
        if(sliderGroup._nextMethod) {
            // If we've already queued up an update, just overwrite it with the most recent:
            sliderGroup._nextMethod.step = step;
            sliderGroup._nextMethod.doCallback = doCallback;
            sliderGroup._nextMethod.doTransition = doTransition;
        } else {
            sliderGroup._nextMethod = {step: step, doCallback: doCallback, doTransition: doTransition};
            sliderGroup._nextMethodRaf = window.requestAnimationFrame(function() {
                var _step = sliderGroup._nextMethod.step;
                if(!_step.method) return;

                Plots.executeAPICommand(gd, _step.method, _step.args);

                sliderGroup._nextMethod = null;
                sliderGroup._nextMethodRaf = null;
            });
        }
    }
}

function attachGripEvents(item, gd, sliderGroup, sliderOpts) {
    var node = sliderGroup.node();
    var $gd = d3.select(gd);

    item.on('mousedown', function() {
        gd.emit('plotly_sliderstart', {slider: sliderOpts});

        var grip = sliderGroup.select('.' + constants.gripRectClass);

        d3.event.stopPropagation();
        d3.event.preventDefault();
        grip.call(Color.fill, sliderOpts.activebgcolor);

        var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
        handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, true);
        sliderOpts._dragging = true;

        $gd.on('mousemove', function() {
            var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
            handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, false);
        });

        $gd.on('mouseup', function() {
            sliderOpts._dragging = false;
            grip.call(Color.fill, sliderOpts.bgcolor);
            $gd.on('mouseup', null);
            $gd.on('mousemove', null);

            gd.emit('plotly_sliderend', {
                slider: sliderOpts,
                step: sliderOpts.steps[sliderOpts.active]
            });
        });
    });
}

function drawTicks(sliderGroup, sliderOpts) {
    var tick = sliderGroup.selectAll('rect.' + constants.tickRectClass)
        .data(sliderOpts.steps);

    tick.enter().append('rect')
        .classed(constants.tickRectClass, true);

    tick.exit().remove();

    tick.attr({
        width: sliderOpts.tickwidth + 'px',
        'shape-rendering': 'crispEdges'
    });

    tick.each(function(d, i) {
        var isMajor = i % sliderOpts.labelStride === 0;
        var item = d3.select(this);

        item
            .attr({height: isMajor ? sliderOpts.ticklen : sliderOpts.minorticklen})
            .call(Color.fill, isMajor ? sliderOpts.tickcolor : sliderOpts.tickcolor);

        Lib.setTranslate(item,
            normalizedValueToPosition(sliderOpts, i / (sliderOpts.steps.length - 1)) - 0.5 * sliderOpts.tickwidth,
            (isMajor ? constants.tickOffset : constants.minorTickOffset) + sliderOpts.currentValueTotalHeight
        );
    });

}

function computeLabelSteps(sliderOpts) {
    sliderOpts.labelSteps = [];
    var i0 = 0;
    var nsteps = sliderOpts.steps.length;

    for(var i = i0; i < nsteps; i += sliderOpts.labelStride) {
        sliderOpts.labelSteps.push({
            fraction: i / (nsteps - 1),
            step: sliderOpts.steps[i]
        });
    }
}

function setGripPosition(sliderGroup, sliderOpts, position, doTransition) {
    var grip = sliderGroup.select('rect.' + constants.gripRectClass);

    var x = normalizedValueToPosition(sliderOpts, position);

    // If this is true, then *this component* is already invoking its own command
    // and has triggered its own animation.
    if(sliderOpts._invokingCommand) return;

    var el = grip;
    if(doTransition && sliderOpts.transition.duration > 0) {
        el = el.transition()
            .duration(sliderOpts.transition.duration)
            .ease(sliderOpts.transition.easing);
    }

    // Lib.setTranslate doesn't work here becasue of the transition duck-typing.
    // It's also not necessary because there are no other transitions to preserve.
    el.attr('transform', 'translate(' + (x - constants.gripWidth * 0.5) + ',' + (sliderOpts.currentValueTotalHeight) + ')');
}

// Convert a number from [0-1] to a pixel position relative to the slider group container:
function normalizedValueToPosition(sliderOpts, normalizedPosition) {
    return sliderOpts.inputAreaStart + constants.stepInset +
        (sliderOpts.inputAreaLength - 2 * constants.stepInset) * Math.min(1, Math.max(0, normalizedPosition));
}

// Convert a position relative to the slider group to a nubmer in [0, 1]
function positionToNormalizedValue(sliderOpts, position) {
    return Math.min(1, Math.max(0, (position - constants.stepInset - sliderOpts.inputAreaStart) / (sliderOpts.inputAreaLength - 2 * constants.stepInset - 2 * sliderOpts.inputAreaStart)));
}

function drawTouchRect(sliderGroup, gd, sliderOpts) {
    var rect = sliderGroup.selectAll('rect.' + constants.railTouchRectClass)
        .data([0]);

    rect.enter().append('rect')
        .classed(constants.railTouchRectClass, true)
        .call(attachGripEvents, gd, sliderGroup, sliderOpts)
        .style('pointer-events', 'all');

    rect.attr({
        width: sliderOpts.inputAreaLength,
        height: Math.max(sliderOpts.inputAreaWidth, constants.tickOffset + sliderOpts.ticklen + sliderOpts.labelHeight)
    })
        .call(Color.fill, sliderOpts.bgcolor)
        .attr('opacity', 0);

    Lib.setTranslate(rect, 0, sliderOpts.currentValueTotalHeight);
}

function drawRail(sliderGroup, sliderOpts) {
    var rect = sliderGroup.selectAll('rect.' + constants.railRectClass)
        .data([0]);

    rect.enter().append('rect')
        .classed(constants.railRectClass, true);

    var computedLength = sliderOpts.inputAreaLength - constants.railInset * 2;

    rect.attr({
        width: computedLength,
        height: constants.railWidth,
        rx: constants.railRadius,
        ry: constants.railRadius,
        'shape-rendering': 'crispEdges'
    })
        .call(Color.stroke, sliderOpts.bordercolor)
        .call(Color.fill, sliderOpts.bgcolor)
        .style('stroke-width', sliderOpts.borderwidth + 'px');

    Lib.setTranslate(rect,
        constants.railInset,
        (sliderOpts.inputAreaWidth - constants.railWidth) * 0.5 + sliderOpts.currentValueTotalHeight
    );
}

function clearPushMargins(gd) {
    var pushMargins = gd._fullLayout._pushmargin || {},
        keys = Object.keys(pushMargins);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];

        if(k.indexOf(constants.autoMarginIdRoot) !== -1) {
            Plots.autoMargin(gd, k);
        }
    }
}

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

        Plots.autoMargin(gd, constants.autoMarginIdRoot + sliderOpts._index);
    });

    // Find the dimensions of the sliders:
    for(var i = 0; i < sliderData.length; i++) {
        var sliderOpts = sliderData[i];
        findDimensions(gd, sliderOpts);
    }

    sliderGroups.each(function(sliderOpts) {
        computeLabelSteps(sliderOpts);

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

        var tWidth = text.node() && Drawing.bBox(text.node()).width;

        // This just overwrites with the last. Which is fine as long as
        // the bounding box (probably incorrectly) measures the text *on
        // a single line*:
        labelHeight = text.node() && Drawing.bBox(text.node()).height;

        maxLabelWidth = Math.max(maxLabelWidth, tWidth);
    });

    sliderLabels.remove();

    sliderOpts.inputAreaWidth = Math.max(
        constants.railWidth,
        constants.gripHeight
    );

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

    sliderOpts.height = constants.tickOffset + constants.tickLength + constants.labelOffset + sliderOpts.labelHeight + sliderOpts.pad.t + sliderOpts.pad.b;

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
        .call(drawRail, sliderOpts)
        .call(drawLabelGroup, sliderOpts)
        .call(drawTicks, sliderOpts)
        .call(drawTouchRect, gd, sliderOpts)
        .call(drawGrip, gd, sliderOpts);

    // Position the rectangle:
    Lib.setTranslate(sliderGroup, sliderOpts.lx + sliderOpts.pad.l, sliderOpts.ly + sliderOpts.pad.t);

    // Every time the slider is draw from scratch, just detach and reattach the event listeners.
    // This could perhaps be avoided.
    removeListeners(gd, sliderGroup, sliderOpts);
    attachListeners(gd, sliderGroup, sliderOpts);

    setActive(gd, sliderGroup, sliderOpts, sliderOpts.active, true, false);
}

function removeListeners(gd, sliderGroup, sliderOpts) {
    var listeners = sliderOpts._input.listeners;
    var eventNames = sliderOpts._input.eventNames;
    if(!Array.isArray(listeners) || !Array.isArray(eventNames)) return;
    while(listeners.length) {
        gd._removeInternalListener(eventNames.pop(), listeners.pop());
    }
}

function attachListeners(gd, sliderGroup, sliderOpts) {
    var listeners = sliderOpts._input.listeners = [];
    var eventNames = sliderOpts._input.eventNames = [];

    function makeListener(eventname, updatevalue) {
        return function(data) {
            var value = data;
            if(updatevalue) {
                value = Lib.nestedProperty(data, updatevalue).get();
            }

            // If it's *currently* invoking a command an event is received,
            // then we'll ignore the event in order to avoid complicated
            // invinite loops.
            if(sliderOpts._invokingCommand) return;

            setActiveByLabel(gd, sliderGroup, sliderOpts, value, false, true);
        };
    }

    for(var i = 0; i < sliderOpts.updateevent.length; i++) {
        var updateEventName = sliderOpts.updateevent[i];
        var updatevalue = sliderOpts.updatevalue;

        var updatelistener = makeListener(updateEventName, updatevalue);

        gd._internalEv.on(updateEventName, updatelistener);

        eventNames.push(updateEventName);
        listeners.push(updatelistener);
    }
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
        .call(Color.stroke, constants.gripBorderColor)
        .call(Color.fill, constants.gripBgColor)
        .style('stroke-width', constants.gripBorderWidth + 'px');
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
            constants.tickOffset + constants.tickLength + sliderOpts.labelHeight + constants.labelOffset
        );
    });

}

function handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, doTransition) {
    var quantizedPosition = Math.round(normalizedPosition * (sliderOpts.steps.length - 1));


    if(quantizedPosition !== sliderOpts.active) {
        setActive(gd, sliderGroup, sliderOpts, quantizedPosition, true, doTransition);
    }
}

function setActiveByLabel(gd, sliderGroup, sliderOpts, label, doCallback, doTransition) {
    var index;
    for(var i = 0; i < sliderOpts.steps.length; i++) {
        var step = sliderOpts.steps[i];
        if(step.label === label) {
            index = i;
            break;
        }
    }

    if(index !== undefined) {
        setActive(gd, sliderGroup, sliderOpts, index, doCallback, doTransition);
    }
}

function setActive(gd, sliderGroup, sliderOpts, index, doCallback, doTransition) {
    sliderOpts._input.active = sliderOpts.active = index;

    var step = sliderOpts.steps[sliderOpts.active];

    sliderGroup.call(setGripPosition, sliderOpts, sliderOpts.active / (sliderOpts.steps.length - 1), doTransition);

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
                var args = _step.args;
                if(!_step.method) return;

                sliderOpts._invokingCommand = true;
                Plotly[_step.method](gd, args[0], args[1], args[2]).then(function() {
                    sliderOpts._invokingCommand = false;
                }, function() {
                    sliderOpts._invokingCommand = false;

                    // This is not a disaster. Some methods like `animate` reject if interrupted
                    // and *should* nicely log a warning.
                    Lib.warn('Warning: Plotly.' + _step.method + ' was called and rejected.');
                });

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
        var grip = sliderGroup.select('.' + constants.gripRectClass);

        d3.event.stopPropagation();
        d3.event.preventDefault();
        grip.call(Color.fill, constants.gripBgActiveColor);

        var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
        handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, true);

        $gd.on('mousemove', function() {
            var normalizedPosition = positionToNormalizedValue(sliderOpts, d3.mouse(node)[0]);
            handleInput(gd, sliderGroup, sliderOpts, normalizedPosition, false);
        });

        $gd.on('mouseup', function() {
            grip.call(Color.fill, constants.gripBgColor);
            $gd.on('mouseup', null);
            $gd.on('mousemove', null);
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
        width: constants.tickWidth,
        'shape-rendering': 'crispEdges'
    });

    tick.each(function(d, i) {
        var isMajor = i % sliderOpts.labelStride === 0;
        var item = d3.select(this);

        item
            .attr({height: isMajor ? constants.tickLength : constants.minorTickLength})
            .call(Color.fill, isMajor ? constants.tickColor : constants.minorTickColor);

        Lib.setTranslate(item,
            normalizedValueToPosition(sliderOpts, i / (sliderOpts.steps.length - 1)) - 0.5 * constants.tickWidth,
            isMajor ? constants.tickOffset : constants.minorTickOffset
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

    var el = grip;
    if(doTransition && sliderOpts.transition.duration > 0 && !sliderOpts._invokingCommand) {
        el = el.transition()
            .duration(sliderOpts.transition.duration)
            .ease(sliderOpts.transition.easing);
    }

    // Lib.setTranslate doesn't work here becasue of the transition duck-typing.
    // It's also not necessary because there are no other transitions to preserve.
    el.attr('transform', 'translate(' + (x - constants.gripWidth * 0.5) + ',' + 0 + ')');
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
        height: Math.max(sliderOpts.inputAreaWidth, constants.tickOffset + constants.tickLength + sliderOpts.labelHeight)
    })
        .call(Color.fill, constants.gripBgColor)
        .attr('opacity', 0);

    Lib.setTranslate(rect, 0, 0);
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
        .call(Color.stroke, constants.railBorderColor)
        .call(Color.fill, constants.railBgColor)
        .style('stroke-width', '1px');

    Lib.setTranslate(rect, constants.railInset, (sliderOpts.inputAreaWidth - constants.railWidth) * 0.5);
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

/**
* Copyright 2012-2017, Plotly, Inc.
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
var Drawing = require('../drawing');
var Color = require('../color');

var Cartesian = require('../../plots/cartesian');
var Axes = require('../../plots/cartesian/axes');

var dragElement = require('../dragelement');
var setCursor = require('../../lib/setcursor');

var constants = require('./constants');


module.exports = function(gd) {
    var fullLayout = gd._fullLayout,
        rangeSliderData = makeRangeSliderData(fullLayout);

    /*
     * <g container />
     *  <rect bg />
     *  < .... range plot />
     *  <rect mask-min />
     *  <rect mask-max />
     *  <rect slidebox />
     *  <g grabber-min />
     *      <rect handle-min />
     *      <rect grabare-min />
     *  <g grabber-max />
     *      <rect handle-max />
     *      <rect grabare-max />
     *
     *  ...
     */

    function keyFunction(axisOpts) {
        return axisOpts._name;
    }

    var rangeSliders = fullLayout._infolayer
        .selectAll('g.' + constants.containerClassName)
        .data(rangeSliderData, keyFunction);

    rangeSliders.enter().append('g')
        .classed(constants.containerClassName, true)
        .attr('pointer-events', 'all');

    // remove exiting sliders and their corresponding clip paths
    rangeSliders.exit().each(function(axisOpts) {
        var rangeSlider = d3.select(this),
            opts = axisOpts[constants.name];

        rangeSlider.remove();
        fullLayout._topdefs.select('#' + opts._clipId).remove();
    });

    // remove push margin object(s)
    if(rangeSliders.exit().size()) clearPushMargins(gd);

    // return early if no range slider is visible
    if(rangeSliderData.length === 0) return;

    // for all present range sliders
    rangeSliders.each(function(axisOpts) {
        var rangeSlider = d3.select(this),
            opts = axisOpts[constants.name],
            oppAxisOpts = fullLayout[Axes.id2name(axisOpts.anchor)];

        // update range slider dimensions

        var margin = fullLayout.margin,
            graphSize = fullLayout._size,
            domain = axisOpts.domain,
            oppDomain = oppAxisOpts.domain,
            tickHeight = (axisOpts._boundingBox || {}).height || 0;

        opts._id = constants.name + axisOpts._id;
        opts._clipId = opts._id + '-' + fullLayout._uid;

        opts._width = graphSize.w * (domain[1] - domain[0]);
        opts._height = (fullLayout.height - margin.b - margin.t) * opts.thickness;
        opts._offsetShift = Math.floor(opts.borderwidth / 2);

        var x = Math.round(margin.l + (graphSize.w * domain[0]));

        var y = Math.round(
            margin.t + graphSize.h * (1 - oppDomain[0]) +
            tickHeight +
            opts._offsetShift + constants.extraPad
        );

        rangeSlider.attr('transform', 'translate(' + x + ',' + y + ')');

        // update data <--> pixel coordinate conversion methods

        var range0 = axisOpts.r2l(opts.range[0]),
            range1 = axisOpts.r2l(opts.range[1]),
            dist = range1 - range0;

        opts.p2d = function(v) {
            return (v / opts._width) * dist + range0;
        };

        opts.d2p = function(v) {
            return (v - range0) / dist * opts._width;
        };

        opts._rl = [range0, range1];

        // update inner nodes

        rangeSlider
            .call(drawBg, gd, axisOpts, opts)
            .call(addClipPath, gd, axisOpts, opts)
            .call(drawRangePlot, gd, axisOpts, opts)
            .call(drawMasks, gd, axisOpts, opts)
            .call(drawSlideBox, gd, axisOpts, opts)
            .call(drawGrabbers, gd, axisOpts, opts);

        // setup drag element
        setupDragElement(rangeSlider, gd, axisOpts, opts);

        // update current range
        setPixelRange(rangeSlider, gd, axisOpts, opts);

        // update margins

        Plots.autoMargin(gd, opts._id, {
            x: domain[0],
            y: oppDomain[0],
            l: 0,
            r: 0,
            t: 0,
            b: opts._height + margin.b + tickHeight,
            pad: constants.extraPad + opts._offsetShift * 2
        });

    });
};

function makeRangeSliderData(fullLayout) {
    var axes = Axes.list({ _fullLayout: fullLayout }, 'x', true),
        name = constants.name,
        out = [];

    if(fullLayout._has('gl2d')) return out;

    for(var i = 0; i < axes.length; i++) {
        var ax = axes[i];

        if(ax[name] && ax[name].visible) out.push(ax);
    }

    return out;
}

function setupDragElement(rangeSlider, gd, axisOpts, opts) {
    var slideBox = rangeSlider.select('rect.' + constants.slideBoxClassName).node(),
        grabAreaMin = rangeSlider.select('rect.' + constants.grabAreaMinClassName).node(),
        grabAreaMax = rangeSlider.select('rect.' + constants.grabAreaMaxClassName).node();

    rangeSlider.on('mousedown', function() {
        var event = d3.event,
            target = event.target,
            startX = event.clientX,
            offsetX = startX - rangeSlider.node().getBoundingClientRect().left,
            minVal = opts.d2p(axisOpts._rl[0]),
            maxVal = opts.d2p(axisOpts._rl[1]);

        var dragCover = dragElement.coverSlip();

        dragCover.addEventListener('mousemove', mouseMove);
        dragCover.addEventListener('mouseup', mouseUp);

        function mouseMove(e) {
            var delta = +e.clientX - startX;
            var pixelMin, pixelMax, cursor;

            switch(target) {
                case slideBox:
                    cursor = 'ew-resize';
                    pixelMin = minVal + delta;
                    pixelMax = maxVal + delta;
                    break;

                case grabAreaMin:
                    cursor = 'col-resize';
                    pixelMin = minVal + delta;
                    pixelMax = maxVal;
                    break;

                case grabAreaMax:
                    cursor = 'col-resize';
                    pixelMin = minVal;
                    pixelMax = maxVal + delta;
                    break;

                default:
                    cursor = 'ew-resize';
                    pixelMin = offsetX;
                    pixelMax = offsetX + delta;
                    break;
            }

            if(pixelMax < pixelMin) {
                var tmp = pixelMax;
                pixelMax = pixelMin;
                pixelMin = tmp;
            }

            opts._pixelMin = pixelMin;
            opts._pixelMax = pixelMax;

            setCursor(d3.select(dragCover), cursor);
            setDataRange(rangeSlider, gd, axisOpts, opts);
        }

        function mouseUp() {
            dragCover.removeEventListener('mousemove', mouseMove);
            dragCover.removeEventListener('mouseup', mouseUp);
            Lib.removeElement(dragCover);
        }
    });
}

function setDataRange(rangeSlider, gd, axisOpts, opts) {

    function clamp(v) {
        return axisOpts.l2r(Lib.constrain(v, opts._rl[0], opts._rl[1]));
    }

    var dataMin = clamp(opts.p2d(opts._pixelMin)),
        dataMax = clamp(opts.p2d(opts._pixelMax));

    window.requestAnimationFrame(function() {
        Plotly.relayout(gd, axisOpts._name + '.range', [dataMin, dataMax]);
    });
}

function setPixelRange(rangeSlider, gd, axisOpts, opts) {
    var hw2 = constants.handleWidth / 2;

    function clamp(v) {
        return Lib.constrain(v, 0, opts._width);
    }

    function clampHandle(v) {
        return Lib.constrain(v, -hw2, opts._width + hw2);
    }

    var pixelMin = clamp(opts.d2p(axisOpts._rl[0])),
        pixelMax = clamp(opts.d2p(axisOpts._rl[1]));

    rangeSlider.select('rect.' + constants.slideBoxClassName)
        .attr('x', pixelMin)
        .attr('width', pixelMax - pixelMin);

    rangeSlider.select('rect.' + constants.maskMinClassName)
        .attr('width', pixelMin);

    rangeSlider.select('rect.' + constants.maskMaxClassName)
        .attr('x', pixelMax)
        .attr('width', opts._width - pixelMax);

    // add offset for crispier corners
    // https://github.com/plotly/plotly.js/pull/1409
    var offset = 0.5;

    var xMin = Math.round(clampHandle(pixelMin - hw2)) - offset,
        xMax = Math.round(clampHandle(pixelMax - hw2)) + offset;

    rangeSlider.select('g.' + constants.grabberMinClassName)
        .attr('transform', 'translate(' + xMin + ',' + offset + ')');

    rangeSlider.select('g.' + constants.grabberMaxClassName)
        .attr('transform', 'translate(' + xMax + ',' + offset + ')');
}

function drawBg(rangeSlider, gd, axisOpts, opts) {
    var bg = rangeSlider.selectAll('rect.' + constants.bgClassName)
        .data([0]);

    bg.enter().append('rect')
        .classed(constants.bgClassName, true)
        .attr({
            x: 0,
            y: 0,
            'shape-rendering': 'crispEdges'
        });

    var borderCorrect = (opts.borderwidth % 2) === 0 ?
            opts.borderwidth :
            opts.borderwidth - 1;

    var offsetShift = -opts._offsetShift;
    var lw = Drawing.crispRound(gd, opts.borderwidth);

    bg.attr({
        width: opts._width + borderCorrect,
        height: opts._height + borderCorrect,
        transform: 'translate(' + offsetShift + ',' + offsetShift + ')',
        fill: opts.bgcolor,
        stroke: opts.bordercolor,
        'stroke-width': lw
    });
}

function addClipPath(rangeSlider, gd, axisOpts, opts) {
    var fullLayout = gd._fullLayout;

    var clipPath = fullLayout._topdefs.selectAll('#' + opts._clipId)
        .data([0]);

    clipPath.enter().append('clipPath')
        .attr('id', opts._clipId)
        .append('rect')
        .attr({ x: 0, y: 0 });

    clipPath.select('rect').attr({
        width: opts._width,
        height: opts._height
    });
}

function drawRangePlot(rangeSlider, gd, axisOpts, opts) {
    var subplotData = Axes.getSubplots(gd, axisOpts),
        calcData = gd.calcdata;

    var rangePlots = rangeSlider.selectAll('g.' + constants.rangePlotClassName)
        .data(subplotData, Lib.identity);

    rangePlots.enter().append('g')
        .attr('class', function(id) { return constants.rangePlotClassName + ' ' + id; })
        .call(Drawing.setClipUrl, opts._clipId);

    rangePlots.order();

    rangePlots.exit().remove();

    var mainplotinfo;

    rangePlots.each(function(id, i) {
        var plotgroup = d3.select(this),
            isMainPlot = (i === 0);

        var oppAxisOpts = Axes.getFromId(gd, id, 'y'),
            oppAxisName = oppAxisOpts._name;

        var mockFigure = {
            data: [],
            layout: {
                xaxis: {
                    type: axisOpts.type,
                    domain: [0, 1],
                    range: opts.range.slice(),
                    calendar: axisOpts.calendar
                },
                width: opts._width,
                height: opts._height,
                margin: { t: 0, b: 0, l: 0, r: 0 }
            }
        };

        mockFigure.layout[oppAxisName] = {
            domain: [0, 1],
            range: oppAxisOpts.range.slice(),
            calendar: oppAxisOpts.calendar
        };

        Plots.supplyDefaults(mockFigure);

        var xa = mockFigure._fullLayout.xaxis,
            ya = mockFigure._fullLayout[oppAxisName];

        var plotinfo = {
            id: id,
            plotgroup: plotgroup,
            xaxis: xa,
            yaxis: ya
        };

        if(isMainPlot) mainplotinfo = plotinfo;
        else {
            plotinfo.mainplot = 'xy';
            plotinfo.mainplotinfo = mainplotinfo;
        }

        Cartesian.rangePlot(gd, plotinfo, filterRangePlotCalcData(calcData, id));

        // no need for the bg layer,
        // drawBg handles coloring the background
        if(isMainPlot) plotinfo.bg.remove();
    });
}

function filterRangePlotCalcData(calcData, subplotId) {
    var out = [];

    for(var i = 0; i < calcData.length; i++) {
        var calcTrace = calcData[i],
            trace = calcTrace[0].trace;

        if(trace.xaxis + trace.yaxis === subplotId) {
            out.push(calcTrace);
        }
    }

    return out;
}

function drawMasks(rangeSlider, gd, axisOpts, opts) {
    var maskMin = rangeSlider.selectAll('rect.' + constants.maskMinClassName)
        .data([0]);

    maskMin.enter().append('rect')
        .classed(constants.maskMinClassName, true)
        .attr({ x: 0, y: 0 })
        .attr('shape-rendering', 'crispEdges');

    maskMin
        .attr('height', opts._height)
        .call(Color.fill, constants.maskColor);

    var maskMax = rangeSlider.selectAll('rect.' + constants.maskMaxClassName)
        .data([0]);

    maskMax.enter().append('rect')
        .classed(constants.maskMaxClassName, true)
        .attr('y', 0)
        .attr('shape-rendering', 'crispEdges');

    maskMax
        .attr('height', opts._height)
        .call(Color.fill, constants.maskColor);
}

function drawSlideBox(rangeSlider, gd, axisOpts, opts) {
    if(gd._context.staticPlot) return;

    var slideBox = rangeSlider.selectAll('rect.' + constants.slideBoxClassName)
        .data([0]);

    slideBox.enter().append('rect')
        .classed(constants.slideBoxClassName, true)
        .attr('y', 0)
        .attr('cursor', constants.slideBoxCursor)
        .attr('shape-rendering', 'crispEdges');

    slideBox.attr({
        height: opts._height,
        fill: constants.slideBoxFill
    });
}

function drawGrabbers(rangeSlider, gd, axisOpts, opts) {

    // <g grabber />

    var grabberMin = rangeSlider.selectAll('g.' + constants.grabberMinClassName)
        .data([0]);
    grabberMin.enter().append('g')
        .classed(constants.grabberMinClassName, true);

    var grabberMax = rangeSlider.selectAll('g.' + constants.grabberMaxClassName)
        .data([0]);
    grabberMax.enter().append('g')
        .classed(constants.grabberMaxClassName, true);

    // <g handle />

    var handleFixAttrs = {
        x: 0,
        width: constants.handleWidth,
        rx: constants.handleRadius,
        fill: Color.background,
        stroke: Color.defaultLine,
        'stroke-width': constants.handleStrokeWidth,
        'shape-rendering': 'crispEdges'
    };

    var handleDynamicAttrs = {
        y: Math.round(opts._height / 4),
        height: Math.round(opts._height / 2),
    };

    var handleMin = grabberMin.selectAll('rect.' + constants.handleMinClassName)
        .data([0]);
    handleMin.enter().append('rect')
        .classed(constants.handleMinClassName, true)
        .attr(handleFixAttrs);
    handleMin.attr(handleDynamicAttrs);

    var handleMax = grabberMax.selectAll('rect.' + constants.handleMaxClassName)
        .data([0]);
    handleMax.enter().append('rect')
        .classed(constants.handleMaxClassName, true)
        .attr(handleFixAttrs);
    handleMax.attr(handleDynamicAttrs);

    // <g grabarea />

    if(gd._context.staticPlot) return;

    var grabAreaFixAttrs = {
        width: constants.grabAreaWidth,
        x: 0,
        y: 0,
        fill: constants.grabAreaFill,
        cursor: constants.grabAreaCursor
    };

    var grabAreaMin = grabberMin.selectAll('rect.' + constants.grabAreaMinClassName)
        .data([0]);
    grabAreaMin.enter().append('rect')
        .classed(constants.grabAreaMinClassName, true)
        .attr(grabAreaFixAttrs);
    grabAreaMin.attr('height', opts._height);

    var grabAreaMax = grabberMax.selectAll('rect.' + constants.grabAreaMaxClassName)
        .data([0]);
    grabAreaMax.enter().append('rect')
        .classed(constants.grabAreaMaxClassName, true)
        .attr(grabAreaFixAttrs);
    grabAreaMax.attr('height', opts._height);
}

function clearPushMargins(gd) {
    var pushMargins = gd._fullLayout._pushmargin || {},
        keys = Object.keys(pushMargins);

    for(var i = 0; i < keys.length; i++) {
        var k = keys[i];

        if(k.indexOf(constants.name) !== -1) {
            Plots.autoMargin(gd, k);
        }
    }
}

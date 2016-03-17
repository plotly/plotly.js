/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('../../plotly');

var Lib = require('../../lib');
var Plots = require('../../plots/plots');

var svgNS = require('../../constants/xmlns_namespaces').svg;
var helpers = require('./helpers');
var rangePlot = require('./range_plot');
var supplyLayoutDefaults = require('./defaults');


module.exports = {
    draw: draw,
    supplyLayoutDefaults: supplyLayoutDefaults
};

function draw(gd, minStart, maxStart) {
    var fullLayout = gd._fullLayout,
        options = fullLayout.xaxis.rangeslider;

    // don't draw if being exported
    if(!options.visible) return;


    var width = fullLayout._size.w,
        height = (fullLayout.height - fullLayout.margin.b - fullLayout.margin.t) * options.height,
        handleWidth = 2,
        offsetShift = Math.floor(options.borderwidth / 2);

    minStart = minStart || 0;
    maxStart = maxStart || width;

    var x = fullLayout.margin.l,
        y = fullLayout.height - height - fullLayout.margin.b;


    var slider = document.createElementNS(svgNS, 'g');
    helpers.setAttributes(slider, {
        'class': 'range-slider',
        'data-min': minStart,
        'data-max': maxStart,
        'pointer-events': 'all',
        'transform': 'translate(' + x + ',' + y + ')'
    });


    var sliderBg = document.createElementNS(svgNS, 'rect'),
        borderCorrect = options.borderwidth % 2 === 0 ? options.borderwidth : options.borderwidth - 1;
    helpers.setAttributes(sliderBg, {
        'fill': options.backgroundcolor,
        'stroke': options.bordercolor,
        'stroke-width': options.borderwidth,
        'height': height + borderCorrect,
        'width': width + borderCorrect,
        'transform': 'translate(-' + offsetShift + ', -' + offsetShift + ')',
        'shape-rendering': 'crispEdges'
    });


    var maskMin = document.createElementNS(svgNS, 'rect');
    helpers.setAttributes(maskMin, {
        'x': 0,
        'width': minStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.4)'
    });


    var maskMax = document.createElementNS(svgNS, 'rect');
    helpers.setAttributes(maskMax, {
        'x': maxStart,
        'width': width - maxStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.4)'
    });


    var grabberMin = document.createElementNS(svgNS, 'g'),
        grabAreaMin = document.createElementNS(svgNS, 'rect'),
        handleMin = document.createElementNS(svgNS, 'rect');
    helpers.setAttributes(grabberMin, { 'transform': 'translate(' + (minStart - handleWidth - 1) + ')' });
    helpers.setAttributes(grabAreaMin, {
        'width': 10,
        'height': height,
        'x': -3,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    helpers.setAttributes(handleMin, {
        'width': handleWidth,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    helpers.appendChildren(grabberMin, [handleMin, grabAreaMin]);


    var grabberMax = document.createElementNS(svgNS, 'g'),
        grabAreaMax = document.createElementNS(svgNS, 'rect'),
        handleMax = document.createElementNS(svgNS, 'rect');
    helpers.setAttributes(grabberMax, { 'transform': 'translate(' + maxStart + ')' });
    helpers.setAttributes(grabAreaMax, {
        'width': 10,
        'height': height,
        'x': -4,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    helpers.setAttributes(handleMax, {
        'width': handleWidth,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    helpers.appendChildren(grabberMax, [handleMax, grabAreaMax]);


    var slideBox = document.createElementNS(svgNS, 'rect');
    helpers.setAttributes(slideBox, {
        'x': minStart,
        'width': maxStart - minStart,
        'height': height,
        'cursor': 'ew-resize',
        'fill': 'transparent'
    });


    slider.addEventListener('mousedown', function(event) {
        var target = event.target,
            startX = event.clientX,
            offsetX = startX - slider.getBoundingClientRect().left,
            minVal = slider.getAttribute('data-min'),
            maxVal = slider.getAttribute('data-max');

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);

        function mouseMove(e) {
            var delta = +e.clientX - startX;

            switch(target) {
                case slideBox:
                    slider.style.cursor = 'ew-resize';
                    setPixelRange(+maxVal + delta, +minVal + delta);
                    break;

                case grabAreaMin:
                    slider.style.cursor = 'col-resize';
                    setPixelRange(+minVal + delta, +maxVal);
                    break;

                case grabAreaMax:
                    slider.style.cursor = 'col-resize';
                    setPixelRange(+minVal, +maxVal + delta);
                    break;

                default:
                    slider.style.cursor = 'ew-resize';
                    setPixelRange(offsetX, offsetX + delta);
                    break;
            }
        }

        function mouseUp() {
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            slider.style.cursor = 'auto';
        }
    });


    function setRange(min, max) {
        var rangeMin = fullLayout.xaxis.range[0],
            rangeMax = fullLayout.xaxis.range[1],
            range = rangeMax - rangeMin,
            pixelMin = (min - rangeMin) / range * width,
            pixelMax = (max - rangeMin) / range * width;

        setPixelRange(pixelMin, pixelMax);
    }


    function setPixelRange(min, max) {

        min = Lib.constrain(min, 0, width);
        max = Lib.constrain(max, 0, width);

        if(max < min) {
            var temp = max;
            max = min;
            min = temp;
        }

        helpers.setAttributes(slider, {
            'data-min': min,
            'data-max': max
        });

        helpers.setAttributes(slideBox, {
            'x': min,
            'width': max - min
        });

        helpers.setAttributes(maskMin, { 'width': min });
        helpers.setAttributes(maskMax, {
            'x': max,
            'width': width - max
        });

        helpers.setAttributes(grabberMin, { 'transform': 'translate(' + (min - handleWidth - 1) + ')' });
        helpers.setAttributes(grabberMax, { 'transform': 'translate(' + max + ')' });

        // call to set range on plot here
        var rangeMin = fullLayout.xaxis.range[0],
            rangeMax = fullLayout.xaxis.range[1],
            range = rangeMax - rangeMin,
            dataMin = min / width * range + rangeMin,
            dataMax = max / width * range + rangeMin;

        Plotly.relayout(gd, 'xaxis.range', [dataMin, dataMax]);
    }


    var rangePlots = rangePlot(gd, width, height);

    helpers.appendChildren(slider, [
        sliderBg,
        rangePlots,
        maskMin,
        maskMax,
        slideBox,
        grabberMin,
        grabberMax
    ]);

    var infoLayer = fullLayout._infolayer;
    infoLayer.selectAll('g.range-slider')
        .data([0])
    .enter().append(function() {
        options.setRange = setRange;
        return slider;
    });

    Plots.autoMargin(gd, 'range-slider', {
        x: 0, y: 0, l: 0, r: 0, t: 0,
        b: height + fullLayout.margin.b + offsetShift,
        pad: fullLayout.xaxis.tickfont.size * 2 + offsetShift
    });
}

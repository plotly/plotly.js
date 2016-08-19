/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var Plotly = require('../../plotly');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

var svgNS = require('../../constants/xmlns_namespaces').svg;

var helpers = require('./helpers');
var rangePlot = require('./range_plot');


module.exports = function createSlider(gd) {
    var fullLayout = gd._fullLayout,
        sliderContainer = fullLayout._infolayer.selectAll('g.range-slider'),
        options = fullLayout.xaxis.rangeslider,
        width = fullLayout._size.w,
        height = (fullLayout.height - fullLayout.margin.b - fullLayout.margin.t) * options.thickness,
        handleWidth = 2,
        offsetShift = Math.floor(options.borderwidth / 2),
        x = fullLayout.margin.l,
        y = fullLayout.height - height - fullLayout.margin.b;

    var minStart = 0,
        maxStart = width;

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
        'fill': options.bgcolor,
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
        'x': -6,
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
        'x': -2,
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
            var delta = +e.clientX - startX,
                pixelMin,
                pixelMax;

            switch(target) {
                case slideBox:
                    slider.style.cursor = 'ew-resize';

                    pixelMin = +minVal + delta;
                    pixelMax = +maxVal + delta;

                    setPixelRange(pixelMin, pixelMax);
                    setDataRange(pixelToData(pixelMin), pixelToData(pixelMax));
                    break;

                case grabAreaMin:
                    slider.style.cursor = 'col-resize';

                    pixelMin = +minVal + delta;
                    pixelMax = +maxVal;

                    setPixelRange(pixelMin, pixelMax);
                    setDataRange(pixelToData(pixelMin), pixelToData(pixelMax));
                    break;

                case grabAreaMax:
                    slider.style.cursor = 'col-resize';

                    pixelMin = +minVal;
                    pixelMax = +maxVal + delta;

                    setPixelRange(pixelMin, pixelMax);
                    setDataRange(pixelToData(pixelMin), pixelToData(pixelMax));
                    break;

                default:
                    slider.style.cursor = 'ew-resize';

                    pixelMin = offsetX;
                    pixelMax = offsetX + delta;

                    setPixelRange(pixelMin, pixelMax);
                    setDataRange(pixelToData(pixelMin), pixelToData(pixelMax));
                    break;
            }
        }

        function mouseUp() {
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            slider.style.cursor = 'auto';
        }
    });

    function pixelToData(pixel) {
        var rangeMin = options.range[0],
            rangeMax = options.range[1],
            range = rangeMax - rangeMin,
            dataValue = pixel / width * range + rangeMin;

        dataValue = Lib.constrain(dataValue, rangeMin, rangeMax);

        return dataValue;
    }


    function setRange(min, max) {
        min = min || -Infinity;
        max = max || Infinity;

        var rangeMin = options.range[0],
            rangeMax = options.range[1],
            range = rangeMax - rangeMin,
            pixelMin = (min - rangeMin) / range * width,
            pixelMax = (max - rangeMin) / range * width;

        setPixelRange(pixelMin, pixelMax);
    }

    function setDataRange(dataMin, dataMax) {

        if(window.requestAnimationFrame) {
            window.requestAnimationFrame(function() {
                Plotly.relayout(gd, 'xaxis.range', [dataMin, dataMax]);
            });
        } else {
            setTimeout(function() {
                Plotly.relayout(gd, 'xaxis.range', [dataMin, dataMax]);
            }, 16);
        }
    }


    function setPixelRange(pixelMin, pixelMax) {

        pixelMin = Lib.constrain(pixelMin, 0, width);
        pixelMax = Lib.constrain(pixelMax, 0, width);

        if(pixelMax < pixelMin) {
            var temp = pixelMax;
            pixelMax = pixelMin;
            pixelMin = temp;
        }

        helpers.setAttributes(slider, {
            'data-min': pixelMin,
            'data-max': pixelMax
        });

        helpers.setAttributes(slideBox, {
            'x': pixelMin,
            'width': pixelMax - pixelMin
        });

        helpers.setAttributes(maskMin, { 'width': pixelMin });
        helpers.setAttributes(maskMax, {
            'x': pixelMax,
            'width': width - pixelMax
        });

        helpers.setAttributes(grabberMin, { 'transform': 'translate(' + (pixelMin - handleWidth - 1) + ')' });
        helpers.setAttributes(grabberMax, { 'transform': 'translate(' + pixelMax + ')' });
    }


    // Set slider range using axis autorange if necessary.
    if(!options.range) {
        options.range = Axes.getAutoRange(fullLayout.xaxis);
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

    // Set initially selected range
    setRange(fullLayout.xaxis.range[0], fullLayout.xaxis.range[1]);

    sliderContainer.data([0])
        .enter().append(function() {
            options.setRange = setRange;
            return slider;
        });
};

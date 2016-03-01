'use strict';

var Lib = require('../../lib');
var Helpers = require('./helpers');

var makeScatterLines = require('./scatter');

var svgNS = 'http://www.w3.org/2000/svg';

exports.makeSlider = function makeSlider(gd, minStart, maxStart) {
    var width = gd._fullLayout._size.w,
        height = width / 10;

    minStart = minStart || 0;
    maxStart = maxStart || width;

    var slider = document.createElementNS(svgNS, 'g');
    Helpers.setAttributes(slider, {
        'class': 'range-slider',
        'data-min': minStart,
        'data-max': maxStart,
        'pointer-events': 'all',
        'transform': 'translate(5)'
    });

    var sliderBg = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(sliderBg, {
        'fill': 'transparent',
        'stroke': 'black',
        'height': height,
        'width': width,
        'shape-rendering': 'crispEdges'
    });

    var maskMin = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(maskMin, {
        'x': 0,
        'width': minStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.25)'
    });

    var maskMax = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(maskMax, {
        'x': maxStart,
        'width': width - maxStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.25)'
    });

    var grabberMin = document.createElementNS(svgNS, 'g');
    var grabAreaMin = document.createElementNS(svgNS, 'rect');
    var handleMin = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(grabberMin, { 'transform': 'translate(' + (minStart - 2) + ')' });
    Helpers.setAttributes(grabAreaMin, {
        'width': 10,
        'height': height,
        'x': -4,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    Helpers.setAttributes(handleMin, {
        'width': 2,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    Helpers.appendChildren(grabberMin, [handleMin, grabAreaMin]);

    var grabberMax = document.createElementNS(svgNS, 'g');
    var grabAreaMax = document.createElementNS(svgNS, 'rect');
    var handleMax = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(grabberMax, { 'transform': 'translate(' + maxStart + ')' });
    Helpers.setAttributes(grabAreaMax, {
        'width': 10,
        'height': height,
        'x': -4,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    Helpers.setAttributes(handleMax, {
        'width': 2,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    Helpers.appendChildren(grabberMax, [handleMax, grabAreaMax]);

    var slideBox = document.createElementNS(svgNS, 'rect');
    Helpers.setAttributes(slideBox, {
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
                    setRange(+maxVal + delta, +minVal + delta);
                    break;

                case grabAreaMin:
                    slider.style.cursor = 'col-resize';
                    setRange(+minVal + delta, +maxVal);
                    break;

                case grabAreaMax:
                    slider.style.cursor = 'col-resize';
                    setRange(+minVal, +maxVal + delta);
                    break;

                default:
                    slider.style.cursor = 'ew-resize';
                    setRange(offsetX, offsetX + delta);
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

        min = Lib.constrain(min, 0, width);
        max = Lib.constrain(max, 0, width);

        if(max < min) {
            var temp = max;
            max = min;
            min = temp;
        }

        Helpers.setAttributes(slider, {
            'data-min': min,
            'data-max': max
        });

        Helpers.setAttributes(slideBox, {
            'x': min,
            'width': max - min
        });

        Helpers.setAttributes(maskMin, { 'width': min });
        Helpers.setAttributes(maskMax, {
            'x': max,
            'width': width - max
        });

        Helpers.setAttributes(grabberMin, { 'transform': 'translate(' + (min - 2) + ')' });
        Helpers.setAttributes(grabberMax, { 'transform': 'translate(' + max + ')' });

        // call to set range on plot here
    }

    var rangePlot = makeScatterLines(gd, width, height);

    Helpers.appendChildren(slider, [
        rangePlot,
        sliderBg,
        maskMin,
        maskMax,
        slideBox,
        grabberMin,
        grabberMax
    ]);

    var infoLayer = gd._fullLayout._infolayer;
    infoLayer.selectAll('g.range-slider')
        .data([0])
    .enter().append(function() {
        return slider;
    });
};

// var Lib = require('../../lib');

'use strict';
var Lib = {
    constrain: function(v, v0, v1) {
        if(v0 > v1) return Math.max(v1, Math.min(v0, v));
        return Math.max(v0, Math.min(v1, v));
    }
};

// Mock traces
var traces = [
  { name: 'trace1', color: 'blue', x: [], y: [] },
  { name: 'trace2', color: 'green', x: [], y: [] },
  { name: 'trace3', color: 'red', x: [], y: [] }
];

traces = traces.map(function(trace){

    for(var i = 0; i < 100; i++){
        var lastY = trace.y[i] ? trace.y[i - 1] : 0;
        trace.x[i] = i;
        trace.y[i] = lastY - 8 * (lastY/100 - Math.random());
    }

    return trace;
});

var width = 480;
var height = 60;

var svg = document.getElementById('svg');


function makeLine(traces, minStart, maxStart){

    var svgNS = 'http://www.w3.org/2000/svg';

    var slider = document.createElementNS(svgNS, 'g');
    setAttributes(slider, {
        'class': 'range-slider',
        'data-min': minStart,
        'data-max': maxStart
    });

    var sliderBg = document.createElementNS(svgNS, 'rect');
    setAttributes(sliderBg, {
        'fill': 'transparent',
        'stroke': 'black',
        'height': height,
        'width': width,
        'shape-rendering': 'crispEdges'
    });

    var maskMin = document.createElementNS(svgNS, 'rect');
    setAttributes(maskMin, {
        'x': 0,
        'width': minStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.25)'
    });

    var maskMax = document.createElementNS(svgNS, 'rect');
    setAttributes(maskMax, {
        'x': maxStart,
        'width': width - maxStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.25)'
    });

    var grabberMin = document.createElementNS(svgNS, 'g');
    var grabAreaMin = document.createElementNS(svgNS, 'rect');
    var handleMin = document.createElementNS(svgNS, 'rect');
    setAttributes(grabberMin, { 'transform': 'translate(' + (minStart - 2) + ')' });
    setAttributes(grabAreaMin, {
        'width': 10,
        'height': height,
        'x': -4,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    setAttributes(handleMin, {
        'width': 2,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    appendChildren(grabberMin, [handleMin, grabAreaMin]);

    var grabberMax = document.createElementNS(svgNS, 'g');
    var grabAreaMax = document.createElementNS(svgNS, 'rect');
    var handleMax = document.createElementNS(svgNS, 'rect');
    setAttributes(grabberMax, { 'transform': 'translate(' + maxStart + ')' });
    setAttributes(grabAreaMax, {
        'width': 10,
        'height': height,
        'x': -4,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });
    setAttributes(handleMax, {
        'width': 2,
        'height': height / 2,
        'y': height / 4,
        'rx': 1,
        'fill': 'white',
        'stroke': '#666',
        'shape-rendering': 'crispEdges'
    });
    appendChildren(grabberMax, [handleMax, grabAreaMax]);

    var slideBox = document.createElementNS(svgNS, 'rect');
    setAttributes(slideBox, {
        'x': minStart,
        'width': maxStart - minStart,
        'height': height,
        'cursor': 'ew-resize',
        'fill': 'transparent'
    });

    slider.addEventListener('mousedown', function(event){
        var startX = event.clientX,
            offsetX = event.offsetX,
            target = event.target,
            minVal = slider.getAttribute('data-min'),
            maxVal = slider.getAttribute('data-max');

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);

        function mouseMove(e){
            var delta = +e.clientX - startX;

            switch(target){
                case slideBox:
                    document.body.style.cursor = 'ew-resize';
                    setRange(+maxVal + delta, +minVal + delta);
                    break;

                case grabAreaMin:
                    document.body.style.cursor = 'col-resize';
                    setRange(+minVal + delta, +maxVal);
                    break;

                case grabAreaMax:
                    document.body.style.cursor = 'col-resize';
                    setRange(+minVal, +maxVal + delta);
                    break;

                default:
                    document.body.style.cursor = 'ew-resize';
                    setRange(offsetX, offsetX + delta);
                    break;
            }
        }

        function mouseUp(){
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            document.body.style.cursor = 'auto';
        }
    });


    function setRange(min, max) {

        min = Lib.constrain(min, 0, width);
        max = Lib.constrain(max, 0, width);

        if(max < min){
            var temp = max;
            max = min;
            min = temp;
        }

        setAttributes(slider, {
            'data-min': min,
            'data-max': max
        });

        setAttributes(slideBox, {
            'x': min,
            'width': max - min
        });

        setAttributes(maskMin, { 'width': min });
        setAttributes(maskMax, {
            'x': max,
            'width': width - max
        });

        setAttributes(grabberMin, { 'transform': 'translate(' + (min - 2) + ')' });
        setAttributes(grabberMax, { 'transform': 'translate(' + max + ')' });

        // call to set range on plot here
    }


    // dealing with the underlaying visual:
    // this should be swappable in the future
    // for scatter/heatmap/bar etc.
    for(var i = 0; i < traces.length; i++){
        var points = [],
            maxX, minX,
            maxY, minY;


        maxX = minX = traces[i].x[0];
        maxY = minY = traces[i].y[0];

        for(var j = 0; j < traces[i].x.length; j++){
            maxX = Math.max(maxX, traces[i].x[j]);
            minX = Math.min(minX, traces[i].x[j]);
            maxY = Math.max(maxY, traces[i].y[j]);
            minY = Math.min(minY, traces[i].y[j]);
        }

        for(var k = 0; k < traces[i].x.length; k++){
            var traceX = width * traces[i].x[k] / (maxX - minX),
                traceY = height * traces[i].y[k] / (maxY - minY) * 0.8;

            points.push(traceX + ',' + traceY);
        }

        var line = document.createElementNS(svgNS, 'polyline');
        setAttributes(line, {
            'points': points.join(' '),
            'fill': 'none',
            'stroke': ['blue', 'red', 'green'][i],
            'opacity': 0.5
        });

        slider.appendChild(line);
    }

    appendChildren(slider, [
        sliderBg,
        maskMin,
        maskMax,
        slideBox,
        grabberMin,
        grabberMax
    ]);

    svg.appendChild(slider);
}

function setAttributes(el, attrs){
    for(var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function appendChildren(el, children){
    for(var i = 0; i < children.length; i++){
        el.appendChild(children[i]);
    }
}

makeLine(traces, 100, 120);

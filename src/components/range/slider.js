// var Lib = require('../../lib');

'use strict';
var Lib = {
    constrain: function(v, v0, v1) {
        if(v0 > v1) return Math.max(v1, Math.min(v0, v));
        return Math.max(v0, Math.min(v1, v));
    }
};

// Mock things for jsbin
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
        'class': 'slider',
        'data-min': minStart,
        'data-max': maxStart
    });

    var sliderBg = document.createElementNS(svgNS, 'rect');
    setAttributes(sliderBg, {
        'stroke': 'black',
        'fill': 'transparent',
        'height': height,
        'width': width,
        'shape-rendering': 'crispEdges'
    });

    var maskMin = document.createElementNS(svgNS, 'rect');
    setAttributes(maskMin, {
        'x': 0,
        'width': minStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.1)'
    });

    var maskMax = document.createElementNS(svgNS, 'rect');
    setAttributes(maskMax, {
        'x': maxStart,
        'width': width - maxStart,
        'height': height,
        'fill': 'rgba(0,0,0,0.1)'
    });

    var handleMin = document.createElementNS(svgNS, 'rect');
    setAttributes(handleMin, {
        'class': 'handle-min',
        'width': 6,
        'x': 0,
        'height': height,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });

    var handleMax = document.createElementNS(svgNS, 'rect');
    setAttributes(handleMax, {
        'class': 'handle-max',
        'width': 6,
        'x': maxStart - 6,
        'height': height,
        'fill': 'transparent',
        'cursor': 'col-resize'
    });

    var slideBox = document.createElementNS(svgNS, 'rect');
    setAttributes(slideBox, {
        'class': 'slide-box',
        'x': minStart,
        'width': maxStart - minStart,
        'height': height,
        'cursor': 'ew-resize',
        'fill': 'transparent',
        'stroke': 'black',
        'shape-rendering': 'crispEdges'
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

                case handleMin:
                    document.body.style.cursor = 'col-resize';
                    setRange(+minVal + delta, +maxVal);
                    break;

                case handleMax:
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

        setAttributes(handleMin, { 'x': min });
        setAttributes(handleMax, { 'x': max - 6 });
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
        handleMin,
        handleMax
    ]);

    svg.appendChild(slider);
};

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

makeLine(traces, 0, 100);

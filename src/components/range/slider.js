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


function makeLine(traces){

    var svgNS = 'http://www.w3.org/2000/svg';

    var slider = document.createElementNS(svgNS, 'g');
    slider.setAttribute('class', 'slider');

    var sliderBg = document.createElementNS(svgNS, 'rect');
    sliderBg.setAttribute('stroke', 'black');
    sliderBg.setAttribute('fill', 'none');
    sliderBg.setAttribute('width', width);
    sliderBg.setAttribute('height', height);
    sliderBg.setAttribute('shape-rendering', 'crispEdges');

    var slide = document.createElementNS(svgNS, 'g');
    slide.setAttribute('data-min', 0);
    slide.setAttribute('data-max', 100);

    var slideHandleLeft = document.createElementNS(svgNS, 'rect');
    slideHandleLeft.setAttribute('class', 'handle-min');
    slideHandleLeft.setAttribute('width', 8);
    slideHandleLeft.setAttribute('x', -4);
    slideHandleLeft.setAttribute('height', height);
    slideHandleLeft.setAttribute('fill', 'transparent');
    slideHandleLeft.setAttribute('cursor', 'col-resize');

    var slideHandleMax = document.createElementNS(svgNS, 'rect');
    slideHandleMax.setAttribute('class', 'handle-max');
    slideHandleMax.setAttribute('width', 8);
    slideHandleMax.setAttribute('x', 100 - 4);
    slideHandleMax.setAttribute('height', height);
    slideHandleMax.setAttribute('fill', 'transparent');
    slideHandleMax.setAttribute('cursor', 'col-resize');

    var slideBox = document.createElementNS(svgNS, 'rect');
    slideBox.setAttribute('class', 'slide-box');
    slideBox.setAttribute('width', 100);
    slideBox.setAttribute('height', height);
    slideBox.setAttribute('x', 0);
    slideBox.setAttribute('fill', 'rgba(0,0,0,0.1)');
    slideBox.setAttribute('stroke', '#888');
    slideBox.setAttribute('class', 'slide-box');
    slideBox.setAttribute('cursor', 'ew-resize');


    slide.addEventListener('mousedown', function(event){
        var startX = event.x,
            target = event.target,
            rangeMin = slide.getAttribute('data-min'),
            rangeMax = slide.getAttribute('data-max');

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);

        function mouseMove(e){
            var offset = e.x - startX,
                max, min;

            if(event.target.className.baseVal === 'slide-box'){
                // dragging the whole box
                document.body.style.cursor = 'ew-resize';
                min = +rangeMin + offset;
                max = +rangeMax + offset;
                setRange(min, max);
            }else{
                // changing the bounds
                document.body.style.cursor = 'col-resize';

                if(target === slideHandleLeft){
                    var newMin = +rangeMin + offset;

                    if(+rangeMin + offset < rangeMax){
                        min = Math.max(0, newMin);
                        max = rangeMax;
                    }else{
                        min = rangeMax;
                        max = Math.max(0, newMin);
                    }
                } else {
                    var newMax = +rangeMax + offset;

                    if(+rangeMax + offset > rangeMin){
                        min = rangeMin;
                        max = Math.min(width, newMax);
                    }else{
                        min = Math.min(width, newMax);
                        max = rangeMin;
                    }
                }

                setRange(min, max);
            }
        }

        function mouseUp(){
            // return the new ranges to whoever needs it?

            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
            document.body.style.cursor = 'auto';
        }
    });


    function setRange(min, max){

        if(min < 0){
            min = 0;
            max = max - min;
        }else if(max > width){
            max = width;
            min = min - (max - width);
        }

        min = Lib.constrain(min, 0, width);
        max = Lib.constrain(max, 0, width);

        var slideWidth = Math.abs(max - min);

        slide.setAttribute('transform', 'translate(' + min + ')');
        slide.setAttribute('data-min', min);
        slide.setAttribute('data-max', max);

        slideHandleMax.setAttribute('x', slideWidth - 4);

        slideBox.setAttribute('width', slideWidth);
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
        line.setAttribute('points', points.join(' '));
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', ['blue', 'red', 'green'][i]);
        line.setAttribute('opacity', 0.5);

        slider.appendChild(line);
    }


    slide.appendChild(slideBox);
    slide.appendChild(slideHandleLeft);
    slide.appendChild(slideHandleMax);

    slider.appendChild(sliderBg);
    slider.appendChild(slide);
    svg.appendChild(slider);
}

makeLine(traces);

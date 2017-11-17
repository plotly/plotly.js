/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var extendDeepAll = Lib.extendDeepAll;
var µ = module.exports = { version: '0.2.2' };
// The Legend is the "key" in the top right of the graph, displaying infomation on the various data on the graph
// Has the abbility to show and hide data for user ease
µ.Legend = function module() {
    var config = µ.Legend.defaultConfig();
    var dispatch = d3.dispatch('hover');
    function exports() {

        var legendConfig = config.legendConfig;
        var flattenData = flattenConfigElements(config, legendConfig);
        var data = setupData(flattenData, legendConfig);
        if(legendConfig.reverseOrder) data = data.reverse();
        var container = legendConfig.container;
        if(typeof container === 'string' || container.nodeName) container = d3.select(container);
        var colors = data.map(function(d) {
            return d.color;
        });
        var lineHeight = legendConfig.fontSize;
        // Is the data continuous ?
        var isContinuous = legendConfig.isContinuous === null ? typeof data[0] === 'number' : legendConfig.isContinuous;
        var height = isContinuous ? legendConfig.height : lineHeight * data.length;
        var legendContainerGroup = container.classed('legend-group', true);
        var svg = legendContainerGroup.selectAll('svg').data([ 0 ]);
        defineSVG(svg, height, lineHeight);
        var dataNumbered = d3.range(data.length);
        var colorScale = d3.scale[isContinuous ? 'linear' : 'ordinal']().domain(dataNumbered).range(colors);
        var dataScale = d3.scale[isContinuous ? 'linear' : 'ordinal']().domain(dataNumbered)[isContinuous ? 'range' : 'rangePoints']([ 0, height ]);
        // Gets the legend elements is the data is not continuous
        var results = continuousCheck(isContinuous, data, lineHeight, dataScale, colorScale, legendConfig, svg, colors);
        // Legend Elements
        var legendElement = results;
        // refine legendElement data
        var legendElementData = legendElement[0];
        var legendAxis = d3.svg.axis().scale(dataScale).orient('right');
        // Build Axis
        var axis = buildAxis(isContinuous, lineHeight, legendAxis, legendConfig, data, svg);
         // Extract legend objects
        var tickElements = axis[0][0].childNodes;
        // Build the click handler for the elements in the legend
        applyLegendClickHandler(tickElements, legendElementData, legendConfig, colorScale);
        // Default text colour
        applyDefaultTextColour(tickElements, legendConfig);
        return exports;
    }

    exports.config = function(_x) {
        if(!arguments.length) return config;
        extendDeepAll(config, _x);
        return this;
    };
    d3.rebind(exports, dispatch, 'on');
    return exports;
};
// Takes in config data and output elements
// Extracts legend elements from config
function flattenConfigElements(config, legendConfig) {
    return config.data.map(function(d, i) {
        return [].concat(d).map(function(dB, iB) {
            var element = extendDeepAll({}, legendConfig.elements[i]);
            element.name = dB;
            element.color = [].concat(legendConfig.elements[i].color)[iB];
            return element;
        });
    });
}
// Obtains Line data, containing colour and data labels
function setupData(flattenData, legendConfig) {
    var data = d3.merge(flattenData);
    data = data.filter(function(d, i) {
        return legendConfig.elements[i] && (legendConfig.elements[i].visibleInLegend || typeof legendConfig.elements[i].visibleInLegend === 'undefined');
    });
    return data;
}
// Creates skeleton to hold legend
function defineSVG(svg, height, lineHeight) {
    var svgEnter = svg.enter().append('svg').attr({
        width: 300,
        height: height + lineHeight,
        xmlns: 'http://www.w3.org/2000/svg',
        'xmlns:xlink': 'http://www.w3.org/1999/xlink',
        version: '1.1'
    });
    svgEnter.append('g').classed('legend-axis', true);
    svgEnter.append('g').classed('legend-marks', true);
    return svg;
}

function shapeGenerator(_type, _size) {
    var squareSize = _size * 3;
    if(_type === 'line') {
        return 'M' + [ [ -_size / 2, -_size / 12 ], [ _size / 2, -_size / 12 ], [ _size / 2, _size / 12 ], [ -_size / 2, _size / 12 ] ] + 'Z';
    } else if(d3.svg.symbolTypes.indexOf(_type) !== -1) return d3.svg.symbol().type(_type).size(squareSize)(); else return d3.svg.symbol().type('square').size(squareSize)();
}
// Returns legend elements if the data is not continuous; otherwise attempts to handle it
function continuousCheck(isContinuous, data, lineHeight, dataScale, colorScale, legendConfig, svg, colors) {
    var legendElement = '';
    if(isContinuous) {
        handleContinousData(legendConfig, svg, colors);
    } else {
        legendElement = handleNonContinousData(isContinuous, data, lineHeight, dataScale, colorScale, svg);
    }
    return legendElement;
}
// Takes in legend config and infomation on the data on the axis
// Creates the axis for legend data
function buildAxis(isContinuous, lineHeight, legendAxis, legendConfig, data, svg) {
    var axis = svg.select('g.legend-axis').attr({
        transform: 'translate(' + [ isContinuous ? legendConfig.colorBandWidth : lineHeight, lineHeight / 2 ] + ')'
    }).call(legendAxis);
    axis.selectAll('.domain').style({
        fill: 'none',
        stroke: 'none'
    });
    axis.selectAll('line').style({
        fill: 'none',
        stroke: isContinuous ? legendConfig.textColor : 'none'
    });
    axis.selectAll('text').style({
        fill: legendConfig.textColor,
        'font-size': legendConfig.fontSize
    }).text(function(d, i) {
        return data[i].name;
    });
    return axis;
}
// Takes in the legend data
// Loops through each data type, applys and on click handler to each.
// Handler hides/shows the corrosponding line data
function applyLegendClickHandler(tickElements, legends, legendConfig, colorScale) {
    for(var i = 0, n = tickElements.length; i < n - 1; i++) {
        var el = tickElements[i];
        var key = legends[i];
        // Listener for the text
        el.addEventListener('click', (function(i, el) {return function() {
            var li = document.getElementsByClassName('line');
            // var li = document.querySelectorAll('path[class^="line"]');
            if(el.childNodes[1].style.fill === legendConfig.textColor) {
                el.childNodes[1].style.fill = 'black';
                legends[i].style.fill = 'black';
                li[i].style.display = 'none';
            } else {
                li[i].style.display = 'block';
                el.childNodes[1].style.fill = legendConfig.textColor;
                legends[i].style.fill = colorScale(i);
            }
        };
        })(i, el), false);
        // Listener for the legend
        key.addEventListener('click', (function(i, el) {return function() {
            if(el.childNodes[1].style.fill === legendConfig.textColor) {
                el.childNodes[1].style.fill = 'black';
                legends[i].style.fill = 'black';
            } else {
                el.childNodes[1].style.fill = legendConfig.textColor;
                legends[i].style.fill = colorScale(i);
            }
        };
        })(i, el), false);
    }
}
// Applys the default text colour, mainly used to pass pixel comparison tests
function applyDefaultTextColour(tickElements, legendConfig) {
    for(var j = 0, m = tickElements.length; j < m - 1; j++) {
        var e2 = tickElements[j];
        e2.childNodes[1].style.fill = legendConfig.textColor;
    }
}
// Deals with the lack of legend elements
function handleContinousData(legendConfig, svg, colors) {
    var gradient = svg.select('.legend-marks').append('defs').append('linearGradient').attr({
        id: 'grad1',
        x1: '0%',
        y1: '0%',
        x2: '0%',
        y2: '100%'
    }).selectAll('stop').data(colors);
    gradient.enter().append('stop');
    gradient.attr({
        offset: function(d, i) {
            return i / (colors.length - 1) * 100 + '%';
        }
    }).style({
        'stop-color': function(d) {
            return d;
        }
    });
    svg.append('rect').classed('legend-mark', true).attr({
        height: legendConfig.height,
        width: legendConfig.colorBandWidth,
        fill: 'url(#grad1)'
    });
}
// Creates Legend Elements if the data is continous
function handleNonContinousData(isContinuous, data, lineHeight, dataScale, colorScale, svg) {
    var legendElement = svg.select('.legend-marks').selectAll('path.legend-mark').data(data);
    legendElement.enter().append('path').classed('legend-mark', true);
    legendElement.attr({
        transform: function(d, i) {
            return 'translate(' + [ lineHeight / 2, dataScale(i) + lineHeight / 2 ] + ')';
        },
        d: function(d) {
            var symbolType = d.symbol;
            return shapeGenerator(symbolType, lineHeight);
        },
        fill: function(d, i) {
            return colorScale(i);
        }
    });
    legendElement.exit().remove();
    return legendElement;
}
module.exports.Legend = µ.Legend;

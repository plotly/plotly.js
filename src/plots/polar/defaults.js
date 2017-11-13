/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';
var d3 = require('d3');
var defaultConfig = function defaultConfig() {
    var config = {
        data: [ {
            t: [ 1, 2, 3, 4 ],
            r: [ 10, 11, 12, 13 ],
            name: 'Line1',
            geometry: 'LinePlot',
            color: null,
            strokeDash: 'solid',
            strokeColor: null,
            strokeSize: '1',
            visibleInLegend: true,
            opacity: 1
        } ],
        layout: {
            defaultColorRange: d3.scale.category10().range(),
            title: null,
            height: 450,
            width: 500,
            margin: {
                top: 40,
                right: 40,
                bottom: 40,
                left: 40
            },
            font: {
                size: 12,
                color: 'gray',
                outlineColor: 'white',
                family: 'Tahoma, sans-serif'
            },
            direction: 'clockwise',
            orientation: 0,
            labelOffset: 10,
            radialAxis: {
                domain: null,
                orientation: -45,
                ticksSuffix: '',
                visible: true,
                gridLinesVisible: true,
                tickOrientation: 'horizontal',
                rewriteTicks: null
            },
            angularAxis: {
                domain: [ 0, 360 ],
                ticksSuffix: '',
                visible: true,
                gridLinesVisible: true,
                labelsVisible: true,
                tickOrientation: 'horizontal',
                rewriteTicks: null,
                ticksCount: null,
                ticksStep: null
            },
            minorTicks: 0,
            tickLength: null,
            tickColor: 'silver',
            minorTickColor: '#eee',
            backgroundColor: 'none',
            needsEndSpacing: null,
            showLegend: true,
            legend: {
                reverseOrder: false
            },
            opacity: 1
        }
    };
    return config;
};
var polyChartDefaultConfig = function polyChartDefaultConfig() {
    var config = {
        data: {
            name: 'geom1',
            t: [ [ 1, 2, 3, 4 ] ],
            r: [ [ 1, 2, 3, 4 ] ],
            dotType: 'circle',
            dotSize: 64,
            dotVisible: false,
            barWidth: 20,
            color: '#ffa500',
            strokeSize: 1,
            strokeColor: 'silver',
            strokeDash: 'solid',
            opacity: 1,
            index: 0,
            visible: true,
            visibleInLegend: true
        },
        geometryConfig: {
            geometry: 'LinePlot',
            geometryType: 'arc',
            direction: 'clockwise',
            orientation: 0,
            container: 'body',
            radialScale: null,
            angularScale: null,
            colorScale: d3.scale.category20()
        }
    };
    return config;
};
var barChartDefaultConfig = function barChartDefaultConfig() {
    var config = {
        geometryConfig: {
            geometryType: 'bar'
        }
    };
    return config;
};

var dotPlotDefaultConfig = function dotPlotDefaultConfig() {
    var config = {
        geometryConfig: {
            geometryType: 'dot',
            dotType: 'circle'
        }
    };
    return config;
};

var linePlotDefaultConfig = function linePlotDefaultConfig() {
    var config = {
        geometryConfig: {
            geometryType: 'line'
        }
    };
    return config;
};

var legendDefaultConfig = function legendDefaultConfig() {
    var config = {
        data: [ 'a'],
        legendConfig: {
            elements: [ {
                symbol: 'line',
                color: 'red'
            }, ],
            height: 150,
            colorBandWidth: 30,
            fontSize: 12,
            container: 'body',
            isContinuous: null,
            textColor: 'grey',
            reverseOrder: false
        }
    };
    return config;
};
module.exports.defaultConfig = defaultConfig;
module.exports.polyChartDefaultConfig = polyChartDefaultConfig;
module.exports.barChartDefaultConfig = barChartDefaultConfig;
module.exports.dotPlotDefaultConfig = dotPlotDefaultConfig;
module.exports.linePlotDefaultConfig = linePlotDefaultConfig;
module.exports.legendDefaultConfig = legendDefaultConfig;

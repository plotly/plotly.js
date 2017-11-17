/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


var d3 = require('d3');
var Lib = require('../../lib');
var defaults = require('./defaults');
var utility = require('./utility');
var tooltip= require('./tooltip');
var legend= require('./legend');
var extendDeepAll = Lib.extendDeepAll;
var MID_SHIFT = require('../../constants/alignment').MID_SHIFT;
var µ = module.exports = { version: '0.2.2' };
// Render the Polar Plot
µ.Axis = function module(){
    var config = {data: [],layout: {}}, inputConfig = {}, liveConfig = {};
    var svg, container, dispatch = d3.dispatch('hover'), radialScale, angularScale;
    var exports = {};

    function render(_container,scaler) {
        container = _container || container;
        var data = config.data;
        var axisConfig = config.layout;
        //Remove old legend if there is one
        var x = document.getElementsByClassName("legend-group")[0];
        if(x != undefined){
            if(x.childNodes.length>0){
                x.removeChild(x.childNodes[0]);  
            } 
        }
        // Set container if container isnt set right ?
        if (typeof container == 'string' || container.nodeName) container = d3.select(container);
        container.datum(data).each(function(_data, _index) {
            var dataOriginal = _data.slice();
            liveConfig = {data: utility.cloneJson(dataOriginal),layout: utility.cloneJson(axisConfig)};
            // Adds lines between data (areas)
            dataOriginal = addSegementDividers(dataOriginal,axisConfig,liveConfig);
            // Get Data - not sure what this is doing
            var data = dataOriginal.filter(function(d, i) {
                var visible = d.visible;
                return typeof visible === 'undefined' || visible === true;
            });
            // Check for stacked data 
            result  = isStackedCheck(data,axisConfig);
            isStacked = result[0];
            radius = result[1];
            chartCenter = result[2];
            dataWithGroupId = result[3];
            extent = result[4];

            if (axisConfig.radialAxis.domain != µ.DATAEXTENT) extent[0] = 0;
            radialScale = d3.scale.linear().domain(axisConfig.radialAxis.domain != µ.DATAEXTENT && axisConfig.radialAxis.domain ? axisConfig.radialAxis.domain : extent).range([0, radius ]);
            liveConfig.layout.radialAxis.domain = radialScale.domain();
            var angularDataMerged = utility.flattenArray(data.map(function(d, i) {
                return d.t;
            }));
            
            // Builds some data based on if the plot is ordinal
            result = isOrdinalCheckOne(angularDataMerged,data,isStacked);
            data = result[0];
            ticks = result[1];

            angularDataMerged = result[2];
            isOrdinal = result[3];
            // More variable setup
            var hasOnlyLineOrDotPlot = data.filter(function(d, i) {
                return d.geometry === 'LinePlot' || d.geometry === 'DotPlot';
            }).length === data.length;

            var needsEndSpacing = axisConfig.needsEndSpacing === null ? isOrdinal || !hasOnlyLineOrDotPlot : axisConfig.needsEndSpacing;
            var useProvidedDomain = axisConfig.angularAxis.domain && axisConfig.angularAxis.domain != µ.DATAEXTENT && !isOrdinal && axisConfig.angularAxis.domain[0] >= 0;
            var angularDomain = useProvidedDomain ? axisConfig.angularAxis.domain : d3.extent(angularDataMerged);
            var angularDomainStep = Math.abs(angularDataMerged[1] - angularDataMerged[0]);

            if (hasOnlyLineOrDotPlot && !isOrdinal) angularDomainStep = 0;
            var angularDomainWithPadding = angularDomain.slice();
            if (needsEndSpacing && isOrdinal) angularDomainWithPadding[1] += angularDomainStep;
            var tickCount = axisConfig.angularAxis.ticksCount || 4;
            if (tickCount > 8) tickCount = tickCount / (tickCount / 8) + tickCount % 8;
            if (axisConfig.angularAxis.ticksStep) {
                tickCount = (angularDomainWithPadding[1] - angularDomainWithPadding[0]) / tickCount;
            }

            var angularTicksStep = axisConfig.angularAxis.ticksStep || (angularDomainWithPadding[1] - angularDomainWithPadding[0]) / (tickCount * (axisConfig.minorTicks + 1));
            if (ticks) angularTicksStep = Math.max(Math.round(angularTicksStep), 1);
            if (!angularDomainWithPadding[2]) angularDomainWithPadding[2] = angularTicksStep;
            var angularAxisRange = d3.range.apply(this, angularDomainWithPadding);
            angularAxisRange = angularAxisRange.map(function(d, i) {
                return parseFloat(d.toPrecision(12));
            });

            angularScale = d3.scale.linear().domain(angularDomainWithPadding.slice(0, 2)).range(axisConfig.direction === 'clockwise' ? [ 0, 360 ] : [ 360, 0 ]);
            liveConfig.layout.angularAxis.domain = angularScale.domain();
            liveConfig.layout.angularAxis.endPadding = needsEndSpacing ? angularDomainStep : 0;

            // Create svg
            svg = createSVG(this,d3);         
            var lineStyle = {fill: 'none',stroke: axisConfig.tickColor};
            // Get font Style, for the title and axis
            styles = buildFontStyle(axisConfig)
            fontStyle  = styles[0];
            titleStyle = styles[1];
            // Builds the legend, returning the container and the bounding box, returns changes
            legendData = buildLegend(axisConfig,svg,radius,data,radialScale,liveConfig);
            legendBBox = legendData[0];
            legendContainer = legendData[1];
            liveConfig = legendData[2];
            radius = legendData[3];
            chartCenterBuffer = legendData[4];
            // check return makes sense
            if(typeof chartCenterBuffer !== "undefined"){
                chartCenter = chartCenterBuffer
            }
            var chartGroup = svg.select('.chart-group');
            // Set Svg Attributes

            svgData = assignSvgAttributes(svg,axisConfig,legendBBox,radius,chartGroup,chartCenter);
            svg = svgData[0];
            centeringOffset = svgData[1];
            // Create the radial Axis
            radialAxisData = createRadialAxis(svg,axisConfig,radialScale,lineStyle,radius,data);
            //console.log(radialScale.ticks(5));
            radialAxis = radialAxisData[0];
            backgroundCircle = radialAxisData[1];
            // Could this be moved?
            function currentAngle(d, i) {
                return angularScale(d) % 360 + axisConfig.orientation;
            }
            // angularAxis
            var angularAxis = svg.select('.angular.axis-group').selectAll('g.angular-tick').data(angularAxisRange);
            var angularAxisEnter = angularAxis.enter().append('g').classed('angular-tick', true);
            angularAxis = assignAngularAxisAttributes(angularAxis,currentAngle,axisConfig,angularAxisEnter,lineStyle,radius,ticks,chartGroup);

            // geometryContainer
            var hasGeometry = svg.select('g.geometry-group').selectAll('g').size() > 0;
            var geometryContainer = svg.select('g.geometry-group').selectAll('g.geometry').data(data);
            geometryContainer = assignGeometryContainerAttributes(geometryContainer,data,radialScale,angularScale,axisConfig,scaler,radialScale);
            var guides = svg.select('.guides-group');
            // Tooltips Creation
            var tooltipContainer = svg.select('.tooltips-group');
            // Displays Degree's Value
            var angularTooltip = tooltip.tooltipPanel().config({
                container: tooltipContainer,
                fontSize: 8
            })();
            // Displays Distance Value
            var radialTooltip = tooltip.tooltipPanel().config({
                container: tooltipContainer,
                fontSize: 8
            })();

            var geometryTooltip = tooltip.tooltipPanel().config({
                container: tooltipContainer,
                hasTick: true
            })();

            var angularValue, radialValue;
            isOrdinalCheckTwo(isOrdinal,guides,chartGroup,radius,axisConfig,angularScale,angularTooltip,chartCenter)

            var angularGuideCircle = guides.select('circle').style({
                stroke: 'grey',
                fill: 'none'
            });
            // outer ring display
            chartGroup =  outerRingValueDisplay(chartGroup,radius,radialTooltip,angularGuideCircle,radialScale,axisConfig,chartCenter,geometryTooltip,angularTooltip);
            // Displays box with result values in
            svgMouserHoverDisplay(isOrdinal,geometryTooltip,ticks,data);
        });
        return exports;
    }

    exports.render = function(_container,scaler) {
        render(_container,scaler);
        return this;
    };
    
    exports.config = function(_x) {
        if (!arguments.length) return config;

        var xClone = utility.cloneJson(_x);
        xClone.data.forEach(function(d, i) {
            if (!config.data[i]) config.data[i] = {};
            extendDeepAll(config.data[i], µ.Axis.defaultConfig().data[0]);
            extendDeepAll(config.data[i], d);
        });
        extendDeepAll(config.layout, µ.Axis.defaultConfig().layout);
        extendDeepAll(config.layout, xClone.layout);
        return this;
    };
    exports.getLiveConfig = function() {
        return liveConfig;
    };
    exports.getinputConfig = function() {
        return inputConfig;
    };
    exports.radialScale = function(_x) {
        return radialScale;
    };
    exports.angularScale = function(_x) {
        return angularScale;
    };
    exports.svg = function() {
        return svg;
    };
    d3.rebind(exports, dispatch, 'on');
    
    return exports;
};

µ.Axis.defaultConfig = function(d, i) {
    var config = defaults.defaultConfig();
    return config;
};

µ.DATAEXTENT = 'dataExtent';

µ.AREA = 'AreaChart';

µ.LINE = 'LinePlot';

µ.DOT = 'DotPlot';

µ.BAR = 'BarChart';

µ.PolyChart = function module() {
    var config = [ µ.PolyChart.defaultConfig() ];
    var dispatch = d3.dispatch('hover');
    var dashArray = {
        solid: 'none',
        dash: [ 5, 2 ],
        dot: [ 2, 5 ]
    };
    var colorScale;
    function exports() {
        var geometryConfig = config[0].geometryConfig;
        var container = geometryConfig.container;
        if (typeof container == 'string') container = d3.select(container);
        container.datum(config).each(function(_config, _index) {
            var isStack = !!_config[0].data.yStack;
            var data = _config.map(function(d, i) {
                if (isStack) return d3.zip(d.data.t[0], d.data.r[0], d.data.yStack[0]); else return d3.zip(d.data.t[0], d.data.r[0]);
            });
            var angularScale = geometryConfig.angularScale;
            var domainMin = geometryConfig.radialScale.domain()[0];
            var generator = {};
            generator.bar = function(d, i, pI) {
                var dataConfig = _config[pI].data;
                var h = geometryConfig.radialScale(d[1]) - geometryConfig.radialScale(0);
                var stackTop = geometryConfig.radialScale(d[2] || 0);
                var w = dataConfig.barWidth;
                d3.select(this).attr({
                    'class': 'mark bar',
                    d: 'M' + [ [ h + stackTop, -w / 2 ], [ h + stackTop, w / 2 ], [ stackTop, w / 2 ], [ stackTop, -w / 2 ] ].join('L') + 'Z',
                    transform: function(d, i) {
                        return 'rotate(' + (geometryConfig.orientation + angularScale(d[0])) + ')';
                    }
                });
            };
            generator.dot = function(d, i, pI) {
                var stackedData = d[2] ? [ d[0], d[1] + d[2] ] : d;
                var symbol = d3.svg.symbol().size(_config[pI].data.dotSize).type(_config[pI].data.dotType)(d, i);
                d3.select(this).attr({
                    'class': 'mark dot',
                    d: symbol,
                    transform: function(d, i) {
                        //console.log(stackedData);
                        var coord = convertToCartesian(getPolarCoordinates(stackedData,0));
                        
                        return 'translate(' + [ coord.x, coord.y ] + ')';
                    }
                });
            };
            //console.log("hey");
            //console.log(getPolarCoordinates([360,-1]));
            //console.log(convertToCartesian(getPolarCoordinates([360,1],360)));
            var line = d3.svg.line.radial().interpolate(_config[0].data.lineInterpolation).radius(function(d) {
                return geometryConfig.radialScale(d[1]);
            }).angle(function(d) {
                return geometryConfig.angularScale(d[0]) * Math.PI / 180;
            });
            generator.line = function(d, i, pI) {
                var lineData = d[2] ? data[pI].map(function(d, i) {
                    return [ d[0], d[1] + d[2] ];
                }) : data[pI];
                d3.select(this).each(generator['dot']).style({
                    opacity: function(dB, iB) {
                        return +_config[pI].data.dotVisible;
                    },
                    fill: markStyle.stroke(d, i, pI)
                }).attr({
                    'class': 'mark dot'
                });
                if (i > 0) return;
                //for(var counter = 0;counter < lineData.length-1;counter++){
                    var lineSelection = d3.select(this.parentNode).selectAll('path.line').data([ 0 ]);
                    lineSelection.enter().insert('path');
                    lineSelection.attr({
                        'class': 'line',
                        //d: line([lineData[counter],lineData[counter+1]]),
                        d: line(lineData),
                        transform: function(dB, iB) {
                            return 'rotate(' + (geometryConfig.orientation + 90) + ')';
                        },
                        'pointer-events': 'none'
                    }).style({
                        fill: function(dB, iB) {
                            return markStyle.fill(d, i, pI);
                        },
                        'fill-opacity': 0,
                        stroke: function(dB, iB) {
                            return markStyle.stroke(d, i, pI);
                        },
                        'stroke-width': function(dB, iB) {
                            return markStyle['stroke-width'](d, i, pI);
                        },
                        'stroke-dasharray': function(dB, iB) {
                            return markStyle['stroke-dasharray'](d, i, pI);
                        },
                        opacity: function(dB, iB) {
                            return markStyle.opacity(d, i, pI);
                        },
                        display: function(dB, iB) {
                            return markStyle.display(d, i, pI);
                        }
                    });
                    //console.log(counter)
                //}
            };
            var angularRange = geometryConfig.angularScale.range();
            var triangleAngle = Math.abs(angularRange[1] - angularRange[0]) / data[0].length * Math.PI / 180;
            var arc = d3.svg.arc().startAngle(function(d) {
                return -triangleAngle / 2;
            }).endAngle(function(d) {
                return triangleAngle / 2;
            }).innerRadius(function(d) {
                return geometryConfig.radialScale(domainMin + (d[2] || 0));
            }).outerRadius(function(d) {
                return geometryConfig.radialScale(domainMin + (d[2] || 0)) + geometryConfig.radialScale(d[1]);
            });
            generator.arc = function(d, i, pI) {
                d3.select(this).attr({
                    'class': 'mark arc',
                    d: arc,
                    transform: function(d, i) {
                        return 'rotate(' + (geometryConfig.orientation + angularScale(d[0]) + 90) + ')';
                    }
                });
            };
            var markStyle = {
                fill: function(d, i, pI) {
                    return _config[pI].data.color;
                },
                stroke: function(d, i, pI) {
                    return _config[pI].data.strokeColor;
                },
                'stroke-width': function(d, i, pI) {
                    return _config[pI].data.strokeSize + 'px';
                },
                'stroke-dasharray': function(d, i, pI) {
                    return dashArray[_config[pI].data.strokeDash];
                },
                opacity: function(d, i, pI) {
                    return _config[pI].data.opacity;
                },
                display: function(d, i, pI) {
                    return typeof _config[pI].data.visible === 'undefined' || _config[pI].data.visible ? 'block' : 'none';
                }
            };
            var geometryLayer = d3.select(this).selectAll('g.layer').data(data);
            geometryLayer.enter().append('g').attr({
                'class': 'layer'
            });
            var geometry = geometryLayer.selectAll('path.mark').data(function(d, i) {
                return d;
            });
            geometry.enter().append('path').attr({
                'class': 'mark'
            });
            geometry.style(markStyle).each(generator[geometryConfig.geometryType]);
            geometry.exit().remove();
            geometryLayer.exit().remove();
            function getPolarCoordinates(d, i) {
                var r = geometryConfig.radialScale(d[1]);
                var t = ((geometryConfig.angularScale(d[0]) + geometryConfig.orientation)) * Math.PI / 180;
                //console.log(r,t);
                return {
                    r: r,
                    t: t
                };
            }
            function convertToCartesian(polarCoordinates) {
                var x = polarCoordinates.r * Math.cos(polarCoordinates.t);
                var y = polarCoordinates.r * Math.sin(polarCoordinates.t);
                return {
                    x: x,
                    y: y
                };
            }
        });
    }
    exports.config = function(_x) {
        if (!arguments.length) return config;
        _x.forEach(function(d, i) {
            if (!config[i]) config[i] = {};
            extendDeepAll(config[i], µ.PolyChart.defaultConfig());
            extendDeepAll(config[i], d);
        });
        return this;
    };
    exports.getColorScale = function() {
        return colorScale;
    };
    d3.rebind(exports, dispatch, 'on');
    return exports;
};

µ.PolyChart.defaultConfig = function() {
    var config = defaults.polyChartDefaultConfig();
    return config;
};

µ.BarChart = function module() {
    return µ.PolyChart();
};

µ.BarChart.defaultConfig = function() {
    var config = {
        geometryConfig: {
            geometryType: 'bar'
        }
    };
    return config;
};

µ.AreaChart = function module() {
    return µ.PolyChart();
};

µ.AreaChart.defaultConfig = function() {
    var config = {
        geometryConfig: {
            geometryType: 'arc'
        }
    };
    return config;
};

µ.DotPlot = function module() {
    return µ.PolyChart();
};

µ.DotPlot.defaultConfig = function() {
    var config = defaults.dotPlotDefaultConfig();
    return config;
};

µ.LinePlot = function module() {
    return µ.PolyChart();
};

µ.LinePlot.defaultConfig = function() {
    var config = defaults.linePlotDefaultConfig();
    return config;
};

legend.Legend.defaultConfig = function(d, i) {
    var config = defaults.legendDefaultConfig();
    return config;
};
tooltip.tooltipPanel.uid = 1;

// Creation of Legend
function buildLegend(axisConfig,svg,radius,data,radialScale,liveConfig){
    var legendContainer;
    var legendBBox;
    var chartCenter;
    if (axisConfig.showLegend) {
        legendContainer = svg.select('.legend-group').attr({
            transform: 'translate(' + [ radius, axisConfig.margin.top ] + ')'
        }).style({
            display: 'block'
        });
        var elements = data.map(function(d, i) {
            var datumClone = utility.cloneJson(d);
            datumClone.symbol = d.geometry === 'DotPlot' ? d.dotType || 'circle' : d.geometry != 'LinePlot' ? 'square' : 'line';
            datumClone.visibleInLegend = typeof d.visibleInLegend === 'undefined' || d.visibleInLegend;
            datumClone.color = d.geometry === 'LinePlot' ? d.strokeColor : d.color;
            return datumClone;
        });

        legend.Legend().config({
            data: data.map(function(d, i) {
                return d.name || 'Element' + i;
            }),
            legendConfig: extendDeepAll({},
                legend.Legend.defaultConfig().legendConfig,
                {
                    container: legendContainer,
                    elements: elements,
                    reverseOrder: axisConfig.legend.reverseOrder
                }
            )
        })();

        legendBBox = legendContainer.node().getBBox();
        radius = Math.min(axisConfig.width - legendBBox.width - axisConfig.margin.left - axisConfig.margin.right, axisConfig.height - axisConfig.margin.top - axisConfig.margin.bottom) / 2;
        radius = Math.max(10, radius);
        chartCenter = [ axisConfig.margin.left + radius, axisConfig.margin.top + radius ];
        radialScale.range([ 0, radius ]);
        liveConfig.layout.radialAxis.domain = radialScale.domain();
        legendContainer.attr('transform', 'translate(' + [ chartCenter[0] + radius, chartCenter[1] - radius ] + ')');
    } else {
        legendContainer = svg.select('.legend-group').style({
            display: 'none'
        });
    }
    return [legendBBox,legendContainer,liveConfig,radius,chartCenter]
}

function buildFontStyle(axisConfig){
    var fontStyle = {
        'font-size': axisConfig.font.size,
        'font-family': axisConfig.font.family,
        fill: axisConfig.font.color,
        'text-shadow': [ '-1px 0px', '1px -1px', '-1px 1px', '1px 1px' ].map(function(d, i) {
            return ' ' + d + ' 0 ' + axisConfig.font.outlineColor;
        }).join(',')
    };
    // Added feature to alter the title, will use default font features if aspect is not found
    // Gets font size if possible#
    if(axisConfig.titlefont == undefined){
        var titleStyle = fontStyle;
    }else{
        try{
            var titleStyle = {'font-size': axisConfig.titlefont.size};
        } catch(err){
            var titleStyle = {'font-size': axisConfig.font.size};
        }
        // Gets font type
        try{
            titleStyle = Object.assign(titleStyle, {'font-family': axisConfig.titlefont.family});
        } catch(err){
            titleStyle = Object.assign(titleStyle, {'font-family': axisConfig.font.family});
        }
        // Get font colour
        try{
            titleStyle = Object.assign(titleStyle, {fill: axisConfig.titlefont.color});
        } catch(err){
            titleStyle = Object.assign(titleStyle, {fill: axisConfig.font.color});
        }
        // Get text shadow
        try{
            titleStyle = Object.assign(titleStyle, {'text-shadow': [ '-1px 0px', '1px -1px', '-1px 1px', '1px 1px' ].map(function(d, i) {return ' ' + d + ' 0 ' + axisConfig.font.outlineColor;}).join(',')});
        } catch(err){
            titleStyle = Object.assign(titleStyle, {'text-shadow': [ '-1px 0px', '1px -1px', '-1px 1px', '1px 1px' ].map(function(d, i) {return ' ' + d + ' 0 ' + axisConfig.font.outlineColor;}).join(',')});
        }
    }
    return [fontStyle,titleStyle]
}

function createSVG(self,d3){
    svg = d3.select(self).select('svg.chart-root');
    if (typeof svg === 'undefined' || svg.empty()) {
        var skeleton = "<svg xmlns='http://www.w3.org/2000/svg' class='chart-root'>' + '<g class='outer-group'>' + '<g class='chart-group'>' + '<circle class='background-circle'></circle>' + '<g class='geometry-group'></g>' + '<g class='radial axis-group'>' + '<circle class='outside-circle'></circle>' + '</g>' + '<g class='angular axis-group'></g>' + '<g class='guides-group'><line></line><circle r='0'></circle></g>' + '</g>' + '<g class='legend-group'></g>' + '<g class='tooltips-group'></g>' + '<g class='title-group'><text></text></g>' + '</g>' + '</svg>";
        var doc = new DOMParser().parseFromString(skeleton, 'application/xml');
        var newSvg = self.appendChild(self.ownerDocument.importNode(doc.documentElement, true));
        svg = d3.select(newSvg);
    }
    svg.select('.guides-group').style({
        'pointer-events': 'none'
    });
    svg.select('.angular.axis-group').style({
        'pointer-events': 'none'
    });
    svg.select('.radial.axis-group').style({
        'pointer-events': 'none'
    });
    return svg
}

function assignSvgAttributes(svg,axisConfig,legendBBox,radius,chartGroup,chartCenter){
    svg.attr({width: axisConfig.width,height: axisConfig.height}).style({opacity: axisConfig.opacity});
    chartGroup.attr('transform', 'translate(' + chartCenter + ')').style({cursor: 'crosshair'});
    var centeringOffset = [ (axisConfig.width - (axisConfig.margin.left + axisConfig.margin.right + radius * 2 + (legendBBox ? legendBBox.width : 0))) / 2, (axisConfig.height - (axisConfig.margin.top + axisConfig.margin.bottom + radius * 2)) / 2 ];
    centeringOffset[0] = Math.max(0, centeringOffset[0]);
    centeringOffset[1] = Math.max(0, centeringOffset[1]);
    svg.select('.outer-group').attr('transform', 'translate(' + centeringOffset + ')');
    if (axisConfig.title) {
        var title = svg.select('g.title-group text').style(titleStyle).text(axisConfig.title);
        var titleBBox = title.node().getBBox();
        title.attr({
            x: chartCenter[0] - titleBBox.width / 2,
            y: chartCenter[1] - radius - 20
        });
    }
    return [svg,centeringOffset]
    
}

function createRadialAxis(svg,axisConfig,radialScale,lineStyle,radius,plotData){
    var radialAxis = svg.select('.radial.axis-group');
    if (axisConfig.radialAxis.gridLinesVisible) {
        //console.log(plotData);
        //console.log(radialScale.ticks(10));
        //get heighest and lowest value
        highestVal = 0;
        lowestVal =0;
        for(var numberOfData = 0;numberOfData<plotData.length;numberOfData++){
            for(var counter = 0;counter<plotData[numberOfData].r[0].length;counter++){
                if(plotData[numberOfData].r[0][counter] > highestVal) {
                    highestVal = plotData[numberOfData].r[0][counter]; 
                }
                if(plotData[numberOfData].r[0][counter] < lowestVal) {
                    lowestVal = plotData[numberOfData].r[0][counter]; 
                }
            }
        }
        var steps = 5;
        var interval = (highestVal - lowestVal)/steps;
        var values = [lowestVal];
        for(var count = 1; count <= steps;count++){
            values.push(lowestVal+(interval*count));
        }
        //console.log(values);


        var gridCircles = radialAxis.selectAll('circle.grid-circle').data((radialScale).ticks(5));
        gridCircles.enter().append('circle').attr({
            'class': 'grid-circle'
        }).style(lineStyle);
        gridCircles.attr('r', radialScale);
        gridCircles.exit().remove();
    }

    radialAxis.select('circle.outside-circle').attr({
        r: radius
    }).style(lineStyle);
    var backgroundCircle = svg.select('circle.background-circle').attr({
        r: radius
    }).style({
        fill: axisConfig.backgroundColor,
        stroke: axisConfig.stroke
    });
    if (axisConfig.radialAxis.visible) {
        var axis = d3.svg.axis().scale(radialScale).ticks(5).tickSize(5);
        radialAxis.call(axis).attr({
            transform: 'rotate(' + axisConfig.radialAxis.orientation + ')'
        });
        radialAxis.selectAll('.domain').style(lineStyle);
        radialAxis.selectAll('g>text').text(function(d, i) {
            return this.textContent + axisConfig.radialAxis.ticksSuffix;
        }).style(fontStyle).style({
            'text-anchor': 'start'
        }).attr({
            x: 0,
            y: 0,
            dx: 0,
            dy: 0,
            transform: function(d, i) {
                if (axisConfig.radialAxis.tickOrientation === 'horizontal') {
                    return 'rotate(' + -axisConfig.radialAxis.orientation + ') translate(' + [ 0, fontStyle['font-size'] ] + ')';
                } else return 'translate(' + [ 0, fontStyle['font-size'] ] + ')';
            }
        });
        radialAxis.selectAll('g>line').style({
            stroke: 'black'
        });
    }
    return [radialAxis,backgroundCircle]
}

function assignAngularAxisAttributes(angularAxis,currentAngle,axisConfig,angularAxisEnter,lineStyle,radius,ticks,chartGroup){
    angularAxis.attr({transform: function(d, i) {
            return 'rotate(' + currentAngle(d, i) + ')';
        }
    }).style({
        display: axisConfig.angularAxis.visible ? 'block' : 'none'
    });

    angularAxis.exit().remove();

    angularAxisEnter.append('line').classed('grid-line', true).classed('major', function(d, i) {
        return i % (axisConfig.minorTicks + 1) == 0;
    }).classed('minor', function(d, i) {
        return !(i % (axisConfig.minorTicks + 1) == 0);
    }).style(lineStyle);

    angularAxisEnter.selectAll('.minor').style({stroke: axisConfig.minorTickColor});

    angularAxis.select('line.grid-line').attr({
        x1: axisConfig.tickLength ? radius - axisConfig.tickLength : 0,
        x2: radius
    }).style({
        display: axisConfig.angularAxis.gridLinesVisible ? 'block' : 'none'
    });

    angularAxisEnter.append('text').classed('axis-text', true).style(fontStyle);
    var ticksText = angularAxis.select('text.axis-text').attr({
        x: radius + axisConfig.labelOffset,
        dy: MID_SHIFT + 'em',
        transform: function(d, i) {
            var angle = currentAngle(d, i);
            var rad = radius + axisConfig.labelOffset;
            var orient = axisConfig.angularAxis.tickOrientation;
            if (orient == 'horizontal') return 'rotate(' + -angle + ' ' + rad + ' 0)'; else if (orient == 'radial') return angle < 270 && angle > 90 ? 'rotate(180 ' + rad + ' 0)' : null; else return 'rotate(' + (angle <= 180 && angle > 0 ? -90 : 90) + ' ' + rad + ' 0)';
        }
    }).style({
        'text-anchor': 'middle',
        display: axisConfig.angularAxis.labelsVisible ? 'block' : 'none'
    }).text(function(d, i) {
        if (i % (axisConfig.minorTicks + 1) != 0) return '';
        if (ticks) {
            return ticks[d] + axisConfig.angularAxis.ticksSuffix;
        } else return d + axisConfig.angularAxis.ticksSuffix;
    }).style(fontStyle);
    if (axisConfig.angularAxis.rewriteTicks) ticksText.text(function(d, i) {
        if (i % (axisConfig.minorTicks + 1) != 0) return '';
        return axisConfig.angularAxis.rewriteTicks(this.textContent, i);
    });

    var rightmostTickEndX = d3.max(chartGroup.selectAll('.angular-tick text')[0].map(function(d, i) {
        return d.getCTM().e + d.getBBox().width;
    }));

    legendContainer.attr({
        transform: 'translate(' + [ radius + rightmostTickEndX, axisConfig.margin.top ] + ')'
    });

    return angularAxis
}

function isOrdinalCheckOne(angularDataMerged,data,isStacked){
    var ticks;
    var isOrdinal = typeof angularDataMerged[0] === 'string';
    if (isOrdinal) {
        angularDataMerged = utility.deduplicate(angularDataMerged);
        ticks = angularDataMerged.slice();
        angularDataMerged = d3.range(angularDataMerged.length);
        data = data.map(function(d, i) {
            var result = d;
            d.t = [ angularDataMerged ];
            if (isStacked) result.yStack = d.yStack;
            return result;
        });
    }
    return [data,ticks,angularDataMerged,isOrdinal]
}

function isOrdinalCheckTwo(isOrdinal,guides,chartGroup,radius,axisConfig,angularScale,angularTooltip,chartCenter){
    if (!isOrdinal) {
        var angularGuideLine = guides.select('line').attr({
            x1: 0,
            y1: 0,
            y2: 0
        }).style({
            stroke: 'grey',
            'pointer-events': 'none'
        });
        chartGroup.on('mousemove.angular-guide', function(d, i) {
            var mouseAngle = utility.getMousePos(backgroundCircle).angle;
            angularGuideLine.attr({
                x2: -radius,
                transform: 'rotate(' + mouseAngle + ')'
            }).style({
                opacity: .5
            });
            var angleWithOriginOffset = (mouseAngle + 180 + 360 - axisConfig.orientation) % 360;
            angularValue = angularScale.invert(angleWithOriginOffset);
            var pos = utility.convertToCartesian(radius + 12, mouseAngle + 180);
            angularTooltip.text(utility.round(angularValue)).move([ pos[0] + chartCenter[0], pos[1] + chartCenter[1] ]);
        }).on('mouseout.angular-guide', function(d, i) {
            guides.select('line').style({
                opacity: 0
            });
        });
    }
    
}

function assignGeometryContainerAttributes(geometryContainer,data,radialScale,angularScale,axisConfig,scale,radialScale){

    //debugger;
    //console.log(data[0]);
    //console.log(data[0].r);
    var radialScaleValues = radialScale.ticks(5);
    //console.log(radialScaleValues);
    var getMaxVal = radialScaleValues[radialScaleValues.length -1 ];
    for(var numberOfData = 0;numberOfData<data.length;numberOfData++){
        
        rs = [];
        rt = [];
        for(var counter = 0;counter<data[numberOfData].r[0].length;counter++){
            //if(data[numberOfData].r[0][counter]*scale<= getMaxVal){
                rs.push(data[numberOfData].r[0][counter]*scale);
                rt.push(data[numberOfData].t[0][counter]);
            //}
        }
        data[numberOfData].r[0] = rs;
        data[numberOfData].t[0] = rt;
    }
    //console.log(rs);



    geometryContainer.enter().append('g').attr({
        'class': function(d, i) {
            return 'geometry geometry' + i;
        }
    });
    geometryContainer.exit().remove();
    if (data[0] || hasGeometry) {
        
        var geometryConfigs = [];
        data.forEach(function(d, i) {
            
            
            var geometryConfig = {};
            geometryConfig.radialScale = radialScale;
            geometryConfig.angularScale = angularScale;
            geometryConfig.container = geometryContainer.filter(function(dB, iB) {
                return iB == i;
            });
            geometryConfig.geometry = d.geometry;
            geometryConfig.orientation = axisConfig.orientation;
            geometryConfig.direction = axisConfig.direction;
            geometryConfig.index = i;
            geometryConfigs.push({
                data: d,
                geometryConfig: geometryConfig
            });
            //console.log(d);
            //console.log(geometryConfig);
            
        });
        var geometryConfigsGrouped = d3.nest().key(function(d, i) {
            return typeof d.data.groupId != 'undefined' || 'unstacked';
        }).entries(geometryConfigs);
        var geometryConfigsGrouped2 = [];
        geometryConfigsGrouped.forEach(function(d, i) {
            if (d.key === 'unstacked') geometryConfigsGrouped2 = geometryConfigsGrouped2.concat(d.values.map(function(d, i) {
                return [ d ];
            })); else geometryConfigsGrouped2.push(d.values);
        });
        geometryConfigsGrouped2.forEach(function(d, i) {
            var geometry;
            if (Array.isArray(d)) geometry = d[0].geometryConfig.geometry; else geometry = d.geometryConfig.geometry;
            var finalGeometryConfig = d.map(function(dB, iB) {
                return extendDeepAll(µ[geometry].defaultConfig(), dB);
            });
            //console.log(finalGeometryConfig);
            //debugger;
            µ[geometry]().config(finalGeometryConfig)();
        });
    }
    return geometryContainer
}

function svgMouserHoverDisplay(isOrdinal,geometryTooltip,ticks,data){
    svg.selectAll('.geometry-group .mark').on('mouseover.tooltip', function(d, i) {
        var el = d3.select(this);
        var color = this.style.fill;
        var newColor = 'black';
        var opacity = this.style.opacity || 1;
        var name = "N/A"
        el.attr({
            'data-opacity': opacity
        });
        if (color && color !== 'none') {
            el.attr({
                'data-fill': color
            });
            newColor = d3.hsl(color).darker().toString();
            el.style({
                fill: newColor,
                opacity: 1
            });
            var textData = {
                t: utility.round(d[0]),
                r: utility.round(d[1]),              
            };
            // Get the objects name attach it with to resulting object text
            for(var i = 0;i<dataWithGroupId.length;i++){
                // Remove spaces to get run comparison
                dataColour = color.replace(/\s+/g, '');
                if(dataColour == dataWithGroupId[i].color){
                    name = dataWithGroupId[i].name;
                }
            }   
            
            // Check if data name should be displayed
            var text
            if (isOrdinal) textData.t = ticks[d[0]];
            if (name == "N/A"){
                text = 't: ' + textData.t + ', r: ' + textData.r;
            }else{
                text = 't: ' + textData.t + ', r: ' + textData.r + ', N: ' + name;
            }

            var bbox = this.getBoundingClientRect();
            var svgBBox = svg.node().getBoundingClientRect();
            var pos = [ bbox.left + bbox.width / 2 - centeringOffset[0] - svgBBox.left, bbox.top + bbox.height / 2 - centeringOffset[1] - svgBBox.top ];

            geometryTooltip.config({color: newColor}).text(text);
            
            geometryTooltip.move(pos);
        } else {
            color = this.style.stroke || 'black';
            el.attr({
                'data-stroke': color
            });
            newColor = d3.hsl(color).darker().toString();
            el.style({
                stroke: newColor,
                opacity: 1
            });
        }
    }).on('mousemove.tooltip', function(d, i) {
        if (d3.event.which != 0) return false;
        if (d3.select(this).attr('data-fill')) geometryTooltip.show();
    }).on('mouseout.tooltip', function(d, i) {
        geometryTooltip.hide();
        var el = d3.select(this);
        var fillColor = el.attr('data-fill');
        if (fillColor) el.style({
            fill: fillColor,
            opacity: el.attr('data-opacity')
        }); else el.style({
            stroke: el.attr('data-stroke'),
            opacity: el.attr('data-opacity')
        });
    });
}

function outerRingValueDisplay(chartGroup,radius,radialTooltip,angularGuideCircle,radialScale,axisConfig,chartCenter,geometryTooltip,angularTooltip){
    chartGroup.on('mousemove.radial-guide', function(d, i) {
        var r = utility.getMousePos(backgroundCircle).radius;
        angularGuideCircle.attr({
            r: r
        }).style({
            opacity: .5
        });
        radialValue = radialScale.invert(utility.getMousePos(backgroundCircle).radius);
        var pos = utility.convertToCartesian(r, axisConfig.radialAxis.orientation);
        radialTooltip.text(utility.round(radialValue)).move([ pos[0] + chartCenter[0], pos[1] + chartCenter[1] ]);
    }).on('mouseout.radial-guide', function(d, i) {
        angularGuideCircle.style({
            opacity: 0
        });
        geometryTooltip.hide();
        angularTooltip.hide();
        radialTooltip.hide();
    });
    return chartGroup
}

function addSegementDividers(dataOriginal,axisConfig,liveConfig){
    var colorIndex = 0;
    dataOriginal.forEach(function(d, i) {
        if (!d.color) {
            d.color = axisConfig.defaultColorRange[colorIndex];
            colorIndex = (colorIndex + 1) % axisConfig.defaultColorRange.length;
        }
        if (!d.strokeColor) {
            d.strokeColor = d.geometry === 'LinePlot' ? d.color : d3.rgb(d.color).darker().toString();
        }
        liveConfig.data[i].color = d.color;
        liveConfig.data[i].strokeColor = d.strokeColor;
        liveConfig.data[i].strokeDash = d.strokeDash;
        liveConfig.data[i].strokeSize = d.strokeSize;
    });
    return dataOriginal
}

function isStackedCheck(data,axisConfig){
    var isStacked = false;
    var dataWithGroupId = data.map(function(d, i) {
        isStacked = isStacked || typeof d.groupId !== 'undefined';
        return d;
    });

    if (isStacked) {
        var grouped = d3.nest().key(function(d, i) {
            return typeof d.groupId != 'undefined' ? d.groupId : 'unstacked';
        }).entries(dataWithGroupId);
        var dataYStack = [];
        var stacked = grouped.map(function(d, i) {
            if (d.key === 'unstacked') return d.values; else {
                var prevArray = d.values[0].r.map(function(d, i) {
                    return 0;
                });
                d.values.forEach(function(d, i, a) {
                    d.yStack = [ prevArray ];
                    dataYStack.push(prevArray);
                    prevArray = utility.sumArrays(d.r, prevArray);
                });
                return d.values;
            }
        });
        data = d3.merge(stacked);
    }
    data.forEach(function(d, i) {
        d.t = Array.isArray(d.t[0]) ? d.t : [ d.t ];
        d.r = Array.isArray(d.r[0]) ? d.r : [ d.r ];
    });
    var radius = Math.min(axisConfig.width - axisConfig.margin.left - axisConfig.margin.right, axisConfig.height - axisConfig.margin.top - axisConfig.margin.bottom) / 2;
    radius = Math.max(10, radius);
    var chartCenter = [ axisConfig.margin.left + radius, axisConfig.margin.top + radius ];
    var extent;
    if (isStacked) {
        var highestStackedValue = d3.max(utility.sumArrays(utility.arrayLast(data).r[0], utility.arrayLast(dataYStack)));
        extent = [ 0, highestStackedValue ];
    } else extent = d3.extent(utility.flattenArray(data.map(function(d, i) {
        return d.r;
    })));
    return [isStacked,radius,chartCenter,dataWithGroupId,extent]
}



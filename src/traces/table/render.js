/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var Lib = require('../../lib');
var d3 = require('d3');
var Drawing = require('../../components/drawing');

function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

function dimensionExtent(dimension) {

    var lo = dimension.range ? dimension.range[0] : d3.min(dimension.values);
    var hi = dimension.range ? dimension.range[1] : d3.max(dimension.values);

    if(isNaN(lo) || !isFinite(lo)) {
        lo = 0;
    }

    if(isNaN(hi) || !isFinite(hi)) {
        hi = 0;
    }

    // avoid a degenerate (zero-width) domain
    if(lo === hi) {
        if(lo === void(0)) {
            lo = 0;
            hi = 1;
        } else if(lo === 0) {
            // no use to multiplying zero, so add/subtract in this case
            lo -= 1;
            hi += 1;
        } else {
            // this keeps the range in the order of magnitude of the data
            lo *= 0.9;
            hi *= 1.1;
        }
    }

    return [lo, hi];
}

function ordinalScaleSnap(scale, v) {
    var i, a, prevDiff, prevValue, diff;
    for(i = 0, a = scale.range(), prevDiff = Infinity, prevValue = a[0], diff = null; i < a.length; i++) {
        if((diff = Math.abs(a[i] - v)) > prevDiff) {
            return prevValue;
        }
        prevDiff = diff;
        prevValue = a[i];
    }
    return a[a.length - 1];
}

function domainScale(height, padding, dimension) {
    var extent = dimensionExtent(dimension);
    return dimension.tickvals ?
        d3.scale.ordinal()
            .domain(dimension.tickvals)
            .range(dimension.tickvals
                .map(function(d) {return (d - extent[0]) / (extent[1] - extent[0]);})
                .map(function(d) {return (height - padding + d * (padding - (height - padding)));})) :
        d3.scale.linear()
            .domain(extent)
            .range([height - padding, padding]);
}

function unitScale(height, padding) {return d3.scale.linear().range([height - padding, padding]);}
function domainToUnitScale(dimension) {return d3.scale.linear().domain(dimensionExtent(dimension));}

function ordinalScale(dimension) {
    var extent = dimensionExtent(dimension);
    return dimension.tickvals && d3.scale.ordinal()
            .domain(dimension.tickvals)
            .range(dimension.tickvals.map(function(d) {return (d - extent[0]) / (extent[1] - extent[0]);}));
}

function unitToColorScale(cscale) {

    var colorStops = cscale.map(function(d) {return d[0];});
    var colorStrings = cscale.map(function(d) {return d[1];});
    var colorTuples = colorStrings.map(function(c) {return d3.rgb(c);});
    var prop = function(n) {return function(o) {return o[n];};};

    // We can't use d3 color interpolation as we may have non-uniform color palette raster
    // (various color stop distances).
    var polylinearUnitScales = 'rgb'.split('').map(function(key) {
        return d3.scale.linear()
            .clamp(true)
            .domain(colorStops)
            .range(colorTuples.map(prop(key)));
    });

    return function(d) {
        return polylinearUnitScales.map(function(s) {
            return s(d);
        });
    };
}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function model(layout, d, i) {
    var cd0 = unwrap(d),
        trace = cd0.trace,
        lineColor = cd0.lineColor,
        cscale = cd0.cscale,
        line = trace.line,
        domain = trace.domain,
        dimensions = trace.dimensions,
        width = layout.width,
        labelFont = trace.labelfont;

    var lines = Lib.extendDeep({}, line, {
        color: lineColor.map(domainToUnitScale({values: lineColor, range: [line.cmin, line.cmax]})),
        blockLineCount: c.blockLineCount,
        canvasOverdrag: c.overdrag * c.canvasPixelRatio
    });

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: dimensions.filter(visible).length,
        dimensions: dimensions,
        tickDistance: c.tickDistance,
        unitToColor: unitToColorScale(cscale),
        lines: lines,
        labelFont: labelFont,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        canvasWidth: rowContentWidth * c.canvasPixelRatio + 2 * lines.canvasOverdrag,
        canvasHeight: rowHeight * c.canvasPixelRatio,
        width: rowContentWidth,
        height: rowHeight,
        canvasPixelRatio: c.canvasPixelRatio
    };
}

function viewModel(model) {

    var width = model.width;
    var height = model.height;
    var dimensions = model.dimensions;
    var canvasPixelRatio = model.canvasPixelRatio;

    var xScale = function(d) {return width * d / Math.max(1, model.colCount - 1);};

    var unitPad = c.verticalPadding / (height * canvasPixelRatio);
    var unitPadScale = (1 - 2 * unitPad);
    var paddedUnitScale = function(d) {return unitPad + unitPadScale * d;};

    var viewModel = {
        key: model.key,
        xScale: xScale,
        model: model
    };

    var uniqueKeys = {};

    viewModel.dimensions = dimensions.filter(visible).map(function(dimension, i) {
        var domainToUnit = domainToUnitScale(dimension);
        var foundKey = uniqueKeys[dimension.label];
        uniqueKeys[dimension.label] = (foundKey || 0) + 1;
        var key = dimension.label + (foundKey ? '__' + foundKey : '');
        return {
            key: key,
            label: dimension.label,
            valueFormat: dimension.valueformat,
            tickvals: dimension.tickvals,
            ticktext: dimension.ticktext,
            font: dimension.font,
            ordinal: !!dimension.tickvals,
            scatter: c.scatter || dimension.scatter,
            xIndex: i,
            crossfilterDimensionIndex: i,
            visibleIndex: dimension._index,
            height: height,
            values: dimension.values,
            paddedUnitValues: dimension.values.map(domainToUnit).map(paddedUnitScale),
            xScale: xScale,
            x: xScale(i),
            canvasX: xScale(i) * canvasPixelRatio,
            unitScale: unitScale(height, c.verticalPadding),
            domainScale: domainScale(height, c.verticalPadding, dimension),
            ordinalScale: ordinalScale(dimension),
            domainToUnitScale: domainToUnit,
            filter: [0, 1],
            parent: viewModel,
            model: model
        };
    });

    return viewModel;
}

function lineLayerModel(vm) {
    return c.layers.map(function(key) {
        return {
            key: key,
            context: key === 'contextLineLayer',
            pick: key === 'pickLineLayer',
            viewModel: vm,
            model: vm.model
        };
    });
}

module.exports = function(root, svg, styledData, layout, callbacks) {

    var domainBrushing = false;
    var linePickActive = true;

    var vm = styledData
        .filter(function(d) { return unwrap(d).trace.visible; })
        .map(model.bind(0, layout))
        .map(viewModel);

    svg.style('background', 'rgba(255, 255, 255, 0)');
    var tableControlOverlay = svg.selectAll('.table')
        .data(vm, keyFun);

    tableControlOverlay.exit().remove();

    tableControlOverlay.enter()
        .append('g')
        .classed('table', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'crispEdges')
        .style('pointer-events', 'none');

    tableControlOverlay
        .attr('width', function(d) {return d.model.width + d.model.pad.l + d.model.pad.r;})
        .attr('height', function(d) {return d.model.height + d.model.pad.t + d.model.pad.b;})
        .attr('transform', function(d) {
            return 'translate(' + d.model.translateX + ',' + d.model.translateY + ')';
        });

    var tableControlView = tableControlOverlay.selectAll('.tableControlView')
        .data(repeat, keyFun);

    tableControlView.enter()
        .append('g')
        .classed('tableControlView', true)
        .style('box-sizing', 'content-box');

    tableControlView
        .attr('transform', function(d) {return 'translate(' + d.model.pad.l + ',' + d.model.pad.t + ')';});

    var yColumn = tableControlView.selectAll('.yColumn')
        .data(function(vm) {return vm.dimensions;}, keyFun);

    function updatePanelLayouttable(yColumn, vm) {
        var panels = vm.panels || (vm.panels = []);
        var yColumns = yColumn.each(function(d) {return d;})[vm.key].map(function(e) {return e.__data__;});
        var panelCount = yColumns.length - 1;
        var rowCount = 1;
        for(var row = 0; row < rowCount; row++) {
            for(var p = 0; p < panelCount; p++) {
                var panel = panels[p + row * panelCount] || (panels[p + row * panelCount] = {});
                var dim1 = yColumns[p];
                var dim2 = yColumns[p + 1];
                panel.dim1 = dim1;
                panel.dim2 = dim2;
                panel.canvasX = dim1.canvasX;
                panel.panelSizeX = dim2.canvasX - dim1.canvasX;
                panel.panelSizeY = vm.model.canvasHeight / rowCount;
                panel.y = row * panel.panelSizeY;
                panel.canvasY = vm.model.canvasHeight - panel.y - panel.panelSizeY;
            }
        }
    }

    function updatePanelLayoutScatter(yColumn, vm) {
        var panels = vm.panels || (vm.panels = []);
        var yColumns = yColumn.each(function(d) {return d;})[vm.key].map(function(e) {return e.__data__;});
        var panelCount = yColumns.length - 1;
        var rowCount = panelCount;
        for(var row = 0; row < panelCount; row++) {
            for(var p = 0; p < panelCount; p++) {
                var panel = panels[p + row * panelCount] || (panels[p + row * panelCount] = {});
                var dim1 = yColumns[p];
                var dim2 = yColumns[p + 1];
                panel.dim1 = yColumns[row + 1];
                panel.dim2 = dim2;
                panel.canvasX = dim1.canvasX;
                panel.panelSizeX = dim2.canvasX - dim1.canvasX;
                panel.panelSizeY = vm.model.canvasHeight / rowCount;
                panel.y = row * panel.panelSizeY;
                panel.canvasY = vm.model.canvasHeight - panel.y - panel.panelSizeY;
            }
        }
    }

    function updatePanelLayout(yColumn, vm) {
        return (c.scatter ? updatePanelLayoutScatter : updatePanelLayouttable)(yColumn, vm);
    }

    yColumn.enter()
        .append('g')
        .classed('yColumn', true);

    tableControlView.each(function(vm) {
        updatePanelLayout(yColumn, vm);
    });

    yColumn
        .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});

    yColumn
        .call(d3.behavior.drag()
            .origin(function(d) {return d;})
            .on('drag', function(d) {
                var p = d.parent;
                linePickActive = false;
                if(domainBrushing) {
                    return;
                }
                d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag, d3.event.x));
                d.canvasX = d.x * d.model.canvasPixelRatio;
                yColumn
                    .sort(function(a, b) {return a.x - b.x;})
                    .each(function(dd, i) {
                        dd.xIndex = i;
                        dd.x = d === dd ? dd.x : dd.xScale(dd.xIndex);
                        dd.canvasX = dd.x * dd.model.canvasPixelRatio;
                    });

                updatePanelLayout(yColumn, p);

                yColumn.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .attr('transform', function(d) {return 'translate(' + d.xScale(d.xIndex) + ', 0)';});
                d3.select(this).attr('transform', 'translate(' + d.x + ', 0)');
                yColumn.each(function(dd, i, ii) {if(ii === d.parent.key) p.dimensions[i] = dd;});
            })
            .on('dragend', function(d) {
                var p = d.parent;
                if(domainBrushing) {
                    if(domainBrushing === 'ending') {
                        domainBrushing = false;
                    }
                    return;
                }
                d.x = d.xScale(d.xIndex);
                d.canvasX = d.x * d.model.canvasPixelRatio;
                updatePanelLayout(yColumn, p);
                d3.select(this)
                    .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                linePickActive = true;

                if(callbacks && callbacks.columnsMoved) {
                    callbacks.columnsMoved(p.key, p.dimensions.map(function(dd) {return dd.crossfilterDimensionIndex;}));
                }
            })
        );

    yColumn.exit()
        .remove();

    var columnOverlays = yColumn.selectAll('.columnOverlays')
        .data(repeat, keyFun);

    columnOverlays.enter()
        .append('g')
        .classed('columnOverlays', true);

    columnOverlays.selectAll('.column').remove();

    var column = columnOverlays.selectAll('.column')
        .data(repeat, keyFun);

    column.enter()
        .append('g')
        .classed('column', true);

    column
        .selectAll('.domain, .tick>line')
        .attr('fill', 'none')
        .attr('stroke', 'black')
        .attr('stroke-opacity', 0.25)
        .attr('stroke-width', '1px');

    column
        .selectAll('text')
        .style('text-shadow', '1px 1px 1px #fff, -1px -1px 1px #fff, 1px -1px 1px #fff, -1px 1px 1px #fff')
        .style('cursor', 'default')
        .style('user-select', 'none');

    var columnHeading = columnOverlays.selectAll('.columnHeading')
        .data(repeat, keyFun);

    columnHeading.enter()
        .append('g')
        .classed('columnHeading', true);

    var columnTitle = columnHeading.selectAll('.columnTitle')
        .data(repeat, keyFun);

    columnTitle.enter()
        .append('text')
        .classed('columnTitle', true)
        .attr('text-anchor', 'end')
        .style('cursor', 'ew-resize')
        .style('user-select', 'none')
        .style('pointer-events', 'auto');

    columnTitle
        .attr('transform', 'translate(0,' + -c.columnTitleOffset + ')')
        .text(function(d) {return d.label;})
        .each(function(d) {Drawing.font(columnTitle, d.model.labelFont);});

    var columnCells = columnOverlays.selectAll('.columnCells')
        .data(repeat, keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.each(function(d) {Drawing.font(d3.select(this), d.font);});

    var columnCell = columnCells.selectAll('.columnCell')
        .data(function(d) {return d.values.map(function(v, i) {return {key: i, dimension: d, model: d.model, value: v};});}, keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell
        .attr('transform', function(d, i) {return 'translate(' + 0 + ',' + i * 20 + ')';});

    var columnCellText = columnCell.selectAll('.columnCellText')
        .data(repeat, keyFun);

    columnCellText.enter()
        .append('text')
        .classed('columnCellText', true)
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'end');

    columnCellText
        .text(function(d) {
            const starSchema = d.dimension.ticktext && d.dimension.tickvals
            if(starSchema) {
                var lookup = {}
                for(var i = 0; i < d.dimension.ticktext.length; i++) {
                    lookup[d.dimension.tickvals[i]] = d.dimension.ticktext[i]
                }
            }
            return starSchema ? lookup[d.value] : d3.format(d.dimension.valueFormat)(d.value);
        });
};

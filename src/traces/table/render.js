/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var d3 = require('d3');
var Drawing = require('../../components/drawing');

function keyFun(d) {return d.key;}

function repeat(d) {return [d];}

function unitScale(height, padding) {return d3.scale.linear().range([height - padding, padding]);}

function unwrap(d) {
    return d[0]; // plotly data structure convention
}

function model(layout, d, i) {
    var cd0 = unwrap(d),
        trace = cd0.trace,
        domain = trace.domain,
        width = layout.width,
        labels = trace.labels,
        columnWidths = trace.columnwidth;

    var colCount = labels.length;

    var groupWidth = Math.floor(width * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(layout.height * (domain.y[1] - domain.y[0]));

    columnWidths = trace.header.values.map(function(d, i) {
        return Array.isArray(columnWidths) ?
            columnWidths[Math.min(i, columnWidths.length - 1)] :
            isFinite(columnWidths) && columnWidths !== null ? columnWidths : 1;
    });

    var totalColumnWidths = columnWidths.reduce(function(p, n) {return p + n;}, 0);
    columnWidths = columnWidths.map(function(d) {return d / totalColumnWidths * groupWidth;});

    var pad = layout.margin || {l: 80, r: 80, t: 100, b: 80};
    var rowContentWidth = groupWidth;
    var rowHeight = groupHeight;

    return {
        key: i,
        colCount: colCount,
        tickDistance: c.tickDistance,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        width: rowContentWidth,
        height: rowHeight,
        columnWidths: columnWidths,

        cells: {
            values: trace.cells.values,
            valueFormat: trace.cells.format,
            prefix: trace.cells.prefix,
            suffix: trace.cells.suffix,
            cellHeights: trace.cells.height,
            align: trace.cells.align,
            valign: trace.cells.valign,
            font: trace.cells.font,
            fillColor: trace.cells.fill.color,
            lineWidth: trace.cells.line.width,
            lineColor: trace.cells.line.color
        },

        headerCells: {
            values: trace.header.values.map(repeat),
            align: trace.header.align,
            valign: trace.header.valign,
            font: trace.header.font,
            cellHeights: trace.cells.height,
            fillColor: trace.header.fill.color,
            lineWidth: trace.header.line.width,
            lineColor: trace.header.line.color
        }
    };
}

function viewModel(model) {

    var height = model.height;

    var newXScale = function (d) {
        return d.parent.columns.reduce(function(prev, next) {return next.xIndex < d.xIndex ? prev + next.columnWidth : prev}, 0);
    }

    var viewModel = {
        key: model.key,
        model: model
    };

    var uniqueKeys = {};

    viewModel.columns = model.headerCells.values.map(function(label, i) {
        var foundKey = uniqueKeys[label];
        uniqueKeys[label] = (foundKey || 0) + 1;
        var key = label + (foundKey ? '__' + foundKey : '');
        return {
            key: key,
            label: label,
            xIndex: i,
            height: height,
            newXScale: newXScale,
            x: undefined, // initialized below
            unitScale: unitScale(height, c.verticalPadding),
            filter: [0, 1],
            parent: viewModel,
            model: model,
            rowPitch: model.cells.cellHeights,
            columnWidth: model.columnWidths[i]
        };
    });

    viewModel.columns.forEach(function(dim) {
        dim.x = newXScale(dim);
    });
    return viewModel;
}

function gridPick(spec, col, row) {
    if(Array.isArray(spec)) {
        const column = spec[Math.min(col, spec.length - 1)];
        if(Array.isArray(column)) {
            return column[Math.min(row, column.length - 1)];
        } else {
            return column;
        }
    } else {
        return spec;
    }
}

module.exports = function(root, svg, styledData, layout, callbacks) {

    var domainBrushing = false;
    var linePickActive = true;

    var vm = styledData
        .map(model.bind(0, layout))
        .map(viewModel);

    svg.style('background', 'rgba(255, 255, 255, 0)');
    var table = svg.selectAll('.table')
        .data(vm, keyFun);

    table.exit().remove();

    table.enter()
        .append('g')
        .classed('table', true)
        .attr('overflow', 'visible')
        .style('box-sizing', 'content-box')
        .style('position', 'absolute')
        .style('left', 0)
        .style('overflow', 'visible')
        .style('shape-rendering', 'crispEdges')
        .style('pointer-events', 'all'); // todo restore 'none'

    table
        .attr('width', function(d) {return d.model.width + d.model.pad.l + d.model.pad.r;})
        .attr('height', function(d) {return d.model.height + d.model.pad.t + d.model.pad.b;})
        .attr('transform', function(d) {
            return 'translate(' + d.model.translateX + ',' + d.model.translateY + ')';
        });

    var tableControlView = table.selectAll('.tableControlView')
        .data(repeat, keyFun);

    tableControlView.enter()
        .append('g')
        .classed('tableControlView', true)
        .style('box-sizing', 'content-box');

    tableControlView
        .attr('transform', function(d) {return 'translate(' + d.model.pad.l + ',' + d.model.pad.t + ')';});

    var yColumn = tableControlView.selectAll('.yColumn')
        .data(function(vm) {return vm.columns;}, keyFun);

    yColumn.enter()
        .append('g')
        .classed('yColumn', true);

    yColumn
        .attr('transform', function(d) {return 'translate(' + d.newXScale(d) + ', 0)';});

    yColumn
        .call(d3.behavior.drag()
            .origin(function(d) {return d;})
            .on('drag', function(d) {
                var p = d.parent;
                linePickActive = false;
                if(domainBrushing) {
                    return;
                }
                d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag - d.columnWidth, d3.event.x));
                yColumn
                    .sort(function(a, b) {return a.x + a.columnWidth / 2 - b.x - b.columnWidth / 2;})
                    .each(function(dd, i) {
                        dd.xIndex = i;
                        dd.x = d === dd ? dd.x : dd.newXScale(dd);
                    });

                yColumn.filter(function(dd) {return Math.abs(d.xIndex - dd.xIndex) !== 0;})
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', function(d) {return 'translate(' + d.newXScale(d) + ', 0)';});
                d3.select(this)
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', 'translate(' + d.x + ', -5)');
                yColumn.each(function(dd, i, ii) {if(ii === d.parent.key) p.columns[i] = dd;});
                this.parentNode.appendChild(this);
            })
            .on('dragend', function(d) {
                var p = d.parent;
                if(domainBrushing) {
                    if(domainBrushing === 'ending') {
                        domainBrushing = false;
                    }
                    return;
                }
                d.x = d.newXScale(d);
                d3.select(this)
                    .transition()
                    .ease(c.releaseTransitionEase, 1, .75)
                    .duration(c.releaseTransitionDuration)
                    .attr('transform', function(d) {return 'translate(' + d.x + ', 0)';});
                linePickActive = true;

                if(callbacks && callbacks.columnMoved) {
                    callbacks.columnMoved(p.key, p.columns.map(function(dd) {return dd.xIndex;}));
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

    var columnBlock = columnOverlays.selectAll('.columnBlock')
        .data(function(d) {
            var blockDataHeader = Object.assign(
                {},
                d,
                {
                    key: 'header',
                    yOffset: 0,
                    values: d.model.headerCells.values[d.xIndex],
                    dragHandle: true,
                    model: Object.assign(
                        {},
                        d.model,
                        {
                            cells: d.model.headerCells
                        }
                    )
                }
            );

            return [
                blockDataHeader,
                Object.assign(
                    {},
                    d,
                    {
                        key: 'cells',
                        yOffset: d.rowPitch,
                        dragHandle: false,
                        values: d.model.cells.values[d.xIndex],
                        model: d.model
                    }
                )
            ];
        }, keyFun);

    columnBlock.enter()
        .append('g')
        .classed('columnBlock', true);

    columnBlock
        .attr('transform', function(d) {return 'translate(0 ' + d.yOffset + ')';})
        .style('cursor', function(d) {return d.dragHandle ? 'ew-resize' : null;})
        //.style('user-select', 'none')
        //.style('pointer-events', 'auto');

    var columnCells = columnBlock.selectAll('.columnCells')
        .data(repeat, keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.exit()
        .remove();

    var columnCell = columnCells.selectAll('.columnCell')
        .data(function(d) {return d.values.map(function(v, i) {return {key: i, column: d, model: d.model, value: v};});}, keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell
        .attr('transform', function(d, i) {
            return 'translate(' + 0 + ',' + i * d.column.rowPitch + ')';
        })
        .each(function(d, i) {
            var spec = d.model.cells.font;
            var col = d.column.xIndex;
            var font = {
                size: gridPick(spec.size, col, i),
                color: gridPick(spec.color, col, i),
                family: gridPick(spec.family, col, i)
            };
            Drawing.font(d3.select(this), font);

            d.rowNumber = i;
            d.align = gridPick(d.model.cells.align, d.column.xIndex, i);
            d.valign = gridPick(d.model.cells.valign, d.column.xIndex, i);
            d.cellBorderWidth = gridPick(d.model.cells.lineWidth, d.column.xIndex, i)
            d.font = font;
        });

    var cellRect = columnCell.selectAll('.cellRect')
        .data(repeat, keyFun);

    cellRect.enter()
        .append('rect')
        .classed('cellRect', true);

    cellRect
        .attr('width', function(d) {return d.column.columnWidth - d.cellBorderWidth;})
        .attr('height', function(d) {return d.column.rowPitch - d.cellBorderWidth;})
        .attr('transform', function(d) {return 'translate(' + 0 + ' ' + (-(d.column.rowPitch - c.cellPad)) + ')'})
        .attr('stroke', function(d) {
            return gridPick(d.model.cells.lineColor, d.column.xIndex, d.rowNumber);
        })
        .attr('stroke-width', function(d) {return d.cellBorderWidth;})
        .attr('fill', function(d) {
            return gridPick(d.model.cells.fillColor, d.column.xIndex, d.rowNumber);
        });

    var cellLine = columnCell.selectAll('.cellLine')
        .data(repeat, keyFun);

    cellLine.enter()
        .append('path')
        .classed('cellLine', true);

    cellLine
        .attr('id', function(d) {return 'textpath' + d.column.xIndex;})
        .attr('d', function(d) {
            var x1 = 0;
            var x2 = d.column.columnWidth;
            var y = d.column.rowPitch;
            return d3.svg.line()([[x1, y], [x2, y]]);
        })
        .attr('transform', function(d) {return 'translate(' + 0 + ' ' + (-(d.column.rowPitch - c.cellPad)) + ')'});

    var cellText = columnCell.selectAll('.cellText')
        .data(repeat, keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true);

    cellText
        .attr('dy', function(d) {
            var rowPitch = d.column.rowPitch;
            var fontSize = d.font.size;
            return ({
                top: -rowPitch + fontSize,
                middle: -rowPitch / 2 + fontSize * 0.2 + c.cellPad / 2,
                bottom: -c.cellPad
            })[d.valign];
        })
        .each(function(d) {Drawing.font(d3.select(this), d.font);});

    var textPath = cellText.selectAll('.textPath')
        .data(repeat, keyFun);

    textPath.enter()
        .append('textPath')
        .classed('textPath', true);

    textPath
        .attr('xlink:href', function(d) {return '#textpath' + d.column.xIndex;})
        .attr('text-anchor', function(d) {
            return ({
                left: 'start',
                right: 'end',
                center: 'middle'
            })[d.align];
        })
        .attr('startOffset', function(d) {
            return ({
                left: c.cellPad,
                right: d.column.columnWidth - c.cellPad,
                center: '50%'
            })[d.align];
        })
        .text(function(d) {
            var dim = d.column.xIndex;
            var row = d.rowNumber;
            var prefix = gridPick(d.model.cells.prefix, dim, row) || '';
            var suffix = gridPick(d.model.cells.suffix, dim, row) || '';
            var valueFormat = gridPick(d.model.cells.valueFormat, dim, row);
            return prefix + (valueFormat ? d3.format(valueFormat)(d.value) : d.value) + suffix;
        });
};

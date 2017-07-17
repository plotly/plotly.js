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

    var rowCount = Math.ceil((groupHeight + c.uplift) / trace.cells.height);
    var panelHeight = rowCount * trace.cells.height;

    return {
        key: i,
        colCount: colCount,
        translateX: domain.x[0] * width,
        translateY: layout.height - domain.y[1] * layout.height,
        pad: pad,
        width: rowContentWidth,
        height: groupHeight,
        columnWidths: columnWidths,

        panelHeight: panelHeight,
        rowsPerPanel: rowCount,

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
            cellHeights: trace.header.height,
            fillColor: trace.header.fill.color,
            lineWidth: trace.header.line.width,
            lineColor: trace.header.line.color
        }
    };
}

function viewModel(model) {

    var height = model.height;

    var xScale = function (d) {
        return d.parent.columns.reduce(function(prev, next) {return next.xIndex < d.xIndex ? prev + next.columnWidth : prev}, 0);
    }

    var viewModel = {
        key: model.key,
        model: model,
        scrollY: 0 // this'll be mutated on vertical scroll, initially 0
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
            xScale: xScale,
            x: undefined, // initialized below
            parent: viewModel,
            model: model,
            columnWidth: model.columnWidths[i],
            viewModel: viewModel
        };
    });

    viewModel.columns.forEach(function(col) {
        col.x = xScale(col);
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
        .attr('transform', function(d) {return 'translate(' + d.model.pad.l + ',' + d.model.pad.t + ')';})
        .attr('clip-path', function(d) {return 'url(#scrollAreaBottomClip_' + d.key + ')';});

    var yColumn = tableControlView.selectAll('.yColumn')
        .data(function(vm) {return vm.columns;}, keyFun);

    yColumn.enter()
        .append('g')
        .classed('yColumn', true);

    yColumn
        .attr('transform', function(d) {return 'translate(' + d.xScale(d) + ', 0)';});

    function easeColumn(elem, d, y) {
        d3.select(elem)
            .transition()
            .ease(c.releaseTransitionEase, 1, .75)
            .duration(c.releaseTransitionDuration)
            .attr('transform', 'translate(' + d.x + ' ' + y + ')');
    }

    yColumn
        .attr('clip-path', function(d) {return 'url(#columnBoundaryClippath_' + d.xIndex + ')';})
        .call(d3.behavior.drag()
            .origin(function(d) {
                easeColumn(this, d, -c.uplift);
                this.parentNode.appendChild(this);
                return d;
            })
            .on('drag', function(d) {
                d.x = Math.max(-c.overdrag, Math.min(d.model.width + c.overdrag - d.columnWidth, d3.event.x));
                var newOrder = yColumn.data().sort(function(a, b) {return a.x + a.columnWidth / 2 - b.x - b.columnWidth / 2;});
                newOrder.forEach(function(dd, i) {
                    dd.xIndex = i;
                    dd.x = d === dd ? dd.x : dd.xScale(dd);
                })

                yColumn.filter(function(dd) {return d !== dd;})
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', function(d) {return 'translate(' + d.x + ' 0)';});
                d3.select(this)
                    .transition().duration(0) // this just cancels the easeColumn easing in .origin
                    .attr('transform', 'translate(' + d.x + ' -' + c.uplift + ' )');
            })
            .on('dragend', function(d) {
                var p = d.parent;
                d.x = d.xScale(d);
                easeColumn(this, d, 0);
                if(callbacks && callbacks.columnMoved) {
                    callbacks.columnMoved(p.key, p.columns.map(function(dd) {return dd.xIndex;}));
                }
            })
        );

    yColumn.exit()
        .remove();

    var columnBlock = yColumn.selectAll('.columnBlock')
        .data(function(d) {
            var scrollY = d.viewModel.scrollY;
            var rowFrom = Math.floor(scrollY / d.model.panelHeight) * d.model.rowsPerPanel;
            var blockDataHeader = Object.assign(
                {},
                d,
                {
                    key: 'header',
                    yOffset: 0,
                    anchor: 0,
                    values: d.model.headerCells.values[d.xIndex],
                    rowPitch: d.model.headerCells.cellHeights,
                    dragHandle: true,
                    rowBlockOffset: 0,
                    model: Object.assign(
                        {},
                        d.model,
                        {
                            cells: d.model.headerCells
                        }
                    )
                }
            );

            var result = [
                Object.assign(
                    {},
                    d,
                    {
                        key: 'cells1',
                        type: 'cells',
                        anchor: 0,
                        yOffset: d.model.cells.cellHeights,
                        dragHandle: false,
                        values: d.model.cells.values[d.xIndex],
                        rowPitch: d.model.cells.cellHeights,
                        rowBlockOffset: 0,
                        model: d.model
                    }
                ),
                Object.assign(
                    {},
                    d,
                    {
                        key: 'cells2',
                        anchor: d.model.panelHeight,
                        type: 'cells',
                        yOffset: d.model.cells.cellHeights,
                        dragHandle: false,
                        values: d.model.cells.values[d.xIndex],
                        rowPitch: d.model.cells.cellHeights,
                        rowBlockOffset: 1,
                        model: d.model
                    }
                ),
                blockDataHeader
            ];

            return result;
        }, keyFun);

    columnBlock.enter()
        .append('g')
        .classed('columnBlock', true)
        .style('user-select', 'none');

    var cellsColumnBlock = columnBlock.filter(function(d) {return d.type === 'cells';});

    columnBlock
        .style('cursor', function(d) {return d.dragHandle ? 'ew-resize' : 'ns-resize';})
        .attr('transform', function(d) {return 'translate(0 ' + (d.anchor + d.yOffset) + ')';});

    cellsColumnBlock
        .call(d3.behavior.drag()
            .origin(function(d) {
                d3.event.stopPropagation();
                return d;
            })
            .on('drag', function() {
                var gpd = this.parentElement.parentElement.parentElement.__data__; // fixme reach vm more appropriately
                gpd.scrollY -= d3.event.dy;
                cellsColumnBlock
                    .attr('transform', function(d) {
                        var bottom = (d.model.cells.values[0].length + 1) * d.model.cells.cellHeights - d.model.panelHeight + c.uplift;
                        gpd.scrollY = Math.min(bottom, Math.max(0, gpd.scrollY));
                        var blockY = gpd.scrollY;
                        var anchorChanged = false;

                        if(d.anchor - blockY + d.model.panelHeight < 0) {
                            d.anchor += 2 * d.model.panelHeight;
                           anchorChanged = true;
                        } else if(d.anchor - blockY > d.model.panelHeight) {
                            d.anchor -= 2 * d.model.panelHeight;
                            anchorChanged = true;
                        }

                        if(anchorChanged) {
                            window.setTimeout(function() {
                                // setTimeout might lag rendering but yields a smoother scroll
                                renderColumnBlocks(columnBlock.filter(function(dd) {return dd.key === d.key;}));
                            });
                        }

                        var yTranslate = d.anchor - blockY + d.yOffset;

                        return 'translate(0 ' + yTranslate + ')';

                    });
            })
            .on('dragend', function(d) {
            })
        );

    renderColumnBlocks(columnBlock);

    var scrollAreaClip = tableControlView.selectAll('.scrollAreaClip')
        .data(repeat, keyFun);

    scrollAreaClip.enter()
        .append(c.clipView ? 'g' : 'clipPath')
        .classed('scrollAreaClip', true);

    scrollAreaClip
        .attr('id', function(d) { return 'scrollAreaBottomClip_' + d.key;})

    var scrollAreaClipRect = scrollAreaClip.selectAll('.scrollAreaClipRect')
        .data(repeat, keyFun);

    scrollAreaClipRect.enter()
        .append('rect')
        .classed('scrollAreaClipRect', true);

    scrollAreaClipRect
        .attr('width', function(d) {return d.model.width + 2 * c.overdrag;})
        .attr('height', function(d) {return d.model.height + d.model.headerCells.cellHeights + c.uplift;})
        .attr('x', -c.overdrag)
        .attr('y', function(d) {return -(d.model.headerCells.cellHeights + c.uplift);})
        .attr('stroke', 'orange')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .style('pointer-events', 'stroke');

    var columnBoundary = yColumn.selectAll('.columnBoundary')
        .data(repeat, keyFun);

    columnBoundary.enter()
        .append('g')
        .classed('columnBoundary', true);

    var columnBoundaryClippath = yColumn.selectAll('.columnBoundaryClippath')
        .data(repeat, keyFun);

    // SVG spec doesn't mandate wrapping into a <defs> and doesn't seem to cause a speed difference
    columnBoundaryClippath.enter()
        .append(c.clipView ? 'g' : 'clipPath')
        .classed('columnBoundaryClippath', true);

    columnBoundaryClippath
        .attr('id', function(d) {return 'columnBoundaryClippath_' + d.xIndex;});

    var columnBoundaryRect = columnBoundaryClippath.selectAll('.columnBoundaryRect')
        .data(repeat, keyFun);

    columnBoundaryRect.enter()
        .append('rect')
        .classed('columnBoundaryRect', true);

    columnBoundaryRect
        .attr('y', function(d) {return -d.model.headerCells.cellHeights + 0*c.uplift;})
        .attr('width', function(d) {return d.columnWidth;})
        .attr('height', function(d) {return d.height + d.model.headerCells.cellHeights + c.uplift;})
        .attr('fill', 'none')
        .attr('stroke', 'magenta')
        .attr('stroke-width', 2)
        .style('pointer-events', 'stroke');
};

function renderColumnBlocks(columnBlock) {

    // this is performance critical code as scrolling calls it on every revolver switch

    var columnCells = columnBlock.selectAll('.columnCells')
        .data(repeat, keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.exit()
        .remove();

    var columnCell = columnCells.selectAll('.columnCell')
        .data(function(d) {
            var rowFrom = Math.round(d.anchor / d.model.cells.cellHeights);
            var rowTo = rowFrom + (rowFrom >= 0 ? d.model.rowsPerPanel : 0);

            return d.values.slice(rowFrom, rowTo).map(function(v, i) {return {key: i, column: d, model: d.model, value: v};});
        }, keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell.exit().remove();

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
        .attr('width', function(d) {return d.column.columnWidth;})
        .attr('height', function(d) {return d.column.rowPitch;})
        .attr('transform', function(d) {return 'translate(0 -' + d.column.rowPitch + ')'})
        .attr('stroke-width', function(d) {return d.cellBorderWidth;})
        .attr('stroke', function(d) {
            return gridPick(d.model.cells.lineColor, d.column.xIndex, d.rowNumber);
        })
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
        .attr('transform', function(d) {return 'translate(0 -' + d.column.rowPitch + ')'});

    var cellText = columnCell.selectAll('.cellText')
        .data(repeat, keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true);

    cellText
        .attr('dy', function(d) {
            var rowPitch = d.column.rowPitch;
            return ({
                top: -rowPitch + c.cellPad,
                middle: -rowPitch / 2,
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
        .attr('alignment-baseline', function(d) {
            return ({
                top: "hanging",
                middle: "central",
                bottom: "alphabetic"
            })[d.valign];
        })
        .text(function(d) {
            var col = d.column.xIndex;
            var row = d.rowNumber;
            var prefix = gridPick(d.model.cells.prefix, col, row) || '';
            var suffix = gridPick(d.model.cells.suffix, col, row) || '';
            var valueFormat = gridPick(d.model.cells.valueFormat, col, row);
            return prefix + (valueFormat ? d3.format(valueFormat)(d.value) : d.value) + suffix;
        });
}
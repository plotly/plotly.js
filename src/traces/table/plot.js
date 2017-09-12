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
var gup = require('../../lib/gup');
var Drawing = require('../../components/drawing');
var extendFlat = require('../../lib/extend').extendFlat;
var svgUtil = require('../../lib/svg_text_utils');
var raiseToTop = require('../../lib').raiseToTop;
var cancelEeaseColumn = require('../../lib').cancelTransition;

module.exports = function plot(gd, calcdata) {

    if(c.clipView) {
        gd._fullLayout._paper.attr('height', 2000);
    }

    var table = gd._fullLayout._paper.selectAll('.table')
        .data(calcdata.map(gup.unwrap), gup.keyFun);

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
        .attr('width', function(d) {return d.width + d.size.l + d.size.r;})
        .attr('height', function(d) {return d.height + d.size.t + d.size.b;})
        .attr('transform', function(d) {
            return 'translate(' + d.translateX + ',' + d.translateY + ')';
        });

    var tableControlView = table.selectAll('.tableControlView')
        .data(gup.repeat, gup.keyFun);

    tableControlView.enter()
        .append('g')
        .classed('tableControlView', true)
        .style('box-sizing', 'content-box');

    tableControlView
        .attr('transform', function(d) {return 'translate(' + d.size.l + ' ' + d.size.t + ')';})
        .attr('clip-path', function(d) {return 'url(#scrollAreaBottomClip_' + d.key + ')';});

    var yColumn = tableControlView.selectAll('.yColumn')
        .data(function(vm) {return vm.columns;}, gup.keyFun);

    yColumn.enter()
        .append('g')
        .classed('yColumn', true);

    yColumn
        .attr('transform', function(d) {return 'translate(' + d.x + ' 0)';});

    yColumn
        .attr('clip-path', function(d) {return 'url(#columnBoundaryClippath_' + d.specIndex + ')';})
        .call(d3.behavior.drag()
            .origin(function(d) {
                var movedColumn = d3.select(this);
                easeColumn(movedColumn, d, -c.uplift);
                raiseToTop(this);
                return d;
            })
            .on('drag', function(d) {
                var movedColumn = d3.select(this);
                var getter = function(dd) {return  (d === dd ? d3.event.x : dd.x) + dd.columnWidth / 2;}
                d.x = Math.max(-c.overdrag, Math.min(d.calcdata.width + c.overdrag - d.columnWidth, d3.event.x));
                var newOrder = yColumn.data().sort(function(a, b) {return getter(a) - getter(b);});
                newOrder.forEach(function(dd, i) {
                    dd.xIndex = i;
                    dd.x = d === dd ? dd.x : dd.xScale(dd);
                })

                yColumn.filter(function(dd) {return d !== dd;})
                    .transition()
                    .ease(c.transitionEase)
                    .duration(c.transitionDuration)
                    .attr('transform', function(d) {return 'translate(' + d.x + ' 0)';});
                movedColumn
                    .call(cancelEeaseColumn)
                    .attr('transform', 'translate(' + d.x + ' -' + c.uplift + ' )');
            })
            .on('dragend', function(d) {
                var movedColumn = d3.select(this);
                var p = d.calcdata;
                d.x = d.xScale(d);
                easeColumn(movedColumn, d, 0);
                columnMoved(gd, calcdata, p.key, p.columns.map(function(dd) {return dd.xIndex;}));
            })
        );

    yColumn.exit()
        .remove();

    var columnBlock = yColumn.selectAll('.columnBlock')
        .data(splitToPanels, gup.keyFun);

    columnBlock.enter()
        .append('g')
        .classed('columnBlock', true)
        .style('user-select', 'none');

    var cellsColumnBlock = columnBlock.filter(cellsBlock);

    columnBlock
        .style('cursor', function(d) {return d.dragHandle ? 'ew-resize' : 'ns-resize';})
        .call(columnBlockPositionY);

    cellsColumnBlock
        .call(d3.behavior.drag()
            .origin(function(d) {
                d3.event.stopPropagation();
                return d;
            })
            .on('drag', makeDragRow(cellsColumnBlock))
            .on('dragend', function(d) {
                // fixme emit plotly notification
            })
        );

    // initial rendering: header is rendered first, as it may may have async LaTeX (show header first)
    // but blocks are _entered_ the way they are due to painter's algo (header on top)
    renderColumnBlocks(gd, columnBlock.filter(headerBlock), columnBlock);
    renderColumnBlocks(gd, columnBlock.filter(cellsBlock), columnBlock);

    var scrollAreaClip = tableControlView.selectAll('.scrollAreaClip')
        .data(gup.repeat, gup.keyFun);

    scrollAreaClip.enter()
        .append(c.clipView ? 'g' : 'clipPath')
        .classed('scrollAreaClip', true);

    scrollAreaClip
        .attr('id', function(d) { return 'scrollAreaBottomClip_' + d.key;})

    var scrollAreaClipRect = scrollAreaClip.selectAll('.scrollAreaClipRect')
        .data(gup.repeat, gup.keyFun);

    scrollAreaClipRect.enter()
        .append('rect')
        .classed('scrollAreaClipRect', true)
        .attr('x', -c.overdrag)
        .attr('y', -c.uplift)
        .attr('stroke', 'orange')
        .attr('stroke-width', 2)
        .attr('fill', 'none')
        .style('pointer-events', 'stroke');

    scrollAreaClipRect
        .attr('width', function(d) {return d.width + 2 * c.overdrag;})
        .attr('height', function(d) {return d.height + c.uplift;});

    var columnBoundary = yColumn.selectAll('.columnBoundary')
        .data(gup.repeat, gup.keyFun);

    columnBoundary.enter()
        .append('g')
        .classed('columnBoundary', true);

    var columnBoundaryClippath = yColumn.selectAll('.columnBoundaryClippath')
        .data(gup.repeat, gup.keyFun);

    // SVG spec doesn't mandate wrapping into a <defs> and doesn't seem to cause a speed difference
    columnBoundaryClippath.enter()
        .append(c.clipView ? 'g' : 'clipPath')
        .classed('columnBoundaryClippath', true);

    columnBoundaryClippath
        .attr('id', function(d) {return 'columnBoundaryClippath_' + d.specIndex;});

    var columnBoundaryRect = columnBoundaryClippath.selectAll('.columnBoundaryRect')
        .data(gup.repeat, gup.keyFun);

    columnBoundaryRect.enter()
        .append('rect')
        .classed('columnBoundaryRect', true)
        .attr('fill', 'none')
        .attr('stroke', 'magenta')
        .attr('stroke-width', 2)
        .style('pointer-events', 'stroke');

    columnBoundaryRect
        .attr('width', function(d) {return d.columnWidth;})
        .attr('height', function(d) {return d.calcdata.height + c.uplift;});
};

function renderColumnBlocks(gd, columnBlock, allColumnBlock) {
    // this is performance critical code as scrolling calls it on every revolver switch
    // it appears sufficiently fast but there are plenty of low-hanging fruits for performance optimization

    var columnCells = columnBlock.selectAll('.columnCells')
        .data(gup.repeat, gup.keyFun);

    columnCells.enter()
        .append('g')
        .classed('columnCells', true);

    columnCells.exit()
        .remove();

    var columnCell = columnCells.selectAll('.columnCell')
        .data(splitToCells, gup.keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell.exit().remove();

    columnCell
        .each(function(d, i) {
            var spec = d.calcdata.cells.font;
            var col = d.column.specIndex;
            var font = {
                size: gridPick(spec.size, col, i),
                color: gridPick(spec.color, col, i),
                family: gridPick(spec.family, col, i)
            };
            Drawing.font(d3.select(this), font);

            d.rowNumber = d.key;
            d.align = gridPick(d.calcdata.cells.align, col, i);
            d.valign = gridPick(d.calcdata.cells.valign, col, i);
            d.cellBorderWidth = gridPick(d.calcdata.cells.line.width, col, i)
            d.font = font;
        });

    var cellRect = columnCell.selectAll('.cellRect')
        .data(gup.repeat, gup.keyFun);

    cellRect.enter()
        .append('rect')
        .classed('cellRect', true);

    cellRect
        .attr('width', function(d) {return d.column.columnWidth;})
        .attr('stroke-width', function(d) {return d.cellBorderWidth;})
        .attr('stroke', function(d) {
            return c.clipView ? ({header: 'blue', cells1: 'red', cells2: 'green'})[d.column.key] : gridPick(d.calcdata.cells.line.color, d.column.specIndex, d.rowNumber);
        })
        .attr('fill', function(d) {
            return gridPick(d.calcdata.cells.fill.color, d.column.specIndex, d.rowNumber);
        });

    var cellTextHolder = columnCell.selectAll('.cellTextHolder')
        .data(gup.repeat, gup.keyFun);

    cellTextHolder.enter()
        .append('g')
        .classed('cellTextHolder', true);

    var cellText = cellTextHolder.selectAll('.cellText')
        .data(gup.repeat, gup.keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true);

    cellText
        .text(function(d) {
            var col = d.column.specIndex;
            var row = d.rowNumber;
            var prefix = gridPick(d.calcdata.cells.prefix, col, row) || '';
            var suffix = gridPick(d.calcdata.cells.suffix, col, row) || '';
            var format = gridPick(d.calcdata.cells.format, col, row) || '';
            return prefix + (format ? d3.format(format)(d.value) : d.value) + suffix;
        })
        .each(function(d) {

            var element = this;
            var selection = d3.select(element);

            // finalize what's in the DOM
            Drawing.font(selection, d.font);
            renderHeightAndPosition(columnCell);
            svgUtil.convertToTspans(selection, gd, finalizeYPositionMaker(allColumnBlock, element, d));
        });
}

function columnMoved(gd, calcdata, i, indices) {
    var o = calcdata[i][0].gdColumnsOriginalOrder;
    calcdata[i][0].gdColumns.sort(function (a, b) {
        return indices[o.indexOf(a)] - indices[o.indexOf(b)];
    });

    calcdata[i][0].columnorder = indices;

    gd.emit('plotly_restyle');
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

function easeColumn(selection, d, y) {
    selection
        .transition()
        .ease(c.releaseTransitionEase, 1, .75)
        .duration(c.releaseTransitionDuration)
        .attr('transform', 'translate(' + d.x + ' ' + y + ')');
}

function cellsBlock(d) {return d.type === 'cells';}
function headerBlock(d) {return d.type === 'header';}


/**
 * The tricky parts
 */

function splitToPanels(d) {
    var headerPanel = extendFlat({}, d, {
        key: 'header',
        type: 'header',
        anchor: 0,
        page: 0,
        values: d.calcdata.headerCells.values[d.specIndex],
        rowBlocks: d.calcdata.headerRowBlocks,
        dragHandle: true,
        calcdata: extendFlat({}, d.calcdata, {cells: d.calcdata.headerCells})
    });
    var revolverPanel1 = extendFlat({}, d, {
        key: 'cells1',
        type: 'cells',
        anchor: 0, // will be mutated on scroll; points to current place
        page: 0,
        dragHandle: false,
        values: d.calcdata.cells.values[d.specIndex],
        rowBlocks: d.calcdata.rowBlocks
    });
    var revolverPanel2 = extendFlat({}, d, {
        key: 'cells2',
        anchor: d.calcdata.rowBlocks[1] ? -totalHeight(d.calcdata.rowBlocks[1]) : 0, // will be mutated on scroll; points to current place
        page: -1,
        type: 'cells',
        dragHandle: false,
        values: d.calcdata.cells.values[d.specIndex],
        rowBlocks: d.calcdata.rowBlocks
    });
    revolverPanel1.otherPanel = revolverPanel2;
    revolverPanel2.otherPanel = revolverPanel1;
    return [revolverPanel1, revolverPanel2, headerPanel]; // order due to SVG using painter's algo
}

function splitToCells(d) {
    var fromTo = rowFromTo(d);
    return d.values.slice(fromTo[0], fromTo[1]).map(function(v, i) {
        return {
            key: fromTo[0] + i,
            column: d,
            calcdata: d.calcdata,
            page: d.page,
            rowBlocks: d.rowBlocks,
            value: v
        };
    });
}

function totalHeight(rowBlock) {
    var total = 0;
    for(var i = 0; i < rowBlock.rows.length; i++) {
        total += rowBlock.rows[i].rowHeight;
    }
    return total;
}

function rowFromTo(d) {
    var rowBlock = d.rowBlocks[d.page];
    // fixme rowBlock truthiness check is due to ugly hack of placing 2nd panel as d.page = -1
    var rowFrom = rowBlock ? rowBlock.rows[0].rowIndex : 0;
    var rowTo = rowBlock ? rowFrom + rowBlock.rows.length : 0;
    return [rowFrom, rowTo];
}

function makeDragRow(cellsColumnBlock) {
    return function dragRow (d) {
        var calcdata = d.calcdata;
        var direction = d3.event.dy < 0 ? 'down' : d3.event.dy > 0 ? 'up' : null;
        if(!direction) return;
        calcdata.scrollY -= d3.event.dy;
        var anchorChanged = false;
        cellsColumnBlock
            .attr('transform', function (d) {
                var rowBlocks = d.rowBlocks;
                var currentBlock = rowBlocks[d.page];
                var blockAnchors = rowBlocks.map(function (v) {
                    return firstRowAnchor(rowBlocks, v);
                });
                var lastBlock = rowBlocks[rowBlocks.length - 1];
                var lastRow = lastBlock.rows[lastBlock.rows.length - 1];
                var headerHeight = d.rowBlocks[0].auxiliaryBlocks.reduce(function (p, n) {
                    return p + totalHeight(n)
                }, 0);
                var scrollHeight = d.calcdata.groupHeight - headerHeight;
                var bottom = firstRowAnchor(rowBlocks, lastBlock) + rowAnchor(lastBlock, lastRow) + lastRow.rowHeight - scrollHeight;
                var scrollY = calcdata.scrollY = Math.max(0, Math.min(bottom, calcdata.scrollY));
                if(d.page < 0 || direction === 'down' && scrollY - d.anchor > totalHeight(currentBlock)) {
                    if(d.page + 2 < blockAnchors.length) {
                        d.page += 2;
                        d.anchor = blockAnchors[d.page];
                        anchorChanged = d.key;
                    }
                } else if(direction === 'up' && d.anchor > scrollY + scrollHeight) {
                    if(d.page - 2 >= 0) {
                        d.page -= 2;
                        d.anchor = blockAnchors[d.page];
                        anchorChanged = d.key;
                    }
                }

                var yTranslate = d.anchor - scrollY;

                return 'translate(0 ' + yTranslate + ')';
            });
        if(anchorChanged) {
            window.clearTimeout(d.currentRepaint);
            d.currentRepaint = window.setTimeout(function () {
                // setTimeout might lag rendering but yields a smoother scroll, because fast scrolling makes
                // some repaints invisible ie. wasteful (DOM work blocks the main thread)
                renderColumnBlocks(gd, cellsColumnBlock.filter(function (d) {
                    return d.key === anchorChanged;
                }), cellsColumnBlock.filter(function (d) {
                    return d.key === anchorChanged;
                }));
            });
        }
    }
}

function finalizeYPositionMaker(columnBlock, element, d) {
    return function finalizeYPosition() {
        var cellTextHolder = d3.select(element.parentNode);
        var columnCells = d3.select(element.parentNode.parentNode.parentNode);
        var l = getBlock(d);
        var rowIndex = d.key - l.firstRowIndex;
        var box = element.parentNode.getBoundingClientRect();

        var renderedHeight = box.height;

        var requiredHeight = renderedHeight + 2 * c.cellPad;
        var finalHeight = Math.max(requiredHeight, l.rows[rowIndex].rowHeight);
        var increase = finalHeight - l.rows[rowIndex].rowHeight;

        if(increase) {
            // current row height increased
            l.rows[d.key - l.firstRowIndex].rowHeight = finalHeight;

            columnBlock
                .call(columnBlockPositionY) // translate all downstream revolver column panels (naturally, max. 1 of 2)
                .selectAll('.columnCell')
                .call(renderHeightAndPosition); //downshifting other cells
        }

        cellTextHolder
            .attr('transform', function () {
                var element = this;
                var box = element.parentNode.getBoundingClientRect();
                var rectBox = d3.select(element.parentNode).select('.cellRect').node().getBoundingClientRect();
                var yPosition = (rectBox.top - box.top + c.cellPad)
                return 'translate(' + c.cellPad + ' ' + yPosition + ')';
            });
    };
}

function renderHeightAndPosition(columnCell) {
    columnCell
        .call(setRowHeight)
        .call(translateY);
}

function setRowHeight(columnCell) {
    columnCell.select('.cellRect').attr('height', rowHeight);
}

function columnBlockPositionY(columnBlock) {
    columnBlock.attr('transform', function(d) {return 'translate(0 ' + d.anchor + ')';});
}

function translateY(columCell) {
    columCell
        .attr('transform', function(d) {
            var yOffset = rowOffset(d.rowBlocks, d, d.key) + d.rowBlocks[0].auxiliaryBlocks.reduce(function(p, n) {return p + totalHeight(n)}, 0);
            return 'translate(' + 0 + ' ' + yOffset + ')';
        });
}

function rowOffset(rowBlocks, d, i) {
    var l = getBlock(d);
    return rowAnchor(l, getRow(l, i)) + firstRowAnchor(rowBlocks, l) - d.column.anchor;
}

function rowAnchor(rowBlock, row) {
    var total = 0;
    for(var i = 0; i < rowBlock.rows.length; i++) {
        if(rowBlock.rows[i] === row) break;
        total += rowBlock.rows[i].rowHeight;
    }
    return total;
}

function firstRowAnchor(rowBlocks, l) {
    var total = 0;
    for(var i = 0; i < rowBlocks.length; i++) {
        if(rowBlocks[i] === l) break;
        total += totalHeight(rowBlocks[i]);
    }
    return total;
}

function rowHeight(d) {
    var l = getBlock(d);
    return getRow(l, d.key).rowHeight;
}

function getBlock(d) {return d.rowBlocks[d.page];}
function getRow(l, i) {return l.rows[i - l.firstRowIndex];}


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
        .attr('transform', function(d) {return 'translate(' + d.x + ' 0)';})
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

    columnBlock
        .style('cursor', function(d) {return d.dragHandle ? 'ew-resize' : 'ns-resize';});

    var cellsColumnBlock = columnBlock.filter(cellsBlock);

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
        .classed('scrollAreaClip', true)
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
            return c.clipView ?
                ({header: 'blue', cells1: 'red', cells2: 'green'})[d.column.key] :
                gridPick(d.calcdata.cells.line.color, d.column.specIndex, d.rowNumber);
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
        .call(renderCellText, allColumnBlock, columnCell);
}

function renderCellText(cellText, allColumnBlock, columnCell) {
    cellText
        .text(function(d) {
            var col = d.column.specIndex;
            var row = d.rowNumber;
            var userSuppliedContent = d.value;
            var latex = latexEh(userSuppliedContent);
            var prefix = latex ? '' : gridPick(d.calcdata.cells.prefix, col, row) || '';
            var suffix = latex ? '' : gridPick(d.calcdata.cells.suffix, col, row) || '';
            var format = latex ? null : gridPick(d.calcdata.cells.format, col, row) || null;
            var prefixSuffixedText = prefix + (format ? d3.format(format)(d.value) : d.value) + suffix;
            var fragments = prefixSuffixedText.split(c.wrapSplitCharacter);
            var textToRender = fragments.join('<br>') + "<br> ";
            d.latex = latex;
            d.wrappingNeeded = !latex;
            d.fragments = fragments.map(function(f) {return {fragment:f, width: null};})
            d.fragments.push({fragment: c.wrapSpacer, width: null})
            return textToRender;
        })
        .each(function(d) {

            var element = this;
            var selection = d3.select(element);

            // finalize what's in the DOM
            Drawing.font(selection, d.font);
            setCellHeightAndPositionY(columnCell);

            var renderCallback = d.wrappingNeeded ? wrapText : finalizeYPositionMaker;
            svgUtil.convertToTspans(selection, gd, renderCallback(allColumnBlock, element, d));
        });
}

function latexEh(content) {
    return typeof content === 'string' && content[0] === c.latexMark && content[content.length - 1] === c.latexMark;
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
 * Revolver panel and cell contents layouting
 */

function splitToPanels(d) {
    var headerPanel = extendFlat({}, d, {
        key: 'header',
        type: 'header',
        page: 0,
        currentRepaint: [null, null],
        dragHandle: true,
        values: d.calcdata.headerCells.values[d.specIndex],
        rowBlocks: d.calcdata.headerRowBlocks,
        calcdata: extendFlat({}, d.calcdata, {cells: d.calcdata.headerCells})
    });
    var revolverPanel1 = extendFlat({}, d, {
        key: 'cells1',
        type: 'cells',
        page: 0,
        currentRepaint: [null, null],
        dragHandle: false,
        values: d.calcdata.cells.values[d.specIndex],
        rowBlocks: d.calcdata.rowBlocks
    });
    var revolverPanel2 = extendFlat({}, d, {
        key: 'cells2',
        type: 'cells',
        page: 0,
        currentRepaint: [null, null],
        dragHandle: false,
        values: d.calcdata.cells.values[d.specIndex],
        rowBlocks: d.calcdata.rowBlocks
    });
    // order due to SVG using painter's algo:
    return [revolverPanel1, revolverPanel2, headerPanel];
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

function rowFromTo(d) {
    var rowBlock = d.rowBlocks[d.page];
    // fixme rowBlock truthiness check is due to ugly hack of placing 2nd panel as d.page = -1
    var rowFrom = rowBlock ? rowBlock.rows[0].rowIndex : 0;
    var rowTo = rowBlock ? rowFrom + rowBlock.rows.length : 0;
    return [rowFrom, rowTo];
}

function overlap(a, b) {
    return a[0] < b[1] && a[1] > b[0];
}

function makeDragRow(cellsColumnBlock) {
    var d = cellsColumnBlock[0][0].__data__;
    var blocks = d.rowBlocks;
    var calcdata = d.calcdata;
    var headerBlocks = d.rowBlocks[0].auxiliaryBlocks;

    var prevPages = [0, 0];

    return function dragRow (d) {
        var direction = d3.event.dy < 0 ? 'down' : d3.event.dy > 0 ? 'up' : null;
        if(!direction) return;
        calcdata.scrollY -= d3.event.dy;
        var bottom = firstRowAnchor(blocks, blocks.length);
        var headerHeight = headerBlocks.reduce(function (p, n) {return p + rowsHeight(n, Infinity)}, 0);
        var scrollHeight = d.calcdata.groupHeight - headerHeight;
        var scrollY = calcdata.scrollY = Math.max(0, Math.min(bottom - scrollHeight, calcdata.scrollY));

        var pages = [];
        for(var p = 0; p < blocks.length; p++) {
            var pTop = firstRowAnchor(blocks, p);
            var pBottom = pTop + rowsHeight(blocks[p], Infinity);
            if(overlap([scrollY, scrollY + scrollHeight], [pTop, pBottom])) {
                pages.push(p);
            }
        }
        if(pages.length === 1) {
            if(pages[0] === blocks.length - 1) {
                pages.unshift(pages[0] - 1);
            } else {
                pages.push(pages[0] + 1);
            }
        }

        // make phased out page jump by 2 while leaving stationary page intact
        if(pages[0] % 2) {
            pages.reverse();
        }

        cellsColumnBlock
            .attr('transform', function (d, i) {
                var dPage = pages[i];
                d.page = dPage;
                var yTranslate = firstRowAnchor(blocks, dPage) - scrollY;
                return 'translate(0 ' + yTranslate + ')';
            });

        // conditionally rerendering panel 0 and 1
        conditionalPanelRerender(cellsColumnBlock, pages, prevPages, d, 0);
        conditionalPanelRerender(cellsColumnBlock, pages, prevPages, d, 1);
    }
}

function conditionalPanelRerender(cellsColumnBlock, pages, prevPages, d, revolverIndex) {
    var shouldComponentUpdate = pages[revolverIndex] !== prevPages[revolverIndex];
    if(shouldComponentUpdate) {
        window.clearTimeout(d.currentRepaint[revolverIndex]);
        d.currentRepaint[revolverIndex] = window.setTimeout(function () {
            // setTimeout might lag rendering but yields a smoother scroll, because fast scrolling makes
            // some repaints invisible ie. wasteful (DOM work blocks the main thread)
            var toRerender = cellsColumnBlock.filter(function (d, i) {return i === revolverIndex && pages[i] !== prevPages[i];});
            renderColumnBlocks(gd, toRerender, toRerender);
            prevPages[revolverIndex] = pages[revolverIndex];
        });
    }
}

function wrapText(columnBlock, element, d) {
    var nextRenderCallback = finalizeYPositionMaker(columnBlock, element, d);
    return function finalizeYPosition() {
        var cellTextHolder = d3.select(element.parentNode);
        cellTextHolder
            .each(function(d) {
                var fragments = d.fragments;
                cellTextHolder.selectAll('tspan.line').each(function(dd, i) {
                    fragments[i].width = this.getComputedTextLength();
                });
                d.value = 'kjhdlk<br>jkelrjlk'
            });

        // the pre-wrapped text was rendered only for the text measurements
        cellTextHolder.selectAll('tspan.line').remove();

        // resupply text, now wrapped
        //renderCellText(cellTextHolder.select('.cellText'), allColumnBlock, columnCell);

        nextRenderCallback();
    };
}

function finalizeYPositionMaker(columnBlock, element, d) {
    return function finalizeYPosition() {
        var cellTextHolder = d3.select(element.parentNode);
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
                .selectAll('.columnCell')
                .call(setCellHeightAndPositionY);
        }

        cellTextHolder
            .attr('transform', function () {
                var element = this;
                var box = element.parentNode.getBoundingClientRect();
                var rectBox = d3.select(element.parentNode).select('.cellRect').node().getBoundingClientRect();
                var yPosition = (rectBox.top - box.top + c.cellPad);
                return 'translate(' + c.cellPad + ' ' + yPosition + ')';
            });
    };
}

function setCellHeightAndPositionY(columnCell) {
    columnCell
        .attr('transform', function(d) {
            var l = getBlock(d);
            var rowAnchor = rowsHeight(l, d.key);
            var rowOffset = firstRowAnchor(d.rowBlocks, l.key) + rowAnchor - firstRowAnchor(d.rowBlocks, d.page);
            var headerHeight = d.rowBlocks[0].auxiliaryBlocks.reduce(function(p, n) {return p + rowsHeight(n, Infinity)}, 0);
            var yOffset = rowOffset + headerHeight;
            return 'translate(0 ' + yOffset + ')';
        })
        .select('.cellRect')
        .attr('height', function(d) {return getRow(getBlock(d), d.key).rowHeight;});
}

function firstRowAnchor(rowBlocks, page) {
    var total = 0;
    for(var i = 0; i <= page - 1; i++) {
        total += rowsHeight(rowBlocks[i], Infinity);
    }
    return total;
}

function rowsHeight(rowBlock, key) {
    var total = 0;
    for(var i = 0; i < rowBlock.rows.length && rowBlock.rows[i].rowIndex < key; i++) {
        total += rowBlock.rows[i].rowHeight;
    }
    return total;
}

function getBlock(d) {return d.rowBlocks[d.page];}
function getRow(l, i) {return l.rows[i - l.firstRowIndex];}


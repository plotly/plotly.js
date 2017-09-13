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

module.exports = function plot(gd, calcdata) {

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
        .attr('transform', function(d) {return 'translate(' + d.size.l + ',' + d.size.t + ')';})
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
                easeColumn(this, d, -c.uplift);
                this.parentNode.appendChild(this);
                return d;
            })
            .on('drag', function(d) {
                d.x = Math.max(-c.overdrag, Math.min(d.calcdata.width + c.overdrag - d.columnWidth, d3.event.x));
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
                var p = d.calcdata;
                d.x = d.xScale(d);
                easeColumn(this, d, 0);
                columnMoved(gd, calcdata, p.key, p.columns.map(function(dd) {return dd.xIndex;}));
            })
        );

    yColumn.exit()
        .remove();

    var columnBlock = yColumn.selectAll('.columnBlock')
        .data(function(d) {
            var headerPanel = extendFlat({}, d, {
                key: 'header',
                type: 'header',
                yOffset: 0,
                anchor: 0,
                values: d.calcdata.headerCells.values[d.specIndex],
                anchorToRowBlock: d.calcdata.anchorToHeaderRowBlock,
                dragHandle: true,
                rowBlockOffset: 0,
                calcdata: extendFlat({}, d.calcdata, {cells: d.calcdata.headerCells})
            });
            var revolverPanel1 = extendFlat({}, d, {
                key: 'cells1',
                type: 'cells',
                anchor: 0, // will be mutated on scroll; points to current place
                yOffset: d.calcdata.headerHeight, // fixme
                dragHandle: false,
                values: d.calcdata.cells.values[d.specIndex],
                anchorToRowBlock: d.calcdata.anchorToRowBlock,
                rowBlockOffset: 0,
                calcdata: d.calcdata
            });
            var revolverPanel2 = extendFlat({}, d, {
                key: 'cells2',
                anchor: d.calcdata.anchorToRowBlock[revolverPanel1.anchor].totalHeight, // will be mutated on scroll; points to current place
                type: 'cells',
                yOffset: d.calcdata.headerHeight, // fixme
                dragHandle: false,
                values: d.calcdata.cells.values[d.specIndex],
                anchorToRowBlock: d.calcdata.anchorToRowBlock,
                rowBlockOffset: 1,
                calcdata: d.calcdata
            });
            revolverPanel1.otherPanel = revolverPanel2;
            revolverPanel2.otherPanel = revolverPanel1;
            return [revolverPanel1, revolverPanel2, headerPanel]; // order due to SVG using painter's algo
        }, gup.keyFun);

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
            .on('drag', function(d) {
                var calcdata = d.calcdata;
                var direction = d3.event.dy < 0 ? 'down' : d3.event.dy > 0 ? 'up' : null;
                if(!direction) return;
                calcdata.scrollY -= d3.event.dy;
                var anchorChanged = false;
                cellsColumnBlock
                    .attr('transform', function(d) {
                        var anchorToBlock = d.anchorToRowBlock;
                        var blockAnchorKeys = Object.keys(anchorToBlock);
                        var blockAnchors = blockAnchorKeys.map(function(v) {return parseInt(v);});
                        var lastAnchor = blockAnchors[blockAnchors.length - 1];
                        var lastBlock = anchorToBlock[lastAnchor];
                        var lastRow = lastBlock.rows[lastBlock.rows.length - 1];
                        var bottom = lastRow.rowAnchor + lastRow.rowHeight - d.calcdata.scrollHeight;
                        var scrollY = calcdata.scrollY = Math.max(0, Math.min(bottom, calcdata.scrollY));
                        if(direction === 'down' && scrollY - d.anchor > anchorToBlock[d.anchor].totalHeight) {
                            if(blockAnchors.indexOf(d.anchor) + 2 < blockAnchors.length) {
                                d.anchor = blockAnchors[blockAnchors.indexOf(d.anchor) + 2];
                                anchorChanged = true;
                            }
                        } else if(direction === 'up' &&  d.anchor  > scrollY + d.calcdata.scrollHeight) {
                            if(blockAnchors.indexOf(d.anchor) - 2 >= 0) {
                                d.anchor = blockAnchors[blockAnchors.indexOf(d.anchor) - 2];
                                anchorChanged = true;
                            }
                        }

                        var yTranslate = d.anchor - scrollY + d.yOffset;

                        return 'translate(0 ' + yTranslate + ')';

                    });
                if(anchorChanged) {
                    window.clearTimeout(d.currentRepaint);
                    d.currentRepaint = window.setTimeout(function() {
                        // setTimeout might lag rendering but yields a smoother scroll, because fast scrolling makes
                        // some repaints invisible ie. wasteful (DOM work blocks the main thread)
                        renderColumnBlocks(columnBlock);
                    });
                }
            })
            .on('dragend', function(d) {
            })
        );

    renderColumnBlocks(columnBlock); // initial render

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

function textPathUrl(d) {return 'textpath_' + d.column.key + '_' + d.column.specIndex + '_' + d.key;}

function rowFromTo(d) {
    var rowBlock = d.anchorToRowBlock[d.anchor];
    var rowFrom = rowBlock ? rowBlock.rows[0].rowIndex : 0;
    var rowTo = rowBlock ? rowFrom + rowBlock.rows.length : 0;
    return [rowFrom, rowTo];
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

function easeColumn(elem, d, y) {
    d3.select(elem)
        .transition()
        .ease(c.releaseTransitionEase, 1, .75)
        .duration(c.releaseTransitionDuration)
        .attr('transform', 'translate(' + d.x + ' ' + y + ')');
}

function rowHeight(d) {
    var lookup = d.anchorToRowBlock[d.column.anchor];
    return lookup.rows[d.key - lookup.firstRowIndex].rowHeight;
}

function renderColumnBlocks(columnBlock) {

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
        .data(function(d) {
            var fromTo = rowFromTo(d);
            return d.values.slice(fromTo[0], fromTo[1]).map(function(v, i) {return {key: fromTo[0] + i, column: d, calcdata: d.calcdata, anchorToRowBlock: d.anchorToRowBlock, value: v};});
        }, gup.keyFun);

    columnCell.enter()
        .append('g')
        .classed('columnCell', true);

    columnCell.exit().remove();

    columnCell
        .attr('transform', function(d, i) {
            var lookup = d.anchorToRowBlock[d.column.anchor].rows;
            return 'translate(' + 0 + ' ' + (lookup[i].rowAnchor - d.column.anchor) + ')';
        })
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
        .attr('height', rowHeight)
        .attr('stroke-width', function(d) {return d.cellBorderWidth;})
        .attr('stroke', function(d) {
            return gridPick(d.calcdata.cells.line.color, d.column.specIndex, d.rowNumber);
        })
        .attr('fill', function(d) {
            return gridPick(d.calcdata.cells.fill.color, d.column.specIndex, d.rowNumber);
        });

    var cellLine = columnCell.selectAll('.cellLine')
        .data(gup.repeat, gup.keyFun);

    cellLine.enter()
        .append('path')
        .classed('cellLine', true);

    cellLine
        .attr('id', textPathUrl)
        .attr('d', function(d, i) {
            var x1 = 0;
            var x2 = d.column.columnWidth;
            var y = rowHeight(d);

            return d3.svg.line()([[x1, y], [x2, y]]);
        });

    var cellText = columnCell.selectAll('.cellText')
        .data(gup.repeat, gup.keyFun);

    cellText.enter()
        .append('text')
        .classed('cellText', true);

    cellText
        .attr('dy', function(d, i) {
            var height = rowHeight(d);
            return ({
                top: -height + c.cellPad,
                middle: -height / 2,
                bottom: -c.cellPad
            })[d.valign];
        })
        .each(function(d) {Drawing.font(d3.select(this), d.font);});

    var textPath = cellText.selectAll('.textPath')
        .data(gup.repeat, gup.keyFun);

    textPath.enter()
        .append('textPath')
        .classed('textPath', true);

    textPath
        .attr('xlink:href', function(d) {return '#' + textPathUrl(d);})
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
            var col = d.column.specIndex;
            var row = d.rowNumber;
            var prefix = gridPick(d.calcdata.cells.prefix, col, row) || '';
            var suffix = gridPick(d.calcdata.cells.suffix, col, row) || '';
            var format = gridPick(d.calcdata.cells.format, col, row) || '';
            return prefix + (format ? d3.format(format)(d.value) : d.value) + suffix;
        });
};

/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var wrap = require('../../lib/gup').wrap;

module.exports = function calc(gd, trace) {

    var domain = trace.domain;
    var groupWidth = Math.floor(gd._fullLayout._size.w * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(gd._fullLayout._size.h * (domain.y[1] - domain.y[0]));

    var columnWidths = trace.header.values.map(function(d, i) {
        return Array.isArray(trace.columnwidth) ?
            trace.columnwidth[Math.min(i, trace.columnwidth.length - 1)] :
            isFinite(trace.columnwidth) && trace.columnwidth !== null ? trace.columnwidth : 1;
    });

    var totalColumnWidths = columnWidths.reduce(function(p, n) {return p + n;}, 0);
    columnWidths = columnWidths.map(function(d) {return d / totalColumnWidths * groupWidth;});

    var headerRows = trace.header.values[0].length;
    var headerHeight = headerRows * trace.header.height;
    var scrollHeight = groupHeight - headerHeight;
    var minimumFillHeight = scrollHeight + c.uplift;
    var rowHeights = trace.cells.values[0].map(function(_, i) {return trace.cells.height + Math.round((i < 2 ? 0 : 25) * (Math.random() - 0.5));});

    var rowAnchors = [];
    var acc = 0;
    for(var i = 0; i < rowHeights.length; i++) {
        rowAnchors.push(acc);
        acc += rowHeights[i];
    }

    var makeIdentity = function() {
        return {
            totalHeight: 0,
            firstRowIndex: null,
            lastRowIndex: null,
            rows: []
        };
    }

    var anchorToRowBlock = {};
    var currentRowHeight;
    var currentAnchor = 0;
    var currentBlockHeight = 0;
    var currentBlock = makeIdentity();
    var currentFirstRowIndex = 0;
    for(i = 0; i < rowHeights.length; i++) {
        currentRowHeight = rowHeights[i];
        currentBlock.rows.push({
            rowIndex: i,
            rowHeight: currentRowHeight,
            rowAnchor: currentAnchor + currentBlockHeight
        });
        currentBlockHeight += currentRowHeight;
        if(currentBlockHeight >= minimumFillHeight || i === rowHeights.length - 1) {
            anchorToRowBlock[currentAnchor] = currentBlock;
            currentBlock.totalHeight = currentBlockHeight;
            currentBlock.firstRowIndex = currentFirstRowIndex;
            currentBlock.lastRowIndex = i;
            currentBlock = makeIdentity();
            currentAnchor += currentBlockHeight;
            currentFirstRowIndex = i + 1;
            currentBlockHeight = 0;
        }
    }

    var uniqueKeys = {};

    var columnOrder = trace._fullInput.columnorder;

    var calcdata = {
        key: trace.index,
        translateX: domain.x[0] * gd._fullLayout._size.w,
        translateY: gd._fullLayout._size.h - domain.y[1] * gd._fullLayout._size.h,
        size: gd._fullLayout._size,
        width: groupWidth,
        height: groupHeight,
        columnWidths: columnWidths,
        columnOrder: columnOrder, // will be mutated on column move
        headerHeight: headerHeight,
        scrollHeight: scrollHeight,
        minimumFillHeight: minimumFillHeight,
        anchorToRowBlock: anchorToRowBlock,
        scrollY: 0, // will be mutated on scroll
        cells: trace.cells,
        headerCells: trace.header,
        rowHeights: rowHeights,
        rowAnchors: rowAnchors,
        columns: trace.header.values.map(function(label, i) {
            var foundKey = uniqueKeys[label];
            uniqueKeys[label] = (foundKey || 0) + 1;
            var key = label + '__' + uniqueKeys[label];
            return {
                key: key,
                label: label,
                specIndex: i,
                xIndex: columnOrder[i],
                xScale: xScale,
                x: undefined, // initialized below
                calcdata: undefined, // initialized below
                columnWidth: columnWidths[i]
            };
        }),

        // these two are being phased out in favor of the new `columnOrder` attribute
        gdColumns: trace.header.values.map(function(d) {return d[0];}),
        gdColumnsOriginalOrder: trace.header.values.map(function(d) {return d[0];})
    };

    calcdata.columns.forEach(function(col) {
        col.calcdata = calcdata;
        col.x = xScale(col);
    });

    return wrap(calcdata);
};

var xScale = function (d) {
    return d.calcdata.columns.reduce(function(prev, next) {return next.xIndex < d.xIndex ? prev + next.columnWidth : prev}, 0);
}

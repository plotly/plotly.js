/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var c = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;

// pure functions, don't alter but passes on `gd` and parts of `trace` without deep copying
module.exports = function calc(gd, trace) {
    var headerValues = trace.header.values.map(function(c) {
        return Array.isArray(c) ? c : [c];
    });
    var cellsValues = trace.cells.values;
    var domain = trace.domain;
    var groupWidth = Math.floor(gd._fullLayout._size.w * (domain.x[1] - domain.x[0]));
    var groupHeight = Math.floor(gd._fullLayout._size.h * (domain.y[1] - domain.y[0]));
    var headerRowHeights = headerValues.length ? headerValues[0].map(function() {return trace.header.height;}) : [];
    var rowHeights = cellsValues.length ? cellsValues[0].map(function() {return trace.cells.height;}) : [];
    var headerHeight = headerRowHeights.reduce(function(a, b) {return a + b;}, 0);
    var scrollHeight = groupHeight - headerHeight;
    var minimumFillHeight = scrollHeight + c.uplift;
    var anchorToRowBlock = makeAnchorToRowBlock(rowHeights, minimumFillHeight);
    var anchorToHeaderRowBlock = makeAnchorToRowBlock(headerRowHeights, headerHeight);
    var headerRowBlocks = makeRowBlock(anchorToHeaderRowBlock, []);
    var rowBlocks = makeRowBlock(anchorToRowBlock, headerRowBlocks);
    var uniqueKeys = {};
    var columnOrder = trace._fullInput.columnorder;
    var columnWidths = headerValues.map(function(d, i) {
        return Array.isArray(trace.columnwidth) ?
            trace.columnwidth[Math.min(i, trace.columnwidth.length - 1)] :
            isFinite(trace.columnwidth) && trace.columnwidth !== null ? trace.columnwidth : 1;
    });
    var totalColumnWidths = columnWidths.reduce(function(p, n) {return p + n;}, 0);

    // fit columns in the available vertical space as there's no vertical scrolling now
    columnWidths = columnWidths.map(function(d) {return d / totalColumnWidths * groupWidth;});

    var calcdata = {
        key: trace.index,
        translateX: domain.x[0] * gd._fullLayout._size.w,
        translateY: gd._fullLayout._size.h * (1 - domain.y[1]),
        size: gd._fullLayout._size,
        width: groupWidth,
        height: groupHeight,
        columnOrder: columnOrder, // will be mutated on column move, todo use in callback
        groupHeight: groupHeight,
        rowBlocks: rowBlocks,
        headerRowBlocks: headerRowBlocks,
        scrollY: 0, // will be mutated on scroll
        cells: trace.cells,
        headerCells: extendFlat({}, trace.header, {values: headerValues}),
        gdColumns: headerValues.map(function(d) {return d[0];}),
        gdColumnsOriginalOrder: headerValues.map(function(d) {return d[0];}),
        prevPages: [0, 0],
        scrollbarState: {scrollbarScrollInProgress: false},
        columns: headerValues.map(function(label, i) {
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
        })
    };

    calcdata.columns.forEach(function(col) {
        col.calcdata = calcdata;
        col.x = xScale(col);
    });

    return calcdata;
};

function xScale(d) {
    return d.calcdata.columns.reduce(function(prev, next) {
        return next.xIndex < d.xIndex ? prev + next.columnWidth : prev;
    }, 0);
}

function makeRowBlock(anchorToRowBlock, auxiliary) {
    var blockAnchorKeys = Object.keys(anchorToRowBlock);
    return blockAnchorKeys.map(function(k) {return extendFlat({}, anchorToRowBlock[k], {auxiliaryBlocks: auxiliary});});
}

function makeAnchorToRowBlock(rowHeights, minimumFillHeight) {

    var anchorToRowBlock = {};
    var currentRowHeight;
    var currentAnchor = 0;
    var currentBlockHeight = 0;
    var currentBlock = makeIdentity();
    var currentFirstRowIndex = 0;
    var blockCounter = 0;
    for(var i = 0; i < rowHeights.length; i++) {
        currentRowHeight = rowHeights[i];
        currentBlock.rows.push({
            rowIndex: i,
            rowHeight: currentRowHeight
        });
        currentBlockHeight += currentRowHeight;
        if(currentBlockHeight >= minimumFillHeight || i === rowHeights.length - 1) {
            anchorToRowBlock[currentAnchor] = currentBlock;
            currentBlock.key = blockCounter++;
            currentBlock.firstRowIndex = currentFirstRowIndex;
            currentBlock.lastRowIndex = i;
            currentBlock = makeIdentity();
            currentAnchor += currentBlockHeight;
            currentFirstRowIndex = i + 1;
            currentBlockHeight = 0;
        }
    }

    return anchorToRowBlock;
}

function makeIdentity() {
    return {
        firstRowIndex: null,
        lastRowIndex: null,
        rows: []
    };
}

/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var table = require('./render');

module.exports = function plot(gd, cdTable) {

    var fullLayout = gd._fullLayout;
    var svg = fullLayout._paper;
    var root = fullLayout._paperdiv;

    var gdColumns = {};
    var gdColumnsOriginalOrder = {};

    var size = fullLayout._size;

    cdTable.forEach(function(d, i) {
        gdColumns[i] = gd.data[i].header.values.map(function(d) {return d[0];});
        gdColumnsOriginalOrder[i] = gdColumns[i].slice();
    });

    var hover = function(eventData) {
        gd.emit('plotly_hover', eventData);
    };

    var unhover = function(eventData) {
        gd.emit('plotly_unhover', eventData);
    };

    var columnMoved = function(i, indices) {

        function newIdx(indices, orig, dim) {
            var origIndex = orig.indexOf(dim);
            var currentIndex = indices.indexOf(origIndex);
            if(currentIndex === -1) {
                currentIndex += orig.length;
            }
            return currentIndex;
        }

        function sorter(orig) {
            return function sorter(d1, d2) {
                var i1 = newIdx(indices, orig, d1);
                var i2 = newIdx(indices, orig, d2);
                return i1 - i2;
            };
        }

        // drag&drop sorting of the columns
        var orig = sorter(gdColumnsOriginalOrder[i].slice());
        gdColumns[i].sort(orig);

        gd.emit('plotly_restyle');
    };

    table(
        root,
        svg,
        cdTable,
        {
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        {
            hover: hover,
            unhover: unhover,
            columnMoved: columnMoved
        });
};

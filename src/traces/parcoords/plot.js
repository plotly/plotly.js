/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var parcoords = require('./parcoords');
var createRegl = require('regl');

module.exports = function plot(gd, cdparcoords) {
    var fullLayout = gd._fullLayout;
    var svg = fullLayout._toppaper;
    var root = fullLayout._paperdiv;
    var container = fullLayout._glcontainer;

    // make sure proper regl instances are created
    fullLayout._glcanvas.each(function(d) {
        if(d.regl) return;
        d.regl = createRegl({
            canvas: this,
            attributes: {
                antialias: !d.pick,
                preserveDrawingBuffer: true
            },
            pixelRatio: gd._context.plotGlPixelRatio || global.devicePixelRatio
        });
    });

    var gdDimensions = {};
    var gdDimensionsOriginalOrder = {};

    var size = fullLayout._size;

    cdparcoords.forEach(function(d, i) {
        gdDimensions[i] = gd.data[i].dimensions;
        gdDimensionsOriginalOrder[i] = gd.data[i].dimensions.slice();
    });

    var filterChanged = function(i, originalDimensionIndex, newRanges) {

        // Have updated `constraintrange` data on `gd.data` and raise `Plotly.restyle` event
        // without having to incur heavy UI blocking due to an actual `Plotly.restyle` call

        var gdDimension = gdDimensionsOriginalOrder[i][originalDimensionIndex];
        var newConstraints = newRanges.map(function(r) { return r.slice(); });
        if(!newConstraints.length) {
            delete gdDimension.constraintrange;
            newConstraints = null;
        }
        else {
            if(newConstraints.length === 1) newConstraints = newConstraints[0];
            gdDimension.constraintrange = newConstraints;
            // wrap in another array for restyle event data
            newConstraints = [newConstraints];
        }

        var restyleData = {};
        var aStr = 'dimensions[' + originalDimensionIndex + '].constraintrange';
        restyleData[aStr] = newConstraints;
        gd.emit('plotly_restyle', [restyleData, [i]]);
    };

    var hover = function(eventData) {
        gd.emit('plotly_hover', eventData);
    };

    var unhover = function(eventData) {
        gd.emit('plotly_unhover', eventData);
    };

    var axesMoved = function(i, visibleIndices) {

        // Have updated order data on `gd.data` and raise `Plotly.restyle` event
        // without having to incur heavy UI blocking due to an actual `Plotly.restyle` call

        function visible(dimension) {return !('visible' in dimension) || dimension.visible;}

        function newIdx(visibleIndices, orig, dim) {
            var origIndex = orig.indexOf(dim);
            var currentIndex = visibleIndices.indexOf(origIndex);
            if(currentIndex === -1) {
                // invisible dimensions initially go to the end
                currentIndex += orig.length;
            }
            return currentIndex;
        }

        function sorter(orig) {
            return function sorter(d1, d2) {
                var i1 = newIdx(visibleIndices, orig, d1);
                var i2 = newIdx(visibleIndices, orig, d2);
                return i1 - i2;
            };
        }

        // drag&drop sorting of the visible dimensions
        var orig = sorter(gdDimensionsOriginalOrder[i].filter(visible));
        gdDimensions[i].sort(orig);

        // invisible dimensions are not interpreted in the context of drag&drop sorting as an invisible dimension
        // cannot be dragged; they're interspersed into their original positions by this subsequent merging step
        gdDimensionsOriginalOrder[i].filter(function(d) {return !visible(d);})
             .sort(function(d) {
                 // subsequent splicing to be done left to right, otherwise indices may be incorrect
                 return gdDimensionsOriginalOrder[i].indexOf(d);
             })
            .forEach(function(d) {
                gdDimensions[i].splice(gdDimensions[i].indexOf(d), 1); // remove from the end
                gdDimensions[i].splice(gdDimensionsOriginalOrder[i].indexOf(d), 0, d); // insert at original index
            });

        gd.emit('plotly_restyle');
    };

    parcoords(
        root,
        svg,
        container,
        cdparcoords,
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
            filterChanged: filterChanged,
            hover: hover,
            unhover: unhover,
            axesMoved: axesMoved
        });
};

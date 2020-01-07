/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var parcoords = require('./parcoords');
var prepareRegl = require('../../lib/prepare_regl');
var isVisible = require('./helpers').isVisible;

function newIndex(visibleIndices, orig, dim) {
    var origIndex = orig.indexOf(dim);
    var currentIndex = visibleIndices.indexOf(origIndex);
    if(currentIndex === -1) {
        // invisible dimensions initially go to the end
        currentIndex += orig.length;
    }
    return currentIndex;
}

function sorter(visibleIndices, orig) {
    return function sorter(d1, d2) {
        return (
            newIndex(visibleIndices, orig, d1) -
            newIndex(visibleIndices, orig, d2)
        );
    };
}

module.exports = function plot(gd, cdModule) {
    var fullLayout = gd._fullLayout;

    var success = prepareRegl(gd);
    if(!success) return;

    var currentDims = {};
    var initialDims = {};
    var fullIndices = {};
    var inputIndices = {};

    var size = fullLayout._size;

    cdModule.forEach(function(d, i) {
        var trace = d[0].trace;
        fullIndices[i] = trace.index;
        var iIn = inputIndices[i] = trace._fullInput.index;
        currentDims[i] = gd.data[iIn].dimensions;
        initialDims[i] = gd.data[iIn].dimensions.slice();
    });

    var filterChanged = function(i, initialDimIndex, newRanges) {
        // Have updated `constraintrange` data on `gd.data` and raise `Plotly.restyle` event
        // without having to incur heavy UI blocking due to an actual `Plotly.restyle` call

        var dim = initialDims[i][initialDimIndex];
        var newConstraints = newRanges.map(function(r) { return r.slice(); });

        // Store constraint range in preGUI
        // This one doesn't work if it's stored in pieces in _storeDirectGUIEdit
        // because it's an array of variable dimensionality. So store the whole
        // thing at once manually.
        var aStr = 'dimensions[' + initialDimIndex + '].constraintrange';
        var preGUI = fullLayout._tracePreGUI[gd._fullData[fullIndices[i]]._fullInput.uid];
        if(preGUI[aStr] === undefined) {
            var initialVal = dim.constraintrange;
            preGUI[aStr] = initialVal || null;
        }

        var fullDimension = gd._fullData[fullIndices[i]].dimensions[initialDimIndex];

        if(!newConstraints.length) {
            delete dim.constraintrange;
            delete fullDimension.constraintrange;
            newConstraints = null;
        } else {
            if(newConstraints.length === 1) newConstraints = newConstraints[0];
            dim.constraintrange = newConstraints;
            fullDimension.constraintrange = newConstraints.slice();
            // wrap in another array for restyle event data
            newConstraints = [newConstraints];
        }

        var restyleData = {};
        restyleData[aStr] = newConstraints;
        gd.emit('plotly_restyle', [restyleData, [inputIndices[i]]]);
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

        // drag&drop sorting of the visible dimensions
        var orig = sorter(visibleIndices, initialDims[i].filter(isVisible));
        currentDims[i].sort(orig);

        // invisible dimensions are not interpreted in the context of drag&drop sorting as an invisible dimension
        // cannot be dragged; they're interspersed into their original positions by this subsequent merging step
        initialDims[i].filter(function(d) {return !isVisible(d);})
             .sort(function(d) {
                 // subsequent splicing to be done left to right, otherwise indices may be incorrect
                 return initialDims[i].indexOf(d);
             })
            .forEach(function(d) {
                currentDims[i].splice(currentDims[i].indexOf(d), 1); // remove from the end
                currentDims[i].splice(initialDims[i].indexOf(d), 0, d); // insert at original index
            });

        // TODO: we can't really store this part of the interaction state
        // directly as below, since it incudes data arrays. If we want to
        // persist column order we may have to do something special for this
        // case to just store the order itself.
        // Registry.call('_storeDirectGUIEdit',
        //     gd.data[inputIndices[i]],
        //     fullLayout._tracePreGUI[gd._fullData[fullIndices[i]]._fullInput.uid],
        //     {dimensions: currentDims[i]}
        // );

        gd.emit('plotly_restyle', [{dimensions: [currentDims[i]]}, [inputIndices[i]]]);
    };

    parcoords(
        gd,
        cdModule,
        { // layout
            width: size.w,
            height: size.h,
            margin: {
                t: size.t,
                r: size.r,
                b: size.b,
                l: size.l
            }
        },
        { // callbacks
            filterChanged: filterChanged,
            hover: hover,
            unhover: unhover,
            axesMoved: axesMoved
        }
    );
};
